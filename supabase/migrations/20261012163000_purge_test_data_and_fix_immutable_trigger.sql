-- Purge all test data and allow service_role cleanup on wallet_transactions

-- 1. Drop existing immutable triggers on wallet_transactions
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

-- 2. Drop specific functions if they exist
DROP FUNCTION IF EXISTS public.wallet_transactions_immutable() CASCADE;
DROP FUNCTION IF EXISTS public.check_wallet_transactions_immutable() CASCADE;

-- 3. Truncate operational test data cleanly while leaving seed tables (countries, governorates, districts, app_flags) intact
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

-- 4. Recreate the immutability trigger with service_role / superuser maintenance bypass
CREATE OR REPLACE FUNCTION public.check_wallet_transactions_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        -- Allow maintenance by postgres, supabase_admin, service_role
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

CREATE TRIGGER tr_wallet_transactions_immutable
BEFORE UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.check_wallet_transactions_immutable();
