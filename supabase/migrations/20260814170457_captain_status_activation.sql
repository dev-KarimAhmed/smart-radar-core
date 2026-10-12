-- Server-authoritative captain availability for the radar.
-- Apply after 20260814_captain_wallet_phase2.sql.

begin;

alter table if exists public.profiles
  add column if not exists status text not null default 'idle';

alter table if exists public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- Publish captain availability changes so every open dashboard receives the
-- same server state without a refresh.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'profiles'
    )
  then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;

drop function if exists public.set_captain_status(text) cascade;

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

  -- Existing projects store profiles.status as public.user_status, not text.
  -- Resolve the enum label case before assigning it to the typed column.
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
