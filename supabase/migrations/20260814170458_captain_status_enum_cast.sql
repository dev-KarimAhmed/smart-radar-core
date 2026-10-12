-- Fix set_captain_status for databases where profiles.status uses public.user_status.
-- Apply this after 20260814_captain_status_activation.sql.

begin;

drop function if exists public.set_captain_status(text) cascade;

create or replace function public.set_captain_status(p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_status text := lower(trim(coalesce(p_status, '')));
  status_value text;
  captain_role text;
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

  select e.enumlabel
    into status_value
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  join pg_enum e on e.enumtypid = t.oid
  where n.nspname = 'public'
    and t.typname = 'user_status'
    and (
      lower(e.enumlabel) = requested_status
      or (
        requested_status = 'active'
        and lower(e.enumlabel) in (
          'online', 'available', 'active', 'ready', 'on_duty', 'on-duty'
        )
      )
      or (
        requested_status = 'idle'
        and lower(e.enumlabel) in (
          'offline', 'inactive', 'idle', 'unavailable', 'paused', 'off_duty', 'off-duty'
        )
      )
    )
  order by case
    when lower(e.enumlabel) = requested_status then 0
    when requested_status = 'active' and lower(e.enumlabel) = 'online' then 1
    when requested_status = 'active' and lower(e.enumlabel) = 'available' then 2
    when requested_status = 'active' and lower(e.enumlabel) = 'ready' then 3
    when requested_status = 'active' and lower(e.enumlabel) in ('on_duty', 'on-duty') then 4
    when requested_status = 'idle' and lower(e.enumlabel) = 'offline' then 1
    when requested_status = 'idle' and lower(e.enumlabel) = 'inactive' then 2
    when requested_status = 'idle' and lower(e.enumlabel) = 'unavailable' then 3
    when requested_status = 'idle' and lower(e.enumlabel) = 'paused' then 4
    when requested_status = 'idle' and lower(e.enumlabel) in ('off_duty', 'off-duty') then 5
    else 6
  end
  limit 1;

  if status_value is null then
    raise exception 'invalid_captain_status';
  end if;

  select upper(trim(p.role::text))
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
  end if;

  update public.profiles
  set status = status_value::public.user_status,
      updated_at = clock_timestamp()
  where id = auth.uid();

  if not found then
    raise exception 'captain_profile_not_found';
  end if;

  return jsonb_build_object(
    'profile_id', auth.uid(),
    'status', requested_status,
    'wallet_minutes', wallet_minutes,
    'time_bundle_expires_at', wallet_expiry,
    'has_active_bundle', case when requested_status = 'idle' then true else has_bundle end
  );
end;
$$;

revoke all on function public.set_captain_status(text) from public;
grant execute on function public.set_captain_status(text) to authenticated;

notify pgrst, 'reload schema';

commit;
