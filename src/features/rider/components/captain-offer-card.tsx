'use client';

import React from 'react';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Heart,
  MapPin,
  Navigation,
  Star,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { preferRoutedMinutes } from '@/shared/services/trip-duration';

import { 
  styles, 
  CaptainOffer, 
  CaptainOfferCardCountdown,
  rankLabels,
  getCaptainOfferPricing,
  formatMinutes
} from './offer-card/offer-card-shared';
import { OfferCardCaptain } from './offer-card/offer-card-captain';
import { OfferCardCountdownBar } from './offer-card/offer-card-countdown-bar';
import { resolveOfferAffiliationAndPricing } from './offer-card/offer-card-pricing-label';

interface CaptainOfferCardProps {
  offer: CaptainOffer;
  currencyCode?: string;
  isAccepting?: boolean;
  isPreferred?: boolean;
  isExpanded?: boolean;
  countdown?: CaptainOfferCardCountdown;
  onToggleExpand?: () => void;
  onAccept: (offer: CaptainOffer) => void;
}

function CaptainOfferCardBase({
  offer,
  currencyCode = 'EGP',
  isAccepting = false,
  isPreferred = false,
  isExpanded = false,
  countdown,
  onToggleExpand,
  onAccept,
}: CaptainOfferCardProps) {
  // Never render an offer whose validity countdown has expired
  if (countdown?.isExpired) {
    return null;
  }

  const t = useTranslations('Rider.CaptainOfferCard');
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const language = isArabic ? 'ar' : 'en';

  const captain = offer.captain;
  const rating = Math.floor(Number(captain.trust_rating) || 5);
  const rankLabel = rankLabels[language][captain.rank] || captain.rank;
  const { finalFare } = getCaptainOfferPricing(offer);
  
  const captainName = captain.name?.trim() || t('captain');
  const { pricingLabel } = resolveOfferAffiliationAndPricing(offer, t, isArabic);
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);

  const rankBadgeStyle = (() => {
    switch (captain.rank) {
      case 'DIAMOND':
        return 'border-cyan-300/60 bg-gradient-to-r from-cyan-500/25 to-blue-600/25 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]';
      case 'PLATINUM':
        return 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200';
      case 'GOLD':
        return 'border-amber-400/60 bg-amber-500/20 text-amber-200';
      case 'BRONZE':
        return 'border-amber-700/50 bg-amber-800/20 text-amber-300';
      case 'SILVER':
        return 'border-slate-400/50 bg-slate-500/20 text-slate-200';
      default:
        return 'border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14F5D5]';
    }
  })();

  const durationLabel = formatMinutes(
    preferRoutedMinutes(offer.estimated_duration_minutes, offer.trip_distance_km || offer.distance_km),
    language,
  );
  const tripDistance = offer.trip_distance_km ?? offer.distance_km;

  return (
    <article
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(styles.style136_1, isPreferred ? styles.style137_2 : styles.style137_3)}
    >
      {/* 1. اسم الكابتن والتقييم والرتبة (Page 9) */}
      <div className="p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {isPreferred ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.3)]">
                <Heart className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                <span>{isArabic ? 'كابتن مفضل' : t('preferredCaptain')}</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">
                {isArabic ? 'الكابتن' : t('captain')}
              </span>
            )}
            <span className="text-slate-400 text-xs font-bold">/</span>
            <h3 dir="auto" className={cn(
              "text-lg sm:text-xl font-black truncate",
              isPreferred ? "text-amber-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "text-[#F8FAFC]"
            )}>
              {captainName}
            </h3>
            {captain.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-black text-[#14F5D5]">
                <CheckCircle2 className="h-3 w-3" />
                {t('verified')}
              </span>
            ) : null}
          </div>

          {/* تقييم خدماته (5/5) ★ */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs font-black text-amber-300 shadow-sm">
              <span className="text-[10px] font-bold text-slate-300">{isArabic ? 'تقييم خدماته:' : 'Rating:'}</span>
              <span className="flex items-center gap-1 font-mono">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                <span>({rating}/5)</span>
              </span>
            </span>
            {completedTrips > 0 ? (
              <span className="text-[11px] text-slate-400 font-semibold">
                ({completedTrips} {t('trips')})
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 2. الوجهة: واضحة وبارزة وتظهر كاملة */}
      {(offer.destination_label || (offer as any).destinationLabel) ? (
        <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-[#14B8A6]/35 bg-gradient-to-r from-[#14B8A6]/15 via-[#081324] to-[#040812] px-3.5 py-2.5 shadow-sm sm:mx-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/20 text-[#14F5D5] mt-0.5">
            <MapPin className="h-4 w-4 text-[#14F5D5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#14F5D5]/80 mb-0.5">
              {isArabic ? 'يقدم عرض نقلكم إلى' : 'Offers ride to'}
            </span>
            <p className="text-xs sm:text-sm font-black text-white leading-relaxed break-words whitespace-normal" dir="auto">
              {offer.destination_label || (offer as any).destinationLabel}
            </p>
          </div>
        </div>
      ) : null}

      {/* 3. مؤشر مدة قبول العرض: مقسم على مراحل بالكامل */}
      <OfferCardCountdownBar countdown={countdown} isArabic={isArabic} />

      {/* 4. كارد السعر ونوع التسعير فوق تفاصيل الوصول والمسافة */}
      <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-[#14B8A6]/35 bg-gradient-to-r from-[#14B8A6]/15 via-[#081324] to-[#040812] px-4 py-3 shadow-md sm:mx-5">
        <div className="flex items-baseline gap-1.5" dir="ltr">
          <strong className="text-2xl sm:text-3xl font-black leading-none text-[#14F5D5] font-mono drop-shadow-[0_0_10px_rgba(20,245,213,0.35)]">
            {finalFare.toFixed(2)}
          </strong>
          <span className="text-xs sm:text-sm font-black text-[#14F5D5]">{currencyCode}</span>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black text-[#14F5D5] tracking-wide">
            {pricingLabel}
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black", rankBadgeStyle)}>
            <Award className="h-3 w-3" />
            <span>{rankLabel}</span>
          </span>
        </div>
      </div>

      {/* 5. تفاصيل الوصول والمسافة */}
      <div className="mx-4 mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30 sm:mx-5">
        <div className="px-2 py-2.5 text-center">
          <span className="block text-[10px] font-bold leading-tight text-[#94A3B8]">{isArabic ? 'وصول الكابتن المعلن' : t('arrivesIn')}</span>
          <span className="mt-1 block text-sm sm:text-base font-black text-[#14F5D5]">{formatMinutes(offer.eta_minutes, language)}</span>
        </div>
        <div className="border-s border-white/[0.07] px-2 py-2.5 text-center">
          <span className="block text-[10px] font-bold leading-tight text-[#94A3B8]">{t('tripTime')}</span>
          <span className="mt-1 block text-sm sm:text-base font-black text-white">{durationLabel}</span>
        </div>
        <div className="border-s border-white/[0.07] px-2 py-2.5 text-center">
          <span className="block text-[10px] font-bold leading-tight text-[#94A3B8]">{t('tripDistance')}</span>
          <span className="mt-1 block text-sm sm:text-base font-black text-white">{Number(tripDistance || 0).toFixed(1)} {t('km')}</span>
        </div>
      </div>

      {/* 6. أزرار الإجراءات */}
      <div className="flex items-stretch gap-2.5 p-4 pt-3 sm:p-5 sm:pt-3">
        <button
          type="button"
          onClick={() => onAccept(offer)}
          disabled={isAccepting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] py-3.5 px-4 text-sm font-extrabold text-[#0B0F19] transition-all duration-300 hover:bg-[#2DD4BF] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/70 disabled:cursor-wait disabled:opacity-60 cursor-pointer shadow-lg shadow-[#14B8A6]/20 whitespace-nowrap"
        >
          <Navigation className="h-5 w-5 shrink-0" />
          <span>{isAccepting ? t('accepting') : t('acceptOffer')}</span>
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs font-black text-slate-200 transition hover:border-[#14B8A6]/35 hover:bg-[#14B8A6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 cursor-pointer whitespace-nowrap"
          aria-expanded={isExpanded}
        >
          <span>{isArabic ? 'تعرف على المعلن' : 'About Advertiser'}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
        </button>
      </div>

      {/* 7. التفاصيل الموسعة: فقط بيانات الكابتن والمركبة */}
      <div
        className={cn(styles.style192_26, isExpanded ? styles.style193_27 : styles.style193_28)}
      >
        <div className={styles.style196_29}>
          <div className={styles.cardBody}>
            <OfferCardCaptain offer={offer} />

            {offer.additional_info ? (
              <p className={styles.additionalInfo}>
                {offer.additional_info}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export const CaptainOfferCard = React.memo(CaptainOfferCardBase);
