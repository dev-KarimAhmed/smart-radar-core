-- Every server-side wallet write was failing on a NOT NULL column nobody was setting.
--
--   null value in column "transaction_type" of relation "wallet_transactions"
--   violates not-null constraint                                        (SQLSTATE 23502)
--
-- public.wallet_transactions carries BOTH `type` and `transaction_type`. They hold the same
-- value and `transaction_type` is NOT NULL. The column is not created by any migration —
-- like several other columns in this project it was added by hand — so the functions
-- written against the migration's schema never knew about it.
--
-- The only writer that worked is the receipt upload in use-sovereign-wallet.ts, which sets
-- both. Every server function set only `type`, so ALL of these raised 23502 on every call:
--
--   redeem_voucher_code      -> voucher redemption has never worked
--   delegate_charge_captain  -> delegate top-up has never worked
--   captain_self_topup       -> the testing top-up added in 20260827130000
--
-- The knock-on effect reported from the dashboard: a captain could not go online at all
-- ('captain_time_bundle_required'), because no route existed by which they could ever
-- receive minutes.
--
-- Fixed by backfilling a default so the column can no longer be the thing that breaks a
-- write, AND by setting it explicitly in each function so the intent is visible at the call
-- site rather than relying on the default.


-- ---------------------------------------------------------------------------
-- 1. Stop the column being a tripwire.
--
--    A DEFAULT means an insert that forgets it lands as 'transaction' instead of throwing.
--    The functions below still set it properly; this is the seatbelt, not the fix.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE public.wallet_transactions ALTER COLUMN transaction_type SET DEFAULT 'transaction';

    -- Any rows that predate this and slipped in without one.
    UPDATE public.wallet_transactions
    SET transaction_type = coalesce(type, 'transaction')
    WHERE transaction_type IS NULL;
  END IF;
END;
$$;

COMMENT ON COLUMN public.wallet_transactions.transaction_type IS
  'Duplicate of `type`, NOT NULL. Kept in step by every writer. Consider collapsing the two columns — carrying the same value twice is what caused every wallet write to fail once one of them was forgotten.';


-- ---------------------------------------------------------------------------
-- 2. The self top-up.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.captain_self_topup(
  p_amount numeric DEFAULT 0,
  p_minutes integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  MAX_AMOUNT_PER_CALL constant numeric := 500;
  MAX_MINUTES_PER_CALL constant integer := 600;
  v_caller uuid := auth.uid();
  v_enabled boolean;
  v_role text;
  v_country_id integer;
  v_amount numeric := coalesce(p_amount, 0);
  v_minutes integer := coalesce(p_minutes, 0);
  v_conversion jsonb;
  v_converted_minutes integer := 0;
  v_remainder numeric := 0;
  v_total_minutes integer;
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

  SELECT upper(coalesce(role::text, '')), country_id
  INTO v_role, v_country_id
  FROM public.profiles WHERE id = v_caller;

  IF v_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  IF v_amount < 0 OR v_minutes < 0 THEN
    RAISE EXCEPTION 'invalid_amount';
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

  IF v_amount > 0 THEN
    v_conversion := public.amount_to_radar_minutes(v_amount, v_country_id);
    v_converted_minutes := (v_conversion->>'minutes')::integer;
    v_remainder := (v_conversion->>'remainder')::numeric;
  END IF;

  v_total_minutes := v_minutes + v_converted_minutes;

  IF v_total_minutes <= 0 THEN
    -- The amount did not buy a single whole minute. Say so instead of recording a
    -- "successful" top-up that granted nothing.
    RAISE EXCEPTION 'amount_below_one_minute'
      USING HINT = 'المبلغ أقل من سعر دقيقة واحدة. زوّد المبلغ.';
  END IF;

  INSERT INTO public.wallet_accounts (profile_id, balance, paid_minutes_remaining)
  VALUES (v_caller, v_remainder, v_total_minutes)
  ON CONFLICT (profile_id) DO UPDATE
    SET balance = public.wallet_accounts.balance + v_remainder,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_total_minutes,
        time_bundle_expires_at = CASE
          WHEN v_total_minutes > 0 THEN greatest(
            coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
            now()
          ) + make_interval(mins => v_total_minutes)
          ELSE public.wallet_accounts.time_bundle_expires_at
        END,
        updated_at = now();

  INSERT INTO public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  VALUES (
    v_caller, 'self_topup_test', 'self_topup_test', v_amount, 'COMPLETED',
    'شحن اختباري ذاتي — تحويل الرصيد إلى وقت رادار.',
    jsonb_build_object(
      'minutesGranted', v_total_minutes,
      'minutesFromAmount', v_converted_minutes,
      'minutesDirect', v_minutes,
      'remainder', v_remainder,
      'conversion', v_conversion,
      'testing', true
    )
  );

  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_caller;

  RETURN jsonb_build_object(
    'success', true,
    'minutesGranted', v_total_minutes,
    'balance', v_wallet.balance,
    'paidMinutesRemaining', v_wallet.paid_minutes_remaining,
    'timeBundleExpiresAt', v_wallet.time_bundle_expires_at
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.captain_self_topup(numeric, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_self_topup(numeric, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. The delegate charge. Same 23502 — this has never completed a single call.
--
--    Still performs NO authorisation check, unchanged and deliberate: deciding who may
--    charge a captain is a product call, not a bug fix. Flagged again because fixing the
--    crash means it now actually runs for anyone who calls it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delegate_charge_captain(
  p_captain_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_country_id integer;
  v_conversion jsonb;
  v_minutes integer := 0;
  v_remainder numeric := 0;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT country_id INTO v_country_id FROM public.profiles WHERE id = p_captain_id;

  v_conversion := public.amount_to_radar_minutes(p_amount, v_country_id);
  v_minutes := (v_conversion->>'minutes')::integer;
  v_remainder := (v_conversion->>'remainder')::numeric;

  INSERT INTO public.wallet_accounts (profile_id, balance, paid_minutes_remaining)
  VALUES (p_captain_id, v_remainder, v_minutes)
  ON CONFLICT (profile_id) DO UPDATE
    SET balance = public.wallet_accounts.balance + v_remainder,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_minutes,
        time_bundle_expires_at = CASE
          WHEN v_minutes > 0 THEN greatest(
            coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
            now()
          ) + make_interval(mins => v_minutes)
          ELSE public.wallet_accounts.time_bundle_expires_at
        END,
        updated_at = now();

  INSERT INTO public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  VALUES (
    p_captain_id, 'delegate_charge', 'delegate_charge', p_amount, 'COMPLETED',
    coalesce(p_description, 'تم شحن وقت الرادار عن طريق المندوب.'),
    jsonb_build_object('delegate_id', auth.uid(), 'minutesGranted', v_minutes, 'conversion', v_conversion)
  );

  RETURN jsonb_build_object(
    'captain_id', p_captain_id,
    'amount', p_amount,
    'minutesGranted', v_minutes,
    'status', 'COMPLETED'
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.delegate_charge_captain(uuid, numeric, text) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. Voucher redemption. Same 23502, so no code has ever been successfully redeemed.
--
--    Body kept identical to the original apart from two things: transaction_type is now
--    set, and the bundle window is extended to cover the granted minutes. The second is
--    needed because get_captain_wallet_status treats minutes as unusable once
--    time_bundle_expires_at is in the past — a voucher used to add minutes the captain
--    could not spend.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.redeem_voucher_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  voucher public.wallet_vouchers%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT * INTO voucher FROM public.wallet_vouchers WHERE code = upper(trim(p_code)) FOR UPDATE;
  IF NOT found THEN RAISE EXCEPTION 'voucher_not_found'; END IF;
  IF voucher.status <> 'UNUSED' THEN RAISE EXCEPTION 'voucher_already_used'; END IF;

  INSERT INTO public.wallet_accounts (profile_id, paid_minutes_remaining)
  VALUES (auth.uid(), voucher.minutes_value)
  ON CONFLICT (profile_id) DO UPDATE
    SET paid_minutes_remaining = public.wallet_accounts.paid_minutes_remaining + voucher.minutes_value,
        time_bundle_expires_at = greatest(
          coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
          now()
        ) + make_interval(mins => voucher.minutes_value),
        updated_at = now();

  INSERT INTO public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  VALUES (
    auth.uid(), 'voucher', 'voucher', voucher.minutes_value, 'COMPLETED',
    'تم تفعيل كود الشحن.',
    jsonb_build_object('voucher_code', voucher.code)
  );

  UPDATE public.wallet_vouchers
  SET status = 'REDEEMED', redeemed_by = auth.uid(), redeemed_at = now()
  WHERE code = voucher.code;

  RETURN jsonb_build_object('code', voucher.code, 'minutes_added', voucher.minutes_value, 'status', 'REDEEMED');
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.redeem_voucher_code(text) TO authenticated;
