-- The fare is priced on the real route, not a flat 27 km/h guess.
--
-- THE DEFECT
--
-- The app fetches a genuine road route from OSRM (src/lib/road-route.ts) and stores both
-- its distance and its duration on the request — ride_requests.estimated_distance_km and
-- estimated_duration_minutes. Pricing ignored both and recomputed:
--
--   road_km = haversine * tortuosity_factor
--   minutes = road_km * 2.2
--
-- 2.2 min/km is a constant, so every trip was billed as if it ran at exactly 27.3 km/h —
-- a motorway run and a crawl through downtown priced identically. The rider was shown the
-- real route ("10 km · 15 min") and charged for the synthetic one ("13.5 km · 29.7 min").
-- At the 1.00/min a live captain has set, that is ~15 EGP of invented time on one trip.
--
-- It only diverged when OSRM answered inside its 1.5s timeout; on fallback the client uses
-- the very same haversine * factor and * 2.2, so everything agreed. That is why it looked
-- intermittent in testing.
--
-- THE FIX
--
-- Stored route metrics win; the old computation stays as the fallback for a request that
-- has none. Every pricing path resolves them through ONE helper, because the ±15% band
-- compares the captain's meter against the market reference — if the two sides ever
-- measured distance or time differently, the band would be policing a comparison that does
-- not exist.


-- ---------------------------------------------------------------------------
-- 1. The single resolver. Stored value if usable, computed estimate otherwise.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_trip_metrics(
  p_stored_km numeric,
  p_stored_minutes numeric,
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric,
  p_country_id integer
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  v_road_km numeric;
  v_minutes numeric;
  v_km_source text;
  v_minutes_source text;
BEGIN
  IF p_stored_km IS NOT NULL AND p_stored_km > 0 THEN
    v_road_km := p_stored_km;
    v_km_source := 'route';
  ELSE
    v_road_km := coalesce(public.trip_road_km(lat1, lng1, lat2, lng2, p_country_id), 0);
    v_km_source := 'estimate';
  END IF;

  IF p_stored_minutes IS NOT NULL AND p_stored_minutes > 0 THEN
    v_minutes := p_stored_minutes;
    v_minutes_source := 'route';
  ELSE
    -- 2.2 min/km ~ 27 km/h. Only reached when the router gave us nothing.
    v_minutes := greatest(1, v_road_km * 2.2);
    v_minutes_source := 'estimate';
  END IF;

  RETURN jsonb_build_object(
    'roadKm', round(v_road_km, 2),
    'minutes', round(greatest(1, v_minutes), 1),
    'kmSource', v_km_source,
    'minutesSource', v_minutes_source
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.resolve_trip_metrics(numeric, numeric, numeric, numeric, numeric, numeric, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. calculate_server_fare takes the route from its caller.
--
--    This runs BEFORE the request row exists — the rider is being quoted — so the metrics
--    cannot be read from the database. The client has them already: the same hook that
--    calls this RPC fetched the OSRM route. The old 5-argument form is dropped rather than
--    left alongside, because two overloads both callable with 5 arguments is ambiguous.
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.calculate_server_fare(numeric, numeric, numeric, numeric, integer);

CREATE OR REPLACE FUNCTION public.calculate_server_fare(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric,
  p_country_id integer,
  p_road_km numeric DEFAULT NULL,
  p_minutes numeric DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  cfg public.countries%rowtype;
  tariff jsonb;
  metrics jsonb;
  billable_km numeric;
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
  metrics := public.resolve_trip_metrics(p_road_km, p_minutes, lat1, lng1, lat2, lng2, p_country_id);

  billable_km := greatest(0, (metrics->>'roadKm')::numeric - (tariff->>'includedKm')::numeric);
  base := (tariff->>'baseFare')::numeric;

  fare := base
        + billable_km * (tariff->>'perKm')::numeric
        + (metrics->>'minutes')::numeric * (tariff->>'perMin')::numeric;

  RETURN round(greatest(coalesce(cfg.min_fare, base), base, fare), 2);
END;
$fn$;

REVOKE ALL ON FUNCTION public.calculate_server_fare(numeric, numeric, numeric, numeric, integer, numeric, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_server_fare(numeric, numeric, numeric, numeric, integer, numeric, numeric) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. The captain's meter reads the metrics off the request.
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
  metrics jsonb;
  road_km numeric;
  billable_km numeric;
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
    RAISE EXCEPTION 'captain_tariff_required';
  END IF;

  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id;
  IF NOT found THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  v_country_id := coalesce(req.country_id, captain_profile.country_id);
  SELECT * INTO cfg FROM public.countries WHERE id = v_country_id;

  metrics := public.resolve_trip_metrics(
    req.estimated_distance_km, req.estimated_duration_minutes,
    req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng, v_country_id
  );
  road_km := (metrics->>'roadKm')::numeric;
  minutes := (metrics->>'minutes')::numeric;
  billable_km := greatest(0, road_km - coalesce(tariff.included_km, 0));

  captain_fare := tariff.base_fare
                + billable_km * tariff.price_per_km
                + minutes * tariff.price_per_min;

  captain_fare := round(greatest(coalesce(cfg.min_fare, tariff.base_fare), tariff.base_fare, captain_fare), 2);

  market_fare := req.server_estimated_fare;
  band := public.offer_band_for_rank(coalesce(captain_profile.tier, 'BRONZE'::public.captain_tier));

  IF market_fare IS NOT NULL AND market_fare > 0 THEN
    floor_price := round(market_fare * (band->>'floorFactor')::numeric, 2);
    ceiling_price := round(market_fare * (band->>'ceilingFactor')::numeric, 2);
  END IF;

  RETURN jsonb_build_object(
    'captainFare', captain_fare,
    'marketFare', market_fare,
    'floorPrice', floor_price,
    'ceilingPrice', ceiling_price,
    'suggestedFare', CASE
      WHEN floor_price IS NULL THEN captain_fare
      ELSE least(greatest(captain_fare, floor_price), ceiling_price)
    END,
    'isOutsideBand', floor_price IS NOT NULL
      AND (captain_fare < floor_price OR captain_fare > ceiling_price),
    'tier', coalesce(captain_profile.tier, 'BRONZE'::public.captain_tier)::text,
    'roadKm', road_km,
    'billableKm', round(billable_km, 2),
    'estimatedMinutes', minutes,
    'metricsSource', metrics,
    'tariff', jsonb_build_object(
      'baseFare', tariff.base_fare,
      'perKm', tariff.price_per_km,
      'perMin', tariff.price_per_min,
      'includedKm', coalesce(tariff.included_km, 0)
    )
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.captain_offer_quote(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_offer_quote(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. The receipt bills, and itemises, the same real metrics — and records which of them
--    came from the router so a disputed fare can be traced.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric,
  p_wait_seconds integer DEFAULT 5
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  req public.ride_requests%rowtype;
  captain_profile public.profiles%rowtype;
  captain_location public.captain_locations%rowtype;
  tariff public.captain_profiles%rowtype;
  cfg public.countries%rowtype;
  distance_km numeric;
  new_offer public.ride_offers%rowtype;
  max_distance_km constant numeric := 9;
  band jsonb;
  reference_fare numeric;
  floor_price numeric;
  ceiling_price numeric;
  v_tier public.captain_tier;
  metrics jsonb;
  road_km numeric;
  billable_km numeric;
  minutes numeric;
  km_charge numeric;
  min_charge numeric;
  meter_fare numeric;
  breakdown jsonb;
BEGIN
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  IF p_offer_price IS NULL OR p_offer_price <= 0 THEN
    RAISE EXCEPTION 'invalid_offer_price';
  END IF;

  IF p_wait_seconds IS NULL OR p_wait_seconds < 5 THEN
    RAISE EXCEPTION 'invalid_wait_seconds';
  END IF;

  SELECT * INTO captain_profile FROM public.profiles WHERE id = auth.uid();

  IF NOT found OR upper(coalesce(captain_profile.role::text, '')) NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT found THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  IF upper(coalesce(req.status::text, '')) NOT IN ('PENDING', 'RECEIVING_OFFERS') THEN
    RAISE EXCEPTION 'ride_request_not_pending';
  END IF;

  IF req.country_id IS NOT NULL
    AND captain_profile.country_id IS NOT NULL
    AND req.country_id <> captain_profile.country_id
  THEN
    RAISE EXCEPTION 'request_outside_captain_country';
  END IF;

  SELECT * INTO captain_location
  FROM public.captain_locations
  WHERE captain_id = auth.uid();

  IF found THEN
    distance_km := 6371 * 2 * asin(sqrt(
      power(sin(radians(req.origin_lat - captain_location.location_lat) / 2), 2) +
      cos(radians(captain_location.location_lat)) * cos(radians(req.origin_lat)) *
      power(sin(radians(req.origin_lng - captain_location.location_lng) / 2), 2)
    ));

    IF distance_km > max_distance_km THEN
      RAISE EXCEPTION 'captain_too_far_from_pickup';
    END IF;
  END IF;

  reference_fare := req.server_estimated_fare;
  v_tier := coalesce(captain_profile.tier, 'BRONZE'::public.captain_tier);
  band := public.offer_band_for_rank(v_tier);

  IF reference_fare IS NOT NULL AND reference_fare > 0 THEN
    floor_price := round(reference_fare * (band->>'floorFactor')::numeric, 2);
    ceiling_price := round(reference_fare * (band->>'ceilingFactor')::numeric, 2);

    IF p_offer_price < floor_price THEN
      RAISE EXCEPTION 'offer_below_market_floor: %', floor_price
        USING HINT = 'السعر أقل من الحد المسموح مقابل سعر السوق';
    END IF;

    IF p_offer_price > ceiling_price THEN
      RAISE EXCEPTION 'offer_above_rank_ceiling: %', ceiling_price
        USING HINT = 'السعر أعلى من السقف المسموح لرتبتك';
    END IF;
  END IF;

  SELECT * INTO tariff FROM public.captain_profiles WHERE id = auth.uid();
  SELECT * INTO cfg FROM public.countries WHERE id = coalesce(req.country_id, captain_profile.country_id);

  metrics := public.resolve_trip_metrics(
    req.estimated_distance_km, req.estimated_duration_minutes,
    req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng,
    coalesce(req.country_id, captain_profile.country_id)
  );
  road_km := (metrics->>'roadKm')::numeric;
  minutes := (metrics->>'minutes')::numeric;

  IF tariff.base_fare IS NOT NULL AND tariff.price_per_km IS NOT NULL AND tariff.price_per_min IS NOT NULL THEN
    billable_km := greatest(0, road_km - coalesce(tariff.included_km, 0));
    km_charge := round(billable_km * tariff.price_per_km, 2);
    min_charge := round(minutes * tariff.price_per_min, 2);
    meter_fare := round(greatest(
      coalesce(cfg.min_fare, tariff.base_fare),
      tariff.base_fare,
      tariff.base_fare + billable_km * tariff.price_per_km + minutes * tariff.price_per_min
    ), 2);

    breakdown := jsonb_build_object(
      'baseFare', tariff.base_fare,
      'perKm', tariff.price_per_km,
      'perMin', tariff.price_per_min,
      'includedKm', coalesce(tariff.included_km, 0),
      'roadKm', road_km,
      'billableKm', round(billable_km, 2),
      'minutes', minutes,
      'kmCharge', km_charge,
      'minCharge', min_charge,
      'meterFare', meter_fare,
      'marketFare', reference_fare,
      'floorPrice', floor_price,
      'ceilingPrice', ceiling_price,
      'tier', v_tier::text,
      'adjustment', round(p_offer_price - meter_fare, 2),
      'offeredFare', p_offer_price,
      'minTripFare', cfg.min_fare,
      -- 'route' or 'estimate' per metric, so a disputed fare can be traced back to whether
      -- the router answered for that request.
      'kmSource', metrics->>'kmSource',
      'minutesSource', metrics->>'minutesSource',
      'currencyAr', cfg.currency_ar,
      'currencyEn', cfg.currency_en
    );
  ELSE
    breakdown := jsonb_build_object(
      'marketFare', reference_fare,
      'floorPrice', floor_price,
      'ceilingPrice', ceiling_price,
      'tier', v_tier::text,
      'offeredFare', p_offer_price,
      'roadKm', road_km,
      'minutes', minutes,
      'kmSource', metrics->>'kmSource',
      'minutesSource', metrics->>'minutesSource',
      'tariffMissing', true,
      'currencyAr', cfg.currency_ar,
      'currencyEn', cfg.currency_en
    );
  END IF;

  INSERT INTO public.ride_offers (
    request_id, captain_id, offered_fare, offer_price, eta_minutes,
    wait_seconds, fare_breakdown, status, created_at, updated_at
  )
  VALUES (
    p_request_id, auth.uid(), p_offer_price, p_offer_price, 5,
    p_wait_seconds, breakdown, 'PENDING', now(), now()
  )
  RETURNING * INTO new_offer;

  RETURN jsonb_build_object(
    'id', new_offer.id,
    'request_id', new_offer.request_id,
    'captain_id', new_offer.captain_id,
    'offer_price', coalesce(new_offer.offer_price, new_offer.offered_fare),
    'eta_minutes', new_offer.eta_minutes,
    'wait_seconds', new_offer.wait_seconds,
    'fare_breakdown', new_offer.fare_breakdown,
    'status', new_offer.status
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.submit_ride_offer(uuid, numeric, integer) TO authenticated;
