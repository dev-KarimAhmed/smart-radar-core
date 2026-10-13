-- Migration: 20261013233000_check_captain_phone_availability.sql
-- Description: Add p_phone parameter to check_captain_identity_available for realtime phone uniqueness checks.

DROP FUNCTION IF EXISTS public.check_captain_identity_available(text, text, text, text);
DROP FUNCTION IF EXISTS public.check_captain_identity_available(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.check_captain_identity_available(
  p_national_id text DEFAULT NULL,
  p_license_number text DEFAULT NULL,
  p_plate_number text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nat_exists boolean := false;
  v_lic_exists boolean := false;
  v_plate_exists boolean := false;
  v_email_exists boolean := false;
  v_phone_exists boolean := false;
  clean_nat text := nullif(trim(p_national_id), '');
  clean_lic text := nullif(trim(p_license_number), '');
  clean_plate text := nullif(trim(upper(p_plate_number)), '');
  clean_email text := nullif(lower(trim(p_email)), '');
  clean_phone text := nullif(trim(p_phone), '');
  clean_phone_digits text := nullif(regexp_replace(p_phone, '\D', '', 'g'), '');
BEGIN
  IF clean_nat IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.captain_profiles
      WHERE national_id_number = clean_nat
    ) INTO v_nat_exists;
  END IF;

  IF clean_lic IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.captain_profiles
      WHERE license_number = clean_lic
    ) INTO v_lic_exists;
  END IF;

  IF clean_plate IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.captain_profiles
      WHERE upper(trim(plate_number)) = clean_plate
    ) INTO v_plate_exists;
  END IF;

  IF clean_email IS NOT NULL THEN
    -- Check in profiles
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE lower(trim(email)) = clean_email
    ) INTO v_email_exists;

    -- Also check in auth.users
    IF NOT v_email_exists THEN
      SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE lower(trim(coalesce(email, ''))) = clean_email
           OR lower(trim(coalesce(raw_user_meta_data->>'email', ''))) = clean_email
      ) INTO v_email_exists;
    END IF;
  END IF;

  IF clean_phone_digits IS NOT NULL AND length(clean_phone_digits) >= 8 THEN
    -- Check in profiles
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') = clean_phone_digits
         OR phone = clean_phone
         OR phone = ('+' || clean_phone_digits)
    ) INTO v_phone_exists;

    -- Also check in auth.users
    IF NOT v_phone_exists THEN
      SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') = clean_phone_digits
           OR phone = clean_phone
           OR phone = ('+' || clean_phone_digits)
      ) INTO v_phone_exists;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'national_id_taken', v_nat_exists,
    'license_taken', v_lic_exists,
    'plate_taken', v_plate_exists,
    'email_taken', v_email_exists,
    'phone_taken', v_phone_exists
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_captain_identity_available(text, text, text, text, text) TO anon, authenticated, service_role;
