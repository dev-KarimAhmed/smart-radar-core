-- [FIX] Ensure wallet balance is ALWAYS zeroed out when converted to radar minutes.
--
-- Previously, conversion functions (convert_wallet_balance_to_minutes, captain_self_topup,
-- delegate_charge_captain) calculated a fractional `v_remainder` and kept it in `balance`.
-- Because of precision rounding (e.g. 1 / 60 = 0.016666...), this left tiny non-zero
-- balances (like 0.02, 1.00, 1.68, 3.34) in `balance`, causing the UI to show a non-zero
-- cash balance and triggering the "ready to convert" banner repeatedly.
--
-- This migration updates all three RPCs to:
--   1. Convert 100% of the money into minutes (using round/ceil to ensure no value is lost).
--   2. Always set `balance = 0`.
--   3. Auto-convert any remaining non-zero balances in `wallet_accounts` right now so all balances become 0.

begin;

-- ---------------------------------------------------------------------------
-- 1. convert_wallet_balance_to_minutes: convert 100% balance → minutes and set balance = 0
-- ---------------------------------------------------------------------------
create or replace function public.convert_wallet_balance_to_minutes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid    := auth.uid();
  v_role       text;
  v_hour_price numeric;
  v_balance    numeric;
  v_minutes    integer;
  v_paid_after integer;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;

  select upper(p.role::text), c.radar_hour_price
    into v_role, v_hour_price
  from public.profiles p
  join public.countries c on c.id = p.country_id
  where p.id = v_caller;

  if v_role is null or v_role not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_profile_required';
  end if;

  v_hour_price := coalesce(nullif(v_hour_price, 0), 100);

  select coalesce(balance, 0) into v_balance
  from public.wallet_accounts
  where profile_id = v_caller
  for update;

  if not found then
    return jsonb_build_object('success', true, 'minutesGranted', 0, 'reason', 'no_wallet');
  end if;

  if v_balance <= 0 then
    return jsonb_build_object('success', true, 'minutesGranted', 0, 'reason', 'balance_already_zero');
  end if;

  -- Convert entire balance to minutes (rounding to nearest minute so 100% of cash is spent)
  v_minutes := greatest(1, round(v_balance / (v_hour_price / 60.0))::integer);

  update public.wallet_accounts
  set balance                = 0,
      paid_minutes_remaining = coalesce(paid_minutes_remaining, 0) + v_minutes,
      pending_seconds_debt   = 0,
      time_bundle_expires_at = greatest(coalesce(time_bundle_expires_at, now()), now())
                               + make_interval(mins => v_minutes),
      updated_at             = clock_timestamp()
  where profile_id = v_caller
  returning paid_minutes_remaining into v_paid_after;

  insert into public.wallet_transactions (profile_id, type, transaction_type, amount, status, description_ar, metadata)
  values (
    v_caller, 'balance_converted_to_time', 'balance_converted_to_time', v_balance, 'COMPLETED',
    'تحويل كامل الرصيد النقدي إلى وقت رادار.',
    jsonb_build_object('minutesGranted', v_minutes, 'convertedBalance', v_balance, 'hourPrice', v_hour_price)
  );

  return jsonb_build_object(
    'success',              true,
    'minutesGranted',       v_minutes,
    'paidMinutesRemaining', v_paid_after,
    'newBalance',           0
  );
end;
$$;

revoke all on function public.convert_wallet_balance_to_minutes() from anon, public;
grant execute on function public.convert_wallet_balance_to_minutes() to authenticated;


-- ---------------------------------------------------------------------------
-- 2. captain_self_topup: convert amount → minutes and set balance = 0
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
  MAX_AMOUNT_PER_CALL constant numeric := 500;
  MAX_MINUTES_PER_CALL constant integer := 600;
  v_caller uuid := auth.uid();
  v_enabled boolean;
  v_role text;
  v_country_id integer;
  v_hour_price numeric;
  v_amount numeric := coalesce(p_amount, 0);
  v_minutes integer := coalesce(p_minutes, 0);
  v_converted_minutes integer := 0;
  v_total_minutes integer;
  v_wallet public.wallet_accounts%rowtype;
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

  v_hour_price := coalesce(nullif(v_hour_price, 0), 100);

  if v_amount > 0 then
    v_converted_minutes := round(v_amount / (v_hour_price / 60.0))::integer;
  end if;

  v_total_minutes := v_minutes + v_converted_minutes;

  if v_total_minutes <= 0 then
    raise exception 'amount_below_one_minute' using hint = 'المبلغ أقل من سعر دقيقة واحدة. زوّد المبلغ.';
  end if;

  insert into public.wallet_accounts (profile_id, balance, paid_minutes_remaining)
  values (v_caller, 0, v_total_minutes)
  on conflict (profile_id) do update
    set balance = 0,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_total_minutes,
        time_bundle_expires_at = case
          when v_total_minutes > 0 then greatest(
            coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
            now()
          ) + make_interval(mins => v_total_minutes)
          else public.wallet_accounts.time_bundle_expires_at
        end,
        updated_at = clock_timestamp();

  insert into public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  values (
    v_caller, 'self_topup_test', 'self_topup_test', v_amount, 'COMPLETED',
    'شحن اختباري ذاتي — تحويل الرصيد بالكامل إلى وقت رادار.',
    jsonb_build_object(
      'minutesGranted', v_total_minutes,
      'minutesFromAmount', v_converted_minutes,
      'minutesDirect', v_minutes,
      'testing', true
    )
  );

  select * into v_wallet from public.wallet_accounts where profile_id = v_caller;

  return jsonb_build_object(
    'success', true,
    'minutesGranted', v_total_minutes,
    'balance', 0,
    'paidMinutesRemaining', v_wallet.paid_minutes_remaining,
    'timeBundleExpiresAt', v_wallet.time_bundle_expires_at
  );
end;
$$;

revoke all on function public.captain_self_topup(numeric, integer) from anon;
grant execute on function public.captain_self_topup(numeric, integer) to authenticated;


-- ---------------------------------------------------------------------------
-- 3. delegate_charge_captain: convert amount → minutes and set balance = 0
-- ---------------------------------------------------------------------------
create or replace function public.delegate_charge_captain(
  p_captain_id uuid,
  p_amount numeric,
  p_description text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id integer;
  v_hour_price numeric;
  v_minutes integer := 0;
begin
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;

  select p.country_id, c.radar_hour_price
  into v_country_id, v_hour_price
  from public.profiles p
  left join public.countries c on c.id = p.country_id
  where p.id = p_captain_id;

  v_hour_price := coalesce(nullif(v_hour_price, 0), 100);
  v_minutes := greatest(1, round(p_amount / (v_hour_price / 60.0))::integer);

  insert into public.wallet_accounts (profile_id, balance, paid_minutes_remaining)
  values (p_captain_id, 0, v_minutes)
  on conflict (profile_id) do update
    set balance = 0,
        paid_minutes_remaining = coalesce(public.wallet_accounts.paid_minutes_remaining, 0) + v_minutes,
        time_bundle_expires_at = case
          when v_minutes > 0 then greatest(
            coalesce(public.wallet_accounts.time_bundle_expires_at, now()),
            now()
          ) + make_interval(mins => v_minutes)
          else public.wallet_accounts.time_bundle_expires_at
        end,
        updated_at = clock_timestamp();

  insert into public.wallet_transactions (
    profile_id, type, transaction_type, amount, status, description_ar, metadata
  )
  values (
    p_captain_id, 'delegate_charge', 'delegate_charge', p_amount, 'COMPLETED',
    coalesce(p_description, 'تم شحن وقت الرادار عن طريق المندوب.'),
    jsonb_build_object('delegate_id', auth.uid(), 'minutesGranted', v_minutes)
  );

  return jsonb_build_object(
    'captain_id', p_captain_id,
    'amount', p_amount,
    'minutesGranted', v_minutes,
    'status', 'COMPLETED'
  );
end;
$$;

grant execute on function public.delegate_charge_captain(uuid, numeric, text) to authenticated;


-- ---------------------------------------------------------------------------
-- 4. One-time execution: Zero out balance on ALL wallet_accounts right now.
-- ---------------------------------------------------------------------------
with conv as (
  select
    wa.profile_id,
    wa.balance,
    greatest(1, round(wa.balance / (coalesce(nullif(c.radar_hour_price, 0), 100) / 60.0))::integer) as mins
  from public.wallet_accounts wa
  join public.profiles p on p.id = wa.profile_id
  left join public.countries c on c.id = p.country_id
  where wa.balance > 0
)
update public.wallet_accounts wa
set balance                = 0,
    paid_minutes_remaining = wa.paid_minutes_remaining + cv.mins,
    pending_seconds_debt   = 0,
    time_bundle_expires_at = greatest(coalesce(wa.time_bundle_expires_at, now()), now())
                             + make_interval(mins => cv.mins),
    updated_at             = clock_timestamp()
from conv cv
where wa.profile_id = cv.profile_id;

notify pgrst, 'reload schema';

commit;
