BEGIN;

CREATE TABLE IF NOT EXISTS public.early_launch_ad_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type text NOT NULL CHECK (card_type IN ('COMMERCIAL', 'CRAFTS')),
  entity_or_category text NOT NULL,
  specialty text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL DEFAULT '',
  governorate text NOT NULL,
  district text NOT NULL,
  share_code text NOT NULL UNIQUE,
  visitor_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.early_launch_ad_leads
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_early_launch_ad_leads_card_type
  ON public.early_launch_ad_leads (card_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_early_launch_ad_leads_share_code
  ON public.early_launch_ad_leads (share_code);

ALTER TABLE public.early_launch_ad_leads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_early_launch_lead_visit(p_share_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_new_count integer;
BEGIN
  IF p_share_code IS NULL OR trim(p_share_code) = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.early_launch_ad_leads
  SET visitor_count = visitor_count + 1,
      updated_at = now()
  WHERE share_code = trim(p_share_code)
  RETURNING visitor_count INTO v_new_count;

  RETURN coalesce(v_new_count, 0);
END;
$fn$;

REVOKE ALL ON FUNCTION public.increment_early_launch_lead_visit(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_early_launch_lead_visit(text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
