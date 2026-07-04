-- RLS hardening applied to the live Supabase project on 2026-07-04.
-- Keep this file as the reproducible record until a formal migrations folder exists.

alter table public.profiles enable row level security;
alter table public.ride_requests enable row level security;
alter table public.ride_offers enable row level security;
alter table public.captain_locations enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.countries enable row level security;
alter table public.governorates enable row level security;
alter table public.districts enable row level security;

revoke all privileges on table public.countries from anon, authenticated;
revoke all privileges on table public.governorates from anon, authenticated;
revoke all privileges on table public.districts from anon, authenticated;
grant select on table public.countries to anon, authenticated;
grant select on table public.governorates to anon, authenticated;
grant select on table public.districts to anon, authenticated;

drop policy if exists countries_public_read on public.countries;
drop policy if exists governorates_public_read on public.governorates;
drop policy if exists districts_public_read on public.districts;
create policy countries_public_read on public.countries for select to public using (true);
create policy governorates_public_read on public.governorates for select to public using (true);
create policy districts_public_read on public.districts for select to public using (true);

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists ride_requests_select_own on public.ride_requests;
drop policy if exists ride_requests_insert_own on public.ride_requests;
drop policy if exists ride_requests_update_own on public.ride_requests;
create policy ride_requests_select_own on public.ride_requests for select to authenticated using (rider_id = (select auth.uid()));
create policy ride_requests_insert_own on public.ride_requests for insert to authenticated with check (rider_id = (select auth.uid()));
create policy ride_requests_update_own on public.ride_requests for update to authenticated using (rider_id = (select auth.uid())) with check (rider_id = (select auth.uid()));

drop policy if exists ride_offers_select_related on public.ride_offers;
drop policy if exists ride_offers_insert_own_captain on public.ride_offers;
drop policy if exists ride_offers_update_own_captain on public.ride_offers;
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
create policy ride_offers_insert_own_captain on public.ride_offers for insert to authenticated with check (captain_id = (select auth.uid()));
create policy ride_offers_update_own_captain on public.ride_offers for update to authenticated using (captain_id = (select auth.uid())) with check (captain_id = (select auth.uid()));

drop policy if exists captain_locations_select_fresh_available on public.captain_locations;
drop policy if exists captain_locations_insert_own on public.captain_locations;
drop policy if exists captain_locations_update_own on public.captain_locations;
create policy captain_locations_select_fresh_available on public.captain_locations
for select to authenticated
using (is_available = true and updated_at > now() - interval '60 seconds');
create policy captain_locations_insert_own on public.captain_locations for insert to authenticated with check (captain_id = (select auth.uid()));
create policy captain_locations_update_own on public.captain_locations for update to authenticated using (captain_id = (select auth.uid())) with check (captain_id = (select auth.uid()));

drop policy if exists ad_campaigns_public_active_read on public.ad_campaigns;
drop policy if exists ad_campaigns_select_own_or_active on public.ad_campaigns;
drop policy if exists ad_campaigns_insert_own on public.ad_campaigns;
drop policy if exists ad_campaigns_update_own on public.ad_campaigns;
create policy ad_campaigns_public_active_read on public.ad_campaigns for select to public using (status = 'ACTIVE');
create policy ad_campaigns_select_own_or_active on public.ad_campaigns for select to authenticated using (advertiser_id = (select auth.uid()) or status = 'ACTIVE');
create policy ad_campaigns_insert_own on public.ad_campaigns for insert to authenticated with check (advertiser_id = (select auth.uid()));
create policy ad_campaigns_update_own on public.ad_campaigns for update to authenticated using (advertiser_id = (select auth.uid())) with check (advertiser_id = (select auth.uid()));
