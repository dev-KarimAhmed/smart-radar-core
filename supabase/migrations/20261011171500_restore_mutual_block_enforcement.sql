-- Migration: Restore mutual block enforcement in captain_radar_requests, submit_ride_offer, and get_passenger_bids
-- Ensures trips from blocked riders never appear to captains, trips never appear to captains blocked by riders,
-- and upon unblocking, trips immediately re-appear.

-- 1. Redefine captain_radar_requests VIEW with mutual user_blocks check
DROP VIEW IF EXISTS public.captain_radar_requests CASCADE;

CREATE VIEW public.captain_radar_requests
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

  rr.accepted_at,
  rr.pickup_eta_minutes,
  rr.pricing_preference

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
    -- Mutual block filtering: Hide request if captain blocked rider OR rider blocked captain
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_blocks ub
      WHERE (ub.blocker_id = rr.rider_id AND ub.blocked_id = auth.uid())
         OR (ub.blocker_id = auth.uid() AND ub.blocked_id = rr.rider_id)
    )
  )
  OR rr.accepted_captain_id = auth.uid();

GRANT SELECT ON public.captain_radar_requests TO authenticated;


-- 2. Update submit_ride_offer to enforce mutual block check
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
  is_below_floor boolean := false;
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

  SELECT * INTO tariff FROM public.captain_profiles WHERE id = auth.uid();

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

  -- Mutual Block check: Abort if either captain blocked rider or rider blocked captain
  IF EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE (blocker_id = req.rider_id AND blocked_id = auth.uid())
       OR (blocker_id = auth.uid() AND blocked_id = req.rider_id)
  ) THEN
    RAISE EXCEPTION 'user_block_active'
      USING HINT = 'لا يمكن تقديم عرض لوجود حظر نشط بينك وبين الراكب.';
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

    -- Advisory floor check only: allow the offer but record that it is below floor
    is_below_floor := p_offer_price < floor_price;
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
      'isBelowFloor', is_below_floor,
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


-- 3. Update get_passenger_bids to exclude offers if a block exists between rider and captain
CREATE OR REPLACE FUNCTION public.get_passenger_bids(p_request_id uuid)
RETURNS SETOF public.ride_offers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pricing_preference text;
    v_rider_id uuid;
BEGIN
    SELECT pricing_preference, rider_id INTO v_pricing_preference, v_rider_id
    FROM public.ride_requests
    WHERE id = p_request_id;

    RETURN QUERY
    SELECT ro.*
    FROM public.ride_offers ro
    JOIN public.profiles p ON p.id = ro.captain_id
    LEFT JOIN public.rider_favorite_captains f ON f.captain_id = ro.captain_id 
        AND f.rider_id = v_rider_id
    WHERE ro.request_id = p_request_id
      AND (ro.status IS NULL OR ro.status::text = 'PENDING' OR ro.status::text = 'pending')
      AND (
        lower(coalesce(p.status::text, '')) IN ('active', 'online', 'available', 'ready', 'on_duty', 'on-duty')
      )
      -- Exclude any offer if rider blocked captain or captain blocked rider
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_blocks ub
        WHERE (ub.blocker_id = v_rider_id AND ub.blocked_id = ro.captain_id)
           OR (ub.blocker_id = ro.captain_id AND ub.blocked_id = v_rider_id)
      )
    ORDER BY
        -- 1. Favorite captain (True comes first)
        (f.captain_id IS NOT NULL) DESC,
        -- 2. Mode matching (True comes next)
        (ro.pricing_mode = v_pricing_preference) DESC,
        -- 3. Lowest price first (highest price is at the very end)
        COALESCE(ro.offer_price, ro.offered_fare, 999999) ASC,
        -- 4. Highest rating as tie-breaker
        COALESCE(p.rating, p.trust_score, p.trust_rating, 0) DESC,
        -- 5. Oldest offer as fallback
        ro.created_at ASC
    LIMIT 9;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_passenger_bids(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
