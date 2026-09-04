'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

interface UseCaptainRadarMinuteConsumptionInput {
  user: User | null;
  driverStatus: DriverStatus;
  onBundleExhausted: () => void;
}

// Server computes elapsed time from wallet_accounts.last_minute_tick_at —
// this interval only decides WHEN to ask, never HOW MUCH to deduct.
const MINUTE_CONSUMPTION_TICK_MS = 20_000;

export function useCaptainRadarMinuteConsumption({
  user,
  driverStatus,
  onBundleExhausted,
}: UseCaptainRadarMinuteConsumptionInput) {
  const t = useTranslations('captainDashboard');
  const { toast } = useToast();
  const inFlightRef = React.useRef(false);
  const exhaustedNotifiedRef = React.useRef(false);

  // --- Refs so the interval callback never changes identity ---
  // onBundleExhausted is often an inline arrow function passed from the parent;
  // without a ref it gets a new reference on every render, which invalidates
  // the `tick` useCallback, which resets the 20 s interval before it fires.
  const onBundleExhaustedRef = React.useRef(onBundleExhausted);
  onBundleExhaustedRef.current = onBundleExhausted;
  const tRef = React.useRef(t);
  tRef.current = t;
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const shouldTick = user?.role === 'driver' && driverStatus === 'active';
  const shouldTickRef = React.useRef(shouldTick);
  shouldTickRef.current = shouldTick;

  // Stable tick — never changes identity, reads everything from refs.
  const tick = React.useCallback(async () => {
    if (!shouldTickRef.current || inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const { data, error } = await supabase.rpc('consume_captain_radar_minutes');
      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Captain radar minutes]', error);
        }
        return;
      }

      const result = data as { has_active_bundle?: boolean } | null;
      if (result?.has_active_bundle === false && !exhaustedNotifiedRef.current) {
        exhaustedNotifiedRef.current = true;
        toastRef.current({
          variant: 'destructive',
          title: tRef.current('radarBundleExpiredTitle'),
          description: tRef.current('radarBundleExpiredBody'),
        });
        onBundleExhaustedRef.current();
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []); // ✅ stable — reads all values from refs

  React.useEffect(() => {
    if (!shouldTick) {
      exhaustedNotifiedRef.current = false;
      return;
    }

    void tick();
    const interval = window.setInterval(() => void tick(), MINUTE_CONSUMPTION_TICK_MS);
    return () => window.clearInterval(interval);
  }, [shouldTick, tick]); // tick is stable, shouldTick controls setup/teardown
}
