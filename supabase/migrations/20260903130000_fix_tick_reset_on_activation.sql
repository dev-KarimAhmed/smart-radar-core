-- [FIX] Phantom minute deduction on radar activation.
--
-- Bug: set_captain_status('active') did not reset wallet_accounts.last_minute_tick_at.
-- When consume_captain_radar_minutes() is first called (up to 20 s after going active),
-- it computes elapsed = clock_timestamp() - last_minute_tick_at. If last_minute_tick_at
-- was last written hours ago (e.g. from a previous session), the captain immediately
-- loses minutes they never consumed, capped at MAX_TICK_MINUTES (5 min) per call but
-- still wrong on the very first tick.
--
-- Fix: stamp last_minute_tick_at = clock_timestamp() in wallet_accounts whenever the
-- captain transitions to 'active'. The first tick then sees ~0 elapsed seconds and
-- deducts nothing, which is correct.

begin;

create or replace function public.set_captain_status(p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_status text := lower(trim(coalesce(p_status, '')));
  captain_role text;
  status_value text;
  wallet_minutes numeric := 0;
  wallet_expiry timestamptz;
  has_bundle boolean := false;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if requested_status not in ('active', 'idle') then
    raise exception 'invalid_captain_status';
  end if;

  -- Resolve enum label (handles projects where profiles.status is public.user_status, not text).
  select e.enumlabel
    into status_value
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  join pg_enum e on e.enumtypid = t.oid
  where n.nspname = 'public'
    and t.typname = 'user_status'
    and lower(e.enumlabel) = requested_status
  limit 1;

  if status_value is null then
    raise exception 'invalid_captain_status';
  end if;

  select upper(p.role::text)
    into captain_role
  from public.profiles p
  where p.id = auth.uid();

  if captain_role not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_role_required';
  end if;

  if requested_status = 'active' then
    select
      greatest(0, coalesce(w.paid_minutes_remaining, 0))
        + greatest(0, coalesce(w.bonus_minutes_remaining, 0)),
      w.time_bundle_expires_at
    into wallet_minutes, wallet_expiry
    from public.wallet_accounts w
    where w.profile_id = auth.uid();

    has_bundle := wallet_minutes > 0
      and (wallet_expiry is null or wallet_expiry > clock_timestamp());

    if not has_bundle then
      raise exception 'captain_time_bundle_required';
    end if;

    -- KEY FIX: stamp the tick baseline to NOW so the first consumption call
    -- sees ~0 elapsed seconds rather than stale time from a previous session.
    update public.wallet_accounts
    set last_minute_tick_at = clock_timestamp(),
        updated_at          = clock_timestamp()
    where profile_id = auth.uid();
  end if;

  update public.profiles
  set status     = status_value::public.user_status,
      updated_at = clock_timestamp()
  where id = auth.uid();

  if not found then
    raise exception 'captain_profile_not_found';
  end if;

  return jsonb_build_object(
    'profile_id',           auth.uid(),
    'status',               requested_status,
    'wallet_minutes',       wallet_minutes,
    'time_bundle_expires_at', wallet_expiry,
    'has_active_bundle',    case when requested_status = 'idle' then true else has_bundle end
  );
end;
$$;

revoke all on function public.set_captain_status(text) from public;
grant execute on function public.set_captain_status(text) to authenticated;

notify pgrst, 'reload schema';

commit;
