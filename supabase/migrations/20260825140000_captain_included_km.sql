-- A fourth tariff component: the distance the meter-opening charge already covers.
--
-- Until now every kilometre was billed, so a 1 km trip paid the flag-fall PLUS a full
-- kilometre. Captains asked for the normal taxi behaviour: the opening charge covers the
-- first N km, and per-km billing starts beyond it.
--
--   fare = base_fare + max(0, road_km - included_km) * price_per_km + minutes * price_per_min
--
-- NOT NULL DEFAULT 0 on purpose. Zero reproduces today's behaviour exactly, so no existing
-- captain's price changes and nobody is pushed back through the mandatory setup gate —
-- which is also why included_km is deliberately left OUT of the "complete tariff" test that
-- the other three components share.
--
-- Time is unaffected: minutes are billed from the first minute. Only distance has an
-- allowance, which is what was asked for. Say so if the meter should also include a few
-- free minutes — that is a separate decision, not an oversight here.


-- ---------------------------------------------------------------------------
-- 1. The column, on the captain's tariff and on the country seed.
-- ---------------------------------------------------------------------------

ALTER TABLE public.captain_profiles
  ADD COLUMN IF NOT EXISTS included_km numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.captain_profiles.included_km IS
  'المسافة المشمولة في فتحة العداد — km already covered by base_fare. Per-km billing starts beyond this.';

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS included_km numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.countries.included_km IS
  'Default included distance, used to seed market_average_tariff until enough captains have set their own.';

ALTER TABLE public.captain_profiles
  DROP CONSTRAINT IF EXISTS captain_profiles_tariff_positive;
ALTER TABLE public.captain_profiles
  ADD CONSTRAINT captain_profiles_tariff_positive CHECK (
    (base_fare IS NULL OR base_fare > 0)
    AND (price_per_km IS NULL OR price_per_km > 0)
    AND (price_per_min IS NULL OR price_per_min >= 0)
    AND included_km >= 0
  );


-- ---------------------------------------------------------------------------
-- 2. The market average carries the allowance too, so the reference fare and the captain's
--    own meter are built from the same formula. If only one side subtracted it, the ±15%
--    band would be comparing two different pricing models.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.market_average_tariff(p_country_id integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_country public.countries%rowtype;
  v_base numeric;
  v_per_km numeric;
  v_per_min numeric;
  v_included_km numeric;
  v_captains integer;
  v_threshold integer := public.market_sample_threshold();
BEGIN
  SELECT * INTO v_country FROM public.countries WHERE id = p_country_id;
  IF NOT found THEN
    RAISE EXCEPTION 'country_not_found';
  END IF;

  SELECT count(*),
         avg(cp.base_fare),
         avg(cp.price_per_km),
         avg(cp.price_per_min),
         avg(cp.included_km)
  INTO v_captains, v_base, v_per_km, v_per_min, v_included_km
  FROM public.captain_profiles cp
  JOIN public.profiles p ON p.id = cp.id
  WHERE p.country_id = p_country_id
    AND upper(coalesce(p.role::text, '')) IN ('CAPTAIN', 'DRIVER')
    AND cp.base_fare IS NOT NULL
    AND cp.price_per_km IS NOT NULL
    AND cp.price_per_min IS NOT NULL;

  IF coalesce(v_captains, 0) < v_threshold THEN
    v_base := v_country.base_fare;
    v_per_km := coalesce(v_country.per_km_rate, v_country.tariff_per_km, 0.35);
    v_per_min := coalesce(v_country.tariff_per_min, 0);
    v_included_km := v_country.included_km;
  END IF;

  v_base := greatest(coalesce(v_base, v_country.base_fare), v_country.min_base_fare);

  RETURN jsonb_build_object(
    'baseFare', round(v_base, 4),
    'perKm', round(coalesce(v_per_km, 0), 4),
    'perMin', round(coalesce(v_per_min, 0), 4),
    'includedKm', round(coalesce(v_included_km, 0), 2),
    'captainCount', coalesce(v_captains, 0),
    'threshold', v_threshold,
    'source', CASE WHEN coalesce(v_captains, 0) < v_threshold THEN 'country_seed' ELSE 'captain_average' END
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.market_average_tariff(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.market_average_tariff(integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. The reference fare bills only the distance beyond the allowance.
-- ---------------------------------------------------------------------------

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
  billable_km numeric;
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
  billable_km := greatest(0, road_km - (tariff->>'includedKm')::numeric);
  minutes := greatest(1, road_km * 2.2);
  base := (tariff->>'baseFare')::numeric;

  fare := base
        + billable_km * (tariff->>'perKm')::numeric
        + minutes * (tariff->>'perMin')::numeric;

  RETURN round(greatest(coalesce(cfg.min_fare, base), base, fare), 2);
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 4. The captain's own quote, same allowance.
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

  road_km := coalesce(public.trip_road_km(
    req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng, v_country_id
  ), 0);
  billable_km := greatest(0, road_km - coalesce(tariff.included_km, 0));
  minutes := greatest(1, road_km * 2.2);

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
    'roadKm', round(road_km, 2),
    'billableKm', round(billable_km, 2),
    'estimatedMinutes', round(minutes, 1),
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
-- 5. The setup modal needs the current value to prefill.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_captain_tariff_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  v_row record;
  v_floor numeric;
  v_market jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT cp.base_fare, cp.price_per_km, cp.price_per_min, cp.included_km,
         c.currency_ar, c.currency_en, c.id AS country_id
  INTO v_row
  FROM public.profiles p
  LEFT JOIN public.captain_profiles cp ON cp.id = p.id
  LEFT JOIN public.countries c ON c.id = p.country_id
  WHERE p.id = v_caller;

  IF NOT found THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_row.country_id IS NULL THEN
    v_floor := 1.00;
    v_market := NULL;
  ELSE
    v_floor := public.captain_base_fare_floor(v_row.country_id);
    v_market := public.market_average_tariff(v_row.country_id);
  END IF;

  RETURN jsonb_build_object(
    'baseFare', v_row.base_fare,
    'pricePerKm', v_row.price_per_km,
    'pricePerMin', v_row.price_per_min,
    'includedKm', coalesce(v_row.included_km, 0),
    'minBaseFare', v_floor,
    'minBaseFareSource', coalesce(v_market->>'source', 'country_seed'),
    'countryId', v_row.country_id,
    'currencyAr', v_row.currency_ar,
    'currencyEn', v_row.currency_en
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;


-- ---------------------------------------------------------------------------
-- 6. The receipt written on each offer bills the same way, and itemises the allowance so
--    the rider can see why a short trip cost only the opening charge.
--
--    Redefined here rather than in 20260823110000 (which introduced fare_breakdown) because
--    that migration runs first and cannot reference a column this one adds.
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

  road_km := coalesce(public.trip_road_km(
    req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng,
    coalesce(req.country_id, captain_profile.country_id)
  ), 0);
  minutes := greatest(1, road_km * 2.2);

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
      'roadKm', round(road_km, 2),
      'billableKm', round(billable_km, 2),
      'minutes', round(minutes, 1),
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
      'roadKm', round(road_km, 2),
      'minutes', round(minutes, 1),
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
