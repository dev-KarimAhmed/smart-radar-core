-- [FEATURE] Redesign wallet allocation and trip-based minute consumption.
--
-- 1. allocate_cash_balance_to_minutes(p_amount numeric)
--    Deducts p_amount from wallet_accounts.balance and converts it into paid_minutes_remaining.
--
-- 2. captain_self_topup
--    Credits p_amount into wallet_accounts.balance (cash balance) without auto-converting,
--    so captains can manually allocate any portion to radar time.
--
-- 3. consume_captain_radar_minutes
--    No-op for idle time (returns 0 minutes consumed) so sitting idle on radar costs nothing.
--    Minutes are consumed exclusively during active trips.
--
-- 4. apply_wallet_transaction
--    Includes 'balance_allocated_to_time' in the skipped trigger list.

begin;

-- ---------------------------------------------------------------------------
-- 1. RPC: allocate_cash_balance_to_minutes(p_amount numeric)
-- ---------------------------------------------------------------------------
create or replace function public.allocate_cash_balance_to_minutes(
  p_amount numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_role       text;
  v_hour_price numeric;
  v_balance    numeric;
  v_minutes    integer;
  v_paid_after integer;
  v_new_bal    numeric;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select upper(p.role::text), c.radar_hour_price
    into v_role, v_hour_price
  from public.profiles p
  left join public.countries c on c.id = p.country_id
  where p.id = v_caller;

  if v_role is null or v_role not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_profile_required';
  end if;

  v_hour_price := coalesce(nullif(v_hour_price, 0), 100);

  select coalesce(balance, 0) into v_balance
  from public.wallet_accounts
  where profile_id = v_caller
  for update;

  if not found or v_balance < p_amount then
    raise exception 'insufficient_balance' using hint = 'رصيدك النقدي لا يكفي لإجراء هذا التخصيص.';
  end if;

  v_minutes := greatest(1, round(p_amount / (v_hour_price / 60.0))::integer);
  v_new_bal := round(v_balance - p_amount, 2);

  update public.wallet_accounts
  set balance                = v_new_bal,
      paid_minutes_remaining = coalesce(paid_minutes_remaining, 0) + v_minutes,
      pending_seconds_debt   = 0,
      time_bundle_expires_at = greatest(coalesce(time_bundle_expires_at, now()), now())
                               + make_interval(mins => v_minutes),
      updated_at             = clock_timestamp()
  where profile_id = v_caller
  returning paid_minutes_remaining into v_paid_after;

  insert into public.wallet_transactions (profile_id, type, transaction_type, amount, status, description_ar, metadata)
  values (
    v_caller, 'balance_allocated_to_time', 'balance_allocated_to_time', 0, 'COMPLETED',
    format('تخصيص %s ج.م من المحفظة إلى %s دقيقة رادار.', p_amount, v_minutes),
    jsonb_build_object(
      'allocatedAmount', p_amount,
      'minutesGranted', v_minutes,
      'remainingBalance', v_new_bal,
      'hourPrice', v_hour_price
    )
  );

  return jsonb_build_object(
    'success',              true,
    'minutesGranted',       v_minutes,
    'allocatedAmount',      p_amount,
    'paidMinutesRemaining', v_paid_after,
    'remainingBalance',     v_new_bal
  );
end;
$$;

revoke all on function public.allocate_cash_balance_to_minutes(numeric) from anon, public;
grant execute on function public.allocate_cash_balance_to_minutes(numeric) to authenticated;


-- ---------------------------------------------------------------------------
-- 2. RPC: captain_self_topup (Credits cash balance for test mode)
-- ---------------------------------------------------------------------------
create or replace function public.captain_self_topup(
  p_amount numeric default 0,
  p_minutes integer default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  MAX_AMOUNT_PER_CALL constant numeric := 5000;
  MAX_MINUTES_PER_CALL constant integer := 6000;
  v_caller uuid := auth.uid();
  v_enabled boolean;
  v_role text;
  v_country_id integer;
  v_hour_price numeric;
  v_amount numeric := coalesce(p_amount, 0);
  v_minutes integer := coalesce(p_minutes, 0);
  v_wallet public.wallet_accounts%rowtype;
  v_new_bal numeric;
  v_paid_after integer;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;

  select enabled into v_enabled from public.app_flags where flag = 'captain_self_topup';
  if not coalesce(v_enabled, false) then
    raise exception 'self_topup_disabled' using hint = 'شحن الرصيد الذاتي متوقف. تواصل مع الإدارة.';
  end if;

  select upper(coalesce(p.role::text, '')), p.country_id, c.radar_hour_price
  into v_role, v_country_id, v_hour_price
  from public.profiles p
  left join public.countries c on c.id = p.country_id
  where p.id = v_caller;

  if v_role not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_profile_required';
  end if;

  if v_amount < 0 or v_minutes < 0 then
    raise exception 'invalid_amount';
  end if;

  if v_amount = 0 and v_minutes = 0 then
    raise exception 'nothing_to_credit';
  end if;

  if v_amount > MAX_AMOUNT_PER_CALL then
    raise exception 'amount_above_test_limit: %', MAX_AMOUNT_PER_CALL;
  end if;

  if v_minutes > MAX_MINUTES_PER_CALL then
    raise exception 'minutes_above_test_limit: %', MAX_MINUTES_PER_CALL;
  end if;

  insert into public.wallet_accounts (profile_id, balance, paid_minutes_remaining)
  values (v_caller, v_amount, v_minutes)
  on conflict (profile_id) do update
    set balance = public.wallet_accounts.balance + v_amount,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_minutes,
        time_bundle_expires_at = case
          when v_minutes > 0 then greatest(
            coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
            now()
          ) + make_interval(mins => v_minutes)
          else public.wallet_accounts.time_bundle_expires_at
        end,
        updated_at = clock_timestamp()
  returning balance, paid_minutes_remaining into v_new_bal, v_paid_after;

  insert into public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  values (
    v_caller, 'self_topup_test', 'self_topup_test', 0, 'COMPLETED',
    'شحن اختباري — إضافة رصيد نقدي للمحفظة.',
    jsonb_build_object(
      'amountCredited', v_amount,
      'minutesCredited', v_minutes,
      'testing', true
    )
  );

  return jsonb_build_object(
    'success', true,
    'amountCredited', v_amount,
    'minutesCredited', v_minutes,
    'balance', v_new_bal,
    'paidMinutesRemaining', v_paid_after
  );
end;
$$;

revoke all on function public.captain_self_topup(numeric, integer) from anon;
grant execute on function public.captain_self_topup(numeric, integer) to authenticated;


-- ---------------------------------------------------------------------------
-- 3. RPC: consume_captain_radar_minutes (No-op while idle on radar)
-- ---------------------------------------------------------------------------
create or replace function public.consume_captain_radar_minutes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_wallet public.wallet_accounts%rowtype;
  v_remaining numeric := 0;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;

  select * into v_wallet
  from public.wallet_accounts
  where profile_id = v_caller
  for update;

  if not found then
    return jsonb_build_object('consumed_minutes', 0, 'reason', 'no_wallet', 'has_active_bundle', false);
  end if;

  update public.wallet_accounts
  set last_minute_tick_at = clock_timestamp(),
      updated_at          = clock_timestamp()
  where profile_id = v_caller;

  v_remaining := greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0))
               + greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0));

  return jsonb_build_object(
    'consumed_minutes',        0,
    'paid_minutes_remaining',  greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0)),
    'bonus_minutes_remaining', greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0)),
    'has_active_bundle',       v_remaining > 0
  );
end;
$$;

revoke all on function public.consume_captain_radar_minutes() from public;
grant execute on function public.consume_captain_radar_minutes() to authenticated;


-- ---------------------------------------------------------------------------
-- 4. Trigger Function: apply_wallet_transaction
-- ---------------------------------------------------------------------------
create or replace function public.apply_wallet_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_paid integer;
  v_bonus integer;
  v_amount_delta numeric := coalesce(new.amount, 0);
  v_paid_delta integer := coalesce(new.paid_minutes_delta, 0);
  v_bonus_delta integer := coalesce(new.bonus_minutes_delta, 0);
  v_type text := lower(coalesce(new.type, new.transaction_type, ''));
begin
  if v_type in (
    'balance_allocated_to_time',
    'balance_converted_to_time',
    'self_topup_test',
    'delegate_charge',
    'radar_minute_consumption',
    'voucher',
    'trip_time'
  ) then
    return new;
  end if;

  insert into public.wallet_accounts (profile_id)
  values (new.profile_id)
  on conflict (profile_id) do nothing;

  select balance, paid_minutes_remaining, bonus_minutes_remaining
  into v_balance, v_paid, v_bonus
  from public.wallet_accounts
  where profile_id = new.profile_id
  for update;

  if (v_balance + v_amount_delta) < 0 then
    raise exception 'wallet_balance_would_be_negative';
  end if;

  if (v_paid + v_paid_delta) < 0 then
    raise exception 'paid_minutes_would_be_negative';
  end if;

  if (v_bonus + v_bonus_delta) < 0 then
    raise exception 'bonus_minutes_would_be_negative';
  end if;

  update public.wallet_accounts
  set
    balance = balance + v_amount_delta,
    paid_minutes_remaining = paid_minutes_remaining + v_paid_delta,
    bonus_minutes_remaining = bonus_minutes_remaining + v_bonus_delta,
    updated_at = now()
  where profile_id = new.profile_id;

  return new;
end;
$$;

notify pgrst, 'reload schema';

commit;
