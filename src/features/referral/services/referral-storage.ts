const PENDING_REF_KEY = 'radar_pending_captain_ref';

/**
 * Stores a pending captain referral code from a link (e.g., ?ref=C-1002).
 */
export function storePendingCaptainReferral(ref: string): void {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  const clean = ref.trim();
  if (clean) {
    try {
      localStorage.setItem(PENDING_REF_KEY, clean);
    } catch {
      // ignore
    }
  }
}

/**
 * Gets any pending captain referral code stored in localStorage.
 */
export function getPendingCaptainReferral(): string | null {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(PENDING_REF_KEY);
  } catch {
    return null;
  }
}

/**
 * Clears the pending captain referral code.
 */
export function clearPendingCaptainReferral(): void {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_REF_KEY);
  } catch {
    // ignore
  }
}

/**
 * Removes referral query parameters (?ref=... or ?captain=...) from the current URL
 * without triggering a page reload.
 */
export function removeReferralParamFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.has('ref')) {
      url.searchParams.delete('ref');
      changed = true;
    }
    if (url.searchParams.has('captain')) {
      url.searchParams.delete('captain');
      changed = true;
    }
    if (changed) {
      const search = url.searchParams.toString();
      const newUrl = url.pathname + (search ? `?${search}` : '') + url.hash;
      window.history.replaceState(window.history.state, '', newUrl);
    }
  } catch {
    // ignore
  }
}

/**
 * Builds the sharable referral URL for a captain to register a new rider.
 */
export function buildCaptainReferralLink(captainIdentifier: string): string {
  const path = `/register/rider?ref=${encodeURIComponent(captainIdentifier)}`;
  if (typeof window === 'undefined') {
    return path;
  }
  const origin = window.location.origin;
  return `${origin}${path}`;
}
