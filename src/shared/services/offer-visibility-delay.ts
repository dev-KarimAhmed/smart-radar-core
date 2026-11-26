export const BELOW_MARKET_OFFER_DELAY_SECONDS = 180;

type OfferWithBreakdown = {
  created_at?: string;
  createdAt?: number | string | Date;
  fare_breakdown?: Record<string, unknown> | null;
};

/**
 * Returns the visibility delay in milliseconds for an offer (e.g. 180,000ms
 * when the captain's pricing/offer is below market average), or 0 if immediate.
 */
export function getOfferVisibilityDelayMs(offer: OfferWithBreakdown | Record<string, unknown> | null | undefined): number {
  if (!offer || typeof offer !== 'object') return 0;
  const breakdown = (offer as OfferWithBreakdown).fare_breakdown;
  if (!breakdown || typeof breakdown !== 'object') return 0;

  const rawDelay = Number(breakdown.visibilityDelaySeconds ?? 0);
  if (Number.isFinite(rawDelay) && rawDelay > 0) {
    return rawDelay * 1000;
  }
  return 0;
}

/**
 * Returns the epoch ms timestamp at which the offer becomes visible to the rider.
 */
export function getOfferVisibleAtMs(offer: OfferWithBreakdown | Record<string, unknown>): number | null {
  const delayMs = getOfferVisibilityDelayMs(offer);
  if (delayMs <= 0) return null;

  const breakdown = (offer as OfferWithBreakdown).fare_breakdown;
  const rawVisibleAt = breakdown && typeof breakdown === 'object' ? breakdown.visibleAt : undefined;
  if (typeof rawVisibleAt === 'string' && rawVisibleAt.trim()) {
    const parsed = Date.parse(rawVisibleAt);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const createdRaw = (offer as OfferWithBreakdown).created_at ?? (offer as OfferWithBreakdown).createdAt;
  if (createdRaw) {
    const createdMs = new Date(createdRaw).getTime();
    if (Number.isFinite(createdMs) && createdMs > 0) {
      return createdMs + delayMs;
    }
  }

  return null;
}

/**
 * True when an offer is still within its 3-minute below-market visibility delay.
 */
export function isOfferPendingVisibilityDelay(
  offer: OfferWithBreakdown | Record<string, unknown>,
  nowMs: number = Date.now(),
): boolean {
  const visibleAtMs = getOfferVisibleAtMs(offer);
  if (visibleAtMs === null) return false;
  return nowMs < visibleAtMs;
}
