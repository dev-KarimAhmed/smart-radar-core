-- The time bundle was being consumed by the clock, not by trips.
--
-- Reported as a contradiction on the captain dashboard: the status toggle reads متاح while
-- the radar panel right beside it reads غير متاح حالياً / الرادار غير مفعل.
--
-- Neither is lying. set_captain_status and get_captain_wallet_status ask the same question
-- with the same logic, so the activation genuinely succeeded — the captain DID have a usable
-- bundle at that moment. What changed afterwards is the expiry:
--
--   time_bundle_expires_at = greatest(coalesce(expires_at, now()), now())
--                          + make_interval(mins => v_total_minutes)
--
-- The bundle expired after as many WALL-CLOCK minutes as were purchased. Top up 60 minutes,
-- go online, wait an hour for a ride, and the bundle is dead — having driven nothing. The
-- profile stays 'active' because nothing resets it, and that is the screenshot.
--
-- This was my own line, added in 20260827180000, and it directly contradicts the requirement
-- it was later asked to support:
--
--   "يتم خصم رسوم استخدام المحفظة فقط أثناء وجود الكابتن في رحلة فعلية"
--
-- Two consumption meters were running against one balance:
--
--   charge_wallet_for_trip_time (20260904090000)  minutes drop during a trip   <- correct
--   time_bundle_expires_at                        the lot dies on a timer      <- wrong
--
-- A captain who buys 60 minutes and drives one 10-minute trip must have 50 minutes left.
--
--
-- THE FIX
--
-- time_bundle_expires_at becomes a VALIDITY WINDOW — "use your credit within N days" — which
-- is what an expiry is for. It stops being a consumption mechanism. The minute balance is
-- the meter, and charge_wallet_for_trip_time is the only thing that moves it.


-- ---------------------------------------------------------------------------
-- 1. How long credit stays valid.
--
--    A column, not a constant, because it is a commercial decision and whoever changes it
--    should not have to edit a function body to do it.
-- ---------------------------------------------------------------------------

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS radar_bundle_validity_days integer NOT NULL DEFAULT 60;

COMMENT ON COLUMN public.countries.radar_bundle_validity_days IS
  'How long topped-up radar minutes stay usable. A validity window, NOT a consumption timer — minutes are only spent by charge_wallet_for_trip_time during a real trip.';


CREATE OR REPLACE FUNCTION public.radar_bundle_expiry(p_country_id integer)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT now() + make_interval(days => coalesce(
    (SELECT c.radar_bundle_validity_days FROM public.countries c WHERE c.id = p_country_id),
    60
  ));
$fn$;

GRANT EXECUTE ON FUNCTION public.radar_bundle_expiry(integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Every top-up path extends the window instead of counting down the minutes.
--
--    Each of these previously did `+ make_interval(mins => <minutes granted>)`.
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
    RAISE EXCEPTION 'amount_below_one_minute'
      USING HINT = 'المبلغ أقل من سعر دقيقة واحدة. زوّد المبلغ.';
  END IF;

  INSERT INTO public.wallet_accounts (profile_id, balance, paid_minutes_remaining, time_bundle_expires_at)
  VALUES (v_caller, v_remainder, v_total_minutes, public.radar_bundle_expiry(v_country_id))
  ON CONFLICT (profile_id) DO UPDATE
    SET balance = public.wallet_accounts.balance + v_remainder,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_total_minutes,
        -- A validity window from NOW, not a countdown of the minutes bought. `greatest` so a
        -- top-up can only ever push the window out, never shorten one already further away.
        time_bundle_expires_at = greatest(
          coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
          public.radar_bundle_expiry(v_country_id)
        ),
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

  INSERT INTO public.wallet_accounts (profile_id, balance, paid_minutes_remaining, time_bundle_expires_at)
  VALUES (p_captain_id, v_remainder, v_minutes, public.radar_bundle_expiry(v_country_id))
  ON CONFLICT (profile_id) DO UPDATE
    SET balance = public.wallet_accounts.balance + v_remainder,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_minutes,
        time_bundle_expires_at = greatest(
          coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
          public.radar_bundle_expiry(v_country_id)
        ),
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


CREATE OR REPLACE FUNCTION public.redeem_voucher_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  voucher public.wallet_vouchers%rowtype;
  v_country_id integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT * INTO voucher FROM public.wallet_vouchers WHERE code = upper(trim(p_code)) FOR UPDATE;
  IF NOT found THEN RAISE EXCEPTION 'voucher_not_found'; END IF;
  IF voucher.status <> 'UNUSED' THEN RAISE EXCEPTION 'voucher_already_used'; END IF;

  SELECT country_id INTO v_country_id FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.wallet_accounts (profile_id, paid_minutes_remaining, time_bundle_expires_at)
  VALUES (auth.uid(), voucher.minutes_value, public.radar_bundle_expiry(v_country_id))
  ON CONFLICT (profile_id) DO UPDATE
    SET paid_minutes_remaining = public.wallet_accounts.paid_minutes_remaining + voucher.minutes_value,
        time_bundle_expires_at = greatest(
          coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
          public.radar_bundle_expiry(v_country_id)
        ),
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


-- ---------------------------------------------------------------------------
-- 2b. Resolving a status name to whatever this database's enum actually calls it.
--
--     public.user_status has NO 'idle' label — writing `status = 'idle'` fails outright:
--
--       ERROR 22P02: invalid input value for enum user_status: "idle"
--
--     set_captain_status already deals with this: it looks the label up in pg_enum and
--     accepts any of several synonyms, because the enum's contents differ between
--     environments. That logic was written inline inside that one function, so the next
--     thing to need it — this migration — hardcoded a literal and broke.
--
--     Extracted here so there is one resolver, and so `= 'active'` comparisons elsewhere in
--     this file stop being wrong too: a captain marked 'online' would never have matched.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_user_status(p_requested text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT e.enumlabel::text
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE n.nspname = 'public'
    AND t.typname = 'user_status'
    AND (
      lower(e.enumlabel) = lower(p_requested)
      OR (lower(p_requested) = 'active' AND lower(e.enumlabel) IN
            ('online', 'available', 'active', 'ready', 'on_duty', 'on-duty'))
      OR (lower(p_requested) = 'idle' AND lower(e.enumlabel) IN
            ('offline', 'inactive', 'idle', 'unavailable', 'paused', 'off_duty', 'off-duty'))
    )
  ORDER BY CASE
    WHEN lower(e.enumlabel) = lower(p_requested) THEN 0
    WHEN lower(p_requested) = 'active' AND lower(e.enumlabel) = 'online' THEN 1
    WHEN lower(p_requested) = 'active' AND lower(e.enumlabel) = 'available' THEN 2
    WHEN lower(p_requested) = 'active' AND lower(e.enumlabel) = 'ready' THEN 3
    WHEN lower(p_requested) = 'active' AND lower(e.enumlabel) IN ('on_duty', 'on-duty') THEN 4
    WHEN lower(p_requested) = 'idle' AND lower(e.enumlabel) = 'offline' THEN 1
    WHEN lower(p_requested) = 'idle' AND lower(e.enumlabel) = 'inactive' THEN 2
    WHEN lower(p_requested) = 'idle' AND lower(e.enumlabel) = 'unavailable' THEN 3
    WHEN lower(p_requested) = 'idle' AND lower(e.enumlabel) = 'paused' THEN 4
    WHEN lower(p_requested) = 'idle' AND lower(e.enumlabel) IN ('off_duty', 'off-duty') THEN 5
    ELSE 6
  END
  LIMIT 1;
$fn$;

GRANT EXECUTE ON FUNCTION public.resolve_user_status(text) TO authenticated;

/** Every label that means "taking work". Used instead of comparing to the string 'active'. */
CREATE OR REPLACE FUNCTION public.is_active_captain_status(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT lower(coalesce(p_status, '')) IN
    ('online', 'available', 'active', 'ready', 'on_duty', 'on-duty');
$fn$;

GRANT EXECUTE ON FUNCTION public.is_active_captain_status(text) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. Stop the toggle from lying when the balance really does run out.
--
--    Even with the expiry fixed, a captain can now genuinely reach zero — that is what
--    charge_wallet_for_trip_time is for, and it did not exist before. When it happens,
--    profiles.status must come back to idle, or the dashboard shows متاح beside
--    "الرادار غير مفعل" all over again. Nothing was resetting the status; there was simply
--    never a way to hit zero.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deactivate_captain_when_out_of_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_total integer;
  v_idle text;
BEGIN
  v_total := greatest(0, coalesce(NEW.paid_minutes_remaining, 0))
           + greatest(0, coalesce(NEW.bonus_minutes_remaining, 0));

  IF v_total > 0 THEN
    RETURN NEW;
  END IF;

  -- No offline-ish label in the enum at all. Do nothing rather than write NULL over a
  -- captain's status — a failed deactivation is recoverable, a nulled status column is not.
  v_idle := public.resolve_user_status('idle');
  IF v_idle IS NULL THEN
    RAISE WARNING 'user_status enum has no idle-equivalent label; cannot deactivate %', NEW.profile_id;
    RETURN NEW;
  END IF;

  -- 'busy' is left alone on purpose: a captain mid-trip is not thrown offline for running
  -- out of credit. They finish the ride and cannot go active again until they top up.
  UPDATE public.profiles
  SET status = v_idle::public.user_status,
      updated_at = now()
  WHERE id = NEW.profile_id
    AND public.is_active_captain_status(status::text);

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS wallet_accounts_deactivate_on_empty ON public.wallet_accounts;
CREATE TRIGGER wallet_accounts_deactivate_on_empty
  AFTER UPDATE OF paid_minutes_remaining, bonus_minutes_remaining ON public.wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION public.deactivate_captain_when_out_of_time();


-- ---------------------------------------------------------------------------
-- 4. Repair the wallets the old rule already killed.
--
--    Any account still holding minutes whose window has passed lost that window to the
--    countdown, not to use. Give them a real one.
-- ---------------------------------------------------------------------------

UPDATE public.wallet_accounts w
SET time_bundle_expires_at = public.radar_bundle_expiry(p.country_id),
    updated_at = now()
FROM public.profiles p
WHERE p.id = w.profile_id
  AND w.time_bundle_expires_at IS NOT NULL
  AND w.time_bundle_expires_at <= now()
  AND greatest(0, coalesce(w.paid_minutes_remaining, 0))
    + greatest(0, coalesce(w.bonus_minutes_remaining, 0)) > 0;

-- And put any captain left stranded as 'active' with nothing in the wallet back to idle,
-- which is what the dashboard was contradicting itself about.
DO $$
DECLARE
  v_idle text := public.resolve_user_status('idle');
  v_fixed integer;
BEGIN
  IF v_idle IS NULL THEN
    RAISE WARNING 'user_status enum has no idle-equivalent label; skipping the stranded-captain repair.';
    RETURN;
  END IF;

  EXECUTE format($q$
    UPDATE public.profiles p
    SET status = %L::public.user_status, updated_at = now()
    WHERE public.is_active_captain_status(p.status::text)
      AND NOT EXISTS (
        SELECT 1 FROM public.wallet_accounts w
        WHERE w.profile_id = p.id
          AND greatest(0, coalesce(w.paid_minutes_remaining, 0))
            + greatest(0, coalesce(w.bonus_minutes_remaining, 0)) > 0
          AND (w.time_bundle_expires_at IS NULL OR w.time_bundle_expires_at > now())
      )
  $q$, v_idle);

  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'reset % stranded captain(s) to %', v_fixed, v_idle;
END;
$$;


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- No captain may be 'active' without usable time. This is the contradiction itself,
--   -- expressed as a query: it must return zero rows, now and after any trip.
--   SELECT p.id, p.status, w.paid_minutes_remaining, w.bonus_minutes_remaining,
--          w.time_bundle_expires_at
--   FROM public.profiles p
--   LEFT JOIN public.wallet_accounts w ON w.profile_id = p.id
--   WHERE public.is_active_captain_status(p.status::text)
--     AND coalesce(
--           greatest(0, coalesce(w.paid_minutes_remaining, 0))
--             + greatest(0, coalesce(w.bonus_minutes_remaining, 0)), 0) = 0;
--   -- expect: 0 rows
--
--   -- What this database actually calls these statuses, since 'idle' is not one of them:
--   SELECT public.resolve_user_status('active') AS active_label,
--          public.resolve_user_status('idle')   AS idle_label;
--   -- If idle_label comes back NULL, the enum has no offline-ish label at all and the
--   -- trigger above cannot deactivate anyone — say so rather than guessing a name.
--
--   -- A top-up must now buy a WINDOW measured in days, not minutes.
--   SELECT public.captain_self_topup(2, 0);
--   SELECT paid_minutes_remaining, time_bundle_expires_at,
--          time_bundle_expires_at - now() AS window_left
--   FROM public.wallet_accounts WHERE profile_id = auth.uid();
--   -- expect: 60 minutes, and window_left around 60 days — NOT 60 minutes.
--
--   -- And the balance must only move for trip time.
--   SELECT type, (metadata->>'minutesCharged') AS minutes, created_at
--   FROM public.wallet_transactions
--   WHERE profile_id = '<captain-id>' ORDER BY created_at DESC LIMIT 10;
