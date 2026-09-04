-- Server-authoritative deduction of a captain's radar time bundle while they are
-- online ('active'). Closes the gap flagged in docs/driver-dashboard-alignment-report.md
-- and docs/captain-dashboard-implementation-report.md: minutes were only ever gated
-- (get_captain_wallet_status / set_captain_status), never actually consumed.
--
-- Design: elapsed time is computed server-side from wallet_accounts.last_minute_tick_at,
-- never trusted from the client — the client only decides WHEN to call this (piggybacking
-- on the captain being online), never HOW MUCH to deduct. This mirrors the existing
-- pulse_captain_location() pattern (client-triggered tick, server-computed write).
--
-- bonus_minutes_remaining is drained before paid_minutes_remaining. wallet_accounts.balance
-- (cash) is never touched here — topping up converts money to minutes once, and from then
-- on usage only ever spends minutes, per product decision.

begin;

alter table if exists public.wallet_accounts
  add column if not exists last_minute_tick_at timestamptz;

update public.wallet_accounts
set last_minute_tick_at = coalesce(last_minute_tick_at, updated_at, now())
where last_minute_tick_at is null;

drop function if exists public.consume_captain_radar_minutes() cascade;

create or replace function public.consume_captain_radar_minutes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Same active-status resolution as set_captain_status(), scoped to the 'active' side only.
  MAX_TICK_MINUTES constant numeric := 5;
  v_caller uuid := auth.uid();
  v_active_label text;
  v_profile_status text;
  v_wallet public.wallet_accounts%rowtype;
  v_elapsed_minutes numeric;
  v_bonus_used numeric := 0;
  v_paid_used numeric := 0;
  v_total_used numeric := 0;
  v_remaining numeric;
  v_bundle_expired boolean := false;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;

  select e.enumlabel
    into v_active_label
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  join pg_enum e on e.enumtypid = t.oid
  where n.nspname = 'public'
    and t.typname = 'user_status'
    and lower(e.enumlabel) in ('active', 'online', 'available', 'ready', 'on_duty', 'on-duty')
  order by case lower(e.enumlabel)
    when 'active' then 0
    when 'online' then 1
    when 'available' then 2
    when 'ready' then 3
    else 4
  end
  limit 1;

  select p.status::text into v_profile_status
  from public.profiles p
  where p.id = v_caller
  for update;

  if not found or v_profile_status is distinct from v_active_label then
    return jsonb_build_object('consumed_minutes', 0, 'reason', 'not_active');
  end if;

  select * into v_wallet
  from public.wallet_accounts
  where profile_id = v_caller
  for update;

  if not found then
    return jsonb_build_object('consumed_minutes', 0, 'reason', 'no_wallet', 'has_active_bundle', false);
  end if;

  v_bundle_expired := v_wallet.time_bundle_expires_at is not null
    and v_wallet.time_bundle_expires_at <= clock_timestamp();

  if v_bundle_expired then
    v_wallet.paid_minutes_remaining := 0;
    v_wallet.bonus_minutes_remaining := 0;

    update public.wallet_accounts
    set paid_minutes_remaining = 0,
        bonus_minutes_remaining = 0,
        last_minute_tick_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where profile_id = v_caller;
  else
    v_elapsed_minutes := greatest(
      0,
      extract(epoch from (clock_timestamp() - coalesce(v_wallet.last_minute_tick_at, clock_timestamp()))) / 60.0
    );
    -- Cap a single tick so a backgrounded tab / reconnect can't drain a huge chunk at once.
    v_elapsed_minutes := least(v_elapsed_minutes, MAX_TICK_MINUTES);

    v_bonus_used := least(greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0)), v_elapsed_minutes);
    v_paid_used := least(greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0)), v_elapsed_minutes - v_bonus_used);
    v_total_used := v_bonus_used + v_paid_used;

    update public.wallet_accounts
    set bonus_minutes_remaining = greatest(0, coalesce(bonus_minutes_remaining, 0) - v_bonus_used),
        paid_minutes_remaining = greatest(0, coalesce(paid_minutes_remaining, 0) - v_paid_used),
        last_minute_tick_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where profile_id = v_caller
    returning paid_minutes_remaining, bonus_minutes_remaining
    into v_wallet.paid_minutes_remaining, v_wallet.bonus_minutes_remaining;

    if v_total_used > 0 then
      insert into public.wallet_transactions (
        profile_id, type, transaction_type, amount, status, description_ar, metadata
      )
      values (
        v_caller, 'radar_minute_consumption', 'radar_minute_consumption', 0, 'COMPLETED',
        'استهلاك دقائق الرادار أثناء الاستخدام.',
        jsonb_build_object('minutesConsumed', v_total_used, 'fromBonus', v_bonus_used, 'fromPaid', v_paid_used)
      );
    end if;
  end if;

  v_remaining := greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0))
    + greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0));

  if v_remaining <= 0 then
    update public.profiles
    set status = 'idle'::public.user_status,
        updated_at = clock_timestamp()
    where id = v_caller
      and status::text = v_active_label;
  end if;

  return jsonb_build_object(
    'consumed_minutes', v_total_used,
    'paid_minutes_remaining', greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0)),
    'bonus_minutes_remaining', greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0)),
    'has_active_bundle', v_remaining > 0
  );
end;
$$;

revoke all on function public.consume_captain_radar_minutes() from public;
grant execute on function public.consume_captain_radar_minutes() to authenticated;

notify pgrst, 'reload schema';

commit;
