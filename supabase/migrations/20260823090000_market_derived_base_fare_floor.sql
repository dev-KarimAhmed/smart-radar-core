-- The meter-opening floor is derived from the market, not typed in by hand.
--
-- 20260822220000 gave the floor its own column (countries.min_base_fare), but the value in
-- it was still a hand-entered number nobody could account for — Egypt's 12.00 appears in no
-- migration and no code path; it was typed straight into the table. The floor is now
-- computed from the captains' own tariffs in the database instead.
--
-- WHY THE 0.85, AND NOT THE AVERAGE ITSELF:
--
-- A minimum defined as the plain average of a population that is itself constrained to sit
-- above that minimum is a ratchet. Every captain is >= the floor, so their average is >=
-- the floor, so the floor rises, so the next captain must come in higher, so the average
-- rises again. It only ever moves up, and the cheapest legal price drifts away from what a
-- new entrant can offer.
--
-- Taking 85% of the average — the same 15% tolerance offer_band_for_rank already uses for
-- the anti-dumping brake — is stable: if every captain sits on the same figure the floor
-- settles at 85% of it and stops, and a captain entering at the floor pulls the average
-- down, which pulls the floor down with it. Self-correcting instead of self-amplifying.
--
-- To make the floor literally equal the average, set FLOOR_TOLERANCE below to 1.0 — but
-- read the paragraph above first.


-- ---------------------------------------------------------------------------
-- 1. min_base_fare stops being the market floor and becomes the absolute regulatory
--    one — the only floor the specification actually states, 1.00. The market-derived
--    floor is layered on top of it.
-- ---------------------------------------------------------------------------

UPDATE public.countries
SET min_base_fare = 1.00;

COMMENT ON COLUMN public.countries.min_base_fare IS
  'Absolute regulatory floor for the meter-opening charge (spec: 1.00). The effective floor a captain faces is captain_base_fare_floor(), which layers the market-derived floor on top of this.';


-- ---------------------------------------------------------------------------
-- 2. The market-derived floor.
--
--    Only captains with a COMPLETE tariff count, for the same reason
--    market_average_tariff excludes partial ones: a NULL would be averaged as nothing.
--    With no captains yet there is no market to average, so the country seed stands in.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.captain_base_fare_floor(p_country_id integer)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- 0.85 = the average minus the same 15% the anti-dumping brake allows. See the header.
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

  IF coalesce(v_captains, 0) = 0 OR v_avg_base IS NULL THEN
    -- No market yet: the country's default meter-opening figure is the reference.
    v_floor := v_country.base_fare;
  ELSE
    v_floor := v_avg_base * FLOOR_TOLERANCE;
  END IF;

  -- Never below the absolute regulatory floor.
  RETURN round(greatest(v_floor, v_country.min_base_fare), 2);
END;
$fn$;

REVOKE ALL ON FUNCTION public.captain_base_fare_floor(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_base_fare_floor(integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. The trigger enforces the computed floor.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_captain_base_fare_floor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_country_id integer;
  v_floor numeric;
BEGIN
  IF NEW.base_fare IS NULL THEN
    RETURN NEW;  -- not set yet; the setup modal still owes us a value
  END IF;

  SELECT p.country_id INTO v_country_id FROM public.profiles p WHERE p.id = NEW.id;

  -- No country on the profile yet: only the spec minimum applies.
  IF v_country_id IS NULL THEN
    v_floor := 1.00;
  ELSE
    v_floor := public.captain_base_fare_floor(v_country_id);
  END IF;

  IF NEW.base_fare < v_floor THEN
    RAISE EXCEPTION 'base_fare_below_market_minimum: %', v_floor
      USING HINT = 'فتحة العداد لا يمكن أن تقل عن الحد الأدنى المحسوب من متوسط الكباتن';
  END IF;

  RETURN NEW;
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 4. The setup modal shows the computed floor.
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

  v_floor := CASE
    WHEN v_row.country_id IS NULL THEN 1.00
    ELSE public.captain_base_fare_floor(v_row.country_id)
  END;

  RETURN jsonb_build_object(
    'baseFare', v_row.base_fare,
    'pricePerKm', v_row.price_per_km,
    'pricePerMin', v_row.price_per_min,
    'minBaseFare', v_floor,
    'countryId', v_row.country_id,
    'currencyAr', v_row.currency_ar,
    'currencyEn', v_row.currency_en
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;
