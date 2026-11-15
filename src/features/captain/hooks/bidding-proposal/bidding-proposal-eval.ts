import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import {
  MARKET_FLOOR_FACTOR,
  rankIncreaseFactorForTier,
  warnFactorForTier,
} from '../../services/offer-band';
import { roundMoney, type CaptainOfferQuote } from './bidding-proposal-types';

export function resolveDefaultPricingMode(params: {
  pricingPreference?: string | null;
  initialPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  isOfficeTaxi: boolean;
  isSmartApp: boolean;
  isIndependent: boolean;
}): {
  riderPreference: 'FREE' | 'APP' | 'TAXI' | null;
  resolvedMode: 'FREE' | 'APP' | 'TAXI';
} {
  const {
    pricingPreference,
    initialPricingMode,
    captainPricingMode,
    isOfficeTaxi,
    isSmartApp,
    isIndependent,
  } = params;

  const pref = String(pricingPreference || '').toUpperCase();
  const riderPreference = (['APP', 'TAXI', 'FREE'].includes(pref)
    ? (pref as 'APP' | 'TAXI' | 'FREE')
    : null);

  if (riderPreference) return { riderPreference, resolvedMode: riderPreference };
  if (initialPricingMode) return { riderPreference, resolvedMode: initialPricingMode };
  if (isOfficeTaxi) return { riderPreference, resolvedMode: 'TAXI' };
  if (captainPricingMode === 'APP' || isSmartApp) return { riderPreference, resolvedMode: 'APP' };
  if (captainPricingMode === 'FREE') return { riderPreference, resolvedMode: 'FREE' };
  if (isIndependent) return { riderPreference, resolvedMode: 'FREE' };
  return { riderPreference, resolvedMode: 'APP' };
}

export function evaluateProposalBands(params: {
  quote: CaptainOfferQuote | null;
  requestOfferPrice?: number | null;
  finalOfferPrice: number;
  normalizedIncreaseAmount: number;
  normalizedAppPrice: number;
  pricingMode: 'FREE' | 'APP' | 'TAXI' | null;
}) {
  const {
    quote,
    requestOfferPrice,
    finalOfferPrice,
    normalizedIncreaseAmount,
    normalizedAppPrice,
    pricingMode,
  } = params;

  const marketFare = quote?.marketFare ?? Number(requestOfferPrice || 0);
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
    && ((meterDetails.includedKm > 0 && meterDetails.billableKm <= 0) || captainMeterFare === meterDetails.baseFare),
  );

  const bandHeadroom = roundMoney(Math.max(0, ceilingPrice - baseFare));
  const minIncreaseAmount = roundMoney(Math.min(0, floorPrice - baseFare));

  const isAboveBand = ceilingPrice > 0 && finalOfferPrice > ceilingPrice;
  const isTierAmber = isAboveBand || (bandHeadroom > 0 && normalizedIncreaseAmount > bandHeadroom * 0.8);
  const aboveBandPercent = marketFare > 0
    ? Math.round(((finalOfferPrice - marketFare) / marketFare) * 1000) / 10
    : 0;

  const isMeterOffMarket = marketFare > 0 && baseFare > marketFare * 2;

  const marketBrake = marketFare > 0
    ? RadarAntiCheatKernel.enforceMarketBrakes(finalOfferPrice, marketFare)
    : { status: 'NORMAL' as const };
  const isDumpingAmber = marketBrake.status === 'AMBER_WARNING';
  const isDumpingBlocked = (pricingMode !== 'APP' || normalizedAppPrice > 0)
    && (marketBrake.status === 'CRIMSON_BLOCK' || finalOfferPrice < floorPrice);
  const marketDifference = roundMoney(Math.max(0, marketFare - finalOfferPrice));
  const marketDifferencePercent = marketFare > 0
    ? Math.round((marketDifference / marketFare) * 1000) / 10
    : 0;
  const dumpingDeviationRatio = marketFare > 0
    ? Math.max(0, (marketFare - finalOfferPrice) / marketFare)
    : 0;

  const isAmberDeviation = isTierAmber || isDumpingAmber;

  return {
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
    isAboveBand,
    isTierAmber,
    aboveBandPercent,
    isMeterOffMarket,
    isDumpingAmber,
    isDumpingBlocked,
    marketDifference,
    marketDifferencePercent,
    dumpingDeviationRatio,
    isAmberDeviation,
  };
}

