-- Expand captain offer wait seconds upper bound from 120 to 300 seconds (5 minutes)
-- Matches MAX_OFFER_WAIT_SECONDS in src/features/captain/hooks/use-driver-transactions.ts

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
  k_minutes_per_km constant numeric := 3;
  k_min_minutes constant integer := 1;
  k_max_minutes constant integer := 45;
  -- Mirrors MIN/MAX_OFFER_WAIT_SECONDS on the client. Change together.
  k_min_wait_seconds constant integer := 5;
  k_max_wait_seconds constant integer := 300;
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

NOTIFY pgrst, 'reload schema';

