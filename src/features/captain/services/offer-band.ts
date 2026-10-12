export type CaptainTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';

/**
 * The offer band, as two separate numbers per rank.
 *
 * Conflating them is what made the captain's sheet contradict itself — promising "زيادة من 1
 * إلى 15%" while showing "أقصى زيادة مسموحة: 0.00" directly beside it:
 *
 *   RANK_INCREASE_FACTOR  what the rank GRANTS, shown to the captain as their range.
 *   warnFactorForTier()   where the WARNING starts: max(rank allowance, 15%).
 *
 * Nothing here is a wall. Above the warning line the offer is accepted and flagged; the only
 * hard rule is the floor, which submit_ride_offer still refuses below.
 *
 * Mirror of public.offer_band_for_rank
 * (supabase/migrations/20260902090000_rank_increase_bands_warn_above.sql). The server is the
 * authority — these values are the fallback used before the quote arrives, so drift here can
 * only mis-draw the panel, never mis-price an offer. offer-band.test.ts pins them anyway.
 */
export const RANK_INCREASE_FACTOR: Record<CaptainTier, number> = {
  PLATINUM: 0.2,  // 1 - 20%
  GOLD: 0.1,      // 1 - 10%
  BRONZE: 0.05,   // 1 - 5%
  // Granted less than BRONZE, the rank below it. Deliberate and confirmed by the product
  // owner — recorded here so the next reader does not "correct" it as a typo.
  SILVER: 0,      // 0%
};

/** The general no-warning line every rank gets, whatever their own allowance. */
export const STANDARD_PREMIUM_FACTOR = 0.15;

/** Hard rule: no rank may undercut the market average by more than this. */
export const MARKET_FLOOR_FACTOR = 0.15;

export function rankIncreaseFactorForTier(tier: CaptainTier) {
  return RANK_INCREASE_FACTOR[tier] ?? 0;
}

/**
 * Where the amber warning starts. PLATINUM is the only rank whose own allowance clears the
 * 15% line, so it is the only one that reaches 20% un-warned.
 */
export function warnFactorForTier(tier: CaptainTier) {
  return Math.max(STANDARD_PREMIUM_FACTOR, rankIncreaseFactorForTier(tier));
}
