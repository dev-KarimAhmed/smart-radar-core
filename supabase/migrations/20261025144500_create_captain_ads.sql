-- جدول إعلانات ومقاعد الكابتن الترويجية (Captain In-Ride Ad Seats)
-- يتيح للناقلين رفع وحفظ إعلاناتهم الترويجية لتظهر لكافة الركاب الذين يقبلون عروض الكابتن

create table if not exists public.captain_ads (
  id uuid primary key default gen_random_uuid(),
  captain_id uuid not null references public.profiles(id) on delete cascade,
  seat_number integer not null check (seat_number >= 1 and seat_number <= 10),
  seat_label text,
  image_url text not null,
  caption text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_captain_seat unique (captain_id, seat_number)
);

create index if not exists idx_captain_ads_captain_id on public.captain_ads(captain_id);
create index if not exists idx_captain_ads_status on public.captain_ads(status);

alter table if exists public.captain_ads enable row level security;

-- السماح لجميع المستخدمين (الركاب والكباتن) بالاستعلام عن إعلانات الكباتن النشطة
drop policy if exists captain_ads_select_all on public.captain_ads;
create policy captain_ads_select_all
  on public.captain_ads
  for select
  to authenticated, anon
  using (true);

-- السماح للكابتن بإدارة إعلاناته الخاصة فقط
drop policy if exists captain_ads_insert_own on public.captain_ads;
create policy captain_ads_insert_own
  on public.captain_ads
  for insert
  to authenticated
  with check (captain_id = (select auth.uid()));

drop policy if exists captain_ads_update_own on public.captain_ads;
create policy captain_ads_update_own
  on public.captain_ads
  for update
  to authenticated
  using (captain_id = (select auth.uid()))
  with check (captain_id = (select auth.uid()));

drop policy if exists captain_ads_delete_own on public.captain_ads;
create policy captain_ads_delete_own
  on public.captain_ads
  for delete
  to authenticated
  using (captain_id = (select auth.uid()));

grant select, insert, update, delete on public.captain_ads to authenticated, service_role, anon;
