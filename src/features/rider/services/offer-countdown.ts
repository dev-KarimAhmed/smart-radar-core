export interface OfferCountdownInput {
  wait_seconds?: number;
}

export interface OfferCountdown {
  hasCountdown: boolean;
  remainingSeconds: number;
  percentRemaining: number;
  isExpired: boolean;
}

/**
 * Computes an offer's remaining visibility window against `firstSeenAtMs` —
 * the rider client's OWN clock reading of when it first observed this offer
 * (tracked by the caller, one per offer id), not the server's `created_at`.
 * Using created_at would make the countdown vulnerable to realtime/fetch
 * latency and any client/server clock skew — an offer could already read as
 * "expired" the moment it arrives. Anchoring to the rider's own first-seen
 * moment guarantees they get the full wait_seconds to actually look at it.
 */
export function getOfferCountdown(offer: OfferCountdownInput, firstSeenAtMs: number | undefined, now: number): OfferCountdown {
  const waitSeconds = offer.wait_seconds;

  if (!waitSeconds || waitSeconds <= 0 || !Number.isFinite(firstSeenAtMs)) {
    return { hasCountdown: false, remainingSeconds: Infinity, percentRemaining: 100, isExpired: false };
  }

  const totalMs = waitSeconds * 1000;
  const elapsedMs = Math.max(0, now - (firstSeenAtMs as number));
  const remainingMs = Math.max(0, totalMs - elapsedMs);

  return {
    hasCountdown: true,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    percentRemaining: Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)),
    isExpired: remainingMs <= 0,
  };
}
