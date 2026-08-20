-- Adds rider pickup details to captain radar requests.
-- Pending radar requests expose the rider-provided address and map URL, while
-- exact pickup coordinates remain hidden until a captain is accepted.

begin;

alter table if exists public.ride_requests
  add column if not exists origin_address text;

alter table if exists public.ride_requests
  add column if not exists origin_google_maps_url text;

alter table if exists public.ride_requests
  add column if not exists estimated_distance_km numeric;

alter table if exists public.ride_requests
  add column if not exists estimated_duration_minutes integer;

-- Repair legacy requests that already contain a valid pickup coordinate but
-- were created before pickup links were stored. This never creates a 0,0 URL.
update public.ride_requests
set origin_google_maps_url =
      'https://www.google.com/maps/search/?api=1&query='
      || origin_lat::text || ',' || origin_lng::text
where origin_google_maps_url is null
  and origin_lat is not null
  and origin_lng is not null
  and origin_lat between -90 and 90
  and origin_lng between -180 and 180
  and (origin_lat <> 0 or origin_lng <> 0);

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
  null::text as destination_address_en,
  rr.destination_address_ar as destination_address,
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
  rr.updated_at,
  rr.origin_address,
  case
    when rr.origin_google_maps_url is not null
      and rr.origin_google_maps_url !~* '(^|[?&](query|q)=)0([.]0+)?(,|%2[cC]|%20|[[:space:]])+0([.]0+)?([^0-9]|$)'
    then rr.origin_google_maps_url
    else null::text
  end as origin_google_maps_url,
  rr.estimated_distance_km,
  rr.estimated_duration_minutes
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
    and not exists (
      select 1
      from public.user_blocks ub
      where (ub.blocker_id = rr.rider_id and ub.blocked_id = auth.uid())
         or (ub.blocker_id = auth.uid() and ub.blocked_id = rr.rider_id)
    )
  )
  or rr.rider_id = auth.uid();

revoke all on public.captain_radar_requests from anon;
grant select on public.captain_radar_requests to authenticated;

commit;
