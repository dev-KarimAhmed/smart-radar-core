-- Ensure top-up operations credit cash balance ONLY, requiring explicit manual allocation to radar minutes.
--
-- Fixes issue where topping up credited cash balance AND auto-converted to minutes simultaneously,
-- allowing double allocation.

BEGIN;

CREATE OR REPLACE FUNCTION public.captain_self_topup(
  p_amount numeric DEFAULT 0,
  p_minutes integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  MAX_AMOUNT_PER_CALL constant numeric := 5000;
  MAX_MINUTES_PER_CALL constant integer := 6000;
  v_caller uuid := auth.uid();
  v_enabled boolean;
  v_role text;
  v_amount numeric := greatest(0, coalesce(p_amount, 0));
  v_minutes integer := greatest(0, coalesce(p_minutes, 0));
  v_wallet public.wallet_accounts%rowtype;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT enabled INTO v_enabled FROM public.app_flags WHERE flag = 'captain_self_topup';
  IF NOT coalesce(v_enabled, false) THEN
    RAISE EXCEPTION 'self_topup_disabled'
      USING HINT = 'شحن الرصيد الذاتي متوقف. تواصل مع الإدارة.';
  END IF;

  SELECT upper(coalesce(role::text, ''))
  INTO v_role
  FROM public.profiles WHERE id = v_caller;

  IF v_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  IF v_amount = 0 AND v_minutes = 0 THEN
    RAISE EXCEPTION 'nothing_to_credit';
  END IF;

  IF v_amount > MAX_AMOUNT_PER_CALL THEN
    RAISE EXCEPTION 'amount_above_test_limit: %', MAX_AMOUNT_PER_CALL;
  END IF;

  IF v_minutes > MAX_MINUTES_PER_CALL THEN
    RAISE EXCEPTION 'minutes_above_test_limit: %', MAX_MINUTES_PER_CALL;
  END IF;

  INSERT INTO public.wallet_accounts (
    profile_id,
    balance,
    paid_minutes_remaining,
    time_bundle_expires_at
  )
  VALUES (
    v_caller,
    v_amount,
    v_minutes,
    CASE WHEN v_minutes > 0 THEN public.radar_bundle_expiry(NULL) ELSE NULL END
  )
  ON CONFLICT (profile_id) DO UPDATE
    SET balance = public.wallet_accounts.balance + v_amount,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_minutes,
        time_bundle_expires_at = CASE
          WHEN v_minutes > 0 THEN greatest(
            coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
            now()
          )
          ELSE public.wallet_accounts.time_bundle_expires_at
        END,
        updated_at = clock_timestamp();

  INSERT INTO public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  VALUES (
    v_caller, 'self_topup_test', 'self_topup_test', v_amount, 'COMPLETED',
    'شحن اختباري — إضافة رصيد نقدي للمحفظة.',
    jsonb_build_object(
      'amountCredited', v_amount,
      'minutesCredited', v_minutes,
      'testing', true
    )
  );

  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_caller;

  RETURN jsonb_build_object(
    'success', true,
    'amountCredited', v_amount,
    'minutesCredited', v_minutes,
    'balance', v_wallet.balance,
    'paidMinutesRemaining', v_wallet.paid_minutes_remaining,
    'timeBundleExpiresAt', v_wallet.time_bundle_expires_at
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.captain_self_topup(numeric, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_self_topup(numeric, integer) TO authenticated;


CREATE OR REPLACE FUNCTION public.delegate_charge_captain(
  p_captain_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

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
    jsonb_build_object('delegate_id', auth.uid(), 'amountCredited', p_amount)
  );

  RETURN jsonb_build_object(
    'captain_id', p_captain_id,
    'amount', p_amount,
    'status', 'COMPLETED'
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.delegate_charge_captain(uuid, numeric, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
