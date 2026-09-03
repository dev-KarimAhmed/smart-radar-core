'use client';

import React from 'react';
import {
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Facebook,
  Heart,
  Instagram,
  MapPin,
  Milestone,
  Navigation,
  Phone,
  Route,
  ShieldCheck,
  Star,
  Timer,
  Trophy,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { resolveColorDisplayName } from '@/shared/services/color-name';
import { preferRoutedMinutes } from '@/shared/services/trip-duration';
import { formatCountdown } from '@/shared/services/trip-countdown';
const styles = {
  style136_1: "group overflow-hidden rounded-2xl border bg-[#161F30]/80 text-[#F8FAFC] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-[#14B8A6]",
  style137_2: "border-emerald-300/70 shadow-[0_0_34px_rgba(20,184,166,0.18)]",
  style137_3: "border-[#243249]",
  style146_5: "flex min-w-0 flex-1 items-center gap-3",
  style148_6: "min-w-0",
  style149_7: "flex flex-wrap items-center gap-x-2 gap-y-1",
  style150_8: "min-w-0 max-w-full truncate text-lg font-extrabold text-[#F8FAFC] sm:text-xl",
  // --- Collapsed face -------------------------------------------------------
  // The rider compares offers on price, arrival and duration. All three used to live behind
  // the expand chevron, so the closed card showed a name, a rank and a raw seconds counter
  // — nothing to actually choose on — and accepting required a tap to open first.
  headerRow: "flex items-start gap-3 p-4 pb-0 sm:p-5 sm:pb-0",
  metaRow: "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#94A3B8]",
  metaDot: "text-[#334155]",
  factsStrip: "mx-4 mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.07] bg-black/25 sm:mx-5",
  fact: "px-1.5 py-2.5 text-center",
  factDivided: "border-s border-white/[0.07]",
  factLabel: "block text-[10px] font-bold leading-tight text-[#94A3B8]",
  factValue: "mt-1 block text-sm font-black text-[#F8FAFC]",
  factValueAccent: "mt-1 block text-sm font-black text-[#14F5D5]",
  priceRow: "flex items-end justify-between gap-3 px-4 pt-4 sm:px-5",
  priceLabelWrap: "min-w-0",
  priceLabel: "text-[11px] font-bold text-[#94A3B8]",
  priceValueRow: "mt-0.5 flex items-baseline gap-1",
  priceValue: "text-[26px] font-black leading-none tracking-tight text-[#14F5D5] sm:text-3xl",
  priceCurrency: "text-xs font-bold text-[#14F5D5]/70",
  priceAside: "shrink-0 text-end text-[10px] font-bold leading-tight text-[#94A3B8]",
  actionRow: "flex items-stretch gap-2 p-4 pt-3 sm:p-5 sm:pt-3",
  detailsButton: "inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-slate-200 transition hover:border-[#14B8A6]/35 hover:bg-[#14B8A6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60",
  detailsIcon: "h-4 w-4 shrink-0 transition-transform duration-300",
  detailsIconOpen: "rotate-180",
  style152_9: "inline-flex items-center gap-1 rounded-full border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-black text-[#14F5D5]",
  style153_10: "h-3 w-3",
  style158_11: "inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.2)]",
  style159_12: "h-3.5 w-3.5 fill-emerald-200 text-emerald-200",
  style165_14: "inline-flex items-center gap-1",
  style166_15: "h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]",
  style167_16: "text-[#F8FAFC]",
  style169_17: "rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 py-0.5 text-xs font-black text-[#14B8A6]",
  style192_26: "grid transition-all duration-300 ease-out",
  style193_27: "grid-rows-[1fr] opacity-100",
  style193_28: "grid-rows-[0fr] opacity-0",
  style196_29: "min-h-0 overflow-hidden",
  cardBody: "space-y-5 border-t border-white/5 p-5 pt-4",
  sectionWrap: "space-y-3",
  sectionHeader: "flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#14B8A6]",
  sectionHeaderIcon: "h-3.5 w-3.5",
  sectionHeaderLine: "h-px flex-1 bg-white/5",
  sectionCard: "rounded-2xl border border-white/5 bg-white/[0.03] p-4",
  tripGrid: "grid gap-3 sm:grid-cols-2",
  tripRowIcon: "h-4 w-4",
  vehicleGrid: "grid gap-3 sm:grid-cols-2",
  vehicleDetailGrid: "mt-3 grid gap-3 sm:grid-cols-2",
  vehicleRowIcon: "h-4 w-4",
  captainMetaGrid: "mt-3 grid gap-3 sm:grid-cols-2",
  captainMetaIcon: "h-4 w-4",
  contactGrid: "mt-3 grid gap-2 sm:grid-cols-2",
  contactButtonAccent: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-sm font-black text-[#14F5D5] transition hover:bg-[#14B8A6]/20",
  contactButtonIcon: "h-4 w-4",
  contactButtonPlain: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-white transition hover:border-[#14B8A6]/35 hover:bg-[#14B8A6]/10",
  priceCard: "rounded-2xl border border-[#14B8A6]/25 bg-gradient-to-b from-[#14B8A6]/10 to-transparent p-4",
  shortDistanceTile: "mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#14B8A6]/20 bg-[#0B0F19]/60 px-4 py-3",
  shortDistanceValue: "text-2xl font-black text-[#14F5D5]",
  shortDistanceCaption: "text-[11px] font-bold text-[#94A3B8]",
  breakdownRows: "space-y-2 text-sm",
  reasonText: "mt-3 text-xs leading-5 text-[#94A3B8]",
  additionalInfo: "rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-[#94A3B8]",
  acceptButton: "flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] py-3.5 text-sm font-extrabold text-[#0B0F19] transition-all duration-300 hover:bg-[#2DD4BF] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161F30] disabled:cursor-wait disabled:opacity-60",
  acceptButtonIcon: "h-5 w-5",
  avatarImg: "h-14 w-14 shrink-0 rounded-2xl border border-[#14B8A6]/30 object-cover",
  avatarFallback: "grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10",
  avatarFallbackIcon: "h-7 w-7 text-[#14B8A6]",
  infoRow: "min-w-0 rounded-xl border border-white/5 bg-black/20 p-3",
  infoRowFullWidth: "sm:col-span-2",
  infoRowLabel: "flex items-center gap-2 text-xs font-bold text-[#94A3B8]",
  infoRowLabelIconHighlight: "text-[#14B8A6]",
  infoRowLabelIconPlain: "text-[#94A3B8]",
  infoRowValue: "mt-1 truncate text-lg font-extrabold",
  infoRowValueHighlight: "text-[#14B8A6]",
  infoRowValuePlain: "text-[#F8FAFC]",
  infoRowHelper: "mt-0.5 text-[11px] font-semibold text-[#94A3B8]/75",
  breakdownRow: "flex items-center justify-between gap-4",
  breakdownLabelStrong: "font-black text-[#F8FAFC]",
  breakdownLabelPlain: "text-[#94A3B8]",
  breakdownValueAccent: "text-[#14B8A6]",
  breakdownValuePlain: "text-[#F8FAFC]",
  breakdownValueStrong: "text-lg",
  // At the top edge, not between the header and the body: this is the offer's own expiry,
  // and a bar buried mid-card read as a loading indicator for the row above it.
  countdownWrap: "flex items-center gap-2 px-4 pt-3 sm:px-5",
  countdownTrack: "h-1 flex-1 overflow-hidden rounded-full bg-white/10",
  countdownFill: "h-full rounded-full bg-[#14B8A6] transition-[width] duration-200 ease-linear",
  countdownFillUrgent: "bg-rose-400",
  countdownLabel: "shrink-0 text-[10px] font-black tabular-nums text-[#94A3B8]",
  countdownLabelUrgent: "shrink-0 text-[10px] font-black tabular-nums text-rose-300",
} as const;


export type CaptainRank = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';

export interface CaptainProfile {
  id: string;
  name: string;
  avatar_url?: string;
  trust_rating: number;
  rank: CaptainRank;
  vehicle_model: string;
  vehicle_color: string;
  plate_number: string;
  completed_trips?: number;
  company_name?: string | null;
  affiliation_label?: string;
  is_verified?: boolean;
  phone?: string;
  contact_url?: string;
  vehicle_year?: string | number;
  vehicle_category?: string;
  facebook_url?: string;
  instagram_url?: string;
}

/**
 * The itemised receipt written by submit_ride_offer when the offer was placed. A snapshot,
 * not a live recomputation — the captain may have changed their tariff since.
 * `tariffMissing` marks an offer from a captain who had no tariff to itemise.
 */
export interface OfferFareBreakdown {
  baseFare?: number;
  perKm?: number;
  perMin?: number;
  includedKm?: number;
  roadKm?: number;
  billableKm?: number;
  minutes?: number;
  kmCharge?: number;
  minCharge?: number;
  meterFare?: number;
  marketFare?: number | null;
  floorPrice?: number | null;
  ceilingPrice?: number | null;
  tier?: string;
  adjustment?: number;
  offeredFare?: number;
  minTripFare?: number | null;
  tariffMissing?: boolean;
}

export interface CaptainOffer {
  id: string;
  captain: CaptainProfile;
  server_fare: number;
  submitted_fare?: number;
  eta_minutes: number;
  distance_km: number;
  estimated_duration_minutes?: number;
  trip_distance_km?: number;
  additional_info?: string;
  wait_seconds?: number;
  created_at?: string;
  fare_breakdown?: OfferFareBreakdown | null;
}

interface CaptainOfferCardCountdown {
  hasCountdown: boolean;
  remainingSeconds: number;
  percentRemaining: number;
  isExpired: boolean;
}

interface CaptainOfferCardProps {
  offer: CaptainOffer;
  currencyCode?: string;
  language?: 'ar' | 'en';
  isAccepting?: boolean;
  isPreferred?: boolean;
  isExpanded?: boolean;
  countdown?: CaptainOfferCardCountdown;
  onToggleExpand?: () => void;
  onAccept: (offer: CaptainOffer) => void;
}

/**
 * How far above the market average each rank may bid. Mirrors public.offer_band_for_rank:
 * a 15% band for everyone, with a high rank keeping its larger factor instead. Only used
 * for the fallback below, but a stale copy of these numbers is exactly how the rider's view
 * and the server's rule drifted apart before.
 */
const premiumFactors: Record<CaptainRank, number> = {
  PLATINUM: 0.2,
  GOLD: 0.15,
  SILVER: 0.15,
  BRONZE: 0.15,
};

const rankLabels: Record<'ar' | 'en', Record<CaptainRank, string>> = {
  ar: {
    PLATINUM: 'بلاتيني',
    GOLD: 'ذهبي',
    SILVER: 'فضي',
    BRONZE: 'برونزي',
  },
  en: {
    PLATINUM: 'Platinum',
    GOLD: 'Gold',
    SILVER: 'Silver',
    BRONZE: 'Bronze',
  },
};

export function getCaptainOfferPricing(offer: CaptainOffer) {
  const baseFare = Math.max(0, Number(offer.server_fare) || 0);
  const premiumFactor = premiumFactors[offer.captain.rank] ?? 0;
  const submittedFare = Math.max(0, Number(offer.submitted_fare) || 0);
  const fallbackFinalFare = baseFare + baseFare * premiumFactor;
  const finalFare = submittedFare > 0 ? submittedFare : fallbackFinalFare;
  const rankPremiumValue = Math.max(0, finalFare - baseFare);
  const actualPremiumFactor = baseFare > 0 ? rankPremiumValue / baseFare : 0;

  return {
    baseFare,
    premiumFactor,
    actualPremiumFactor,
    rankPremiumValue,
    finalFare,
  };
}

export function CaptainOfferCard({
  offer,
  currencyCode = 'EGP',
  language = 'ar',
  isAccepting = false,
  isPreferred = false,
  isExpanded = false,
  countdown,
  onToggleExpand,
  onAccept,
}: CaptainOfferCardProps) {
  const isArabic = language === 'ar';
  const captain = offer.captain;
  const rating = Math.floor(Number(captain.trust_rating) || 5);
  const rankLabel = rankLabels[language][captain.rank] || captain.rank;
  const { finalFare } = getCaptainOfferPricing(offer);
  const breakdown = offer.fare_breakdown ?? null;
  const adjustment = roundMoney(Number(breakdown?.adjustment) || 0);
  const pricingReason = buildPricingReason(breakdown, finalFare, currencyCode, isArabic, rankLabel);
  const captainName = captain.name?.trim() || (isArabic ? 'كابتن' : 'Captain');
  const vehicleModelLabel = captain.vehicle_model?.trim() || (isArabic ? 'سيارة' : 'Vehicle');
  const vehicleColorLabel = resolveColorDisplayName(captain.vehicle_color, language) || (isArabic ? 'غير محدد' : 'Not specified');
  const companyLabel = captain.company_name?.trim()
    || captain.affiliation_label?.trim()
    || (isArabic ? 'كابتن مستقل' : 'Independent Captain');
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);
  const durationLabel = formatMinutes(
    preferRoutedMinutes(offer.estimated_duration_minutes, offer.trip_distance_km || offer.distance_km),
    language,
  );
  const tripDistance = offer.trip_distance_km ?? offer.distance_km;
  const hasContactLinks = Boolean(captain.phone || captain.contact_url || captain.facebook_url || captain.instagram_url);
  const includedKm = Number(breakdown?.includedKm) || 0;
  const hasVehicleYear = Boolean(captain.vehicle_year);
  const hasVehicleCategory = Boolean(captain.vehicle_category);
  // Plate is always shown; year and category are each optional. When the total count in
  // that row is odd, the last one rendered would otherwise sit alone with an empty cell
  // beside it, so it spans the full row instead of leaving that gap.
  const vehicleDetailFieldCount = 1 + Number(hasVehicleYear) + Number(hasVehicleCategory);
  const lastVehicleDetailField = hasVehicleCategory ? 'category' : hasVehicleYear ? 'year' : 'plate';
  const vehicleDetailTrailingSpansFull = vehicleDetailFieldCount % 2 !== 0;
  // Under a fifth of the window left, or under ten seconds whatever the window was — a long
  // window would otherwise never turn red until only a couple of seconds remained.
  const isCountdownUrgent = Boolean(
    countdown?.hasCountdown
    && (countdown.percentRemaining <= 20 || countdown.remainingSeconds <= 10),
  );

  return (
    <article
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(styles.style136_1, isPreferred ? styles.style137_2 : styles.style137_3)}
    >
      {countdown?.hasCountdown ? (
        <div className={styles.countdownWrap}>
          <div className={styles.countdownTrack}>
            <div
              className={cn(styles.countdownFill, isCountdownUrgent ? styles.countdownFillUrgent : '')}
              style={{ width: `${countdown.percentRemaining}%` }}
            />
          </div>
          {/* m:ss, not a raw seconds count. The old label printed `remainingSeconds`
              straight out, so an offer with a large wait window read as "5548 ث" — a number
              no rider can convert into "how long do I have". dir=ltr keeps the colon
              between the digits inside this RTL card. */}
          <span className={isCountdownUrgent ? styles.countdownLabelUrgent : styles.countdownLabel} dir="ltr">
            {formatCountdown(countdown.remainingSeconds)}
          </span>
        </div>
      ) : null}

      <div className={styles.headerRow}>
        <div className={styles.style146_5}>
          <CaptainAvatar captain={captain} captainName={captainName} />
          <div className={styles.style148_6}>
            <div className={styles.style149_7}>
              {/* dir="auto" (not inherited rtl/ltr) so the browser picks the ellipsis side
                  from the name's own script — otherwise a Latin name inside this RTL card
                  truncates from the wrong end, cutting the start instead of the tail. */}
              <h3 dir="auto" className={styles.style150_8}>{captainName}</h3>
              {captain.is_verified ? (
                <span className={styles.style152_9}>
                  <CheckCircle2 className={styles.style153_10} />
                  {isArabic ? 'موثق' : 'Verified'}
                </span>
              ) : null}
              {isPreferred ? (
                <span className={styles.style158_11}>
                  <Heart className={styles.style159_12} />
                  {isArabic ? 'كابتن مفضل' : 'Preferred Captain'}
                </span>
              ) : null}
            </div>
            <div className={styles.metaRow}>
              <span className={styles.style165_14}>
                <Star className={styles.style166_15} />
                <strong className={styles.style167_16}>{rating}.0</strong>
              </span>
              <span className={styles.style169_17}>
                {rankLabel}
              </span>
              {completedTrips > 0 ? (
                <>
                  <span className={styles.metaDot}>·</span>
                  <span>{completedTrips} {isArabic ? 'رحلة' : 'trips'}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* The three numbers an offer is actually chosen on, side by side so two cards can be
          compared by eye. The bare "1 د" chip this replaces carried no label at all. */}
      <div className={styles.factsStrip}>
        <div className={styles.fact}>
          <span className={styles.factLabel}>{isArabic ? 'يوصلك خلال' : 'Arrives in'}</span>
          <span className={styles.factValueAccent}>{formatMinutes(offer.eta_minutes, language)}</span>
        </div>
        <div className={cn(styles.fact, styles.factDivided)}>
          <span className={styles.factLabel}>{isArabic ? 'مدة الرحلة' : 'Trip time'}</span>
          <span className={styles.factValue}>{durationLabel}</span>
        </div>
        <div className={cn(styles.fact, styles.factDivided)}>
          <span className={styles.factLabel}>{isArabic ? 'مسافة الرحلة' : 'Trip distance'}</span>
          <span className={styles.factValue}>{Number(tripDistance || 0).toFixed(1)} {isArabic ? 'كم' : 'km'}</span>
        </div>
      </div>

      {/* The price, on the closed card. It was only ever inside the expanded panel — the one
          number the rider is deciding on, behind a tap. */}
      <div className={styles.priceRow}>
        <div className={styles.priceLabelWrap}>
          <span className={styles.priceLabel}>{isArabic ? 'السعر النهائي' : 'Final price'}</span>
          <span className={styles.priceValueRow} dir="ltr">
            <strong className={styles.priceValue}>{finalFare.toFixed(2)}</strong>
            <span className={styles.priceCurrency}>{currencyCode}</span>
          </span>
        </div>
        <span className={styles.priceAside}>
          {isArabic ? 'شامل كل شيء' : 'All inclusive'}
        </span>
      </div>

      <div className={styles.actionRow}>
        <button
          type="button"
          onClick={() => onAccept(offer)}
          disabled={isAccepting}
          className={styles.acceptButton}
        >
          <Navigation className={styles.acceptButtonIcon} />
          {isAccepting ? (isArabic ? 'جاري القبول...' : 'Accepting...') : isArabic ? 'قبول العرض' : 'Accept offer'}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className={styles.detailsButton}
          aria-expanded={isExpanded}
        >
          {isArabic ? 'التفاصيل' : 'Details'}
          <ChevronDown className={cn(styles.detailsIcon, isExpanded ? styles.detailsIconOpen : '')} />
        </button>
      </div>

      <div
        className={cn(styles.style192_26, isExpanded ? styles.style193_27 : styles.style193_28)}
      >
        <div className={styles.style196_29}>
          <div className={styles.cardBody}>

            {/* Trip data — kept visually separate from the captain's own data below. */}
            <div className={styles.sectionWrap}>
              <SectionHeader icon={<Route className={styles.sectionHeaderIcon} />} title={isArabic ? 'تفاصيل الرحلة' : 'Trip details'} />
              <div className={styles.tripGrid}>
                <InfoRow
                  icon={<MapPin className={styles.tripRowIcon} />}
                  label={isArabic ? 'البعد عنك' : 'Distance to you'}
                  value={`${offer.distance_km.toFixed(1)} ${isArabic ? 'كم' : 'km'}`}
                />
                <InfoRow
                  icon={<Clock className={styles.tripRowIcon} />}
                  label={isArabic ? 'يوصلك خلال' : 'Arrives in'}
                  value={`${offer.eta_minutes} ${isArabic ? 'دقائق' : 'mins'}`}
                  highlight
                />
                <InfoRow
                  icon={<Timer className={styles.tripRowIcon} />}
                  label={isArabic ? 'مدة الرحلة' : 'Trip duration'}
                  value={durationLabel}
                  helper={isArabic ? 'بدون تأخير مروري' : 'Without traffic delays'}
                  highlight
                />
                <InfoRow
                  icon={<Milestone className={styles.tripRowIcon} />}
                  label={isArabic ? 'مسافة الرحلة' : 'Trip distance'}
                  value={`${Number(tripDistance || 0).toFixed(1)} ${isArabic ? 'كم' : 'km'}`}
                  highlight
                />
              </div>
            </div>

            {/* Captain + vehicle data — its own section, separate from the trip above. */}
            <div className={styles.sectionWrap}>
              <SectionHeader icon={<Car className={styles.sectionHeaderIcon} />} title={isArabic ? 'بيانات الكابتن والمركبة' : 'Captain & vehicle'} />
              <div className={styles.sectionCard}>
                <div className={styles.vehicleGrid}>
                  <InfoRow icon={<Car className={styles.vehicleRowIcon} />} label={isArabic ? 'السيارة' : 'Vehicle'} value={vehicleModelLabel} />
                  <InfoRow label={isArabic ? 'اللون' : 'Color'} value={vehicleColorLabel} />
                </div>
                <div className={styles.vehicleDetailGrid}>
                  <InfoRow
                    label={isArabic ? 'اللوحة' : 'Plate'}
                    value={captain.plate_number?.trim() || (isArabic ? 'غير متاح' : 'Not available')}
                    fullWidth={vehicleDetailTrailingSpansFull && lastVehicleDetailField === 'plate'}
                  />
                  {hasVehicleYear ? (
                    <InfoRow
                      label={isArabic ? 'سنة الصنع' : 'Year'}
                      value={String(captain.vehicle_year)}
                      fullWidth={vehicleDetailTrailingSpansFull && lastVehicleDetailField === 'year'}
                    />
                  ) : null}
                  {hasVehicleCategory ? (
                    <InfoRow
                      label={isArabic ? 'الفئة' : 'Category'}
                      value={captain.vehicle_category}
                      fullWidth={vehicleDetailTrailingSpansFull && lastVehicleDetailField === 'category'}
                    />
                  ) : null}
                </div>

                <div className={styles.captainMetaGrid}>
                  <InfoRow icon={<Building2 className={styles.captainMetaIcon} />} label={isArabic ? 'نوع الكابتن' : 'Captain type'} value={companyLabel} />
                  <InfoRow icon={<Trophy className={styles.captainMetaIcon} />} label={isArabic ? 'الرحلات المكتملة' : 'Completed trips'} value={String(completedTrips)} />
                </div>

                {hasContactLinks ? (
                  <div className={styles.contactGrid}>
                    {captain.phone ? (
                      <a href={`tel:${captain.phone}`} className={styles.contactButtonAccent}>
                        <Phone className={styles.contactButtonIcon} />
                        {isArabic ? 'اتصال' : 'Call'}
                      </a>
                    ) : null}
                    {captain.contact_url ? (
                      <a href={captain.contact_url} target="_blank" rel="noreferrer" className={styles.contactButtonPlain}>
                        <ExternalLink className={styles.contactButtonIcon} />
                        {isArabic ? 'رابط التواصل' : 'Contact link'}
                      </a>
                    ) : null}
                    {captain.facebook_url ? (
                      <a href={captain.facebook_url} target="_blank" rel="noreferrer" className={styles.contactButtonPlain}>
                        <Facebook className={styles.contactButtonIcon} />
                        {isArabic ? 'فيسبوك' : 'Facebook'}
                      </a>
                    ) : null}
                    {captain.instagram_url ? (
                      <a href={captain.instagram_url} target="_blank" rel="noreferrer" className={styles.contactButtonPlain}>
                        <Instagram className={styles.contactButtonIcon} />
                        {isArabic ? 'انستجرام' : 'Instagram'}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Price — its own section. Itemised meter receipt from submit_ride_offer, plus
                why the total is what it is. */}
            <div className={styles.sectionWrap}>
              <SectionHeader icon={<Wallet className={styles.sectionHeaderIcon} />} title={isArabic ? 'السعر' : 'Price'} />
              <div className={styles.priceCard}>
                {includedKm > 0 ? (
                  <div className={styles.shortDistanceTile}>
                    <span className={styles.shortDistanceCaption}>{isArabic ? 'المسافات القصيرة' : 'Short distances'}</span>
                    <strong className={styles.shortDistanceValue}>{num(includedKm)} {isArabic ? 'كم' : 'km'}</strong>
                  </div>
                ) : null}
                <div className={styles.breakdownRows}>
                  {breakdown && !breakdown.tariffMissing ? (
                    <>
                      <BreakdownRow
                        label={isArabic
                          ? `المسافة · ${num(breakdown.billableKm ?? breakdown.roadKm)} كم × ${money(breakdown.perKm)}`
                          : `Distance · ${num(breakdown.billableKm ?? breakdown.roadKm)} km × ${money(breakdown.perKm)}`}
                        value={`${money(breakdown.kmCharge)} ${currencyCode}`}
                      />
                      {Number(breakdown.perMin) > 0 ? (
                        <BreakdownRow
                          label={isArabic
                            ? `الوقت · ${num(breakdown.minutes)} دقيقة × ${money(breakdown.perMin)}`
                            : `Time · ${num(breakdown.minutes)} min × ${money(breakdown.perMin)}`}
                          value={`${money(breakdown.minCharge)} ${currencyCode}`}
                        />
                      ) : null}
                      {adjustment !== 0 ? (
                        <BreakdownRow
                          label={isArabic
                            ? (adjustment > 0 ? 'زيادة اختارها الكابتن' : 'تخفيض من الكابتن')
                            : (adjustment > 0 ? 'Captain’s increase' : 'Captain’s reduction')}
                          value={`${adjustment > 0 ? '+' : '−'}${money(Math.abs(adjustment))} ${currencyCode}`}
                          accent
                        />
                      ) : null}
                    </>
                  ) : null}
                  <BreakdownRow
                    label={isArabic ? 'السعر الإجمالي' : 'Total price'}
                    value={`${finalFare.toFixed(2)} ${currencyCode}`}
                    accent
                    strong
                  />
                </div>
                <p className={styles.reasonText}>{pricingReason}</p>
              </div>
            </div>

            {offer.additional_info ? (
              <p className={styles.additionalInfo}>
                {offer.additional_info}
              </p>
            ) : null}
            {/* No accept button down here any more: it sits on the closed card, so the rider
                never has to open the details in order to be able to act. */}
          </div>
        </div>
      </div>
    </article>
  );
}

function CaptainAvatar({ captain, captainName }: { captain: CaptainProfile; captainName: string }) {
  if (captain.avatar_url) {
    return (
      <img
        src={captain.avatar_url}
        alt={captainName}
        className={styles.avatarImg}
      />
    );
  }

  return (
    <div className={styles.avatarFallback}>
      <ShieldCheck className={styles.avatarFallbackIcon} />
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className={styles.sectionHeader}>
      {icon}
      <span>{title}</span>
      <span className={styles.sectionHeaderLine} />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  helper,
  highlight = false,
  fullWidth = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  helper?: string;
  highlight?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn(styles.infoRow, fullWidth ? styles.infoRowFullWidth : '')}>
      <p className={styles.infoRowLabel}>
        {icon ? <span className={highlight ? styles.infoRowLabelIconHighlight : styles.infoRowLabelIconPlain}>{icon}</span> : null}
        {label}
      </p>
      <p className={cn(styles.infoRowValue, highlight ? styles.infoRowValueHighlight : styles.infoRowValuePlain)}>{value}</p>
      {helper ? <p className={styles.infoRowHelper}>{helper}</p> : null}
    </div>
  );
}

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function money(value: number | null | undefined) {
  return (Number(value) || 0).toFixed(2);
}

function num(value: number | null | undefined) {
  const parsed = Number(value) || 0;
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
}

/**
 * One sentence telling the rider why this price, in the terms that actually decided it:
 * the captain's own meter, and the market band the offer had to land in.
 */
function buildPricingReason(
  breakdown: OfferFareBreakdown | null,
  finalFare: number,
  currencyCode: string,
  isArabic: boolean,
  rankLabel: string,
) {
  if (!breakdown || breakdown.tariffMissing) {
    return isArabic
      ? 'هذا السعر قدّمه الكابتن مباشرة، ولم تُسجَّل تفاصيل تعريفة له عند تقديم العرض.'
      : 'This price was submitted directly by the captain; no tariff details were recorded with the offer.';
  }

  const meterFare = Number(breakdown.meterFare) || 0;
  const marketFare = Number(breakdown.marketFare) || 0;

  const meterSentence = isArabic
    ? `سعر عدّاد الكابتن لهذه الرحلة ${money(meterFare)} ${currencyCode}.`
    : `The captain's meter for this trip reads ${money(meterFare)} ${currencyCode}.`;

  const adjustment = roundMoney(Number(breakdown.adjustment) || 0);
  const adjustmentSentence = adjustment === 0
    ? (isArabic ? ' وقدّمه كما هو دون تعديل.' : ' They offered it unchanged.')
    : adjustment > 0
      ? (isArabic
          ? ` وأضاف ${money(adjustment)} ${currencyCode} فوقه.`
          : ` They added ${money(adjustment)} ${currencyCode} on top.`)
      : (isArabic
          ? ` وخفّض ${money(Math.abs(adjustment))} ${currencyCode} منه.`
          : ` They took ${money(Math.abs(adjustment))} ${currencyCode} off.`);

  if (marketFare <= 0) {
    return `${meterSentence}${adjustmentSentence}`;
  }

  const deviation = Math.round(((finalFare - marketFare) / marketFare) * 100);
  const comparison = deviation === 0
    ? (isArabic
        ? ` وهو مطابق لمتوسط أسعار الكباتن لهذه الرحلة (${money(marketFare)} ${currencyCode}).`
        : ` That matches the captain average for this trip (${money(marketFare)} ${currencyCode}).`)
    : deviation > 0
      ? (isArabic
          ? ` وهو أعلى بـ ${deviation}% من متوسط أسعار الكباتن (${money(marketFare)} ${currencyCode})، وهي زيادة مسموحة لرتبة ${rankLabel}.`
          : ` That is ${deviation}% above the captain average (${money(marketFare)} ${currencyCode}), within the allowance for the ${rankLabel} rank.`)
      : (isArabic
          ? ` وهو أقل بـ ${Math.abs(deviation)}% من متوسط أسعار الكباتن (${money(marketFare)} ${currencyCode}).`
          : ` That is ${Math.abs(deviation)}% below the captain average (${money(marketFare)} ${currencyCode}).`);

  return `${meterSentence}${adjustmentSentence}${comparison}`;
}

function BreakdownRow({
  label,
  value,
  accent = false,
  strong = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={styles.breakdownRow}>
      <span className={strong ? styles.breakdownLabelStrong : styles.breakdownLabelPlain}>{label}</span>
      <strong className={cn(accent ? styles.breakdownValueAccent : styles.breakdownValuePlain, strong ? styles.breakdownValueStrong : '')}>{value}</strong>
    </div>
  );
}

function formatMinutes(minutes: number, language: 'ar' | 'en') {
  const value = Math.max(1, Math.round(Number(minutes) || 1));
  if (value < 60) return language === 'ar' ? `${value} دقيقة` : `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (language === 'ar') return rest ? `${hours} س ${rest} د` : `${hours} س`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
