-- Only public.profiles and public.wallet_accounts were ever added to the
-- supabase_realtime publication (see 20260814_captain_status_activation.sql
-- and 20260814_captain_wallet_phase2.sql) — ride_requests never was, so no
-- postgres_changes event for it (e.g. a rider cancelling a pending request)
-- ever reached a subscribed captain, regardless of any client-side filter.

begin;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'ride_requests'
    )
  then
    alter publication supabase_realtime add table public.ride_requests;
  end if;
end;
$$;

commit;
