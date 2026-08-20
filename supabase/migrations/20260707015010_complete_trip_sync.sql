-- Captain/rider trip completion sync.
-- Recreates complete_ride_trip with participant permissions and ledger insertion.
-- Run after:
--   1. 20260707_accept_ride_offer_sync.sql
--   2. 20260707_captain_trip_milestones_sync.sql

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
alter table if exists public.ride_requests add column if not exists server_estimated_fare numeric;
alter table if exists public.ride_requests add column if not exists final_fare numeric;
alter table if exists public.ride_requests add column if not exists completed_at timestamptz;
alter table if exists public.ride_requests add column if not exists updated_at timestamptz not null default now();
alter table if exists public.ride_requests add column if not exists status text not null default 'PENDING';

create table if not exists public.trips_72h_ledger (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  captain_id uuid not null references public.profiles(id) on delete cascade,
  settled_fare numeric not null default 0,
  duration_minutes integer,
  distance_meters integer,
  accepted_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  final_fare numeric not null default 0,
  status text not null default 'COMPLETED',
  completed_at timestamptz not null default now(),
  purge_at timestamptz not null default (now() + interval '72 hours'),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.trips_72h_ledger add column if not exists request_id uuid;
alter table public.trips_72h_ledger add column if not exists rider_id uuid references public.profiles(id) on delete cascade;
alter table public.trips_72h_ledger add column if not exists captain_id uuid references public.profiles(id) on delete cascade;
alter table public.trips_72h_ledger add column if not exists settled_fare numeric not null default 0;
alter table public.trips_72h_ledger add column if not exists duration_minutes integer;
alter table public.trips_72h_ledger add column if not exists distance_meters integer;
alter table public.trips_72h_ledger add column if not exists accepted_at timestamptz not null default now();
alter table public.trips_72h_ledger add column if not exists started_at timestamptz;
alter table public.trips_72h_ledger add column if not exists ended_at timestamptz;
alter table public.trips_72h_ledger add column if not exists final_fare numeric not null default 0;
alter table public.trips_72h_ledger add column if not exists status text not null default 'COMPLETED';
alter table public.trips_72h_ledger add column if not exists completed_at timestamptz not null default now();
alter table public.trips_72h_ledger add column if not exists purge_at timestamptz not null default (now() + interval '72 hours');
alter table public.trips_72h_ledger add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.trips_72h_ledger alter column settled_fare set default 0;

drop function if exists public.complete_ride_trip(uuid) cascade;

create or replace function public.complete_ride_trip(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
  final_amount numeric;
begin
  select *
  into req
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'ride_request_not_found';
  end if;

  if req.rider_id is distinct from auth.uid()
    and req.accepted_captain_id is distinct from auth.uid()
  then
    raise exception 'not_trip_participant';
  end if;

  if req.accepted_captain_id is null then
    raise exception 'accepted_captain_required';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('TRIP_ACTIVE', 'ACTIVE') then
    raise exception 'ride_request_not_active';
  end if;

  final_amount := coalesce(req.final_fare, req.server_estimated_fare, 0);

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'COMPLETED',
      final_fare = final_amount,
      completed_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.trips_72h_ledger (
    request_id,
    rider_id,
    captain_id,
    settled_fare,
    accepted_at,
    started_at,
    ended_at,
    final_fare,
    status,
    completed_at,
    purge_at,
    metadata
  )
  values (
    p_request_id,
    req.rider_id,
    req.accepted_captain_id,
    final_amount,
    coalesce(req.arrived_at, req.started_at, now()),
    req.started_at,
    now(),
    final_amount,
    'COMPLETED',
    now(),
    now() + interval '72 hours',
    jsonb_build_object(
      'source', 'complete_ride_trip',
      'status_before_completion', req.status::text,
      'accepted_offer_id', req.accepted_offer_id
    )
  )
  on conflict (request_id) do update
  set settled_fare = excluded.settled_fare,
      final_fare = excluded.final_fare,
      status = excluded.status,
      completed_at = excluded.completed_at,
      ended_at = excluded.ended_at,
      purge_at = excluded.purge_at,
      metadata = public.trips_72h_ledger.metadata || excluded.metadata;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'COMPLETED',
    'final_fare', final_amount,
    'captain_id', req.accepted_captain_id,
    'rider_id', req.rider_id
  );
end;
$$;

grant execute on function public.complete_ride_trip(uuid) to authenticated;

notify pgrst, 'reload schema';
