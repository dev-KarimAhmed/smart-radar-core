-- The captain's own meter prices the trip; the market average only polices it.
--
-- Each captain declares three components for themselves (captain_profiles.base_fare,
-- price_per_km, price_per_min). Those are what compute the fare for a given trip. The
-- market average from 20260822180000 stays exactly what it was described as — a protection
-- band, ±15% around it (more headroom for high ranks), nothing more.
--
-- Until now the captain's tariff still did not price anything: bidding-proposal-sheet
-- started from the market reference and let the captain add a premium on top, which is the
-- opposite arrangement. This migration adds the server-side quote the sheet needs.
--
-- Why server-side: the fare decides money, and the captain's client should not be the one
-- computing it. It also lets the quote fall back to the real coordinates when a request
-- has no stored distance (89 of 226 existing requests have one).


-- ---------------------------------------------------------------------------
-- 1. One definition of trip distance, shared by both sides of the band.
--
--    The band compares the captain's fare against the market fare, so both MUST measure
--    distance identically or the ±15% is comparing different geometry. Extracted here so
--    they cannot drift apart. Deliberately NOT using ride_requests.estimated_distance_km:
--    that value is written by the client and its basis (straight line vs road) is not
--    guaranteed to match what calculate_server_fare computes.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trip_road_km(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric,
  p_country_id integer
) RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  earth_radius_km constant numeric := 6371;
  dlat numeric := radians(lat2 - lat1);
  dlng numeric := radians(lng2 - lng1);
  a numeric;
  straight_km numeric;
  factor numeric;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;

  a := power(sin(dlat / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(dlng / 2), 2);
  straight_km := 2 * earth_radius_km * atan2(sqrt(a), sqrt(greatest(0, 1 - a)));

  SELECT coalesce(c.tortuosity_factor, 1.3)
  INTO factor
  FROM public.countries c
  WHERE c.id = p_country_id;

  RETURN straight_km * coalesce(factor, 1.3);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.trip_road_km(numeric, numeric, numeric, numeric, integer) TO authenticated;


-- Re-point calculate_server_fare at the shared helper. Same result as 20260822180000,
-- just no longer duplicating the haversine.
CREATE OR REPLACE FUNCTION public.calculate_server_fare(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric,
  p_country_id integer
) RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  cfg public.countries%rowtype;
  tariff jsonb;
  road_km numeric;
  minutes numeric;
  base numeric;
  fare numeric;
BEGIN
  IF p_country_id IS NULL THEN
    RAISE EXCEPTION 'country_id_required';
  END IF;

  SELECT * INTO cfg FROM public.countries WHERE id = p_country_id;
  IF NOT found THEN
    RAISE EXCEPTION 'country_not_found';
  END IF;

  tariff := public.market_average_tariff(p_country_id);
  road_km := coalesce(public.trip_road_km(lat1, lng1, lat2, lng2, p_country_id), 0);
  minutes := greatest(1, road_km * 2.2);
  base := (tariff->>'baseFare')::numeric;

  fare := base
        + road_km * (tariff->>'perKm')::numeric
        + minutes * (tariff->>'perMin')::numeric;

  RETURN round(greatest(coalesce(cfg.min_fare, base), base, fare), 2);
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 2. The captain's meter reading for one request, plus the band it must land in.
--
--    This is what the bidding sheet opens with: the price the captain's OWN tariff
--    produces for this trip, not the market reference.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.captain_offer_quote(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  captain_profile public.profiles%rowtype;
  tariff public.captain_profiles%rowtype;
  req public.ride_requests%rowtype;
  cfg public.countries%rowtype;
  v_country_id integer;
  road_km numeric;
  minutes numeric;
  captain_fare numeric;
  market_fare numeric;
  band jsonb;
  floor_price numeric;
  ceiling_price numeric;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO captain_profile FROM public.profiles WHERE id = v_caller;
  IF NOT found OR upper(coalesce(captain_profile.role::text, '')) NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  SELECT * INTO tariff FROM public.captain_profiles WHERE id = v_caller;
  IF NOT found
     OR tariff.base_fare IS NULL
     OR tariff.price_per_km IS NULL
     OR tariff.price_per_min IS NULL
  THEN
    -- The mandatory setup modal has not been completed; there is no meter to read.
    RAISE EXCEPTION 'captain_tariff_required';
  END IF;

  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id;
  IF NOT found THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  v_country_id := coalesce(req.country_id, captain_profile.country_id);
  SELECT * INTO cfg FROM public.countries WHERE id = v_country_id;

  road_km := coalesce(public.trip_road_km(
    req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng, v_country_id
  ), 0);
  minutes := greatest(1, road_km * 2.2);

  captain_fare := tariff.base_fare
                + road_km * tariff.price_per_km
                + minutes * tariff.price_per_min;

  -- The regulated minimums bind the captain's own meter too.
  captain_fare := round(greatest(coalesce(cfg.min_fare, tariff.base_fare), tariff.base_fare, captain_fare), 2);

  market_fare := req.server_estimated_fare;
  band := public.offer_band_for_rank(coalesce(captain_profile.tier, 'BRONZE'::public.captain_tier));

  IF market_fare IS NOT NULL AND market_fare > 0 THEN
    floor_price := round(market_fare * (band->>'floorFactor')::numeric, 2);
    ceiling_price := round(market_fare * (band->>'ceilingFactor')::numeric, 2);
  END IF;

  RETURN jsonb_build_object(
    -- What this captain's tariff says the trip costs.
    'captainFare', captain_fare,
    -- The market average reference, and the band around it the offer must land in.
    'marketFare', market_fare,
    'floorPrice', floor_price,
    'ceilingPrice', ceiling_price,
    -- captainFare clamped into the band: what the sheet should open with, so a captain
    -- whose tariff sits outside the market is not shown a price the RPC would refuse.
    'suggestedFare', CASE
      WHEN floor_price IS NULL THEN captain_fare
      ELSE least(greatest(captain_fare, floor_price), ceiling_price)
    END,
    'isOutsideBand', floor_price IS NOT NULL
      AND (captain_fare < floor_price OR captain_fare > ceiling_price),
    'tier', coalesce(captain_profile.tier, 'BRONZE'::public.captain_tier)::text,
    'roadKm', round(road_km, 2),
    'estimatedMinutes', round(minutes, 1),
    'tariff', jsonb_build_object(
      'baseFare', tariff.base_fare,
      'perKm', tariff.price_per_km,
      'perMin', tariff.price_per_min
    )
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.captain_offer_quote(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_offer_quote(uuid) TO authenticated;
