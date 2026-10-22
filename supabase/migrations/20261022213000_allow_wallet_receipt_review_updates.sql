-- Migration: 20261022213000_allow_wallet_receipt_review_updates.sql
-- Description: Fix wallet_transactions immutability trigger to only block DELETEs (allowing status updates),
--              provide atomic RPC functions for receipt approval and rejection, and enable realtime on wallet_transactions.

-- ==============================================================================
-- 1. UPDATE IMMUTABILITY TRIGGER TO PERMIT UPDATES & ONLY FORBID DELETIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_wallet_transactions_immutable()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent deletion to protect the financial ledger history
    IF TG_OP = 'DELETE' THEN
        IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
            RETURN OLD;
        END IF;
        RAISE EXCEPTION 'wallet_transactions_are_immutable';
    END IF;

    -- Allow legitimate updates (status transitions PENDING -> COMPLETED / REJECTED, metadata, etc.)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger to UPDATE and DELETE
DROP TRIGGER IF EXISTS tr_wallet_transactions_immutable ON public.wallet_transactions;
CREATE TRIGGER tr_wallet_transactions_immutable
BEFORE UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.check_wallet_transactions_immutable();

-- ==============================================================================
-- 2. ATOMIC RPC FUNCTION: APPROVE WALLET RECEIPT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.approve_wallet_receipt(
    p_transaction_id uuid,
    p_credit_type text DEFAULT 'CASH',
    p_minutes integer DEFAULT 0,
    p_admin_id uuid DEFAULT NULL,
    p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx record;
    v_prof record;
    v_wallet record;
    v_is_egypt boolean := false;
    v_currency_ar text;
    v_currency_code text;
    v_amount numeric;
    v_minutes_to_grant integer;
    v_new_balance numeric;
    v_new_minutes integer;
    v_expiry timestamptz;
BEGIN
    -- 1. Lock and fetch transaction
    SELECT * INTO v_tx
    FROM public.wallet_transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_not_found');
    END IF;

    IF v_tx.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_already_approved');
    END IF;

    v_amount := coalesce(v_tx.amount, 0);

    -- 2. Resolve currency
    SELECT country_id, phone INTO v_prof
    FROM public.profiles
    WHERE id = v_tx.profile_id;

    v_is_egypt := (v_prof.country_id = 2 OR coalesce(v_prof.phone, '') LIKE '+20%');
    v_currency_ar := coalesce(v_tx.currency_ar, CASE WHEN v_is_egypt THEN 'ج.م' ELSE 'د.أ' END);
    v_currency_code := coalesce(v_tx.currency_code, CASE WHEN v_is_egypt THEN 'EGP' ELSE 'JOD' END);

    -- 3. Fetch existing wallet
    SELECT * INTO v_wallet
    FROM public.wallet_accounts
    WHERE profile_id = v_tx.profile_id
    FOR UPDATE;

    -- 4. Credit either MINUTES or CASH
    IF upper(coalesce(p_credit_type, 'CASH')) = 'MINUTES' THEN
        v_minutes_to_grant := CASE WHEN p_minutes > 0 THEN p_minutes ELSE round(v_amount * 60) END;
        v_new_minutes := coalesce(v_wallet.paid_minutes_remaining, 0) + v_minutes_to_grant;
        v_expiry := now() + interval '30 days';

        INSERT INTO public.wallet_accounts (
            profile_id,
            paid_minutes_remaining,
            currency_code,
            time_bundle_expires_at,
            active_package_name,
            updated_at
        ) VALUES (
            v_tx.profile_id,
            v_new_minutes,
            v_currency_code,
            v_expiry,
            'شحن إيصال (' || v_minutes_to_grant || ' دقيقة)',
            now()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
            paid_minutes_remaining = v_new_minutes,
            currency_code = v_currency_code,
            time_bundle_expires_at = v_expiry,
            active_package_name = 'شحن إيصال (' || v_minutes_to_grant || ' دقيقة)',
            updated_at = now();

        -- Update transaction row
        UPDATE public.wallet_transactions
        SET
            status = 'COMPLETED',
            currency_ar = v_currency_ar,
            currency_code = v_currency_code,
            description_ar = 'تمت الموافقة على الإيصال وتخصيص ' || v_minutes_to_grant || ' دقيقة رادار.',
            metadata = coalesce(v_tx.metadata, '{}'::jsonb) || jsonb_build_object(
                'approved_by', p_admin_id,
                'approved_at', now(),
                'credit_type', 'MINUTES',
                'minutes_credited', v_minutes_to_grant,
                'currency', v_currency_ar,
                'admin_note', p_admin_note
            ),
            updated_at = now()
        WHERE id = p_transaction_id;

        RETURN jsonb_build_object(
            'success', true,
            'credit_type', 'MINUTES',
            'minutes_credited', v_minutes_to_grant,
            'profile_id', v_tx.profile_id,
            'amount', v_amount,
            'currency', v_currency_ar
        );
    ELSE
        -- CASH credit
        v_new_balance := round((coalesce(v_wallet.balance, 0) + v_amount)::numeric, 2);

        INSERT INTO public.wallet_accounts (
            profile_id,
            balance,
            currency_code,
            updated_at
        ) VALUES (
            v_tx.profile_id,
            v_new_balance,
            v_currency_code,
            now()
        )
        ON CONFLICT (profile_id) DO UPDATE SET
            balance = v_new_balance,
            currency_code = v_currency_code,
            updated_at = now();

        -- Update transaction row
        UPDATE public.wallet_transactions
        SET
            status = 'COMPLETED',
            currency_ar = v_currency_ar,
            currency_code = v_currency_code,
            description_ar = 'تمت الموافقة على الإيصال وإيداع ' || trim(to_char(v_amount, 'FM999999990.00')) || ' ' || v_currency_ar || ' في الرصيد النقدي.',
            metadata = coalesce(v_tx.metadata, '{}'::jsonb) || jsonb_build_object(
                'approved_by', p_admin_id,
                'approved_at', now(),
                'credit_type', 'CASH',
                'amount_credited', v_amount,
                'currency', v_currency_ar,
                'admin_note', p_admin_note
            ),
            updated_at = now()
        WHERE id = p_transaction_id;

        RETURN jsonb_build_object(
            'success', true,
            'credit_type', 'CASH',
            'amount_credited', v_amount,
            'profile_id', v_tx.profile_id,
            'currency', v_currency_ar
        );
    END IF;
END;
$$;

-- ==============================================================================
-- 3. ATOMIC RPC FUNCTION: REJECT WALLET RECEIPT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.reject_wallet_receipt(
    p_transaction_id uuid,
    p_reason text DEFAULT 'الإيصال غير واضح أو لم يتم استلام التحويل',
    p_admin_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx record;
    v_reason text;
BEGIN
    SELECT * INTO v_tx
    FROM public.wallet_transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_not_found');
    END IF;

    IF v_tx.status = 'REJECTED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'receipt_already_rejected');
    END IF;

    v_reason := coalesce(nullif(trim(p_reason), ''), 'الإيصال غير واضح أو لم يتم استلام التحويل');

    UPDATE public.wallet_transactions
    SET
        status = 'REJECTED',
        description_ar = 'تم رفض الإيصال: ' || v_reason,
        metadata = coalesce(v_tx.metadata, '{}'::jsonb) || jsonb_build_object(
            'rejected_by', p_admin_id,
            'rejected_at', now(),
            'reject_reason', v_reason,
            'rejection_reason', v_reason
        ),
        updated_at = now()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'profile_id', v_tx.profile_id,
        'reason', v_reason
    );
END;
$$;

-- ==============================================================================
-- 4. REALTIME PUBLICATION & REPLICA IDENTITY
-- ==============================================================================
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- ==============================================================================
-- 5. FUNCTION PERMISSIONS
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.approve_wallet_receipt(uuid, text, integer, uuid, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_wallet_receipt(uuid, text, uuid) TO service_role, authenticated;
