-- Migration: 20261102180000_charge_elapsed_minutes_on_trip_cancel.sql
-- Description: Charge captain wallet for elapsed trip minutes when an active trip is cancelled.
-- If a trip has started (started_at IS NOT NULL) and is cancelled, the elapsed minutes
-- between started_at and cancelled_at must be deducted from the captain's radar minutes and balance.
-- If the trip was cancelled before starting (started_at IS NULL), 0 minutes are charged.

CREATE OR REPLACE FUNCTION public.charge_wallet_for_trip_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  MAX_CHARGEABLE_MINUTES constant integer := 240;

  v_captain uuid;
  v_elapsed numeric;
  v_minutes integer;
  v_from_bonus integer;
  v_from_paid integer;
  v_wallet public.wallet_accounts%rowtype;
  v_hour_price numeric := 1.0;
  v_minute_price numeric;
  v_chargeable_minutes integer;
  v_cash_cost numeric;
  v_status text;
  v_end_time timestamptz;
BEGIN
  v_status := upper(coalesce(NEW.status::text, ''));
  v_captain := COALESCE(NEW.accepted_captain_id, OLD.accepted_captain_id);

  -- 1. Only process trips when they reach terminal status: COMPLETED or CANCELLED
  IF v_status NOT IN ('COMPLETED', 'CANCELLED') THEN
    RETURN NULL;
  END IF;

  -- 2. Do not re-charge if this trip was already charged
  IF NEW.wallet_minutes_charged IS NOT NULL AND NEW.wallet_minutes_charged > 0 THEN
    RETURN NULL;
  END IF;

  -- 3. If trip never actually started (started_at IS NULL), zero elapsed time
  IF NEW.started_at IS NULL THEN
    IF NEW.wallet_minutes_charged IS NULL THEN
      UPDATE public.ride_requests SET wallet_minutes_charged = 0 WHERE id = NEW.id;
    END IF;
    RETURN NULL;
  END IF;

  -- 4. If no captain assigned, nothing to charge
  IF v_captain IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    -- Determine the terminal timestamp
    IF v_status = 'COMPLETED' THEN
      v_end_time := coalesce(NEW.completed_at, NEW.updated_at, clock_timestamp());
    ELSE
      v_end_time := coalesce(NEW.cancelled_at, NEW.updated_at, clock_timestamp());
    END IF;

    -- Calculate elapsed minutes
    v_elapsed := EXTRACT(EPOCH FROM (v_end_time - NEW.started_at)) / 60.0;
    IF v_elapsed <= 0 THEN
      UPDATE public.ride_requests SET wallet_minutes_charged = 0 WHERE id = NEW.id;
      RETURN NULL;
    END IF;

    -- Calculate chargeable minutes capped at MAX_CHARGEABLE_MINUTES
    v_minutes := least(MAX_CHARGEABLE_MINUTES, greatest(1, round(v_elapsed::numeric)::integer));

    -- Lock and retrieve captain wallet account
    SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_captain FOR UPDATE;
    IF NOT found THEN
      INSERT INTO public.wallet_accounts (profile_id, balance, paid_minutes_remaining, bonus_minutes_remaining)
      VALUES (v_captain, 0, 0, 0)
      ON CONFLICT (profile_id) DO NOTHING;

      SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_captain FOR UPDATE;
      IF NOT found THEN
        UPDATE public.ride_requests SET wallet_minutes_charged = 0 WHERE id = NEW.id;
        RETURN NULL;
      END IF;
    END IF;

    -- Determine captain's hourly rate from district, governorate, country, or default 1.0
    SELECT
      coalesce(
        d.radar_hour_price,
        g.radar_hour_price,
        cp.radar_hour_price,
        cr.radar_hour_price,
        1.0
      )
    INTO v_hour_price
    FROM public.profiles p
    LEFT JOIN public.districts d ON d.id = p.district_id
    LEFT JOIN public.governorates g ON g.id = p.governorate_id
    LEFT JOIN public.countries cp ON cp.id = p.country_id
    LEFT JOIN public.countries cr ON cr.id = NEW.country_id
    WHERE p.id = v_captain;

    IF v_hour_price IS NULL OR v_hour_price <= 0 THEN
      v_hour_price := 1.0;
    END IF;

    -- Bonus minutes first, so rank rewards are spent before cash
    v_from_bonus := least(greatest(coalesce(v_wallet.bonus_minutes_remaining, 0), 0), v_minutes);
    v_chargeable_minutes := v_minutes - v_from_bonus;
    v_from_paid := least(greatest(coalesce(v_wallet.paid_minutes_remaining, 0), 0), v_chargeable_minutes);

    v_minute_price := v_hour_price / 60.0;
    v_cash_cost := round(v_chargeable_minutes * v_minute_price, 2);

    -- DUAL DEDUCTION: deduct both minutes and equivalent cash balance in lockstep
    UPDATE public.wallet_accounts
    SET bonus_minutes_remaining = greatest(0, coalesce(bonus_minutes_remaining, 0) - v_from_bonus),
        paid_minutes_remaining = greatest(0, coalesce(paid_minutes_remaining, 0) - v_from_paid),
        balance = greatest(0, round(coalesce(balance, 0) - v_cash_cost, 2)),
        updated_at = clock_timestamp()
    WHERE profile_id = v_captain;

    -- Insert wallet transaction record
    INSERT INTO public.wallet_transactions (
      profile_id, type, transaction_type, amount, status, description_ar, metadata
    )
    VALUES (
      v_captain, 'trip_time', 'trip_time', v_cash_cost, 'COMPLETED',
      CASE
        WHEN v_status = 'COMPLETED' THEN
          format('خصم %s دقيقة بقيمة %s مقابل زمن الرحلة الفعلي.', v_minutes, v_cash_cost)
        ELSE
          format('خصم %s دقيقة بقيمة %s مقابل زمن الرحلة المنقضي قبل الإلغاء.', v_minutes, v_cash_cost)
      END,
      jsonb_build_object(
        'requestId', NEW.id,
        'minutesCharged', v_minutes,
        'cashCost', v_cash_cost,
        'hourPrice', v_hour_price,
        'elapsedMinutes', round(v_elapsed, 2),
        'fromBonus', v_from_bonus,
        'fromPaid', v_from_paid,
        'startedAt', NEW.started_at,
        'endTime', v_end_time,
        'status', v_status
      )
    );

    UPDATE public.ride_requests SET wallet_minutes_charged = v_minutes WHERE id = NEW.id;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[charge_wallet_for_trip_time] request % captain %: % (%)',
      NEW.id, v_captain, SQLERRM, SQLSTATE;
  END;

  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS ride_requests_charge_trip_time ON public.ride_requests;
CREATE TRIGGER ride_requests_charge_trip_time
  AFTER UPDATE OF status ON public.ride_requests
  FOR EACH ROW EXECUTE FUNCTION public.charge_wallet_for_trip_time();

-- Backfill: mark ancient test trips as charged = 0
UPDATE public.ride_requests
SET wallet_minutes_charged = 0
WHERE id IN (
  '9dcae603-4f4b-4a66-8a5c-24eeceec4135',
  '511afea1-4f8d-4ce3-8780-dbf45b0ed10b',
  'e02d40d4-6505-4fbb-9d12-a0cfbc0cfd96'
);

-- Backfill: Charge recently cancelled test trip a78ec532-b7d6-4ba5-8e2c-826b05e81c14 for elapsed 3 minutes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.ride_requests
    WHERE id = 'a78ec532-b7d6-4ba5-8e2c-826b05e81c14'
      AND status = 'CANCELLED'
      AND started_at IS NOT NULL
      AND wallet_minutes_charged IS NULL
  LOOP
    PERFORM set_config('app.ride_request_status_rpc', 'true', true);
    UPDATE public.ride_requests
    SET status = 'CANCELLED'
    WHERE id = r.id;
  END LOOP;
END $$;

