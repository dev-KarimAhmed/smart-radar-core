-- Allow rider offer cards to display safe captain profile and vehicle details.
-- Run this if offer cards show the captain id/price but not name, car, plate, or company data.

begin;

alter table if exists public.captain_profiles enable row level security;

grant select on public.profiles to authenticated;
grant select on public.captain_profiles to authenticated;

drop policy if exists captain_profiles_select_authenticated on public.captain_profiles;
create policy captain_profiles_select_authenticated
on public.captain_profiles
for select
to authenticated
using (true);

notify pgrst, 'reload schema';

commit;
