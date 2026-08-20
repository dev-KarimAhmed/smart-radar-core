-- public.ride_offers was never added to the supabase_realtime publication
-- (only profiles, wallet_accounts, and ride_requests were — see
-- 20260814_captain_status_activation.sql, 20260814_captain_wallet_phase2.sql,
-- 20260815_ride_requests_realtime.sql). This means subscribeToRideOffers'
-- postgres_changes listener (rider-server-marketplace.ts) never received an
-- INSERT event for a new captain offer — the rider only ever saw offers that
-- existed at the moment their RECEIVING_OFFERS screen first mounted. Any
-- offer submitted after that point was silently invisible to them, with no
-- error anywhere, regardless of the offer's wait_seconds countdown.

begin;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'ride_offers'
    )
  then
    alter publication supabase_realtime add table public.ride_offers;
  end if;
end;
$$;

commit;
