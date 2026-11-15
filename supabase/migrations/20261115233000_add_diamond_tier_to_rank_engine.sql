-- =============================================================================
-- Migration: 20261115233000_add_diamond_tier_to_rank_engine.sql
-- Purpose: Add 'DIAMOND' tier to public.captain_tier enum and update
--          calculate_sovereign_rank and offer_band_for_rank to complete
--          the 5-tier Sovereign Dual-Key Matrix hierarchy.
-- =============================================================================

-- 1. Add 'DIAMOND' to public.captain_tier enum
ALTER TYPE public.captain_tier ADD VALUE IF NOT EXISTS 'DIAMOND';

-- 2. Update calculate_sovereign_rank to handle DIAMOND (rating >= 4.9 AND hearts >= 100)
CREATE OR REPLACE FUNCTION public.calculate_sovereign_rank(
  p_average_rating numeric,
  p_heart_count integer
) RETURNS public.captain_tier
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT CASE
    WHEN coalesce(p_average_rating, 0) >= 4.9 AND coalesce(p_heart_count, 0) >= 100 THEN 'DIAMOND'
    WHEN coalesce(p_average_rating, 0) >= 4.8 AND coalesce(p_heart_count, 0) >= 50 THEN 'PLATINUM'
    WHEN coalesce(p_average_rating, 0) >= 4.5 AND coalesce(p_heart_count, 0) >= 20 THEN 'GOLD'
    WHEN coalesce(p_average_rating, 0) >= 4.0 THEN 'SILVER'
    ELSE 'BRONZE'
  END::public.captain_tier;
$fn$;

COMMENT ON FUNCTION public.calculate_sovereign_rank(numeric, integer) IS
  'Derives captain tier from average rating and distinct hearts: DIAMOND (>=4.9 & >=100), PLATINUM (>=4.8 & >=50), GOLD (>=4.5 & >=20), SILVER (>=4.0), BRONZE (<4.0).';

-- 3. Update offer_band_for_rank to include DIAMOND (25% rank increase factor)
CREATE OR REPLACE FUNCTION public.offer_band_for_rank(p_tier public.captain_tier)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $band$
  WITH rank_factor AS (
    SELECT CASE p_tier
      WHEN 'DIAMOND'  THEN 0.25   -- 1 - 25% (سقف الرتبة الماسية)
      WHEN 'PLATINUM' THEN 0.20   -- 1 - 20%
      WHEN 'GOLD'     THEN 0.10   -- 1 - 10%
      WHEN 'BRONZE'   THEN 0.05   -- 1 - 5%
      WHEN 'SILVER'   THEN 0.00   -- 0%
      ELSE 0.00
    END AS granted
  )
  SELECT jsonb_build_object(
    -- Hard floor: anti-undercutting brake (-15% from market average)
    'floorFactor', 0.85,

    -- What this rank grants: "رتبتك ماسي تسمح لك بزيادة حتى 25%"
    'rankIncreaseFactor', granted,

    -- Warning line: max(rank allowance, 15%)
    'warnFactor', greatest(granted, 0.15),

    -- Ceiling factor: 1 + greatest(granted, 0.15)
    'ceilingFactor', 1 + greatest(granted, 0.15),

    'rankAffectsPrice', true
  )
  FROM rank_factor;
$band$;

GRANT EXECUTE ON FUNCTION public.offer_band_for_rank(public.captain_tier) TO authenticated;

COMMENT ON COLUMN public.profiles.heart_count IS
  'DISTINCT riders who hearted this captain — not total hearts. Second key of the Dual-Key matrix; gate for GOLD (>=20), PLATINUM (>=50), and DIAMOND (>=100).';
