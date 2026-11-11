-- =============================================================================
-- Migration: 20261110120000_sovereign_security_rls_hardening.sql
-- Purpose: Comprehensive pre-launch security & RLS hardening across all public
--          tables, views, triggers, RPC functions, storage buckets, and flags.
-- Project: shjbchvmwrtfmtrdwlum
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Sovereign Admin Helper (SECURITY DEFINER + locked search_path)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND upper(coalesce(p.role::text, '')) = 'ADMIN'
        AND upper(coalesce(p.status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Drop Dangerous Debug Function
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.debug_get_all_blocks();

-- -----------------------------------------------------------------------------
-- 3. Harden Auth Signup Trigger (Block ADMIN/DELEGATE & auto-APPROVED spoofing)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
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
  v_email text;
BEGIN
  -- Security: NEVER allow client signup metadata to self-assign ADMIN or DELEGATE
  profile_role := CASE
    WHEN requested_role IN ('DRIVER', 'CAPTAIN') THEN 'CAPTAIN'::public.user_role
    WHEN requested_role = 'ADVERTISER' THEN 'ADVERTISER'::public.user_role
    ELSE 'RIDER'::public.user_role
  END;

  v_email := nullif(lower(trim(coalesce(nullif(new.email, ''), new.raw_user_meta_data->>'email', ''))), '');

  -- Enforce email uniqueness across accounts if email is provided
  IF v_email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE lower(trim(email)) = v_email AND id <> new.id
    ) THEN
      RAISE EXCEPTION 'unique_email:البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.';
    END IF;

    IF EXISTS (
      SELECT 1 FROM auth.users
      WHERE id <> new.id
        AND (lower(trim(coalesce(email, ''))) = v_email OR lower(trim(coalesce(raw_user_meta_data->>'email', ''))) = v_email)
    ) THEN
      RAISE EXCEPTION 'unique_email:البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.';
    END IF;
  END IF;

  -- If signing up as a CAPTAIN, enforce identity uniqueness, mandatory email, and 4-part legal name
  IF profile_role = 'CAPTAIN' THEN
    IF v_email IS NULL THEN
      RAISE EXCEPTION 'missing_email:البريد الإلكتروني مطلوب لإنشاء حساب الكابتن.';
    END IF;

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

  INSERT INTO public.profiles (
    id,
    role,
    status,
    full_name,
    phone,
    email,
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
    v_email,
    final_country_id,
    final_governorate_id,
    final_district_id
  )
  ON CONFLICT (id) DO UPDATE
  SET role = CASE
        WHEN upper(coalesce(public.profiles.role::text, '')) IN ('ADMIN', 'DELEGATE')
          THEN public.profiles.role
        ELSE excluded.role
      END,
      full_name = excluded.full_name,
      phone = excluded.phone,
      email = coalesce(excluded.email, public.profiles.email),
      country_id = excluded.country_id,
      governorate_id = excluded.governorate_id,
      district_id = excluded.district_id,
      updated_at = now();

  -- Always start captain verification as PENDING; never trust client-supplied status
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
      'PENDING'
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

-- Enforce PENDING verification default on captain_profiles even outside handle_new_user
ALTER TABLE IF EXISTS public.captain_profiles
  ALTER COLUMN verification_status SET DEFAULT 'PENDING';

-- -----------------------------------------------------------------------------
-- 4. SECURITY INVOKER Guards on profiles, captain_profiles, ride_offers, wallet_transactions, user_notifications
-- -----------------------------------------------------------------------------
DO $guard_profiles$
DECLARE
  v_freeze text := '';
  v_col text;
  v_cols text[] := ARRAY[
    'serial_id',
    'tier',
    'allowed_sectors',
    'rating',
    'trust_rating',
    'trust_score',
    'rating_sum',
    'rating_count',
    'behavior_rating',
    'vehicle_rating',
    'vehicle_rating_sum',
    'vehicle_rating_count',
    'heart_count',
    'penalty_count',
    'rank_penalty_expires_at',
    'last_report_date',
    'rank_audit_log'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = v_col
    ) THEN
      v_freeze := v_freeze || format('  NEW.%I := OLD.%I;' || E'\n', v_col, v_col);
    END IF;
  END LOOP;

  EXECUTE format($fn_wrap$
CREATE OR REPLACE FUNCTION public.a_guard_profiles_sovereign_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR coalesce(current_setting('role', true), '') = 'service_role'
     OR coalesce(current_setting('radar.rank_engine', true), '') = 'on'
     OR coalesce(current_setting('radar.captain_status_rpc', true), '') = 'on'
     OR public.is_admin()
  THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'cannot_modify_profile_role';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      upper(coalesce(OLD.role::text, '')) = 'RIDER'
      AND upper(coalesce(OLD.status::text, '')) IN ('ACTIVE', 'IDLE')
      AND upper(coalesce(NEW.status::text, '')) IN ('ACTIVE', 'IDLE')
    ) THEN
      RAISE EXCEPTION 'cannot_modify_profile_status';
    END IF;
  END IF;

%s
  RETURN NEW;
END;
$fn$;
$fn_wrap$, v_freeze);
END;
$guard_profiles$;

DROP TRIGGER IF EXISTS a_guard_profiles_sovereign_update ON public.profiles;
CREATE TRIGGER a_guard_profiles_sovereign_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.a_guard_profiles_sovereign_update();

CREATE OR REPLACE FUNCTION public.guard_captain_profiles_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR coalesce(current_setting('role', true), '') = 'service_role'
     OR public.is_admin()
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'cannot_insert_foreign_captain_profile';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND upper(coalesce(p.role::text, '')) IN ('CAPTAIN', 'DRIVER')
    ) THEN
      RAISE EXCEPTION 'captain_role_required';
    END IF;
    NEW.verification_status := 'PENDING';
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.verification_status := OLD.verification_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_captain_profiles_mutation ON public.captain_profiles;
CREATE TRIGGER guard_captain_profiles_mutation
  BEFORE INSERT OR UPDATE ON public.captain_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_captain_profiles_mutation();

DO $guard_offers$
DECLARE
  v_freeze text := '';
  v_col text;
  v_cols text[] := ARRAY[
    'request_id',
    'captain_id',
    'offered_fare',
    'offer_price',
    'eta_minutes',
    'wait_seconds',
    'fare_breakdown',
    'pickup_distance_km',
    'pricing_mode',
    'created_at'
  ];
BEGIN
  FOREACH v_col IN ARRAY v_cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ride_offers'
        AND column_name = v_col
    ) THEN
      v_freeze := v_freeze || format('  NEW.%I := OLD.%I;' || E'\n', v_col, v_col);
    END IF;
  END LOOP;

  EXECUTE format($fn_wrap$
CREATE OR REPLACE FUNCTION public.guard_ride_offers_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR coalesce(current_setting('role', true), '') = 'service_role'
     OR public.is_admin()
  THEN
    RETURN NEW;
  END IF;

  IF upper(coalesce(OLD.status::text, 'PENDING')) <> 'PENDING' THEN
    RAISE EXCEPTION 'offer_no_longer_pending';
  END IF;

  IF upper(coalesce(NEW.status::text, '')) NOT IN ('CANCELLED', 'REJECTED') THEN
    RAISE EXCEPTION 'invalid_client_offer_status';
  END IF;

%s
  RETURN NEW;
END;
$fn$;
$fn_wrap$, v_freeze);
END;
$guard_offers$;

DROP TRIGGER IF EXISTS guard_ride_offers_update ON public.ride_offers;
CREATE TRIGGER guard_ride_offers_update
  BEFORE UPDATE ON public.ride_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_ride_offers_update();

CREATE OR REPLACE FUNCTION public.check_wallet_transactions_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR coalesce(current_setting('role', true), '') = 'service_role'
     OR public.is_admin()
  THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'wallet_transactions_are_immutable';
END;
$$;

DROP TRIGGER IF EXISTS tr_wallet_transactions_immutable ON public.wallet_transactions;
CREATE TRIGGER tr_wallet_transactions_immutable
  BEFORE UPDATE OR DELETE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_wallet_transactions_immutable();

-- Prevent client-side notification type/id/target forging (e.g. admin_message / urgent / emergency injection)
CREATE OR REPLACE FUNCTION public.guard_user_notifications_client_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR coalesce(current_setting('role', true), '') = 'service_role'
     OR public.is_admin()
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'cannot_create_notification_for_other_user';
    END IF;

    IF lower(coalesce(NEW.type, 'info')) NOT IN ('info', 'offer', 'trip', 'system') THEN
      RAISE EXCEPTION 'forbidden_notification_type';
    END IF;

    IF coalesce(NEW.id, '') ~* '(rcpt|topup|notif_top|notif_admin|notif_welcome|notif_inact|notif_ref|notif_verif|notif_status|notif_tier|notif_clear)' THEN
      RAISE EXCEPTION 'forbidden_notification_id_prefix';
    END IF;

    IF NEW.created_at IS NULL OR NEW.created_at < now() - interval '72 hours' OR NEW.created_at > now() + interval '5 minutes' THEN
      NEW.created_at := now();
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Regular users may only toggle read state on their own notifications
    NEW.id          := OLD.id;
    NEW.user_id     := OLD.user_id;
    NEW.title       := OLD.title;
    NEW.description := OLD.description;
    NEW.type        := OLD.type;
    NEW.created_at  := OLD.created_at;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_guard_user_notifications_client_write ON public.user_notifications;
CREATE TRIGGER tr_guard_user_notifications_client_write
  BEFORE INSERT OR UPDATE ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_notifications_client_write();

-- -----------------------------------------------------------------------------
-- 5. Safe Counterpart Display RPCs (No raw PII leakage across users)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_safe_captain_cards(uuid[]);
CREATE OR REPLACE FUNCTION public.get_safe_captain_cards(p_captain_ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  serial_id text,
  rating numeric,
  behavior_rating numeric,
  vehicle_rating numeric,
  rating_count integer,
  tier text,
  heart_count integer,
  vehicle_type text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_color text,
  vehicle_year integer,
  plate_number text,
  nickname text,
  pricing_mode text,
  affiliation_type text,
  employment_type text,
  base_fare numeric,
  price_per_km numeric,
  price_per_min numeric,
  flag_fall_fee numeric,
  included_km numeric,
  verification_status text,
  facebook_url text,
  instagram_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_admin boolean := public.is_admin();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_captain_ids IS NULL OR coalesce(array_length(p_captain_ids, 1), 0) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.serial_id,
    p.rating,
    p.behavior_rating,
    p.vehicle_rating,
    p.rating_count,
    p.tier::text,
    p.heart_count,
    cp.vehicle_type,
    coalesce(cp.vehicle_brand, p.vehicle_make) AS vehicle_brand,
    cp.vehicle_model,
    coalesce(cp.vehicle_color, p.vehicle_color) AS vehicle_color,
    coalesce(
      cp.vehicle_year,
      CASE WHEN p.vehicle_year ~ '^\d+$' THEN p.vehicle_year::integer ELSE NULL END
    ) AS vehicle_year,
    coalesce(cp.plate_number, p.vehicle_plate) AS plate_number,
    cp.nickname,
    cp.pricing_mode,
    cp.affiliation_type,
    cp.employment_type,
    cp.base_fare,
    cp.price_per_km,
    cp.price_per_min,
    cp.flag_fall_fee,
    cp.included_km,
    cp.verification_status,
    cp.facebook_url,
    cp.instagram_url
  FROM public.profiles p
  LEFT JOIN public.captain_profiles cp ON cp.id = p.id
  WHERE p.id = ANY(p_captain_ids)
    AND upper(coalesce(p.role::text, '')) IN ('CAPTAIN', 'DRIVER')
    AND (
      v_caller_admin
      OR p.id = v_caller
      OR (
        upper(coalesce(p.status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
        AND (
          EXISTS (
            SELECT 1
            FROM public.ride_offers ro
            JOIN public.ride_requests rr ON rr.id = ro.request_id
            WHERE ro.captain_id = p.id
              AND rr.rider_id = v_caller
          )
          OR EXISTS (
            SELECT 1
            FROM public.ride_requests rr
            WHERE rr.rider_id = v_caller
              AND rr.accepted_captain_id = p.id
          )
          OR EXISTS (
            SELECT 1
            FROM public.trips_72h_ledger tl
            WHERE tl.rider_id = v_caller
              AND tl.captain_id = p.id
          )
          OR EXISTS (
            SELECT 1
            FROM public.rider_favorite_captains rfc
            WHERE rfc.rider_id = v_caller
              AND rfc.captain_id = p.id
          )
          OR EXISTS (
            SELECT 1
            FROM public.captain_rider_referrals crr
            WHERE crr.rider_id = v_caller
              AND crr.captain_id = p.id
          )
        )
      )
    )
  LIMIT 100;
END;
$$;

REVOKE ALL ON FUNCTION public.get_safe_captain_cards(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_safe_captain_cards(uuid[]) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_safe_counterpart_profiles(uuid[]);
CREATE OR REPLACE FUNCTION public.get_safe_counterpart_profiles(p_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  rating numeric,
  rating_count integer,
  tier text,
  serial_id text,
  country_id integer,
  governorate_id integer,
  district_id integer,
  role text,
  phone text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_admin boolean := public.is_admin();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_user_ids IS NULL OR coalesce(array_length(p_user_ids, 1), 0) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.rating,
    p.rating_count,
    p.tier::text,
    p.serial_id,
    p.country_id,
    p.governorate_id,
    p.district_id,
    p.role::text,
    CASE
      WHEN v_caller_admin
        OR p.id = v_caller
        OR EXISTS (
          SELECT 1 FROM public.ride_requests rr
          WHERE rr.accepted_captain_id IS NOT NULL
            AND (
              (rr.rider_id = v_caller AND rr.accepted_captain_id = p.id)
              OR (rr.accepted_captain_id = v_caller AND rr.rider_id = p.id)
            )
            AND upper(coalesce(rr.status::text, '')) IN (
              'ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE', 'ACTIVE', 'STARTED', 'IN_PROGRESS', 'COMPLETED'
            )
        )
        OR EXISTS (
          SELECT 1 FROM public.trips_72h_ledger tl
          WHERE (tl.rider_id = v_caller AND tl.captain_id = p.id)
             OR (tl.captain_id = v_caller AND tl.rider_id = p.id)
        )
        OR EXISTS (
          SELECT 1 FROM public.rider_favorite_captains rfc
          WHERE rfc.rider_id = v_caller AND rfc.captain_id = p.id
        )
        OR EXISTS (
          SELECT 1 FROM public.captain_favorite_riders cfr
          WHERE cfr.captain_id = v_caller AND cfr.rider_id = p.id
        )
        OR EXISTS (
          SELECT 1 FROM public.captain_rider_referrals crr
          WHERE (crr.captain_id = v_caller AND crr.rider_id = p.id)
             OR (crr.rider_id = v_caller AND crr.captain_id = p.id)
        )
      THEN p.phone
      ELSE NULL::text
    END AS phone
  FROM public.profiles p
  WHERE p.id = ANY(p_user_ids)
  LIMIT 100;
END;
$$;

REVOKE ALL ON FUNCTION public.get_safe_counterpart_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_safe_counterpart_profiles(uuid[]) TO authenticated, service_role;

-- Harden get_my_blocked_users so arbitrary blocking cannot enumerate unknown user phone numbers
CREATE OR REPLACE FUNCTION public.get_my_blocked_users()
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  rating numeric,
  serial_id text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    ub.blocked_id AS id,
    coalesce(p.full_name, 'مستخدم محظور') AS name,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.ride_requests rr
        WHERE (rr.rider_id = auth.uid() AND rr.accepted_captain_id = ub.blocked_id)
           OR (rr.accepted_captain_id = auth.uid() AND rr.rider_id = ub.blocked_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.trips_72h_ledger tl
        WHERE (tl.rider_id = auth.uid() AND tl.captain_id = ub.blocked_id)
           OR (tl.captain_id = auth.uid() AND tl.rider_id = ub.blocked_id)
      )
      THEN coalesce(p.phone, '')
      ELSE ''::text
    END AS phone,
    coalesce(p.rating, 5.0) AS rating,
    coalesce(p.serial_id, '') AS serial_id,
    coalesce(p.role::text, '') AS role,
    ub.created_at
  FROM public.user_blocks ub
  LEFT JOIN public.profiles p ON p.id = ub.blocked_id
  WHERE ub.blocker_id = auth.uid()
  ORDER BY ub.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_blocked_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_blocked_users() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 6. Harden Financial, Cancellation, Bid & Telemetry RPCs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_captain_status(p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  requested_status text := lower(trim(coalesce(p_status, '')));
  captain_role text;
  current_status text;
  status_value text;
  wallet_minutes numeric := 0;
  wallet_expiry timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF requested_status NOT IN ('active', 'idle') THEN
    RAISE EXCEPTION 'invalid_captain_status';
  END IF;

  SELECT e.enumlabel
    INTO status_value
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE n.nspname = 'public'
    AND t.typname = 'user_status'
    AND lower(e.enumlabel) = requested_status
  LIMIT 1;

  IF status_value IS NULL THEN
    RAISE EXCEPTION 'invalid_captain_status';
  END IF;

  SELECT upper(p.role::text), upper(coalesce(p.status::text, ''))
    INTO captain_role, current_status
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF captain_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_role_required';
  END IF;

  IF current_status = 'BANNED' THEN
    RAISE EXCEPTION 'captain_account_banned' USING HINT = 'حسابك محظور نهائياً من قبل إدارة المنظومة.';
  END IF;

  IF current_status = 'SUSPENDED' AND requested_status = 'active' THEN
    RAISE EXCEPTION 'captain_account_suspended' USING HINT = 'حسابك معلق مؤقتاً من قبل الإدارة، ولا يمكنك الاتصال بالرادار.';
  END IF;

  IF requested_status = 'active' THEN
    SELECT
      greatest(0, coalesce(w.paid_minutes_remaining, 0))
        + greatest(0, coalesce(w.bonus_minutes_remaining, 0)),
      w.time_bundle_expires_at
    INTO wallet_minutes, wallet_expiry
    FROM public.wallet_accounts w
    WHERE w.profile_id = auth.uid();

    IF wallet_expiry IS NOT NULL AND wallet_expiry <= clock_timestamp() THEN
      wallet_expiry := clock_timestamp() + interval '60 days';
      UPDATE public.wallet_accounts
      SET time_bundle_expires_at = wallet_expiry,
          updated_at = clock_timestamp()
      WHERE profile_id = auth.uid();
    END IF;
  END IF;

  PERFORM set_config('radar.captain_status_rpc', 'on', true);

  UPDATE public.profiles
  SET status = status_value::public.user_status,
      updated_at = clock_timestamp()
  WHERE id = auth.uid();

  PERFORM set_config('radar.captain_status_rpc', '', true);

  IF NOT found THEN
    RAISE EXCEPTION 'captain_profile_not_found';
  END IF;

  RETURN jsonb_build_object(
    'profile_id', auth.uid(),
    'status', requested_status,
    'wallet_minutes', coalesce(wallet_minutes, 0),
    'time_bundle_expires_at', wallet_expiry,
    'has_active_bundle', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_captain_status(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_captain_status(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.approve_wallet_receipt(
    p_transaction_id uuid,
    p_credit_type text DEFAULT 'CASH',
    p_minutes integer DEFAULT 0,
    p_admin_id uuid DEFAULT NULL,
    p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tx record;
    v_prof record;
    v_wallet record;
    v_is_egypt boolean := false;
    v_currency_ar text;
    v_currency_code text;
    v_amount numeric;
    v_minutes_to_grant integer;
    v_new_balance numeric;
    v_new_minutes integer;
    v_expiry timestamptz;
    v_actor uuid := coalesce(auth.uid(), p_admin_id);
BEGIN
    IF NOT (
      current_user IN ('postgres', 'supabase_admin', 'service_role')
      OR coalesce(current_setting('role', true), '') = 'service_role'
      OR public.is_admin()
    ) THEN
      RAISE EXCEPTION 'admin_required';
    END IF;

    SELECT * INTO v_tx
    FROM public.wallet_transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_not_found');
    END IF;

    IF v_tx.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_already_approved');
    END IF;

    IF v_tx.status <> 'PENDING' THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_not_pending');
    END IF;

    v_amount := coalesce(v_tx.amount, 0);

    SELECT country_id, phone INTO v_prof
    FROM public.profiles
    WHERE id = v_tx.profile_id;

    v_is_egypt := (v_prof.country_id = 2 OR coalesce(v_prof.phone, '') LIKE '+20%');
    v_currency_ar := coalesce(v_tx.currency_ar, CASE WHEN v_is_egypt THEN 'ج.م' ELSE 'د.أ' END);
    v_currency_code := coalesce(v_tx.currency_code, CASE WHEN v_is_egypt THEN 'EGP' ELSE 'JOD' END);

    SELECT * INTO v_wallet
    FROM public.wallet_accounts
    WHERE profile_id = v_tx.profile_id
    FOR UPDATE;

    IF upper(coalesce(p_credit_type, 'CASH')) = 'MINUTES' THEN
        v_minutes_to_grant := CASE WHEN p_minutes > 0 THEN p_minutes ELSE round(v_amount * 60) END;
        v_new_minutes := coalesce(v_wallet.paid_minutes_remaining, 0) + v_minutes_to_grant;
        v_expiry := now() + interval '30 days';

        INSERT INTO public.wallet_accounts (
            profile_id, paid_minutes_remaining, currency_code, time_bundle_expires_at, active_package_name, updated_at
        ) VALUES (
            v_tx.profile_id, v_new_minutes, v_currency_code, v_expiry,
            'شحن إيصال (' || v_minutes_to_grant || ' دقيقة)', now()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
            paid_minutes_remaining = v_new_minutes,
            currency_code = v_currency_code,
            time_bundle_expires_at = v_expiry,
            active_package_name = 'شحن إيصال (' || v_minutes_to_grant || ' دقيقة)',
            updated_at = now();

        UPDATE public.wallet_transactions
        SET
            status = 'COMPLETED',
            currency_ar = v_currency_ar,
            currency_code = v_currency_code,
            description_ar = 'تمت الموافقة على الإيصال وتخصيص ' || v_minutes_to_grant || ' دقيقة رادار.',
            metadata = coalesce(v_tx.metadata, '{}'::jsonb) || jsonb_build_object(
                'approved_by', v_actor,
                'approved_at', now(),
                'credit_type', 'MINUTES',
                'minutes_credited', v_minutes_to_grant,
                'currency', v_currency_ar,
                'admin_note', p_admin_note
            ),
            updated_at = now()
        WHERE id = p_transaction_id;

        RETURN jsonb_build_object(
            'success', true,
            'credit_type', 'MINUTES',
            'minutes_credited', v_minutes_to_grant,
            'profile_id', v_tx.profile_id,
            'amount', v_amount,
            'currency', v_currency_ar
        );
    ELSE
        v_new_balance := round((coalesce(v_wallet.balance, 0) + v_amount)::numeric, 2);

        INSERT INTO public.wallet_accounts (profile_id, balance, currency_code, updated_at)
        VALUES (v_tx.profile_id, v_new_balance, v_currency_code, now())
        ON CONFLICT (profile_id) DO UPDATE SET
            balance = v_new_balance,
            currency_code = v_currency_code,
            updated_at = now();

        UPDATE public.wallet_transactions
        SET
            status = 'COMPLETED',
            currency_ar = v_currency_ar,
            currency_code = v_currency_code,
            description_ar = 'تمت الموافقة على الإيصال وإيداع ' || trim(to_char(v_amount, 'FM999999990.00')) || ' ' || v_currency_ar || ' في الرصيد النقدي.',
            metadata = coalesce(v_tx.metadata, '{}'::jsonb) || jsonb_build_object(
                'approved_by', v_actor,
                'approved_at', now(),
                'credit_type', 'CASH',
                'amount_credited', v_amount,
                'currency', v_currency_ar,
                'admin_note', p_admin_note
            ),
            updated_at = now()
        WHERE id = p_transaction_id;

        RETURN jsonb_build_object(
            'success', true,
            'credit_type', 'CASH',
            'amount_credited', v_amount,
            'profile_id', v_tx.profile_id,
            'currency', v_currency_ar
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_wallet_receipt(uuid, text, integer, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_wallet_receipt(uuid, text, integer, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.reject_wallet_receipt(
    p_transaction_id uuid,
    p_reason text DEFAULT 'الإيصال غير واضح أو لم يتم استلام التحويل',
    p_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tx record;
    v_reason text;
    v_actor uuid := coalesce(auth.uid(), p_admin_id);
BEGIN
    IF NOT (
      current_user IN ('postgres', 'supabase_admin', 'service_role')
      OR coalesce(current_setting('role', true), '') = 'service_role'
      OR public.is_admin()
    ) THEN
      RAISE EXCEPTION 'admin_required';
    END IF;

    SELECT * INTO v_tx
    FROM public.wallet_transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_not_found');
    END IF;

    IF v_tx.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_reject_completed_receipt');
    END IF;

    IF v_tx.status = 'REJECTED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_already_rejected');
    END IF;

    v_reason := coalesce(nullif(trim(p_reason), ''), 'الإيصال غير واضح أو لم يتم استلام التحويل');

    UPDATE public.wallet_transactions
    SET
        status = 'REJECTED',
        description_ar = 'تم رفض الإيصال: ' || v_reason,
        metadata = coalesce(v_tx.metadata, '{}'::jsonb) || jsonb_build_object(
            'rejected_by', v_actor,
            'rejected_at', now(),
            'reject_reason', v_reason,
            'rejection_reason', v_reason
        ),
        updated_at = now()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'profile_id', v_tx.profile_id,
        'reason', v_reason
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reject_wallet_receipt(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_wallet_receipt(uuid, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.delegate_charge_captain(
  p_captain_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  v_is_delegate boolean := false;
BEGIN
  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('role', true), '') = 'service_role'
    OR public.is_admin()
  ) THEN
    IF v_caller IS NULL THEN
      RAISE EXCEPTION 'authentication_required';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_caller
        AND upper(coalesce(role::text, '')) = 'DELEGATE'
        AND upper(coalesce(status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
    ) INTO v_is_delegate;

    IF NOT v_is_delegate THEN
      RAISE EXCEPTION 'delegate_or_admin_required';
    END IF;
  END IF;

  IF p_captain_id IS NULL THEN
    RAISE EXCEPTION 'captain_id_required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 5000 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_captain_id
      AND upper(coalesce(role::text, '')) IN ('CAPTAIN', 'DRIVER')
      AND upper(coalesce(status::text, 'ACTIVE')) <> 'BANNED'
  ) THEN
    RAISE EXCEPTION 'captain_not_found_or_ineligible';
  END IF;

  INSERT INTO public.wallet_accounts (profile_id, balance, paid_minutes_remaining)
  VALUES (p_captain_id, p_amount, 0)
  ON CONFLICT (profile_id) DO UPDATE
    SET balance = public.wallet_accounts.balance + p_amount,
        updated_at = clock_timestamp();

  INSERT INTO public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  VALUES (
    p_captain_id, 'delegate_charge', 'delegate_charge', p_amount, 'COMPLETED',
    coalesce(p_description, 'تم شحن المحفظة عن طريق المندوب.'),
    jsonb_build_object('delegate_id', v_caller, 'amountCredited', p_amount)
  );

  RETURN jsonb_build_object(
    'captain_id', p_captain_id,
    'amount', p_amount,
    'status', 'COMPLETED'
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.delegate_charge_captain(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delegate_charge_captain(uuid, numeric, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.redeem_voucher_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  v_status text;
  v_clean_code text := upper(trim(coalesce(p_code, '')));
  voucher public.wallet_vouchers%rowtype;
  v_country_id integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF length(v_clean_code) < 3 OR length(v_clean_code) > 64 THEN
    RAISE EXCEPTION 'invalid_voucher_code';
  END IF;

  SELECT country_id, upper(coalesce(status::text, 'ACTIVE'))
  INTO v_country_id, v_status
  FROM public.profiles
  WHERE id = v_caller;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_status IN ('BANNED', 'SUSPENDED') THEN
    RAISE EXCEPTION 'account_restricted';
  END IF;

  SELECT * INTO voucher FROM public.wallet_vouchers WHERE code = v_clean_code FOR UPDATE;
  IF NOT found THEN RAISE EXCEPTION 'voucher_not_found'; END IF;
  IF voucher.status <> 'UNUSED' THEN RAISE EXCEPTION 'voucher_already_used'; END IF;

  INSERT INTO public.wallet_accounts (profile_id, paid_minutes_remaining, time_bundle_expires_at)
  VALUES (v_caller, voucher.minutes_value, public.radar_bundle_expiry(v_country_id))
  ON CONFLICT (profile_id) DO UPDATE
    SET paid_minutes_remaining = public.wallet_accounts.paid_minutes_remaining + voucher.minutes_value,
        time_bundle_expires_at = greatest(
          coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
          public.radar_bundle_expiry(v_country_id)
        ),
        updated_at = clock_timestamp();

  INSERT INTO public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  VALUES (
    v_caller, 'voucher', 'voucher', voucher.minutes_value, 'COMPLETED',
    'تم تفعيل كود الشحن.',
    jsonb_build_object('voucher_code', voucher.code)
  );

  UPDATE public.wallet_vouchers
  SET status = 'REDEEMED', redeemed_by = v_caller, redeemed_at = clock_timestamp()
  WHERE code = voucher.code;

  RETURN jsonb_build_object('code', voucher.code, 'minutes_added', voucher.minutes_value, 'status', 'REDEEMED');
END;
$fn$;

REVOKE ALL ON FUNCTION public.redeem_voucher_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_voucher_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mutual_cancel_ride_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  req public.ride_requests%rowtype;
  v_caller uuid := auth.uid();
BEGIN
  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT found THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('role', true), '') = 'service_role'
    OR public.is_admin()
    OR (v_caller IS NOT NULL AND v_caller IN (req.rider_id, req.accepted_captain_id))
  ) THEN
    RAISE EXCEPTION 'not_trip_participant';
  END IF;

  IF upper(coalesce(req.status::text, '')) IN ('COMPLETED', 'CANCELLED') THEN
    RETURN jsonb_build_object('request_id', p_request_id, 'status', req.status, 'message', 'already_closed');
  END IF;

  PERFORM set_config('app.ride_request_status_rpc', 'true', true);

  UPDATE public.ride_requests
  SET status = 'CANCELLED',
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  UPDATE public.ride_offers
  SET status = 'REJECTED',
      updated_at = now()
  WHERE request_id = p_request_id AND status <> 'ACCEPTED';

  RETURN jsonb_build_object('request_id', p_request_id, 'status', 'CANCELLED');
END;
$$;

REVOKE ALL ON FUNCTION public.mutual_cancel_ride_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mutual_cancel_ride_request(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_mutual_trip_cancellation(
  p_request_id uuid,
  p_role text,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_req public.ride_requests%rowtype;
  v_caller uuid := auth.uid();
  v_effective_role text;
BEGIN
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  SELECT * INTO v_req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('role', true), '') = 'service_role'
    OR public.is_admin()
    OR (v_caller IS NOT NULL AND v_caller IN (v_req.rider_id, v_req.accepted_captain_id))
  ) THEN
    RAISE EXCEPTION 'not_trip_participant';
  END IF;

  IF v_caller = v_req.rider_id THEN
    v_effective_role := 'RIDER';
  ELSIF v_caller = v_req.accepted_captain_id THEN
    v_effective_role := 'CAPTAIN';
  ELSE
    v_effective_role := upper(coalesce(nullif(trim(p_role), ''), 'RIDER'));
  END IF;

  IF upper(coalesce(v_req.status::text, '')) IN ('COMPLETED', 'CANCELLED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'trip_already_closed', 'status', v_req.status);
  END IF;

  IF p_action = 'REQUEST' THEN
    UPDATE public.ride_requests
    SET cancel_requested_by = v_effective_role,
        cancel_request_time = now(),
        updated_at = now()
    WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'action', 'REQUEST', 'cancel_requested_by', v_effective_role);

  ELSIF p_action IN ('DECLINE', 'REVOKE') THEN
    UPDATE public.ride_requests
    SET cancel_requested_by = NULL,
        cancel_request_time = NULL,
        updated_at = now()
    WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'action', p_action, 'cancel_requested_by', NULL);

  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.request_mutual_trip_cancellation(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_mutual_trip_cancellation(uuid, text, text) TO authenticated, service_role;

DO $bids_fn$
DECLARE
  v_rating_expr text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'trust_rating'
  ) THEN
    v_rating_expr := 'COALESCE(p.rating, p.trust_score, p.trust_rating, 0)';
  ELSE
    v_rating_expr := 'COALESCE(p.rating, p.trust_score, 0)';
  END IF;

  EXECUTE format($fn_wrap$
CREATE OR REPLACE FUNCTION public.get_passenger_bids(p_request_id uuid)
RETURNS SETOF public.ride_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_pricing_preference text;
  v_rider_id uuid;
  v_caller uuid := auth.uid();
BEGIN
  SELECT pricing_preference, rider_id INTO v_pricing_preference, v_rider_id
  FROM public.ride_requests
  WHERE id = p_request_id;

  IF v_rider_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('role', true), '') = 'service_role'
    OR public.is_admin()
    OR (v_caller IS NOT NULL AND v_caller = v_rider_id)
  ) THEN
    RAISE EXCEPTION 'not_request_owner';
  END IF;

  RETURN QUERY
  SELECT ro.*
  FROM public.ride_offers ro
  JOIN public.profiles p ON p.id = ro.captain_id
  LEFT JOIN public.rider_favorite_captains f ON f.captain_id = ro.captain_id
      AND f.rider_id = v_rider_id
  WHERE ro.request_id = p_request_id
    AND (ro.status IS NULL OR ro.status::text = 'PENDING' OR ro.status::text = 'pending')
    AND (
      lower(coalesce(p.status::text, '')) IN ('active', 'online', 'available', 'ready', 'on_duty', 'on-duty')
    )
    AND upper(coalesce(p.status::text, '')) NOT IN ('BANNED', 'SUSPENDED')
    AND (
      ro.created_at + (coalesce(ro.wait_seconds, 90) * interval '1 second') > clock_timestamp()
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_blocks ub
      WHERE (ub.blocker_id = v_rider_id AND ub.blocked_id = ro.captain_id)
         OR (ub.blocker_id = ro.captain_id AND ub.blocked_id = v_rider_id)
    )
  ORDER BY
    (f.captain_id IS NOT NULL) DESC,
    (ro.pricing_mode = v_pricing_preference) DESC,
    COALESCE(ro.offer_price, ro.offered_fare, 999999) ASC,
    %s DESC,
    ro.created_at ASC
  LIMIT 9;
END;
$fn$;
$fn_wrap$, v_rating_expr);
END;
$bids_fn$;

REVOKE ALL ON FUNCTION public.get_passenger_bids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_passenger_bids(uuid) TO authenticated, service_role;

-- Secure Captain Radar Feed RPC (replaces direct client queries to security-definer captain_radar_requests view)
DROP FUNCTION IF EXISTS public.get_captain_radar_requests(text[], uuid[], timestamptz, integer);
CREATE OR REPLACE FUNCTION public.get_captain_radar_requests(
  p_origin_h3 text[] DEFAULT NULL,
  p_request_ids uuid[] DEFAULT NULL,
  p_since timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  rider_id uuid,
  origin_lat numeric,
  origin_lng numeric,
  destination_lat numeric,
  destination_lng numeric,
  origin_h3 text,
  h3_cell text,
  destination_h3 text,
  destination_address_ar text,
  destination_address_en text,
  destination_address text,
  server_estimated_fare numeric,
  country_id integer,
  status text,
  created_at timestamptz,
  accepted_offer_id uuid,
  accepted_captain_id uuid,
  final_fare numeric,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz,
  origin_address text,
  origin_google_maps_url text,
  estimated_distance_km numeric,
  estimated_duration_minutes numeric,
  rider_rating numeric,
  rider_rating_count integer,
  rider_favorited_me boolean,
  rider_completed_trips bigint,
  accepted_at timestamptz,
  pickup_eta_minutes integer,
  pricing_preference text,
  number_of_riders integer,
  seats integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $radar_fn$
DECLARE
  v_caller uuid := auth.uid();
  v_role text;
  v_status text;
  v_country_id integer;
  v_is_active_captain boolean := false;
  v_has_h3 boolean := p_origin_h3 IS NOT NULL AND coalesce(array_length(p_origin_h3, 1), 0) > 0;
  v_has_ids boolean := p_request_ids IS NOT NULL AND coalesce(array_length(p_request_ids, 1), 0) > 0;
  v_safe_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF NOT v_has_h3 AND NOT v_has_ids THEN
    RETURN;
  END IF;

  SELECT
    upper(coalesce(p.role::text, '')),
    upper(coalesce(p.status::text, 'ACTIVE')),
    p.country_id
  INTO v_role, v_status, v_country_id
  FROM public.profiles p
  WHERE p.id = v_caller;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_is_active_captain := v_role IN ('DRIVER', 'CAPTAIN')
    AND v_status NOT IN ('BANNED', 'SUSPENDED');

  IF NOT v_is_active_captain THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    rr.id::uuid,
    rr.rider_id::uuid,
    CASE WHEN rr.accepted_captain_id = v_caller THEN rr.origin_lat::numeric ELSE NULL::numeric END AS origin_lat,
    CASE WHEN rr.accepted_captain_id = v_caller THEN rr.origin_lng::numeric ELSE NULL::numeric END AS origin_lng,
    rr.destination_lat::numeric,
    rr.destination_lng::numeric,
    rr.origin_h3::text,
    rr.origin_h3::text AS h3_cell,
    rr.destination_h3::text,
    rr.destination_address_ar::text,
    NULL::text AS destination_address_en,
    rr.destination_address_ar::text AS destination_address,
    rr.server_estimated_fare::numeric,
    rr.country_id::integer,
    rr.status::text,
    rr.created_at::timestamptz,
    rr.accepted_offer_id::uuid,
    rr.accepted_captain_id::uuid,
    rr.final_fare::numeric,
    rr.arrived_at::timestamptz,
    rr.started_at::timestamptz,
    rr.completed_at::timestamptz,
    rr.updated_at::timestamptz,
    rr.origin_address::text,
    CASE
      WHEN rr.accepted_captain_id = v_caller
        AND rr.origin_google_maps_url IS NOT NULL
        AND rr.origin_google_maps_url !~* '(^|[?&](query|q)=)0([.]0+)?(,|%2[cC]|%20|[[:space:]])+0([.]0+)?([^0-9]|$)'
      THEN rr.origin_google_maps_url::text
      ELSE NULL::text
    END AS origin_google_maps_url,
    rr.estimated_distance_km::numeric,
    rr.estimated_duration_minutes::numeric,
    (
      SELECT pr.rating::numeric
      FROM public.profiles pr
      WHERE pr.id = rr.rider_id
        AND coalesce(pr.rating_count, 0) > 0
    ) AS rider_rating,
    (
      SELECT coalesce(pr.rating_count, 0)::integer
      FROM public.profiles pr
      WHERE pr.id = rr.rider_id
    ) AS rider_rating_count,
    (
      EXISTS (
        SELECT 1 FROM public.rider_favorite_captains fav
        WHERE fav.rider_id = rr.rider_id AND fav.captain_id = v_caller
      )
      OR EXISTS (
        SELECT 1 FROM public.captain_favorite_riders cfr
        WHERE cfr.captain_id = v_caller AND cfr.rider_id = rr.rider_id
      )
      OR EXISTS (
        SELECT 1 FROM public.captain_rider_referrals crr
        WHERE crr.captain_id = v_caller AND crr.rider_id = rr.rider_id
      )
      OR EXISTS (
        SELECT 1 FROM public.reviews rv
        WHERE rv.reviewer_id = rr.rider_id AND rv.reviewee_id = v_caller AND rv.gave_heart
      )
    ) AS rider_favorited_me,
    (
      SELECT count(*)::bigint
      FROM public.ride_requests done
      WHERE done.rider_id = rr.rider_id
        AND upper(coalesce(done.status::text, '')) = 'COMPLETED'
    ) AS rider_completed_trips,
    rr.accepted_at::timestamptz,
    rr.pickup_eta_minutes::integer,
    rr.pricing_preference::text,
    coalesce(rr.number_of_riders, 1)::integer AS number_of_riders,
    coalesce(rr.number_of_riders, 1)::integer AS seats
  FROM public.ride_requests rr
  WHERE
    (p_since IS NULL OR rr.created_at >= p_since)
    AND (
      (v_has_h3 AND rr.origin_h3 = ANY(p_origin_h3[1:250]))
      OR (v_has_ids AND rr.id = ANY(p_request_ids[1:100]))
    )
    AND (
      (
        upper(coalesce(rr.status::text, '')) = 'PENDING'
        AND (rr.country_id IS NULL OR v_country_id IS NULL OR rr.country_id = v_country_id)
        AND NOT EXISTS (
          SELECT 1
          FROM public.user_blocks ub
          WHERE (ub.blocker_id = rr.rider_id AND ub.blocked_id = v_caller)
             OR (ub.blocker_id = v_caller AND ub.blocked_id = rr.rider_id)
        )
      )
      OR rr.accepted_captain_id = v_caller
    )
  ORDER BY rr.created_at DESC
  LIMIT v_safe_limit;
END;
$radar_fn$;

REVOKE ALL ON FUNCTION public.get_captain_radar_requests(text[], uuid[], timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_captain_radar_requests(text[], uuid[], timestamptz, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_captain_inactive_riders(p_captain_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_target_captain uuid := coalesce(p_captain_id, auth.uid());
  v_record RECORD;
  v_notif_count integer := 0;
  v_rider_name text;
  v_notif_desc text;
  v_notif_id text;
  v_days_inactive integer;
BEGIN
  IF v_target_captain IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'captain_id_required');
  END IF;

  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('role', true), '') = 'service_role'
    OR public.is_admin()
    OR (v_caller IS NOT NULL AND v_caller = v_target_captain)
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_record IN
    SELECT
      r.id AS referral_id,
      r.rider_id,
      r.captain_id,
      r.created_at,
      r.last_interacted_at,
      r.last_inactivity_notified_at,
      p.full_name,
      greatest(10, floor(extract(epoch from (now() - coalesce(r.last_interacted_at, r.created_at))) / 86400))::int AS days_inactive
    FROM public.captain_rider_referrals r
    JOIN public.profiles p ON p.id = r.rider_id
    WHERE r.captain_id = v_target_captain
      AND coalesce(r.last_interacted_at, r.created_at) < (now() - INTERVAL '10 days')
      AND (r.last_inactivity_notified_at IS NULL OR r.last_inactivity_notified_at <= (now() - INTERVAL '10 days'))
  LOOP
    v_days_inactive := v_record.days_inactive;
    v_rider_name := coalesce(nullif(trim(v_record.full_name), ''), 'المسجل برابطك');
    v_notif_desc := 'الراكب (' || v_rider_name || ') غير متفاعل منذ ' || v_days_inactive::text || ' يوماً. عدم تفاعله في طلب الرحلات أو مشاهدة الإعلانات يضيع عليك تجميع النقاط وترقية رتبتك! تواصل معه وشجعه على التفاعل والاستفادة من خدماتك.';
    v_notif_id := 'notif_inact_' || v_record.captain_id::text || '_' || v_record.rider_id::text || '_' || to_char(now(), 'YYYYMMDD');

    INSERT INTO public.user_notifications (
      id, user_id, title, description, type, is_read, created_at
    ) VALUES (
      v_notif_id, v_record.captain_id, 'تنبيه عدم نشاط راكب ⚠️', v_notif_desc, 'referral_inactivity', false, now()
    )
    ON CONFLICT (id) DO UPDATE
    SET description = EXCLUDED.description, created_at = now(), is_read = false;

    UPDATE public.captain_rider_referrals
    SET last_inactivity_notified_at = now()
    WHERE id = v_record.referral_id;

    v_notif_count := v_notif_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'captain_id', v_target_captain,
    'notifications_dispatched', v_notif_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_captain_inactive_riders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_captain_inactive_riders(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.simulate_referral_inactivity(
  p_rider_id uuid,
  p_days_ago integer DEFAULT 11
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_referral RECORD;
  v_shift_interval interval;
BEGIN
  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('role', true), '') = 'service_role'
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  v_shift_interval := (greatest(1, coalesce(p_days_ago, 11)) || ' days')::interval;

  SELECT id, rider_id, captain_id INTO v_referral
  FROM public.captain_rider_referrals
  WHERE rider_id = p_rider_id
  LIMIT 1;

  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'referral_not_found');
  END IF;

  UPDATE public.captain_rider_referrals
  SET last_interacted_at = now() - v_shift_interval,
      last_inactivity_notified_at = NULL
  WHERE id = v_referral.id;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral.id,
    'rider_id', v_referral.rider_id,
    'simulated_days_ago', coalesce(p_days_ago, 11),
    'simulated_last_interacted_at', now() - v_shift_interval
  );
END;
$$;

REVOKE ALL ON FUNCTION public.simulate_referral_inactivity(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_referral_inactivity(uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.flush_ad_campaign_metrics(p_events jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  event_row jsonb;
  v_uid uuid := auth.uid();
  v_count integer;
  v_etype text;
BEGIN
  IF jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION 'events_must_be_array';
  END IF;

  v_count := jsonb_array_length(p_events);
  IF v_count > 50 THEN
    RAISE EXCEPTION 'too_many_ad_events';
  END IF;

  FOR event_row IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    v_etype := lower(coalesce(event_row->>'event_type', ''));
    IF v_etype NOT IN ('impression', 'click', 'swipe') THEN
      CONTINUE;
    END IF;

    UPDATE public.ad_campaigns
    SET impressions_count = impressions_count + CASE WHEN v_etype = 'impression' THEN 1 ELSE 0 END,
        clicks_count = clicks_count + CASE WHEN v_etype = 'click' THEN 1 ELSE 0 END,
        swipes_count = swipes_count + CASE WHEN v_etype = 'swipe' THEN 1 ELSE 0 END
    WHERE id::text = nullif(event_row->>'ad_id', '')
      AND upper(coalesce(status, '')) = 'ACTIVE';
  END LOOP;

  IF v_uid IS NOT NULL AND v_count > 0 THEN
    UPDATE public.captain_rider_referrals
    SET last_interacted_at = now()
    WHERE rider_id = v_uid;
  END IF;

  RETURN jsonb_build_object('accepted', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.flush_ad_campaign_metrics(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.flush_ad_campaign_metrics(jsonb) TO anon, authenticated, service_role;

-- Lock internal / maintenance / admin-only RPCs to service_role (and harden search_path)
DO $$
DECLARE
  fn_sig text;
  admin_fns text[] := ARRAY[
    'public.resync_all_captain_ranks()',
    'public.check_and_notify_inactive_referred_riders()',
    'public.purge_expired_72h_trips()',
    'public.recalibrate_traffic_factors(integer, boolean)',
    'public.find_account_by_phone(text)',
    'public.find_account_by_email(text)',
    'public.expire_stale_password_resets()',
    'public.recompute_profile_scores(uuid)',
    'public.measure_duration_accuracy(integer, integer)',
    'public.measure_duration_accuracy_by_hour(integer, integer)',
    'public.submit_ride_rating(uuid, uuid, integer)'
  ];
BEGIN
  FOREACH fn_sig IN ARRAY admin_fns
  LOOP
    IF to_regprocedure(fn_sig) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn_sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn_sig);
      IF fn_sig IN ('public.find_account_by_phone(text)', 'public.find_account_by_email(text)') THEN
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, auth, pg_temp', fn_sig);
      ELSE
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn_sig);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Tighten search_path on auth availability check while keeping public availability check functional
DO $$
BEGIN
  IF to_regprocedure('public.check_captain_identity_available(text, text, text, text, text)') IS NOT NULL THEN
    ALTER FUNCTION public.check_captain_identity_available(text, text, text, text, text)
      SET search_path = public, auth, pg_temp;
  END IF;
END;
$$;

-- Harden pulse_captain_location so banned/suspended or non-captain callers cannot inject live radar locations
CREATE OR REPLACE FUNCTION public.pulse_captain_location(
  p_lat numeric,
  p_lng numeric,
  p_h3_cell text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_country_id integer;
  v_role text;
  v_status text;
  v_h3 text := trim(coalesce(p_h3_cell, ''));
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_lat IS NULL OR p_lng IS NULL OR p_lat < -90 OR p_lat > 90 OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'invalid_coordinates';
  END IF;

  IF abs(p_lat) < 0.0001 AND abs(p_lng) < 0.0001 THEN
    RAISE EXCEPTION 'null_island_coordinates_rejected';
  END IF;

  -- Enforce sovereign territorial boundary matching src/core/logic/saudi-restriction.ts
  IF p_lat BETWEEN 16.0 AND 32.2
     AND p_lng BETWEEN 34.95 AND 55.7
     AND NOT (p_lat BETWEEN 29.18 AND 33.4 AND p_lng BETWEEN 34.95 AND 39.3)
     AND NOT (p_lng <= 34.95 OR (p_lat <= 24.0 AND p_lng <= 37.0))
  THEN
    RAISE EXCEPTION 'restricted_territory';
  END IF;

  IF length(v_h3) = 0 OR v_h3 !~ '^[0-9a-fA-F]{1,32}$' THEN
    RAISE EXCEPTION 'invalid_h3_cell';
  END IF;

  SELECT country_id, upper(coalesce(role::text, '')), upper(coalesce(status::text, ''))
  INTO v_country_id, v_role, v_status
  FROM public.profiles
  WHERE id = v_caller;

  IF v_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_role_required';
  END IF;

  IF v_status IN ('BANNED', 'SUSPENDED') THEN
    RAISE EXCEPTION 'captain_account_restricted';
  END IF;

  INSERT INTO public.captain_locations (captain_id, location_lat, location_lng, h3_cell, country_id, is_available, updated_at)
  VALUES (v_caller, p_lat, p_lng, v_h3, v_country_id, true, now())
  ON CONFLICT (captain_id) do update
    set location_lat = excluded.location_lat,
        location_lng = excluded.location_lng,
        h3_cell = excluded.h3_cell,
        country_id = excluded.country_id,
        is_available = true,
        updated_at = now();

  RETURN jsonb_build_object('captain_id', v_caller, 'h3_cell', v_h3, 'updated_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.pulse_captain_location(numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pulse_captain_location(numeric, numeric, text) TO authenticated, service_role;

-- Harden submit_ride_offer to reject BANNED/SUSPENDED captains and lock search_path
CREATE OR REPLACE FUNCTION public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric,
  p_wait_seconds integer DEFAULT 90,
  p_pricing_mode text DEFAULT 'FREE'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  req public.ride_requests%rowtype;
  captain_profile public.profiles%rowtype;
  captain_location public.captain_locations%rowtype;
  tariff public.captain_profiles%rowtype;
  cfg public.countries%rowtype;
  distance_km numeric;
  new_offer public.ride_offers%rowtype;
  max_distance_km constant numeric := 9;
  band jsonb;
  reference_fare numeric;
  floor_price numeric;
  ceiling_price numeric;
  v_tier public.captain_tier;
  metrics jsonb;
  road_km numeric;
  billable_km numeric;
  minutes numeric;
  km_charge numeric;
  min_charge numeric;
  meter_fare numeric;
  breakdown jsonb;
  is_above_band boolean := false;
  is_below_floor boolean := false;
  v_pricing_mode text := upper(coalesce(nullif(trim(p_pricing_mode), ''), 'FREE'));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  IF p_offer_price IS NULL OR p_offer_price <= 0 OR p_offer_price > 10000 THEN
    RAISE EXCEPTION 'invalid_offer_price';
  END IF;

  IF p_wait_seconds IS NULL OR p_wait_seconds < 5 OR p_wait_seconds > 1800 THEN
    RAISE EXCEPTION 'invalid_wait_seconds';
  END IF;

  IF v_pricing_mode NOT IN ('FREE', 'APP', 'TAXI') THEN
    RAISE EXCEPTION 'invalid_pricing_mode';
  END IF;

  SELECT * INTO captain_profile FROM public.profiles WHERE id = auth.uid();

  IF NOT found OR upper(coalesce(captain_profile.role::text, '')) NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  IF upper(coalesce(captain_profile.status::text, '')) IN ('BANNED', 'SUSPENDED') THEN
    RAISE EXCEPTION 'captain_account_restricted';
  END IF;

  SELECT * INTO tariff FROM public.captain_profiles WHERE id = auth.uid();
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

  IF EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE (blocker_id = req.rider_id AND blocked_id = auth.uid())
       OR (blocker_id = auth.uid() AND blocked_id = req.rider_id)
  ) THEN
    RAISE EXCEPTION 'user_block_active'
      USING HINT = 'لا يمكن تقديم عرض لوجود حظر نشط بينك وبين الراكب.';
  END IF;

  SELECT * INTO captain_location
  FROM public.captain_locations
  WHERE captain_id = auth.uid();

  IF NOT found OR captain_location.location_lat IS NULL OR captain_location.location_lng IS NULL THEN
    RAISE EXCEPTION 'captain_location_required'
      USING HINT = 'يجب تفعيل مشاركة الموقع الجغرافي لتقديم عرض على هذا الطلب.';
  END IF;

  IF req.origin_lat IS NOT NULL AND req.origin_lng IS NOT NULL THEN
    distance_km := 6371 * 2 * asin(sqrt(
      power(sin(radians(req.origin_lat - captain_location.location_lat) / 2), 2) +
      cos(radians(captain_location.location_lat)) * cos(radians(req.origin_lat)) *
      power(sin(radians(req.origin_lng - captain_location.location_lng) / 2), 2)
    ));

    IF distance_km > max_distance_km THEN
      RAISE EXCEPTION 'captain_too_far_from_pickup'
        USING HINT = 'أنت خارج نطاق الرادار المسموح (أكثر من 9 كم من نقطة الانطلاق).';
    END IF;
  END IF;

  reference_fare := req.server_estimated_fare;
  v_tier := coalesce(captain_profile.tier, 'BRONZE'::public.captain_tier);
  band := public.offer_band_for_rank(v_tier);

  IF reference_fare IS NOT NULL AND reference_fare > 0 THEN
    floor_price := round(reference_fare * (band->>'floorFactor')::numeric, 2);
    ceiling_price := round(reference_fare * (band->>'ceilingFactor')::numeric, 2);
    is_below_floor := p_offer_price < floor_price;
    is_above_band := p_offer_price > ceiling_price;
  END IF;

  SELECT * INTO cfg FROM public.countries WHERE id = coalesce(req.country_id, captain_profile.country_id);

  metrics := public.resolve_trip_metrics(
    req.estimated_distance_km, req.estimated_duration_minutes,
    req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng,
    coalesce(req.country_id, captain_profile.country_id)
  );
  road_km := (metrics->>'roadKm')::numeric;
  minutes := (metrics->>'minutes')::numeric;

  IF tariff.base_fare IS NOT NULL AND tariff.price_per_km IS NOT NULL AND tariff.price_per_min IS NOT NULL THEN
    billable_km := greatest(0, road_km - coalesce(tariff.included_km, 0));
    km_charge := round(billable_km * tariff.price_per_km, 2);
    min_charge := round(minutes * tariff.price_per_min, 2);
    meter_fare := round(greatest(
      coalesce(cfg.min_fare, tariff.base_fare),
      tariff.base_fare,
      tariff.base_fare + billable_km * tariff.price_per_km + minutes * tariff.price_per_min
    ), 2);

    breakdown := jsonb_build_object(
      'baseFare', tariff.base_fare,
      'perKm', tariff.price_per_km,
      'perMin', tariff.price_per_min,
      'includedKm', coalesce(tariff.included_km, 0),
      'roadKm', road_km,
      'billableKm', round(billable_km, 2),
      'minutes', minutes,
      'kmCharge', km_charge,
      'minCharge', min_charge,
      'meterFare', meter_fare,
      'marketFare', reference_fare,
      'floorPrice', floor_price,
      'ceilingPrice', ceiling_price,
      'isAboveBand', is_above_band,
      'isBelowFloor', is_below_floor,
      'tier', v_tier::text,
      'adjustment', round(p_offer_price - meter_fare, 2),
      'offeredFare', p_offer_price,
      'minTripFare', cfg.min_fare,
      'kmSource', metrics->>'kmSource',
      'minutesSource', metrics->>'minutesSource',
      'currencyAr', cfg.currency_ar,
      'currencyEn', cfg.currency_en
    );
  ELSE
    breakdown := jsonb_build_object(
      'marketFare', reference_fare,
      'floorPrice', floor_price,
      'ceilingPrice', ceiling_price,
      'isAboveBand', is_above_band,
      'isBelowFloor', is_below_floor,
      'tier', v_tier::text,
      'offeredFare', p_offer_price,
      'roadKm', road_km,
      'minutes', minutes,
      'kmSource', metrics->>'kmSource',
      'minutesSource', metrics->>'minutesSource',
      'tariffMissing', true,
      'currencyAr', cfg.currency_ar,
      'currencyEn', cfg.currency_en
    );
  END IF;

  INSERT INTO public.ride_offers (
    request_id, captain_id, offered_fare, offer_price, eta_minutes,
    wait_seconds, fare_breakdown, status, created_at, updated_at,
    pricing_mode
  )
  VALUES (
    p_request_id, auth.uid(), p_offer_price, p_offer_price, 5,
    p_wait_seconds, breakdown, 'PENDING', now(), now(),
    v_pricing_mode
  )
  RETURNING * INTO new_offer;

  RETURN jsonb_build_object(
    'id', new_offer.id,
    'request_id', new_offer.request_id,
    'captain_id', new_offer.captain_id,
    'offer_price', coalesce(new_offer.offer_price, new_offer.offered_fare),
    'eta_minutes', new_offer.eta_minutes,
    'wait_seconds', new_offer.wait_seconds,
    'fare_breakdown', new_offer.fare_breakdown,
    'status', new_offer.status,
    'pricing_mode', new_offer.pricing_mode
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.submit_ride_offer(uuid, numeric, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_ride_offer(uuid, numeric, integer, text) TO authenticated, service_role;

-- Harden claim_captain_referral to reject banned/suspended participants and lock search_path
CREATE OR REPLACE FUNCTION public.claim_captain_referral(p_captain_ref text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rider_id uuid := auth.uid();
  v_rider_status text;
  v_rider_name text;
  v_captain RECORD;
  v_existing_captain_id uuid;
  v_existing_captain_name text;
  v_existing_captain_serial text;
  v_clean_ref text := trim(coalesce(p_captain_ref, ''));
  v_notif_desc text;
BEGIN
  IF v_rider_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication_required');
  END IF;

  SELECT upper(coalesce(status::text, 'ACTIVE'))
  INTO v_rider_status
  FROM public.profiles
  WHERE id = v_rider_id;

  IF v_rider_status IN ('BANNED', 'SUSPENDED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'account_restricted');
  END IF;

  IF v_clean_ref = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_referral_ref');
  END IF;

  SELECT id, full_name, phone, serial_id, role, upper(coalesce(status::text, 'ACTIVE')) AS captain_status
  INTO v_captain
  FROM public.profiles
  WHERE (
    (serial_id IS NOT NULL AND lower(serial_id) = lower(v_clean_ref))
    OR id::text = v_clean_ref
  )
  AND upper(coalesce(role::text, '')) IN ('CAPTAIN', 'DRIVER')
  LIMIT 1;

  IF v_captain.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'captain_not_found');
  END IF;

  IF v_captain.captain_status IN ('BANNED', 'SUSPENDED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'captain_account_restricted');
  END IF;

  IF v_captain.id = v_rider_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_refer_self');
  END IF;

  SELECT r.captain_id, p.full_name, p.serial_id
  INTO v_existing_captain_id, v_existing_captain_name, v_existing_captain_serial
  FROM public.captain_rider_referrals r
  JOIN public.profiles p ON p.id = r.captain_id
  WHERE r.rider_id = v_rider_id;

  IF v_existing_captain_id IS NOT NULL THEN
    IF v_existing_captain_id = v_captain.id THEN
      INSERT INTO public.rider_favorite_captains (rider_id, captain_id, created_at)
      VALUES (v_rider_id, v_captain.id, now())
      ON CONFLICT (rider_id, captain_id) DO NOTHING;

      INSERT INTO public.captain_favorite_riders (captain_id, rider_id, created_at)
      VALUES (v_captain.id, v_rider_id, now())
      ON CONFLICT (captain_id, rider_id) DO NOTHING;

      RETURN jsonb_build_object(
        'success', true,
        'status', 'already_linked_to_this_captain',
        'captain_id', v_captain.id,
        'captain_name', v_captain.full_name,
        'captain_serial', v_captain.serial_id,
        'captain_phone', v_captain.phone
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_linked_to_other_captain',
        'existing_captain_id', v_existing_captain_id,
        'existing_captain_name', v_existing_captain_name,
        'existing_captain_serial', v_existing_captain_serial
      );
    END IF;
  END IF;

  INSERT INTO public.captain_rider_referrals (captain_id, rider_id, created_at)
  VALUES (v_captain.id, v_rider_id, now());

  INSERT INTO public.rider_favorite_captains (rider_id, captain_id, created_at)
  VALUES (v_rider_id, v_captain.id, now())
  ON CONFLICT (rider_id, captain_id) DO NOTHING;

  INSERT INTO public.captain_favorite_riders (captain_id, rider_id, created_at)
  VALUES (v_captain.id, v_rider_id, now())
  ON CONFLICT (captain_id, rider_id) DO NOTHING;

  SELECT coalesce(nullif(trim(full_name), ''), '')
  INTO v_rider_name
  FROM public.profiles
  WHERE id = v_rider_id;

  IF v_rider_name <> '' THEN
    v_notif_desc := 'انضم الراكب (' || v_rider_name || ') عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
  ELSE
    v_notif_desc := 'انضم راكب جديد عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
  END IF;

  INSERT INTO public.user_notifications (
    id, user_id, title, description, type, is_read, created_at
  )
  VALUES (
    'notif_ref_' || v_captain.id::text || '_' || v_rider_id::text,
    v_captain.id,
    'انضمام راكب جديد عبر رابط الإحالة 🎉',
    v_notif_desc,
    'referral',
    false,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'newly_linked',
    'captain_id', v_captain.id,
    'captain_name', v_captain.full_name,
    'captain_serial', v_captain.serial_id,
    'captain_phone', v_captain.phone
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_captain_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_captain_referral(text) TO authenticated, service_role;

-- Dynamic hardening of ALL public RPCs: revoke anon/PUBLIC execute everywhere outside explicit public utilities & lock search_path
DO $$
DECLARE
  fn RECORD;
  public_anon_allowlist text[] := ARRAY[
    'check_captain_identity_available',
    'flush_ad_campaign_metrics',
    'get_server_time',
    'trip_road_km',
    'country_traffic_factor',
    'resolve_governorate_from_point',
    'resolve_trip_metrics',
    'offer_band_for_rank',
    'sovereign_stars_to_rating',
    'calculate_sovereign_rank',
    'resolve_user_status',
    'is_active_captain_status',
    'amount_to_radar_minutes',
    'radar_bundle_expiry'
  ];
  service_only_names text[] := ARRAY[
    'resync_all_captain_ranks',
    'check_and_notify_inactive_referred_riders',
    'purge_expired_72h_trips',
    'recalibrate_traffic_factors',
    'find_account_by_phone',
    'find_account_by_email',
    'expire_stale_password_resets',
    'recompute_profile_scores',
    'measure_duration_accuracy',
    'measure_duration_accuracy_by_hour',
    'submit_ride_rating',
    'approve_wallet_receipt',
    'reject_wallet_receipt',
    'simulate_referral_inactivity'
  ];
BEGIN
  FOR fn IN
    SELECT p.proname, p.oid::regprocedure::text AS sig, p.prorettype
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid
          AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      -- Set safe search_path on every regular function (skipping auth-touching functions already set above)
      IF fn.proname NOT IN ('handle_new_user', 'find_account_by_phone', 'find_account_by_email', 'check_captain_identity_available') THEN
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.sig);
      END IF;

      -- Skip trigger functions for EXECUTE grants (never called via PostgREST directly)
      IF fn.prorettype = 'trigger'::regtype THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
        CONTINUE;
      END IF;

      IF fn.proname = ANY(service_only_names) THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
      ELSIF fn.proname = ANY(public_anon_allowlist) THEN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', fn.sig);
      ELSE
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn.sig);
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN
        NULL;
    END;
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.captain_self_topup(numeric, integer)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.captain_self_topup(numeric, integer) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.captain_self_topup(numeric, integer) TO authenticated, service_role;
  END IF;
END;
$$;

-- Disable self-topup testing backdoor flag for production market safety
DO $$
BEGIN
  IF to_regclass('public.app_flags') IS NOT NULL THEN
    UPDATE public.app_flags
    SET enabled = false, updated_at = now()
    WHERE flag = 'captain_self_topup';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Recreate captain_radar_requests View (security_invoker + service_role only)
--    & Enforce security_invoker = true on ALL public schema views
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.captain_radar_requests CASCADE;

CREATE VIEW public.captain_radar_requests
WITH (security_barrier = true, security_invoker = true)
AS
SELECT
  rr.id,
  rr.rider_id,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lat ELSE NULL::numeric END AS origin_lat,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lng ELSE NULL::numeric END AS origin_lng,
  rr.destination_lat,
  rr.destination_lng,
  rr.origin_h3,
  rr.origin_h3 AS h3_cell,
  rr.destination_h3,
  rr.destination_address_ar,
  NULL::text AS destination_address_en,
  rr.destination_address_ar AS destination_address,
  rr.server_estimated_fare,
  rr.country_id,
  rr.status,
  rr.created_at,
  rr.accepted_offer_id,
  rr.accepted_captain_id,
  rr.final_fare,
  rr.arrived_at,
  rr.started_at,
  rr.completed_at,
  rr.updated_at,
  rr.origin_address,
  CASE
    WHEN rr.accepted_captain_id = auth.uid()
      AND rr.origin_google_maps_url IS NOT NULL
      AND rr.origin_google_maps_url !~* '(^|[?&](query|q)=)0([.]0+)?(,|%2[cC]|%20|[[:space:]])+0([.]0+)?([^0-9]|$)'
    THEN rr.origin_google_maps_url
    ELSE NULL::text
  END AS origin_google_maps_url,
  rr.estimated_distance_km,
  rr.estimated_duration_minutes,
  (
    SELECT p.rating
    FROM public.profiles p
    WHERE p.id = rr.rider_id
      AND coalesce(p.rating_count, 0) > 0
  ) AS rider_rating,
  (
    SELECT coalesce(p.rating_count, 0)
    FROM public.profiles p
    WHERE p.id = rr.rider_id
  ) AS rider_rating_count,
  (
    EXISTS (
      SELECT 1 FROM public.rider_favorite_captains fav
      WHERE fav.rider_id = rr.rider_id AND fav.captain_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.captain_favorite_riders cfr
      WHERE cfr.captain_id = auth.uid() AND cfr.rider_id = rr.rider_id
    )
    OR EXISTS (
      SELECT 1 FROM public.captain_rider_referrals crr
      WHERE crr.captain_id = auth.uid() AND crr.rider_id = rr.rider_id
    )
    OR EXISTS (
      SELECT 1 FROM public.reviews rv
      WHERE rv.reviewer_id = rr.rider_id AND rv.reviewee_id = auth.uid() AND rv.gave_heart
    )
  ) AS rider_favorited_me,
  (
    SELECT count(*)
    FROM public.ride_requests done
    WHERE done.rider_id = rr.rider_id
      AND upper(coalesce(done.status::text, '')) = 'COMPLETED'
  ) AS rider_completed_trips,
  rr.accepted_at,
  rr.pickup_eta_minutes,
  rr.pricing_preference,
  coalesce(rr.number_of_riders, 1)::integer AS number_of_riders,
  coalesce(rr.number_of_riders, 1)::integer AS seats
FROM public.ride_requests rr
WHERE
  (
    upper(coalesce(rr.status::text, '')) = 'PENDING'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND upper(coalesce(p.role::text, '')) IN ('DRIVER', 'CAPTAIN')
        AND upper(coalesce(p.status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
        AND (rr.country_id IS NULL OR p.country_id = rr.country_id)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_blocks ub
      WHERE (ub.blocker_id = rr.rider_id AND ub.blocked_id = auth.uid())
         OR (ub.blocker_id = auth.uid() AND ub.blocked_id = rr.rider_id)
    )
  )
  OR rr.accepted_captain_id = auth.uid();

REVOKE ALL ON public.captain_radar_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.captain_radar_requests TO service_role;

DO $harden_views$
DECLARE
  v RECORD;
  mv RECORD;
BEGIN
  FOR v IN
    SELECT v_src.viewname
    FROM pg_views v_src
    JOIN pg_namespace n ON n.nspname = v_src.schemaname
    JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = v_src.viewname
    WHERE v_src.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        WHERE d.classid = 'pg_class'::regclass
          AND d.objid = c.oid
          AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true, security_barrier = true)', v.viewname);
      IF v.viewname = 'captain_radar_requests' THEN
        EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', v.viewname);
        EXECUTE format('GRANT SELECT ON public.%I TO service_role', v.viewname);
      ELSE
        EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', v.viewname);
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN
        NULL;
    END;
  END LOOP;

  FOR mv IN
    SELECT mv_src.matviewname
    FROM pg_matviews mv_src
    JOIN pg_namespace n ON n.nspname = mv_src.schemaname
    JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = mv_src.matviewname
    WHERE mv_src.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        WHERE d.classid = 'pg_class'::regclass
          AND d.objid = c.oid
          AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', mv.matviewname);
    EXCEPTION
      WHEN insufficient_privilege THEN
        NULL;
    END;
  END LOOP;
END;
$harden_views$;

-- -----------------------------------------------------------------------------
-- 8. Clean Sweep: Enable RLS, Drop ALL Legacy Policies, Revoke Client Grants
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t RECORD;
  pol RECORD;
BEGIN
  FOR t IN
    SELECT t_src.tablename
    FROM pg_tables t_src
    JOIN pg_namespace n ON n.nspname = t_src.schemaname
    JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = t_src.tablename
    WHERE t_src.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        WHERE d.classid = 'pg_class'::regclass
          AND d.objid = c.oid
          AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t.tablename
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t.tablename);
    END LOOP;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', t.tablename);
  END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. Least-Privilege Grants & RLS Policies Per Table
-- -----------------------------------------------------------------------------

-- 9.1 profiles (strict self/admin only; cross-user display uses get_safe_* RPCs)
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
CREATE POLICY profiles_select_self_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY profiles_update_self_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

-- 9.2 captain_profiles (strict self/admin only; vehicle cards use get_safe_captain_cards)
GRANT SELECT, INSERT, UPDATE ON TABLE public.captain_profiles TO authenticated;
CREATE POLICY captain_profiles_select_self_or_admin ON public.captain_profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY captain_profiles_insert_self_or_admin ON public.captain_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((id = (SELECT auth.uid()) AND coalesce(verification_status, 'PENDING') = 'PENDING') OR public.is_admin());
CREATE POLICY captain_profiles_update_self_or_admin ON public.captain_profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

-- 9.3 ad_campaigns (active ads publicly readable; mutations admin-only; schema-resilient owner column)
DO $rls_ads$
DECLARE
  v_owner_expr text := '';
  v_status_expr text := 'true';
  v_col RECORD;
BEGIN
  IF to_regclass('public.ad_campaigns') IS NOT NULL THEN
    FOR v_col IN
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ad_campaigns'
        AND column_name IN ('advertiser_id', 'user_id', 'profile_id', 'created_by')
    LOOP
      v_owner_expr := v_owner_expr || CASE
        WHEN v_col.data_type = 'uuid' THEN format(' OR %I = (SELECT auth.uid())', v_col.column_name)
        ELSE format(' OR %I::text = (SELECT auth.uid())::text', v_col.column_name)
      END;
    END LOOP;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'status'
    ) THEN
      v_status_expr := 'upper(coalesce(status::text, '''')) = ''ACTIVE''';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'is_active'
    ) THEN
      v_status_expr := 'coalesce(is_active, false) = true';
    END IF;

    EXECUTE 'GRANT SELECT ON TABLE public.ad_campaigns TO anon, authenticated';
    EXECUTE 'GRANT INSERT, UPDATE, DELETE ON TABLE public.ad_campaigns TO authenticated';
    EXECUTE format(
      'CREATE POLICY ad_campaigns_select_active_or_owner ON public.ad_campaigns FOR SELECT TO anon, authenticated USING ((%s)%s OR public.is_admin())',
      v_status_expr,
      v_owner_expr
    );
    EXECUTE 'CREATE POLICY ad_campaigns_manage_admin ON public.ad_campaigns FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END;
$rls_ads$;

-- 9.4 ad_favorites (self only; schema-safe profile_id / user_id detection)
DO $rls_ad_fav$
DECLARE
  v_col RECORD;
  v_pred text := '';
BEGIN
  IF to_regclass('public.ad_favorites') IS NOT NULL THEN
    FOR v_col IN
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ad_favorites'
        AND column_name IN ('profile_id', 'user_id')
      ORDER BY CASE column_name WHEN 'profile_id' THEN 1 ELSE 2 END
      LIMIT 1
    LOOP
      v_pred := CASE
        WHEN v_col.data_type = 'uuid' THEN format('%I = (SELECT auth.uid())', v_col.column_name)
        ELSE format('%I::text = (SELECT auth.uid())::text', v_col.column_name)
      END;
    END LOOP;

    IF v_pred = '' THEN
      v_pred := 'public.is_admin()';
    ELSE
      v_pred := v_pred || ' OR public.is_admin()';
    END IF;

    EXECUTE 'GRANT SELECT, INSERT, DELETE ON TABLE public.ad_favorites TO authenticated';
    EXECUTE format(
      'CREATE POLICY ad_favorites_manage_own ON public.ad_favorites FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      v_pred,
      v_pred
    );
  END IF;
END;
$rls_ad_fav$;

-- 9.5 ad_impression_batches (admin/service_role only if table exists)
DO $rls_ad_batches$
BEGIN
  IF to_regclass('public.ad_impression_batches') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.ad_impression_batches TO authenticated';
    EXECUTE 'CREATE POLICY ad_impression_batches_admin_only ON public.ad_impression_batches FOR SELECT TO authenticated USING (public.is_admin())';
  END IF;
END;
$rls_ad_batches$;

-- 9.6 app_flags (authenticated read restricted to public client UI flags only; sensitive directories server-only; admin manage)
GRANT SELECT ON TABLE public.app_flags TO authenticated;
CREATE POLICY app_flags_select_authenticated ON public.app_flags
  FOR SELECT TO authenticated
  USING (
    flag IN ('captain_self_topup', 'hourly_rates_matrix')
    OR public.is_admin()
  );
CREATE POLICY app_flags_manage_admin ON public.app_flags
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9.7 captain_ads (active public read; active captain/admin manage)
GRANT SELECT ON TABLE public.captain_ads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.captain_ads TO authenticated;
CREATE POLICY captain_ads_select_active_or_owner ON public.captain_ads
  FOR SELECT TO anon, authenticated
  USING (upper(coalesce(status, '')) = 'ACTIVE' OR captain_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY captain_ads_manage_own ON public.captain_ads
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      captain_id = (SELECT auth.uid())
      AND coalesce(seat_number, 0) BETWEEN 1 AND 10
      AND image_url ~* '^(https://|/api/captain/ads/image\?|/icons/|/images/|/assets/|data:image/(png|jpeg|jpg|webp|gif);base64,)'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND upper(coalesce(p.role::text, '')) IN ('CAPTAIN', 'DRIVER')
          AND upper(coalesce(p.status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
      )
    )
    OR public.is_admin()
  );
CREATE POLICY captain_ads_update_own ON public.captain_ads
  FOR UPDATE TO authenticated
  USING (captain_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (
    (
      captain_id = (SELECT auth.uid())
      AND coalesce(seat_number, 0) BETWEEN 1 AND 10
      AND image_url ~* '^(https://|/api/captain/ads/image\?|/icons/|/images/|/assets/|data:image/(png|jpeg|jpg|webp|gif);base64,)'
    )
    OR public.is_admin()
  );
CREATE POLICY captain_ads_delete_own ON public.captain_ads
  FOR DELETE TO authenticated
  USING (captain_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.8 captain_locations (authenticated recent active non-banned radar presence read in same country; writes via pulse RPC)
GRANT SELECT ON TABLE public.captain_locations TO authenticated;
CREATE POLICY captain_locations_select_recent ON public.captain_locations
  FOR SELECT TO authenticated
  USING (
    captain_id = (SELECT auth.uid())
    OR public.is_admin()
    OR (
      is_available = true
      AND updated_at > now() - interval '90 seconds'
      AND EXISTS (
        SELECT 1 FROM public.profiles viewer
        WHERE viewer.id = (SELECT auth.uid())
          AND upper(coalesce(viewer.status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
          AND (captain_locations.country_id IS NULL OR viewer.country_id IS NULL OR viewer.country_id = captain_locations.country_id)
      )
    )
  );

-- 9.9 captain_favorite_riders
GRANT SELECT, INSERT, DELETE ON TABLE public.captain_favorite_riders TO authenticated;
CREATE POLICY captain_favorite_riders_select ON public.captain_favorite_riders
  FOR SELECT TO authenticated
  USING (captain_id = (SELECT auth.uid()) OR rider_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY captain_favorite_riders_manage ON public.captain_favorite_riders
  FOR INSERT TO authenticated
  WITH CHECK (captain_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY captain_favorite_riders_delete ON public.captain_favorite_riders
  FOR DELETE TO authenticated
  USING (captain_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.10 captain_rider_referrals (read own; delete self-rider; inserts via claim_captain_referral RPC)
GRANT SELECT, DELETE ON TABLE public.captain_rider_referrals TO authenticated;
CREATE POLICY captain_rider_referrals_select ON public.captain_rider_referrals
  FOR SELECT TO authenticated
  USING (captain_id = (SELECT auth.uid()) OR rider_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY captain_rider_referrals_delete_rider ON public.captain_rider_referrals
  FOR DELETE TO authenticated
  USING (rider_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.11 captains_data (owner or admin; schema-resilient column check)
DO $rls_captains_data$
DECLARE
  v_col RECORD;
  v_pred text := '';
BEGIN
  IF to_regclass('public.captains_data') IS NOT NULL THEN
    FOR v_col IN
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'captains_data'
        AND column_name IN ('user_id', 'captain_id', 'profile_id', 'id')
    LOOP
      IF v_pred <> '' THEN
        v_pred := v_pred || ' OR ';
      END IF;
      v_pred := v_pred || CASE
        WHEN v_col.data_type = 'uuid' THEN format('%I = (SELECT auth.uid())', v_col.column_name)
        ELSE format('%I::text = (SELECT auth.uid())::text', v_col.column_name)
      END;
    END LOOP;

    IF v_pred = '' THEN
      v_pred := 'public.is_admin()';
    ELSE
      v_pred := v_pred || ' OR public.is_admin()';
    END IF;

    EXECUTE 'GRANT SELECT ON TABLE public.captains_data TO authenticated';
    EXECUTE format(
      'CREATE POLICY captains_data_select_own ON public.captains_data FOR SELECT TO authenticated USING (%s)',
      v_pred
    );
  END IF;
END;
$rls_captains_data$;

-- 9.12 countries, governorates, districts (public reference read; admin write)
GRANT SELECT ON TABLE public.countries, public.governorates, public.districts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.countries, public.governorates, public.districts TO authenticated;

CREATE POLICY countries_select_all ON public.countries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY countries_admin_write ON public.countries FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY governorates_select_all ON public.governorates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY governorates_admin_write ON public.governorates FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY districts_select_all ON public.districts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY districts_admin_write ON public.districts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.13 global_pulse (authenticated read-only aggregate district metrics; admin write)
DO $rls_global_pulse$
BEGIN
  IF to_regclass('public.global_pulse') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.global_pulse TO authenticated';
    EXECUTE 'CREATE POLICY global_pulse_select_auth ON public.global_pulse FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY global_pulse_admin_write ON public.global_pulse FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END;
$rls_global_pulse$;

-- 9.14 password_reset_requests & password_reset_audit (zero client access; server service_role only)
-- Already revoked above and zero policies -> default deny all client roles.

-- 9.15 referrals (referral records: involved parties or admin only; schema-resilient column check)
DO $rls_referrals$
DECLARE
  v_col RECORD;
  v_pred text := '';
BEGIN
  IF to_regclass('public.referrals') IS NOT NULL THEN
    FOR v_col IN
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'referrals'
        AND column_name IN (
          'delegate_id', 'referred_user_id', 'referrer_id', 'referred_id',
          'captain_id', 'rider_id', 'user_id', 'profile_id'
        )
    LOOP
      IF v_pred <> '' THEN
        v_pred := v_pred || ' OR ';
      END IF;
      v_pred := v_pred || CASE
        WHEN v_col.data_type = 'uuid' THEN format('%I = (SELECT auth.uid())', v_col.column_name)
        ELSE format('%I::text = (SELECT auth.uid())::text', v_col.column_name)
      END;
    END LOOP;

    IF v_pred = '' THEN
      v_pred := 'public.is_admin()';
    ELSE
      v_pred := v_pred || ' OR public.is_admin()';
    END IF;

    EXECUTE 'GRANT SELECT ON TABLE public.referrals TO authenticated';
    EXECUTE format(
      'CREATE POLICY referrals_select_own ON public.referrals FOR SELECT TO authenticated USING (%s)',
      v_pred
    );
  END IF;
END;
$rls_referrals$;

-- 9.16 reviews (involved parties read; insert only after COMPLETED trip participation)
GRANT SELECT, INSERT ON TABLE public.reviews TO authenticated;
CREATE POLICY reviews_select_involved ON public.reviews
  FOR SELECT TO authenticated
  USING (reviewer_id = (SELECT auth.uid()) OR reviewee_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY reviews_insert_verified_trip ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND reviewee_id <> (SELECT auth.uid())
    AND (
      EXISTS (
        SELECT 1
        FROM public.ride_requests rr
        WHERE rr.id = reviews.trip_id
          AND upper(coalesce(rr.status::text, '')) = 'COMPLETED'
          AND (
            (rr.rider_id = (SELECT auth.uid()) AND rr.accepted_captain_id = reviews.reviewee_id)
            OR (rr.accepted_captain_id = (SELECT auth.uid()) AND rr.rider_id = reviews.reviewee_id)
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.trips_72h_ledger tl
        WHERE tl.request_id = reviews.trip_id
          AND (
            (tl.rider_id = (SELECT auth.uid()) AND tl.captain_id = reviews.reviewee_id)
            OR (tl.captain_id = (SELECT auth.uid()) AND tl.rider_id = reviews.reviewee_id)
          )
      )
    )
  );

-- 9.17 ride_requests (participants/admin read; owner PENDING insert; RPC-only status updates)
GRANT SELECT, INSERT ON TABLE public.ride_requests TO authenticated;
CREATE POLICY ride_requests_select_participant ON public.ride_requests
  FOR SELECT TO authenticated
  USING (rider_id = (SELECT auth.uid()) OR accepted_captain_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY ride_requests_insert_own_pending ON public.ride_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    rider_id = (SELECT auth.uid())
    AND upper(coalesce(status::text, 'PENDING')) = 'PENDING'
    AND accepted_captain_id IS NULL
    AND accepted_offer_id IS NULL
    AND coalesce(final_fare, 0) = 0
  );

-- 9.18 ride_offers (related parties read; inserts via submit_ride_offer RPC; cancel/delete PENDING own only)
GRANT SELECT, UPDATE, DELETE ON TABLE public.ride_offers TO authenticated;
CREATE POLICY ride_offers_select_related ON public.ride_offers
  FOR SELECT TO authenticated
  USING (
    captain_id = (SELECT auth.uid())
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.ride_requests rr
      WHERE rr.id = ride_offers.request_id AND rr.rider_id = (SELECT auth.uid())
    )
  );
CREATE POLICY ride_offers_update_own_pending ON public.ride_offers
  FOR UPDATE TO authenticated
  USING (captain_id = (SELECT auth.uid()) AND upper(coalesce(status::text, 'PENDING')) <> 'ACCEPTED')
  WITH CHECK (captain_id = (SELECT auth.uid()) AND upper(coalesce(status::text, '')) IN ('CANCELLED', 'REJECTED'));
CREATE POLICY ride_offers_delete_own_pending ON public.ride_offers
  FOR DELETE TO authenticated
  USING ((captain_id = (SELECT auth.uid()) AND upper(coalesce(status::text, 'PENDING')) <> 'ACCEPTED') OR public.is_admin());

-- 9.19 rider_favorite_captains
GRANT SELECT, INSERT, DELETE ON TABLE public.rider_favorite_captains TO authenticated;
CREATE POLICY rider_favorite_captains_select ON public.rider_favorite_captains
  FOR SELECT TO authenticated
  USING (rider_id = (SELECT auth.uid()) OR captain_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY rider_favorite_captains_insert ON public.rider_favorite_captains
  FOR INSERT TO authenticated
  WITH CHECK (rider_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY rider_favorite_captains_delete ON public.rider_favorite_captains
  FOR DELETE TO authenticated
  USING (rider_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.20 rider_ratings (read-only for involved parties)
GRANT SELECT ON TABLE public.rider_ratings TO authenticated;
CREATE POLICY rider_ratings_select_involved ON public.rider_ratings
  FOR SELECT TO authenticated
  USING (rider_id = (SELECT auth.uid()) OR captain_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.21 trips_72h_ledger (participants or admin read-only)
GRANT SELECT ON TABLE public.trips_72h_ledger TO authenticated;
CREATE POLICY trips_72h_ledger_select_participant ON public.trips_72h_ledger
  FOR SELECT TO authenticated
  USING (rider_id = (SELECT auth.uid()) OR captain_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.22 user_blocks
GRANT SELECT, INSERT, DELETE ON TABLE public.user_blocks TO authenticated;
CREATE POLICY user_blocks_select_involved ON public.user_blocks
  FOR SELECT TO authenticated
  USING (blocker_id = (SELECT auth.uid()) OR blocked_id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY user_blocks_insert_self ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = (SELECT auth.uid()) AND blocked_id <> (SELECT auth.uid()));
CREATE POLICY user_blocks_delete_self ON public.user_blocks
  FOR DELETE TO authenticated
  USING (blocker_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.23 user_notifications
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notifications TO authenticated;
CREATE POLICY user_notifications_manage_own ON public.user_notifications
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.24 wallet_accounts (read-only for owner or admin)
GRANT SELECT ON TABLE public.wallet_accounts TO authenticated;
CREATE POLICY wallet_accounts_select_own ON public.wallet_accounts
  FOR SELECT TO authenticated
  USING (profile_id = (SELECT auth.uid()) OR public.is_admin());

-- 9.25 wallet_transactions (owner/admin read; owner PENDING receipt insert only; no client update/delete)
DO $rls_wallet_tx$
DECLARE
  v_has_tx_type boolean;
  v_has_receipt_path boolean;
  v_type_expr text;
  v_path_expr text := '';
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'transaction_type'
  ) INTO v_has_tx_type;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_transactions' AND column_name = 'receipt_path'
  ) INTO v_has_receipt_path;

  v_type_expr := CASE
    WHEN v_has_tx_type THEN 'lower(coalesce(type, transaction_type, ''receipt'')) IN (''receipt'', ''receipt_topup'', ''bank_transfer'', ''transfer'', ''manual_topup'', ''topup'')'
    ELSE 'lower(coalesce(type, ''receipt'')) IN (''receipt'', ''receipt_topup'', ''bank_transfer'', ''transfer'', ''manual_topup'', ''topup'')'
  END;

  IF v_has_receipt_path THEN
    v_path_expr := ' AND (receipt_path IS NULL OR receipt_path LIKE ((SELECT auth.uid())::text || ''/%''))';
  END IF;

  EXECUTE 'GRANT SELECT, INSERT ON TABLE public.wallet_transactions TO authenticated';
  EXECUTE 'CREATE POLICY wallet_transactions_select_own ON public.wallet_transactions FOR SELECT TO authenticated USING (profile_id = (SELECT auth.uid()) OR public.is_admin())';
  EXECUTE format($pol$
    CREATE POLICY wallet_transactions_insert_pending_receipt ON public.wallet_transactions
      FOR INSERT TO authenticated
      WITH CHECK (
        profile_id = (SELECT auth.uid())
        AND upper(coalesce(status, '')) = 'PENDING'
        AND %s
        AND coalesce(amount, 0) > 0
        AND coalesce(amount, 0) <= 10000%s
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = (SELECT auth.uid())
            AND upper(coalesce(p.status::text, 'ACTIVE')) NOT IN ('BANNED', 'SUSPENDED')
        )
      )
  $pol$, v_type_expr, v_path_expr);
END;
$rls_wallet_tx$;

-- 9.26 wallet_vouchers (zero direct client access; redeem via redeem_voucher_code RPC)
-- Already revoked above and zero policies -> default deny all client roles.

-- 9.27 Optional tables (create policies only if tables exist)
DO $rls_opt$
BEGIN
  IF to_regclass('public.captain_electronic_contracts') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.captain_electronic_contracts TO authenticated';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'captain_electronic_contracts' AND column_name = 'captain_id'
    ) THEN
      EXECUTE 'CREATE POLICY captain_contracts_select_own ON public.captain_electronic_contracts FOR SELECT TO authenticated USING (captain_id = (SELECT auth.uid()) OR public.is_admin())';
    ELSE
      EXECUTE 'CREATE POLICY captain_contracts_select_own ON public.captain_electronic_contracts FOR SELECT TO authenticated USING (public.is_admin())';
    END IF;
  END IF;

  IF to_regclass('public.delegate_tasks') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.delegate_tasks TO authenticated';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'delegate_tasks' AND column_name = 'delegate_id'
    ) THEN
      EXECUTE 'CREATE POLICY delegate_tasks_select_own_or_admin ON public.delegate_tasks FOR SELECT TO authenticated USING (delegate_id = (SELECT auth.uid()) OR public.is_admin())';
    ELSE
      EXECUTE 'CREATE POLICY delegate_tasks_select_own_or_admin ON public.delegate_tasks FOR SELECT TO authenticated USING (public.is_admin())';
    END IF;
    EXECUTE 'CREATE POLICY delegate_tasks_admin_manage ON public.delegate_tasks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;

  IF to_regclass('public.announcements') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.announcements TO authenticated';
    EXECUTE 'CREATE POLICY announcements_select_auth ON public.announcements FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY announcements_admin_manage ON public.announcements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END;
$rls_opt$;

-- -----------------------------------------------------------------------------
-- 10. Storage Bucket RLS Hardening (captain-ads, captain-documents, receipts)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS captain_ads_storage_select_public ON storage.objects;
DROP POLICY IF EXISTS captain_ads_storage_insert_authenticated ON storage.objects;
DROP POLICY IF EXISTS captain_ads_storage_insert_own ON storage.objects;
DROP POLICY IF EXISTS captain_ads_storage_update_own ON storage.objects;
DROP POLICY IF EXISTS captain_ads_storage_delete_own ON storage.objects;

CREATE POLICY captain_ads_storage_select_public
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'captain-ads');

CREATE POLICY captain_ads_storage_insert_own
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'captain-ads'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

CREATE POLICY captain_ads_storage_update_own
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'captain-ads'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'captain-ads'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

CREATE POLICY captain_ads_storage_delete_own
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'captain-ads'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

DROP POLICY IF EXISTS captain_documents_insert_own ON storage.objects;
DROP POLICY IF EXISTS captain_documents_select_own ON storage.objects;
DROP POLICY IF EXISTS captain_documents_update_own ON storage.objects;
DROP POLICY IF EXISTS captain_documents_delete_own ON storage.objects;

CREATE POLICY captain_documents_insert_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'captain-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

CREATE POLICY captain_documents_select_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'captain-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

CREATE POLICY captain_documents_update_own
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'captain-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'captain-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

CREATE POLICY captain_documents_delete_own
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'captain-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

DROP POLICY IF EXISTS receipts_upload_own ON storage.objects;
DROP POLICY IF EXISTS receipts_read_own ON storage.objects;

CREATE POLICY receipts_upload_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

CREATE POLICY receipts_read_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.is_admin())
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
