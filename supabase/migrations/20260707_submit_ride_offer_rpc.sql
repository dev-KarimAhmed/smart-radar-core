-- Captain offer submission contract.
-- Apply this after the ride_requests / ride_offers base schema exists.

begin;

alter table if exists public.ride_offers enable row level security;
alter table if exists public.ride_offers add column if not exists offered_fare numeric;
alter table if exists public.ride_offers add column if not exists offer_price numeric;
alter table if exists public.ride_offers add column if not exists captain_id uuid;
alter table if exists public.ride_offers add column if not exists status text not null default 'PENDING';
alter table if exists public.ride_offers add column if not exists eta_minutes integer not null default 5;
alter table if exists public.ride_offers add column if not exists created_at timestamptz not null default now();
alter table if exists public.ride_offers add column if not exists updated_at timestamptz not null default now();

alter table if exists public.ride_offers alter column eta_minutes set default 5;
update public.ride_offers set eta_minutes = 5 where eta_minutes is null;
alter table if exists public.ride_offers alter column eta_minutes set not null;

grant select on public.ride_offers to authenticated;
grant insert on public.ride_offers to authenticated;

drop policy if exists ride_offers_insert_captain_pending on public.ride_offers;
create policy ride_offers_insert_captain_pending
on public.ride_offers
for insert
to authenticated
with check (
  captain_id = (select auth.uid())
  and offered_fare is not null
  and offered_fare > 0
  and coalesce(offer_price, offered_fare) > 0
  and upper(coalesce(status::text, '')) = 'PENDING'
  and exists (
    select 1
    from public.ride_requests rr
    join public.profiles p on p.id = (select auth.uid())
    where rr.id = ride_offers.request_id
      and upper(coalesce(rr.status::text, '')) in ('PENDING', 'RECEIVING_OFFERS')
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and (
        rr.country_id is null
        or p.country_id is null
        or p.country_id = rr.country_id
      )
  )
);

drop function if exists public.submit_ride_offer(uuid, numeric) cascade;
create or replace function public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
  captain_profile public.profiles%rowtype;
  new_offer public.ride_offers%rowtype;
begin
  if p_request_id is null then
    raise exception 'request_id_required';
  end if;

  if p_offer_price is null or p_offer_price <= 0 then
    raise exception 'invalid_offer_price';
  end if;

  select *
  into captain_profile
  from public.profiles
  where id = auth.uid();

  if not found or upper(coalesce(captain_profile.role::text, '')) not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_profile_required';
  end if;

  select *
  into req
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'ride_request_not_found';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('PENDING', 'RECEIVING_OFFERS') then
    raise exception 'ride_request_not_pending';
  end if;

  if req.country_id is not null
    and captain_profile.country_id is not null
    and req.country_id <> captain_profile.country_id
  then
    raise exception 'request_outside_captain_country';
  end if;

  insert into public.ride_offers (
    request_id,
    captain_id,
    offered_fare,
    offer_price,
    eta_minutes,
    status,
    created_at,
    updated_at
  )
  values (
    p_request_id,
    auth.uid(),
    p_offer_price,
    p_offer_price,
    5,
    'PENDING',
    now(),
    now()
  )
  returning * into new_offer;

  return jsonb_build_object(
    'id', new_offer.id,
    'request_id', new_offer.request_id,
    'captain_id', new_offer.captain_id,
    'offer_price', coalesce(new_offer.offer_price, new_offer.offered_fare),
    'eta_minutes', new_offer.eta_minutes,
    'status', new_offer.status
  );
end;
$$;

grant execute on function public.submit_ride_offer(uuid, numeric) to authenticated;

notify pgrst, 'reload schema';

commit;
