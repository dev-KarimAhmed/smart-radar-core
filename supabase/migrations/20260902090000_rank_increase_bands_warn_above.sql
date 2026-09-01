-- Rank increase bands, restated by the product owner:
--
--   برونزي   1 - 5%
--   فضي      0%
--   ذهبي     1 - 10%
--   بلاتيني  1 - 20%
--
--   "لكن هو يقدر يزود براحته متمنعوش — يدوب بس اديله تحذير لو زاد بنسبة أكبر من 15%
--    إذا لم يكن في نطاق رتبته"
--
-- So there are TWO separate numbers per rank, and conflating them is what caused the
-- confusion in the first place:
--
--   rankIncreaseFactor — what the captain's RANK grants them, shown to them as their range.
--   warnFactor         — where the WARNING starts: max(rankIncreaseFactor, 0.15).
--
-- Only PLATINUM's own allowance exceeds the 15% general line, so PLATINUM is the only rank
-- that can reach 20% without a warning; everyone else is warned above 15%. Nobody is
-- blocked above it — that is the whole point of the change.
--
--
-- CORRECTION TO AN EARLIER MIGRATION IN THIS SERIES
--
-- 20260901090000_flat_offer_band_warn_above.sql flattened this to ±15% for every rank on the
-- reading that rank must not affect price. That was wrong, and so was the reasoning in
-- 20260828090000 that called the original `greatest(0.15, <rank ladder>)` a defect: that
-- expression was not a broken ceiling ladder, it was exactly "max(rank allowance, 15% line)"
-- — the rule being restated here. The original numbers are restored verbatim.
--
-- What WAS genuinely broken, and stays fixed:
--   * exceeding the line RAISEd an exception instead of warning   (fixed in 20260901090000)
--   * captain_offer_quote clamped the suggestion down to the line,
--     so maxIncrease came out as exactly 0.00                     (fixed in 20260901090000)
--
--
-- Note on SILVER 0% vs BRONZE 1-5%: the lower rank is granted MORE silent headroom than the
-- rank above it. Flagged once before and restated deliberately, so it is implemented as
-- specified — recorded here only so the next reader does not "fix" it as a typo.
--
-- Nothing else needs to change: captain_offer_quote and submit_ride_offer already read
-- `ceilingFactor` from this function and already treat crossing it as a recorded warning
-- rather than a refusal, so redefining the factor here is enough.

CREATE OR REPLACE FUNCTION public.offer_band_for_rank(p_tier public.captain_tier)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $band$
  WITH rank_factor AS (
    SELECT CASE p_tier
      WHEN 'PLATINUM' THEN 0.20   -- 1 - 20%
      WHEN 'GOLD'     THEN 0.10   -- 1 - 10%
      WHEN 'BRONZE'   THEN 0.05   -- 1 - 5%
      WHEN 'SILVER'   THEN 0.00   -- 0%
      ELSE 0.00
    END AS granted
  )
  SELECT jsonb_build_object(
    -- Hard rule. The anti-undercutting brake ("حماية كاملة من حرق الأسعار"); no rank earns
    -- the right to burn the market, and submit_ride_offer still refuses below it.
    'floorFactor', 0.85,

    -- What this rank grants, for display: "رتبتك ذهبي تسمح لك بزيادة من 1 إلى 10%".
    'rankIncreaseFactor', granted,

    -- Where the warning starts. NOT a wall — above it the offer is accepted and flagged.
    'warnFactor', greatest(granted, 0.15),

    -- Same value under the name every existing caller already reads.
    'ceilingFactor', 1 + greatest(granted, 0.15),

    'rankAffectsPrice', true
  )
  FROM rank_factor;
$band$;

GRANT EXECUTE ON FUNCTION public.offer_band_for_rank(public.captain_tier) TO authenticated;


-- ---------------------------------------------------------------------------
-- Verification
--
--   SELECT t AS rank,
--          (public.offer_band_for_rank(t)->>'rankIncreaseFactor')::numeric AS granted,
--          (public.offer_band_for_rank(t)->>'warnFactor')::numeric         AS warns_above
--   FROM unnest(ARRAY['BRONZE','SILVER','GOLD','PLATINUM']::public.captain_tier[]) AS t;
--
--   expect:
--     BRONZE    0.05   0.15
--     SILVER    0.00   0.15
--     GOLD      0.10   0.15
--     PLATINUM  0.20   0.20
--
--   And no rank may be refused for going high — only for going below the floor:
--     the only RAISE left in submit_ride_offer is 'offer_below_market_floor'.
