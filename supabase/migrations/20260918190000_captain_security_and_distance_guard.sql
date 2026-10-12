-- Migration: Captain Sector Security & Distance Guard
-- 1. Requires captain verification approval before activation (set_captain_status)
-- 2. Requires approved verification and valid recorded location for ride offers (submit_ride_offer)
-- Prevents spoofing, unverified access, and distance guard bypass.

BEGIN;

-- 1. Secure set_captain_status with verification check
CREATE OR REPLACE FUNCTION public.set_captain_status(p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_status text := lower(trim(coalesce(p_status, '')));
  captain_role text;
  status_value text;
  wallet_minutes numeric := 0;
  wallet_expiry timestamptz;
  has_bundle boolean := false;
  v_verification_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF requested_status NOT IN ('active', 'idle') THEN
    RAISE EXCEPTION 'invalid_captain_status';
  END IF;

  -- Existing projects store profiles.status as public.user_status, not text.
  SELECT e.enumlabel
    INTO status_value
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE n.nspname = 'public'
    AND t.typname = 'user_status'
    AND lower(e.enumlabel) = requested_status
  LIMIT 1;

  IF status_value IS NULL THEN
    RAISE EXCEPTION 'invalid_captain_status';
  END IF;

  SELECT upper(p.role::text)
    INTO captain_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF captain_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_role_required';
  END IF;

  IF requested_status = 'active' THEN
    -- Verify captain profile is APPROVED before allowing active status
    SELECT verification_status
      INTO v_verification_status
    FROM public.captain_profiles
    WHERE id = auth.uid();

    IF coalesce(v_verification_status, 'PENDING') <> 'APPROVED' THEN
      RAISE EXCEPTION 'captain_not_approved'
        USING HINT = 'الحساب قيد المراجعة والتدقيق، لا يمكن تفعيل الرادار قبل الموافقة.';
    END IF;

    SELECT
      greatest(0, coalesce(w.paid_minutes_remaining, 0))
        + greatest(0, coalesce(w.bonus_minutes_remaining, 0)),
      w.time_bundle_expires_at
    INTO wallet_minutes, wallet_expiry
    FROM public.wallet_accounts w
    WHERE w.profile_id = auth.uid();

    has_bundle := wallet_minutes > 0
      AND (wallet_expiry IS NULL OR wallet_expiry > clock_timestamp());

    IF NOT has_bundle THEN
      RAISE EXCEPTION 'captain_time_bundle_required';
    END IF;
  END IF;

  UPDATE public.profiles
  SET status = status_value::public.user_status,
      updated_at = clock_timestamp()
  WHERE id = auth.uid();

  IF NOT found THEN
    RAISE EXCEPTION 'captain_profile_not_found';
  END IF;

  RETURN jsonb_build_object(
    'profile_id', auth.uid(),
    'status', requested_status,
    'wallet_minutes', wallet_minutes,
    'time_bundle_expires_at', wallet_expiry,
    'has_active_bundle', CASE WHEN requested_status = 'idle' THEN true ELSE has_bundle END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_captain_status(text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_captain_status(text) TO authenticated;


-- 2. Secure submit_ride_offer with mandatory location and verification
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

