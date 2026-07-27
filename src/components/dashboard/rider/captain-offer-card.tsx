'use client';

import React from 'react';
import {
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-react';

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
}

interface CaptainOfferCardProps {
  offer: CaptainOffer;
  currencyCode?: string;
  language?: 'ar' | 'en';
  isAccepting?: boolean;
  isPreferred?: boolean;
  isExpanded?: boolean;
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
  const vehicleSummary =
    [captain.vehicle_model, captain.vehicle_color].filter((value) => value && String(value).trim()).join(' - ') ||
    (isArabic ? 'سيارة' : 'Vehicle');
  const companyLabel = captain.company_name?.trim()
    || captain.affiliation_label?.trim()
    || (isArabic ? 'كابتن مستقل' : 'Independent Captain');
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);
  const durationLabel = formatMinutes(offer.estimated_duration_minutes || Math.max(5, Math.round((offer.trip_distance_km || offer.distance_km || 1) * 2.2)), language);
  const tripDistance = offer.trip_distance_km ?? offer.distance_km;

  return (
    <article
      dir={isArabic ? 'rtl' : 'ltr'}
      className={`group overflow-hidden rounded-2xl border bg-[#161F30]/80 text-[#F8FAFC] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-[#14B8A6] ${
        isPreferred ? 'border-emerald-300/70 shadow-[0_0_34px_rgba(20,184,166,0.18)]' : 'border-[#243249]'
      }`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between gap-4 p-5 text-start transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60"
        aria-expanded={isExpanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <CaptainAvatar captain={captain} captainName={captainName} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-extrabold text-[#F8FAFC] sm:text-xl">{captainName}</h3>
              {captain.is_verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-black text-[#14F5D5]">
                  <CheckCircle2 className="h-3 w-3" />
                  {isArabic ? 'موثق' : 'Verified'}
                </span>
              ) : null}
              {isPreferred ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.2)]">
                  <Heart className="h-3.5 w-3.5 fill-emerald-200 text-emerald-200" />
                  {isArabic ? 'كابتن مفضل' : 'Preferred Captain'}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#94A3B8]">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                <strong className="text-[#F8FAFC]">{rating}.0</strong>
              </span>
              <span className="rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 py-0.5 text-xs font-black text-[#14B8A6]">
                {rankLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#14B8A6]" />
                {offer.eta_minutes} {isArabic ? 'د' : 'min'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-end">
            <p className="text-[11px] font-bold text-[#94A3B8]">{isArabic ? 'السعر' : 'Price'}</p>
            <strong className="block text-xl font-black text-[#00ffcc] sm:text-2xl">
              {finalFare.toFixed(2)} {currencyCode}
            </strong>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-4 border-t border-white/5 p-5 pt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label={isArabic ? 'البعد عنك' : 'Distance'}
                value={`${offer.distance_km.toFixed(1)} ${isArabic ? 'كم' : 'km'}`}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label={isArabic ? 'يوصلك خلال' : 'ETA'}
                value={`${offer.eta_minutes} ${isArabic ? 'دقائق' : 'mins'}`}
                highlight
              />
              <InfoRow
                icon={<Navigation className="h-4 w-4" />}
                label={isArabic ? 'مدة الرحلة' : 'Trip duration'}
                value={durationLabel}
                helper={isArabic ? 'بدون تأخير مروري' : 'Without traffic delays'}
                highlight
              />
            </div>

            <div className="grid gap-3 rounded-xl bg-[#0B0F19]/70 p-4 sm:grid-cols-2">
              <InfoRow icon={<Car className="h-4 w-4" />} label={isArabic ? 'السيارة' : 'Vehicle'} value={vehicleSummary} />
              <InfoRow label={isArabic ? 'اللوحة' : 'Plate'} value={captain.plate_number?.trim() || (isArabic ? 'غير متاح' : 'Not available')} />
              {captain.vehicle_year ? <InfoRow label={isArabic ? 'سنة الصنع' : 'Year'} value={String(captain.vehicle_year)} /> : null}
              {captain.vehicle_category ? <InfoRow label={isArabic ? 'الفئة' : 'Category'} value={captain.vehicle_category} /> : null}
            </div>

            <div className="grid gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 sm:grid-cols-2">
              <InfoRow icon={<Building2 className="h-4 w-4" />} label={isArabic ? 'نوع الكابتن' : 'Captain type'} value={companyLabel} />
              <InfoRow icon={<Trophy className="h-4 w-4" />} label={isArabic ? 'الرحلات المكتملة' : 'Completed trips'} value={String(completedTrips)} />
            </div>

            {captain.phone || captain.contact_url ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {captain.phone ? (
                  <a
                    href={`tel:${captain.phone}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-sm font-black text-[#14F5D5] transition hover:bg-[#14B8A6]/20"
                  >
                    <Phone className="h-4 w-4" />
                    {isArabic ? 'اتصال' : 'Call'}
                  </a>
                ) : null}
                {captain.contact_url ? (
                  <a
                    href={captain.contact_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-white transition hover:border-[#14B8A6]/35 hover:bg-[#14B8A6]/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {isArabic ? 'رابط التواصل' : 'Contact link'}
                  </a>
                ) : null}
              </div>
            ) : null}

            {hasPremium ? (
              <div className="rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-4">
                <div className="space-y-2 text-sm">
                  <BreakdownRow label={isArabic ? 'سعر الرحلة الأساسي' : 'Base trip fare'} value={`${baseFare.toFixed(2)} ${currencyCode}`} />
                  <BreakdownRow
                    label={isArabic ? `علاوة الجودة (${rankLabel})` : `Quality surcharge (${rankLabel})`}
                    value={`+${rankPremiumValue.toFixed(2)} ${currencyCode}`}
                    accent
                  />
                  <BreakdownRow label={isArabic ? 'السعر الإجمالي' : 'Total price'} value={`${finalFare.toFixed(2)} ${currencyCode}`} accent strong />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#94A3B8]">
                  {isArabic
                    ? `يشمل ${premiumPercent}% علاوة جودة اختارها الكابتن ضمن الحد المسموح لرتبة ${rankLabel} من 1 إلى ${maxPremiumPercent}%.`
                    : `Includes a ${premiumPercent}% quality premium selected by the captain within the allowed ${rankLabel} range: 1-${maxPremiumPercent}%.`}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#14B8A6]/35 bg-[#14B8A6]/10 p-4">
                <BreakdownRow label={isArabic ? 'السعر الإجمالي' : 'Total price'} value={`${finalFare.toFixed(2)} ${currencyCode}`} accent strong />
              </div>
            )}

            {offer.additional_info ? (
              <p className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-[#94A3B8]">
                {offer.additional_info}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => onAccept(offer)}
              disabled={isAccepting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] py-3 font-extrabold text-[#0B0F19] transition-all duration-300 hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161F30] disabled:cursor-wait disabled:opacity-60"
            >
              <Navigation className="h-5 w-5" />
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
        className="h-14 w-14 shrink-0 rounded-2xl border border-[#14B8A6]/30 object-cover"
      />
    );
  }

  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10">
      <ShieldCheck className="h-7 w-7 text-[#14B8A6]" />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  helper,
  highlight = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-black/20 p-3">
      <p className="flex items-center gap-2 text-xs font-bold text-[#94A3B8]">
        {icon ? <span className={highlight ? 'text-[#14B8A6]' : 'text-[#94A3B8]'}>{icon}</span> : null}
        {label}
      </p>
      <p className={`mt-1 truncate text-lg font-extrabold ${highlight ? 'text-[#14B8A6]' : 'text-[#F8FAFC]'}`}>{value}</p>
      {helper ? <p className="mt-0.5 text-[11px] font-semibold text-[#94A3B8]/75">{helper}</p> : null}
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
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'font-black text-[#F8FAFC]' : 'text-[#94A3B8]'}>{label}</span>
      <strong className={`${accent ? 'text-[#14B8A6]' : 'text-[#F8FAFC]'} ${strong ? 'text-lg' : ''}`}>{value}</strong>
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
