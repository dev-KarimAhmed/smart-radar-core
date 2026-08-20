-- Rider offer acceptance contract.
-- This aligns rider acceptance with captain realtime handoff.

do $$
begin
  if exists (select 1 from pg_type where typname = 'ride_request_status') then
    alter type public.ride_request_status add value if not exists 'RECEIVING_OFFERS';
    alter type public.ride_request_status add value if not exists 'ACCEPTED';
    alter type public.ride_request_status add value if not exists 'TRIP_ACTIVE';
    alter type public.ride_request_status add value if not exists 'COMPLETED';
    alter type public.ride_request_status add value if not exists 'CANCELLED';
  end if;

  if exists (select 1 from pg_type where typname = 'ride_offer_status') then
    alter type public.ride_offer_status add value if not exists 'PENDING';
    alter type public.ride_offer_status add value if not exists 'ACCEPTED';
    alter type public.ride_offer_status add value if not exists 'REJECTED';
    alter type public.ride_offer_status add value if not exists 'CANCELLED';
  end if;
end $$;

alter table if exists public.ride_requests add column if not exists accepted_offer_id uuid;
alter table if exists public.ride_requests add column if not exists accepted_captain_id uuid;
alter table if exists public.ride_requests add column if not exists final_fare numeric;
alter table if exists public.ride_requests add column if not exists updated_at timestamptz not null default now();

alter table if exists public.ride_offers add column if not exists offered_fare numeric;
alter table if exists public.ride_offers add column if not exists offer_price numeric;
alter table if exists public.ride_offers add column if not exists captain_id uuid;
alter table if exists public.ride_offers add column if not exists status text not null default 'PENDING';
alter table if exists public.ride_offers add column if not exists eta_minutes integer not null default 5;
alter table if exists public.ride_offers add column if not exists updated_at timestamptz not null default now();

drop function if exists public.accept_ride_offer(uuid, uuid) cascade;
create or replace function public.accept_ride_offer(
  p_request_id uuid,
  p_offer_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
  off public.ride_offers%rowtype;
  accepted_fare numeric;
begin
  if p_request_id is null then
    raise exception 'request_id_required';
  end if;

  if p_offer_id is null then
    raise exception 'offer_id_required';
  end if;

  select *
  into req
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'ride_request_not_found';
  end if;

  if req.rider_id <> auth.uid() then
    raise exception 'not_request_owner';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('PENDING', 'RECEIVING_OFFERS') then
    raise exception 'ride_request_not_accepting_offers';
  end if;

  select *
  into off
  from public.ride_offers
  where id = p_offer_id
    and request_id = p_request_id
  for update;

  if not found then
    raise exception 'ride_offer_not_found';
  end if;

  if off.captain_id is null then
    raise exception 'ride_offer_missing_captain';
  end if;

  if upper(coalesce(off.status::text, 'PENDING')) not in ('PENDING', '') then
    raise exception 'ride_offer_not_pending';
  end if;

  accepted_fare := coalesce(off.offer_price, off.offered_fare, req.server_estimated_fare, 0);

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'ACCEPTED',
      accepted_offer_id = p_offer_id,
      accepted_captain_id = off.captain_id,
      final_fare = accepted_fare,
      updated_at = now()
  where id = p_request_id;

  update public.ride_offers
  set status = 'ACCEPTED',
      updated_at = now()
  where id = p_offer_id;

  update public.ride_offers
  set status = 'REJECTED',
      updated_at = now()
  where request_id = p_request_id
    and id <> p_offer_id
    and upper(coalesce(status::text, 'PENDING')) = 'PENDING';

  return jsonb_build_object(
    'request_id', p_request_id,
    'offer_id', p_offer_id,
    'captain_id', off.captain_id,
    'final_fare', accepted_fare,
    'status', 'ACCEPTED'
  );
end;
$$;

grant execute on function public.accept_ride_offer(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
