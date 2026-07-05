-- Fix Supabase Auth -> profiles trigger role normalization.
-- Live schema uses public.user_role = RIDER, CAPTAIN, ADVERTISER, DELEGATE, ADMIN.
-- Frontend historically used DRIVER, so normalize DRIVER/CAPTAIN to CAPTAIN.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := upper(coalesce(new.raw_user_meta_data->>'role', 'RIDER'));
  profile_role public.user_role;
  requested_country_id integer := nullif(new.raw_user_meta_data->>'country_id', '')::integer;
  requested_governorate_id integer := nullif(new.raw_user_meta_data->>'governorate_id', '')::integer;
  requested_district_id integer := nullif(new.raw_user_meta_data->>'district_id', '')::integer;
  final_country_id integer;
  final_governorate_id integer;
  final_district_id integer;
begin
  profile_role := case
    when requested_role in ('DRIVER', 'CAPTAIN') then 'CAPTAIN'::public.user_role
    when requested_role = 'ADVERTISER' then 'ADVERTISER'::public.user_role
    when requested_role = 'DELEGATE' then 'DELEGATE'::public.user_role
    when requested_role = 'ADMIN' then 'ADMIN'::public.user_role
    else 'RIDER'::public.user_role
  end;

  select c.id
  into final_country_id
  from public.countries c
  where c.id = requested_country_id
  limit 1;

  if final_country_id is null then
    select c.id
    into final_country_id
    from public.countries c
    order by case when upper(coalesce(c.country_code, '')) = 'JO' then 0 else 1 end, c.id
    limit 1;
  end if;

  select g.id
  into final_governorate_id
  from public.governorates g
  where g.id = requested_governorate_id
    and (g.country_id = final_country_id or g.country_id is null)
  limit 1;

  if final_governorate_id is null then
    select g.id
    into final_governorate_id
    from public.governorates g
    where g.country_id = final_country_id or g.country_id is null
    order by g.id
    limit 1;
  end if;

  select d.id
  into final_district_id
  from public.districts d
  where d.id = requested_district_id
    and d.governorate_id = final_governorate_id
  limit 1;

  if final_district_id is null then
    select d.id
    into final_district_id
    from public.districts d
    where d.governorate_id = final_governorate_id
    order by d.id
    limit 1;
  end if;

  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    country_id,
    governorate_id,
    district_id
  )
  values (
    new.id,
    profile_role,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'User'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'phone'), ''), new.phone, '0000000000'),
    final_country_id,
    final_governorate_id,
    final_district_id
  )
  on conflict (id) do update
  set role = excluded.role,
      full_name = excluded.full_name,
      phone = excluded.phone,
      country_id = excluded.country_id,
      governorate_id = excluded.governorate_id,
      district_id = excluded.district_id,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
