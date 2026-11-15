import React from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  CaptainOfferQuote,
  normalizeCaptainTier,
  toFiniteNumberOrNull,
} from './bidding-proposal-types';

export function useQuoteLoader(params: {
  requestId: string | undefined;
  baseFare?: number | null;
  pricePerKm?: number | null;
  pricePerMin?: number | null;
}) {
  const { requestId, baseFare, pricePerKm, pricePerMin } = params;
  const [quote, setQuote] = React.useState<CaptainOfferQuote | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!requestId) return;

      const { data, error } = await supabase.rpc('captain_offer_quote', {
        p_request_id: requestId,
      });

      if (cancelled) return;
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Captain offer quote]', error);
        return;
      }

      const row = (data ?? {}) as Record<string, unknown>;
      const rawTariff = row.tariff;
      const tariff = rawTariff && typeof rawTariff === 'object'
        ? rawTariff as Record<string, unknown>
        : null;
      const roadKm = row.roadKm ?? row.road_km;
      const billableKm = row.billableKm ?? row.billable_km;
      const estimatedMinutes = row.estimatedMinutes ?? row.estimated_minutes;
      setQuote({
        captainFare: Number(row.captainFare ?? row.captain_fare),
        marketFare: row.marketFare == null && row.market_fare == null ? null : Number(row.marketFare ?? row.market_fare),
        floorPrice: row.floorPrice == null && row.floor_price == null ? null : Number(row.floorPrice ?? row.floor_price),
        ceilingPrice: row.ceilingPrice == null && row.ceiling_price == null ? null : Number(row.ceilingPrice ?? row.ceiling_price),
        suggestedFare: Number(row.suggestedFare ?? row.suggested_fare),
        isOutsideBand: Boolean(row.isOutsideBand),
        tier: normalizeCaptainTier(row.tier),
        roadKm: toFiniteNumberOrNull(roadKm),
        billableKm: toFiniteNumberOrNull(billableKm),
        estimatedMinutes: toFiniteNumberOrNull(estimatedMinutes),
        tariff: tariff
          && toFiniteNumberOrNull(tariff.baseFare ?? tariff.base_fare) != null
          && toFiniteNumberOrNull(tariff.perKm ?? tariff.per_km) != null
          && toFiniteNumberOrNull(tariff.perMin ?? tariff.per_min) != null
          ? {
            baseFare: toFiniteNumberOrNull(tariff.baseFare ?? tariff.base_fare) as number,
            perKm: toFiniteNumberOrNull(tariff.perKm ?? tariff.per_km) as number,
            perMin: toFiniteNumberOrNull(tariff.perMin ?? tariff.per_min) as number,
            includedKm: toFiniteNumberOrNull(tariff.includedKm ?? tariff.included_km) ?? 0,
          }
          : null,
      });
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [requestId, baseFare, pricePerKm, pricePerMin]);

  return { quote, setQuote };
}

