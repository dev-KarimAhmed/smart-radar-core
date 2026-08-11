-- Captain registration contract: profile details are stored separately from auth metadata.
-- Apply this migration before using the multi-step captain registration form.

create table if not exists public.captain_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  vehicle_type text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_color text,
  vehicle_year integer,
  plate_number text,
  employment_type text,
  affiliation_type text,
  office_phone text,
  side_id text,
  identity_url text,
  contact_page_url text,
  verification_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.captain_profiles
  add column if not exists vehicle_brand text,
  add column if not exists vehicle_model text,
  add column if not exists vehicle_year integer,
  add column if not exists plate_number text,
  add column if not exists employment_type text,
  add column if not exists vehicle_color text,
  add column if not exists affiliation_type text,
  add column if not exists office_phone text,
  add column if not exists side_id text,
  add column if not exists identity_url text,
  add column if not exists contact_page_url text,
  add column if not exists driving_license_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.captain_profiles enable row level security;

drop policy if exists captain_profiles_select_authenticated on public.captain_profiles;
create policy captain_profiles_select_authenticated
  on public.captain_profiles
  for select
  to authenticated
  using (true);

drop policy if exists captain_profiles_insert_own on public.captain_profiles;
create policy captain_profiles_insert_own
  on public.captain_profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

drop policy if exists captain_profiles_update_own on public.captain_profiles;
create policy captain_profiles_update_own
  on public.captain_profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, insert, update on public.captain_profiles to authenticated;
