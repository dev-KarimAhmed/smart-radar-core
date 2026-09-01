-- Item 1 + 3 of the project notes, as one unit.
--
--   1. السماح للكابتن بتقديم سعر أعلى من سعر السوق حتى 15%
--      عند تجاوز 15% يظهر تنبيه مع إمكانية تقديم العرض
--      عدم السماح بتقديم العرض في حالة انخفاض السعر عن النسبة المحددة
--   3. مراجعة وتعديل نسب الزيادة الخاصة برتب الكابتن
--
-- Decision on the interaction between them: the 15% is FLAT for every rank, and rank has no
-- effect on price at all. Rank keeps its non-price privileges (sort order in the rider's
-- auction, trust badge). This replaces the rank ladder that an earlier migration draft
-- introduced — it is superseded, not amended.
--
--
-- THE BUG THIS ALSO FIXES
--
-- The captain's sheet displayed "أقصى زيادة مسموحة: EGP 0.00" and a final offer identical to
-- the base, with no way to add anything — while the same panel said "رتبتك فضي تسمح لك بزيادة
-- من 1 إلى 15%". Both statements came from the same numbers:
--
--   suggestedFare = least(greatest(captainFare, floorPrice), ceilingPrice)
--   maxIncrease   = ceilingPrice - suggestedFare
--
-- Once a captain's own meter reached or passed the ceiling, the suggestion WAS the ceiling,
-- so maxIncrease was exactly 0. The entire 15% had been consumed by the clamp before the
-- captain ever saw the field. Nothing was wrong with the percentage; the base it was
-- measured from had already been raised to the top of the band.
--
-- Fixed by not clamping the suggestion down at all. The floor still lifts an undercutting
-- meter up, because the floor is a hard rule. The ceiling is not a hard rule any more.
--
--
-- THREE CHANGES
--
--   A. offer_band_for_rank  -> flat ±15%, rank-independent.
--   B. captain_offer_quote  -> suggestion no longer clamped to the ceiling.
--   C. submit_ride_offer    -> above the ceiling is recorded, not refused. Below the floor
--                              is still refused.
--
-- B and C are reproduced from 20260826090000_fare_uses_real_route.sql with only those
-- changes; Postgres has no way to patch part of a function body.


-- ---------------------------------------------------------------------------
-- A. The band. Same for every rank.
--
--    Floor stays a hard -15% for everyone: it is the anti-undercutting brake ("حماية كاملة
--    من حرق الأسعار") and no rank earns the right to burn the market.
--    Ceiling is +15% for everyone and is now only the point where the WARNING starts.
--
--    The p_tier argument is kept so existing callers still compile, and deliberately
--    ignored. Removing it would mean rewriting every call site to prove a negative.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.offer_band_for_rank(p_tier public.captain_tier)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $band$
  SELECT jsonb_build_object(
    'floorFactor', 0.85,
    'ceilingFactor', 1.15,
    -- Explicit, so a reader does not go looking for the rank table that used to be here.
    'rankAffectsPrice', false
  );
$band$;

GRANT EXECUTE ON FUNCTION public.offer_band_for_rank(public.captain_tier) TO authenticated;


-- ---------------------------------------------------------------------------
-- B. The captain's quote.
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
    -- The captain's OWN meter, lifted to the floor if it undercuts the market, and never
    -- clamped down to the ceiling any more. The clamp is why the sheet showed
    -- 'اقصى زيادة مسموحة: 0.00': once a captain's meter reached the ceiling, the suggestion
    -- WAS the ceiling, so ceiling - suggestion = 0 and the whole +15% had already been
    -- silently consumed before the captain saw the field.
    'suggestedFare', CASE
      WHEN floor_price IS NULL THEN captain_fare
      ELSE greatest(captain_fare, floor_price)
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
-- C. Offer submission.
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

    -- Above the band is now ALLOWED. The captain saw a warning in the sheet and chose to
    -- submit anyway; refusing here would make that warning a lie. Recorded on the offer so
    -- the rider can see the price sits above the market band.
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


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- Every rank must now return the same band.
--   SELECT t, public.offer_band_for_rank(t)
--   FROM unnest(ARRAY['BRONZE','SILVER','GOLD','PLATINUM']::public.captain_tier[]) AS t;
--   -- expect: floorFactor 0.85 and ceilingFactor 1.15 on all four rows.
--
--   -- And the quote must leave room to increase even when the meter is at/above the band.
--   -- As the captain, against a real pending request:
--   --   SELECT public.captain_offer_quote('<request-id>');
--   -- expect: suggestedFare = the captain's own meter (captainFare), NOT ceilingPrice,
--   --         whenever captainFare > ceilingPrice.
