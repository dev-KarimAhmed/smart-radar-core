'use client';

import React from 'react';
import type { Trip } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import { useCaptainProfessionalAd } from './use-captain-professional-ad';
import { usePricePerKmSetup } from './use-price-per-km-setup';
import { DEFAULT_OFFER_WAIT_SECONDS, MIN_OFFER_WAIT_SECONDS } from './use-driver-transactions';
import { estimateHaversineDistanceKm } from '../services/ride-location';
import { estimatePickupMinutes } from '@/shared/services/trip-duration';
import {
  MARKET_FLOOR_FACTOR,
  rankIncreaseFactorForTier,
  warnFactorForTier,
  type CaptainTier,
} from '../services/offer-band';

export type CaptainOfferQuote = {
  captainFare: number;
  marketFare: number | null;
  floorPrice: number | null;
  ceilingPrice: number | null;
  suggestedFare: number;
  isOutsideBand: boolean;
  tier: CaptainTier;
  roadKm: number | null;
  billableKm: number | null;
  estimatedMinutes: number | null;
  tariff: {
    baseFare: number;
    perKm: number;
    perMin: number;
    includedKm: number;
  } | null;
};

export interface UseBiddingProposalProps {
  request: Trip;
  driverLocation: { lat: number; lng: number } | null;
  initialOfferPrice?: number | null;
  initialPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  captainPricingMode?: 'FREE' | 'APP' | null;
  currentTariffProp?: {
    baseFare: number | null;
    pricePerKm: number | null;
    pricePerMin: number | null;
    includedKm?: number;
    pricingMode?: 'FREE' | 'APP' | null;
    marketAverage?: any;
  } | null;
  isSubmitting: boolean;
}

export function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function toFiniteNumberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeCaptainTier(value: unknown, rating = 5): CaptainTier {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.includes('PLATINUM') || normalized.includes('بلات')) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes('ذهب')) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes('برون')) return 'BRONZE';
  if (normalized.includes('SILVER') || normalized.includes('فض')) return 'SILVER';
  if (rating >= 4.9) return 'PLATINUM';
  if (rating >= 4.7) return 'GOLD';
  if (rating >= 4.4) return 'SILVER';
  return 'BRONZE';
}

export function useBiddingProposal({
  request,
  driverLocation,
  initialOfferPrice = null,
  initialPricingMode = null,
  captainPricingMode = null,
  currentTariffProp,
  isSubmitting,
}: UseBiddingProposalProps) {
  const { user } = useAuth();
  const existingOffer = React.useMemo(
    () => request.offers?.find(o => o.driverId === user?.uid),
    [request.offers, user?.uid]
  );

  const pickupDistanceKm = driverLocation && request.pickupCoords
    ? estimateHaversineDistanceKm(driverLocation.lat, driverLocation.lng, request.pickupCoords.lat, request.pickupCoords.lng)
    : null;
  const pickupEtaMinutes = estimatePickupMinutes(pickupDistanceKm);

  const [waitSecondsInput, setWaitSecondsInput] = React.useState(String(DEFAULT_OFFER_WAIT_SECONDS));
  const parsedWaitSeconds = Number(waitSecondsInput);
  const isWaitSecondsValid = Number.isInteger(parsedWaitSeconds)
    && parsedWaitSeconds >= MIN_OFFER_WAIT_SECONDS;

  const [quote, setQuote] = React.useState<CaptainOfferQuote | null>(null);

  const isIndependent = user?.subRole === 'independent';
  const isSmartApp = user?.affiliation?.type === 'smart-app';
  const isOfficeTaxi = user?.affiliation?.type === 'office-taxi';

  const riderPreference = React.useMemo(() => {
    const pref = String(request.pricingPreference || '').toUpperCase();
    return (['APP', 'TAXI', 'FREE'].includes(pref) ? (pref as 'APP' | 'TAXI' | 'FREE') : null);
  }, [request.pricingPreference]);

  const resolvedDefaultPricingMode = React.useMemo<'FREE' | 'APP' | 'TAXI'>(() => {
    if (riderPreference) return riderPreference;
    if (initialPricingMode) return initialPricingMode;
    if (isOfficeTaxi) return 'TAXI';
    if (captainPricingMode === 'APP' || isSmartApp) return 'APP';
    if (captainPricingMode === 'FREE') return 'FREE';
    if (isIndependent) return 'FREE';
    return 'APP';
  }, [riderPreference, initialPricingMode, isOfficeTaxi, captainPricingMode, isSmartApp, isIndependent]);

  const [pricingMode, setPricingMode] = React.useState<'FREE' | 'APP' | 'TAXI' | null>(
    resolvedDefaultPricingMode
  );

  React.useEffect(() => {
    setPricingMode(resolvedDefaultPricingMode);
  }, [resolvedDefaultPricingMode]);

  const marketFare = quote?.marketFare ?? Number(request.offerPrice || 0);
  const baseFare = quote?.suggestedFare ?? marketFare;
  const tier = quote?.tier ?? 'SILVER';
  const rankIncreaseFactor = rankIncreaseFactorForTier(tier);
  const premiumFactor = warnFactorForTier(tier);

  const ceilingPrice = quote?.ceilingPrice ?? roundMoney(marketFare * (1 + premiumFactor));
  const floorPrice = quote?.floorPrice ?? roundMoney(marketFare * (1 - MARKET_FLOOR_FACTOR));
  const captainMeterFare = quote?.captainFare ?? baseFare;
  const meterDetails = quote?.tariff
    && quote.roadKm != null
    && quote.billableKm != null
    && quote.estimatedMinutes != null
    ? {
      ...quote.tariff,
      roadKm: quote.roadKm,
      billableKm: quote.billableKm,
      estimatedMinutes: quote.estimatedMinutes,
    }
    : null;

  const isCoveredInBaseFare = Boolean(
    meterDetails
    && ((meterDetails.includedKm > 0 && meterDetails.billableKm <= 0) || captainMeterFare === meterDetails.baseFare)
  );

  const bandHeadroom = roundMoney(Math.max(0, ceilingPrice - baseFare));
  const minIncreaseAmount = roundMoney(Math.min(0, floorPrice - baseFare));

  const [increaseAmount, setIncreaseAmount] = React.useState<string | number>(0);
  const [appPrice, setAppPrice] = React.useState<string>(
    initialOfferPrice && initialOfferPrice > 0 ? String(initialOfferPrice) : ''
  );

  React.useEffect(() => {
    if (initialOfferPrice && initialOfferPrice > 0) {
      setAppPrice(String(initialOfferPrice));
    }
  }, [initialOfferPrice]);

  const parsedIncrease = parseFloat(String(increaseAmount));
  const normalizedIncreaseAmount = Number.isFinite(parsedIncrease) ? parsedIncrease : 0;
  const parsedAppPrice = parseFloat(appPrice);
  const normalizedAppPrice = Number.isFinite(parsedAppPrice) ? parsedAppPrice : 0;

  let finalOfferPrice = roundMoney(baseFare + normalizedIncreaseAmount);
  if (pricingMode === 'APP') {
    finalOfferPrice = normalizedAppPrice > 0 ? roundMoney(normalizedAppPrice) : 0;
  } else if (pricingMode === 'TAXI') {
    finalOfferPrice = normalizedAppPrice > 0 ? roundMoney(normalizedAppPrice) : roundMoney(baseFare);
  }

  const { currentTariff: hookTariff } = usePricePerKmSetup(user);
  const currentTariff = currentTariffProp ?? hookTariff;
  const marketAverage = currentTariff?.marketAverage;

  const isWithinBaseFare = (meterDetails?.billableKm ?? 0) <= 0;
  const marketBaseFare = marketAverage?.baseFare ?? (meterDetails?.baseFare ?? 0);
  const currentBaseFare = currentTariff?.baseFare ?? (meterDetails?.baseFare ?? 0);
  const marketPerKm = marketAverage?.perKm ?? (meterDetails?.perKm ?? 0);
  const marketPerMin = marketAverage?.perMin ?? (meterDetails?.perMin ?? 0);
  const currentPerKm = currentTariff?.pricePerKm ?? (meterDetails?.perKm ?? 0);
  const currentPerMin = currentTariff?.pricePerMin ?? (meterDetails?.perMin ?? 0);

  const effectiveOfferPrice = finalOfferPrice > 0 ? finalOfferPrice : (existingOffer?.price ?? captainMeterFare);
  const offerRatio = captainMeterFare > 0 ? effectiveOfferPrice / captainMeterFare : 1;
  const offerBaseFare = currentBaseFare * offerRatio;
  const offerPerKm = currentPerKm * offerRatio;
  const offerPerMin = currentPerMin * offerRatio;

  const isGoldOrPlatinum = (tier === 'GOLD' || tier === 'PLATINUM') && rankIncreaseFactor > 0;
  const isSilver = tier === 'SILVER';

  React.useEffect(() => {
    if (existingOffer) {
      if (pricingMode === 'FREE') {
        const diff = existingOffer.price - baseFare;
        setIncreaseAmount(diff !== 0 ? roundMoney(diff) : 0);
        setAppPrice('');
      } else if (pricingMode === 'APP' || pricingMode === 'TAXI') {
        setAppPrice(String(existingOffer.price));
        setIncreaseAmount(0);
      }
      setWaitSecondsInput(String(existingOffer.wait_seconds || DEFAULT_OFFER_WAIT_SECONDS));
    } else {
      setIncreaseAmount(0);
      if (initialOfferPrice && initialOfferPrice > 0) {
        setAppPrice(String(initialOfferPrice));
      } else {
        setAppPrice('');
      }
      setWaitSecondsInput(String(DEFAULT_OFFER_WAIT_SECONDS));
    }
  }, [request.id, existingOffer?.id, existingOffer?.price, existingOffer?.wait_seconds, baseFare, pricingMode, initialOfferPrice]);

  React.useEffect(() => {
    if (pricingMode === 'TAXI' || (pricingMode === 'APP' && isOfficeTaxi)) {
      setIncreaseAmount(0);
    }
  }, [pricingMode, isOfficeTaxi]);

  // Pure data loading service: isolated from JSX
  React.useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!request.id) return;

      const { data, error } = await supabase.rpc('captain_offer_quote', {
        p_request_id: request.id,
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
  }, [request.id, currentTariff?.baseFare, currentTariff?.pricePerKm, currentTariff?.pricePerMin]);

  const step = Math.max(0.25, roundMoney(Math.max(bandHeadroom, baseFare * 0.01, 1) / 10));

  const isAboveBand = ceilingPrice > 0 && finalOfferPrice > ceilingPrice;
  const isTierAmber = isAboveBand || (bandHeadroom > 0 && normalizedIncreaseAmount > bandHeadroom * 0.8);
  const aboveBandPercent = marketFare > 0
    ? Math.round(((finalOfferPrice - marketFare) / marketFare) * 1000) / 10
    : 0;

  const isMeterOffMarket = marketFare > 0 && baseFare > marketFare * 2;

  // Anti-dumping evaluation via RadarAntiCheatKernel (Edge Pure Domain Service)
  const marketBrake = marketFare > 0 ? RadarAntiCheatKernel.enforceMarketBrakes(finalOfferPrice, marketFare) : { status: 'NORMAL' as const };
  const isDumpingAmber = marketBrake.status === 'AMBER_WARNING';
  const isDumpingBlocked = (pricingMode !== 'APP' || normalizedAppPrice > 0) && (marketBrake.status === 'CRIMSON_BLOCK' || finalOfferPrice < floorPrice);
  const marketDifference = roundMoney(Math.max(0, marketFare - finalOfferPrice));
  const marketDifferencePercent = marketFare > 0
    ? Math.round((marketDifference / marketFare) * 1000) / 10
    : 0;
  const dumpingDeviationRatio = marketFare > 0 ? Math.max(0, (marketFare - finalOfferPrice) / marketFare) : 0;
  const professionalAd = useCaptainProfessionalAd(dumpingDeviationRatio, isDumpingBlocked);

  const isAmberDeviation = isTierAmber || isDumpingAmber;
  const isBlockedDeviation = isDumpingBlocked;
  const canSubmit = pricingMode !== null && Number.isFinite(finalOfferPrice) && finalOfferPrice > 0 && !isSubmitting && !isBlockedDeviation && isWaitSecondsValid;

  const handleApplyFloorPrice = React.useCallback(() => {
    if (floorPrice <= 0) return;
    if (pricingMode === 'TAXI' || pricingMode === 'APP') {
      setAppPrice(floorPrice.toFixed(2));
    } else {
      setIncreaseAmount(minIncreaseAmount);
    }
  }, [pricingMode, floorPrice, minIncreaseAmount]);

  const isPlusDisabled = pricingMode === 'TAXI' || (pricingMode === 'APP' && isOfficeTaxi) || pricingMode === null;
  const isMinusDisabled = pricingMode === 'TAXI' || (pricingMode === 'APP' && isOfficeTaxi) || pricingMode === null || (isDumpingBlocked && normalizedIncreaseAmount <= minIncreaseAmount);

  return {
    existingOffer,
    pickupEtaMinutes,
    waitSecondsInput,
    setWaitSecondsInput,
    parsedWaitSeconds,
    isWaitSecondsValid,
    quote,
    pricingMode,
    setPricingMode,
    marketFare,
    baseFare,
    tier,
    rankIncreaseFactor,
    premiumFactor,
    ceilingPrice,
    floorPrice,
    captainMeterFare,
    meterDetails,
    isCoveredInBaseFare,
    bandHeadroom,
    minIncreaseAmount,
    increaseAmount,
    setIncreaseAmount,
    appPrice,
    setAppPrice,
    normalizedIncreaseAmount,
    normalizedAppPrice,
    finalOfferPrice,
    currentTariff,
    isWithinBaseFare,
    marketBaseFare,
    currentBaseFare,
    marketPerKm,
    marketPerMin,
    currentPerKm,
    currentPerMin,
    offerBaseFare,
    offerPerKm,
    offerPerMin,
    isGoldOrPlatinum,
    isSilver,
    step,
    isAboveBand,
    isTierAmber,
    aboveBandPercent,
    isMeterOffMarket,
    isDumpingAmber,
    isDumpingBlocked,
    marketDifference,
    marketDifferencePercent,
    dumpingDeviationRatio,
    professionalAd,
    isAmberDeviation,
    isBlockedDeviation,
    canSubmit,
    handleApplyFloorPrice,
    isPlusDisabled,
    isMinusDisabled,
    riderPreference,
  };
}
