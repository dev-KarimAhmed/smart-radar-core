-- Captain-set tariff: the three components the captain declares for their own fares.
--
--   base_fare      فتحة العداد الأساسية  -- floor charge, regulated minimum per country
--   price_per_km   سعر الكيلومتر الإضافي  -- per km travelled
--   price_per_min  سعر الدقيقة            -- per minute of driving and traffic
--
-- captain_profiles already had price_per_km (collected by a mandatory modal but never used
-- in any calculation). The other two had no home at all: base_fare and tariff_per_min
-- existed only on public.countries, which is the *regulated reference*, not the captain's
-- own price. This migration separates the two roles:
--
--   countries.base_fare        -> the legal floor a captain may not go under
--   captain_profiles.base_fare -> what this captain actually charges
--
-- The specification is "فتحة العداد الأساسية: بحد أدنى لا يقل عن 1.00 دينار", so the floor
-- is enforced in both places: a CHECK on the country row, and a trigger that rejects a
-- captain whose base_fare falls below their own country's floor.


-- ---------------------------------------------------------------------------
-- 1. The regulated floor. Jordan sat at 0.70, under its own stated minimum.
-- ---------------------------------------------------------------------------

UPDATE public.countries
SET base_fare = 1.00
WHERE base_fare IS NULL OR base_fare < 1.00;

ALTER TABLE public.countries
  ALTER COLUMN base_fare SET DEFAULT 1.00,
  ALTER COLUMN base_fare SET NOT NULL;

ALTER TABLE public.countries
  DROP CONSTRAINT IF EXISTS countries_base_fare_minimum;
ALTER TABLE public.countries
  ADD CONSTRAINT countries_base_fare_minimum CHECK (base_fare >= 1.00);

COMMENT ON COLUMN public.countries.base_fare IS
  'Regulated minimum meter-opening charge for this country. Captains may charge more, never less.';

-- tariff_per_km is a leftover duplicate of per_km_rate: calculate_server_fare reads
-- per_km_rate first and only falls back to tariff_per_km, whose default (0.35) is a
-- Jordanian figure that would be nonsense as an Egyptian pound rate. Flagged rather than
-- dropped, because dropping it changes calculate_server_fare's fallback behaviour.
COMMENT ON COLUMN public.countries.tariff_per_km IS
  'DEPRECATED duplicate of per_km_rate, kept only as the calculate_server_fare fallback. Do not set it per country; set per_km_rate.';


-- ---------------------------------------------------------------------------
-- 2. The captain's own three tariff components.
-- ---------------------------------------------------------------------------

ALTER TABLE public.captain_profiles
  ADD COLUMN IF NOT EXISTS base_fare numeric,
  ADD COLUMN IF NOT EXISTS price_per_min numeric;

COMMENT ON COLUMN public.captain_profiles.base_fare IS 'فتحة العداد الأساسية — this captain''s meter-opening charge. Must be >= their country base_fare.';
COMMENT ON COLUMN public.captain_profiles.price_per_km IS 'سعر الكيلومتر الإضافي — charge per km travelled.';
COMMENT ON COLUMN public.captain_profiles.price_per_min IS 'سعر الدقيقة — charge per minute of driving, including time lost to traffic.';

-- NULL means "not set yet" and is what gates the mandatory setup modal, so the checks have
-- to permit NULL and reject only a set-but-invalid value.
ALTER TABLE public.captain_profiles
  DROP CONSTRAINT IF EXISTS captain_profiles_tariff_positive;
ALTER TABLE public.captain_profiles
  ADD CONSTRAINT captain_profiles_tariff_positive CHECK (
    (base_fare IS NULL OR base_fare > 0)
    AND (price_per_km IS NULL OR price_per_km > 0)
    AND (price_per_min IS NULL OR price_per_min >= 0)
  );


-- ---------------------------------------------------------------------------
-- 3. Enforce the per-country floor. A CHECK cannot do this — the floor lives in another
--    table — so it is a trigger. captain_profiles has RLS with an "update your own row"
--    policy, so a captain can write these columns directly; this is what stops them
--    writing a base_fare under the regulated minimum.
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

  SELECT c.base_fare
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

DROP TRIGGER IF EXISTS captain_profiles_base_fare_floor ON public.captain_profiles;
CREATE TRIGGER captain_profiles_base_fare_floor
  BEFORE INSERT OR UPDATE OF base_fare ON public.captain_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_captain_base_fare_floor();


-- ---------------------------------------------------------------------------
-- 4. What the setup modal needs in one round trip: the floor and currency for the
--    captain's country, plus whatever they have already set.
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
         c.base_fare AS country_base_fare,
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
    'minBaseFare', coalesce(v_row.country_base_fare, 1.00),
    'countryId', v_row.country_id,
    'currencyAr', v_row.currency_ar,
    'currencyEn', v_row.currency_en
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;
