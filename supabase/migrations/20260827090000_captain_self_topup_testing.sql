-- TESTING ONLY: let a captain credit their own balance and minutes without an approver.
--
-- Requested so the dashboard can be exercised end to end without an admin or delegate in
-- the loop. This is, by definition, a hole: it lets a user mint their own credit. It is
-- therefore built so it can be closed from the database in one statement, with no code
-- deploy, and so the damage is bounded while it is open.
--
--   1. It is behind a flag. Turn it off with:
--        UPDATE public.app_flags SET enabled = false WHERE flag = 'captain_self_topup';
--   2. Amounts are capped per call and the caller may only credit THEMSELVES.
--   3. Every grant is written to wallet_transactions with type 'self_topup_test', so the
--      test credit is auditable and can be reversed:
--        SELECT * FROM public.wallet_transactions WHERE type = 'self_topup_test';
--
-- REMEMBER TO DISABLE THE FLAG BEFORE REAL USERS TOUCH THIS.
--
-- ---------------------------------------------------------------------------------------
-- SEPARATE, PRE-EXISTING PROBLEM — NOT INTRODUCED HERE, AND NOT FIXED HERE
--
-- public.delegate_charge_captain(uuid, numeric, text) is SECURITY DEFINER, granted to
-- `authenticated`, and performs NO check that the caller is a delegate or an admin. Any
-- signed-in user can already credit any wallet any amount by calling it directly. That is a
-- far bigger hole than this flag, and it is open in production right now. Left untouched
-- because closing it changes who can charge captains, which is a product decision.
-- ---------------------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. A flag table, so the switch lives in data rather than in a deployed constant.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_flags (
  flag text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_flags ENABLE ROW LEVEL SECURITY;

-- Readable so the UI can hide the control when the flag is off; writable by nobody through
-- the API — flipping it is a deliberate act in the SQL editor.
DROP POLICY IF EXISTS app_flags_select_all ON public.app_flags;
CREATE POLICY app_flags_select_all ON public.app_flags
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.app_flags TO authenticated;

INSERT INTO public.app_flags (flag, enabled, note)
VALUES (
  'captain_self_topup',
  true,
  'TESTING ONLY. Lets a captain credit their own wallet with no approver. Set enabled = false before real users.'
)
ON CONFLICT (flag) DO UPDATE
  SET enabled = excluded.enabled,
      note = excluded.note,
      updated_at = now();


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
  -- Bounded so a forgotten flag cannot become an unlimited money printer.
  MAX_AMOUNT_PER_CALL constant numeric := 500;
  MAX_MINUTES_PER_CALL constant integer := 600;
  v_caller uuid := auth.uid();
  v_enabled boolean;
  v_role text;
  v_amount numeric := coalesce(p_amount, 0);
  v_minutes integer := coalesce(p_minutes, 0);
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

  SELECT upper(coalesce(role::text, '')) INTO v_role FROM public.profiles WHERE id = v_caller;
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

  -- p_captain_id is deliberately absent from the signature: the caller can only ever
  -- credit themselves, so no argument can redirect the credit to another wallet.
  INSERT INTO public.wallet_accounts (profile_id, balance, paid_minutes_remaining)
  VALUES (v_caller, v_amount, v_minutes)
  ON CONFLICT (profile_id) DO UPDATE
    SET balance = public.wallet_accounts.balance + v_amount,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_minutes,
        -- Minutes are useless while the bundle window is expired, so extend it to cover
        -- what was just granted.
        time_bundle_expires_at = CASE
          WHEN v_minutes > 0 THEN greatest(
            coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
            now()
          ) + make_interval(mins => v_minutes)
          ELSE public.wallet_accounts.time_bundle_expires_at
        END,
        updated_at = now();

  INSERT INTO public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
  VALUES (
    v_caller,
    'self_topup_test',
    v_amount,
    'COMPLETED',
    'شحن اختباري ذاتي (وضع التجربة).',
    jsonb_build_object('minutes', v_minutes, 'testing', true)
  );

  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_caller;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_wallet.balance,
    'paidMinutesRemaining', v_wallet.paid_minutes_remaining,
    'timeBundleExpiresAt', v_wallet.time_bundle_expires_at
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.captain_self_topup(numeric, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_self_topup(numeric, integer) TO authenticated;

COMMENT ON FUNCTION public.captain_self_topup(numeric, integer) IS
  'TESTING ONLY. Credits the CALLER''s own wallet with no approver, while app_flags.captain_self_topup is enabled. Capped at 500 / 600 minutes per call. Disable before real users.';
