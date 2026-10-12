-- [FIX] Immediate direct conversion for profile aa9b713b (balance=400, Egypt, 80 minutes).
-- Also fixes convert_wallet_balance_to_minutes() to use direct SQL instead of
-- calling amount_to_radar_minutes(), eliminating the indirect call that may
-- fail inside the SECURITY DEFINER context when country price returns NULL.

begin;

-- Step 1: Convert remaining stranded balances (only those with >= 1 minute worth).
with conv as (
  select
    wa.profile_id,
    wa.balance,
    floor(wa.balance / (c.radar_hour_price / 60.0))::integer as mins,
    wa.balance - floor(wa.balance / (c.radar_hour_price / 60.0)) * (c.radar_hour_price / 60.0) as rem
  from public.wallet_accounts wa
  join public.profiles p on p.id = wa.profile_id
  join public.countries c on c.id = p.country_id
  where wa.balance >= (c.radar_hour_price / 60.0)   -- at least 1 full minute
    and upper(p.role::text) in ('CAPTAIN', 'DRIVER')
)
update public.wallet_accounts wa
set paid_minutes_remaining = wa.paid_minutes_remaining + cv.mins,
    balance                = round(cv.rem, 2),
    pending_seconds_debt   = 0,
    time_bundle_expires_at = greatest(coalesce(wa.time_bundle_expires_at, now()), now())
                             + make_interval(mins => cv.mins),
    updated_at             = clock_timestamp()
from conv cv
where wa.profile_id = cv.profile_id;

-- Step 2: Replace convert_wallet_balance_to_minutes() with a version that uses
-- direct SQL math instead of calling amount_to_radar_minutes().
drop function if exists public.convert_wallet_balance_to_minutes();

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
  v_remainder  numeric;
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

  -- Direct math — no helper function call.
  v_minutes   := floor(v_balance / (v_hour_price / 60.0))::integer;
  v_remainder := round(v_balance - v_minutes * (v_hour_price / 60.0), 2);

  if v_minutes <= 0 then
    return jsonb_build_object(
      'success', false, 'reason', 'amount_below_one_minute',
      'balance', v_balance, 'hourPrice', v_hour_price
    );
  end if;

  update public.wallet_accounts
  set balance                = v_remainder,
      paid_minutes_remaining = coalesce(paid_minutes_remaining, 0) + v_minutes,
      pending_seconds_debt   = 0,
      time_bundle_expires_at = greatest(coalesce(time_bundle_expires_at, now()), now())
                               + make_interval(mins => v_minutes),
      updated_at             = clock_timestamp()
  where profile_id = v_caller
  returning paid_minutes_remaining into v_paid_after;

  insert into public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
  values (
    v_caller, 'balance_converted_to_time', v_balance, 'COMPLETED',
    'تحويل الرصيد النقدي إلى وقت رادار.',
    jsonb_build_object('minutesGranted', v_minutes, 'remainder', v_remainder, 'hourPrice', v_hour_price)
  );

  return jsonb_build_object(
    'success',              true,
    'minutesGranted',       v_minutes,
    'paidMinutesRemaining', v_paid_after,
    'newBalance',           v_remainder
  );
end;
$$;

revoke all on function public.convert_wallet_balance_to_minutes() from anon, public;
grant execute on function public.convert_wallet_balance_to_minutes() to authenticated;

notify pgrst, 'reload schema';

commit;
