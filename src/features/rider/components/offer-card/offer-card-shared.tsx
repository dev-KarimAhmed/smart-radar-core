import React from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export const styles = {
  style136_1: "group overflow-hidden rounded-2xl border bg-[#161F30]/80 text-[#F8FAFC] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-[#14B8A6]",
  style137_2: "border-emerald-300/70 shadow-[0_0_34px_rgba(20,184,166,0.18)]",
  style137_3: "border-[#243249]",
  style146_5: "flex min-w-0 flex-1 items-center gap-3",
  style148_6: "min-w-0",
  style149_7: "flex flex-wrap items-center gap-x-2 gap-y-1",
  style150_8: "min-w-0 max-w-full truncate text-lg font-extrabold text-[#F8FAFC] sm:text-xl",
  modeBadgeApp: "inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-amber-400/10 px-2 py-0.5 text-[10px] font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
  modeBadgeTaxi: "inline-flex items-center gap-1 rounded-full border border-yellow-400/40 bg-gradient-to-r from-yellow-500/20 to-amber-500/15 px-2 py-0.5 text-[10px] font-black text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.15)]",
  modeBadgeFree: "inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
  companyBadge: "inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300",
  companyIcon: "h-3 w-3 text-blue-400",
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
  sectionHeaderButton: "flex w-full items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#14B8A6] cursor-pointer select-none rounded-lg p-1 -m-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#14B8A6]/60",
  sectionHeaderTitleWrap: "flex items-center gap-2 shrink-0",
  sectionChevronWrap: "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-[#14B8A6]/40 hover:text-[#14F5D5]",
  sectionChevron: "h-3.5 w-3.5 transition-transform duration-200",
  sectionChevronOpen: "rotate-180 text-[#14F5D5]",
  sectionChevronClosed: "rotate-0 text-slate-400",
  collapsibleSectionBody: "mt-2 pt-1 transition-all duration-200",
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
  breakdownRows: "space-y-2 text-sm",
  breakdownGroupLabel: "mb-2 text-[10px] font-black uppercase tracking-wide text-[#94A3B8]",
  breakdownDivider: "my-2.5 h-px bg-white/10",
  breakdownDividerStrong: "my-3 h-px bg-[#14B8A6]/30",
  marketBlock: "mt-3 rounded-xl border border-white/5 bg-black/25 px-3.5 py-3",
  marketVerdictBelow: "mt-1.5 text-[11px] font-black leading-relaxed text-emerald-300",
  marketVerdictAbove: "mt-1.5 text-[11px] font-black leading-relaxed text-amber-200",
  marketVerdictEqual: "mt-1.5 text-[11px] font-black leading-relaxed text-[#94A3B8]",
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
  breakdownRow: "flex items-start justify-between gap-4",
  breakdownLabelWrap: "block min-w-0",
  breakdownLabelStrong: "block font-black text-[#F8FAFC]",
  breakdownLabelPlain: "block text-[#94A3B8]",
  breakdownHelper: "mt-0.5 block text-[11px] leading-snug text-[#94A3B8]/70",
  breakdownValue: "shrink-0 tabular-nums",
  breakdownValueAccent: "text-[#14B8A6]",
  breakdownValuePlain: "text-[#F8FAFC]",
  breakdownValueStrong: "text-lg",
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
  affiliation_type?: string;
  is_verified?: boolean;
  phone?: string;
  contact_url?: string;
  vehicle_year?: string | number;
  vehicle_category?: string;
  facebook_url?: string;
  instagram_url?: string;
}

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
  pricing_mode?: 'FREE' | 'APP' | 'TAXI';
  eta_minutes: number;
  distance_km: number;
  estimated_duration_minutes?: number;
  trip_distance_km?: number;
  additional_info?: string;
  wait_seconds?: number;
  created_at?: string;
  fare_breakdown?: OfferFareBreakdown | null;
}

export interface CaptainOfferCardCountdown {
  hasCountdown: boolean;
  remainingSeconds: number;
  percentRemaining: number;
  isExpired: boolean;
}

export const premiumFactors: Record<CaptainRank, number> = {
  PLATINUM: 0.2,
  GOLD: 0.15,
  SILVER: 0.15,
  BRONZE: 0.15,
};

export const rankLabels: Record<'ar' | 'en', Record<CaptainRank, string>> = {
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

export function CaptainAvatar({ captain, captainName }: { captain: CaptainProfile; captainName: string }) {
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

export function SectionHeader({
  icon,
  title,
  isOpen,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={styles.sectionHeaderButton}
      >
        <span className={styles.sectionHeaderTitleWrap}>
          {icon}
          <span>{title}</span>
        </span>
        <span className={styles.sectionHeaderLine} />
        <span className={styles.sectionChevronWrap}>
          <ChevronDown
            className={cn(
              styles.sectionChevron,
              isOpen ? styles.sectionChevronOpen : styles.sectionChevronClosed,
            )}
          />
        </span>
      </button>
    );
  }

  return (
    <div className={styles.sectionHeader}>
      {icon}
      <span>{title}</span>
      <span className={styles.sectionHeaderLine} />
    </div>
  );
}

export function InfoRow({
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

export function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function money(value: number | null | undefined) {
  return (Number(value) || 0).toFixed(2);
}

export function num(value: number | null | undefined) {
  const parsed = Number(value) || 0;
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
}

export function BreakdownRow({
  label,
  helper,
  value,
  accent = false,
  strong = false,
}: {
  label: string;
  helper?: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={styles.breakdownRow}>
      <span className={styles.breakdownLabelWrap}>
        <span className={strong ? styles.breakdownLabelStrong : styles.breakdownLabelPlain}>{label}</span>
        {helper ? <span className={styles.breakdownHelper}>{helper}</span> : null}
      </span>
      <strong
        className={cn(
          styles.breakdownValue,
          accent ? styles.breakdownValueAccent : styles.breakdownValuePlain,
          strong ? styles.breakdownValueStrong : '',
        )}
        dir="ltr"
      >
        {value}
      </strong>
    </div>
  );
}

export function formatMinutes(minutes: number, language: 'ar' | 'en') {
  const value = Math.max(1, Math.round(Number(minutes) || 1));
  if (value < 60) return language === 'ar' ? `${value} دقيقة` : `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (language === 'ar') return rest ? `${hours} س ${rest} د` : `${hours} س`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
