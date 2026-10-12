-- Wallet time was never deducted. Not once.
--
-- Reviewing item 10 ("مراجعة آلية شحن المحفظة واحتساب الرسوم أثناء الرحلة") the charging
-- half works — voucher, delegate top-up and the testing self top-up all ADD minutes, and
-- they were fixed in 20260827180000. The spending half does not exist:
--
--   * paid_minutes_remaining is only ever written as `= ... + something`. Nothing in any
--     migration subtracts from it.
--   * src/core/logic/time-kernel.ts has a deduction engine — processLocalTimeTick — and it
--     has NO callers anywhere in the repo. Dead code.
--
-- So captains have been charging their wallets and riding for free, and the minute balance
-- only ever grows.
--
-- The dead kernel is also the wrong design for what was asked. It deducted whenever
-- `isRadarActive` was true — i.e. for as long as the captain was merely ONLINE waiting for
-- work. The requirement is the opposite:
--
--   "يتم خصم رسوم استخدام المحفظة فقط أثناء وجود الكابتن في رحلة فعلية"
--   "لا يتم خصم أي رسوم ... لمجرد أن الكابتن أصبح في حالة في الرحلة أو قبل بدء الرحلة الفعلية"
--
-- Charging for waiting time would have been a bug even if the kernel had been wired up.
--
--
-- WHAT IS CHARGED, AND WHEN
--
-- Exactly the wall-clock time between the two milestones that bracket a real trip:
--
--   start_ride_trip()     -> status TRIP_ACTIVE, sets started_at
--                            (only reachable from ARRIVED — the rider is aboard)
--   complete_ride_trip()  -> status COMPLETED,   sets completed_at
--
-- Nothing before started_at costs anything: going online, sitting in the auction, driving to
-- the pickup, or waiting at the pickup. ACCEPTED, EN_ROUTE and ARRIVED are all free.
--
-- Charged ONCE, at completion, from the server's own timestamps. Deliberately not a
-- per-minute tick from the device: a client that can decide how much to deduct can decide to
-- deduct nothing, and a tick that stops when the app is backgrounded charges nothing for a
-- trip that really happened.


-- ---------------------------------------------------------------------------
-- 1. Idempotency marker.
--
--    complete_ride_trip is explicitly idempotent — a second call returns COMPLETED rather
--    than failing — so the charge has to be too, or a retried completion bills the trip
--    twice. This column is the record of having charged, and the guard against charging
--    again.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS wallet_minutes_charged integer;

COMMENT ON COLUMN public.ride_requests.wallet_minutes_charged IS
  'Minutes taken from the captain wallet for this trip. NULL = never charged. Set once, at completion.';


-- ---------------------------------------------------------------------------
-- 2. The charge.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.charge_wallet_for_trip_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- A trip that ran longer than this is a captain who forgot to press "end trip", not a
  -- twelve-hour journey. Charging the full elapsed time would empty their wallet for an
  -- interface mistake, so it is capped and the real elapsed time is recorded in the
  -- transaction metadata for support to look at.
  MAX_CHARGEABLE_MINUTES constant integer := 240;

  v_captain uuid;
  v_elapsed numeric;
  v_minutes integer;
  v_from_bonus integer;
  v_from_paid integer;
  v_wallet public.wallet_accounts%rowtype;
BEGIN
  -- Only on the transition INTO completion, and only once.
  IF upper(coalesce(NEW.status::text, '')) <> 'COMPLETED' THEN
    RETURN NEW;
  END IF;
  IF NEW.wallet_minutes_charged IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- No started_at means the trip never actually began — cancelled from ACCEPTED, EN_ROUTE or
  -- ARRIVED. Those cost nothing, which is the whole point.
  IF NEW.started_at IS NULL OR NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  v_captain := NEW.accepted_captain_id;
  IF v_captain IS NULL THEN
    RETURN NEW;
  END IF;

  v_elapsed := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60.0;
  IF v_elapsed <= 0 THEN
    RETURN NEW;
  END IF;

  -- Rounded UP: a trip is billed in whole minutes, and a 30-second trip still used the
  -- radar. Capped, per MAX_CHARGEABLE_MINUTES above.
  v_minutes := least(MAX_CHARGEABLE_MINUTES, ceil(v_elapsed)::integer);

  SELECT * INTO v_wallet FROM public.wallet_accounts WHERE profile_id = v_captain FOR UPDATE;
  IF NOT found THEN
    -- No wallet row at all. Record that we looked, so a later run does not keep retrying.
    NEW.wallet_minutes_charged := 0;
    RETURN NEW;
  END IF;

  -- Bonus minutes first, so rank rewards are spent before money the captain paid for.
  v_from_bonus := least(greatest(coalesce(v_wallet.bonus_minutes_remaining, 0), 0), v_minutes);
  v_from_paid := least(greatest(coalesce(v_wallet.paid_minutes_remaining, 0), 0), v_minutes - v_from_bonus);

  UPDATE public.wallet_accounts
  SET bonus_minutes_remaining = greatest(0, coalesce(bonus_minutes_remaining, 0) - v_from_bonus),
      paid_minutes_remaining = greatest(0, coalesce(paid_minutes_remaining, 0) - v_from_paid),
      updated_at = now()
  WHERE profile_id = v_captain;

  -- The full amount is recorded even when the wallet could not cover it. An in-progress trip
  -- is never cut off half way — the captain finishes and is simply unable to go online again
  -- until they top up, which get_captain_wallet_status already enforces.
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

  NEW.wallet_minutes_charged := v_minutes;
  RETURN NEW;
END;
$fn$;

-- BEFORE UPDATE, so writing NEW.wallet_minutes_charged is the same row write that sets
-- COMPLETED — one statement, nothing to reconcile if it rolls back.
DROP TRIGGER IF EXISTS ride_requests_charge_trip_time ON public.ride_requests;
CREATE TRIGGER ride_requests_charge_trip_time
  BEFORE UPDATE OF status ON public.ride_requests
  FOR EACH ROW EXECUTE FUNCTION public.charge_wallet_for_trip_time();


-- ---------------------------------------------------------------------------
-- 3. Testing at 2 EGP/hour, as asked.
--
--    "للاختبار، يتم تحديد سعر الساعة = 2 جنيه"
--
--    radar_hour_price is what amount_to_radar_minutes divides by, so 2 means one pound buys
--    30 minutes. Egypt only; nothing else is touched.
-- ---------------------------------------------------------------------------

--    The column is `iso_code`, matching how 20260827130000 seeded these.
UPDATE public.countries SET radar_hour_price = 2 WHERE iso_code = 'EG';


-- ---------------------------------------------------------------------------
-- How to test the whole cycle
--
--   -- 0. Confirm the test price landed.
--   SELECT id, name_ar, radar_hour_price FROM public.countries WHERE radar_hour_price = 2;
--
--   -- 1. Top up 2 EGP and expect exactly 60 minutes.
--   --    As the captain, from the wallet screen, or:
--   SELECT public.captain_self_topup(2, 0);
--
--   -- 2. Balance before the trip.
--   SELECT paid_minutes_remaining, bonus_minutes_remaining, balance
--   FROM public.wallet_accounts WHERE profile_id = '<captain-id>';
--
--   -- 3. Go online, receive a request, submit an offer, get accepted, drive, ARRIVE.
--   --    Check the balance again here — it must be UNCHANGED. Nothing up to and including
--   --    ARRIVED costs anything.
--
--   -- 4. Start the trip (this is the only moment the clock starts), wait a few minutes,
--   --    then complete it.
--
--   -- 5. What was charged, and from where.
--   SELECT (metadata->>'minutesCharged')::int  AS charged,
--          (metadata->>'elapsedMinutes')::numeric AS real_elapsed,
--          (metadata->>'fromPaid')::int        AS from_paid,
--          (metadata->>'shortfall')::int       AS not_covered,
--          created_at
--   FROM public.wallet_transactions
--   WHERE type = 'trip_time' AND profile_id = '<captain-id>'
--   ORDER BY created_at DESC LIMIT 5;
--
--   -- charged must equal ceil(real_elapsed), and the balance must have dropped by exactly
--   -- that many minutes — no more, and nothing at all before step 4.
--
--   -- 6. Idempotency: completing twice must not bill twice.
--   SELECT public.complete_ride_trip('<request-id>');   -- returns COMPLETED, charges nothing
--   SELECT wallet_minutes_charged FROM public.ride_requests WHERE id = '<request-id>';
--
--   -- 7. A trip cancelled before it started must cost nothing.
--   SELECT id, status, started_at, wallet_minutes_charged
--   FROM public.ride_requests
--   WHERE accepted_captain_id = '<captain-id>' AND started_at IS NULL;
--   -- expect: wallet_minutes_charged IS NULL on every row
--
--
-- REMEMBER TO PUT THE REAL PRICE BACK when testing is done. 2 EGP/hour is a test value.
