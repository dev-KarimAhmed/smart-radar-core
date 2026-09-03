-- The countdown both sides watch during a trip was not a countdown.
--
-- On the rider's screen it was one number, computed once:
--
--   etaSeconds: Math.max(4 * 60, Math.round((distanceKm || 4) * 85))
--
-- 85 seconds per kilometre of the TRIP, shown as "الكابتن يوصلك خلال" while the captain was
-- still driving over, and then as "الوقت المتبقي" once the trip had begun — the same number
-- for both, never recomputed at the transition. A 30 km trip therefore claimed the captain
-- was 42 minutes from a pickup point that might be two streets away.
--
-- Two things the client needed in order to show a real countdown did not exist on the server.
--
--
-- 1. NO ANCHOR FOR THE APPROACH
--
-- A countdown is `deadline - now`, and the deadline needs a start. ride_requests stamps
-- arrived_at, started_at, completed_at and cancelled_at — but nothing for when the rider
-- accepted the offer, which is exactly when the captain begins driving over.
--
-- With no server timestamp the client anchored on Date.now() at render, and buildActiveTrip
-- rebuilds its object on every realtime row: any column change restarted the countdown from
-- the top, and the rider's phone and the captain's never agreed.
--
--
-- 2. THE PICKUP ETA WAS THE LITERAL CONSTANT 5
--
--   INSERT INTO public.ride_offers (... eta_minutes ...)
--   VALUES (p_request_id, auth.uid(), p_offer_price, p_offer_price, 5, ...)
--                                                                  ^
--
-- Every offer ever submitted claimed five minutes. And submit_ride_offer already computes
-- the captain's real distance to the pickup — `distance_km`, for the 9 km radar guard — and
-- then throws it away.
--
-- (The rider's screen never even saw the 5: its mapper reads pickup_eta_minutes / eta /
-- pickup_eta, none of which is a column, so it fell back to a haversine against the
-- captain's live presence point when one happened to be loaded, and to "---" otherwise.)
--
--
-- THE FIX
--
-- Stamp the anchor, and keep the distance the server has already measured. Both are done
-- with triggers rather than by rewriting the two RPCs: submit_ride_offer is ~200 lines of
-- pricing logic that has nothing to do with this, and a trigger also covers the other paths
-- that write these rows (server.ts, the Cloud Functions in functions/src/handlers/trips.ts)
-- instead of only the one RPC.


-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Denormalised onto the request on purpose. Both sides already read this row — the rider for
-- resync and realtime, the captain via select('*') once accepted — so putting the accepted
-- offer's ETA here means neither needs the offers table loaded to render the countdown. On a
-- reload the rider's offers array is empty, and that is precisely when the countdown must
-- still be right.
ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS pickup_eta_minutes integer;

ALTER TABLE public.ride_offers
  ADD COLUMN IF NOT EXISTS pickup_distance_km numeric;

COMMENT ON COLUMN public.ride_requests.accepted_at IS
  'When the rider accepted an offer. The anchor the captain-is-on-the-way countdown runs from.';
COMMENT ON COLUMN public.ride_requests.pickup_eta_minutes IS
  'Accepted offer''s eta_minutes, copied here so both sides can render the countdown from this row alone.';
COMMENT ON COLUMN public.ride_offers.pickup_distance_km IS
  'Server-measured straight-line km from the captain to the pickup at offer time. Never client-supplied.';


-- ---------------------------------------------------------------------------
-- A real pickup ETA on every offer.
--
-- Measured here, from captain_locations, for the same reason the 9 km guard is measured
-- here: a captain who could name their own ETA would name a small one, and the rider ranks
-- offers partly on it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.stamp_ride_offer_pickup_eta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_origin_lat numeric;
  v_origin_lng numeric;
  v_lat numeric;
  v_lng numeric;
  v_distance_km numeric;
  -- Mirrors PICKUP_MINUTES_PER_KM in src/shared/services/trip-duration.ts: ~20 km/h, which
  -- is deliberately slow for a straight-line distance because the approach is urban, the
  -- road is longer than the crow's path, and it ends with finding the rider. Change both
  -- together or the two sides quote different arrivals.
  k_minutes_per_km constant numeric := 3;
  k_min_minutes constant integer := 1;
  -- The 9 km radar cutoff at 3 min/km is 27; past ~45 the number is not an estimate any
  -- more, it is a stale location.
  k_max_minutes constant integer := 45;
BEGIN
  SELECT rr.origin_lat, rr.origin_lng
  INTO v_origin_lat, v_origin_lng
  FROM public.ride_requests rr
  WHERE rr.id = NEW.request_id;

  SELECT cl.location_lat, cl.location_lng
  INTO v_lat, v_lng
  FROM public.captain_locations cl
  WHERE cl.captain_id = NEW.captain_id;

  IF v_origin_lat IS NULL OR v_origin_lng IS NULL OR v_lat IS NULL OR v_lng IS NULL THEN
    -- Location unknown. Leave eta_minutes at whatever the insert set (its column default is
    -- 5) rather than inventing a distance — the client treats a missing pickup ETA as
    -- "unknown" and falls back to its own estimate.
    RETURN NEW;
  END IF;

  v_distance_km := 6371 * 2 * asin(sqrt(
    power(sin(radians(v_origin_lat - v_lat) / 2), 2) +
    cos(radians(v_lat)) * cos(radians(v_origin_lat)) *
    power(sin(radians(v_origin_lng - v_lng) / 2), 2)
  ));

  NEW.pickup_distance_km := round(v_distance_km, 3);
  NEW.eta_minutes := least(
    k_max_minutes,
    greatest(k_min_minutes, ceil(v_distance_km * k_minutes_per_km))
  );

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS ride_offers_stamp_pickup_eta ON public.ride_offers;
CREATE TRIGGER ride_offers_stamp_pickup_eta
BEFORE INSERT ON public.ride_offers
FOR EACH ROW EXECUTE FUNCTION public.stamp_ride_offer_pickup_eta();


-- ---------------------------------------------------------------------------
-- The approach anchor.
--
-- BEFORE UPDATE, and coalesce()d, so re-entering an accepted state (accept_ride_offer is
-- idempotent, and EN_ROUTE follows ACCEPTED) never moves the anchor forward — a countdown
-- that resets on the next status change is the bug this is fixing.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.stamp_ride_request_accepted_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_status text := upper(coalesce(NEW.status::text, ''));
BEGIN
  IF v_status NOT IN ('ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'TRIP_ACTIVE', 'ACTIVE', 'STARTED', 'IN_PROGRESS') THEN
    RETURN NEW;
  END IF;

  NEW.accepted_at := coalesce(NEW.accepted_at, OLD.accepted_at, now());

  -- Only when pickup_distance_km proves the ETA was measured. eta_minutes is NOT NULL with
  -- a column default of 5, so copying it unconditionally would hand the client a hardcoded
  -- 5 dressed up as a measurement — exactly the thing this migration exists to remove.
  -- Left NULL otherwise, and the countdown renders "غير متاح" rather than a wrong number.
  IF NEW.pickup_eta_minutes IS NULL AND NEW.accepted_offer_id IS NOT NULL THEN
    SELECT ro.eta_minutes
    INTO NEW.pickup_eta_minutes
    FROM public.ride_offers ro
    WHERE ro.id = NEW.accepted_offer_id
      AND ro.pickup_distance_km IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS ride_requests_stamp_accepted_at ON public.ride_requests;
CREATE TRIGGER ride_requests_stamp_accepted_at
BEFORE UPDATE OF status ON public.ride_requests
FOR EACH ROW EXECUTE FUNCTION public.stamp_ride_request_accepted_at();


-- ---------------------------------------------------------------------------
-- Repair trips already in flight.
--
-- A trip accepted before this migration has no accepted_at, so its rider would see "--:--"
-- for the rest of the approach. updated_at is not the acceptance moment, but for a request
-- still sitting in ACCEPTED it is the closest thing recorded, and a countdown roughly right
-- beats a dash. started_at, where present, is a better bound and wins.
-- ---------------------------------------------------------------------------

UPDATE public.ride_requests rr
SET accepted_at = least(coalesce(rr.started_at, rr.updated_at), coalesce(rr.updated_at, now()))
WHERE rr.accepted_at IS NULL
  AND upper(coalesce(rr.status::text, '')) IN
      ('ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'TRIP_ACTIVE', 'ACTIVE', 'STARTED', 'IN_PROGRESS');

UPDATE public.ride_requests rr
SET pickup_eta_minutes = ro.eta_minutes
FROM public.ride_offers ro
WHERE ro.id = rr.accepted_offer_id
  AND ro.pickup_distance_km IS NOT NULL
  AND rr.pickup_eta_minutes IS NULL
  AND upper(coalesce(rr.status::text, '')) IN
      ('ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'TRIP_ACTIVE', 'ACTIVE', 'STARTED', 'IN_PROGRESS');


-- ---------------------------------------------------------------------------
-- The radar view carries the anchor too, so the captain's dashboard needs no extra query.
-- Unchanged from 20260906120000 apart from accepted_at and pickup_eta_minutes.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.captain_radar_requests
WITH (security_barrier = true)
AS
SELECT
  rr.id,
  rr.rider_id,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lat ELSE NULL::numeric END AS origin_lat,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lng ELSE NULL::numeric END AS origin_lng,
  rr.destination_lat,
  rr.destination_lng,
  rr.origin_h3,
  rr.origin_h3 AS h3_cell,
  rr.destination_h3,
  rr.destination_address_ar,
  NULL::text AS destination_address_en,
  rr.destination_address_ar AS destination_address,
  rr.server_estimated_fare,
  rr.country_id,
  rr.status,
  rr.created_at,
  rr.accepted_offer_id,
  rr.accepted_captain_id,
  rr.final_fare,
  rr.arrived_at,
  rr.started_at,
  rr.completed_at,
  rr.updated_at,
  rr.origin_address,
  CASE
    WHEN rr.origin_google_maps_url IS NOT NULL
      AND rr.origin_google_maps_url !~* '(^|[?&](query|q)=)0([.]0+)?(,|%2[cC]|%20|[[:space:]])+0([.]0+)?([^0-9]|$)'
    THEN rr.origin_google_maps_url
    ELSE NULL::text
  END AS origin_google_maps_url,
  rr.estimated_distance_km,
  rr.estimated_duration_minutes,

  (
    SELECT p.rating
    FROM public.profiles p
    WHERE p.id = rr.rider_id
      AND coalesce(p.rating_count, 0) > 0
  ) AS rider_rating,

  (
    SELECT coalesce(p.rating_count, 0)
    FROM public.profiles p
    WHERE p.id = rr.rider_id
  ) AS rider_rating_count,

  (
    EXISTS (
      SELECT 1
      FROM public.rider_favorite_captains fav
      WHERE fav.rider_id = rr.rider_id
        AND fav.captain_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reviews rv
      WHERE rv.reviewer_id = rr.rider_id
        AND rv.reviewee_id = auth.uid()
        AND rv.gave_heart
    )
  ) AS rider_favorited_me,

  (
    SELECT count(*)
    FROM public.ride_requests done
    WHERE done.rider_id = rr.rider_id
      AND upper(coalesce(done.status::text, '')) = 'COMPLETED'
  ) AS rider_completed_trips,

  -- Appended, not slotted in beside arrived_at where they belong:
  -- CREATE OR REPLACE VIEW may only ADD columns at the END of the select list. Inserting
  -- them mid-list renames every column after the insertion point, and Postgres refuses:
  --   42P16: cannot change name of view column "arrived_at" to "accepted_at"
  -- Position carries no meaning to any reader here (both sides select by name), so keeping
  -- the replace cheap beats a DROP ... CASCADE for the sake of column order.
  rr.accepted_at,
  rr.pickup_eta_minutes

FROM public.ride_requests rr
WHERE
  (
    upper(coalesce(rr.status::text, '')) = 'PENDING'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND upper(coalesce(p.role::text, '')) IN ('DRIVER', 'CAPTAIN')
        AND (rr.country_id IS NULL OR p.country_id = rr.country_id)
    )
  )
  OR rr.accepted_captain_id = auth.uid();

NOTIFY pgrst, 'reload schema';


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- Every offer used to say 5. These should now spread with distance.
--   SELECT eta_minutes, pickup_distance_km, created_at
--   FROM public.ride_offers
--   ORDER BY created_at DESC
--   LIMIT 20;
--
--   -- The claimed minutes must be ~3x the measured km (ceil, capped at 45).
--   SELECT count(*) AS mismatched
--   FROM public.ride_offers
--   WHERE pickup_distance_km IS NOT NULL
--     AND eta_minutes <> least(45, greatest(1, ceil(pickup_distance_km * 3)));
--
--   -- No live trip should be left without an anchor.
--   SELECT count(*) AS missing_anchor
--   FROM public.ride_requests
--   WHERE accepted_at IS NULL
--     AND upper(coalesce(status::text, '')) IN
--         ('ACCEPTED','EN_ROUTE','ARRIVED','TRIP_ACTIVE','ACTIVE','STARTED','IN_PROGRESS');
--
--   -- And the anchor must never move once set: note accepted_at, advance the trip a step,
--   -- read it again.
--   SELECT id, status, accepted_at, pickup_eta_minutes, arrived_at, started_at,
--          estimated_duration_minutes
--   FROM public.ride_requests
--   ORDER BY created_at DESC
--   LIMIT 5;
