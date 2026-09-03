-- Migration: 20260903220000_default_captain_status_idle.sql
-- Description: Ensure new captain accounts default to IDLE (غير متاح) until they top up.

-- 1. Alter profiles.status column default to IDLE
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'IDLE'::user_status;

-- 2. Update existing captain profiles with 0 minutes to IDLE
UPDATE public.profiles p
SET status = 'IDLE'::user_status
WHERE upper(p.role::text) IN ('CAPTAIN', 'DRIVER')
  AND p.status = 'ACTIVE'::user_status
  AND NOT EXISTS (
    SELECT 1 FROM public.wallet_accounts w
    WHERE w.profile_id = p.id
      AND (COALESCE(w.paid_minutes_remaining, 0) + COALESCE(w.bonus_minutes_remaining, 0)) > 0
  );

-- 3. Update handle_new_user function to set status = IDLE on creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
BEGIN
  profile_role := CASE
    WHEN requested_role IN ('DRIVER', 'CAPTAIN') THEN 'CAPTAIN'::public.user_role
    WHEN requested_role = 'ADVERTISER' THEN 'ADVERTISER'::public.user_role
    WHEN requested_role = 'DELEGATE' THEN 'DELEGATE'::public.user_role
    WHEN requested_role = 'ADMIN' THEN 'ADMIN'::public.user_role
    ELSE 'RIDER'::public.user_role
  END;

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

  RETURN new;
END;
$$;
