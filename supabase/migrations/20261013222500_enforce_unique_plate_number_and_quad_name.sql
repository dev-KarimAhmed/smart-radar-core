-- Migration: 20261013222500_enforce_unique_plate_number_and_quad_name.sql
-- Description: Enforce unique vehicle plate numbers and 4-part legal name for captains.

-- 1. Deduplicate any existing test plate numbers before creating unique index
WITH dup_plates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY upper(trim(plate_number)) ORDER BY created_at ASC) AS rnum
  FROM public.captain_profiles
  WHERE plate_number IS NOT NULL AND trim(plate_number) <> ''
)
UPDATE public.captain_profiles
SET plate_number = plate_number || '-DUP-' || substr(id::text, 1, 4)
WHERE id IN (
  SELECT id FROM dup_plates WHERE rnum > 1
);

-- 2. Create unique index on normalized plate_number
CREATE UNIQUE INDEX IF NOT EXISTS unique_plate_number
ON public.captain_profiles (upper(trim(plate_number)))
WHERE plate_number IS NOT NULL AND trim(plate_number) <> '';

-- 3. Update check_captain_identity_available to also check plate_number
CREATE OR REPLACE FUNCTION public.check_captain_identity_available(
  p_national_id text DEFAULT NULL,
  p_license_number text DEFAULT NULL,
  p_plate_number text DEFAULT NULL
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
  clean_nat text := nullif(trim(p_national_id), '');
  clean_lic text := nullif(trim(p_license_number), '');
  clean_plate text := nullif(trim(upper(p_plate_number)), '');
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

  RETURN jsonb_build_object(
    'national_id_taken', v_nat_exists,
    'license_taken', v_lic_exists,
    'plate_taken', v_plate_exists
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_captain_identity_available(text, text, text) TO anon, authenticated, service_role;

-- 4. Update handle_new_user trigger to enforce plate uniqueness and 4-part legal name for Captains
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
  v_plate_num text;
  v_full_name text;
  v_name_parts text[];
BEGIN
  profile_role := CASE
    WHEN requested_role IN ('DRIVER', 'CAPTAIN') THEN 'CAPTAIN'::public.user_role
    WHEN requested_role = 'ADVERTISER' THEN 'ADVERTISER'::public.user_role
    WHEN requested_role = 'DELEGATE' THEN 'DELEGATE'::public.user_role
    WHEN requested_role = 'ADMIN' THEN 'ADMIN'::public.user_role
    ELSE 'RIDER'::public.user_role
  END;

  -- If signing up as a CAPTAIN, enforce identity uniqueness and 4-part legal name
  IF profile_role = 'CAPTAIN' THEN
    v_full_name := trim(coalesce(new.raw_user_meta_data->>'full_name', ''));
    IF v_full_name <> '' THEN
      v_name_parts := regexp_split_to_array(v_full_name, '\s+');
      IF coalesce(array_length(v_name_parts, 1), 0) < 4 THEN
        RAISE EXCEPTION 'invalid_quad_name:يرجى كتابة الاسم الرباعي كاملاً (الاسم، الأب، الجد، العائلة).';
      END IF;
    END IF;

    v_cap_meta := new.raw_user_meta_data->'captain_profile';
    IF v_cap_meta IS NOT NULL THEN
      v_nat_id := nullif(trim(coalesce(v_cap_meta->>'national_id_number', '')), '');
      v_lic_num := nullif(trim(coalesce(v_cap_meta->>'license_number', '')), '');
      v_plate_num := nullif(trim(upper(coalesce(v_cap_meta->>'plate_number', ''))), '');

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

      IF v_plate_num IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.captain_profiles
        WHERE upper(trim(plate_number)) = v_plate_num AND id <> new.id
      ) THEN
        RAISE EXCEPTION 'unique_plate_number:رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.';
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

