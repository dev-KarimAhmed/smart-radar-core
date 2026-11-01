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

/**
 * Computes an offer's remaining visibility window against `firstSeenAtMs` —
 * the rider client's clock reading of when it first observed this offer.
 * If firstSeenAtMs is missing, it falls back to the offer's created timestamp,
 * and if wait_seconds is missing or <= 0, it defaults to the platform's 90-second standard window.
 */
export function getOfferCountdown(
  offer: OfferCountdownInput,
  firstSeenAtMs: number | undefined,
  now: number
): OfferCountdown {
  const waitSeconds = Number(offer.wait_seconds) > 0 ? Number(offer.wait_seconds) : 90;

  // Resolve starting timestamp
  let effectiveFirstSeen = Number.isFinite(firstSeenAtMs) ? (firstSeenAtMs as number) : undefined;
  if (!effectiveFirstSeen) {
    if (offer.createdAt) {
      const parsed = new Date(offer.createdAt).getTime();
      if (Number.isFinite(parsed) && parsed > 0) effectiveFirstSeen = parsed;
    } else if (offer.created_at) {
      const parsed = new Date(offer.created_at).getTime();
      if (Number.isFinite(parsed) && parsed > 0) effectiveFirstSeen = parsed;
    }
  }

  if (!effectiveFirstSeen) {
    effectiveFirstSeen = now;
  }

  const totalMs = waitSeconds * 1000;
  const elapsedMs = Math.max(0, now - effectiveFirstSeen);
  const remainingMs = totalMs - elapsedMs;

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
