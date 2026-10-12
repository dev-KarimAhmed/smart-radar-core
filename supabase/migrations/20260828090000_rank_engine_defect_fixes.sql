-- Defect fixes to the LIVE captain-rank engine, against the constitutional spec in
-- "تقييم السائقين" (Dual-Key Matrix / DriverTierGovernanceEngine).
--
-- Scope: only things already implemented and behaving wrongly. The parts of the spec that
-- are simply absent (points key, tiered radar perimeter, temporal priority, 7-day grace
-- period, rural mitigation, scheduled rides, direct dispatch) are NOT built here — they
-- are new subsystems, not defects, and are listed at the bottom of this file.
--
-- NOT in this file: the offer price band. An earlier draft flattened/re-laddered
-- offer_band_for_rank here, but the product decision is now that RANK DOES NOT AFFECT
-- PRICE at all (flat ±15% for every rank, with above-band allowed after a warning). That
-- lives in its own migration so this one stays purely about the rating/rank engine.
--
-- Two defects fixed:
--
--   D1. heart_count counted HEARTS, not UNIQUE RIDERS.
--       The spec's second key is "الركاب المفضلون الفريدون ... لمنع التواطؤ، والاحتيال،
--       وشراء الرحلات الوهمية". The engine incremented heart_count once per hearted
--       review, and the only uniqueness guard is UNIQUE (trip_id, reviewer_id,
--       reviewee_id) — which stops re-rating the same TRIP, not the same RIDER. So one
--       rider taking 50 short trips with one captain minted 50 hearts and could push that
--       captain to PLATINUM alone. The exact collusion the second key exists to prevent.
--
--   D2. The vehicle half of the rating was collected and thrown away.
--       Riders answer five vehicle criteria (cleanliness, ac, comfort, quietness, safety)
--       in the rating modal; apply_review_to_profile read only detailed_stars->'captain'
--       and dropped detailed_stars->'vehicle' on the floor. The spec requires both, as two
--       independent indicators combined 60% behaviour / 40% vehicle readiness
--       ("مصفوفة تفكيك تقييم السلوك عن جاهزية المركبة").
--       [DEVIATION] This is a deliberate departure from the Firebase original, which fed
--       the rank from driverRating alone. The spec overrules the port.
--
-- Recomputation strategy: D1 cannot be fixed by patching the incremental "+1" — the stored
-- counters are already wrong for every captain who has been hearted twice by one rider.
-- Every score is therefore derived from public.reviews on each write instead of
-- accumulated, which makes the value self-healing and makes the backfill below identical
-- to normal operation. Costs one aggregate per review insert; at this table size that is
-- the right trade against carrying a number nobody can reproduce.


-- ---------------------------------------------------------------------------
-- 1. The vehicle-readiness indicator (D2)
--
--    rating_sum / rating_count keep their existing meaning (behaviour accumulators) so
--    nothing that already reads them breaks. `rating` and `trust_score` — what the UI
--    actually displays and what the rank engine actually reads — become the 60/40
--    composite. behavior_rating exposes the behaviour axis on its own, which the old
--    `rating` used to be.
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS behavior_rating      numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vehicle_rating       numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vehicle_rating_sum   numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vehicle_rating_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.behavior_rating IS
  'Behaviour axis alone (اللباقة، الأمانة، الالتزام بالمسار). Weighted 60% into `rating`.';
COMMENT ON COLUMN public.profiles.vehicle_rating IS
  'Vehicle-readiness axis alone (النظافة، التكييف، الراحة). Weighted 40% into `rating`.';
COMMENT ON COLUMN public.profiles.rating IS
  'Composite score the rank engine reads: 0.6 * behavior_rating + 0.4 * vehicle_rating.';
COMMENT ON COLUMN public.profiles.heart_count IS
  'DISTINCT riders who hearted this captain — not total hearts. Second key of the Dual-Key matrix; gate for GOLD (>=20) and PLATINUM (>=50).';


-- ---------------------------------------------------------------------------
-- 2. Indexes for the per-write recompute
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS reviews_by_reviewee
  ON public.reviews (reviewee_id);

CREATE INDEX IF NOT EXISTS reviews_hearts_by_reviewee
  ON public.reviews (reviewee_id, reviewer_id)
  WHERE gave_heart;


-- ---------------------------------------------------------------------------
-- 3. The single source of truth for every score on a profile.
--
--    Derives behaviour, vehicle readiness, the 60/40 composite and the unique-rider heart
--    count straight from public.reviews. Writing through this rather than incrementing is
--    what makes D1 unfixable-by-drift.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recompute_profile_scores(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- مصفوفة تفكيك تقييم السلوك عن جاهزية المركبة: 60% سلوك / 40% مركبة
  BEHAVIOUR_WEIGHT constant numeric := 0.60;
  VEHICLE_WEIGHT   constant numeric := 0.40;

  v_role            text;
  v_is_captain      boolean;
  v_block           text;
  v_behaviour_sum   numeric := 0;
  v_behaviour_count integer := 0;
  v_vehicle_sum     numeric := 0;
  v_vehicle_count   integer := 0;
  v_hearts          integer := 0;
  v_behaviour       numeric;
  v_vehicle         numeric;
  v_composite       numeric;
  v_engine_before   text := coalesce(current_setting('radar.rank_engine', true), '');
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN;
  END IF;

  -- FOR UPDATE serialises concurrent reviews for the same person, so two inserts landing
  -- together cannot both read the pre-insert review set and write the same stale total.
  SELECT upper(coalesce(role::text, ''))
  INTO v_role
  FROM public.profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT found THEN
    RETURN;
  END IF;

  v_is_captain := v_role IN ('CAPTAIN', 'DRIVER');
  v_block := CASE WHEN v_is_captain THEN 'captain' ELSE 'rider' END;

  SELECT
    coalesce(sum(s.behaviour), 0),
    count(s.behaviour),
    coalesce(sum(s.vehicle), 0),
    count(s.vehicle),
    -- D1: DISTINCT reviewer, not row count. Fifty trips with one rider = one heart.
    count(DISTINCT s.reviewer_id) FILTER (WHERE s.gave_heart)
  INTO
    v_behaviour_sum, v_behaviour_count, v_vehicle_sum, v_vehicle_count, v_hearts
  FROM (
    SELECT
      r.reviewer_id,
      coalesce(r.gave_heart, false) AS gave_heart,
      public.sovereign_stars_to_rating(r.detailed_stars -> v_block) AS behaviour,
      CASE
        WHEN v_is_captain THEN public.sovereign_stars_to_rating(r.detailed_stars -> 'vehicle')
        ELSE NULL
      END AS vehicle
    FROM public.reviews r
    WHERE r.reviewee_id = p_profile_id
  ) s;

  v_behaviour := CASE WHEN v_behaviour_count > 0
                      THEN round(v_behaviour_sum / v_behaviour_count, 2) END;
  v_vehicle   := CASE WHEN v_vehicle_count > 0
                      THEN round(v_vehicle_sum / v_vehicle_count, 2) END;

  -- A captain rated on only one axis is scored on that axis alone. Treating an unanswered
  -- section as zero would let the rank be destroyed by data that was never collected —
  -- the same reasoning the rating modal already applies to individual criteria
  -- ("البند اللي تسيبه فاضي مش محسوب ضد السائق").
  v_composite := CASE
    WHEN v_behaviour IS NULL AND v_vehicle IS NULL THEN NULL
    WHEN v_vehicle   IS NULL THEN v_behaviour
    WHEN v_behaviour IS NULL THEN v_vehicle
    ELSE round(BEHAVIOUR_WEIGHT * v_behaviour + VEHICLE_WEIGHT * v_vehicle, 2)
  END;

  -- Every column below is engine-owned (see sync_captain_rank), so this write has to
  -- identify itself as the engine or the trigger rolls it straight back.
  PERFORM set_config('radar.rank_engine', 'on', true);

  UPDATE public.profiles p
  SET rating_sum           = v_behaviour_sum,
      rating_count         = v_behaviour_count,
      behavior_rating      = coalesce(v_behaviour, 0),
      vehicle_rating_sum   = v_vehicle_sum,
      vehicle_rating_count = v_vehicle_count,
      vehicle_rating       = coalesce(v_vehicle, 0),
      -- No scoreable review yet: leave the seeded display value alone rather than
      -- dropping a brand-new captain to 0.00 before anyone has rated them.
      rating               = coalesce(v_composite, p.rating),
      trust_score          = coalesce(v_composite, p.trust_score),
      heart_count          = CASE WHEN v_is_captain THEN v_hearts ELSE p.heart_count END,
      updated_at           = now()
  WHERE p.id = p_profile_id;

  -- Restore rather than clear: an outer function may have opened the engine block.
  PERFORM set_config('radar.rank_engine', v_engine_before, true);
END;
$fn$;

REVOKE ALL ON FUNCTION public.recompute_profile_scores(uuid) FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4. The review trigger now just delegates.
--
--    The previous body did its own incremental arithmetic (rating_sum + v_rating,
--    heart_count + v_heart). That arithmetic is what produced D1 and D2; there is nothing
--    left in it worth keeping.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_review_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  PERFORM public.recompute_profile_scores(NEW.reviewee_id);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS reviews_apply_to_profile ON public.reviews;
CREATE TRIGGER reviews_apply_to_profile
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.apply_review_to_profile();

-- A heart or a criterion can be corrected after the fact; the scores must follow it.
DROP TRIGGER IF EXISTS reviews_apply_to_profile_update ON public.reviews;
CREATE TRIGGER reviews_apply_to_profile_update
  AFTER UPDATE OF detailed_stars, gave_heart ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.apply_review_to_profile();


-- ---------------------------------------------------------------------------
-- 5. Freeze the new columns against non-engine writers.
--
--    Identical to the existing sync_captain_rank apart from the four added lines in the
--    freeze block. Without them, RLS being disabled on public.profiles means anyone with
--    the anon key could set vehicle_rating = 5 and buy 40% of the rank outright.
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

  IF NOT v_engine THEN
    NEW.tier                    := OLD.tier;
    NEW.rating                  := OLD.rating;
    NEW.rating_sum              := OLD.rating_sum;
    NEW.rating_count            := OLD.rating_count;
    NEW.behavior_rating         := OLD.behavior_rating;
    NEW.vehicle_rating          := OLD.vehicle_rating;
    NEW.vehicle_rating_sum      := OLD.vehicle_rating_sum;
    NEW.vehicle_rating_count    := OLD.vehicle_rating_count;
    NEW.trust_score             := OLD.trust_score;
    NEW.heart_count             := OLD.heart_count;
    NEW.penalty_count           := OLD.penalty_count;
    NEW.rank_penalty_expires_at := OLD.rank_penalty_expires_at;
    NEW.last_report_date        := OLD.last_report_date;
    NEW.rank_audit_log          := OLD.rank_audit_log;
    RETURN NEW;
  END IF;

  -- === enforceEmergencyDescent ===
  IF NEW.penalty_count > OLD.penalty_count
     AND NEW.penalty_count >= 3
     AND NEW.tier IS DISTINCT FROM 'BRONZE'::public.captain_tier
  THEN
    NEW.tier := 'BRONZE';                                        -- العودة للقاع
    NEW.penalty_count := 0;                                      -- تصفير السجل لبدء التطهير
    NEW.rank_penalty_expires_at := now() + interval '72 hours';   -- حظر الصعود
    NEW.rank_audit_log := NEW.rank_audit_log || format(
      '[Emergency Descent] Rank stripped to BRONZE. Threshold exceeded at %s. Locked until %s',
      to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      to_char((now() + interval '72 hours') AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
    RETURN NEW;
  END IF;

  -- Promotion lock during the 72h disciplinary purge.
  IF NEW.rank_penalty_expires_at IS NOT NULL AND NEW.rank_penalty_expires_at > now() THEN
    NEW.tier := OLD.tier;
    RETURN NEW;
  END IF;

  -- === promotion (calculateSovereignRank) ===
  -- NEW.rating is now the 60/40 composite, so the 4.0 / 4.5 / 4.8 thresholds are applied
  -- to the whole captain (behaviour + vehicle) rather than to behaviour alone.
  NEW.tier := public.calculate_sovereign_rank(NEW.rating, NEW.heart_count);

  RETURN NEW;
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 6. Backfill.
--
--    Mandatory, not optional: heart_count and rating change meaning in this migration, so
--    every stored value is now wrong until it is rebuilt from the reviews it came from.
--    Only profiles that actually have reviews are touched — a captain whose rank was
--    hand-seeded with no reviews behind it keeps that rank, because deciding whether to
--    demote those is a separate call (see resync_all_captain_ranks).
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_id uuid;
  v_done integer := 0;
BEGIN
  FOR v_id IN
    SELECT DISTINCT r.reviewee_id
    FROM public.reviews r
    JOIN public.profiles p ON p.id = r.reviewee_id
  LOOP
    PERFORM public.recompute_profile_scores(v_id);
    v_done := v_done + 1;
  END LOOP;

  RAISE NOTICE 'recomputed scores for % profiles', v_done;
END;
$$;


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- No captain should have more hearts than distinct riders who hearted them.
--   SELECT p.id, p.heart_count,
--          (SELECT count(DISTINCT r.reviewer_id) FROM public.reviews r
--           WHERE r.reviewee_id = p.id AND r.gave_heart) AS unique_hearts
--   FROM public.profiles p
--   WHERE upper(p.role::text) IN ('CAPTAIN','DRIVER')
--     AND p.heart_count <> (SELECT count(DISTINCT r.reviewer_id) FROM public.reviews r
--                           WHERE r.reviewee_id = p.id AND r.gave_heart);
--   -- expect: 0 rows
--
--   -- The composite must equal 0.6 behaviour + 0.4 vehicle wherever both axes exist.
--   SELECT id, behavior_rating, vehicle_rating, rating
--   FROM public.profiles
--   WHERE rating_count > 0 AND vehicle_rating_count > 0
--     AND rating <> round(0.6 * behavior_rating + 0.4 * vehicle_rating, 2);
--   -- expect: 0 rows
--
--
-- STILL NOT IMPLEMENTED (spec features, not defects — each needs its own decision):
--   * The points key (المفتاح الأول). There is no points column; promotion runs on rating.
--   * Tiered radar perimeter 1.5 / 1.8 / 2.2 / 2.5 km — currently a flat 1.5 km for all
--     (src/core/constants/sovereign-protocols.ts, functions/src/core/constants.ts).
--   * Temporal priority 0 / 0.5 / 1.0 / 1.5 s in the auction.
--   * isLockedByFavorites freeze, 7-day grace period, rural mitigation.
--   * Scheduled rides and direct dispatch by name.
--   * Spec thresholds behaviour < 4.2 -> behavioural review, vehicle < 4.0 -> suspension,
--     vehicle 4.0-4.4 -> reduced capacity. The two axes are now measured separately, so
--     these are enforceable — but auto-suspending captains is a product decision.
