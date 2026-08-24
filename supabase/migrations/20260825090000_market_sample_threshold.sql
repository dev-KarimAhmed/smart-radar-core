-- A market needs more than one captain before it can be averaged.
--
-- With a single captain holding a tariff, "the average of captains' prices" is that
-- captain's own price. The floor shown to them was 85% of a number they had just typed in
-- themselves — self-referential, and unexplainable to the person reading it. The same
-- degeneracy applied to the market reference fare that the ±15% offer band is drawn around:
-- one captain was setting the market they were then policed against.
--
-- Below the threshold the country row stands in for the market, exactly as it already did
-- when no captain had set a tariff at all. Above it, the captains' own prices take over.


-- ---------------------------------------------------------------------------
-- 1. One threshold, shared, so the floor and the reference fare can never disagree about
--    whether a market exists yet.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.market_sample_threshold()
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT 5;
$fn$;

COMMENT ON FUNCTION public.market_sample_threshold() IS
  'Minimum number of captains with a complete tariff before their prices are treated as a market. Below this, countries.base_fare is the reference.';

GRANT EXECUTE ON FUNCTION public.market_sample_threshold() TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. The floor falls back to the country figure until the market exists.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.captain_base_fare_floor(p_country_id integer)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- 0.85 = the average minus the same 15% the anti-dumping brake allows. A plain average
  -- would ratchet: every captain sits above the floor, so their average sits above it too,
  -- so the floor climbs and never comes back down.
  FLOOR_TOLERANCE constant numeric := 0.85;
  v_country public.countries%rowtype;
  v_avg_base numeric;
  v_captains integer;
  v_floor numeric;
BEGIN
  SELECT * INTO v_country FROM public.countries WHERE id = p_country_id;
  IF NOT found THEN
    RETURN 1.00;
  END IF;

  SELECT count(*), avg(cp.base_fare)
  INTO v_captains, v_avg_base
  FROM public.captain_profiles cp
  JOIN public.profiles p ON p.id = cp.id
  WHERE p.country_id = p_country_id
    AND upper(coalesce(p.role::text, '')) IN ('CAPTAIN', 'DRIVER')
    AND cp.base_fare IS NOT NULL
    AND cp.price_per_km IS NOT NULL
    AND cp.price_per_min IS NOT NULL;

  IF coalesce(v_captains, 0) < public.market_sample_threshold() OR v_avg_base IS NULL THEN
    -- Too few captains to call it a market: the country's default figure is the reference.
    v_floor := v_country.base_fare;
  ELSE
    v_floor := v_avg_base * FLOOR_TOLERANCE;
  END IF;

  RETURN round(greatest(v_floor, v_country.min_base_fare), 2);
END;
$fn$;

REVOKE ALL ON FUNCTION public.captain_base_fare_floor(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_base_fare_floor(integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. The market reference fare uses the same threshold.
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
  v_threshold integer := public.market_sample_threshold();
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

  IF coalesce(v_captains, 0) < v_threshold THEN
    -- Seed from the country row. per_km_rate first, tariff_per_km only as the legacy
    -- fallback, matching what calculate_server_fare has always done.
    v_base := v_country.base_fare;
    v_per_km := coalesce(v_country.per_km_rate, v_country.tariff_per_km, 0.35);
    v_per_min := coalesce(v_country.tariff_per_min, 0);
  END IF;

  -- The market can never average its way below the regulated minimum.
  v_base := greatest(coalesce(v_base, v_country.base_fare), v_country.min_base_fare);

  RETURN jsonb_build_object(
    'baseFare', round(v_base, 4),
    'perKm', round(coalesce(v_per_km, 0), 4),
    'perMin', round(coalesce(v_per_min, 0), 4),
    'captainCount', coalesce(v_captains, 0),
    'threshold', v_threshold,
    'source', CASE WHEN coalesce(v_captains, 0) < v_threshold THEN 'country_seed' ELSE 'captain_average' END
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.market_average_tariff(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.market_average_tariff(integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. Tell the modal which of the two is in force, so it can explain the number instead of
--    calling everything "your country's approved minimum".
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

  SELECT cp.base_fare, cp.price_per_km, cp.price_per_min,
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
    'minBaseFare', v_floor,
    -- 'captain_average' once enough captains have a tariff, 'country_seed' before that.
    'minBaseFareSource', coalesce(v_market->>'source', 'country_seed'),
    'countryId', v_row.country_id,
    'currencyAr', v_row.currency_ar,
    'currencyEn', v_row.currency_en
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;
