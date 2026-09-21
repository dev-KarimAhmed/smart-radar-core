'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ExternalLink, Loader2, Lock, MapPin, Minus, Pencil, Plus, Send, Sparkles, X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import { useCaptainProfessionalAd } from '../hooks/use-captain-professional-ad';
import { usePricePerKmSetup } from '../hooks/use-price-per-km-setup';
import { DEFAULT_OFFER_WAIT_SECONDS, MAX_OFFER_WAIT_SECONDS, MIN_OFFER_WAIT_SECONDS } from '../hooks/use-driver-transactions';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { cn } from '@/lib/utils';
import { estimateHaversineDistanceKm } from '../services/ride-location';
import { estimatePickupMinutes } from '@/shared/services/trip-duration';
import {
  MARKET_FLOOR_FACTOR,
  rankIncreaseFactorForTier,
  warnFactorForTier,
  type CaptainTier,
} from '../services/offer-band';
import { BiddingTripSummary } from './bidding/bidding-trip-summary';
import { BiddingTariffComparison } from './bidding/bidding-tariff-comparison';
import { BiddingPricingSelector } from './bidding/bidding-pricing-selector';
import { BiddingOfferStepper } from './bidding/bidding-offer-stepper';

const styles = {
  style103_1: "mx-auto max-w-3xl rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5 text-white shadow-2xl",
  style104_2: "flex items-start justify-between gap-4",
  style106_3: "text-xs font-black text-[#14B8A6]",
  style107_4: "mt-1 text-2xl font-black",
  style108_5: "mt-2 text-sm leading-6 text-slate-400",
  style110_6: "rounded-2xl border border-white/10 p-3 text-slate-300 hover:bg-white/10",
  style111_7: "h-5 w-5",
  style115_8: "mt-5 rounded-2xl border border-slate-800 bg-black/45 p-4",
  style116_9: "text-xs text-slate-400",
  style117_10: "mt-1 text-xl font-black",
  style118_11: "mt-4 grid grid-cols-2 gap-2",
  style125_12: "mt-5 rounded-2xl border border-[#14B8A6]/20 bg-[#0B2A2A]/25 p-4",
  style126_13: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  style128_14: "inline-flex items-center gap-2 text-sm font-black text-[#14B8A6]",
  style129_15: "h-4 w-4",
  style132_16: "mt-2 text-sm leading-6 text-slate-300",
  style141_17: "rounded-2xl border border-white/10 bg-black/35 p-3 text-start sm:min-w-48",
  style142_18: "text-xs font-bold text-slate-400",
  style143_19: "mt-1 text-xl font-black text-white",
  style145_20: "mt-1 text-xs font-bold text-[#14B8A6]",
  style156_21: "mt-3 rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-4 py-3 text-sm font-black text-[#5eead4] hover:bg-[#14B8A6]/15",
  aboveBandWarning: "mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-amber-200",
  breakdownList: "mt-3 divide-y divide-white/5 rounded-2xl border border-white/10 bg-black/25 px-3.5",
  breakdownRow: "flex items-center justify-between gap-3 py-2.5",
  breakdownRowAccent: "font-black text-[#5eead4]",
  breakdownLabel: "min-w-0 flex-1 text-[11px] font-medium leading-tight text-slate-400",
  breakdownValue: "shrink-0 font-mono text-xs font-bold text-slate-100",
  meterDetails: "mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-3",
  meterDetailsHeader: "flex items-center justify-between gap-2",
  meterDetailsTitle: "text-sm font-black text-cyan-200",
  meterBadgeCovered: "rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300",
  meterDetailsHint: "mt-1 text-xs leading-5 text-slate-300",
  meterFormula: "mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs font-bold leading-6 text-slate-200 text-center font-mono tracking-wide",
  meterDetailsRoute: "mt-2 text-[11px] leading-5 text-slate-400",
  pricingModeContainer: "mt-4 space-y-2",
  riderPrefBadge: "flex items-center gap-2 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 px-3 py-2 text-xs font-bold text-[#5eead4]",
  riderPrefIcon: "h-4 w-4 shrink-0 text-[#14B8A6]",
  noPrefBadge: "flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300",
  noPrefIcon: "h-4 w-4 shrink-0 text-cyan-400",
  pricingButtonsGrid: "grid grid-cols-3 gap-2",
  pricingBtnBase: "rounded-xl border border-white/10 p-2.5 text-xs font-bold transition sm:p-3 sm:text-sm",
  pricingBtnActive: "bg-[#14B8A6] text-[#06111f] ring-2 ring-[#14B8A6]/50",
  pricingBtnInactive: "bg-black/30 text-slate-300 hover:bg-white/10",
  pricingBtnDisabled: "opacity-35 cursor-not-allowed grayscale border-white/5 bg-black/20 text-slate-500",
  freeModeNotice: "mt-4 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 p-3 text-sm font-bold text-[#5eead4]",
  appModeContainer: "mt-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm font-bold text-blue-200",
  appModeTitle: "mb-3",
  appModeHint: "mb-2 text-xs font-normal text-blue-300",
  appModeInput: "w-full rounded-xl border border-blue-400/30 bg-black/40 p-3 text-lg font-black text-white outline-none focus:border-blue-400",
  taxiModeNotice: "mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm font-bold text-amber-200",
  taxiModeContainer: "mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm font-bold text-amber-200",
  taxiModeHint: "mt-2 mb-2 text-xs font-normal text-amber-300/80",
  taxiModeInput: "w-full rounded-xl border border-amber-400/30 bg-black/40 p-3 text-lg font-black text-amber-100 outline-none focus:border-amber-400",
  style163_22: "mt-5 rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4",
  style164_23: "text-sm font-black text-emerald-200",
  style165_24: "mt-3 flex items-center gap-3",
  style169_25: "rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10",
  style171_26: "h-5 w-5",
  style177_27: "min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black px-4 py-4 text-center text-2xl font-black text-white outline-none focus:border-emerald-400",
  style182_28: "rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10",
  style184_29: "h-5 w-5",
  style187_30: "mt-3 rounded-2xl border border-white/10 bg-black/30 p-3",
  style188_31: "flex items-center justify-between gap-3 text-sm",
  style189_32: "font-bold text-slate-400",
  style190_33: "text-xl font-black text-white",
  style192_34: "mt-1 text-xs text-slate-500",
  style201_35: "mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3 text-sm font-bold text-amber-200",
  style202_36: "mt-0.5 h-4 w-4 shrink-0",
  style208_37: "mt-3 flex items-start gap-2 rounded-2xl border border-red-500/45 bg-red-500/10 p-3 text-sm font-bold text-red-200",
  style209_38: "mt-0.5 h-4 w-4 shrink-0",
  style215_39: "mt-5 flex flex-col gap-3 sm:flex-row",
  style219_40: "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:cursor-not-allowed disabled:opacity-60",
  style221_41: "h-5 w-5 animate-spin",
  style221_42: "h-5 w-5",
  style224_43: "rounded-2xl border border-white/10 px-5 py-4 font-bold text-slate-300 hover:bg-white/10",
  style234_44: "rounded-xl border border-white/10 bg-white/[0.03] p-3",
  style235_45: "text-xs text-slate-500",
  style236_46: "mt-1 font-black text-white",
  inputLocked: "cursor-not-allowed opacity-50",
  pickupCard: "mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4",
  pickupCardRow: "flex items-start justify-between gap-3",
  pickupCardInfo: "min-w-0",
  pickupCardLabel: "flex items-center gap-1.5 text-xs font-black text-cyan-200",
  pickupCardIcon: "h-4 w-4",
  pickupCardValue: "mt-1 truncate text-sm font-black text-white",
  pickupCardHint: "mt-1 text-xs text-slate-400",
  pickupCardLink: "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cyan-400/25 px-3 py-2 text-xs font-black text-cyan-200 transition hover:border-cyan-300 hover:text-white",
  pickupCardLinkIcon: "h-3.5 w-3.5",
  submitWrap: "flex flex-1",
  professionalAdCard: "mt-3 h-[280px] rounded-[28px]",
} as const;

/** Mirrors what public.captain_offer_quote returns. */
type CaptainOfferQuote = {
  /** What this captain's own tariff makes the trip cost. */
  captainFare: number;
  /** The market average reference the band is drawn around. */
  marketFare: number | null;
  floorPrice: number | null;
  ceilingPrice: number | null;
  /** captainFare clamped into the band — what the sheet opens with. */
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

interface BiddingProposalSheetProps {
  language: 'ar' | 'en';
  request: Trip;
  currency: string;
  /** For the "time to reach the rider" estimate — the captain's own live position. */
  driverLocation: { lat: number; lng: number } | null;
  isSubmitting: boolean;
  initialOfferPrice?: number | null;
  initialPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  captainPricingMode?: 'FREE' | 'APP' | null;
  currentTariff?: {
    baseFare: number | null;
    pricePerKm: number | null;
    pricePerMin: number | null;
    includedKm?: number;
    pricingMode?: 'FREE' | 'APP' | null;
    marketAverage?: any;
  } | null;
  onEditTariff?: () => void;
  onSubmit: (price: number, waitSeconds: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => void;
  onIgnore: () => void;
}

function toFiniteNumberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export  Legacy({
  language,
  request,
  currency,
  driverLocation,
  isSubmitting,
  initialOfferPrice = null,
  initialPricingMode = null,
  captainPricingMode = null,
  currentTariff: currentTariffProp,
  onEditTariff,
  onSubmit,
  onIgnore,
}: BiddingProposalSheetProps) {
  const t = useTranslations('captainBidding');
  const pickupT = useTranslations('captainPickup');
  const tAuto = useTranslations('auto');
  const pickupDistanceKm = driverLocation && request.pickupCoords
    ? estimateHaversineDistanceKm(driverLocation.lat, driverLocation.lng, request.pickupCoords.lat, request.pickupCoords.lng)
    : null;
  const pickupEtaMinutes = estimatePickupMinutes(pickupDistanceKm);
  const [waitSecondsInput, setWaitSecondsInput] = React.useState(String(DEFAULT_OFFER_WAIT_SECONDS));
  const parsedWaitSeconds = Number(waitSecondsInput);
  const isWaitSecondsValid = Number.isInteger(parsedWaitSeconds)
    && parsedWaitSeconds >= MIN_OFFER_WAIT_SECONDS
    && parsedWaitSeconds <= MAX_OFFER_WAIT_SECONDS;
  const [quote, setQuote] = React.useState<CaptainOfferQuote | null>(null);

  const { user } = useAuth();
  const existingOffer = React.useMemo(() => request.offers?.find(o => o.driverId === user?.uid), [request.offers, user?.uid]);
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

  // The sheet opens on the captain's OWN meter reading — base_fare + km + minutes from the
  // tariff they set for themselves — not on the market reference. The market average only
  // defines the band the offer has to land in. Until the quote arrives, fall back to the
  // request's reference fare so the sheet is never blank.
  const marketFare = quote?.marketFare ?? Number(request.offerPrice || 0);
  const baseFare = quote?.suggestedFare ?? marketFare;
  const tier = quote?.tier ?? 'SILVER';
  // What the rank grants (shown as the captain's range) vs. where the warning starts.
  const rankIncreaseFactor = rankIncreaseFactorForTier(tier);
  const premiumFactor = warnFactorForTier(tier);
  const tierLabel = t(`tierLabels.${tier}`);

  // Band edges come from the server so the sheet can never offer a price the RPC refuses.
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
  /**
   * Room to add WITHOUT tripping the warning, measured from the captain's own meter.
   *
   * Legitimately 0 whenever the meter already sits at or above the market band — which is
   * the normal case when the market sample is thin, and is why this used to read
   * "أقصى زيادة مسموحة: 0.00". It is a statement about the warning line, NOT a limit.
   */
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

  React.useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!request.id) return;

      const { data, error } = await supabase.rpc('captain_offer_quote', {
        p_request_id: request.id,
      });

      if (cancelled) return;
      if (error) {
        // captain_tariff_required means the mandatory setup modal is still owed; the sheet
        // stays on the reference fare rather than showing nothing.
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Captain offer quote]', error);
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
        tier: normalizeCaptainTier(row.tier, 5, tAuto),
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

  // The +15% band edge. It is a WARNING line, not a wall: past it the panel goes amber and
  // says so, and the captain can still submit. Rank has no bearing on it — every rank gets
  // the same ±15% (see 20260901090000_flat_offer_band_warn_above.sql).
  const isAboveBand = ceilingPrice > 0 && finalOfferPrice > ceilingPrice;
  const isTierAmber = isAboveBand
    || (bandHeadroom > 0 && normalizedIncreaseAmount > bandHeadroom * 0.8);
  const aboveBandPercent = marketFare > 0
    ? Math.round(((finalOfferPrice - marketFare) / marketFare) * 1000) / 10
    : 0;
  /**
   * The captain's OWN meter is already wildly outside the market band, before they add
   * anything. That is a market-data problem (too few captains priced in this area for the
   * average to mean anything), not a decision the captain made, so it gets its own plain
   * message instead of a deviation percentage in the thousands — the sheet was reporting
   * "+1780.9%" against a market average of 52.48 while the meter read 650.00.
   */
  const isMeterOffMarket = marketFare > 0 && baseFare > marketFare * 2;

  // Fare_test anti-dumping brake, measured against the market average (10% amber, 15%
  // crimson from RadarAntiCheatKernel.enforceMarketBrakes) — the same 15% floor
  // submit_ride_offer enforces server-side.
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
  // Only the FLOOR blocks now. Going above the market band is the captain's call to make.
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

  // The captain raises their price as far as they want. There is NO cap: not the band, not
  // the rank, not a stepper bound. Every previous version of this line locked "+" at some
  // number and that is what made the control feel broken.
  const isPlusDisabled = pricingMode === 'TAXI' || (pricingMode === 'APP' && isOfficeTaxi) || pricingMode === null;
  // "-" is the only direction with a wall, and only once the offer is already at the
  // anti-dumping floor — the one rule the server still refuses.
  const isMinusDisabled = pricingMode === 'TAXI' || (pricingMode === 'APP' && isOfficeTaxi) || pricingMode === null || (isDumpingBlocked && normalizedIncreaseAmount <= minIncreaseAmount);

  return (
    <section className={styles.style103_1}>
      <div className={styles.style104_2}>
        <div className="flex-1">
          <p className={styles.style106_3}>{t('badge')}</p>
          <div className="mt-1 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-black">{t('title')}</h1>
            <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400">{t('requestTimeLabel')}</span>
              <span className="text-sm font-black tracking-wide text-slate-100" dir="ltr">
                {request.createdAt ? new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>
          </div>
          <p className={styles.style108_5}>{t('subtitle')}</p>
        </div>
        <button onClick={onIgnore} className={styles.style110_6} aria-label={t('ignore')}>
          <X className={styles.style111_7} />
        </button>
      </div>

      <BiddingTripSummary
        request={request}
        language={language}
        pickupEtaMinutes={pickupEtaMinutes}
      />

      <div className={styles.style125_12}>
        <BiddingTariffComparison
          language={language}
          currency={currency}
          tierLabel={tierLabel}
          rankIncreaseFactor={rankIncreaseFactor}
          premiumFactor={premiumFactor}
          bandHeadroom={bandHeadroom}
          isGoldOrPlatinum={isGoldOrPlatinum}
          isSilver={isSilver}
          isWithinBaseFare={isWithinBaseFare}
          marketBaseFare={marketBaseFare}
          marketPerKm={marketPerKm}
          marketPerMin={marketPerMin}
          currentBaseFare={currentBaseFare}
          currentPerKm={currentPerKm}
          currentPerMin={currentPerMin}
          offerBaseFare={offerBaseFare}
          offerPerKm={offerPerKm}
          offerPerMin={offerPerMin}
          isDumpingAmber={isDumpingAmber}
          dumpingDeviationRatio={dumpingDeviationRatio}
          riderPreference={riderPreference}
          pricingMode={pricingMode}
          setPricingMode={setPricingMode}
          onEditTariff={onEditTariff}
        />
        <BiddingPricingSelector
          language={language}
          currency={currency}
          pricingMode={pricingMode}
          appPrice={appPrice}
          setAppPrice={setAppPrice}
          marketFare={marketFare}
          baseFare={baseFare}
          isCoveredInBaseFare={isCoveredInBaseFare}
          meterDetails={meterDetails}
          captainMeterFare={captainMeterFare}
          premiumFactor={premiumFactor}
          ceilingPrice={ceilingPrice}
          floorPrice={floorPrice}
          MARKET_FLOOR_FACTOR={MARKET_FLOOR_FACTOR}
          normalizedIncreaseAmount={normalizedIncreaseAmount}
          isMeterOffMarket={isMeterOffMarket}
          bandHeadroom={bandHeadroom}
          setIncreaseAmount={setIncreaseAmount}
          isAboveBand={isAboveBand}
          aboveBandPercent={aboveBandPercent}
        />
      </div>

      <BiddingOfferStepper
        language={language}
        currency={currency}
        pricingMode={pricingMode}
        appPrice={appPrice}
        setAppPrice={setAppPrice}
        increaseAmount={increaseAmount}
        setIncreaseAmount={setIncreaseAmount}
        minIncreaseAmount={minIncreaseAmount}
        step={step}
        isMinusDisabled={isMinusDisabled}
        isPlusDisabled={isPlusDisabled}
        finalOfferPrice={finalOfferPrice}
        normalizedAppPrice={normalizedAppPrice}
        baseFare={baseFare}
        normalizedIncreaseAmount={normalizedIncreaseAmount}
        isTierAmber={isTierAmber}
        isAboveBand={isAboveBand}
        premiumFactor={premiumFactor}
        isDumpingAmber={isDumpingAmber}
        marketFare={marketFare}
        marketDifference={marketDifference}
        marketDifferencePercent={marketDifferencePercent}
        isDumpingBlocked={isDumpingBlocked}
        professionalAd={professionalAd}
        MARKET_FLOOR_FACTOR={MARKET_FLOOR_FACTOR}
        floorPrice={floorPrice}
        handleApplyFloorPrice={handleApplyFloorPrice}
        waitSecondsInput={waitSecondsInput}
        setWaitSecondsInput={setWaitSecondsInput}
        MIN_OFFER_WAIT_SECONDS={MIN_OFFER_WAIT_SECONDS}
        DEFAULT_OFFER_WAIT_SECONDS={DEFAULT_OFFER_WAIT_SECONDS}
        MAX_OFFER_WAIT_SECONDS={MAX_OFFER_WAIT_SECONDS}
        parsedWaitSeconds={parsedWaitSeconds}
        isWaitSecondsValid={isWaitSecondsValid}
        onSubmit={onSubmit}
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        existingOffer={existingOffer}
        onIgnore={onIgnore}
        roundMoney={roundMoney}
        isSmartApp={isSmartApp}
      />
    </section>
  );
}



function normalizeCaptainTier(value: unknown, rating = 5, tAuto: any): CaptainTier {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.includes('PLATINUM') || normalized.includes(tAuto('key_282a0db1'))) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes(tAuto('key_fa5d054b'))) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes(tAuto('key_141a4400'))) return 'BRONZE';
  if (normalized.includes('SILVER') || normalized.includes(tAuto('key_8c7402b2'))) return 'SILVER';
  if (rating >= 4.9) return 'PLATINUM';
  if (rating >= 4.7) return 'GOLD';
  if (rating >= 4.4) return 'SILVER';
  return 'BRONZE';
}

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
