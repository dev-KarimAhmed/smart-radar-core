-- Fix for Supabase Auth signup error:
-- relation "profile_serial_seq" does not exist
--
-- Run this in Supabase Dashboard > SQL Editor.

create sequence if not exists public.profile_serial_seq
  as bigint
  increment by 1
  minvalue 1
  start with 1001
  cache 1;

-- Keep the next value ahead of any existing profile serials such as P-1001.
select setval(
  'public.profile_serial_seq',
  greatest(
    1000,
    coalesce(
      (
        select max((regexp_match(serial_id, '[0-9]+$'))[1]::bigint)
        from public.profiles
        where serial_id ~ '[0-9]+$'
      ),
      1000
    )
  ),
  true
);

grant usage, select on sequence public.profile_serial_seq to anon;
grant usage, select on sequence public.profile_serial_seq to authenticated;
grant usage, select on sequence public.profile_serial_seq to service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage, select on sequence public.profile_serial_seq to supabase_auth_admin;
  end if;
end $$;

-- Quick sanity check.
select
  'profile_serial_seq ready' as status,
  last_value,
  is_called
from public.profile_serial_seq;
