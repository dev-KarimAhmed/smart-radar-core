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
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { resolveColorDisplayName } from '@/shared/services/color-name';
const styles = {
  style136_1: "group overflow-hidden rounded-2xl border bg-[#161F30]/80 text-[#F8FAFC] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-[#14B8A6]",
  style137_2: "border-emerald-300/70 shadow-[0_0_34px_rgba(20,184,166,0.18)]",
  style137_3: "border-[#243249]",
  style143_4: "flex w-full items-center justify-between gap-4 p-5 text-start transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60",
  style146_5: "flex min-w-0 items-center gap-3",
  style148_6: "min-w-0",
  style149_7: "flex flex-wrap items-center gap-2",
  style150_8: "truncate text-lg font-extrabold text-[#F8FAFC] sm:text-xl",
  style152_9: "inline-flex items-center gap-1 rounded-full border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-black text-[#14F5D5]",
  style153_10: "h-3 w-3",
  style158_11: "inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.2)]",
  style159_12: "h-3.5 w-3.5 fill-emerald-200 text-emerald-200",
  style164_13: "mt-1 flex flex-wrap items-center gap-2 text-sm text-[#94A3B8]",
  style165_14: "inline-flex items-center gap-1",
  style166_15: "h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]",
  style167_16: "text-[#F8FAFC]",
  style169_17: "rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 py-0.5 text-xs font-black text-[#14B8A6]",
  style172_18: "inline-flex items-center gap-1",
  style173_19: "h-3.5 w-3.5 text-[#14B8A6]",
  style180_20: "flex shrink-0 items-center gap-3",
  style181_21: "text-end",
  style182_22: "text-[11px] font-bold text-[#94A3B8]",
  style183_23: "block text-xl font-black text-[#00ffcc] sm:text-2xl",
  style187_24: "h-5 w-5 text-slate-400 transition-transform duration-300",
  style187_25: "rotate-180",
  style192_26: "grid transition-all duration-300 ease-out",
  style193_27: "grid-rows-[1fr] opacity-100",
  style193_28: "grid-rows-[0fr] opacity-0",
  style196_29: "min-h-0 overflow-hidden",
  style197_30: "space-y-4 border-t border-white/5 p-5 pt-4",
  style198_31: "grid gap-3 sm:grid-cols-3",
  style200_32: "h-4 w-4",
  style205_33: "h-4 w-4",
  style211_34: "h-4 w-4",
  style219_35: "grid gap-3 rounded-xl bg-[#0B0F19]/70 p-4 sm:grid-cols-2",
  style220_36: "h-4 w-4",
  style226_37: "grid gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 sm:grid-cols-2",
  style227_38: "h-4 w-4",
  style228_39: "h-4 w-4",
  style232_40: "grid gap-2 sm:grid-cols-2",
  style236_41: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-sm font-black text-[#14F5D5] transition hover:bg-[#14B8A6]/20",
  style238_42: "h-4 w-4",
  style247_43: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-white transition hover:border-[#14B8A6]/35 hover:bg-[#14B8A6]/10",
  style249_44: "h-4 w-4",
  style257_45: "rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-4",
  style258_46: "space-y-2 text-sm",
  style267_47: "mt-3 text-xs leading-5 text-[#94A3B8]",
  style274_48: "rounded-2xl border border-[#14B8A6]/35 bg-[#14B8A6]/10 p-4",
  style280_49: "rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-[#94A3B8]",
  style289_50: "flex w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] py-3 font-extrabold text-[#0B0F19] transition-all duration-300 hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161F30] disabled:cursor-wait disabled:opacity-60",
  style291_51: "h-5 w-5",
  style307_52: "h-14 w-14 shrink-0 rounded-2xl border border-[#14B8A6]/30 object-cover",
  style313_53: "grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10",
  style314_54: "h-7 w-7 text-[#14B8A6]",
  style333_55: "min-w-0 rounded-xl border border-white/5 bg-black/20 p-3",
  style334_56: "flex items-center gap-2 text-xs font-bold text-[#94A3B8]",
  style335_57: "text-[#14B8A6]",
  style335_58: "text-[#94A3B8]",
  style338_59: "mt-1 truncate text-lg font-extrabold",
  style338_60: "text-[#14B8A6]",
  style338_61: "text-[#F8FAFC]",
  style339_62: "mt-0.5 text-[11px] font-semibold text-[#94A3B8]/75",
  valueStack: "mt-1 flex flex-col gap-0.5 text-lg font-extrabold",
  valueStackLine: "truncate",
  style356_63: "flex items-center justify-between gap-4",
  style357_64: "font-black text-[#F8FAFC]",
  style357_65: "text-[#94A3B8]",
  style358_66: "text-[#14B8A6]",
  style358_67: "text-[#F8FAFC]",
  style358_68: "text-lg",
  countdownWrap: "flex items-center gap-2 border-t border-white/5 px-5 py-2",
  countdownTrack: "h-1.5 flex-1 overflow-hidden rounded-full bg-white/10",
  countdownFill: "h-full rounded-full bg-[#14B8A6] transition-[width] duration-200 ease-linear",
  countdownFillUrgent: "bg-rose-400",
  countdownLabel: "shrink-0 text-[11px] font-black tabular-nums text-[#94A3B8]",
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

const premiumFactors: Record<CaptainRank, number> = {
  PLATINUM: 0.2,
  GOLD: 0.1,
  SILVER: 0,
  BRONZE: 0.05,
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
  isExpanded = true,
  countdown,
  onToggleExpand,
  onAccept,
}: CaptainOfferCardProps) {
  const isArabic = language === 'ar';
  const captain = offer.captain;
  const rating = Math.floor(Number(captain.trust_rating) || 5);
  const rankLabel = rankLabels[language][captain.rank] || captain.rank;
  const { baseFare, premiumFactor, actualPremiumFactor, rankPremiumValue, finalFare } = getCaptainOfferPricing(offer);
  const hasPremium = premiumFactor > 0 && rankPremiumValue > 0;
  const premiumPercent = Math.round(actualPremiumFactor * 100);
  const maxPremiumPercent = Math.round(premiumFactor * 100);
  const captainName = captain.name?.trim() || (isArabic ? 'كابتن' : 'Captain');
  const vehicleModelLabel = captain.vehicle_model?.trim() || (isArabic ? 'سيارة' : 'Vehicle');
  const vehicleColorLabel = resolveColorDisplayName(captain.vehicle_color, language);
  const vehicleLines = [vehicleModelLabel, vehicleColorLabel].filter((value) => value && String(value).trim());
  const companyLabel = captain.company_name?.trim()
    || captain.affiliation_label?.trim()
    || (isArabic ? 'كابتن مستقل' : 'Independent Captain');
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);
  const durationLabel = formatMinutes(offer.estimated_duration_minutes || Math.max(5, Math.round((offer.trip_distance_km || offer.distance_km || 1) * 2.2)), language);
  const tripDistance = offer.trip_distance_km ?? offer.distance_km;

  return (
    <article
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(styles.style136_1, isPreferred ? styles.style137_2 : styles.style137_3)}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className={styles.style143_4}
        aria-expanded={isExpanded}
      >
        <div className={styles.style146_5}>
          <CaptainAvatar captain={captain} captainName={captainName} />
          <div className={styles.style148_6}>
            <div className={styles.style149_7}>
              <h3 className={styles.style150_8}>{captainName}</h3>
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
            <div className={styles.style164_13}>
              <span className={styles.style165_14}>
                <Star className={styles.style166_15} />
                <strong className={styles.style167_16}>{rating}.0</strong>
              </span>
              <span className={styles.style169_17}>
                {rankLabel}
              </span>
              <span className={styles.style172_18}>
                <Clock className={styles.style173_19} />
                {offer.eta_minutes} {isArabic ? 'د' : 'min'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.style180_20}>
          {/* Price display disabled — kept hidden from rider by product request.
          <div className={styles.style181_21}>
            <p className={styles.style182_22}>{isArabic ? 'السعر' : 'Price'}</p>
            <strong className={styles.style183_23}>
              {finalFare.toFixed(2)} {currencyCode}
            </strong>
          </div>
          */}
          <ChevronDown className={cn(styles.style187_24, isExpanded ? styles.style187_25 : '')} />
        </div>
      </button>

      {countdown?.hasCountdown ? (
        <div className={styles.countdownWrap}>
          <div className={styles.countdownTrack}>
            <div
              className={cn(styles.countdownFill, countdown.percentRemaining <= 30 ? styles.countdownFillUrgent : '')}
              style={{ width: `${countdown.percentRemaining}%` }}
            />
          </div>
          <span className={styles.countdownLabel}>
            {countdown.remainingSeconds} {isArabic ? 'ث' : 's'}
          </span>
        </div>
      ) : null}

      <div
        className={cn(styles.style192_26, isExpanded ? styles.style193_27 : styles.style193_28)}
      >
        <div className={styles.style196_29}>
          <div className={styles.style197_30}>
            <div className={styles.style198_31}>
              <InfoRow
                icon={<MapPin className={styles.style200_32} />}
                label={isArabic ? 'البعد عنك' : 'Distance'}
                value={`${offer.distance_km.toFixed(1)} ${isArabic ? 'كم' : 'km'}`}
              />
              <InfoRow
                icon={<Clock className={styles.style205_33} />}
                label={isArabic ? 'يوصلك خلال' : 'ETA'}
                value={`${offer.eta_minutes} ${isArabic ? 'دقائق' : 'mins'}`}
                highlight
              />
              <InfoRow
                icon={<Navigation className={styles.style211_34} />}
                label={isArabic ? 'مدة الرحلة' : 'Trip duration'}
                value={durationLabel}
                helper={isArabic ? 'بدون تأخير مروري' : 'Without traffic delays'}
                highlight
              />
            </div>

            <div className={styles.style219_35}>
              <InfoRow icon={<Car className={styles.style220_36} />} label={isArabic ? 'السيارة' : 'Vehicle'} valueLines={vehicleLines} />
              <InfoRow label={isArabic ? 'اللوحة' : 'Plate'} value={captain.plate_number?.trim() || (isArabic ? 'غير متاح' : 'Not available')} />
              {captain.vehicle_year ? <InfoRow label={isArabic ? 'سنة الصنع' : 'Year'} value={String(captain.vehicle_year)} /> : null}
              {captain.vehicle_category ? <InfoRow label={isArabic ? 'الفئة' : 'Category'} value={captain.vehicle_category} /> : null}
            </div>

            <div className={styles.style226_37}>
              <InfoRow icon={<Building2 className={styles.style227_38} />} label={isArabic ? 'نوع الكابتن' : 'Captain type'} value={companyLabel} />
              <InfoRow icon={<Trophy className={styles.style228_39} />} label={isArabic ? 'الرحلات المكتملة' : 'Completed trips'} value={String(completedTrips)} />
            </div>

            {captain.phone || captain.contact_url || captain.facebook_url || captain.instagram_url ? (
              <div className={styles.style232_40}>
                {captain.phone ? (
                  <a
                    href={`tel:${captain.phone}`}
                    className={styles.style236_41}
                  >
                    <Phone className={styles.style238_42} />
                    {isArabic ? 'اتصال' : 'Call'}
                  </a>
                ) : null}
                {captain.contact_url ? (
                  <a
                    href={captain.contact_url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.style247_43}
                  >
                    <ExternalLink className={styles.style249_44} />
                    {isArabic ? 'رابط التواصل' : 'Contact link'}
                  </a>
                ) : null}
                {captain.facebook_url ? (
                  <a
                    href={captain.facebook_url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.style247_43}
                  >
                    <Facebook className={styles.style249_44} />
                    {isArabic ? 'فيسبوك' : 'Facebook'}
                  </a>
                ) : null}
                {captain.instagram_url ? (
                  <a
                    href={captain.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.style247_43}
                  >
                    <Instagram className={styles.style249_44} />
                    {isArabic ? 'انستجرام' : 'Instagram'}
                  </a>
                ) : null}
              </div>
            ) : null}

            {/* Fare breakdown display disabled — kept hidden from rider by product request.
            {hasPremium ? (
              <div className={styles.style257_45}>
                <div className={styles.style258_46}>
                  <BreakdownRow label={isArabic ? 'سعر الرحلة الأساسي' : 'Base trip fare'} value={`${baseFare.toFixed(2)} ${currencyCode}`} />
                  <BreakdownRow
                    label={isArabic ? `علاوة الجودة (${rankLabel})` : `Quality surcharge (${rankLabel})`}
                    value={`+${rankPremiumValue.toFixed(2)} ${currencyCode}`}
                    accent
                  />
                  <BreakdownRow label={isArabic ? 'السعر الإجمالي' : 'Total price'} value={`${finalFare.toFixed(2)} ${currencyCode}`} accent strong />
                </div>
                <p className={styles.style267_47}>
                  {isArabic
                    ? `يشمل ${premiumPercent}% علاوة جودة اختارها الكابتن ضمن الحد المسموح لرتبة ${rankLabel} من 1 إلى ${maxPremiumPercent}%.`
                    : `Includes a ${premiumPercent}% quality premium selected by the captain within the allowed ${rankLabel} range: 1-${maxPremiumPercent}%.`}
                </p>
              </div>
            ) : (
              <div className={styles.style274_48}>
                <BreakdownRow label={isArabic ? 'السعر الإجمالي' : 'Total price'} value={`${finalFare.toFixed(2)} ${currencyCode}`} accent strong />
              </div>
            )}
            */}

            {offer.additional_info ? (
              <p className={styles.style280_49}>
                {offer.additional_info}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => onAccept(offer)}
              disabled={isAccepting}
              className={styles.style289_50}
            >
              <Navigation className={styles.style291_51} />
              {isAccepting ? (isArabic ? 'جاري قبول العرض...' : 'Accepting offer...') : isArabic ? 'قبول العرض' : 'Accept offer'}
            </button>
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
        className={styles.style307_52}
      />
    );
  }

  return (
    <div className={styles.style313_53}>
      <ShieldCheck className={styles.style314_54} />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueLines,
  helper,
  highlight = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  valueLines?: string[];
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <div className={styles.style333_55}>
      <p className={styles.style334_56}>
        {icon ? <span className={highlight ? styles.style335_57 : styles.style335_58}>{icon}</span> : null}
        {label}
      </p>
      {valueLines ? (
        <div className={cn(styles.valueStack, highlight ? styles.style338_60 : styles.style338_61)}>
          {valueLines.map((line, index) => (
            <span key={index} className={styles.valueStackLine}>{line}</span>
          ))}
        </div>
      ) : (
        <p className={cn(styles.style338_59, highlight ? styles.style338_60 : styles.style338_61)}>{value}</p>
      )}
      {helper ? <p className={styles.style339_62}>{helper}</p> : null}
    </div>
  );
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
    <div className={styles.style356_63}>
      <span className={strong ? styles.style357_64 : styles.style357_65}>{label}</span>
      <strong className={cn(accent ? styles.style358_66 : styles.style358_67, strong ? styles.style358_68 : '')}>{value}</strong>
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
