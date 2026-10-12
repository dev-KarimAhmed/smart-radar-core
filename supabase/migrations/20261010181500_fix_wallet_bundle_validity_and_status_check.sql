-- Migration: Fix wallet bundle validity check & set_captain_status to prevent premature expiry when minutes remain

BEGIN;

-- 1. Fix allocate_cash_balance_to_minutes to set validity window (60 days) instead of wall-clock countdown
CREATE OR REPLACE FUNCTION public.allocate_cash_balance_to_minutes(
  p_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_role       text;
  v_hour_price numeric;
  v_balance    numeric;
  v_minutes    integer;
  v_paid_after integer;
  v_new_bal    numeric;
  v_country_id integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT upper(p.role::text), c.radar_hour_price, p.country_id
    INTO v_role, v_hour_price, v_country_id
  FROM public.profiles p
  LEFT JOIN public.countries c ON c.id = p.country_id
  WHERE p.id = v_caller;

  IF v_role IS NULL OR v_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  v_hour_price := coalesce(nullif(v_hour_price, 0), 100);

  SELECT coalesce(balance, 0) INTO v_balance
  FROM public.wallet_accounts
  WHERE profile_id = v_caller
  FOR UPDATE;

  IF NOT found OR v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_balance' USING HINT = 'رصيدك النقدي لا يكفي لإجراء هذا التخصيص.';
  END IF;

  v_minutes := greatest(1, round(p_amount / (v_hour_price / 60.0))::integer);
  v_new_bal := round(v_balance - p_amount, 2);

  UPDATE public.wallet_accounts
  SET balance                = v_new_bal,
      paid_minutes_remaining = coalesce(paid_minutes_remaining, 0) + v_minutes,
      pending_seconds_debt   = 0,
      time_bundle_expires_at = greatest(
        coalesce(time_bundle_expires_at, now()),
        now() + interval '60 days'
      ),
      updated_at             = clock_timestamp()
  WHERE profile_id = v_caller
  RETURNING paid_minutes_remaining INTO v_paid_after;

  INSERT INTO public.wallet_transactions (profile_id, type, transaction_type, amount, status, description_ar, metadata)
  VALUES (
    v_caller, 'balance_allocated_to_time', 'balance_allocated_to_time', 0, 'COMPLETED',
    format('تخصيص %s ج.م من المحفظة إلى %s دقيقة رادار.', p_amount, v_minutes),
    jsonb_build_object(
      'allocatedAmount', p_amount,
      'minutesGranted', v_minutes,
      'remainingBalance', v_new_bal,
      'hourPrice', v_hour_price
    )
  );

  RETURN jsonb_build_object(
    'success',              true,
    'minutesGranted',       v_minutes,
    'allocatedAmount',      p_amount,
    'paidMinutesRemaining', v_paid_after,
    'remainingBalance',     v_new_bal
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.allocate_cash_balance_to_minutes(numeric) TO authenticated;

-- 2. Update set_captain_status to treat remaining minutes > 0 as active bundle and auto-heal expired time_bundle_expires_at
CREATE OR REPLACE FUNCTION public.set_captain_status(p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_status text := lower(trim(coalesce(p_status, '')));
  captain_role text;
  status_value text;
  wallet_minutes numeric := 0;
  wallet_expiry timestamptz;
  has_bundle boolean := false;
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

  SELECT upper(p.role::text)
    INTO captain_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF captain_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_role_required';
  END IF;

  IF requested_status = 'active' THEN
    SELECT
      greatest(0, coalesce(w.paid_minutes_remaining, 0))
        + greatest(0, coalesce(w.bonus_minutes_remaining, 0)),
      w.time_bundle_expires_at
    INTO wallet_minutes, wallet_expiry
    FROM public.wallet_accounts w
    WHERE w.profile_id = auth.uid();

    -- Any captain with remaining minutes HAS an active bundle.
    -- Auto-heal expired window if remaining minutes > 0.
    has_bundle := wallet_minutes > 0;

    IF NOT has_bundle THEN
      RAISE EXCEPTION 'captain_time_bundle_required';
    END IF;

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
    'wallet_minutes', wallet_minutes,
    'time_bundle_expires_at', wallet_expiry,
    'has_active_bundle', CASE WHEN requested_status = 'idle' THEN true ELSE has_bundle END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_captain_status(text) TO authenticated;

-- 3. Update get_captain_wallet_status RPC
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
  bundle_active boolean;
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
      'has_active_bundle', false,
      'status', 'MISSING'
    );
  END IF;

  total_minutes := greatest(0, coalesce(wallet_row.paid_minutes_remaining, 0))
    + greatest(0, coalesce(wallet_row.bonus_minutes_remaining, 0));

  -- Active bundle as long as minutes remain > 0
  bundle_active := total_minutes > 0;

  RETURN jsonb_build_object(
    'profile_id', wallet_row.profile_id,
    'balance', coalesce(wallet_row.balance, 0),
    'paid_minutes_remaining', greatest(0, coalesce(wallet_row.paid_minutes_remaining, 0)),
    'bonus_minutes_remaining', greatest(0, coalesce(wallet_row.bonus_minutes_remaining, 0)),
    'active_package_name', wallet_row.active_package_name,
    'time_bundle_expires_at', wallet_row.time_bundle_expires_at,
    'has_active_bundle', bundle_active,
    'status', CASE
      WHEN bundle_active THEN 'ACTIVE'
      ELSE 'EMPTY'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_captain_wallet_status() TO authenticated;

-- 4. Backfill existing wallet accounts with minutes remaining but expired time_bundle_expires_at
UPDATE public.wallet_accounts
SET time_bundle_expires_at = clock_timestamp() + interval '60 days',
    updated_at = clock_timestamp()
WHERE greatest(0, coalesce(paid_minutes_remaining, 0)) + greatest(0, coalesce(bonus_minutes_remaining, 0)) > 0
  AND (time_bundle_expires_at IS NULL OR time_bundle_expires_at <= clock_timestamp());

NOTIFY pgrst, 'reload schema';

COMMIT;
