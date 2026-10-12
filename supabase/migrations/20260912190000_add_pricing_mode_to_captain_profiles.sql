-- Migration: Add pricing_mode column to captain_profiles and update get_captain_tariff_context

ALTER TABLE public.captain_profiles 
ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'FREE';

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
  v_governorate_id integer;
  v_country_id integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT cp.base_fare, cp.price_per_km, cp.price_per_min, cp.included_km, cp.pricing_mode,
         p.country_id
  INTO v_row
  FROM public.profiles p
  LEFT JOIN public.captain_profiles cp ON cp.id = p.id
  WHERE p.id = v_caller;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_row.country_id IS NULL THEN
    v_floor := 1.00;
    v_market := NULL;
    v_country_id := NULL;
  ELSE
    SELECT rg.governorate_id, rg.country_id
    INTO v_governorate_id, v_country_id
    FROM public.resolve_captain_governorate(v_caller) rg;

    v_country_id := COALESCE(v_country_id, v_row.country_id);
    v_floor := public.captain_base_fare_floor(v_country_id, v_governorate_id);
    v_market := public.market_average_tariff(v_country_id, v_governorate_id);
  END IF;

  RETURN jsonb_build_object(
    'baseFare', v_row.base_fare,
    'pricePerKm', v_row.price_per_km,
    'pricePerMin', v_row.price_per_min,
    'includedKm', v_row.included_km,
    'pricingMode', COALESCE(v_row.pricing_mode, 'FREE'),
    'minBaseFare', v_floor,
    'minBaseFareSource', COALESCE(v_market->>'source', 'country_seed'),
    'marketAverage', v_market,
    'countryId', COALESCE(v_country_id, v_row.country_id),
    'currencyAr', (SELECT currency_ar FROM public.countries WHERE id = v_row.country_id),
    'currencyEn', (SELECT currency_en FROM public.countries WHERE id = v_row.country_id)
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;

NOTIFY pgrst, 'reload schema';
