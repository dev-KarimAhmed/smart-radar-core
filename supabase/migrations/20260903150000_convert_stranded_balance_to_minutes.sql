-- [FIX] Convert stranded cash balances into radar time.
--
-- Before migration 20260827130000_balance_converts_to_radar_time.sql, captain_self_topup
-- and delegate_charge_captain accumulated money into wallet_accounts.balance without
-- converting it to paid_minutes_remaining. Any captain who topped up before that
-- migration landed still has a positive balance sitting unused — the consumption RPC
-- (consume_captain_radar_minutes) only drains minutes, never cash, so the balance
-- appears permanently frozen at the amount paid.
--
-- Fix plan:
--   1. New RPC convert_wallet_balance_to_minutes — callable by the captain themselves.
--      Reads their balance, converts it via amount_to_radar_minutes, zeroes the balance,
--      adds the minutes, extends time_bundle_expires_at. Idempotent (balance=0 → no-op).
--   2. Run the same conversion for every account that currently has balance > 0 and
--      no active time bundle (they are definitely stranded). Captains with an active bundle
--      AND a positive balance are also converted — the bundle just gets extended.

begin;

-- ---------------------------------------------------------------------------
-- 1. Self-serve conversion RPC (captain can call this from the wallet tab).
-- ---------------------------------------------------------------------------

create or replace function public.convert_wallet_balance_to_minutes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_role text;
  v_country_id integer;
  v_wallet public.wallet_accounts%rowtype;
  v_conversion jsonb;
  v_minutes integer := 0;
  v_remainder numeric := 0;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;

  select upper(coalesce(role::text, '')), country_id
  into v_role, v_country_id
  from public.profiles where id = v_caller;

  if v_role not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_profile_required';
  end if;

  select * into v_wallet
  from public.wallet_accounts
  where profile_id = v_caller
  for update;

  if not found then
    return jsonb_build_object('success', true, 'minutesGranted', 0, 'reason', 'no_wallet');
  end if;

  if coalesce(v_wallet.balance, 0) <= 0 then
    return jsonb_build_object('success', true, 'minutesGranted', 0, 'reason', 'balance_already_zero');
  end if;

  v_conversion := public.amount_to_radar_minutes(v_wallet.balance, v_country_id);
  v_minutes    := (v_conversion->>'minutes')::integer;
  v_remainder  := (v_conversion->>'remainder')::numeric;

  if v_minutes <= 0 then
    return jsonb_build_object('success', false, 'reason', 'amount_below_one_minute',
                              'balance', v_wallet.balance, 'conversion', v_conversion);
  end if;

  update public.wallet_accounts
  set balance                = v_remainder,
      paid_minutes_remaining = coalesce(paid_minutes_remaining, 0) + v_minutes,
      pending_seconds_debt   = 0,
      time_bundle_expires_at = greatest(
        coalesce(time_bundle_expires_at, now()),
        now()
      ) + make_interval(mins => v_minutes),
      updated_at             = clock_timestamp()
  where profile_id = v_caller;

  insert into public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
  values (
    v_caller,
    'balance_converted_to_time',
    v_wallet.balance,
    'COMPLETED',
    'تحويل الرصيد النقدي إلى وقت رادار.',
    jsonb_build_object('minutesGranted', v_minutes, 'remainder', v_remainder, 'conversion', v_conversion)
  );

  select * into v_wallet from public.wallet_accounts where profile_id = v_caller;

  return jsonb_build_object(
    'success',               true,
    'minutesGranted',        v_minutes,
    'paidMinutesRemaining',  v_wallet.paid_minutes_remaining,
    'balance',               v_wallet.balance,
    'timeBundleExpiresAt',   v_wallet.time_bundle_expires_at
  );
end;
$$;

revoke all on function public.convert_wallet_balance_to_minutes() from anon;
grant execute on function public.convert_wallet_balance_to_minutes() to authenticated;


-- ---------------------------------------------------------------------------
-- 2. One-time back-fill: convert any stranded balances that already exist.
--    Runs at migration time with elevated privileges (migration session).
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  conv jsonb;
  v_minutes integer;
  v_remainder numeric;
begin
  for r in
    select wa.profile_id, wa.balance, p.country_id
    from public.wallet_accounts wa
    join public.profiles p on p.id = wa.profile_id
    where wa.balance > 0
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
  loop
    conv        := public.amount_to_radar_minutes(r.balance, r.country_id);
    v_minutes   := (conv->>'minutes')::integer;
    v_remainder := (conv->>'remainder')::numeric;

    if v_minutes > 0 then
      update public.wallet_accounts
      set balance                = v_remainder,
          paid_minutes_remaining = coalesce(paid_minutes_remaining, 0) + v_minutes,
          pending_seconds_debt   = 0,
          time_bundle_expires_at = greatest(
            coalesce(time_bundle_expires_at, now()),
            now()
          ) + make_interval(mins => v_minutes),
          updated_at             = clock_timestamp()
      where profile_id = r.profile_id;

      insert into public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
      values (
        r.profile_id,
        'balance_converted_to_time',
        r.balance,
        'COMPLETED',
        'تحويل تلقائي: رصيد نقدي قديم حُوِّل إلى وقت رادار.',
        jsonb_build_object(
          'minutesGranted', v_minutes,
          'originalBalance', r.balance,
          'remainder', v_remainder,
          'autoMigration', true
        )
      );

      raise notice 'Converted % balance → % minutes for profile %', r.balance, v_minutes, r.profile_id;
    end if;
  end loop;
end;
$$;


notify pgrst, 'reload schema';

commit;
