-- Migration for passenger bids sorting: Store pricing preference and rank offers.

BEGIN;

-- 1. Add pricing_preference to ride_requests
ALTER TABLE IF EXISTS public.ride_requests 
ADD COLUMN IF NOT EXISTS pricing_preference text DEFAULT 'FREE';

-- 2. Add pricing_mode to ride_offers
ALTER TABLE IF EXISTS public.ride_offers 
ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'FREE';

-- 3. Update submit_ride_offer to accept pricing_mode
CREATE OR REPLACE FUNCTION public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric,
  p_wait_seconds integer DEFAULT 5,
  p_pricing_mode text DEFAULT 'FREE'
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
  is_above_band boolean := false;
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

    is_above_band := p_offer_price > ceiling_price;
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
      'isAboveBand', is_above_band,
      'tier', v_tier::text,
      'adjustment', round(p_offer_price - meter_fare, 2),
      'offeredFare', p_offer_price,
      'minTripFare', cfg.min_fare,
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
      'isAboveBand', is_above_band,
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
    wait_seconds, fare_breakdown, status, created_at, updated_at,
    pricing_mode
  )
  VALUES (
    p_request_id, auth.uid(), p_offer_price, p_offer_price, 5,
    p_wait_seconds, breakdown, 'PENDING', now(), now(),
    p_pricing_mode
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
    'status', new_offer.status,
    'pricing_mode', new_offer.pricing_mode
  );
END;
$fn$;
GRANT EXECUTE ON FUNCTION public.submit_ride_offer(uuid, numeric, integer, text) TO authenticated;

-- 4. Create RPC function to get sorted bids for the passenger
CREATE OR REPLACE FUNCTION public.get_passenger_bids(p_request_id uuid)
RETURNS SETOF public.ride_offers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pricing_preference text;
    v_rider_id uuid;
BEGIN
    -- Get the request's pricing preference and rider_id
    SELECT pricing_preference, rider_id INTO v_pricing_preference, v_rider_id
    FROM public.ride_requests
    WHERE id = p_request_id;

    -- Return the top 9 offers based on the sorting criteria
    RETURN QUERY
    SELECT ro.*
    FROM public.ride_offers ro
    LEFT JOIN public.profiles p ON p.id = ro.captain_id
    LEFT JOIN public.rider_favorite_captains f ON f.captain_id = ro.captain_id 
        AND f.rider_id = v_rider_id
    WHERE ro.request_id = p_request_id
    ORDER BY
        -- 1. Mode matching (True comes first)
        (ro.pricing_mode = v_pricing_preference) DESC,
        -- 2. Favorite captain (True comes first)
        (f.captain_id IS NOT NULL) DESC,
        -- 3. Highest rating
        COALESCE(p.rating, p.trust_score, p.trust_rating, 0) DESC,
        -- 4. General fallback (oldest offer first)
        ro.created_at ASC
    LIMIT 9;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_passenger_bids(uuid) TO authenticated;

COMMIT;
