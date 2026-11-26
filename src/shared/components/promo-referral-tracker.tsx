'use client';

import { useEffect } from 'react';

const VISITED_REFS_KEY = 'byncom_visited_promo_refs';

export function PromoReferralTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const promoRef = (params.get('promo_ref') || '').trim();
    if (!promoRef) return;

    try {
      const raw = localStorage.getItem(VISITED_REFS_KEY);
      const visited: string[] = raw ? JSON.parse(raw) : [];
      if (Array.isArray(visited) && visited.includes(promoRef)) {
        return;
      }

      const nextVisited = Array.isArray(visited) ? [...visited, promoRef] : [promoRef];
      localStorage.setItem(VISITED_REFS_KEY, JSON.stringify(nextVisited.slice(-50)));
    } catch {
      // Proceed with tracking even if localStorage is unavailable
    }

    void fetch('/api/early-launch-ads/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareCode: promoRef }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}
