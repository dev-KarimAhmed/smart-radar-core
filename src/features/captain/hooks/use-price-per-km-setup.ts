'use client';

import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';

/**
 * Gates the mandatory price-per-km popup: captains must set this once before
 * using the dashboard normally. `price_per_km` is null until they do.
 */
export function usePricePerKmSetup(user: User | null) {
  const [pricePerKm, setPricePerKm] = React.useState<number | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!user?.uid) {
      setIsLoaded(false);
      return;
    }

    let active = true;
    setIsLoaded(false);

    async function loadPricePerKm() {
      try {
        const { data, error } = await supabase
          .from('captain_profiles')
          .select('price_per_km')
          .eq('id', user!.uid)
          .maybeSingle();
        if (!active) return;
        if (error) throw error;
        setPricePerKm(typeof data?.price_per_km === 'number' ? data.price_per_km : null);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain price-per-km load]', error);
      } finally {
        if (active) setIsLoaded(true);
      }
    }

    void loadPricePerKm();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const savePricePerKm = React.useCallback(async (value: number) => {
    if (!user?.uid) return false;
    const { error } = await supabase
      .from('captain_profiles')
      .update({ price_per_km: value })
      .eq('id', user.uid);
    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain price-per-km save]', error);
      return false;
    }
    setPricePerKm(value);
    return true;
  }, [user?.uid]);

  return {
    needsPriceSetup: isLoaded && pricePerKm === null,
    savePricePerKm,
  };
}
