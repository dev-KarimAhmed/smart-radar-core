-- Migration: Allow captain to go active / available on radar even with zero balance
-- 1. Update set_captain_status to remove captain_time_bundle_required check

CREATE OR REPLACE FUNCTION public.set_captain_status(p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Block any banned captain from changing status
  IF current_status = 'BANNED' THEN
    RAISE EXCEPTION 'captain_account_banned' USING HINT = 'حسابك محظور نهائياً من قبل إدارة المنظومة.';
  END IF;

  -- Block suspended captain from going active
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

    -- Captains are always allowed to go active on radar even if minutes / balance is 0
    IF wallet_expiry IS NOT NULL AND wallet_expiry <= clock_timestamp() THEN
      wallet_expiry := clock_timestamp() + interval '60 days';
      UPDATE public.wallet_accounts
      SET time_bundle_expires_at = wallet_expiry,
          updated_at = clock_timestamp()
      WHERE profile_id = auth.uid();
    END IF;
  END IF;

  UPDATE public.profiles
  SET status = status_value::public.user_status,
      updated_at = clock_timestamp()
  WHERE id = auth.uid();

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

GRANT EXECUTE ON FUNCTION public.set_captain_status(text) TO authenticated;

-- 2. Update get_captain_wallet_status to always report has_active_bundle = true
CREATE OR REPLACE FUNCTION public.get_captain_wallet_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_row public.wallet_accounts%rowtype;
  total_minutes integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT *
  INTO wallet_row
  FROM public.wallet_accounts
  WHERE profile_id = auth.uid();

  IF NOT found THEN
    RETURN jsonb_build_object(
      'profile_id', auth.uid(),
      'balance', 0,
      'paid_minutes_remaining', 0,
      'bonus_minutes_remaining', 0,
      'active_package_name', null,
      'time_bundle_expires_at', null,
      'has_active_bundle', true,
      'status', 'ACTIVE'
    );
  END IF;

  total_minutes := greatest(0, coalesce(wallet_row.paid_minutes_remaining, 0))
    + greatest(0, coalesce(wallet_row.bonus_minutes_remaining, 0));

  RETURN jsonb_build_object(
    'profile_id', wallet_row.profile_id,
    'balance', coalesce(wallet_row.balance, 0),
    'paid_minutes_remaining', greatest(0, coalesce(wallet_row.paid_minutes_remaining, 0)),
    'bonus_minutes_remaining', greatest(0, coalesce(wallet_row.bonus_minutes_remaining, 0)),
    'active_package_name', wallet_row.active_package_name,
    'time_bundle_expires_at', wallet_row.time_bundle_expires_at,
    'has_active_bundle', true,
    'status', 'ACTIVE'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_captain_wallet_status() TO authenticated;

-- 3. Update consume_captain_radar_minutes to always report has_active_bundle = true
CREATE OR REPLACE FUNCTION public.consume_captain_radar_minutes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_wallet public.wallet_accounts%rowtype;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallet_accounts
  WHERE profile_id = v_caller
  FOR UPDATE;

  IF NOT found THEN
    RETURN jsonb_build_object('consumed_minutes', 0, 'reason', 'no_wallet', 'has_active_bundle', true);
  END IF;

  UPDATE public.wallet_accounts
  SET last_minute_tick_at = clock_timestamp(),
      updated_at          = clock_timestamp()
  WHERE profile_id = v_caller;

  RETURN jsonb_build_object(
    'consumed_minutes',        0,
    'paid_minutes_remaining',  greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0)),
    'bonus_minutes_remaining', greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0)),
    'has_active_bundle',       true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_captain_radar_minutes() TO authenticated;

