'use client';

import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import type {
  CaptainTariff,
  CaptainTariffSaveResult,
  MinBaseFareSource,
  MarketAverageScope,
  MarketAverageTariff,
  TariffContext,
} from '../types/captain-tariff-types';
import { FALLBACK_MIN_BASE_FARE } from '../types/captain-tariff-types';
import {
  toNumberOrNull,
  toMarketAverage,
  saveCaptainTariffToSupabase,
} from '../services/captain-tariff-service';

export type {
  CaptainTariff,
  CaptainTariffSaveResult,
  MinBaseFareSource,
  MarketAverageScope,
  MarketAverageTariff,
};

export function usePricePerKmSetup(
  user: User | null,
  isInDifferentCountry = false,
  activationNonce = 0,
) {
  const [tariff, setTariff] = React.useState<TariffContext>({
    baseFare: null,
    pricePerKm: null,
    pricePerMin: null,
    includedKm: 0,
    pricingMode: 'FREE',
    minBaseFare: FALLBACK_MIN_BASE_FARE,
    minBaseFareSource: 'country_seed',
    marketAverage: null,
  });
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [confirmedNonce, setConfirmedNonce] = React.useState(activationNonce);

  React.useEffect(() => {
    if (!user?.uid) {
      setIsLoaded(false);
      return;
    }

    let active = true;
    setIsLoaded(false);

    try {
      const cached = localStorage.getItem(`radar_captain_tariff_${user.uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setTariff((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}

    async function loadTariff() {
      try {
        const { data, error } = await supabase.rpc('get_captain_tariff_context');
        if (!active) return;
        if (error) throw error;

        const context = (data ?? {}) as Record<string, unknown>;
        const rawMode = (context.pricingMode || context.pricing_mode || '').toString().toUpperCase();
        const parsedMode: 'FREE' | 'APP' | 'TAXI' | null =
          rawMode === 'APP' ? 'APP' : rawMode === 'TAXI' ? 'TAXI' : rawMode === 'FREE' ? 'FREE' : null;

        setTariff({
          baseFare: toNumberOrNull(context.baseFare),
          pricePerKm: toNumberOrNull(context.pricePerKm),
          pricePerMin: toNumberOrNull(context.pricePerMin),
          includedKm: toNumberOrNull(context.includedKm) ?? 0,
          pricingMode: parsedMode,
          minBaseFare: toNumberOrNull(context.minBaseFare) ?? FALLBACK_MIN_BASE_FARE,
          minBaseFareSource: context.minBaseFareSource === 'captain_average' ? 'captain_average' : 'country_seed',
          marketAverage: toMarketAverage(context.marketAverage),
        });
      } catch (error) {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production') console.warn('[Captain tariff load]', error);
      } finally {
        if (active) setIsLoaded(true);
      }
    }

    void loadTariff();
    return () => {
      active = false;
    };
  }, [user?.uid, activationNonce]);

  const saveTariff = React.useCallback(async (value: CaptainTariff): Promise<CaptainTariffSaveResult> => {
    if (!user?.uid) return { saved: false, reason: 'unknown' };

    const { error, minBaseFare } = await saveCaptainTariffToSupabase(user, value);

    if (error && minBaseFare !== null) {
      setTariff((previous) => ({ ...previous, minBaseFare }));
      return { saved: false, reason: 'base_fare_below_market_minimum', minBaseFare };
    }

    const mode = value.pricingMode || 'FREE';
    setTariff((previous) => ({
      ...previous,
      ...value,
      pricingMode: mode,
    }));
    setConfirmedNonce(activationNonce);
    return { saved: true };
  }, [activationNonce, user]);

  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    setIsDismissed(false);
  }, [activationNonce]);

  const dismissPriceSetup = React.useCallback(() => {
    setConfirmedNonce(activationNonce);
    setIsDismissed(true);
  }, [activationNonce]);

  const isTariffIncomplete =
    tariff.baseFare === null || tariff.pricePerKm === null || tariff.pricePerMin === null;

  const needsActivationConfirm = activationNonce > confirmedNonce;

  return {
    needsPriceSetup: !isDismissed && isLoaded && (isTariffIncomplete || isInDifferentCountry || needsActivationConfirm),
    isActivationConfirm: needsActivationConfirm && !isTariffIncomplete && !isInDifferentCountry,
    currentTariff: tariff,
    saveTariff,
    dismissPriceSetup,
  };
}
