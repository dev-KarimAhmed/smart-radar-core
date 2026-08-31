'use client';

import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';

export type CaptainMarketStatus = 'low' | 'high';
export type CaptainMarketScope = 'governorate' | 'country' | 'unknown';

export interface CaptainMarketIndicator {
  /** Captains currently online ("active") in the captain's own governorate — supply. */
  activeCaptainCount: number;
  /** Riders currently waiting for a captain in the same governorate — demand. */
  pendingRequestCount: number;
  scope: CaptainMarketScope;
  status: CaptainMarketStatus;
}

/**
 * How the captain's local market looks right now: supply (active captains) vs
 * demand (riders currently waiting) in the same governorate. 'low' (green):
 * at least as many waiting riders as active captains — there's work. 'high'
 * (red): fewer waiting riders than active captains — crowded, not enough
 * requests to go around. Always governorate-scoped — if the governorate
 * doesn't have enough priced captains yet to call it a market, this reads
 * 'low' by default rather than falling back to a country-wide number.
 *
 * Called once here so the full indicator inside the tariff modal and the
 * small persistent one next to the dashboard tabs share a single fetch
 * instead of each hitting the RPC independently. Refetches every 30s —
 * active captains and pending requests both change in near-real-time, so a
 * one-shot fetch on mount would go stale the moment a rider requests a ride
 * or another captain goes online/offline while this dashboard stays open.
 */
const REFRESH_INTERVAL_MS = 30_000;

export function useCaptainMarketIndicator(user: User | null) {
  const [indicator, setIndicator] = React.useState<CaptainMarketIndicator | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!user?.uid) {
      setIndicator(null);
      setIsLoaded(false);
      return;
    }

    let active = true;

    async function loadIndicator() {
      try {
        const { data, error } = await supabase.rpc('captain_market_indicator');
        if (!active) return;
        if (error) throw error;

        const context = (data ?? {}) as Record<string, unknown>;
        const scope = context.scope === 'governorate' || context.scope === 'country' ? context.scope : 'unknown';
        setIndicator({
          activeCaptainCount: Number(context.activeCaptainCount) || 0,
          pendingRequestCount: Number(context.pendingRequestCount) || 0,
          scope,
          status: context.status === 'high' ? 'high' : 'low',
        });
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain market indicator]', error);
        setIndicator(null);
      } finally {
        if (active) setIsLoaded(true);
      }
    }

    setIsLoaded(false);
    void loadIndicator();
    const intervalId = window.setInterval(() => void loadIndicator(), REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user?.uid]);

  return { marketIndicator: indicator, isMarketIndicatorLoaded: isLoaded };
}
