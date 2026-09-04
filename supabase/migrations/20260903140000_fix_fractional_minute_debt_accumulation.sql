-- [FIX] Fractional elapsed-time accumulation for consume_captain_radar_minutes.
--
-- Root cause: the RPC fires every 20 s. Each tick computes
--   v_elapsed_minutes = elapsed_seconds / 60 ≈ 0.333 minutes.
-- That fraction is subtracted from paid_minutes_remaining (stored as integer).
-- Integer arithmetic floors 0.333 → 0, so no minutes are ever deducted.
-- The display occasionally drifts because the realtime UPDATE on wallet_accounts
-- is picked up by the wallet hook, but the DB value hasn't actually changed.
--
-- Fix: accumulate elapsed seconds in a new numeric column
-- wallet_accounts.pending_seconds_debt. When the debt reaches ≥ 60 s,
-- convert the whole-minute count to minutes and deduct them. This way the
-- server stays perfectly accurate (sub-minute debt is never lost), and the
-- captain sees the balance decrease by 1 minute every ~60 s of real online time.

begin;

alter table public.wallet_accounts
  add column if not exists pending_seconds_debt numeric not null default 0;

comment on column public.wallet_accounts.pending_seconds_debt is
  'Fractional elapsed seconds that have not yet converted to a full deducted minute.
   Accumulates across consume_captain_radar_minutes ticks; whole minutes are deducted
   only when this value crosses 60, preventing integer-floor precision loss.';

drop function if exists public.consume_captain_radar_minutes() cascade;

create or replace function public.consume_captain_radar_minutes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  MAX_TICK_SECONDS constant numeric := 300;  -- 5 min cap per tick (same as before)
  v_caller uuid := auth.uid();
  v_active_label text;
  v_profile_status text;
  v_wallet public.wallet_accounts%rowtype;
  v_elapsed_seconds numeric;
  v_total_debt_seconds numeric;
  v_whole_minutes integer;
  v_bonus_used integer := 0;
  v_paid_used integer := 0;
  v_total_used integer := 0;
  v_remaining numeric;
  v_bundle_expired boolean := false;
begin
  if v_caller is null then
    raise exception 'authentication_required';
  end if;

  -- Resolve the active status label dynamically (same as before).
  select e.enumlabel
    into v_active_label
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  join pg_enum e on e.enumtypid = t.oid
  where n.nspname = 'public'
    and t.typname = 'user_status'
    and lower(e.enumlabel) in ('active', 'online', 'available', 'ready', 'on_duty', 'on-duty')
  order by case lower(e.enumlabel)
    when 'active' then 0 when 'online' then 1 when 'available' then 2 when 'ready' then 3 else 4
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
    update public.wallet_accounts
    set paid_minutes_remaining  = 0,
        bonus_minutes_remaining = 0,
        pending_seconds_debt    = 0,
        last_minute_tick_at     = clock_timestamp(),
        updated_at              = clock_timestamp()
    where profile_id = v_caller;

    v_remaining := 0;
  else
    -- 1. Compute elapsed seconds since the last tick.
    v_elapsed_seconds := greatest(
      0,
      extract(epoch from (clock_timestamp() - coalesce(v_wallet.last_minute_tick_at, clock_timestamp())))
    );
    -- Cap: a single large gap (tab backgrounded, reconnect) can't drain a huge chunk.
    v_elapsed_seconds := least(v_elapsed_seconds, MAX_TICK_SECONDS);

    -- 2. Add to the accumulated debt and compute whole minutes ready to deduct.
    v_total_debt_seconds := coalesce(v_wallet.pending_seconds_debt, 0) + v_elapsed_seconds;
    v_whole_minutes      := floor(v_total_debt_seconds / 60)::integer;

    -- 3. Deduct whole minutes only (drain bonus first, then paid).
    if v_whole_minutes > 0 then
      v_bonus_used := least(greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0)), v_whole_minutes);
      v_paid_used  := least(greatest(0, coalesce(v_wallet.paid_minutes_remaining,  0)), v_whole_minutes - v_bonus_used);
      v_total_used := v_bonus_used + v_paid_used;
    end if;

    -- 4. Persist: deduct minutes, keep leftover seconds as the new debt.
    update public.wallet_accounts
    set bonus_minutes_remaining = greatest(0, coalesce(bonus_minutes_remaining, 0) - v_bonus_used),
        paid_minutes_remaining  = greatest(0, coalesce(paid_minutes_remaining,  0) - v_paid_used),
        -- Carry forward the sub-minute remainder so no seconds are ever lost.
        pending_seconds_debt    = v_total_debt_seconds - (v_whole_minutes * 60),
        last_minute_tick_at     = clock_timestamp(),
        updated_at              = clock_timestamp()
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
        jsonb_build_object(
          'minutesConsumed', v_total_used,
          'fromBonus',       v_bonus_used,
          'fromPaid',        v_paid_used,
          'elapsedSeconds',  v_elapsed_seconds,
          'debtSeconds',     v_total_debt_seconds - (v_whole_minutes * 60)
        )
      );
    end if;

    v_remaining := greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0))
                 + greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0));

    if v_remaining <= 0 then
      update public.profiles
      set status     = 'idle'::public.user_status,
          updated_at = clock_timestamp()
      where id = v_caller
        and status::text = v_active_label;
    end if;
  end if;

  v_remaining := greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0))
               + greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0));

  return jsonb_build_object(
    'consumed_minutes',        v_total_used,
    'paid_minutes_remaining',  greatest(0, coalesce(v_wallet.paid_minutes_remaining, 0)),
    'bonus_minutes_remaining', greatest(0, coalesce(v_wallet.bonus_minutes_remaining, 0)),
    'has_active_bundle',       v_remaining > 0
  );
end;
$$;

revoke all on function public.consume_captain_radar_minutes() from public;
grant execute on function public.consume_captain_radar_minutes() to authenticated;

notify pgrst, 'reload schema';

commit;
