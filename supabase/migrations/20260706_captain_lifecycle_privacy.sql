-- Captain lifecycle hardening: trusted milestones, radar privacy, and time-bundle gate.
-- Project ref: shjbchvmwrtfmtrdwlum

begin;

alter table if exists public.ride_requests add column if not exists arrived_at timestamptz;
alter table if exists public.ride_requests add column if not exists started_at timestamptz;
alter table if exists public.ride_requests add column if not exists destination_address_en text;
alter table if exists public.ride_requests add column if not exists destination_address text;
alter table if exists public.ride_requests add column if not exists updated_at timestamptz not null default now();
alter table if exists public.wallet_accounts add column if not exists time_bundle_expires_at timestamptz;

drop function if exists public.captain_arrived_to_pickup(uuid) cascade;
drop function if exists public.start_ride_trip(uuid) cascade;

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

  if upper(coalesce(req.status::text, '')) <> 'ACCEPTED' then
    raise exception 'ride_request_not_ready_for_arrival';
  end if;

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'ARRIVED',
      arrived_at = now(),
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'ARRIVED',
    'arrived_at', now()
  );
end;
$$;

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

  if upper(coalesce(req.status::text, '')) <> 'ARRIVED' then
    raise exception 'captain_must_arrive_first';
  end if;

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'TRIP_ACTIVE',
      started_at = now(),
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'TRIP_ACTIVE',
    'started_at', now()
  );
end;
$$;

-- RLS can filter rows, but cannot mask selected columns per role.
-- Exact pickup coordinates are therefore protected by denying pending-request scans
-- on the base table and exposing a masked view for captain radar reads.
alter table if exists public.ride_requests enable row level security;

drop policy if exists ride_requests_select_own on public.ride_requests;
create policy ride_requests_select_own on public.ride_requests
for select to authenticated
using (
  rider_id = (select auth.uid())
  or accepted_captain_id = (select auth.uid())
);

drop view if exists public.captain_radar_requests;
create view public.captain_radar_requests
with (security_barrier = true)
as
select
  rr.id,
  rr.rider_id,
  case when rr.accepted_captain_id = auth.uid() then rr.origin_lat else null::numeric end as origin_lat,
  case when rr.accepted_captain_id = auth.uid() then rr.origin_lng else null::numeric end as origin_lng,
  rr.destination_lat,
  rr.destination_lng,
  rr.origin_h3,
  rr.origin_h3 as h3_cell,
  rr.destination_h3,
  rr.destination_address_ar,
  rr.destination_address_en,
  rr.destination_address,
  rr.server_estimated_fare,
  rr.country_id,
  rr.status,
  rr.created_at,
  rr.accepted_offer_id,
  rr.accepted_captain_id,
  rr.final_fare,
  rr.arrived_at,
  rr.started_at,
  rr.completed_at,
  rr.updated_at
from public.ride_requests rr
where
  (
    upper(coalesce(rr.status::text, '')) = 'PENDING'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and upper(coalesce(p.role::text, '')) in ('DRIVER', 'CAPTAIN')
        and (rr.country_id is null or p.country_id = rr.country_id)
    )
  )
  or rr.rider_id = auth.uid()
  or rr.accepted_captain_id = auth.uid();

revoke all on public.captain_radar_requests from anon;
grant select on public.captain_radar_requests to authenticated;
grant execute on function public.captain_arrived_to_pickup(uuid) to authenticated;
grant execute on function public.start_ride_trip(uuid) to authenticated;

commit;
