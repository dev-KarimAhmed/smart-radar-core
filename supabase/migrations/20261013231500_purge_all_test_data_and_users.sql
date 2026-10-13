-- Migration: 20261013231500_purge_all_test_data_and_users.sql
-- Description: Complete clean-slate purge of test users, profiles, and operational data while preserving seed tables (countries, governorates, districts, app_flags).

-- 1. Drop immutable triggers on wallet_transactions temporarily
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'wallet_transactions'
          AND (trigger_name ILIKE '%immutable%' OR trigger_name ILIKE '%prevent%' OR trigger_name ILIKE '%protect%')
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.wallet_transactions CASCADE;';
    END LOOP;
END $$;

-- 2. Truncate all operational, ledger, and profile tables
TRUNCATE TABLE public.ride_offers CASCADE;
TRUNCATE TABLE public.ride_requests CASCADE;
TRUNCATE TABLE public.trips_72h_ledger CASCADE;
TRUNCATE TABLE public.captain_locations CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.user_blocks CASCADE;
TRUNCATE TABLE public.rider_favorite_captains CASCADE;
TRUNCATE TABLE public.user_notifications CASCADE;
TRUNCATE TABLE public.password_reset_requests CASCADE;
TRUNCATE TABLE public.password_reset_audit CASCADE;
TRUNCATE TABLE public.wallet_transactions CASCADE;
TRUNCATE TABLE public.wallet_vouchers CASCADE;
TRUNCATE TABLE public.wallet_accounts CASCADE;
TRUNCATE TABLE public.rider_ratings CASCADE;
TRUNCATE TABLE public.ad_favorites CASCADE;
TRUNCATE TABLE public.captain_profiles CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 3. Delete all auth users (cascades to identities, sessions, refresh tokens, mfa, etc.)
DELETE FROM auth.users;

-- 4. Recreate the immutability trigger on wallet_transactions
CREATE OR REPLACE FUNCTION public.check_wallet_transactions_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END IF;
        RAISE EXCEPTION 'wallet_transactions_are_immutable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_wallet_transactions_immutable ON public.wallet_transactions;
CREATE TRIGGER tr_wallet_transactions_immutable
BEFORE UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.check_wallet_transactions_immutable();
