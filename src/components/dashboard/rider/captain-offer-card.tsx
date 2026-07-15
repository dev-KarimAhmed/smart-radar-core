'use client';

import React from 'react';
import { Car, Clock, Heart, MapPin, Navigation, ShieldCheck, Star } from 'lucide-react';

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
}

export interface CaptainOffer {
  id: string;
  captain: CaptainProfile;
  server_fare: number;
  submitted_fare?: number;
  eta_minutes: number;
  distance_km: number;
}

interface CaptainOfferCardProps {
  offer: CaptainOffer;
  currencyCode?: string;
  language?: 'ar' | 'en';
  isAccepting?: boolean;
  isPreferred?: boolean;
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
    [captain.vehicle_model, captain.vehicle_color].filter((value) => value && value.trim()).join(' - ') ||
    (isArabic ? 'سيارة' : 'Vehicle');

  return (
    <article
      dir={isArabic ? 'rtl' : 'ltr'}
      className={`group rounded-2xl border bg-[#161F30]/80 p-5 text-[#F8FAFC] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-[#14B8A6] ${
        isPreferred ? 'border-emerald-300/60 shadow-[0_0_34px_rgba(20,184,166,0.18)]' : 'border-[#243249]'
      }`}
    >
      {isPreferred ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/45 bg-emerald-400/15 px-4 py-3 text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.22)]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-300/20 shadow-[0_0_18px_rgba(52,211,153,0.28)]">
              <Heart className="h-5 w-5 fill-emerald-200 text-emerald-200" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-emerald-100">
                {isArabic ? '⭐ ناقل مفضل' : '⭐ Preferred Captain'}
              </p>
              <p className="text-[11px] font-semibold text-emerald-100/75">
                {isArabic ? 'تم حفظ هذا الكابتن في قائمتك المفضلة' : 'Saved in your preferred captains list'}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[#0B0F19]/80 px-3 py-1 text-[10px] font-black text-[#00ffcc]">
            {isArabic ? 'أولوية' : 'Priority'}
          </span>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {captain.avatar_url ? (
              <img
                src={captain.avatar_url}
                alt={captainName}
                className="h-12 w-12 rounded-2xl border border-[#14B8A6]/30 object-cover"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10">
                <ShieldCheck className="h-6 w-6 text-[#14B8A6]" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-xl font-extrabold text-[#F8FAFC]">{captainName}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[#94A3B8]">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                <span className="font-bold text-[#F8FAFC]">{rating}.0</span>
                <span>/</span>
                <span className="rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 py-0.5 text-xs font-black text-[#14B8A6]">
                  {rankLabel}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-left ltr:text-right">
          <p className="text-xs font-bold text-[#94A3B8]">{isArabic ? 'السعر الإجمالي' : 'Total price'}</p>
          <strong className="mt-1 block text-2xl font-black text-[#00ffcc]">
            {finalFare.toFixed(2)} {currencyCode}
          </strong>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-white/5 bg-black/20 p-4 sm:grid-cols-2">
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
      </div>

      <div className="mt-3 grid gap-3 rounded-xl bg-[#0B0F19]/70 p-4 sm:grid-cols-2">
        <InfoRow icon={<Car className="h-4 w-4" />} label={isArabic ? 'السيارة' : 'Vehicle'} value={vehicleSummary} />
        <InfoRow label={isArabic ? 'اللوحة' : 'Plate'} value={captain.plate_number?.trim() || (isArabic ? 'غير متاح' : 'Not available')} />
      </div>

      {hasPremium ? (
        <div className="mt-4 rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-4">
          <div className="space-y-2 text-sm">
            <BreakdownRow label={isArabic ? 'سعر الرحلة الأساسي' : 'Base trip fare'} value={`${baseFare.toFixed(2)} ${currencyCode}`} />
            <BreakdownRow
              label={isArabic ? `علاوة الجودة (${rankLabel})` : `Quality surcharge (${rankLabel})`}
              value={`+${rankPremiumValue.toFixed(2)} ${currencyCode}`}
              accent
            />
            <div className="mt-3 rounded-2xl border border-[#14B8A6]/40 bg-[#0B0F19]/80 px-4 py-3 shadow-[0_0_18px_rgba(20,184,166,0.12)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-black text-[#F8FAFC]">{isArabic ? 'السعر الإجمالي' : 'Total price'}</span>
                <strong className="text-xl font-black text-[#00ffcc]">{finalFare.toFixed(2)} {currencyCode}</strong>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#94A3B8]">
            {isArabic
              ? `يشمل ${premiumPercent}% علاوة جودة اختارها الكابتن ضمن الحد المسموح لرتبة [${rankLabel}] من 1 إلى ${maxPremiumPercent}%.`
              : `Includes a ${premiumPercent}% quality premium selected by the captain within the allowed ${rankLabel} range: 1-${maxPremiumPercent}%.`}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[#14B8A6]/35 bg-[#14B8A6]/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-black text-[#F8FAFC]">{isArabic ? 'السعر الإجمالي' : 'Total price'}</span>
            <strong className="text-xl font-black text-[#00ffcc]">{finalFare.toFixed(2)} {currencyCode}</strong>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onAccept(offer)}
        disabled={isAccepting}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] py-3 font-extrabold text-[#0B0F19] transition-all duration-300 hover:bg-opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        <Navigation className="h-5 w-5" />
        {isAccepting ? (isArabic ? 'جاري قبول العرض...' : 'Accepting offer...') : isArabic ? 'قبول العرض' : 'Accept offer'}
      </button>
    </article>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-xs font-bold text-[#94A3B8]">
        {icon ? <span className={highlight ? 'text-[#14B8A6]' : 'text-[#94A3B8]'}>{icon}</span> : null}
        {label}
      </p>
      <p className={`mt-1 truncate font-extrabold ${highlight ? 'text-[#14B8A6]' : 'text-[#F8FAFC]'}`}>{value}</p>
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
