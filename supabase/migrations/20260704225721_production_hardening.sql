-- Unified production hardening migration for Rider Dashboard.
-- Project ref: shjbchvmwrtfmtrdwlum
-- Generated locally from frontend schema usage: profiles.id and wallet_*.profile_id.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Core schema compatibility
-- -----------------------------------------------------------------------------

alter table if exists public.countries add column if not exists base_fare numeric default 1;
alter table if exists public.countries add column if not exists tariff_per_km numeric default 0.35;
alter table if exists public.countries add column if not exists tariff_per_min numeric default 0;
alter table if exists public.countries add column if not exists tortuosity_factor numeric default 1.3;
alter table if exists public.countries add column if not exists currency_en text;
alter table if exists public.countries add column if not exists currency_ar text;

create table if not exists public.wallet_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  balance numeric not null default 0 check (balance >= 0),
  paid_minutes_remaining numeric not null default 0 check (paid_minutes_remaining >= 0),
  bonus_minutes_remaining numeric not null default 0 check (bonus_minutes_remaining >= 0),
  active_package_name text,
  currency_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_accounts add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
alter table public.wallet_accounts add column if not exists balance numeric not null default 0 check (balance >= 0);
alter table public.wallet_accounts add column if not exists paid_minutes_remaining numeric not null default 0 check (paid_minutes_remaining >= 0);
alter table public.wallet_accounts add column if not exists bonus_minutes_remaining numeric not null default 0 check (bonus_minutes_remaining >= 0);
alter table public.wallet_accounts add column if not exists active_package_name text;
alter table public.wallet_accounts add column if not exists currency_code text;
alter table public.wallet_accounts add column if not exists created_at timestamptz not null default now();
alter table public.wallet_accounts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount numeric not null,
  currency_code text,
  currency_ar text,
  status text not null default 'PENDING',
  description text,
  description_ar text,
  payment_channel text,
  receipt_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_transactions add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
alter table public.wallet_transactions add column if not exists type text;
alter table public.wallet_transactions add column if not exists amount numeric not null default 0;
alter table public.wallet_transactions add column if not exists currency_code text;
alter table public.wallet_transactions add column if not exists currency_ar text;
alter table public.wallet_transactions add column if not exists status text not null default 'PENDING';
alter table public.wallet_transactions add column if not exists description text;
alter table public.wallet_transactions add column if not exists description_ar text;
alter table public.wallet_transactions add column if not exists payment_channel text;
alter table public.wallet_transactions add column if not exists receipt_path text;
alter table public.wallet_transactions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.wallet_transactions add column if not exists created_at timestamptz not null default now();
alter table public.wallet_transactions add column if not exists updated_at timestamptz not null default now();

create table if not exists public.wallet_vouchers (
  code text primary key,
  status text not null default 'UNUSED',
  minutes_value integer not null default 0,
  redeemed_by uuid references public.profiles(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trips_72h_ledger (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  captain_id uuid references public.profiles(id) on delete set null,
  final_fare numeric not null default 0,
  status text not null default 'COMPLETED',
  completed_at timestamptz not null default now(),
  purge_at timestamptz not null default (now() + interval '72 hours'),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.trips_72h_ledger add column if not exists request_id uuid;
alter table public.trips_72h_ledger add column if not exists rider_id uuid references public.profiles(id) on delete cascade;
alter table public.trips_72h_ledger add column if not exists captain_id uuid references public.profiles(id) on delete set null;
alter table public.trips_72h_ledger add column if not exists final_fare numeric not null default 0;
alter table public.trips_72h_ledger add column if not exists status text not null default 'COMPLETED';
alter table public.trips_72h_ledger add column if not exists completed_at timestamptz not null default now();
alter table public.trips_72h_ledger add column if not exists purge_at timestamptz not null default (now() + interval '72 hours');
alter table public.trips_72h_ledger add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.rider_ratings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  captain_id uuid not null references public.profiles(id) on delete cascade,
  rating_value integer not null check (rating_value between 1 and 5),
  created_at timestamptz not null default now(),
  unique (request_id, rider_id)
);

create table if not exists public.captain_locations (
  captain_id uuid primary key references public.profiles(id) on delete cascade,
  location_lat numeric not null,
  location_lng numeric not null,
  h3_cell text not null,
  country_id integer,
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.profiles(id) on delete cascade,
  origin_lat numeric not null,
  origin_lng numeric not null,
  destination_lat numeric not null,
  destination_lng numeric not null,
  origin_h3 text not null,
  destination_h3 text not null,
  destination_address_ar text,
  server_estimated_fare numeric not null default 0,
  country_id integer,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.ride_requests add column if not exists rider_id uuid;
alter table if exists public.ride_requests add column if not exists origin_lat numeric;
alter table if exists public.ride_requests add column if not exists origin_lng numeric;
alter table if exists public.ride_requests add column if not exists destination_lat numeric;
alter table if exists public.ride_requests add column if not exists destination_lng numeric;
alter table if exists public.ride_requests add column if not exists origin_h3 text;
alter table if exists public.ride_requests add column if not exists destination_h3 text;
alter table if exists public.ride_requests add column if not exists destination_address_ar text;
alter table if exists public.ride_requests add column if not exists server_estimated_fare numeric default 0;
alter table if exists public.ride_requests add column if not exists country_id integer;
alter table if exists public.ride_requests add column if not exists status text default 'PENDING';
alter table if exists public.ride_requests add column if not exists created_at timestamptz not null default now();
alter table if exists public.ride_requests add column if not exists accepted_offer_id uuid;
alter table if exists public.ride_requests add column if not exists accepted_captain_id uuid;
alter table if exists public.ride_requests add column if not exists final_fare numeric;
alter table if exists public.ride_requests add column if not exists completed_at timestamptz;
alter table if exists public.ride_requests add column if not exists cancelled_at timestamptz;
alter table if exists public.ride_requests add column if not exists updated_at timestamptz not null default now();

alter table if exists public.ride_offers add column if not exists status text not null default 'PENDING';
alter table if exists public.ride_offers add column if not exists offer_price numeric;
alter table if exists public.ride_offers add column if not exists captain_id uuid;
alter table if exists public.ride_offers add column if not exists updated_at timestamptz not null default now();

alter table if exists public.profiles add column if not exists trust_score numeric not null default 5;
alter table if exists public.profiles add column if not exists rating_sum numeric not null default 0;
alter table if exists public.profiles add column if not exists rating_count integer not null default 0;
alter table if exists public.profiles add column if not exists rating numeric not null default 5;
alter table if exists public.profiles add column if not exists vehicle_plate text;
alter table if exists public.profiles add column if not exists vehicle_make text;
alter table if exists public.profiles add column if not exists vehicle_color text;
alter table if exists public.profiles add column if not exists vehicle_year text;
alter table if exists public.profiles add column if not exists emergency_whatsapp_contact text;
alter table if exists public.profiles add column if not exists updated_at timestamptz not null default now();

alter table if exists public.ad_campaigns add column if not exists impressions_count bigint not null default 0;
alter table if exists public.ad_campaigns add column if not exists clicks_count bigint not null default 0;
alter table if exists public.ad_campaigns add column if not exists swipes_count bigint not null default 0;

create table if not exists public.ad_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  ad_id text not null,
  saved_at timestamptz not null default now(),
  primary key (profile_id, ad_id)
);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Drop all function signatures before recreation to avoid 42P13 return collisions
-- -----------------------------------------------------------------------------

drop function if exists public.calculate_server_fare(numeric, numeric, numeric, numeric) cascade;
drop function if exists public.calculate_server_fare(double precision, double precision, double precision, double precision) cascade;
drop function if exists public.calculate_server_fare(numeric, numeric, numeric, numeric, integer) cascade;
drop function if exists public.accept_ride_offer(uuid, uuid) cascade;
drop function if exists public.cancel_ride_request(uuid) cascade;
drop function if exists public.complete_ride_trip(uuid) cascade;
drop function if exists public.guard_ride_request_status_update() cascade;
drop function if exists public.submit_ride_rating(uuid, uuid, integer) cascade;
drop function if exists public.pulse_captain_location(numeric, numeric, text) cascade;
drop function if exists public.flush_ad_campaign_metrics(jsonb) cascade;
drop function if exists public.redeem_voucher_code(text) cascade;
drop function if exists public.delegate_charge_captain(uuid, numeric, text) cascade;

-- -----------------------------------------------------------------------------
-- Server fare authority
-- -----------------------------------------------------------------------------

create or replace function public.calculate_server_fare(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric,
  p_country_id integer
) returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cfg jsonb;
  earth_radius_km constant numeric := 6371;
  dlat numeric := radians(lat2 - lat1);
  dlng numeric := radians(lng2 - lng1);
  a numeric;
  straight_km numeric;
  factor numeric;
  base_fare numeric;
  per_km numeric;
  per_min numeric;
  min_fare numeric;
  estimated_minutes numeric;
begin
  if p_country_id is null then
    raise exception 'country_id_required';
  end if;

  select to_jsonb(c) into cfg
  from public.countries c
  where c.id = p_country_id;

  if cfg is null then
    raise exception 'country_not_found';
  end if;

  a := power(sin(dlat / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(dlng / 2), 2);
  straight_km := 2 * earth_radius_km * atan2(sqrt(a), sqrt(greatest(0, 1 - a)));

  factor := coalesce(nullif(cfg->>'tortuosity_factor', '')::numeric, nullif(cfg->>'road_factor', '')::numeric, 1.3);
  base_fare := coalesce(nullif(cfg->>'base_fare', '')::numeric, 1);
  per_km := coalesce(nullif(cfg->>'per_km_rate', '')::numeric, nullif(cfg->>'tariff_per_km', '')::numeric, nullif(cfg->>'km_rate', '')::numeric, 0.35);
  per_min := coalesce(nullif(cfg->>'tariff_per_min', '')::numeric, 0);
  min_fare := coalesce(nullif(cfg->>'min_fare', '')::numeric, base_fare);
  estimated_minutes := greatest(1, straight_km * factor * 2.2);

  return round(greatest(min_fare, base_fare, base_fare + (straight_km * factor * per_km) + (estimated_minutes * per_min)), 2);
end;
$$;

-- -----------------------------------------------------------------------------
-- Marketplace RPCs and protected ride status transitions
-- -----------------------------------------------------------------------------

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
  select * into req from public.ride_requests where id = p_request_id for update;
  if not found then raise exception 'ride_request_not_found'; end if;
  if req.rider_id <> auth.uid() then raise exception 'not_request_owner'; end if;
  if upper(coalesce(req.status::text, '')) not in ('PENDING', 'RECEIVING_OFFERS') then
    raise exception 'ride_request_not_accepting_offers';
  end if;

  select * into off from public.ride_offers where id = p_offer_id and request_id = p_request_id for update;
  if not found then raise exception 'ride_offer_not_found'; end if;

  accepted_fare := coalesce(off.offer_price, req.server_estimated_fare, 0);
  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'ACCEPTED',
      accepted_offer_id = p_offer_id,
      accepted_captain_id = off.captain_id,
      final_fare = accepted_fare,
      updated_at = now()
  where id = p_request_id;

  update public.ride_offers
  set status = case when id = p_offer_id then 'ACCEPTED' else 'REJECTED' end,
      updated_at = now()
  where request_id = p_request_id;

  return jsonb_build_object(
    'request_id', p_request_id,
    'offer_id', p_offer_id,
    'captain_id', off.captain_id,
    'final_fare', accepted_fare,
    'status', 'ACCEPTED'
  );
end;
$$;

create or replace function public.cancel_ride_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
begin
  select * into req from public.ride_requests where id = p_request_id for update;
  if not found then raise exception 'ride_request_not_found'; end if;
  if req.rider_id <> auth.uid() then raise exception 'not_request_owner'; end if;
  if upper(coalesce(req.status::text, '')) in ('COMPLETED', 'CANCELLED') then
    raise exception 'ride_request_closed';
  end if;

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'CANCELLED', cancelled_at = now(), updated_at = now()
  where id = p_request_id;

  update public.ride_offers
  set status = 'REJECTED', updated_at = now()
  where request_id = p_request_id and status <> 'ACCEPTED';

  return jsonb_build_object('request_id', p_request_id, 'status', 'CANCELLED');
end;
$$;

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
  select * into req from public.ride_requests where id = p_request_id for update;
  if not found then raise exception 'ride_request_not_found'; end if;

  if req.rider_id <> auth.uid()
    and coalesce(req.accepted_captain_id, '00000000-0000-0000-0000-000000000000'::uuid) <> auth.uid()
  then
    raise exception 'not_trip_participant';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('ACCEPTED', 'TRIP_ACTIVE', 'ACTIVE') then
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

  insert into public.trips_72h_ledger (request_id, rider_id, captain_id, final_fare, status, completed_at, purge_at)
  values (p_request_id, req.rider_id, req.accepted_captain_id, final_amount, 'COMPLETED', now(), now() + interval '72 hours')
  on conflict do nothing;

  return jsonb_build_object('request_id', p_request_id, 'status', 'COMPLETED', 'final_fare', final_amount);
end;
$$;

create or replace function public.guard_ride_request_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status
    and coalesce(current_setting('app.ride_request_status_rpc', true), '') <> 'true'
  then
    raise exception 'ride_request_status_must_use_rpc';
  end if;

  return new;
end;
$$;

create or replace function public.submit_ride_rating(
  p_request_id uuid,
  p_captain_id uuid,
  p_rating_value integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
  new_trust_score numeric;
  rating_total numeric;
  rating_rows integer;
begin
  if p_rating_value < 1 or p_rating_value > 5 then
    raise exception 'invalid_rating_value';
  end if;

  select * into req from public.ride_requests where id = p_request_id for update;
  if not found then raise exception 'ride_request_not_found'; end if;
  if req.rider_id <> auth.uid() then raise exception 'not_request_owner'; end if;
  if upper(coalesce(req.status::text, '')) <> 'COMPLETED' then raise exception 'ride_request_not_completed'; end if;
  if req.accepted_captain_id is distinct from p_captain_id then raise exception 'captain_mismatch'; end if;

  insert into public.rider_ratings (request_id, rider_id, captain_id, rating_value)
  values (p_request_id, req.rider_id, p_captain_id, p_rating_value)
  on conflict (request_id, rider_id)
  do update set rating_value = excluded.rating_value;

  select coalesce(sum(rating_value), 0), count(*)
  into rating_total, rating_rows
  from public.rider_ratings
  where captain_id = p_captain_id;

  new_trust_score := round((rating_total / greatest(rating_rows, 1))::numeric, 2);

  update public.profiles
  set trust_score = coalesce(new_trust_score, 5),
      rating = coalesce(new_trust_score, 5),
      rating_sum = rating_total,
      rating_count = rating_rows,
      updated_at = now()
  where id = p_captain_id;

  return jsonb_build_object(
    'request_id', p_request_id,
    'captain_id', p_captain_id,
    'rating_value', p_rating_value,
    'trust_score', coalesce(new_trust_score, 5)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Driver presence and ad metrics
-- -----------------------------------------------------------------------------

create or replace function public.pulse_captain_location(
  p_lat numeric,
  p_lng numeric,
  p_h3 text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  captain_country_id integer;
begin
  select country_id into captain_country_id from public.profiles where id = auth.uid();

  insert into public.captain_locations (captain_id, location_lat, location_lng, h3_cell, country_id, is_available, updated_at)
  values (auth.uid(), p_lat, p_lng, p_h3, captain_country_id, true, now())
  on conflict (captain_id) do update
    set location_lat = excluded.location_lat,
        location_lng = excluded.location_lng,
        h3_cell = excluded.h3_cell,
        country_id = excluded.country_id,
        is_available = true,
        updated_at = now();

  return jsonb_build_object('captain_id', auth.uid(), 'h3_cell', p_h3, 'updated_at', now());
end;
$$;

create or replace function public.flush_ad_campaign_metrics(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row jsonb;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'events_must_be_array';
  end if;

  for event_row in select * from jsonb_array_elements(p_events)
  loop
    update public.ad_campaigns
    set impressions_count = impressions_count + case when event_row->>'event_type' = 'impression' then 1 else 0 end,
        clicks_count = clicks_count + case when event_row->>'event_type' = 'click' then 1 else 0 end,
        swipes_count = swipes_count + case when event_row->>'event_type' = 'swipe' then 1 else 0 end
    where id::text = nullif(event_row->>'ad_id', '');
  end loop;

  return jsonb_build_object('accepted', jsonb_array_length(p_events));
end;
$$;

-- -----------------------------------------------------------------------------
-- Wallet routines: all financial mutations stay server-side
-- -----------------------------------------------------------------------------

create or replace function public.redeem_voucher_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  voucher public.wallet_vouchers%rowtype;
begin
  select * into voucher from public.wallet_vouchers where code = upper(trim(p_code)) for update;
  if not found then raise exception 'voucher_not_found'; end if;
  if voucher.status <> 'UNUSED' then raise exception 'voucher_already_used'; end if;

  insert into public.wallet_accounts (profile_id, paid_minutes_remaining)
  values (auth.uid(), voucher.minutes_value)
  on conflict (profile_id) do update
    set paid_minutes_remaining = public.wallet_accounts.paid_minutes_remaining + voucher.minutes_value,
        updated_at = now();

  insert into public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
  values (auth.uid(), 'voucher', voucher.minutes_value, 'COMPLETED', 'تم تفعيل كود الشحن.', jsonb_build_object('voucher_code', voucher.code));

  update public.wallet_vouchers
  set status = 'REDEEMED', redeemed_by = auth.uid(), redeemed_at = now()
  where code = voucher.code;

  return jsonb_build_object('code', voucher.code, 'minutes_added', voucher.minutes_value, 'status', 'REDEEMED');
end;
$$;

create or replace function public.delegate_charge_captain(
  p_captain_id uuid,
  p_amount numeric,
  p_description text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;

  insert into public.wallet_accounts (profile_id, balance)
  values (p_captain_id, p_amount)
  on conflict (profile_id) do update
    set balance = public.wallet_accounts.balance + p_amount,
        updated_at = now();

  insert into public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
  values (
    p_captain_id,
    'delegate_charge',
    p_amount,
    'COMPLETED',
    coalesce(p_description, 'تم شحن الرصيد عن طريق المندوب.'),
    jsonb_build_object('delegate_id', auth.uid())
  );

  return jsonb_build_object('captain_id', p_captain_id, 'amount', p_amount, 'status', 'COMPLETED');
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

drop trigger if exists ride_requests_status_rpc_guard on public.ride_requests;
create trigger ride_requests_status_rpc_guard
before update of status on public.ride_requests
for each row execute function public.guard_ride_request_status_update();

-- -----------------------------------------------------------------------------
-- RLS and grants
-- -----------------------------------------------------------------------------

alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.wallet_vouchers enable row level security;
alter table public.trips_72h_ledger enable row level security;
alter table public.rider_ratings enable row level security;
alter table public.captain_locations enable row level security;
alter table if exists public.ride_requests enable row level security;
alter table if exists public.ride_offers enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'wallet_accounts',
    'wallet_transactions',
    'wallet_vouchers',
    'trips_72h_ledger',
    'countries',
    'governorates',
    'districts'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('revoke truncate, update, delete on table public.%I from anon, authenticated', table_name);
    end if;
  end loop;
end;
$$;

revoke update on public.ride_requests from anon, authenticated;

grant select on public.wallet_accounts to authenticated;
grant select, insert on public.wallet_transactions to authenticated;
grant select, insert on public.trips_72h_ledger to authenticated;
grant select on public.captain_locations to authenticated;
grant select, insert on public.ride_requests to authenticated;
grant select on public.ride_offers to authenticated;
grant select, insert, delete on public.ad_favorites to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['countries', 'governorates', 'districts']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('grant select on table public.%I to anon, authenticated', table_name);
    end if;
  end loop;
end;
$$;

grant execute on function public.calculate_server_fare(numeric, numeric, numeric, numeric, integer) to anon, authenticated;
grant execute on function public.accept_ride_offer(uuid, uuid) to authenticated;
grant execute on function public.cancel_ride_request(uuid) to authenticated;
grant execute on function public.complete_ride_trip(uuid) to authenticated;
grant execute on function public.submit_ride_rating(uuid, uuid, integer) to authenticated;
grant execute on function public.pulse_captain_location(numeric, numeric, text) to authenticated;
grant execute on function public.flush_ad_campaign_metrics(jsonb) to anon, authenticated;
grant execute on function public.redeem_voucher_code(text) to authenticated;
grant execute on function public.delegate_charge_captain(uuid, numeric, text) to authenticated;

-- Wallet policies

drop policy if exists wallet_accounts_select_own on public.wallet_accounts;
create policy wallet_accounts_select_own on public.wallet_accounts
for select to authenticated
using (profile_id = (select auth.uid()));

drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own on public.wallet_transactions
for select to authenticated
using (profile_id = (select auth.uid()));

drop policy if exists wallet_transactions_insert_pending_own on public.wallet_transactions;
create policy wallet_transactions_insert_pending_own on public.wallet_transactions
for insert to authenticated
with check (profile_id = (select auth.uid()) and upper(coalesce(status, '')) = 'PENDING');

-- 72-hour ledger policies

drop policy if exists trips_72h_ledger_select_own on public.trips_72h_ledger;
create policy trips_72h_ledger_select_own on public.trips_72h_ledger
for select to authenticated
using (rider_id = (select auth.uid()));

drop policy if exists trips_72h_ledger_insert_own on public.trips_72h_ledger;
create policy trips_72h_ledger_insert_own on public.trips_72h_ledger
for insert to authenticated
with check (rider_id = (select auth.uid()));

-- Favorite ad policies

alter table public.ad_favorites enable row level security;

drop policy if exists ad_favorites_select_own on public.ad_favorites;
create policy ad_favorites_select_own on public.ad_favorites
for select to authenticated
using (profile_id = (select auth.uid()));

drop policy if exists ad_favorites_insert_own on public.ad_favorites;
create policy ad_favorites_insert_own on public.ad_favorites
for insert to authenticated
with check (profile_id = (select auth.uid()));

drop policy if exists ad_favorites_delete_own on public.ad_favorites;
create policy ad_favorites_delete_own on public.ad_favorites
for delete to authenticated
using (profile_id = (select auth.uid()));

-- Ratings policies

drop policy if exists rider_ratings_select_own on public.rider_ratings;
create policy rider_ratings_select_own on public.rider_ratings
for select to authenticated
using (rider_id = (select auth.uid()) or captain_id = (select auth.uid()));

drop policy if exists rider_ratings_insert_own on public.rider_ratings;
create policy rider_ratings_insert_own on public.rider_ratings
for insert to authenticated
with check (rider_id = (select auth.uid()));

-- Ride request policies: insert/select own only. Status updates are RPC-only.

drop policy if exists ride_requests_select_own on public.ride_requests;
create policy ride_requests_select_own on public.ride_requests
for select to authenticated
using (rider_id = (select auth.uid()) or accepted_captain_id = (select auth.uid()));

drop policy if exists ride_requests_insert_own_pending on public.ride_requests;
create policy ride_requests_insert_own_pending on public.ride_requests
for insert to authenticated
with check (rider_id = (select auth.uid()) and upper(coalesce(status::text, '')) = 'PENDING');

drop policy if exists ride_offers_select_related on public.ride_offers;
create policy ride_offers_select_related on public.ride_offers
for select to authenticated
using (
  captain_id = (select auth.uid())
  or exists (
    select 1
    from public.ride_requests rr
    where rr.id = ride_offers.request_id
      and rr.rider_id = (select auth.uid())
  )
);

-- Captain presence policies

drop policy if exists captain_locations_select_available_recent on public.captain_locations;
create policy captain_locations_select_available_recent on public.captain_locations
for select to authenticated
using (is_available = true and updated_at > now() - interval '60 seconds');

-- Storage receipt policies

drop policy if exists receipts_upload_own on storage.objects;
create policy receipts_upload_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists receipts_read_own on storage.objects;
create policy receipts_read_own on storage.objects
for select to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
