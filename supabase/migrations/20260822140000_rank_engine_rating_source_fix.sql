-- Follow-up to 20260822090000_captain_rank_sovereign_engine.sql.
--
-- That migration made a set of profile columns engine-owned: sync_captain_rank() rolls
-- back any write to rating / rating_sum / rating_count / trust_score / heart_count /
-- penalty_count / tier that does not set the `radar.rank_engine` flag first.
--
-- public.submit_ride_rating() writes four of those columns and does not set the flag, so
-- its UPDATE is silently discarded. It is not currently reachable from the UI — every one
-- of its three call sites is dead code (see docs/rating-system-audit.md) — so nothing is
-- broken in production today. But it is a landmine: the moment anyone wires that RPC to a
-- button, ratings would vanish with no error. Fixed here.
--
-- Nothing else changes. apply_review_to_profile() keeps owning the rating aggregate,
-- because public.reviews is the only rating source the live UI actually writes to.

CREATE OR REPLACE FUNCTION public.submit_ride_rating(
  p_request_id uuid,
  p_captain_id uuid,
  p_rating_value integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  req public.ride_requests%rowtype;
  new_trust_score numeric;
  rating_total numeric;
  rating_rows integer;
  v_engine_before text := coalesce(current_setting('radar.rank_engine', true), '');
BEGIN
  IF p_rating_value < 1 OR p_rating_value > 5 THEN
    RAISE EXCEPTION 'invalid_rating_value';
  END IF;

  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT found THEN RAISE EXCEPTION 'ride_request_not_found'; END IF;
  IF req.rider_id <> auth.uid() THEN RAISE EXCEPTION 'not_request_owner'; END IF;
  IF upper(coalesce(req.status::text, '')) <> 'COMPLETED' THEN RAISE EXCEPTION 'ride_request_not_completed'; END IF;
  IF req.accepted_captain_id IS DISTINCT FROM p_captain_id THEN RAISE EXCEPTION 'captain_mismatch'; END IF;

  INSERT INTO public.rider_ratings (request_id, rider_id, captain_id, rating_value)
  VALUES (p_request_id, req.rider_id, p_captain_id, p_rating_value)
  ON CONFLICT (request_id, rider_id)
  DO UPDATE SET rating_value = excluded.rating_value;

  SELECT coalesce(sum(rating_value), 0), count(*)
  INTO rating_total, rating_rows
  FROM public.rider_ratings
  WHERE captain_id = p_captain_id;

  new_trust_score := round((rating_total / greatest(rating_rows, 1))::numeric, 2);

  -- THE ONLY CHANGE. Without this the UPDATE below is reverted by the BEFORE UPDATE
  -- trigger installed in 20260822090000 and the rating disappears without an error.
  PERFORM set_config('radar.rank_engine', 'on', true);

  UPDATE public.profiles
  SET trust_score = coalesce(new_trust_score, 5),
      rating = coalesce(new_trust_score, 5),
      rating_sum = rating_total,
      rating_count = rating_rows,
      updated_at = now()
  WHERE id = p_captain_id;

  -- Restore rather than clear, so this cannot close an engine block opened by a caller.
  PERFORM set_config('radar.rank_engine', v_engine_before, true);

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'captain_id', p_captain_id,
    'rating_value', p_rating_value,
    'trust_score', coalesce(new_trust_score, 5)
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.submit_ride_rating(uuid, uuid, integer) TO authenticated;

-- WARNING, not fixed here because it needs a product decision: submit_ride_rating() and
-- apply_review_to_profile() would fight over the same columns if BOTH were ever live.
-- The first recomputes the aggregate from rider_ratings; the second increments it from a
-- review. Whichever runs last wipes the other's contribution. Today only the reviews path
-- is reachable, so they never both run. Do not wire submit_ride_rating to the UI without
-- settling which table owns the rating. See docs/rating-system-audit.md.


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
