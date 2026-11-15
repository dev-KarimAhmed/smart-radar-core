'use client';

import React from 'react';
import { Clock, MapPin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useWakeLock } from '@/hooks/use-wake-lock';
import {
  styles,
  type ReceivingOffersScreenProps,
} from './receiving-offers/receiving-offers-types';
import { useReceivingOffersTimer } from './receiving-offers/use-receiving-offers-timer';
import { ReceivingOffersCancelledView } from './receiving-offers/receiving-offers-cancelled-view';
import { ReceivingOffersScanningView } from './receiving-offers/receiving-offers-scanning-view';
import { ReceivingOffersListView } from './receiving-offers/receiving-offers-list-view';

export { type ReceivingOffersScreenProps } from './receiving-offers/receiving-offers-types';

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

  useWakeLock(!isCancelled);

  const {
    now,
    elapsedSeconds,
    formattedCountdown,
    activeOffers,
    setIsOffersListRevealed,
    showOffersList,
    isSearchTimedOutWithoutOffers,
    stages,
    currentStage,
    labels,
  } = useReceivingOffersTimer({
    state,
    firstSeenAtRef,
    isArabic,
    isExpandingCaptainSearch,
    t,
  });

  if (isCancelled || isSearchTimedOutWithoutOffers) {
    return (
      <ReceivingOffersCancelledView
        isArabic={isArabic}
        onRetry={onRetry}
        onCancelRideRequest={onCancelRideRequest}
        isCancellingRideRequest={isCancellingRideRequest}
        t={t}
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
        <ReceivingOffersScanningView
          isArabic={isArabic}
          formattedCountdown={formattedCountdown}
          currentStage={currentStage}
          stages={stages}
          elapsedSeconds={elapsedSeconds}
          activeOffers={activeOffers}
          onRevealOffers={() => setIsOffersListRevealed(true)}
          onCancelRideRequest={onCancelRideRequest}
          isCancellingRideRequest={isCancellingRideRequest}
          t={t}
        />
      ) : (
        <ReceivingOffersListView
          activeOffers={activeOffers}
          state={state}
          captainLocations={captainLocations}
          riderLocation={riderLocation}
          preferredCaptainIds={preferredCaptainIds}
          language={language}
          labels={labels}
          currencyLabel={currencyLabel}
          acceptingOfferId={acceptingOfferId}
          expandedOfferId={expandedOfferId}
          onToggleExpandOffer={onToggleExpandOffer}
          onAcceptOffer={onAcceptOffer}
          onCancelRideRequest={onCancelRideRequest}
          isCancellingRideRequest={isCancellingRideRequest}
          firstSeenAtRef={firstSeenAtRef}
          now={now}
          isArabic={isArabic}
          t={t}
        />
      )}
    </div>
  );
}
