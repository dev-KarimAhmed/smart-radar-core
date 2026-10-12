-- The server fare becomes a market average, and the ±15% band becomes real.
--
-- Two corrections to how an offer is priced and policed:
--
-- 1. calculate_server_fare derived the reference fare from public.countries. It is now the
--    AVERAGE of the captains' own tariffs in that country. The country row keeps its role
--    as the regulated floor and as the seed used before any captain has set a tariff.
--
-- 2. The band was never enforced. submit_ride_offer accepted any p_offer_price > 0 — the
--    ±15% brake and the rank ceiling existed only in bidding-proposal-sheet.tsx, which a
--    captain calling the RPC directly bypasses completely. Both are now checked
--    server-side, which is where a rule that decides money belongs.


-- ---------------------------------------------------------------------------
-- 1. The market average tariff for a country.
--
--    Only captains with a COMPLETE tariff count — averaging a partial one would silently
--    treat "not set yet" as zero and drag the market reference down. Before any captain in
--    a country has set one, the country row is the seed so the marketplace still works on
--    day one.
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
  v_captains integer;
BEGIN
  SELECT * INTO v_country FROM public.countries WHERE id = p_country_id;
  IF NOT found THEN
    RAISE EXCEPTION 'country_not_found';
  END IF;

  SELECT count(*),
         avg(cp.base_fare),
         avg(cp.price_per_km),
         avg(cp.price_per_min)
  INTO v_captains, v_base, v_per_km, v_per_min
  FROM public.captain_profiles cp
  JOIN public.profiles p ON p.id = cp.id
  WHERE p.country_id = p_country_id
    AND upper(coalesce(p.role::text, '')) IN ('CAPTAIN', 'DRIVER')
    AND cp.base_fare IS NOT NULL
    AND cp.price_per_km IS NOT NULL
    AND cp.price_per_min IS NOT NULL;

  IF coalesce(v_captains, 0) = 0 THEN
    -- Seed from the country row. per_km_rate first, tariff_per_km only as the legacy
    -- fallback, matching what calculate_server_fare has always done.
    v_base := v_country.base_fare;
    v_per_km := coalesce(v_country.per_km_rate, v_country.tariff_per_km, 0.35);
    v_per_min := coalesce(v_country.tariff_per_min, 0);
  END IF;

  -- The market can never average its way below the regulated meter-opening minimum.
  v_base := greatest(coalesce(v_base, v_country.base_fare), v_country.base_fare);

  RETURN jsonb_build_object(
    'baseFare', round(v_base, 4),
    'perKm', round(coalesce(v_per_km, 0), 4),
    'perMin', round(coalesce(v_per_min, 0), 4),
    'captainCount', coalesce(v_captains, 0),
    'source', CASE WHEN coalesce(v_captains, 0) = 0 THEN 'country_seed' ELSE 'captain_average' END
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.market_average_tariff(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.market_average_tariff(integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. calculate_server_fare, same signature, now priced off the market average.
--
--    The estimated-minutes model is unchanged and deliberate: minutes are derived from
--    distance (2.2 min/km) rather than measured, because the fare has to be shown to the
--    rider before the trip exists. Real traffic-time billing would need actual elapsed
--    time and a post-trip adjustment.
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
  earth_radius_km constant numeric := 6371;
  dlat numeric := radians(lat2 - lat1);
  dlng numeric := radians(lng2 - lng1);
  a numeric;
  straight_km numeric;
  road_km numeric;
  factor numeric;
  tariff jsonb;
  cfg jsonb;
  min_fare numeric;
  estimated_minutes numeric;
  fare numeric;
BEGIN
  IF p_country_id IS NULL THEN
    RAISE EXCEPTION 'country_id_required';
  END IF;

  SELECT to_jsonb(c) INTO cfg FROM public.countries c WHERE c.id = p_country_id;
  IF cfg IS NULL THEN
    RAISE EXCEPTION 'country_not_found';
  END IF;

  tariff := public.market_average_tariff(p_country_id);

  a := power(sin(dlat / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(dlng / 2), 2);
  straight_km := 2 * earth_radius_km * atan2(sqrt(a), sqrt(greatest(0, 1 - a)));

  factor := coalesce(
    nullif(cfg->>'tortuosity_factor', '')::numeric,
    nullif(cfg->>'road_factor', '')::numeric,
    1.3
  );
  road_km := straight_km * factor;
  estimated_minutes := greatest(1, road_km * 2.2);

  fare := (tariff->>'baseFare')::numeric
        + road_km * (tariff->>'perKm')::numeric
        + estimated_minutes * (tariff->>'perMin')::numeric;

  min_fare := coalesce(nullif(cfg->>'min_fare', '')::numeric, (tariff->>'baseFare')::numeric);

  RETURN round(greatest(min_fare, (tariff->>'baseFare')::numeric, fare), 2);
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 3. The offer band, enforced server-side.
--
--    Floor: 15% below the server reference, for everyone. This is the anti-dumping brake
--    that RadarAntiCheatKernel.enforceMarketBrakes shows in the UI as CRIMSON_BLOCK.
--
--    Ceiling: 15% above for everyone, and high ranks are the exception — a rank whose
--    premium factor exceeds 15% gets its own, larger headroom. With the factors the client
--    already uses (PLATINUM 0.20, GOLD 0.10, SILVER 0.00, BRONZE 0.05) that resolves to
--    PLATINUM 20% and 15% for every other rank. Adjust the CASE below to change the
--    business numbers; the greatest() is what guarantees the 15% baseline.
--
--    Note this also removes a live inversion: the client gave BRONZE 5% headroom and
--    SILVER 0%, so a silver captain could not raise the price at all while a bronze one
--    could. Both now sit at the 15% baseline.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.offer_band_for_rank(p_tier public.captain_tier)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT jsonb_build_object(
    'floorFactor', 0.85,
    'ceilingFactor', 1 + greatest(
      0.15,
      CASE p_tier
        WHEN 'PLATINUM' THEN 0.20
        WHEN 'GOLD' THEN 0.10
        WHEN 'SILVER' THEN 0.00
        WHEN 'BRONZE' THEN 0.05
        ELSE 0.00
      END
    )
  );
$fn$;

GRANT EXECUTE ON FUNCTION public.offer_band_for_rank(public.captain_tier) TO authenticated;


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
  distance_km numeric;
  new_offer public.ride_offers%rowtype;
  max_distance_km constant numeric := 9;
  band jsonb;
  reference_fare numeric;
  floor_price numeric;
  ceiling_price numeric;
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

    if distance_km > max_distance_km then
      RAISE EXCEPTION 'captain_too_far_from_pickup';
    END IF;
  END IF;

  -- === price band ===
  -- Only enforced when the request carries a reference fare; a request without one has
  -- nothing to deviate from, and refusing it would block the offer entirely.
  reference_fare := req.server_estimated_fare;

  IF reference_fare IS NOT NULL AND reference_fare > 0 THEN
    band := public.offer_band_for_rank(coalesce(captain_profile.tier, 'BRONZE'::public.captain_tier));
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

  INSERT INTO public.ride_offers (
    request_id,
    captain_id,
    offered_fare,
    offer_price,
    eta_minutes,
    wait_seconds,
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
    'status', new_offer.status
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.submit_ride_offer(uuid, numeric, integer) TO authenticated;
