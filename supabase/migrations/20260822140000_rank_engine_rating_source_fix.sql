-- Follow-up to 20260822090000_captain_rank_sovereign_engine.sql.
--
-- Two fixes, both consequences of settling which table owns the rating:
--   1. public.reviews wins; the older submit_ride_rating / rider_ratings path is retired.
--   2. A review that scores nothing must still record its heart, now that the rating
--      modals omit unanswered criteria instead of sending them as 0.
--
-- Background and the reasoning for both: docs/rating-system-audit.md

-- ---------------------------------------------------------------------------
-- submit_ride_rating is retired, not just made safe.
--
-- public.reviews is the rating system: it is what both live modals write, and its detailed
-- named criteria are the product decision. submit_ride_rating is the older star-based
-- duplicate, and the two cannot coexist — it *recomputes* profiles.rating from
-- rider_ratings while apply_review_to_profile *increments* it from a review, so whichever
-- ran last would wipe the other's contribution.
--
-- Its three client call sites were removed in the same change. The function is kept (the
-- 6 rows in rider_ratings are real history) but locked so it cannot silently become a
-- second writer again: EXECUTE is revoked, and it refuses outright with a message that
-- says where the rating went.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_ride_rating(
  p_request_id uuid,
  p_captain_id uuid,
  p_rating_value integer
) RETURNS jsonb
LANGUAGE plpgsql
AS $fn$
BEGIN
  RAISE EXCEPTION 'rating_path_retired: use an insert into public.reviews (detailed_stars + gave_heart); see docs/rating-system-audit.md';
END;
$fn$;

REVOKE ALL ON FUNCTION public.submit_ride_rating(uuid, uuid, integer) FROM authenticated;
REVOKE ALL ON FUNCTION public.submit_ride_rating(uuid, uuid, integer) FROM anon;

COMMENT ON FUNCTION public.submit_ride_rating(uuid, uuid, integer) IS
  'RETIRED 2026-08-22. Replaced by the public.reviews path (apply_review_to_profile). Raises unconditionally so it cannot become a second writer of profiles.rating.';


-- ---------------------------------------------------------------------------
-- apply_review_to_profile: the heart must survive a review that scores nothing.
--
-- The rating modals now omit unanswered criteria instead of sending them as 0, so
-- "reviewer answered no criteria at all" is an ordinary outcome rather than an edge case —
-- and sovereign_stars_to_rating returns NULL for it. The previous version returned early
-- on a NULL rating, which silently threw away the heart on the same review. Rating and
-- heart are now applied independently.
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
  v_heart integer := CASE WHEN coalesce(NEW.gave_heart, false) THEN 1 ELSE 0 END;
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
    v_heart := 0;  -- hearts only mean something for captains
  END IF;

  IF v_rating IS NULL AND v_heart = 0 THEN
    RETURN NEW;  -- nothing in this review moves the profile
  END IF;

  PERFORM set_config('radar.rank_engine', 'on', true);

  UPDATE public.profiles p
  SET rating_sum = p.rating_sum + coalesce(v_rating, 0),
      rating_count = p.rating_count + CASE WHEN v_rating IS NULL THEN 0 ELSE 1 END,
      rating = CASE
                 WHEN v_rating IS NULL THEN p.rating
                 ELSE round((p.rating_sum + v_rating) / (p.rating_count + 1), 2)
               END,
      trust_score = CASE
                      WHEN v_rating IS NULL THEN p.trust_score
                      ELSE round((p.rating_sum + v_rating) / (p.rating_count + 1), 2)
                    END,
      heart_count = p.heart_count + v_heart,
      updated_at = now()
  WHERE p.id = NEW.reviewee_id;

  PERFORM set_config('radar.rank_engine', v_engine_before, true);

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS reviews_apply_to_profile ON public.reviews;
CREATE TRIGGER reviews_apply_to_profile
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.apply_review_to_profile();
