-- An offer's visibility window had a floor and no ceiling.
--
-- submit_ride_offer checks only the bottom:
--
--   IF p_wait_seconds IS NULL OR p_wait_seconds < 5 THEN
--     RAISE EXCEPTION 'invalid_wait_seconds';
--
-- and the captain's sheet matched it: the `+` button incremented without limit and the text
-- input took any digits. So offers were reaching riders with windows in the thousands of
-- seconds — one observed at 5548, which the rider's card rendered as "5548 ث" beside a
-- progress bar that visibly never moved, and which kept the offer alive in the auction for
-- an hour and a half.
--
-- The client now clamps at 120 (MAX_OFFER_WAIT_SECONDS in
-- src/features/captain/hooks/use-driver-transactions.ts), but a client bound is a courtesy,
-- not a rule. This is the rule.
--
--
-- WHY A CLAMP AND NOT AN EXCEPTION
--
-- The floor raises. This does not, deliberately: an over-long window is a captain nudging a
-- stepper too far, not an attack, and there is nothing for them to fix. Refusing the offer
-- outright would cost them a fare over a field they cannot see the limit of from the sheet
-- they were on. The offer is still the price they set, shown for as long as the auction
-- allows.
--
-- Attached to the trigger added in 20260907090000 rather than a second BEFORE INSERT
-- trigger, so the order two of them would fire in never becomes a question.


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
  -- Mirrors MIN/MAX_OFFER_WAIT_SECONDS on the client. Change together.
  k_min_wait_seconds constant integer := 5;
  k_max_wait_seconds constant integer := 120;
BEGIN
  -- The offer window, bounded both ways.
  NEW.wait_seconds := least(
    k_max_wait_seconds,
    greatest(k_min_wait_seconds, coalesce(NEW.wait_seconds, k_min_wait_seconds))
  );

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
    -- 5) and pickup_distance_km NULL, rather than inventing a distance. The client reads a
    -- NULL pickup_distance_km as "this ETA was never measured" and ignores the 5.
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

-- Recreated so the trigger is guaranteed to point at the definition above even if an older
-- migration is replayed out of order.
DROP TRIGGER IF EXISTS ride_offers_stamp_pickup_eta ON public.ride_offers;
CREATE TRIGGER ride_offers_stamp_pickup_eta
BEFORE INSERT ON public.ride_offers
FOR EACH ROW EXECUTE FUNCTION public.stamp_ride_offer_pickup_eta();


-- ---------------------------------------------------------------------------
-- Retire the windows already out there.
--
-- A PENDING offer with a 5548-second window is still counting down on some rider's screen.
-- Only PENDING rows: an ACCEPTED or REJECTED offer is a historical record of what was
-- shown, and rewriting it would falsify that.
-- ---------------------------------------------------------------------------

UPDATE public.ride_offers
SET wait_seconds = 120,
    updated_at = now()
WHERE wait_seconds > 120
  AND upper(coalesce(status::text, 'PENDING')) = 'PENDING';

NOTIFY pgrst, 'reload schema';


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- Must be 0 for live offers.
--   SELECT count(*) AS unbounded_live
--   FROM public.ride_offers
--   WHERE wait_seconds > 120
--     AND upper(coalesce(status::text, 'PENDING')) = 'PENDING';
--
--   -- And the clamp must hold on new inserts whatever the RPC is passed.
--   SELECT min(wait_seconds) AS lowest, max(wait_seconds) AS highest
--   FROM public.ride_offers
--   WHERE created_at > now() - interval '1 day';
