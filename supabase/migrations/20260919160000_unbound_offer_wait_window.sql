-- Migration: Unbound Offer Wait Window & Default 90s
-- 1. Sets default offer wait window to 90s.
-- 2. Removes upper limit on wait_seconds in stamp_ride_offer_pickup_eta trigger.
-- 3. Retains minimum 5s requirement.

BEGIN;

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
  k_min_wait_seconds constant integer := 5;
  k_default_wait_seconds constant integer := 90;
BEGIN
  -- Offer wait duration: minimum 5s, default 90s, no upper ceiling.
  NEW.wait_seconds := greatest(
    k_min_wait_seconds,
    coalesce(NEW.wait_seconds, k_default_wait_seconds)
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

-- Update submit_ride_offer default wait_seconds to 90
CREATE OR REPLACE FUNCTION public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric,
  p_wait_seconds integer DEFAULT 90,
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

  -- Verify captain account is APPROVED
  -- Fetch captain tariff profile
  SELECT * INTO tariff FROM public.captain_profiles WHERE id = auth.uid();

  IF coalesce(tariff.verification_status, 'PENDING') <> 'APPROVED' THEN
    RAISE EXCEPTION 'captain_not_approved'
      USING HINT = 'الحساب قيد المراجعة والتدقيق، لا يمكن تقديم عروض قبل الموافقة.';
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

  -- Mandatory location check to prevent bypass
  SELECT * INTO captain_location
  FROM public.captain_locations
  WHERE captain_id = auth.uid();

  IF NOT found OR captain_location.location_lat IS NULL OR captain_location.location_lng IS NULL THEN
    RAISE EXCEPTION 'captain_location_required'
      USING HINT = 'يجب تفعيل مشاركة الموقع الجغرافي لتقديم عرض على هذا الطلب.';
  END IF;

  IF req.origin_lat IS NOT NULL AND req.origin_lng IS NOT NULL THEN
    distance_km := 6371 * 2 * asin(sqrt(
      power(sin(radians(req.origin_lat - captain_location.location_lat) / 2), 2) +
      cos(radians(captain_location.location_lat)) * cos(radians(req.origin_lat)) *
      power(sin(radians(req.origin_lng - captain_location.location_lng) / 2), 2)
    ));

    IF distance_km > max_distance_km THEN
      RAISE EXCEPTION 'captain_too_far_from_pickup'
        USING HINT = 'أنت خارج نطاق الرادار المسموح (أكثر من 9 كم من نقطة الانطلاق).';
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

REVOKE ALL ON FUNCTION public.submit_ride_offer(uuid, numeric, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_ride_offer(uuid, numeric, integer, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

