import React from 'react';
import { getServerTime } from '@/lib/server-time';
import type { RiderMachineState } from '../../state/rider-state-machine';
import { getOfferCountdown } from '../../services/offer-countdown';
import {
  TOTAL_SEARCH_SECONDS,
  STAGE_DURATION_SECONDS,
  type RadarStage,
} from './receiving-offers-types';

interface UseReceivingOffersTimerParams {
  state: RiderMachineState;
  firstSeenAtRef: React.RefObject<Map<string, number>>;
  isArabic: boolean;
  isExpandingCaptainSearch: boolean;
  t: (key: string) => string;
}

export function useReceivingOffersTimer({
  state,
  firstSeenAtRef,
  isArabic,
  isExpandingCaptainSearch,
  t,
}: UseReceivingOffersTimerParams) {
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

  const showOffersList =
    (isOffersListRevealed && activeOffers.length > 0) ||
    (remainingSeconds === 0 && activeOffers.length > 0);
  const isSearchTimedOutWithoutOffers = remainingSeconds === 0 && activeOffers.length === 0;

  const stages: RadarStage[] = React.useMemo(() => {
    return isArabic
      ? [
          {
            index: 0,
            radiusKm: 0.5,
            title: 'رصد النطاق الأولي',
            description: isExpandingCaptainSearch
              ? 'جاري توسيع النطاق للبحث عن المزيد من الكباتن المتاحين...'
              : 'جاري مسح ومطابقة أقرب الكباتن المتواجدين في محيطك المباشر',
            badge: '0.5 كم',
          },
          {
            index: 1,
            radiusKm: 1.0,
            title: 'توسيع نطاق البحث',
            description: 'تم توسيع نطاق الرادار للبحث عن الكباتن المتاحين في المحيط المجاور',
            badge: '1 كم',
          },
          {
            index: 2,
            radiusKm: 1.5,
            title: 'توسيع نطاق التغطية',
            description: 'تم توسيع دائرة المسح لتأكيد توفر كابتن مناسب لرحلتك',
            badge: '1.5 كم',
          },
          {
            index: 3,
            radiusKm: 2.0,
            title: 'مسح محيط المنطقة',
            description: 'بث الطلب لكافة الكباتن المتاحين في المنطقة لتلقي العروض',
            badge: '2 كم',
          },
          {
            index: 4,
            radiusKm: 2.5,
            title: 'أقصى نطاق مسح جغرافي',
            description: 'المسح النهائي الشامل لضمان وصول عروض لك قبل انتهاء الوقت',
            badge: '2.5 كم',
          },
        ]
      : [
          {
            index: 0,
            radiusKm: 0.5,
            title: 'Scanning Initial Range',
            description: isExpandingCaptainSearch
              ? 'Expanding coverage to find more nearby available captains...'
              : 'Scanning and matching the nearest available captains in your immediate area',
            badge: '0.5 km',
          },
          {
            index: 1,
            radiusKm: 1.0,
            title: 'Expanding Search Range',
            description: 'Radar coverage expanded to include captains across the nearby area',
            badge: '1 km',
          },
          {
            index: 2,
            radiusKm: 1.5,
            title: 'Expanding Coverage Area',
            description: 'Extending search radius to secure an available captain for your ride',
            badge: '1.5 km',
          },
          {
            index: 3,
            radiusKm: 2.0,
            title: 'Broad Sector Sweep',
            description: 'Broadcasting request to active captains across the sector',
            badge: '2 km',
          },
          {
            index: 4,
            radiusKm: 2.5,
            title: 'Maximum Radar Range',
            description: 'Final maximum radar sweep to ensure receiving bids before search closes',
            badge: '2.5 km',
          },
        ];
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

  return {
    now,
    elapsedSeconds,
    remainingSeconds,
    formattedCountdown,
    activeOffers,
    isOffersListRevealed,
    setIsOffersListRevealed,
    showOffersList,
    isSearchTimedOutWithoutOffers,
    stages,
    currentStage,
    labels,
  };
}
