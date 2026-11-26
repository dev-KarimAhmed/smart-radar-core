BEGIN;

-- =============================================================================
-- Delay captain offers by 3 minutes (180s) when the captain's tariff or
-- submitted offer price is below the market average.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric,
  p_wait_seconds integer DEFAULT 90,
  p_pricing_mode text DEFAULT 'FREE'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
  is_below_floor boolean := false;
  v_pricing_mode text := upper(coalesce(nullif(trim(p_pricing_mode), ''), 'FREE'));
  v_market_avg jsonb;
  v_market_base numeric := 0;
  v_market_km numeric := 0;
  v_market_min numeric := 0;
  is_below_market boolean := false;
  visibility_delay_seconds integer := 0;
  v_visible_at timestamptz := null;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  IF p_offer_price IS NULL OR p_offer_price <= 0 THEN
    RAISE EXCEPTION 'invalid_offer_price';
  END IF;

  IF p_wait_seconds IS NULL OR p_wait_seconds < 5 THEN
    RAISE EXCEPTION 'invalid_wait_seconds';
  END IF;

  IF v_pricing_mode NOT IN ('FREE', 'APP', 'TAXI') THEN
    RAISE EXCEPTION 'invalid_pricing_mode';
  END IF;

  SELECT * INTO captain_profile FROM public.profiles WHERE id = auth.uid();

  IF NOT FOUND OR upper(coalesce(captain_profile.role::text, '')) NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  IF upper(coalesce(captain_profile.status::text, '')) IN ('BANNED', 'SUSPENDED') THEN
    RAISE EXCEPTION 'captain_account_restricted';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('captain_booking:' || auth.uid()::text));

  IF EXISTS (
    SELECT 1
    FROM public.ride_requests active_rr
    WHERE active_rr.accepted_captain_id = auth.uid()
      AND upper(coalesce(active_rr.status::text, '')) IN (
        'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'STARTED', 'TRIP_ACTIVE', 'ACTIVE', 'IN_PROGRESS'
      )
      AND coalesce(active_rr.started_at, active_rr.accepted_at, active_rr.updated_at, active_rr.created_at, clock_timestamp())
          >= clock_timestamp() - interval '4 hours'
  ) THEN
    RAISE EXCEPTION 'captain_already_busy';
  END IF;

  SELECT * INTO tariff FROM public.captain_profiles WHERE id = auth.uid();
  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
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

  IF EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE (blocker_id = req.rider_id AND blocked_id = auth.uid())
       OR (blocker_id = auth.uid() AND blocked_id = req.rider_id)
  ) THEN
    RAISE EXCEPTION 'user_block_active'
      USING HINT = 'لا يمكن تقديم عرض لوجود حظر نشط بينك وبين الراكب.';
  END IF;

  SELECT * INTO captain_location
  FROM public.captain_locations
  WHERE captain_id = auth.uid();

  IF NOT FOUND OR captain_location.location_lat IS NULL OR captain_location.location_lng IS NULL THEN
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
    is_below_floor := p_offer_price < floor_price;
    is_above_band := p_offer_price > ceiling_price;
  END IF;

  -- Check whether captain tariff or offer price is below market average
  BEGIN
    v_market_avg := public.market_average_tariff(
      coalesce(req.country_id, captain_profile.country_id),
      captain_profile.governorate_id
    );
    v_market_base := coalesce((v_market_avg->>'baseFare')::numeric, 0);
    v_market_km := coalesce((v_market_avg->>'perKm')::numeric, 0);
    v_market_min := coalesce((v_market_avg->>'perMin')::numeric, 0);
  EXCEPTION WHEN OTHERS THEN
    v_market_base := 0;
    v_market_km := 0;
    v_market_min := 0;
  END;

  IF (
    (v_market_base > 0 AND tariff.base_fare IS NOT NULL AND tariff.base_fare < v_market_base)
    OR (v_market_km > 0 AND tariff.price_per_km IS NOT NULL AND tariff.price_per_km < v_market_km)
    OR (v_market_min > 0 AND tariff.price_per_min IS NOT NULL AND tariff.price_per_min < v_market_min)
    OR (reference_fare IS NOT NULL AND reference_fare > 0 AND p_offer_price < reference_fare)
  ) THEN
    is_below_market := true;
    visibility_delay_seconds := 180;
    v_visible_at := now() + interval '180 seconds';
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
      'isBelowFloor', is_below_floor,
      'isBelowMarket', is_below_market,
      'visibilityDelaySeconds', visibility_delay_seconds,
      'visibleAt', CASE WHEN v_visible_at IS NOT NULL THEN to_char(v_visible_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
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
      'isBelowFloor', is_below_floor,
      'isBelowMarket', is_below_market,
      'visibilityDelaySeconds', visibility_delay_seconds,
      'visibleAt', CASE WHEN v_visible_at IS NOT NULL THEN to_char(v_visible_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
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
    v_pricing_mode
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

REVOKE ALL ON FUNCTION public.submit_ride_offer(uuid, numeric, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_ride_offer(uuid, numeric, integer, text) TO authenticated, service_role;

DO $bids_fn$
DECLARE
  v_rating_expr text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'trust_rating'
  ) THEN
    v_rating_expr := 'COALESCE(p.rating, p.trust_score, p.trust_rating, 0)';
  ELSE
    v_rating_expr := 'COALESCE(p.rating, p.trust_score, 0)';
  END IF;

  EXECUTE format($fn_wrap$
CREATE OR REPLACE FUNCTION public.get_passenger_bids(p_request_id uuid)
RETURNS SETOF public.ride_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_pricing_preference text;
  v_rider_id uuid;
  v_caller uuid := auth.uid();
BEGIN
  SELECT pricing_preference, rider_id INTO v_pricing_preference, v_rider_id
  FROM public.ride_requests
  WHERE id = p_request_id;

  IF v_rider_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('role', true), '') = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.profiles ap
      WHERE ap.id = v_caller
        AND upper(coalesce(ap.role::text, '')) = 'ADMIN'
        AND upper(coalesce(ap.status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
    )
    OR (v_caller IS NOT NULL AND v_caller = v_rider_id)
  ) THEN
    RAISE EXCEPTION 'not_request_owner';
  END IF;

  RETURN QUERY
  SELECT ro.*
  FROM public.ride_offers ro
  JOIN public.profiles p ON p.id = ro.captain_id
  LEFT JOIN public.rider_favorite_captains f ON f.captain_id = ro.captain_id
      AND f.rider_id = v_rider_id
  WHERE ro.request_id = p_request_id
    AND upper(coalesce(ro.status::text, 'PENDING')) IN ('PENDING', '')
    AND (
      lower(coalesce(p.status::text, '')) IN ('active', 'online', 'available', 'ready', 'on_duty', 'on-duty')
    )
    AND upper(coalesce(p.status::text, '')) NOT IN ('BANNED', 'SUSPENDED')
    AND (
      coalesce((ro.fare_breakdown->>'visibilityDelaySeconds')::integer, 0) <= 0
      OR ro.created_at + ((ro.fare_breakdown->>'visibilityDelaySeconds')::integer * interval '1 second') <= clock_timestamp()
    )
    AND (
      ro.created_at + ((coalesce(ro.wait_seconds, 90) + greatest(0, coalesce((ro.fare_breakdown->>'visibilityDelaySeconds')::integer, 0))) * interval '1 second') > clock_timestamp()
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_blocks ub
      WHERE (ub.blocker_id = v_rider_id AND ub.blocked_id = ro.captain_id)
         OR (ub.blocker_id = ro.captain_id AND ub.blocked_id = v_rider_id)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.ride_requests active_rr
      WHERE active_rr.accepted_captain_id = ro.captain_id
        AND active_rr.id <> p_request_id
        AND upper(coalesce(active_rr.status::text, '')) IN (
          'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'STARTED', 'TRIP_ACTIVE', 'ACTIVE', 'IN_PROGRESS'
        )
        AND coalesce(active_rr.started_at, active_rr.accepted_at, active_rr.updated_at, active_rr.created_at, clock_timestamp())
            >= clock_timestamp() - interval '4 hours'
    )
  ORDER BY
    (f.captain_id IS NOT NULL) DESC,
    (ro.pricing_mode = v_pricing_preference) DESC,
    COALESCE(ro.offer_price, ro.offered_fare, 999999) ASC,
    %s DESC,
    ro.created_at ASC
  LIMIT 9;
END;
$fn$;
$fn_wrap$, v_rating_expr);
END;
$bids_fn$;

NOTIFY pgrst, 'reload schema';

COMMIT;
