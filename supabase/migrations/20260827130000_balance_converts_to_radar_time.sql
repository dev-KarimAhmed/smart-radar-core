-- Topping up buys radar time: the money converts to minutes and the cash balance stays 0.
--
-- The wallet was tracking two independent numbers — a cash balance and a paid-minutes
-- counter — with nothing connecting them. A captain could hold 1085 in balance and still be
-- unable to go online, because balance was never anything the radar consumed. Money is only
-- a means of buying radar time, so a top-up now converts straight into minutes.
--
-- THE RATE IS A PLACEHOLDER. countries.radar_hour_price is seeded with round numbers so the
-- flow can be tested; nobody has priced this yet. Change it whenever you decide:
--
--   UPDATE public.countries SET radar_hour_price = <price> WHERE iso_code = 'EG';
--
-- It is a per-country column for the same reason every other tariff figure is: the two
-- markets are in different currencies and a single constant would be meaningless.


-- ---------------------------------------------------------------------------
-- 1. The price of an hour of radar time.
-- ---------------------------------------------------------------------------

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS radar_hour_price numeric NOT NULL DEFAULT 100;

ALTER TABLE public.countries
  DROP CONSTRAINT IF EXISTS countries_radar_hour_price_positive;
ALTER TABLE public.countries
  ADD CONSTRAINT countries_radar_hour_price_positive CHECK (radar_hour_price > 0);

COMMENT ON COLUMN public.countries.radar_hour_price IS
  'PLACEHOLDER PRICING. Cost of one hour of radar time in this country''s currency. Nobody has priced this yet — set it deliberately.';

UPDATE public.countries SET radar_hour_price = 100 WHERE iso_code = 'EG';  -- ج.م / ساعة
UPDATE public.countries SET radar_hour_price = 1   WHERE iso_code = 'JO';  -- د.أ / ساعة


-- ---------------------------------------------------------------------------
-- 2. Money -> minutes, in one place.
--
--    Rounded DOWN: a captain must never be handed a minute they did not pay for, and the
--    remainder is not silently pocketed — it is returned so the caller can leave it on the
--    balance rather than destroy it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.amount_to_radar_minutes(
  p_amount numeric,
  p_country_id integer
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_hour_price numeric;
  v_minute_price numeric;
  v_minutes integer;
BEGIN
  SELECT radar_hour_price INTO v_hour_price FROM public.countries WHERE id = p_country_id;
  v_hour_price := coalesce(v_hour_price, 100);
  v_minute_price := v_hour_price / 60;

  IF coalesce(p_amount, 0) <= 0 OR v_minute_price <= 0 THEN
    RETURN jsonb_build_object('minutes', 0, 'spent', 0, 'remainder', coalesce(p_amount, 0), 'minutePrice', v_minute_price);
  END IF;

  v_minutes := floor(p_amount / v_minute_price);

  RETURN jsonb_build_object(
    'minutes', v_minutes,
    'spent', round(v_minutes * v_minute_price, 2),
    'remainder', round(p_amount - (v_minutes * v_minute_price), 2),
    'minutePrice', round(v_minute_price, 4),
    'hourPrice', v_hour_price
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.amount_to_radar_minutes(numeric, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 3. The self top-up now credits time, not cash.
--
--    Replaces the version from 20260827090000. Same flag, same caps, same audit trail —
--    the only change is what the money turns into.
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
    -- Whatever did not buy a whole minute stays as cash rather than vanishing.
    v_remainder := (v_conversion->>'remainder')::numeric;
  END IF;

  v_total_minutes := v_minutes + v_converted_minutes;

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

  INSERT INTO public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
  VALUES (
    v_caller,
    'self_topup_test',
    v_amount,
    'COMPLETED',
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
-- 4. The delegate charge converts too, so both routes into the wallet behave the same.
--
--    NOTE: this function still performs NO authorisation check — it is SECURITY DEFINER,
--    granted to `authenticated`, and never verifies the caller is a delegate or admin. That
--    hole predates this work and is deliberately left as it was, because deciding who may
--    charge a captain is a product call. Only the conversion is added here.
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

  INSERT INTO public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
  VALUES (
    p_captain_id,
    'delegate_charge',
    p_amount,
    'COMPLETED',
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
