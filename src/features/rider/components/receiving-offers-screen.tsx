'use client';

import React from 'react';
import { Clock, MapPin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getServerTime } from '@/lib/server-time';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { Offer } from '@/core/types';
import { cn } from '@/lib/utils';
import type { RiderMachineState } from '../state/rider-state-machine';
import type { CaptainPresencePoint } from '../services/rider-server-marketplace';
import { buildCaptainOfferFromOffer } from '../services/rider-offer-presentation';
import { getOfferCountdown } from '../services/offer-countdown';
import type { RiderLocation } from './rider-map';
import { CaptainOfferCard } from './captain-offer-card';
import { useWakeLock } from '@/hooks/use-wake-lock';
import {
  TOTAL_SEARCH_SECONDS,
  STAGE_DURATION_SECONDS,
  receivingOffersStyles as styles,
  getRadarStages,
} from './receiving-offers-constants';
import { ReceivingOffersFallback } from './receiving-offers-fallback';
import { RadarScanningView } from './radar-scanning-view';

export {
  TOTAL_SEARCH_SECONDS,
  STAGE_DURATION_SECONDS,
  receivingOffersStyles,
  getRadarStages,
} from './receiving-offers-constants';
export { ReceivingOffersFallback } from './receiving-offers-fallback';
export { RadarScanningView } from './radar-scanning-view';

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
  isExpandingCaptainSearch,
  isCancellingRideRequest,
  onCancelRideRequest,
  onAcceptOffer,
  onRetry,
  firstSeenAtRef,
}: ReceivingOffersScreenProps) {
  const t = useTranslations('riderView');
  const isCancelled = !!state.requestCancelledAt;

  useWakeLock(!isCancelled);

  const fallbackStartedAtRef = React.useRef<number | null>(null);
  if (fallbackStartedAtRef.current === null) {
    fallbackStartedAtRef.current = getServerTime();
  }

  const [now, setNow] = React.useState(() => getServerTime());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(getServerTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const startedAt = state.requestStartedAt ?? fallbackStartedAtRef.current;
  const elapsedMs = Math.max(0, now - startedAt);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, TOTAL_SEARCH_SECONDS - elapsedSeconds);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const activeOffers = React.useMemo(() => {
    return state.offers.filter((offer) => {
      const offerId = offer.id || offer.driverId;
      const firstSeen = firstSeenAtRef.current?.get(offerId);
      const countdown = getOfferCountdown(offer, firstSeen, now);
      return !countdown.isExpired;
    });
  }, [firstSeenAtRef, now, state.offers]);

  const [isOffersListRevealed, setIsOffersListRevealed] = React.useState(false);

  React.useEffect(() => {
    if (remainingSeconds === 0 && activeOffers.length > 0) {
      setIsOffersListRevealed(true);
    }
  }, [remainingSeconds, activeOffers.length]);

  React.useEffect(() => {
    if (isOffersListRevealed && activeOffers.length === 0) {
      setIsOffersListRevealed(false);
    }
  }, [isOffersListRevealed, activeOffers.length]);

  const showOffersList = (isOffersListRevealed && activeOffers.length > 0) || (remainingSeconds === 0 && activeOffers.length > 0);
  const isSearchTimedOutWithoutOffers = remainingSeconds === 0 && activeOffers.length === 0;

  const stages = React.useMemo(() => {
    return getRadarStages(isArabic, isExpandingCaptainSearch);
  }, [isArabic, isExpandingCaptainSearch]);

  const currentStageIndex = Math.min(4, Math.floor(elapsedSeconds / STAGE_DURATION_SECONDS));
  const currentStage = stages[currentStageIndex];

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

  if (isCancelled || isSearchTimedOutWithoutOffers) {
    return (
      <ReceivingOffersFallback
        isArabic={isArabic}
        onRetry={onRetry}
        onCancelRideRequest={onCancelRideRequest}
        isCancellingRideRequest={isCancellingRideRequest}
        noOffersEyebrowText={t('offers.noOffersEyebrow')}
        noOffersTitleText={t('offers.noOffersTitle')}
        noOffersDescriptionText={t('offers.noOffersDescription')}
        retryText={t('offers.retry')}
        cancellingText={t('request.cancelling')}
        cancelText={t('request.cancel')}
      />
    );
  }

  return (
    <div className={cn(styles.wrapper, isArabic ? styles.rtl : styles.ltr)} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#0C1527] via-[#080E1C] to-[#040812] p-4 shadow-2xl shadow-black/50 transition-all duration-300">
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

        {showOffersList ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {isArabic ? 'اختار العرض المناسب' : t('offers.chooseCaptain')}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs text-[#14F5D5] font-bold">
                  {isArabic ? `انتظر العروض / ${activeOffers.length} إلى 9` : 'Choose the best offer to start your trip'}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14F5D5]/10 border border-[#14F5D5]/25 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#14F5D5]">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>{formattedCountdown}</span>
                </span>
              </div>
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
                  {isArabic ? 'طلبك ظاهر لدى الكباتن المعلنين' : t('offers.searchingCaptain')}
                </span>
              </div>

              <button
                type="button"
                onClick={onCancelRideRequest}
                disabled={isCancellingRideRequest}
                className="group inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-black text-rose-200 shadow-sm transition-all duration-200 hover:border-rose-500/70 hover:bg-rose-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-rose-400 transition-transform group-hover:rotate-90" />
                <span>{isCancellingRideRequest ? t('request.cancelling') : (isArabic ? 'إلغاء الطلب' : t('request.cancel'))}</span>
              </button>
            </div>

            <div className="mt-3">
              <h2 className="text-lg font-black text-white leading-snug">
                {isArabic ? 'طلبك ظاهر لدى الكباتن المعلنين' : t('request.visibleTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-[#14F5D5] font-bold leading-relaxed">
                {isArabic ? `انتظر العروض / ${activeOffers.length} إلى 9` : t('offers.waitingDescription')}
              </p>
            </div>

            {(state.destination?.label || state.requestId) ? (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-[#14B8A6]/20 bg-[#03060E]/90 p-3 transition-colors hover:border-[#14B8A6]/40">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5] mt-0.5">
                  <MapPin className="h-4 w-4 text-[#14F5D5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {t('destination.label')}
                  </span>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-white leading-relaxed break-words" dir="auto">
                    {state.destination?.label || t('destination.notAvailable')}
                  </p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {!showOffersList ? (
        <RadarScanningView
          isArabic={isArabic}
          formattedCountdown={formattedCountdown}
          currentStage={currentStage}
          stages={stages}
          elapsedSeconds={elapsedSeconds}
          activeOffers={activeOffers}
          isCancellingRideRequest={isCancellingRideRequest}
          onCancelRideRequest={onCancelRideRequest}
          onPreviewOffers={() => setIsOffersListRevealed(true)}
          cancelText={isArabic ? 'إلغاء الطلب' : t('request.cancel')}
          cancellingText={isArabic ? 'جاري إلغاء الطلب...' : t('request.cancelling')}
        />
      ) : (
        <div className="space-y-4">
          <div className={styles.offerList}>
            {activeOffers.map((offer) => {
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
                labels
              );

              return (
                <CaptainOfferCard
                  key={offer.id || offer.driverId}
                  offer={captainOffer}
                  currencyCode={currencyLabel || 'EGP'}
                  isAccepting={acceptingOfferId === (offer.id || offer.driverId)}
                  isPreferred={isPreferred}
                  isExpanded={expandedOfferId === captainOffer.id}
                  countdown={getOfferCountdown(offer, firstSeenAtRef.current?.get(offer.id || offer.driverId), now)}
                  onToggleExpand={() => onToggleExpandOffer(captainOffer.id)}
                  onAccept={() => onAcceptOffer(offer)}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={onCancelRideRequest}
            disabled={isCancellingRideRequest}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 text-sm font-black text-rose-200 shadow-lg shadow-rose-950/40 transition-all duration-200 hover:border-rose-500/70 hover:bg-rose-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4 text-rose-400 transition-transform group-hover:rotate-90" />
            <span>
              {isCancellingRideRequest
                ? (isArabic ? 'جاري إلغاء الطلب...' : t('request.cancelling'))
                : (isArabic ? 'إلغاء الطلب' : t('request.cancel'))}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
