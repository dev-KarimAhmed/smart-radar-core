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

-- إنشاء سلة تخزين إعلانات الكباتن الترويجية (Public Storage Bucket)
insert into storage.buckets (id, name, public)
values ('captain-ads', 'captain-ads', true)
on conflict (id) do update set public = true;

-- سياسة القراءة العامة لجميع الصور في سلة captain-ads
drop policy if exists captain_ads_storage_select_public on storage.objects;
create policy captain_ads_storage_select_public
  on storage.objects for select
  to public
  using (bucket_id = 'captain-ads');

-- سياسة الرفع للمستخدمين المسجلين
drop policy if exists captain_ads_storage_insert_authenticated on storage.objects;
create policy captain_ads_storage_insert_authenticated
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'captain-ads');

-- سياسة الحذف لصاحب الصورة فقط
drop policy if exists captain_ads_storage_delete_own on storage.objects;
create policy captain_ads_storage_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'captain-ads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

