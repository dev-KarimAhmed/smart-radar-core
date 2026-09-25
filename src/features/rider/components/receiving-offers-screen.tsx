'use client';

import React from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
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

  // Ticks a few times a second purely so each offer's wait-seconds progress
  // bar animates smoothly — actual expiry/removal from state.offers happens
  // in useOffersLifecycle, so this component always renders exactly what's
  // still live (no local filtering needed, and nothing here can desync the
  // auto-expand-first-offer logic from what's actually visible).
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (state.offers.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [state.offers.length]);

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
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>{hasOffers ? t('offers.arrived') : t('offers.searchingCaptain')}</p>
          <h2 className={styles.title}>{hasOffers ? t('offers.chooseCaptain') : t('request.visibleTitle')}</h2>
          {!hasOffers ? (
            <p className={styles.subtitle}>{t('offers.waitingDescription')}</p>
          ) : null}
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

      {state.destination?.label || state.requestId ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#14B8A6]/25 bg-gradient-to-r from-[#14B8A6]/10 via-[#0B0F19]/90 to-[#14B8A6]/5 p-3.5 shadow-lg shadow-black/30 backdrop-blur-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/15 text-[#14F5D5] shadow-sm shadow-[#14B8A6]/10">
            <MapPin className="h-5 w-5 text-[#14F5D5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#14F5D5]">
              {t('destination.label')}
            </span>
            <p className="mt-0.5 truncate text-sm font-bold text-white leading-tight" dir="auto">
              {state.destination?.label || t('destination.notAvailable')}
            </p>
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
