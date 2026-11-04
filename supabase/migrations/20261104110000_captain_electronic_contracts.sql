-- Migration: Captain Electronic Contracts & Signed Terms Register
-- Implements Article (5) Section 3 & 4 of the Unified Captain Advertiser Terms:
-- "السجل الإلكتروني للعقود والموافقات والنسخ المعتمدة بصيغة PDF"

CREATE TABLE IF NOT EXISTS public.captain_electronic_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captain_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contract_version TEXT NOT NULL DEFAULT 'v1.0-unified',
    full_name TEXT NOT NULL,
    national_id_number TEXT,
    license_number TEXT,
    plate_number TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    governorate TEXT,
    district TEXT,
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_hash TEXT,
    pdf_url TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_captain_contract_version UNIQUE (captain_id, contract_version)
);

CREATE INDEX IF NOT EXISTS idx_captain_electronic_contracts_captain_id 
    ON public.captain_electronic_contracts(captain_id);

CREATE INDEX IF NOT EXISTS idx_captain_electronic_contracts_hash 
    ON public.captain_electronic_contracts(contract_hash);

ALTER TABLE public.captain_electronic_contracts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated captain to view their own contract
DROP POLICY IF EXISTS captain_contracts_select_own ON public.captain_electronic_contracts;
CREATE POLICY captain_contracts_select_own
    ON public.captain_electronic_contracts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = captain_id);

-- Allow service role and admins full access
DROP POLICY IF EXISTS captain_contracts_admin_all ON public.captain_electronic_contracts;
CREATE POLICY captain_contracts_admin_all
    ON public.captain_electronic_contracts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'ADMIN' OR profiles.role = 'OWNER')
        )
    );

