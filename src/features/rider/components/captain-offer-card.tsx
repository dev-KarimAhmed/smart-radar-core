'use client';

import React from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Heart,
  MapPin,
  Navigation,
  Star,
  Timer,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { preferRoutedMinutes } from '@/shared/services/trip-duration';
import { formatCountdown } from '@/shared/services/trip-countdown';

import { 
  styles, 
  CaptainOffer, 
  CaptainOfferCardCountdown,
  rankLabels,
  getCaptainOfferPricing,
  formatMinutes
} from './offer-card/offer-card-shared';
import { OfferCardCaptain } from './offer-card/offer-card-captain';

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

export function CaptainOfferCard({
  offer,
  currencyCode = 'EGP',
  isAccepting = false,
  isPreferred = false,
  isExpanded = false,
  countdown,
  onToggleExpand,
  onAccept,
}: CaptainOfferCardProps) {
  const t = useTranslations('Rider.CaptainOfferCard');
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const language = isArabic ? 'ar' : 'en';

  const captain = offer.captain;
  const rating = Math.floor(Number(captain.trust_rating) || 5);
  const rankLabel = rankLabels[language][captain.rank] || captain.rank;
  const { finalFare } = getCaptainOfferPricing(offer);
  
  const captainName = captain.name?.trim() || t('captain');
  const companyLabel = captain.company_name?.trim()
    || captain.affiliation_label?.trim()
    || t('independentCaptain');

  const pricingMode = offer.pricing_mode || (offer as any).pricingMode;
  const affiliationType = (captain.affiliation_type || (captain as any).employment_type || '').toLowerCase();
  const isTaxiOffer = pricingMode === 'TAXI' || affiliationType === 'office-taxi' || affiliationType.includes('taxi');
  const isAppOffer = pricingMode === 'APP' || affiliationType === 'smart-app' || affiliationType.includes('app');
  const completedTrips = Math.max(0, Number(captain.completed_trips) || 0);

  const durationLabel = formatMinutes(
    preferRoutedMinutes(offer.estimated_duration_minutes, offer.trip_distance_km || offer.distance_km),
    language,
  );
  const tripDistance = offer.trip_distance_km ?? offer.distance_km;

  const isCountdownUrgent = Boolean(
    countdown?.hasCountdown
    && (countdown.percentRemaining <= 20 || countdown.remainingSeconds <= 10),
  );

  const captainSerial = captain.serial_number || captain.id?.slice(0, 8).toUpperCase() || '---';

  const pricingLabel = isTaxiOffer
    ? (isArabic ? 'تسعير العداد / تاكسي' : 'Meter Fare / Taxi')
    : isAppOffer
    ? (companyLabel && companyLabel !== t('independentCaptain')
        ? `${isArabic ? 'تسعير التطبيق' : 'App Fare'} / ${companyLabel}`
        : (isArabic ? 'تسعير التطبيق / أوبر' : 'App Fare / Uber'))
    : (isArabic ? 'تسعير حر مباشر' : 'Direct Fare');

  return (
    <article
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(styles.style136_1, isPreferred ? styles.style137_2 : styles.style137_3)}
    >
      {/* 1. اسم الكابتن والتقييم والكود في الأعلى بشكل أنيق وبدون صندوق الأفاتار الضخم */}
      <div className="p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h3 dir="auto" className="text-xl sm:text-2xl font-black text-[#F8FAFC] truncate">
              {captainName}
            </h3>
            {captain.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-black text-[#14F5D5]">
                <CheckCircle2 className="h-3 w-3" />
                {t('verified')}
              </span>
            ) : null}
            {isPreferred ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.2)]">
                <Heart className="h-3.5 w-3.5 fill-emerald-200 text-emerald-200" />
                {t('preferredCaptain')}
              </span>
            ) : null}
          </div>

          {/* الرقم التسلسلي للكابتن */}
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/12 px-2.5 py-1 font-mono text-xs font-black text-[#14F5D5] shadow-sm">
            <span className="text-[10px] font-bold text-slate-400">{isArabic ? 'كود:' : 'ID:'}</span>
            <span>#{captainSerial}</span>
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-xs font-black text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
            <span>{rating}.0</span>
          </span>
          <span className="rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2.5 py-0.5 text-xs font-black text-[#14B8A6]">
            {rankLabel}
          </span>
          {completedTrips > 0 ? (
            <>
              <span className="text-[#334155]">·</span>
              <span className="text-slate-400 font-semibold">{completedTrips} {t('trips')}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* 2. الوجهة: واضحة وبارزة ومميزة */}
      {(offer.destination_label || (offer as any).destinationLabel) ? (
        <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-xl border border-[#14B8A6]/35 bg-gradient-to-r from-[#14B8A6]/15 via-[#081324] to-[#040812] px-3.5 py-2.5 shadow-sm sm:mx-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/20 text-[#14F5D5]">
            <MapPin className="h-4 w-4 text-[#14F5D5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#14F5D5]/80">
              {isArabic ? 'الوجهة المطلوبة' : 'Destination'}
            </span>
            <p className="truncate text-xs sm:text-sm font-black text-white leading-tight mt-0.5" dir="auto">
              {offer.destination_label || (offer as any).destinationLabel}
            </p>
          </div>
        </div>
      ) : null}

      {/* 3. مؤشر صلاحية العرض: موضح بالكامل للراكب */}
      {countdown?.hasCountdown ? (
        <div className="mx-4 mt-3 rounded-xl border border-[#14B8A6]/25 bg-[#081220]/80 p-2.5 sm:mx-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-300">
              <Timer className="h-3.5 w-3.5 text-[#14F5D5]" />
              <span>{isArabic ? 'صلاحية قبول العرض تنتهي خلال:' : 'Offer validity expires in:'}</span>
            </span>
            <span
              className={cn(
                "font-mono font-black text-xs sm:text-sm",
                isCountdownUrgent ? "text-rose-400 animate-pulse" : "text-[#14F5D5]"
              )}
              dir="ltr"
            >
              {formatCountdown(countdown.remainingSeconds)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90 border border-white/5">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#14F5D5] transition-all duration-200 ease-linear shadow-[0_0_8px_rgba(20,245,213,0.5)]",
                isCountdownUrgent && "from-rose-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              )}
              style={{ width: `${countdown.percentRemaining}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* 4. تفاصيل الوصول والمسافة */}
      <div className="mx-4 mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30 sm:mx-5">
        <div className="px-2 py-2.5 text-center">
          <span className="block text-[10px] font-bold leading-tight text-[#94A3B8]">{t('arrivesIn')}</span>
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

      {/* 5. السعر النهائي وشارة التسعير */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 sm:px-5">
        <div>
          <span className="block text-[11px] font-bold text-[#94A3B8]">{t('finalPrice')}</span>
          <div className="mt-0.5 flex items-baseline gap-1.5" dir="ltr">
            <strong className="text-2xl sm:text-3xl font-black leading-none text-[#14F5D5]">{finalFare.toFixed(2)}</strong>
            <span className="text-xs font-bold text-[#14F5D5]/80">{currencyCode}</span>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/15 px-3 py-1.5 text-xs font-black text-[#14F5D5] shadow-sm">
            {pricingLabel}
          </span>
        </div>
      </div>

      {/* 6. أزرار الإجراءات */}
      <div className="flex items-stretch gap-2.5 p-4 pt-3 sm:p-5 sm:pt-3">
        <button
          type="button"
          onClick={() => onAccept(offer)}
          disabled={isAccepting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] py-3.5 text-sm font-extrabold text-[#0B0F19] transition-all duration-300 hover:bg-[#2DD4BF] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/70 disabled:cursor-wait disabled:opacity-60 cursor-pointer shadow-lg shadow-[#14B8A6]/20"
        >
          <Navigation className="h-5 w-5" />
          {isAccepting ? t('accepting') : t('acceptOffer')}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs font-black text-slate-200 transition hover:border-[#14B8A6]/35 hover:bg-[#14B8A6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 cursor-pointer"
          aria-expanded={isExpanded}
        >
          {t('details')}
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
