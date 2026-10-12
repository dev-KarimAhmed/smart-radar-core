-- Captain trip milestone sync.
-- Fixes the accepted -> arrived -> active trip server lifecycle.
-- Run this after 20260707_accept_ride_offer_sync.sql.

do $$
begin
  if exists (select 1 from pg_type where typname = 'ride_request_status') then
    alter type public.ride_request_status add value if not exists 'ACCEPTED';
    alter type public.ride_request_status add value if not exists 'ARRIVED';
    alter type public.ride_request_status add value if not exists 'TRIP_ACTIVE';
    alter type public.ride_request_status add value if not exists 'COMPLETED';
    alter type public.ride_request_status add value if not exists 'CANCELLED';
  end if;
end $$;

alter table if exists public.ride_requests add column if not exists accepted_captain_id uuid;
alter table if exists public.ride_requests add column if not exists arrived_at timestamptz;
alter table if exists public.ride_requests add column if not exists started_at timestamptz;
alter table if exists public.ride_requests add column if not exists updated_at timestamptz not null default now();

drop function if exists public.captain_arrived_to_pickup(uuid) cascade;

create or replace function public.captain_arrived_to_pickup(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
begin
  select *
  into req
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'ride_request_not_found';
  end if;

  if req.accepted_captain_id is distinct from auth.uid() then
    raise exception 'not_accepted_captain';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('ACCEPTED', 'ARRIVED') then
    raise exception 'ride_request_not_ready_for_arrival';
  end if;

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'ARRIVED',
      arrived_at = coalesce(arrived_at, now()),
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'ARRIVED',
    'arrived_at', now()
  );
end;
$$;

drop function if exists public.start_ride_trip(uuid) cascade;

create or replace function public.start_ride_trip(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
begin
  select *
  into req
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'ride_request_not_found';
  end if;

  if req.accepted_captain_id is distinct from auth.uid() then
    raise exception 'not_accepted_captain';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('ARRIVED', 'TRIP_ACTIVE') then
    raise exception 'captain_must_arrive_first';
  end if;

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'TRIP_ACTIVE',
      started_at = coalesce(started_at, now()),
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'TRIP_ACTIVE',
    'started_at', now()
  );
end;
$$;

grant execute on function public.captain_arrived_to_pickup(uuid) to authenticated;
grant execute on function public.start_ride_trip(uuid) to authenticated;

notify pgrst, 'reload schema';
