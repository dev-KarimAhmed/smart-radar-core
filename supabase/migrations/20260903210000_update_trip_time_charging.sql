-- Migration: 20260903210000_update_trip_time_charging.sql
-- Description: Deduct radar minutes as soon as trip status becomes ACCEPTED, ARRIVED, STARTED, or COMPLETED.

CREATE OR REPLACE FUNCTION charge_wallet_for_trip_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  MAX_CHARGEABLE_MINUTES constant integer := 240;
  v_captain uuid;
  v_elapsed numeric;
  v_minutes integer;
  v_from_bonus integer;
  v_from_paid integer;
  v_wallet public.wallet_accounts%rowtype;
  v_status text;
  v_already_charged integer;
BEGIN
  v_status := upper(coalesce(NEW.status::text, ''));

  -- Deduct when trip status becomes ACCEPTED, ARRIVED, STARTED, or COMPLETED
  IF v_status NOT IN ('ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED') THEN
    RETURN NULL;
  END IF;

  v_captain := NEW.accepted_captain_id;
  IF v_captain IS NULL THEN
    RETURN NULL;
  END IF;

  v_already_charged := COALESCE(NEW.wallet_minutes_charged, 0);

  -- If already charged:
  IF v_already_charged > 0 THEN
    -- If status is COMPLETED and actual elapsed time exceeded previous estimated charge, deduct the difference:
    IF v_status = 'COMPLETED' AND NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
      v_elapsed := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60.0;
      IF ceil(v_elapsed) > v_already_charged THEN
        v_minutes := least(MAX_CHARGEABLE_MINUTES, ceil(v_elapsed)::integer) - v_already_charged;
      ELSE
        RETURN NULL;
      END IF;
    ELSE
      RETURN NULL;
    END IF;
  ELSE
    -- Initial charge when trip offer accepted / started:
    IF NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
      v_elapsed := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60.0;
      v_minutes := least(MAX_CHARGEABLE_MINUTES, greatest(1, ceil(v_elapsed)::integer));
    ELSE
      v_minutes := least(MAX_CHARGEABLE_MINUTES, greatest(1, COALESCE(NEW.estimated_duration_minutes, CEIL(COALESCE(NEW.estimated_distance_km, 1) * 2)::integer, 15)));
    END IF;
  END IF;

  IF v_minutes <= 0 THEN
    RETURN NULL;
  END IF;

  BEGIN
    SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_captain FOR UPDATE;
    IF NOT found THEN
      UPDATE public.ride_requests SET wallet_minutes_charged = 0 WHERE id = NEW.id;
      RETURN NULL;
    END IF;

    -- Bonus minutes first, so rank rewards are spent before money the captain paid for.
    v_from_bonus := least(greatest(coalesce(v_wallet.bonus_minutes_remaining, 0), 0), v_minutes);
    v_from_paid := least(greatest(coalesce(v_wallet.paid_minutes_remaining, 0), 0), v_minutes - v_from_bonus);

    UPDATE public.wallet_accounts
    SET bonus_minutes_remaining = greatest(0, coalesce(bonus_minutes_remaining, 0) - v_from_bonus),
        paid_minutes_remaining = greatest(0, coalesce(paid_minutes_remaining, 0) - v_from_paid),
        updated_at = now()
    WHERE profile_id = v_captain;

    INSERT INTO public.wallet_transactions (
      profile_id, type, transaction_type, amount, status, description_ar, metadata
    )
    VALUES (
      v_captain, 'trip_time', 'trip_time', 0, 'COMPLETED',
      format('خصم %s دقيقة مقابل وقت الرحلة.', v_minutes),
      jsonb_build_object(
        'requestId', NEW.id,
        'minutesCharged', v_minutes,
        'status', v_status,
        'fromBonus', v_from_bonus,
        'fromPaid', v_from_paid
      )
    );

    UPDATE public.ride_requests SET wallet_minutes_charged = v_already_charged + v_minutes WHERE id = NEW.id;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[charge_wallet_for_trip_time] request % captain %: % (%)',
      NEW.id, v_captain, SQLERRM, SQLSTATE;
  END;

  RETURN NULL;
END;
$$;
