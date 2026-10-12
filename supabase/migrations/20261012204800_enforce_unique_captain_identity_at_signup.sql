-- Migration: 20261012204800_enforce_unique_captain_identity_at_signup.sql
-- Description: Enforce unique national ID and driver license number at the database level and provide an RPC for pre-checks.

-- 1. Ensure unique indexes exist on captain_profiles
CREATE UNIQUE INDEX IF NOT EXISTS unique_national_id_number ON public.captain_profiles (national_id_number) WHERE national_id_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_license_number ON public.captain_profiles (license_number) WHERE license_number IS NOT NULL;

-- 2. Create Security Definer RPC for anonymous client-side pre-checks (bypasses RLS safely without exposing personal data)
CREATE OR REPLACE FUNCTION public.check_captain_identity_available(
  p_national_id text DEFAULT NULL,
  p_license_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nat_exists boolean := false;
  v_lic_exists boolean := false;
  clean_nat text := nullif(trim(p_national_id), '');
  clean_lic text := nullif(trim(p_license_number), '');
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

  RETURN jsonb_build_object(
    'national_id_taken', v_nat_exists,
    'license_taken', v_lic_exists
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_captain_identity_available(text, text) TO anon, authenticated, service_role;

-- 3. Update handle_new_user trigger to validate uniqueness BEFORE creating auth user and atomically create captain profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := upper(coalesce(new.raw_user_meta_data->>'role', 'RIDER'));
  profile_role public.user_role;
  requested_country_id integer := nullif(new.raw_user_meta_data->>'country_id', '')::integer;
  requested_governorate_id integer := nullif(new.raw_user_meta_data->>'governorate_id', '')::integer;
  requested_district_id integer := nullif(new.raw_user_meta_data->>'district_id', '')::integer;
  final_country_id integer;
  final_governorate_id integer;
  final_district_id integer;
  v_cap_meta jsonb;
  v_nat_id text;
  v_lic_num text;
BEGIN
  profile_role := CASE
    WHEN requested_role IN ('DRIVER', 'CAPTAIN') THEN 'CAPTAIN'::public.user_role
    WHEN requested_role = 'ADVERTISER' THEN 'ADVERTISER'::public.user_role
    WHEN requested_role = 'DELEGATE' THEN 'DELEGATE'::public.user_role
    WHEN requested_role = 'ADMIN' THEN 'ADMIN'::public.user_role
    ELSE 'RIDER'::public.user_role
  END;

  -- If signing up as a CAPTAIN, enforce identity uniqueness upfront
  IF profile_role = 'CAPTAIN' THEN
    v_cap_meta := new.raw_user_meta_data->'captain_profile';
    IF v_cap_meta IS NOT NULL THEN
      v_nat_id := nullif(trim(coalesce(v_cap_meta->>'national_id_number', '')), '');
      v_lic_num := nullif(trim(coalesce(v_cap_meta->>'license_number', '')), '');

      IF v_nat_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.captain_profiles
        WHERE national_id_number = v_nat_id AND id <> new.id
      ) THEN
        RAISE EXCEPTION 'unique_national_id_number:رقم الهوية الوطنية مسجل بالفعل مسبقاً.';
      END IF;

      IF v_lic_num IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.captain_profiles
        WHERE license_number = v_lic_num AND id <> new.id
      ) THEN
        RAISE EXCEPTION 'unique_license_number:رقم رخصة القيادة مسجل بالفعل مسبقاً.';
      END IF;
    END IF;
  END IF;

  SELECT c.id
  INTO final_country_id
  FROM public.countries c
  WHERE c.id = requested_country_id
  LIMIT 1;

  IF final_country_id IS NULL THEN
    SELECT c.id
    INTO final_country_id
    FROM public.countries c
    ORDER BY CASE WHEN upper(coalesce(c.country_code, '')) = 'JO' THEN 0 ELSE 1 END, c.id
    LIMIT 1;
  END IF;

  SELECT g.id
  INTO final_governorate_id
  FROM public.governorates g
  WHERE g.id = requested_governorate_id
    AND (g.country_id = final_country_id OR g.country_id IS NULL)
  LIMIT 1;

  IF final_governorate_id IS NULL THEN
    SELECT g.id
    INTO final_governorate_id
    FROM public.governorates g
    WHERE g.country_id = final_country_id OR g.country_id IS NULL
    ORDER BY g.id
    LIMIT 1;
  END IF;

  SELECT d.id
  INTO final_district_id
  FROM public.districts d
  WHERE d.id = requested_district_id
    AND d.governorate_id = final_governorate_id
  LIMIT 1;

  IF final_district_id IS NULL THEN
    SELECT d.id
    INTO final_district_id
    FROM public.districts d
    WHERE d.governorate_id = final_governorate_id
    ORDER BY d.id
    LIMIT 1;
  END IF;

  -- 1. Create or update public.profiles
  INSERT INTO public.profiles (
    id,
    role,
    status,
    full_name,
    phone,
    country_id,
    governorate_id,
    district_id
  )
  VALUES (
    new.id,
    profile_role,
    'IDLE'::public.user_status,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'User'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'phone'), ''), new.phone, '0000000000'),
    final_country_id,
    final_governorate_id,
    final_district_id
  )
  ON CONFLICT (id) DO UPDATE
  SET role = excluded.role,
      full_name = excluded.full_name,
      phone = excluded.phone,
      country_id = excluded.country_id,
      governorate_id = excluded.governorate_id,
      district_id = excluded.district_id,
      updated_at = now();

  -- 2. Create or update public.captain_profiles atomically inside the same transaction
  IF profile_role = 'CAPTAIN' AND v_cap_meta IS NOT NULL THEN
    INSERT INTO public.captain_profiles (
      id,
      vehicle_type,
      vehicle_brand,
      vehicle_model,
      vehicle_color,
      vehicle_year,
      plate_number,
      employment_type,
      affiliation_type,
      office_phone,
      side_id,
      company_code,
      national_id_number,
      license_number,
      nickname,
      facebook_url,
      instagram_url,
      verification_status
    ) VALUES (
      new.id,
      coalesce(nullif(trim(v_cap_meta->>'vehicle_type'), ''), 'TAXI'),
      nullif(trim(v_cap_meta->>'vehicle_brand'), ''),
      nullif(trim(v_cap_meta->>'vehicle_model'), ''),
      nullif(trim(v_cap_meta->>'vehicle_color'), ''),
      nullif(v_cap_meta->>'vehicle_year', '')::integer,
      coalesce(nullif(trim(v_cap_meta->>'plate_number'), ''), '00-00000'),
      coalesce(nullif(trim(v_cap_meta->>'employment_type'), ''), 'مستقل'),
      nullif(trim(v_cap_meta->>'affiliation_type'), ''),
      nullif(trim(v_cap_meta->>'office_phone'), ''),
      nullif(trim(v_cap_meta->>'side_id'), ''),
      nullif(trim(v_cap_meta->>'company_code'), ''),
      v_nat_id,
      v_lic_num,
      nullif(trim(v_cap_meta->>'nickname'), ''),
      nullif(trim(v_cap_meta->>'facebook_url'), ''),
      nullif(trim(v_cap_meta->>'instagram_url'), ''),
      coalesce(nullif(trim(v_cap_meta->>'verification_status'), ''), 'APPROVED')
    )
    ON CONFLICT (id) DO UPDATE SET
      national_id_number = excluded.national_id_number,
      license_number = excluded.license_number,
      vehicle_type = excluded.vehicle_type,
      vehicle_brand = excluded.vehicle_brand,
      vehicle_model = excluded.vehicle_model,
      vehicle_color = excluded.vehicle_color,
      vehicle_year = excluded.vehicle_year,
      plate_number = excluded.plate_number,
      employment_type = excluded.employment_type,
      affiliation_type = excluded.affiliation_type,
      office_phone = excluded.office_phone,
      side_id = excluded.side_id,
      company_code = excluded.company_code,
      nickname = excluded.nickname,
      facebook_url = excluded.facebook_url,
      instagram_url = excluded.instagram_url,
      updated_at = now();
  END IF;

  RETURN new;
END;
$$;

