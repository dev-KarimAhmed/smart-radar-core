'use client';

import React from 'react';
import { Clock, MapPin, Radio, ShieldCheck, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { Offer } from '@/core/types';
import { cn } from '@/lib/utils';
import type { RiderMachineState } from '../state/rider-state-machine';
import type { CaptainPresencePoint } from '../services/rider-server-marketplace';
import { buildCaptainOfferFromOffer } from '../services/rider-offer-presentation';
import { getOfferCountdown } from '../services/offer-countdown';
import type { RiderLocation } from './rider-map';
import { CaptainOfferCard } from './captain-offer-card';

const TOTAL_SEARCH_SECONDS = 240; // 4 minutes

const styles = {
  cancelledWrapper: "space-y-4",
  rtl: "text-right",
  ltr: "text-left",
  cancelledCard: "rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5",
  cancelledEyebrow: "text-[11px] font-black text-amber-200",
  cancelledTitle: "mt-2 text-xl font-bold text-white",
  cancelledDescription: "mt-3 text-sm leading-relaxed text-slate-300",
  retryButton: "h-14 w-full bg-[#14B8A6] text-[#0A0F1D] font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] hover:bg-[#2DD4BF] flex items-center justify-center cursor-pointer",
  wrapper: "space-y-3.5",
  offerList: "space-y-3",
} as const;

export interface ReceivingOffersScreenProps {
  isArabic: boolean;
  language: AppLanguage;
  state: RiderMachineState;
  currencyLabel: string;
  riderLocation: RiderLocation;
  captainLocations: CaptainPresencePoint[];
  preferredCaptainIds: string[];
  acceptingOfferId: string | null;
  expandedOfferId: string | null;
  onToggleExpandOffer: (offerId: string) => void;
  captainSearchRadiusKm: number;
  isExpandingCaptainSearch: boolean;
  isCancellingRideRequest: boolean;
  onCancelRideRequest: () => void;
  onAcceptOffer: (offer: Offer) => void;
  onRetry: () => void;
  firstSeenAtRef: React.RefObject<Map<string, number>>;
}

export function ReceivingOffersScreen({
  isArabic,
  language,
  state,
  currencyLabel,
  riderLocation,
  captainLocations,
  preferredCaptainIds,
  acceptingOfferId,
  expandedOfferId,
  onToggleExpandOffer,
  captainSearchRadiusKm,
  isExpandingCaptainSearch,
  isCancellingRideRequest,
  onCancelRideRequest,
  onAcceptOffer,
  onRetry,
  firstSeenAtRef,
}: ReceivingOffersScreenProps) {
  const t = useTranslations('riderView');
  const isCancelled = !!state.requestCancelledAt;

  const fallbackStartedAtRef = React.useRef<number | null>(null);
  if (fallbackStartedAtRef.current === null) {
    fallbackStartedAtRef.current = Date.now();
  }

  // Ticks smoothly for the 4-minute search countdown & for each offer's wait-seconds progress bar
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const startedAt = state.requestStartedAt ?? fallbackStartedAtRef.current;
  const elapsedMs = Math.max(0, now - startedAt);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, TOTAL_SEARCH_SECONDS - elapsedSeconds);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const stages = React.useMemo(() => {
    return isArabic
      ? [
          {
            index: 0,
            title: 'رصد النطاق الأولي (1.5 كم)',
            description: isExpandingCaptainSearch
              ? 'جاري توسيع الدائرة لاستقطاب المزيد من الكباتن المتاحين...'
              : 'جاري مسح ومطابقة أقرب الكباتن المتواجدين في محيطك المباشر',
            badge: '1.5 كم',
          },
          {
            index: 1,
            title: 'توسيع الرادار الجغرافي (2.5 كم)',
            description: 'تم توسيع نطاق البحث تلقائياً ليشمل جميع كباتن المنطقة والمحيط المجاور',
            badge: '2.5 كم',
          },
          {
            index: 2,
            title: 'بث الطلب المباشر للكباتن',
            description: 'طلبك معروض الآن في صالة مزاد الكباتن، بانتظار تقديم أفضل الأسعار التنافسية',
            badge: 'بث حي',
          },
          {
            index: 3,
            title: 'المسح النهائي وتحديث الاستجابة',
            description: 'جولة البحث الأخيرة في المنطقة لتأكيد حجز كابتن مناسب قبل إغلاق الطلب',
            badge: 'مسح أخير',
          },
        ]
      : [
          {
            index: 0,
            title: 'Scanning Immediate Area (1.5 km)',
            description: isExpandingCaptainSearch
              ? 'Expanding coverage to find more nearby captains...'
              : 'Scanning for the closest active captains in your immediate area',
            badge: '1.5 km',
          },
          {
            index: 1,
            title: 'Expanded Radar Range (2.5 km)',
            description: 'Radar coverage expanded to include all available captains in the sector',
            badge: '2.5 km',
          },
          {
            index: 2,
            title: 'Live Request Broadcasting',
            description: 'Your request is actively broadcasted to available drivers for optimal fare bids',
            badge: 'Live Bids',
          },
          {
            index: 3,
            title: 'Final Search Sweep',
            description: 'Final search cycle to secure an available captain before search closes',
            badge: 'Final',
          },
        ];
  }, [isArabic, isExpandingCaptainSearch]);

  const currentStageIndex = Math.min(3, Math.floor(elapsedSeconds / 60));
  const currentStage = stages[currentStageIndex];

  const hasOffers = state.offers.length > 0;

  const labels = React.useMemo(() => ({
    fallbackCaptainName: t('offerPresentation.fallbackCaptainName'),
    notAvailable: t('offerPresentation.notAvailable'),
    affiliationUber: t('offerPresentation.affiliationUber'),
    affiliationIndrive: t('offerPresentation.affiliationIndrive'),
    affiliationCareem: t('offerPresentation.affiliationCareem'),
    affiliationCompany: t('offerPresentation.affiliationCompany'),
    affiliationSelfEmployed: t('offerPresentation.affiliationSelfEmployed'),
    affiliationAppDriver: t('offerPresentation.affiliationAppDriver'),
  }), [t]);

  if (isCancelled) {
    return (
      <div className={cn(styles.cancelledWrapper, isArabic ? styles.rtl : styles.ltr)} dir={isArabic ? 'rtl' : 'ltr'}>
        <div className={styles.cancelledCard}>
          <p className={styles.cancelledEyebrow}>{t('offers.noOffersEyebrow')}</p>
          <h2 className={styles.cancelledTitle}>{t('offers.noOffersTitle')}</h2>
          <p className={styles.cancelledDescription}>
            {t('offers.noOffersDescription')}
          </p>
        </div>

        <button onClick={onRetry} className={styles.retryButton}>
          {t('offers.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={cn(styles.wrapper, isArabic ? styles.rtl : styles.ltr)} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Unified Master Status & Route Card - Deep Dark Cyan Cyberpunk Border */}
      <div className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#0C1527] via-[#080E1C] to-[#040812] p-4 shadow-2xl shadow-black/50 transition-all duration-300">
        {/* Subtle accent light on top border */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

        {hasOffers ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {t('offers.chooseCaptain')}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {isArabic ? 'اختر العرض الأنسب لك لبدء الرحلة فوراً' : 'Select your preferred offer to start the ride'}
              </p>
            </div>

            <button
              type="button"
              onClick={onCancelRideRequest}
              disabled={isCancellingRideRequest}
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs font-black text-rose-200 shadow-sm transition-all duration-200 hover:border-rose-500/70 hover:bg-rose-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <X className="h-4 w-4 text-rose-400 transition-transform group-hover:rotate-90" />
              <span>{isCancellingRideRequest ? t('request.cancelling') : (isArabic ? 'إلغاء الطلب' : t('request.cancel'))}</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-1 shadow-sm shadow-[#14B8A6]/10">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F5D5]" />
                </span>
                <span className="text-[11px] font-black text-[#14F5D5]">
                  {t('offers.searchingCaptain')}
                </span>
              </div>

              <button
                type="button"
                onClick={onCancelRideRequest}
                disabled={isCancellingRideRequest}
                className="group inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-black text-rose-200 shadow-sm transition-all duration-200 hover:border-rose-500/70 hover:bg-rose-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-rose-400 transition-transform group-hover:rotate-90" />
                <span>{isCancellingRideRequest ? t('request.cancelling') : t('request.cancel')}</span>
              </button>
            </div>

            <div className="mt-3">
              <h2 className="text-lg font-black text-white leading-snug">
                {t('request.visibleTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                {t('offers.waitingDescription')}
              </p>
            </div>

            {(state.destination?.label || state.requestId) ? (
              <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-[#14B8A6]/20 bg-[#03060E]/90 px-3 py-2.5 transition-colors hover:border-[#14B8A6]/40">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]">
                  <MapPin className="h-4 w-4 text-[#14F5D5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {t('destination.label')}
                  </span>
                  <p className="mt-0.5 truncate text-xs sm:text-sm font-black text-white leading-tight" dir="auto">
                    {state.destination?.label || t('destination.notAvailable')}
                  </p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {!hasOffers ? (
        <div className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#0C1527] via-[#080E1C] to-[#040812] p-5 sm:p-6 shadow-2xl shadow-black/50">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 h-36 w-64 rounded-full bg-[#14F5D5]/10 blur-3xl" />

          {/* Top Row inside Card: Live Stage Badge & Countdown Capsule */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Live Stage Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 text-xs font-black text-[#14F5D5] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F5D5]" />
              </span>
              <span>{isArabic ? `المرحلة ${currentStageIndex + 1} من 4` : `Stage ${currentStageIndex + 1} of 4`}</span>
            </div>

            {/* Countdown Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/25 bg-black/60 px-3.5 py-1 text-xs font-mono font-black text-white shadow-inner">
              <Clock className="h-3.5 w-3.5 text-[#14F5D5] animate-pulse" />
              <span className="text-[11px] text-slate-400 font-sans font-bold">{isArabic ? 'المتبقي:' : 'Left:'}</span>
              <span className="text-sm font-black text-[#14F5D5] tracking-wider">{formattedCountdown}</span>
            </div>
          </div>

          {/* Central Radar Pulse Graphic */}
          <div className="relative z-10 my-6 flex flex-col items-center justify-center">
            {/* Concentric Animated Radar Rings */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#14F5D5]/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute -inset-2 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/5 animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#14B8A6]/40 bg-gradient-to-br from-[#14B8A6]/25 to-[#060D17] text-[#14F5D5] shadow-[0_0_24px_rgba(20,245,213,0.25)]">
                <Radio className="h-8 w-8 text-[#14F5D5] animate-pulse" />
              </div>
            </div>

            {/* Current Stage Title & Live Subtitle */}
            <h3 className="mt-3.5 text-base sm:text-lg font-black text-white text-center tracking-tight">
              {currentStage.title}
            </h3>
            <p className="mt-1 text-xs text-slate-300 text-center leading-relaxed max-w-sm">
              {currentStage.description}
            </p>
          </div>

          {/* Segmented Progress Bar (4 Segments for 4 Minutes) */}
          <div className="relative z-10 mt-2 space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {stages.map((stg) => {
                const start = stg.index * 60;
                const end = (stg.index + 1) * 60;
                const isCompleted = elapsedSeconds >= end;
                const isCurrent = elapsedSeconds >= start && elapsedSeconds < end;
                const fillPct = isCompleted ? 100 : isCurrent ? Math.min(100, Math.max(0, ((elapsedSeconds - start) / 60) * 100)) : 0;

                return (
                  <div key={stg.index} className="space-y-1.5">
                    <div className="h-2 w-full rounded-full bg-[#060D19] overflow-hidden relative border border-[#14B8A6]/20">
                      <div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#14F5D5] transition-all duration-300 ease-out",
                          isCurrent && "shadow-[0_0_12px_rgba(20,245,213,0.7)]"
                        )}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "text-[10px] font-black truncate max-w-full",
                        isCompleted || isCurrent ? "text-[#14F5D5]" : "text-slate-500"
                      )}>
                        {stg.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Security & Reassurance Ribbon */}
          <div className="relative z-10 mt-5 flex items-center justify-between rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/5 px-3.5 py-2.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-[#14F5D5]" />
              <span>{isArabic ? 'رادار جغرافي فوري مشفّر' : 'Encrypted Geospatial Radar'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {isArabic ? 'الحد الأقصى: 4:00 د' : 'Max Search: 4:00m'}
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.offerList}>
          {state.offers.map((offer) => {
            const { offer: captainOffer, isPreferred } = buildCaptainOfferFromOffer(
              offer,
              {
                captainLocations,
                riderLocation,
                destination: state.destination,
                preferredCaptainIds,
                language,
                serverEstimatedFare: state.destination?.serverEstimatedFare,
              },
              labels,
            );

            return (
              <CaptainOfferCard
                key={offer.id || offer.driverId}
                offer={captainOffer}
                currencyCode={currencyLabel || 'EGP'}
                isAccepting={acceptingOfferId === (offer.id || offer.driverId)}
                isPreferred={isPreferred}
                isExpanded={expandedOfferId === captainOffer.id}
                countdown={getOfferCountdown(offer, firstSeenAtRef.current.get(offer.id || offer.driverId), now)}
                onToggleExpand={() => onToggleExpandOffer(captainOffer.id)}
                onAccept={() => onAcceptOffer(offer)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
