'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ExternalLink, Loader2, Lock, MapPin, Minus, Plus, Send, Sparkles, X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import { useCaptainProfessionalAd } from '../hooks/use-captain-professional-ad';
import { MAX_OFFER_WAIT_SECONDS, MIN_OFFER_WAIT_SECONDS } from '../hooks/use-driver-transactions';
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
  onSubmit: (price: number, waitSeconds: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => void;
  onIgnore: () => void;
}

function toFiniteNumberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function BiddingProposalSheet({
  language,
  request,
  currency,
  driverLocation,
  isSubmitting,
  initialOfferPrice = null,
  initialPricingMode = null,
  captainPricingMode = null,
  onSubmit,
  onIgnore,
}: BiddingProposalSheetProps) {
  const t = useTranslations('captainBidding');
  const pickupT = useTranslations('captainPickup');
  const pickupDistanceKm = driverLocation && request.pickupCoords
    ? estimateHaversineDistanceKm(driverLocation.lat, driverLocation.lng, request.pickupCoords.lat, request.pickupCoords.lng)
    : null;
  const pickupEtaMinutes = estimatePickupMinutes(pickupDistanceKm);
  const [waitSecondsInput, setWaitSecondsInput] = React.useState(String(MIN_OFFER_WAIT_SECONDS));
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

  React.useEffect(() => {
    if (existingOffer && pricingMode === 'FREE') {
      const diff = existingOffer.price - baseFare;
      setIncreaseAmount(diff !== 0 ? roundMoney(diff) : 0);
    } else {
      setIncreaseAmount(0);
    }
    if (existingOffer?.price && (pricingMode === 'APP' || pricingMode === 'TAXI')) {
      setAppPrice(String(existingOffer.price));
    } else if (initialOfferPrice && initialOfferPrice > 0) {
      setAppPrice(String(initialOfferPrice));
    }
    setWaitSecondsInput(String(existingOffer?.wait_seconds || MIN_OFFER_WAIT_SECONDS));
  }, [request.id, existingOffer?.id, baseFare, pricingMode]);

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
  }, [request.id]);

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
  const isDumpingBlocked = marketBrake.status === 'CRIMSON_BLOCK' || finalOfferPrice < floorPrice;
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
        <div>
          <p className={styles.style106_3}>{t('badge')}</p>
          <h1 className={styles.style107_4}>{t('title')}</h1>
          <p className={styles.style108_5}>{t('subtitle')}</p>
        </div>
        <button onClick={onIgnore} className={styles.style110_6} aria-label={t('ignore')}>
          <X className={styles.style111_7} />
        </button>
      </div>

      <div className={styles.style115_8}>
        <p className={styles.style116_9}>{t('destination')}</p>
        <h2 className={styles.style117_10}>{request.dropoff || t('unknownDestination')}</h2>
        
        <div className={styles.style118_11}>
          <Info
            label={t('passengerRatingLabel')}
            value={`${request.riderRating != null ? request.riderRating.toFixed(1) : '5.0'} ⭐️`}
          />
          <Info
            label={t('requestTimeLabel')}
            value={request.createdAt ? new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          />
          <Info
            label={t('tripsCountLabel')}
            value={String(request.riderCompletedTrips || 0)}
          />
          <Info
            label={request.estimatedDistance != null && request.estimatedDistance < 2 ? t('distanceMinimum', { distance: '2.0' }) : t('distanceLabel', { distance: request.estimatedDistance?.toFixed(1) || '0.0' })}
            value={request.estimatedDistance != null ? `${request.estimatedDistance.toFixed(1)} ${language === 'ar' ? 'كيلو' : 'km'}` : pickupT('distanceUnavailable')}
          />
          <Info label={t('pickupTimeLabel', { minutes: pickupEtaMinutes || 0 })} value={pickupT('minutesValue', { count: pickupEtaMinutes })} />
          <Info
            label={t('tripTime')}
            value={request.estimatedTime != null ? pickupT('minutesValue', { count: Math.round(request.estimatedTime) }) : pickupT('distanceUnavailable')}
          />
          <Info
            label={t('pricingPreference')}
            value={
              request.pricingPreference === 'APP' ? (language === 'ar' ? 'حسب تسعيرة التطبيق' : 'App Pricing') :
              request.pricingPreference === 'TAXI' ? (language === 'ar' ? 'حسب عداد التاكسي' : 'Taxi Meter') :
              request.pricingPreference === 'FREE' ? (language === 'ar' ? 'سعر حر' : 'Free Pricing') :
              (language === 'ar' ? 'بدون تحديد (مفتوح)' : 'No Preference')
            }
          />
          {/* Base fare display disabled — kept hidden from captain by product request.
              This now holds the captain's own meter reading rather than the server fare,
              but the product decision to hide it stands; the captain sees their price in
              the offer input, and the rank ceiling is shown separately below.
          <Info label={t('serverFare')} value={`${baseFare.toFixed(2)} ${currency}`} />
          */}
        </div>
      </div>

      <div className={styles.pickupCard}>
        <div className={styles.pickupCardRow}>
          <div className={styles.pickupCardInfo}>
            <p className={styles.pickupCardLabel}>
              <MapPin className={styles.pickupCardIcon} aria-hidden="true" />
              {pickupT('pickupLocation')}
            </p>
            <p className={styles.pickupCardValue}>
              {request.pickupLabel || pickupT('pickupLocation')}
            </p>
            <p className={styles.pickupCardHint}>
              {request.pickupLocationIsApproximate ? pickupT('pickupApproximate') : pickupT('pickupExact')}
            </p>
          </div>
          {request.pickupGoogleMapsUrl ? (
            <a
              href={request.pickupGoogleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.pickupCardLink}
            >
              <ExternalLink className={styles.pickupCardLinkIcon} aria-hidden="true" />
              {pickupT('openPickupMap')}
            </a>
          ) : null}
        </div>
      </div>

      <div className={styles.style125_12}>
        <div className={styles.style126_13}>
          <div>
            <p className={styles.style128_14}>
              <Sparkles className={styles.style129_15} />
              {t('tierPremium')}
            </p>
            {/* States the rank's OWN range and the warning line separately. Quoting one
                number for both is what let the panel promise "زيادة من 1 إلى 15%" while
                showing "أقصى زيادة مسموحة 0.00" right beside it. */}
            <p className={styles.style132_16}>
              {rankIncreaseFactor > 0
                ? t('tierPremiumDescription', {
                    tier: tierLabel,
                    rankPercent: Math.round(rankIncreaseFactor * 100),
                    warnPercent: Math.round(premiumFactor * 100),
                  })
                : t('noTierPremium', {
                    tier: tierLabel,
                    warnPercent: Math.round(premiumFactor * 100),
                  })}
            </p>
          </div>

        <div className={styles.style141_17}>
            <p className={styles.style142_18}>{t('maxIncrease')}</p>
            <p className={styles.style143_19}>{bandHeadroom.toFixed(2)} {currency}</p>
          </div>
        </div>

        <div className={styles.pricingModeContainer}>
          {riderPreference ? (
            <div className={styles.riderPrefBadge}>
              <Lock className={styles.riderPrefIcon} />
              <span>
                {language === 'ar'
                  ? `نمط المحاسبة محدد بواسطة الراكب: ${
                      riderPreference === 'APP' ? 'تسعيرة التطبيق' :
                      riderPreference === 'TAXI' ? 'عداد التاكسي' : 'سعر حر'
                    }`
                  : `Pricing mode locked by rider: ${
                      riderPreference === 'APP' ? 'App Price' :
                      riderPreference === 'TAXI' ? 'Taxi Meter' : 'Free Price'
                    }`}
              </span>
            </div>
          ) : (
            <div className={styles.noPrefBadge}>
              <Sparkles className={styles.noPrefIcon} />
              <span>
                {language === 'ar'
                  ? 'الراكب لم يحدد نمط محاسبة — اختر النمط الأنسب لك'
                  : 'Rider specified no preference — select your preferred mode'}
              </span>
            </div>
          )}
          <div className={styles.pricingButtonsGrid}>
            <button
              type="button"
              disabled={!!riderPreference}
              onClick={() => setPricingMode('FREE')}
              className={cn(
                styles.pricingBtnBase,
                pricingMode === 'FREE'
                  ? styles.pricingBtnActive
                  : styles.pricingBtnInactive,
                riderPreference && riderPreference !== 'FREE' && styles.pricingBtnDisabled
              )}
            >
              {language === 'ar' ? 'سعر حر' : 'Free Price'}
            </button>
            <button
              type="button"
              disabled={!!riderPreference}
              onClick={() => setPricingMode('APP')}
              className={cn(
                styles.pricingBtnBase,
                pricingMode === 'APP'
                  ? styles.pricingBtnActive
                  : styles.pricingBtnInactive,
                riderPreference && riderPreference !== 'APP' && styles.pricingBtnDisabled
              )}
            >
              {language === 'ar' ? 'سعر تطبيق' : 'App Price'}
            </button>
            <button
              type="button"
              disabled={!!riderPreference}
              onClick={() => setPricingMode('TAXI')}
              className={cn(
                styles.pricingBtnBase,
                pricingMode === 'TAXI'
                  ? styles.pricingBtnActive
                  : styles.pricingBtnInactive,
                riderPreference && riderPreference !== 'TAXI' && styles.pricingBtnDisabled
              )}
            >
              {language === 'ar' ? 'سعر تكسي' : 'Taxi Price'}
            </button>
          </div>
        </div>

        {pricingMode === 'FREE' && (
          <div className={styles.freeModeNotice}>
            {t('companyPriceNotice')}
          </div>
        )}

        {pricingMode === 'APP' && (
          <div className={styles.appModeContainer}>
            <p className={styles.appModeTitle}>{t('appModeInputNotice')}</p>
            <p className={styles.appModeHint}>{t('appModeInputHint')}</p>
            <input
              type="number"
              inputMode="decimal"
              value={appPrice}
              onChange={(e) => setAppPrice(e.target.value)}
              className={styles.appModeInput}
              placeholder="0.00"
              autoFocus
            />
          </div>
        )}

        {pricingMode === 'TAXI' && (
          <div className={styles.taxiModeContainer}>
            <div className={styles.taxiModeNotice}>
              🚕 {t('taxiModeNotice')}
            </div>
            <p className={styles.taxiModeHint}>
              {language === 'ar'
                ? 'أدخل سعر العداد المعتمد للمشوار أو اعتمد السعر المحسوب:'
                : 'Enter approved meter fare or keep calculated fare:'}
            </p>
            <input
              type="number"
              step="0.01"
              min="0.1"
              inputMode="decimal"
              value={appPrice}
              onChange={(e) => setAppPrice(e.target.value)}
              className={styles.taxiModeInput}
              placeholder={baseFare > 0 ? baseFare.toFixed(2) : '0.00'}
              autoFocus
            />
          </div>
        )}

        {pricingMode === 'FREE' && (
          <>
            {/* Every number spelled out, and labelled with WHERE it comes from. Three figures
                from two different scales — the captain's own meter and the market average — were
                being shown side by side with nothing saying which was which, so
                "أعلى سعر بدون تنبيه: 60.35" sat next to a base fare of 650.00 and read as a
                contradiction rather than as two different measurements. */}
            <div className={styles.meterDetails}>
              <div className={styles.meterDetailsHeader}>
                <p className={styles.meterDetailsTitle}>{t('meterCalculationTitle')}</p>
                {isCoveredInBaseFare ? (
                  <span className={styles.meterBadgeCovered}>
                    {language === 'ar' ? 'مشمول بفتحة العداد' : 'Covered in Base Fare'}
                  </span>
                ) : null}
              </div>
              {isCoveredInBaseFare ? (
                <p className={styles.meterDetailsHint}>
                  {language === 'ar'
                    ? `مسافة الرحلة مشمولة بالكامل ضمن فتحة العداد (${(meterDetails?.baseFare ?? baseFare).toFixed(2)} ${currency}) دون تكلفة مسافة إضافية.`
                    : `Trip distance is fully covered by your base fare (${(meterDetails?.baseFare ?? baseFare).toFixed(2)} ${currency}).`}
                </p>
              ) : meterDetails ? (
                <p className={styles.meterDetailsHint}>
                  {language === 'ar'
                    ? `محسوب حسب تعريفتك: مسافة ${meterDetails.roadKm.toFixed(1)} كم${meterDetails.includedKm > 0 ? ` (مشمول ${meterDetails.includedKm.toFixed(1)} كم)` : ''} • مدة ${Math.round(meterDetails.estimatedMinutes)} دقيقة`
                    : `Calculated from your tariff: ${meterDetails.roadKm.toFixed(1)} km${meterDetails.includedKm > 0 ? ` (${meterDetails.includedKm.toFixed(1)} km included)` : ''} • ${Math.round(meterDetails.estimatedMinutes)} min`}
                </p>
              ) : (
                <p className={styles.meterDetailsHint}>{t('meterCalculationSource')}</p>
              )}
            </div>

        <dl className={styles.breakdownList}>
          <div className={styles.breakdownRow}>
            <dt className={styles.breakdownLabel}>{t('breakdownMeter')}</dt>
            <dd dir="ltr" className={styles.breakdownValue}>{captainMeterFare.toFixed(2)} {currency}</dd>
          </div>
          <div className={styles.breakdownRow}>
            <dt className={styles.breakdownLabel}>{t('breakdownMarket')}</dt>
            <dd dir="ltr" className={styles.breakdownValue}>
              {marketFare > 0 ? `${marketFare.toFixed(2)} ${currency}` : t('breakdownMarketUnknown')}
            </dd>
          </div>
          <div className={styles.breakdownRow}>
            <dt className={styles.breakdownLabel}>
              {t('breakdownWarnLine', { percent: Math.round(premiumFactor * 100) })}
            </dt>
            <dd dir="ltr" className={styles.breakdownValue}>{ceilingPrice.toFixed(2)} {currency}</dd>
          </div>
          <div className={styles.breakdownRow}>
            <dt className={styles.breakdownLabel}>{t('breakdownFloor')}</dt>
            <dd dir="ltr" className={styles.breakdownValue}>{floorPrice.toFixed(2)} {currency}</dd>
          </div>
          {normalizedIncreaseAmount !== 0 && (
            <div className={cn(styles.breakdownRow, styles.breakdownRowAccent)}>
              <dt className={styles.breakdownLabel}>{t('breakdownYourIncrease')}</dt>
              <dd dir="ltr" className={styles.breakdownValue}>
                {normalizedIncreaseAmount >= 0 ? '+' : '−'}{Math.abs(normalizedIncreaseAmount).toFixed(2)} {currency}
              </dd>
            </div>
          )}
        </dl>

        {/* The meter can sit far outside the band when the market average is built from too
            few captains. Saying so is more use than a percentage in the thousands. */}
        {isMeterOffMarket ? (
          <p className={styles.aboveBandWarning}>
            {t('meterOffMarket', {
              meter: baseFare.toFixed(2),
              market: marketFare.toFixed(2),
              currency,
            })}
          </p>
        ) : null}

        {bandHeadroom > 0 ? (
          <button
            type="button"
            onClick={() => setIncreaseAmount(bandHeadroom)}
            className={styles.style156_21}
          >
            {t('applyMaxIncrease')}
          </button>
        ) : null}

        {isAboveBand && !isMeterOffMarket ? (
          <p className={styles.aboveBandWarning}>
            {t('aboveBandWarning', {
              percent: aboveBandPercent,
              limit: Math.round(premiumFactor * 100),
            })}
          </p>
        ) : null}
          </>
        )}
      </div>

      {pricingMode !== null && (
        <div className={styles.style163_22}>
          {/* Always rendered. This was gated on `canIncrease`, which was derived from the
              band — so on any trip where the meter already sat at or above the band the
              entire increase control disappeared and the captain had no way to raise a price
              they are entitled to raise without limit. */}
        {pricingMode === 'FREE' && (
          <>
            <label className={styles.style164_23}>{t('increaseAmount')}</label>
              <div className={styles.style165_24}>
                <button
                  type="button"
                  onClick={() => setIncreaseAmount((value) => Math.max(minIncreaseAmount, roundMoney((Number(value) || 0) - step)))}
                  disabled={isMinusDisabled}
                  className={cn(styles.style169_25, isMinusDisabled ? styles.inputLocked : '')}
                >
                  <Minus className={styles.style171_26} />
                </button>
                <input
                  value={increaseAmount.toString()}
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                      setIncreaseAmount(val);
                    }
                  }}
                  inputMode="decimal"
                  className={styles.style177_27}
                />
                <button
                  type="button"
                  onClick={() => setIncreaseAmount((value) => roundMoney((Number(value) || 0) + step))}
                  disabled={isPlusDisabled}
                  className={cn(styles.style182_28, isPlusDisabled ? styles.inputLocked : '')}
                >
                  <Plus className={styles.style184_29} />
                </button>
              </div>
          </>
        )}
        <div className={styles.style187_30}>
          <div className={styles.style188_31}>
            <span className={styles.style189_32}>{t('finalOffer')}</span>
            <strong className={styles.style190_33}>{finalOfferPrice.toFixed(2)} {currency}</strong>
          </div>
          <p className={styles.style192_34}>
            {normalizedIncreaseAmount === 0
              ? (language === 'ar' ? 'مطابق لسعر العداد المحسوب' : 'Matches calculated meter fare')
              : (language === 'ar'
                  ? `يشمل ${normalizedIncreaseAmount > 0 ? 'زيادة' : 'خصم'} ${Math.abs(normalizedIncreaseAmount).toFixed(2)} ${currency} على سعر العداد (${captainMeterFare.toFixed(2)} ${currency})`
                  : `Includes ${normalizedIncreaseAmount > 0 ? '+' : '−'}${Math.abs(normalizedIncreaseAmount).toFixed(2)} ${currency} adjustment on meter (${captainMeterFare.toFixed(2)} ${currency})`)}
          </p>
        </div>

        {isTierAmber && !isAboveBand ? (
          <div className={styles.style201_35}>
            <AlertTriangle className={styles.style202_36} />
            {t('tierAmberWarning', { limit: Math.round(premiumFactor * 100) })}
          </div>
        ) : null}

        {/* The old crimson "tier ceiling exceeded" block is gone: above the band is a
            warning now, rendered as the amber notice in the premium panel above, and the
            submit button stays enabled. Only the dumping floor still blocks. */}

        {isDumpingAmber ? (
          <div className={styles.style201_35}>
            <AlertTriangle className={styles.style202_36} />
            {t('dumpingAmberCalculationWarning', {
              offer: finalOfferPrice.toFixed(2),
              market: marketFare.toFixed(2),
              difference: marketDifference.toFixed(2),
              percent: marketDifferencePercent,
              currency,
            })}
          </div>
        ) : null}

        {isDumpingBlocked ? (
          <div className={styles.style208_37}>
            <AlertTriangle className={styles.style209_38} />
            {t('dumpingCrimsonBlock')}
          </div>
        ) : null}

        <div className={styles.style163_22}>
          <label className={styles.style164_23}>{t('waitSecondsLabel')}</label>
          <div className={styles.style165_24}>
            <button
              type="button"
              onClick={() => setWaitSecondsInput((current) => {
                const value = Number(current);
                const next = (Number.isFinite(value) ? value : MIN_OFFER_WAIT_SECONDS) - 1;
                return String(Math.max(MIN_OFFER_WAIT_SECONDS, next));
              })}
              disabled={parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS}
              className={cn(styles.style169_25, parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS ? styles.inputLocked : '')}
            >
              <Minus className={styles.style171_26} />
            </button>
            <input
              value={waitSecondsInput}
              onChange={(event) => setWaitSecondsInput(event.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              className={styles.style177_27}
            />
            <button
              type="button"
              onClick={() => setWaitSecondsInput((current) => {
                const value = Number(current);
                const next = (Number.isFinite(value) ? value : MIN_OFFER_WAIT_SECONDS) + 1;
                // Clamped both ways. This button had no ceiling, so holding it walked the
                // window into the thousands of seconds and the rider was shown an offer that
                // stayed live for over an hour.
                return String(Math.min(MAX_OFFER_WAIT_SECONDS, Math.max(MIN_OFFER_WAIT_SECONDS, next)));
              })}
              disabled={parsedWaitSeconds >= MAX_OFFER_WAIT_SECONDS}
              className={cn(styles.style182_28, parsedWaitSeconds >= MAX_OFFER_WAIT_SECONDS ? styles.inputLocked : '')}
            >
              <Plus className={styles.style184_29} />
            </button>
          </div>
          <p className={styles.style192_34}>{t('waitSecondsHint')}</p>
          {!isWaitSecondsValid ? (
            <div className={styles.style208_37}>
              <AlertTriangle className={styles.style209_38} />
              {t('waitSecondsRange', { min: MIN_OFFER_WAIT_SECONDS, max: MAX_OFFER_WAIT_SECONDS })}
            </div>
          ) : null}
        </div>

        {isDumpingBlocked && professionalAd ? (
          <AdDisplayCard
            ad={professionalAd}
            showHeart={false}
            badgeText={t('professionalAdBadge')}
            ctaText={professionalAd.buttonText}
            className={styles.professionalAdCard}
            onOpen={(event: React.MouseEvent) => {
              event.stopPropagation();
              window.open(professionalAd.actionUrl, '_blank');
            }}
          />
        ) : null}
        </div>
      )}

      <div className={styles.style215_39}>
        <span
          className={styles.submitWrap}
          title={!isWaitSecondsValid ? t('waitSecondsRange', { min: MIN_OFFER_WAIT_SECONDS, max: MAX_OFFER_WAIT_SECONDS }) : undefined}
        >
          <button
            onClick={() => onSubmit(finalOfferPrice, parsedWaitSeconds, pricingMode || undefined)}
            disabled={!canSubmit}
            className={styles.style219_40}
          >
            {isSubmitting ? <Loader2 className={styles.style221_41} /> : <Send className={styles.style221_42} />}
            {existingOffer ? (language === 'ar' ? 'تحديث العرض' : 'Update offer') : t('submit')}
          </button>
        </span>
        <button onClick={onIgnore} className={styles.style224_43}>
          {t('ignore')}
        </button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.style234_44}>
      <p className={styles.style235_45}>{label}</p>
      <p className={styles.style236_46}>{value}</p>
    </div>
  );
}

/**
 * How far above the server reference fare this rank may bid.
 *
 * Both numbers now live in ../services/offer-band.ts, next to the test that pins them
 * against the migration. They were business rules sitting in a component file.
 */

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

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
