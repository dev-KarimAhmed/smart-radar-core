-- Record why an offer costs what it costs, and show it to the rider.
--
-- ride_offers stored only the final number, so the rider was shown a price with no
-- account of how it was reached. The breakdown is captured as a SNAPSHOT at submit time
-- rather than recomputed on read: the captain can change their tariff at any moment, and a
-- receipt that silently rewrites itself afterwards is worse than no receipt.
--
-- Everything in here is already visible to the rider in aggregate (they see the final
-- fare); this only itemises it. The captain's per-km and per-minute figures become visible
-- to the rider — that is the point of a meter.

ALTER TABLE public.ride_offers
  ADD COLUMN IF NOT EXISTS fare_breakdown jsonb;

COMMENT ON COLUMN public.ride_offers.fare_breakdown IS
  'Itemised fare snapshot taken when the offer was submitted: the captain''s tariff components, the distance and time they were applied to, the market reference, and any manual adjustment. Immutable receipt — never recomputed.';


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

  -- Distance guard: only enforced when the captain has a recorded location
  -- (matches the client-side radar filter's leniency for unknown location —
  -- it doesn't hide requests from a captain whose position isn't known yet).
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

  -- === price band ===
  -- Only enforced when the request carries a reference fare; a request without one has
  -- nothing to deviate from, and refusing it would block the offer entirely.
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

  -- === the receipt ===
  -- Same geometry as calculate_server_fare and captain_offer_quote, via trip_road_km, so
  -- the itemised lines add up to a figure comparable with the market reference.
  SELECT * INTO tariff FROM public.captain_profiles WHERE id = auth.uid();
  SELECT * INTO cfg FROM public.countries WHERE id = coalesce(req.country_id, captain_profile.country_id);

  road_km := coalesce(public.trip_road_km(
    req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng,
    coalesce(req.country_id, captain_profile.country_id)
  ), 0);
  minutes := greatest(1, road_km * 2.2);

  IF tariff.base_fare IS NOT NULL AND tariff.price_per_km IS NOT NULL AND tariff.price_per_min IS NOT NULL THEN
    km_charge := round(road_km * tariff.price_per_km, 2);
    min_charge := round(minutes * tariff.price_per_min, 2);
    meter_fare := round(greatest(
      coalesce(cfg.min_fare, tariff.base_fare),
      tariff.base_fare,
      tariff.base_fare + road_km * tariff.price_per_km + minutes * tariff.price_per_min
    ), 2);

    breakdown := jsonb_build_object(
      'baseFare', tariff.base_fare,
      'perKm', tariff.price_per_km,
      'perMin', tariff.price_per_min,
      'roadKm', round(road_km, 2),
      'minutes', round(minutes, 1),
      'kmCharge', km_charge,
      'minCharge', min_charge,
      -- What the captain's meter alone produces, before any manual adjustment.
      'meterFare', meter_fare,
      -- The market average reference and the band that was enforced against it.
      'marketFare', reference_fare,
      'floorPrice', floor_price,
      'ceilingPrice', ceiling_price,
      'tier', v_tier::text,
      -- Positive when the captain asked above their own meter, negative when below.
      'adjustment', round(p_offer_price - meter_fare, 2),
      'offeredFare', p_offer_price,
      'minTripFare', cfg.min_fare,
      'currencyAr', cfg.currency_ar,
      'currencyEn', cfg.currency_en
    );
  ELSE
    -- Captain has not completed the tariff modal: no meter to itemise, so record only what
    -- can be stated truthfully rather than inventing components.
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
    request_id,
    captain_id,
    offered_fare,
    offer_price,
    eta_minutes,
    wait_seconds,
    fare_breakdown,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_request_id,
    auth.uid(),
    p_offer_price,
    p_offer_price,
    5,
    p_wait_seconds,
    breakdown,
    'PENDING',
    now(),
    now()
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
