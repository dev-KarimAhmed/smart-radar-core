'use client';

import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';

export type CaptainTariff = {
  /** فتحة العداد الأساسية — must be >= the country's regulated floor. */
  baseFare: number;
  /** سعر الكيلومتر الإضافي */
  pricePerKm: number;
  /** سعر الدقيقة — driving time, including time lost to traffic. */
  pricePerMin: number;
  /** المسافة المشمولة في فتحة العداد — km billed at zero before per-km charging starts. */
  includedKm: number;
};

/** Which reference produced `minBaseFare` — see public.market_sample_threshold(). */
export type MinBaseFareSource = 'captain_average' | 'country_seed';

/** Which area the market average was actually computed over. */
export type MarketAverageScope = 'governorate' | 'country' | 'country_seed';

/** Full result of public.market_average_tariff() — one reference number per tariff field. */
export type MarketAverageTariff = {
  baseFare: number;
  perKm: number;
  perMin: number;
  includedKm: number;
  captainCount: number;
  threshold: number;
  scope: MarketAverageScope;
  source: MinBaseFareSource;
};

type TariffContext = {
  baseFare: number | null;
  pricePerKm: number | null;
  pricePerMin: number | null;
  includedKm: number;
  /** Lowest meter-opening charge this captain may set. */
  minBaseFare: number;
  minBaseFareSource: MinBaseFareSource;
  /** Per-field market averages for the whole tariff, not just the base-fare floor. */
  marketAverage: MarketAverageTariff | null;
};

const FALLBACK_MIN_BASE_FARE = 1;

function toNumberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toMarketAverage(value: unknown): MarketAverageTariff | null {
  if (!value || typeof value !== 'object') return null;
  const context = value as Record<string, unknown>;
  const baseFare = toNumberOrNull(context.baseFare);
  const perKm = toNumberOrNull(context.perKm);
  const perMin = toNumberOrNull(context.perMin);
  if (baseFare === null || perKm === null || perMin === null) return null;

  return {
    baseFare,
    perKm,
    perMin,
    includedKm: toNumberOrNull(context.includedKm) ?? 0,
    captainCount: toNumberOrNull(context.captainCount) ?? 0,
    threshold: toNumberOrNull(context.threshold) ?? 0,
    scope: context.scope === 'governorate' || context.scope === 'country' ? context.scope : 'country_seed',
    source: context.source === 'captain_average' ? 'captain_average' : 'country_seed',
  };
}

/**
 * Gates the mandatory tariff popup: captains must declare all three fare components once
 * before using the dashboard normally (each is null until they do), and again whenever
 * their live GPS country no longer matches their registered one — the currency changes, so
 * the prices they set no longer mean the same thing and need re-confirming.
 *
 * `minBaseFare` is the country's regulated floor (`countries.min_base_fare`), kept separate
 * from `countries.base_fare`, which is only the seed the market average starts from. It is
 * surfaced here so the form can reject a lower value before the round trip; the
 * enforce_captain_base_fare_floor trigger re-checks it server-side.
 *
 * The floor and `marketAverage` are both governorate-first: get_captain_tariff_context()
 * resolves the captain's live-GPS governorate (falling back to their registered one, then to
 * a country-wide average, then to the country's seed row) so "the market" means captains
 * actually nearby, not the whole country.
 */
export function usePricePerKmSetup(
  user: User | null,
  isInDifferentCountry = false,
  /**
   * Increments on every self-activation (see useDriverLifecycle). Each new value re-opens
   * the tariff modal so the captain confirms — or changes — their prices before going
   * online again. A nonce rather than the observed status, because hydrating an
   * already-active session is not the captain activating themselves.
   */
  activationNonce = 0,
) {
  const [tariff, setTariff] = React.useState<TariffContext>({
    baseFare: null,
    pricePerKm: null,
    pricePerMin: null,
    includedKm: 0,
    minBaseFare: FALLBACK_MIN_BASE_FARE,
    minBaseFareSource: 'country_seed',
    marketAverage: null,
  });
  const [isLoaded, setIsLoaded] = React.useState(false);
  // The last activation the captain has confirmed their tariff for. Starts at the current
  // nonce so simply mounting the dashboard does not count as an activation.
  const [confirmedNonce, setConfirmedNonce] = React.useState(activationNonce);

  React.useEffect(() => {
    if (!user?.uid) {
      setIsLoaded(false);
      return;
    }

    let active = true;
    setIsLoaded(false);

    async function loadTariff() {
      try {
        const { data, error } = await supabase.rpc('get_captain_tariff_context');
        if (!active) return;
        if (error) throw error;

        const context = (data ?? {}) as Record<string, unknown>;
        setTariff({
          baseFare: toNumberOrNull(context.baseFare),
          pricePerKm: toNumberOrNull(context.pricePerKm),
          pricePerMin: toNumberOrNull(context.pricePerMin),
          includedKm: toNumberOrNull(context.includedKm) ?? 0,
          minBaseFare: toNumberOrNull(context.minBaseFare) ?? FALLBACK_MIN_BASE_FARE,
          minBaseFareSource: context.minBaseFareSource === 'captain_average' ? 'captain_average' : 'country_seed',
          marketAverage: toMarketAverage(context.marketAverage),
        });
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain tariff load]', error);
      } finally {
        if (active) setIsLoaded(true);
      }
    }

    void loadTariff();
    return () => {
      active = false;
    };
    // Re-reads on every activation, not just on mount, so the modal always opens on what is
    // actually stored — the captain may have edited their tariff from the profile tab since
    // this hook last fetched, and prefilling stale numbers would invite them to "confirm"
    // values they had already replaced. The setIsLoaded(false) above keeps the modal shut
    // for the duration of the refetch, so it never renders against the old data.
  }, [user?.uid, activationNonce]);

  const saveTariff = React.useCallback(async (value: CaptainTariff) => {
    if (!user?.uid) return false;

    const { error } = await supabase
      .from('captain_profiles')
      .update({
        base_fare: value.baseFare,
        price_per_km: value.pricePerKm,
        price_per_min: value.pricePerMin,
        included_km: value.includedKm,
      })
      .eq('id', user.uid);

    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain tariff save]', error);
      return false;
    }

    setTariff((previous) => ({ ...previous, ...value }));
    setConfirmedNonce(activationNonce);
    return true;
  }, [activationNonce, user?.uid]);

  // Any missing component keeps the captain in the setup gate — a fare cannot be computed
  // from a partial tariff.
  const isTariffIncomplete =
    tariff.baseFare === null || tariff.pricePerKm === null || tariff.pricePerMin === null;

  const needsActivationConfirm = activationNonce > confirmedNonce;

  return {
    needsPriceSetup: isLoaded && (isTariffIncomplete || isInDifferentCountry || needsActivationConfirm),
    /** True when the tariff is already set and this is only a per-activation confirmation. */
    isActivationConfirm: needsActivationConfirm && !isTariffIncomplete && !isInDifferentCountry,
    currentTariff: tariff,
    saveTariff,
  };
}
