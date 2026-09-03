-- Billing a trip must never be able to stop the trip from ending.
--
-- Reported: the captain ended the trip and the rider's screen stayed on "الرحلة جارية".
--
-- charge_wallet_for_trip_time (20260904090000) was a BEFORE UPDATE OF status trigger on
-- ride_requests. That makes the wallet charge a PRECONDITION of completion: if anything in
-- it raises — a NOT NULL column on wallet_transactions, a lock wait, the cascade into
-- wallet_accounts and then profiles — the whole complete_ride_trip transaction rolls back.
-- The status never becomes COMPLETED, no realtime UPDATE is published, and the rider is
-- left inside a trip that is over.
--
-- That ordering is backwards. The trip ending is the primary fact; charging for it is
-- bookkeeping that follows. Bookkeeping is not allowed to veto the fact.
--
-- I introduced that coupling one migration ago, and it is the wrong shape regardless of
-- which specific error fires today: any future failure in the charge would strand a rider
-- the same way.
--
--
-- THE FIX
--
--   * AFTER UPDATE, not BEFORE. By the time it runs, COMPLETED is already committed to the
--     row and on its way to the rider.
--   * The whole body is wrapped in an exception block. A charge that fails is logged as a
--     warning and leaves wallet_minutes_charged NULL — which is recoverable, and visible.
--
-- Trade-off, stated plainly: a failed charge is now a trip that went unbilled rather than a
-- trip that could not end. That is the right way round — an unbilled trip is a number to
-- reconcile later, a stranded rider is a person stuck in the app.


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
BEGIN
  IF upper(coalesce(NEW.status::text, '')) <> 'COMPLETED' THEN
    RETURN NULL;
  END IF;
  IF NEW.wallet_minutes_charged IS NOT NULL THEN
    RETURN NULL;
  END IF;
  IF NEW.started_at IS NULL OR NEW.completed_at IS NULL THEN
    RETURN NULL;  -- never actually began; cancelled before pickup costs nothing
  END IF;

  v_captain := NEW.accepted_captain_id;
  IF v_captain IS NULL THEN
    RETURN NULL;
  END IF;

  -- Everything that touches money is inside this block. Nothing in here can reach the
  -- caller as an error, so nothing in here can undo the completion that already happened.
  BEGIN
    v_elapsed := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60.0;
    IF v_elapsed <= 0 THEN
      RETURN NULL;
    END IF;

    v_minutes := least(MAX_CHARGEABLE_MINUTES, ceil(v_elapsed)::integer);

    SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_captain FOR UPDATE;
    IF NOT found THEN
      -- Mark it as looked at, so this is not retried on every later write to the row.
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
      format('خصم %s دقيقة مقابل زمن الرحلة الفعلي.', v_minutes),
      jsonb_build_object(
        'requestId', NEW.id,
        'minutesCharged', v_minutes,
        'elapsedMinutes', round(v_elapsed, 2),
        'fromBonus', v_from_bonus,
        'fromPaid', v_from_paid,
        'shortfall', greatest(0, v_minutes - v_from_bonus - v_from_paid),
        'startedAt', NEW.started_at,
        'completedAt', NEW.completed_at
      )
    );

    -- Safe from recursion: this trigger is `OF status`, and this touches a different column.
    UPDATE public.ride_requests SET wallet_minutes_charged = v_minutes WHERE id = NEW.id;

  EXCEPTION WHEN OTHERS THEN
    -- Loud, and harmless. wallet_minutes_charged stays NULL so the unbilled trip can be
    -- found and settled; the rider is already out of the trip either way.
    RAISE WARNING '[charge_wallet_for_trip_time] request % captain %: % (%)',
      NEW.id, v_captain, SQLERRM, SQLSTATE;
  END;

  RETURN NULL;
END;
$fn$;

-- AFTER, so COMPLETED is committed before the charge is attempted.
DROP TRIGGER IF EXISTS ride_requests_charge_trip_time ON public.ride_requests;
CREATE TRIGGER ride_requests_charge_trip_time
  AFTER UPDATE OF status ON public.ride_requests
  FOR EACH ROW EXECUTE FUNCTION public.charge_wallet_for_trip_time();


-- ---------------------------------------------------------------------------
-- Find the trips this already stranded, and the ones that went unbilled.
--
--   -- Trips that ended but were never charged. Expected to be non-empty if the old
--   -- BEFORE trigger was ever hit by an error; each row is a minute charge to settle.
--   SELECT id, accepted_captain_id, started_at, completed_at,
--          ceil(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60.0) AS minutes_owed
--   FROM public.ride_requests
--   WHERE upper(coalesce(status::text, '')) = 'COMPLETED'
--     AND started_at IS NOT NULL AND completed_at IS NOT NULL
--     AND wallet_minutes_charged IS NULL
--   ORDER BY completed_at DESC;
--
--   -- Trips the captain tried to end that are STILL not completed — riders stuck right now.
--   SELECT id, status, accepted_captain_id, started_at, updated_at
--   FROM public.ride_requests
--   WHERE upper(coalesce(status::text, '')) IN ('TRIP_ACTIVE', 'STARTED', 'ARRIVED')
--     AND started_at IS NOT NULL
--     AND updated_at < now() - interval '2 hours'
--   ORDER BY started_at;
--
--   -- Close a stranded one by hand once you have checked it really did finish:
--   --   SELECT public.complete_ride_trip('<request-id>');
