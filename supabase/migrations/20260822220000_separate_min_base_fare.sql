-- Split the two jobs that were both being done by countries.base_fare.
--
-- 20260822160000 reused base_fare as the regulated floor a captain may not go under. That
-- was wrong: base_fare had always been the platform's DEFAULT meter-opening figure, chosen
-- as a typical fare component and used to seed the market average before any captain has
-- set a tariff. Turning it into a floor silently made every Egyptian captain charge at
-- least 12.00 EGP flag-fall — far above the 1.00 the specification actually states, and a
-- number nobody picked as a minimum.
--
-- The two roles are now separate columns:
--
--   countries.base_fare      -> the seed for market_average_tariff (unchanged meaning)
--   countries.min_base_fare  -> the regulated floor enforced against the captain
--
-- SEEDED WITH THE CURRENT VALUES ON PURPOSE (Egypt 12.00, Jordan 1.00) so applying this
-- migration changes no behaviour. Set the real floors deliberately, e.g.:
--
--   update public.countries set min_base_fare = 5.00 where iso_code = 'EG';
--   update public.countries set min_base_fare = 1.00 where iso_code = 'JO';


-- ---------------------------------------------------------------------------
-- 1. The new floor column.
-- ---------------------------------------------------------------------------

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS min_base_fare numeric;

UPDATE public.countries
SET min_base_fare = base_fare
WHERE min_base_fare IS NULL;

ALTER TABLE public.countries
  ALTER COLUMN min_base_fare SET DEFAULT 1.00,
  ALTER COLUMN min_base_fare SET NOT NULL;

ALTER TABLE public.countries
  DROP CONSTRAINT IF EXISTS countries_min_base_fare_minimum;
ALTER TABLE public.countries
  ADD CONSTRAINT countries_min_base_fare_minimum CHECK (min_base_fare >= 1.00);

COMMENT ON COLUMN public.countries.min_base_fare IS
  'Regulated minimum meter-opening charge. A captain may not set base_fare below this. Spec floor is 1.00.';

-- base_fare goes back to being just the seed, so it no longer has to satisfy the floor
-- rule — only be a usable positive number.
ALTER TABLE public.countries
  DROP CONSTRAINT IF EXISTS countries_base_fare_minimum;
ALTER TABLE public.countries
  ADD CONSTRAINT countries_base_fare_positive CHECK (base_fare > 0);

COMMENT ON COLUMN public.countries.base_fare IS
  'Default meter-opening charge, used to seed market_average_tariff until captains set their own. NOT a floor — see min_base_fare.';


-- ---------------------------------------------------------------------------
-- 2. The floor trigger now reads the floor column, not the seed.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_captain_base_fare_floor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_floor numeric;
BEGIN
  IF NEW.base_fare IS NULL THEN
    RETURN NEW;  -- not set yet; the setup modal still owes us a value
  END IF;

  SELECT c.min_base_fare
  INTO v_floor
  FROM public.profiles p
  JOIN public.countries c ON c.id = p.country_id
  WHERE p.id = NEW.id;

  -- No country on the profile yet: fall back to the global minimum from the spec.
  v_floor := coalesce(v_floor, 1.00);

  IF NEW.base_fare < v_floor THEN
    RAISE EXCEPTION 'base_fare_below_country_minimum: %', v_floor
      USING HINT = 'فتحة العداد لا يمكن أن تقل عن الحد الأدنى المعتمد للدولة';
  END IF;

  RETURN NEW;
END;
$fn$;


-- ---------------------------------------------------------------------------
-- 3. The setup modal shows the floor, not the seed.
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
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT cp.base_fare, cp.price_per_km, cp.price_per_min,
         c.min_base_fare AS country_min_base_fare,
         c.currency_ar, c.currency_en, c.id AS country_id
  INTO v_row
  FROM public.profiles p
  LEFT JOIN public.captain_profiles cp ON cp.id = p.id
  LEFT JOIN public.countries c ON c.id = p.country_id
  WHERE p.id = v_caller;

  IF NOT found THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  RETURN jsonb_build_object(
    'baseFare', v_row.base_fare,
    'pricePerKm', v_row.price_per_km,
    'pricePerMin', v_row.price_per_min,
    'minBaseFare', coalesce(v_row.country_min_base_fare, 1.00),
    'countryId', v_row.country_id,
    'currencyAr', v_row.currency_ar,
    'currencyEn', v_row.currency_en
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. market_average_tariff: base_fare stays the seed, but the "market cannot average
--    below the regulated minimum" clamp has to use the floor column.
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

  -- The market can never average its way below the regulated minimum.
  v_base := greatest(coalesce(v_base, v_country.base_fare), v_country.min_base_fare);

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
