-- Migration: port the Firebase captain-rank engine (promotion + rank stripping) to Supabase.
--
-- Firebase sources being mirrored 1:1:
--   functions/src/core/constants.ts     -> RANKING_RULES thresholds
--   functions/src/core/utils.ts         -> calculateSovereignRank()
--   functions/src/handlers/ratings.ts   -> submitTripFeedback() rating aggregation + generateWeeklyReport()
--   functions/src/handlers/drivers.ts   -> enforceEmergencyDescent() (3 penalties -> Bronze + 72h lock)
--
-- Firestore is schemaless, so several fields the Firebase logic reads had no Postgres
-- home at all (heartCount, penaltyCount, rankPenaltyExpiresAt, auditLog). They are added
-- here. Every place this file intentionally departs from the Firebase original is tagged
-- [DEVIATION] with the reason.


-- ---------------------------------------------------------------------------
-- 1. Fields the Firebase rank logic reads but Postgres never had
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS heart_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_penalty_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_report_date timestamptz,
  ADD COLUMN IF NOT EXISTS rank_audit_log text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.profiles.heart_count IS 'Sovereign hearts (Firebase users.heartCount). Gate for GOLD (>=20) and PLATINUM (>=50).';
COMMENT ON COLUMN public.profiles.penalty_count IS 'Violation counter (Firebase users.penaltyCount). Reaching 3 triggers the emergency descent.';
COMMENT ON COLUMN public.profiles.rank_penalty_expires_at IS 'Promotion lock after a descent (Firebase users.rankPenaltyExpiresAt). 72h disciplinary purge.';
COMMENT ON COLUMN public.profiles.tier IS 'Engine-owned captain rank. Written only by the rank engine; direct client writes are discarded.';

-- Firebase carried the heart on submitTripFeedback({ giveHeart }). In Supabase the heart
-- ("save as favorite") was only ever written to Dexie/localStorage, so it needs a column.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS gave_heart boolean NOT NULL DEFAULT false;

-- Firebase blocked double-rating with trips.isRatedByRider ('FEEDBACK_001'). Postgres
-- equivalent, so a replayed insert cannot inflate rating_count / heart_count.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_trip_pair
  ON public.reviews (trip_id, reviewer_id, reviewee_id);


-- ---------------------------------------------------------------------------
-- 2. calculateSovereignRank() -- functions/src/core/utils.ts, thresholds verbatim
--    from SOVEREIGN_CONSTANTS.RANKING_RULES.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_sovereign_rank(
  p_average_rating numeric,
  p_heart_count integer
) RETURNS public.captain_tier
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT CASE
    WHEN coalesce(p_average_rating, 0) >= 4.8 AND coalesce(p_heart_count, 0) >= 50 THEN 'PLATINUM'
    WHEN coalesce(p_average_rating, 0) >= 4.5 AND coalesce(p_heart_count, 0) >= 20 THEN 'GOLD'
    WHEN coalesce(p_average_rating, 0) >= 4.0 THEN 'SILVER'
    ELSE 'BRONZE'
  END::public.captain_tier;
$fn$;


-- ---------------------------------------------------------------------------
-- 3. [DEVIATION] Firebase received an explicit numeric driverRating (1..5) in the
--    submitTripFeedback payload. Supabase stores reviews.detailed_stars as a jsonb
--    object of 0/1 criteria, so the numeric rating has to be derived: the share of
--    satisfied criteria, rescaled to 0..5. With the current 5-criteria modal this is
--    simply "number of ticked boxes".
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sovereign_stars_to_rating(p_stars jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  v_total integer := 0;
  v_earned numeric := 0;
  v_value jsonb;
BEGIN
  IF p_stars IS NULL OR jsonb_typeof(p_stars) <> 'object' THEN
    RETURN NULL;
  END IF;

  FOR v_value IN SELECT value FROM jsonb_each(p_stars) LOOP
    v_total := v_total + 1;

    IF jsonb_typeof(v_value) = 'number' THEN
      v_earned := v_earned + least(1, greatest(0, (v_value #>> '{}')::numeric));
    ELSIF jsonb_typeof(v_value) = 'boolean' AND (v_value #>> '{}')::boolean THEN
      v_earned := v_earned + 1;
    END IF;
  END LOOP;

  IF v_total = 0 THEN
    RETURN NULL;
  END IF;

  RETURN round(5.0 * v_earned / v_total, 2);
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 4. The rank engine itself: promotion + enforceEmergencyDescent, as one
--    BEFORE UPDATE trigger so it can never recurse into itself.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_captain_rank()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_engine boolean := coalesce(current_setting('radar.rank_engine', true), '') = 'on';
BEGIN
  IF upper(coalesce(NEW.role::text, '')) NOT IN ('CAPTAIN', 'DRIVER') THEN
    RETURN NEW;
  END IF;

  -- [DEVIATION] Firestore security rules kept the whole rank input set out of client
  -- reach. public.profiles currently has RLS disabled, so anyone holding the anon key
  -- could write tier = PLATINUM — or, just as effective, rating = 5 and heart_count = 100
  -- and let the engine promote them — and collect the 20% fare premium. Every column the
  -- rank decision reads or writes is therefore engine-owned: a write that did not come
  -- from the engine is rolled back to its stored value here rather than rejected, so
  -- unrelated profile saves (name, phone, vehicle) keep working untouched.
  IF NOT v_engine THEN
    NEW.tier                    := OLD.tier;
    NEW.rating                  := OLD.rating;
    NEW.rating_sum              := OLD.rating_sum;
    NEW.rating_count            := OLD.rating_count;
    NEW.trust_score             := OLD.trust_score;
    NEW.heart_count             := OLD.heart_count;
    NEW.penalty_count           := OLD.penalty_count;
    NEW.rank_penalty_expires_at := OLD.rank_penalty_expires_at;
    NEW.last_report_date        := OLD.last_report_date;
    NEW.rank_audit_log          := OLD.rank_audit_log;
    RETURN NEW;
  END IF;

  -- === enforceEmergencyDescent (functions/src/handlers/drivers.ts) ===
  -- Same guards as the Firestore onUpdate trigger: driver role, counter must have gone
  -- UP this update, threshold 3, and not already at the bottom rank.
  IF NEW.penalty_count > OLD.penalty_count
     AND NEW.penalty_count >= 3
     AND NEW.tier IS DISTINCT FROM 'BRONZE'::public.captain_tier
  THEN
    NEW.tier := 'BRONZE';                                       -- العودة للقاع
    NEW.penalty_count := 0;                                     -- تصفير السجل لبدء التطهير
    NEW.rank_penalty_expires_at := now() + interval '72 hours';  -- حظر الصعود
    NEW.rank_audit_log := NEW.rank_audit_log || format(
      '[Emergency Descent] Rank stripped to BRONZE. Threshold exceeded at %s. Locked until %s',
      to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      to_char((now() + interval '72 hours') AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
    RETURN NEW;
  END IF;

  -- [DEVIATION / bug fix] Firebase writes rankPenaltyExpiresAt and comments it as
  -- "حظر الصعود", but generateWeeklyReport never reads it -- so in Firebase the very next
  -- report restores the stripped rank and the 72h purge is a no-op. Enforced here,
  -- otherwise porting the descent would port a dead field.
  IF NEW.rank_penalty_expires_at IS NOT NULL AND NEW.rank_penalty_expires_at > now() THEN
    NEW.tier := OLD.tier;
    RETURN NEW;
  END IF;

  -- === promotion (calculateSovereignRank) ===
  NEW.tier := public.calculate_sovereign_rank(NEW.rating, NEW.heart_count);

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS profiles_captain_rank_sync ON public.profiles;
CREATE TRIGGER profiles_captain_rank_sync
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_captain_rank();


-- ---------------------------------------------------------------------------
-- 5. submitTripFeedback() rating aggregation -- functions/src/handlers/ratings.ts.
--    Firebase did ratingSum/ratingCount/rating += and heartCount++ inside a
--    transaction; here it is an AFTER INSERT trigger on reviews, which then cascades
--    into the rank engine above because `rating` changed.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_review_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_role text;
  v_rating numeric;
  v_engine_before text := coalesce(current_setting('radar.rank_engine', true), '');
BEGIN
  SELECT upper(coalesce(role::text, ''))
  INTO v_role
  FROM public.profiles
  WHERE id = NEW.reviewee_id
  FOR UPDATE;

  IF NOT found THEN
    RETURN NEW;
  END IF;

  -- Only the captain block feeds the captain rank -- Firebase likewise fed the rank from
  -- driverRating and kept vehicleRating on the vehicle document.
  IF v_role IN ('CAPTAIN', 'DRIVER') THEN
    v_rating := public.sovereign_stars_to_rating(NEW.detailed_stars -> 'captain');
  ELSE
    v_rating := public.sovereign_stars_to_rating(NEW.detailed_stars -> 'rider');
  END IF;

  IF v_rating IS NULL THEN
    RETURN NEW;  -- nothing scoreable in this payload
  END IF;

  -- rating / heart_count are engine-owned (see sync_captain_rank), so the aggregation has
  -- to identify itself as the engine or its own write would be rolled back.
  PERFORM set_config('radar.rank_engine', 'on', true);

  UPDATE public.profiles p
  SET rating_sum = p.rating_sum + v_rating,
      rating_count = p.rating_count + 1,
      rating = round((p.rating_sum + v_rating) / (p.rating_count + 1), 2),
      trust_score = round((p.rating_sum + v_rating) / (p.rating_count + 1), 2),
      heart_count = p.heart_count + CASE WHEN NEW.gave_heart THEN 1 ELSE 0 END,
      updated_at = now()
  WHERE p.id = NEW.reviewee_id;

  -- Restore rather than clear: this trigger fires on an external INSERT, so it must not
  -- close an engine block that some outer function opened.
  PERFORM set_config('radar.rank_engine', v_engine_before, true);

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS reviews_apply_to_profile ON public.reviews;
CREATE TRIGGER reviews_apply_to_profile
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.apply_review_to_profile();


-- ---------------------------------------------------------------------------
-- 6. generateWeeklyReport() -- functions/src/handlers/ratings.ts, same contract:
--    same COURT_001 refusal when there is no new pulse, same {success, stats} shape.
--    [DEVIATION] p_captain_id lets an ADMIN run the report for a specific captain;
--    the Firebase callable could only ever act on context.auth.uid.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_weekly_report(p_captain_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  v_target uuid := coalesce(p_captain_id, auth.uid());
  v_profile public.profiles%rowtype;
  v_new_tier public.captain_tier;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  IF v_target <> v_caller AND NOT exists (
    SELECT 1 FROM public.profiles
    WHERE id = v_caller AND upper(coalesce(role::text, '')) = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_target FOR UPDATE;

  IF NOT found THEN
    RAISE EXCEPTION 'ملف الكابتن غير موجود.';
  END IF;

  IF upper(coalesce(v_profile.role::text, '')) NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  -- if (!driverData.ratingCount) return { success: false, message: 'COURT_001...' }
  IF coalesce(v_profile.rating_count, 0) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'COURT_001: لا يوجد نبض جديد.',
      'rank', coalesce(v_profile.tier::text, 'BRONZE')
    );
  END IF;

  -- [DEVIATION] new refusal code, the counterpart of the enforced 72h lock above.
  IF v_profile.rank_penalty_expires_at IS NOT NULL AND v_profile.rank_penalty_expires_at > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'COURT_002: الصعود محظور حتى انتهاء فترة التطهير التأديبية.',
      'rank', coalesce(v_profile.tier::text, 'BRONZE'),
      'rankPenaltyExpiresAt', v_profile.rank_penalty_expires_at
    );
  END IF;

  v_new_tier := public.calculate_sovereign_rank(v_profile.rating, v_profile.heart_count);

  PERFORM set_config('radar.rank_engine', 'on', true);
  UPDATE public.profiles
  SET tier = v_new_tier,
      last_report_date = now(),
      updated_at = now()
  WHERE id = v_target;
  PERFORM set_config('radar.rank_engine', '', true);

  RETURN jsonb_build_object(
    'success', true,
    'stats', jsonb_build_object(
      'averageRating', v_profile.rating,
      'heartCount', v_profile.heart_count,
      'newRank', v_new_tier::text
    )
  );
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 7. [DEVIATION] The descent's input. Firebase only ever *read* penaltyCount -- nothing
--    in the repo increments it, so the guillotine could never fire. This is the writer:
--    admin-only, and the increment is what trips profiles_captain_rank_sync.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_captain_penalty(
  p_captain_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  v_after public.profiles%rowtype;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  IF NOT exists (
    SELECT 1 FROM public.profiles
    WHERE id = v_caller AND upper(coalesce(role::text, '')) = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  IF p_captain_id IS NULL THEN
    RAISE EXCEPTION 'captain_id_required';
  END IF;

  -- penalty_count and rank_audit_log are engine-owned (see sync_captain_rank).
  PERFORM set_config('radar.rank_engine', 'on', true);

  UPDATE public.profiles
  SET penalty_count = penalty_count + 1,
      rank_audit_log = rank_audit_log || format(
        '[Penalty] +1 at %s by %s. Reason: %s',
        to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        v_caller::text,
        coalesce(nullif(btrim(p_reason), ''), 'unspecified')
      ),
      updated_at = now()
  WHERE id = p_captain_id
    AND upper(coalesce(role::text, '')) IN ('CAPTAIN', 'DRIVER')
  RETURNING * INTO v_after;

  PERFORM set_config('radar.rank_engine', '', true);

  IF NOT found THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'rank', v_after.tier::text,
    'penaltyCount', v_after.penalty_count,
    'rankPenaltyExpiresAt', v_after.rank_penalty_expires_at
  );
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 8. Backfill helper -- NOT run by this migration on purpose.
--    The seeded ranks in production (4 PLATINUM / 5 GOLD, all with rating 5.00 and 0
--    hearts) do not satisfy RANKING_RULES, so a resync demotes every one of them to
--    SILVER. Call it deliberately as an ADMIN when you want that:
--        select public.resync_all_captain_ranks();
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resync_all_captain_ranks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  v_changed integer := 0;
BEGIN
  IF v_caller IS NOT NULL AND NOT exists (
    SELECT 1 FROM public.profiles
    WHERE id = v_caller AND upper(coalesce(role::text, '')) = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  PERFORM set_config('radar.rank_engine', 'on', true);

  WITH resynced AS (
    UPDATE public.profiles p
    SET tier = public.calculate_sovereign_rank(p.rating, p.heart_count),
        updated_at = now()
    WHERE upper(coalesce(p.role::text, '')) IN ('CAPTAIN', 'DRIVER')
      AND (p.rank_penalty_expires_at IS NULL OR p.rank_penalty_expires_at <= now())
      AND p.tier IS DISTINCT FROM public.calculate_sovereign_rank(p.rating, p.heart_count)
    RETURNING 1
  )
  SELECT count(*) INTO v_changed FROM resynced;

  PERFORM set_config('radar.rank_engine', '', true);

  RETURN jsonb_build_object('success', true, 'changed', v_changed);
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 9. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.generate_weekly_report(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.record_captain_penalty(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.resync_all_captain_ranks() FROM anon;

GRANT EXECUTE ON FUNCTION public.calculate_sovereign_rank(numeric, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sovereign_stars_to_rating(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_weekly_report(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_captain_penalty(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resync_all_captain_ranks() TO authenticated;
