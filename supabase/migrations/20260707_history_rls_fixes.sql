-- SQL migration to fix RLS and foreign key constraints for trip history
-- Project ref: shjbchvmwrtfmtrdwlum

begin;

-- 1. Add missing foreign key constraint to ride_requests.accepted_captain_id
alter table if exists public.ride_requests
  drop constraint if exists ride_requests_accepted_captain_id_fkey,
  add constraint ride_requests_accepted_captain_id_fkey 
    foreign key (accepted_captain_id) 
    references public.profiles(id) 
    on delete set null;

-- 2. Update RLS select policy for trips_72h_ledger to allow captains to select their own records
drop policy if exists trips_72h_ledger_select_own on public.trips_72h_ledger;
create policy trips_72h_ledger_select_own on public.trips_72h_ledger
for select to authenticated
using (
  rider_id = auth.uid()
  or captain_id = auth.uid()
);

commit;

-- Notify postgrest to reload the schema cache so it recognizes the new foreign key instantly
notify pgrst, 'reload schema';
