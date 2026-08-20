'use client';

import React from 'react';
import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { Offer } from '@/core/types';
import { cn } from '@/lib/utils';
import type { RiderMachineState } from '../state/rider-state-machine';
import type { CaptainPresencePoint } from '../services/rider-server-marketplace';
import { buildCaptainOfferFromOffer } from '../services/rider-offer-presentation';
import { getOfferCountdown } from '../services/offer-countdown';
import { formatMoney } from '../services/rider-view-format';
import type { RiderLocation } from './rider-map';
import { Metric } from './rider-view-primitives';
import { CaptainOfferCard } from './captain-offer-card';

const styles = {
  cancelledWrapper: "space-y-4",
  rtl: "text-right",
  ltr: "text-left",
  cancelledCard: "rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5",
  cancelledEyebrow: "text-[11px] font-black text-amber-200",
  cancelledTitle: "mt-2 text-xl font-bold text-white",
  cancelledDescription: "mt-3 text-sm leading-relaxed text-slate-300",
  retryButton: "h-14 w-full bg-[#14B8A6] text-[#0A0F1D] font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] hover:bg-[#2DD4BF] flex items-center justify-center cursor-pointer",
  wrapper: "space-y-4",
  header: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
  headerText: "space-y-1",
  eyebrow: "text-[11px] font-black text-[#14F5D5]",
  title: "text-xl font-bold text-white",
  subtitle: "text-xs text-slate-400",
  cancelButton: "h-11 rounded-xl border border-red-500/30 bg-red-600/15 px-4 text-sm font-black text-red-100 hover:bg-red-600/25 flex items-center justify-center gap-1 cursor-pointer",
  cancelIcon: "h-4 w-4",
  savedCard: "rounded-2xl border border-white/5 bg-white/5 p-4",
  savedTitle: "mb-3 text-[11px] font-black text-[#14F5D5]",
  savedMetrics: "grid grid-cols-2 gap-3",
  loadingCard: "flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5",
  loadingIcon: "h-9 w-9 animate-spin text-[#14F5D5]",
  loadingText: "px-4 text-center text-xs font-bold leading-relaxed text-slate-300",
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
}: ReceivingOffersScreenProps) {
  const t = useTranslations('riderView');
  const isCancelled = !!state.requestCancelledAt;

  // Ticks once a second so each offer's wait-seconds countdown updates and
  // expired offers (captain-chosen visibility window elapsed unanswered)
  // drop out of the list — shared here rather than one timer per card.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (state.offers.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [state.offers.length]);

  // The countdown is anchored to when THIS client first saw each offer, not
  // the server's created_at — that would be vulnerable to realtime/fetch
  // latency and any client/server clock skew, and could read as "expired"
  // the instant it arrives. One first-seen timestamp per offer id, forever.
  const firstSeenAtRef = React.useRef<Map<string, number>>(new Map());
  for (const offer of state.offers) {
    const offerId = offer.id || offer.driverId;
    if (offerId && !firstSeenAtRef.current.has(offerId)) {
      firstSeenAtRef.current.set(offerId, Date.now());
    }
  }

  const visibleOffers = React.useMemo(
    () => state.offers.filter((offer) => {
      const offerId = offer.id || offer.driverId;
      return !getOfferCountdown(offer, firstSeenAtRef.current.get(offerId), now).isExpired;
    }),
    [state.offers, now],
  );
  const hasOffers = visibleOffers.length > 0;


  const requestFareLabel = state.destination?.serverEstimatedFare !== undefined
    ? formatMoney(state.destination.serverEstimatedFare, currencyLabel)
    : t('destination.notAvailable');
  const shortRequestId = state.requestId ? state.requestId.slice(0, 8).toUpperCase() : t('destination.notAvailable');

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
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>{hasOffers ? t('offers.arrived') : t('offers.searchingCaptain')}</p>
          <h2 className={styles.title}>{hasOffers ? t('offers.chooseCaptain') : t('request.visibleTitle')}</h2>
          <p className={styles.subtitle}>
            {hasOffers ? t('offers.chooseOfferDescription') : t('offers.waitingDescription')}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancelRideRequest}
          disabled={isCancellingRideRequest}
          className={styles.cancelButton}
        >
          <X className={styles.cancelIcon} />
          {isCancellingRideRequest ? t('request.cancelling') : t('request.cancel')}
        </button>
      </div>

      {state.requestId ? (
        <div className={styles.savedCard}>
          <p className={styles.savedTitle}>{t('request.savedTitle')}</p>
          <div className={styles.savedMetrics}>
            <Metric label={t('request.number')} value={shortRequestId} />
            <Metric label={t('request.status')} value={t('request.savedInDatabase')} />
            <Metric label={t('destination.label')} value={state.destination?.label || t('destination.notAvailable')} />
            {/* Estimated fare display disabled — kept hidden from rider by product request.
            <Metric label={t('fare.server')} value={requestFareLabel} />
            */}
          </div>
        </div>
      ) : null}

      {!hasOffers ? (
        <div className={styles.loadingCard}>
          <Loader2 className={styles.loadingIcon} />
          <span className={styles.loadingText}>
            {isExpandingCaptainSearch
              ? t('offers.expandingRadius')
              : captainSearchRadiusKm > 1.5
                ? t('offers.radiusExpanded')
                : t('offers.waitingLoader')}
          </span>
        </div>
      ) : (
        <div className={styles.offerList}>
          {visibleOffers.map((offer) => {
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
                language={language === 'ar' ? 'ar' : 'en'}
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
