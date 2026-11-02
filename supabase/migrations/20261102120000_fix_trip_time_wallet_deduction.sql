-- Migration: 20261102120000_fix_trip_time_wallet_deduction.sql
-- Description:
-- Fixes public.charge_wallet_for_trip_time() joins to districts and governorates.
-- In public.profiles, the foreign keys are district_id and governorate_id (integer),
-- NOT p.district or p.governorate. Referencing non-existent columns caused the trigger
-- to fail silently inside EXCEPTION WHEN OTHERS, leaving wallet_minutes_charged NULL
-- and preventing wallet deduction on completed trips.

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
  v_already_charged integer;
  v_refund_cash numeric;
BEGIN
  v_status := upper(coalesce(NEW.status::text, ''));
  v_captain := COALESCE(NEW.accepted_captain_id, OLD.accepted_captain_id);
  v_already_charged := COALESCE(OLD.wallet_minutes_charged, NEW.wallet_minutes_charged, 0);

  -- 1. Handling CANCELLED status: Refund all previously charged minutes & cash back to captain
  IF v_status = 'CANCELLED' THEN
    IF v_already_charged > 0 AND v_captain IS NOT NULL THEN
      BEGIN
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

        v_refund_cash := round(v_already_charged * (v_hour_price / 60.0), 2);

        UPDATE public.wallet_accounts
        SET paid_minutes_remaining = coalesce(paid_minutes_remaining, 0) + v_already_charged,
            balance = coalesce(balance, 0) + v_refund_cash,
            updated_at = clock_timestamp()
        WHERE profile_id = v_captain;

        INSERT INTO public.wallet_transactions (
          profile_id, type, transaction_type, amount, status, description_ar, metadata
        )
        VALUES (
          v_captain, 'trip_time_refund', 'trip_time_refund', v_refund_cash, 'COMPLETED',
          format('استرداد %s دقيقة رادار (%s) بسبب إلغاء الرحلة.', v_already_charged, v_refund_cash),
          jsonb_build_object(
            'requestId', NEW.id,
            'minutesRefunded', v_already_charged,
            'cashRefunded', v_refund_cash,
            'status', v_status,
            'cancelledAt', clock_timestamp()
          )
        );

        UPDATE public.ride_requests SET wallet_minutes_charged = 0 WHERE id = NEW.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[charge_wallet_for_trip_time refund] request % captain %: % (%)',
          NEW.id, v_captain, SQLERRM, SQLSTATE;
      END;
    END IF;
    RETURN NULL;
  END IF;

  -- 2. Only charge on COMPLETED trips
  IF v_status <> 'COMPLETED' THEN
    RETURN NULL;
  END IF;
  IF NEW.wallet_minutes_charged IS NOT NULL THEN
    RETURN NULL;
  END IF;
  IF NEW.started_at IS NULL OR NEW.completed_at IS NULL THEN
    RETURN NULL;  -- never actually began; costs nothing
  END IF;

  IF v_captain IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    v_elapsed := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60.0;
    IF v_elapsed <= 0 THEN
      RETURN NULL;
    END IF;

    v_minutes := least(MAX_CHARGEABLE_MINUTES, ceil(v_elapsed)::integer);

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

    INSERT INTO public.wallet_transactions (
      profile_id, type, transaction_type, amount, status, description_ar, metadata
    )
    VALUES (
      v_captain, 'trip_time', 'trip_time', v_cash_cost, 'COMPLETED',
      format('خصم %s دقيقة بقيمة %s مقابل زمن الرحلة الفعلي.', v_minutes, v_cash_cost),
      jsonb_build_object(
        'requestId', NEW.id,
        'minutesCharged', v_minutes,
        'cashCost', v_cash_cost,
        'hourPrice', v_hour_price,
        'elapsedMinutes', round(v_elapsed, 2),
        'fromBonus', v_from_bonus,
        'fromPaid', v_from_paid,
        'startedAt', NEW.started_at,
        'completedAt', NEW.completed_at
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

-- Backfill: Process any stranded COMPLETED trips that were not charged due to the column name bug
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.ride_requests
    WHERE upper(coalesce(status::text, '')) = 'COMPLETED'
      AND wallet_minutes_charged IS NULL
      AND started_at IS NOT NULL
      AND completed_at IS NOT NULL
      AND accepted_captain_id IS NOT NULL
  LOOP
    UPDATE public.ride_requests
    SET status = 'COMPLETED'
    WHERE id = r.id;
  END LOOP;
END $$;

