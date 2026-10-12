-- Three tables the app subscribes to were never added to the realtime publication.
--
-- Symptom: CHANNEL_ERROR in the browser console for the wallet-transactions channel, and
-- silently dead subscriptions for captain locations and delegate tasks.
--
-- A postgres_changes binding on a table that Postgres is not publishing cannot be honoured,
-- and because a channel fails as a unit, one unpublished table takes down every other
-- binding on the same channel with it.
--
-- Already published (and left alone): profiles, ride_requests, ride_offers, wallet_accounts.

DO $$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE NOTICE 'supabase_realtime publication is missing; nothing to add to.';
    RETURN;
  END IF;

  FOREACH t IN ARRAY ARRAY['wallet_transactions', 'captain_locations', 'delegate_tasks'] LOOP
    -- Skip tables this project does not have; delegate_tasks in particular may not exist.
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      RAISE NOTICE 'public.% does not exist, skipping.', t;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    RAISE NOTICE 'added public.% to supabase_realtime', t;
  END LOOP;
END;
$$;


-- Realtime delivers the OLD row on UPDATE/DELETE only when the table has a replica identity
-- that includes the filtered column. The wallet channels filter on profile_id, and the
-- radar filters on captain_id; with the default replica identity those filters still work
-- for INSERT/UPDATE because the NEW row carries them, so FULL is not forced here — noted so
-- the next person does not assume old-row data is available and finds it empty.


-- Verification: every table the client subscribes to should appear below.
--   SELECT tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
--   ORDER BY tablename;
