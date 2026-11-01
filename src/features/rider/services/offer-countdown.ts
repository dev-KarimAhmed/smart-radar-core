export interface OfferCountdownInput {
  wait_seconds?: number;
  createdAt?: number | string | Date;
  created_at?: string;
}

export interface OfferCountdown {
  hasCountdown: boolean;
  remainingSeconds: number;
  percentRemaining: number;
  isExpired: boolean;
}

// Absolute sovereign maximum wait window for any offer (3 minutes = 180 seconds)
export const MAX_OFFER_COUNTDOWN_SECONDS = 180;

/**
 * Computes an offer's remaining visibility window against `firstSeenAtMs` —
 * the rider client's clock reading of when it first observed this offer.
 * If firstSeenAtMs is missing, it falls back to the offer's created timestamp,
 * and if wait_seconds is missing or <= 0, it defaults to the platform's 90-second standard window.
 *
 * If `maxAllowedRemainingSeconds` is provided (e.g. from the ride request's remaining 4-minute lifespan),
 * the offer's remaining seconds cannot exceed it. When maxAllowedRemainingSeconds <= 0, the offer expires.
 */
export function getOfferCountdown(
  offer: OfferCountdownInput,
  firstSeenAtMs: number | undefined,
  now: number,
  maxAllowedRemainingSeconds?: number
): OfferCountdown {
  let waitSeconds = Number(offer.wait_seconds) > 0 ? Number(offer.wait_seconds) : 90;
  // Hard ceiling: an offer's initial wait window can NEVER exceed 180 seconds
  waitSeconds = Math.min(MAX_OFFER_COUNTDOWN_SECONDS, waitSeconds);

  // Authoritative start timestamp: the offer's created timestamp on the server
  let effectiveStartTime: number | undefined;

  if (offer.created_at) {
    const parsed = new Date(offer.created_at).getTime();
    if (Number.isFinite(parsed) && parsed > 0) effectiveStartTime = parsed;
  } else if (offer.createdAt) {
    const parsed = new Date(offer.createdAt).getTime();
    if (Number.isFinite(parsed) && parsed > 0) effectiveStartTime = parsed;
  }

  // Fallback to firstSeenAtMs or now only if created timestamp is unavailable
  if (!effectiveStartTime) {
    effectiveStartTime = Number.isFinite(firstSeenAtMs) ? (firstSeenAtMs as number) : now;
  }

  const totalMs = waitSeconds * 1000;
  const elapsedMs = Math.max(0, now - effectiveStartTime);
  let remainingMs = totalMs - elapsedMs;

  // Clamped by trip's remaining search lifespan (4-minute radar window)
  if (typeof maxAllowedRemainingSeconds === 'number') {
    const maxAllowedMs = Math.max(0, maxAllowedRemainingSeconds * 1000);
    remainingMs = Math.min(remainingMs, maxAllowedMs);
  }

  const isExpired = remainingMs <= 0;
  const remainingSeconds = isExpired ? 0 : Math.max(0, Math.ceil(remainingMs / 1000));
  const percentRemaining = isExpired ? 0 : Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  return {
    hasCountdown: true,
    remainingSeconds,
    percentRemaining,
    isExpired,
  };
}
