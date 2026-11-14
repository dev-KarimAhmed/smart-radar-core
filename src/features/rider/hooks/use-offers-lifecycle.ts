import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { supabase } from '@/lib/supabase-client';
import type { Offer } from '@/core/types';
import {
  fetchRideOffers,
  subscribeToRideOffers,
  cancelRideRequest,
} from '../services/rider-server-marketplace';
import { prioritizeRiderOffers } from '../services/rider-offer-ranking';
import { fetchFavoriteCaptainIds } from '@/features/account/services/favorite-captains';
import { getOfferCountdown } from '../services/offer-countdown';
import { playNotificationSound } from '@/shared/utils/notification-sound';
import { getServerTime } from '@/lib/server-time';
import type { RiderMachineState, RiderMachineAction } from '../state/rider-state-machine';
import { useCaptainSearchRadius } from './use-offers-lifecycle-radius';
import { useOffersTimeoutScheduler } from './use-offers-lifecycle-timeout';
import { useOfferAcceptance } from './use-offers-lifecycle-acceptance';
import { notifyNewCaptainOffer } from '../services/rider-offer-notification';

export {
  OFFER_TIMEOUT_MS,
  RADAR_SCAN_STAGES_KM,
  STAGE_WINDOW_SECONDS,
} from './use-offers-lifecycle-constants';

/**
 * Owns the incoming-offers poll/subscription for `RECEIVING_OFFERS`, the
 * auto-cancel-if-nothing-arrives timeout, the auto-expanding search radius,
 * and accepting an offer.
 */
export function useOffersLifecycle(
  state: RiderMachineState,
  dispatch: React.Dispatch<RiderMachineAction>,
  language: AppLanguage,
  pricingPreference?: 'APP' | 'TAXI' | 'FREE' | null,
) {
  const { toast } = useToast();
  const t = useTranslations('riderView');

  const [preferredCaptainIds, setPreferredCaptainIds] = React.useState<string[]>([]);
  const [expandedOfferId, setExpandedOfferId] = React.useState<string | null>(null);

  const {
    captainSearchRadiusKm,
    setCaptainSearchRadiusKm,
    isExpandingCaptainSearch,
    setIsExpandingCaptainSearch,
  } = useCaptainSearchRadius(state.screen, state.requestStartedAt, state.requestCancelledAt);

  const firstSeenAtRef = React.useRef<Map<string, number>>(new Map());

  const refreshOffers = React.useCallback(async (isActive?: () => boolean) => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) return;

    try {
      const [offers, favIdsSet] = await Promise.all([
        fetchRideOffers(supabase, state.requestId),
        fetchFavoriteCaptainIds().catch(() => new Set<string>()),
      ]);

      if (isActive && !isActive()) return;

      const favoriteIds = Array.from(favIdsSet);
      const sortedOffers = prioritizeRiderOffers(offers, favoriteIds, pricingPreference).slice(0, 9);
      const nowTs = getServerTime();
      let hasNewOffer = false;

      const nonExpiredOffers = sortedOffers.filter((offer) => {
        const offerId = offer.id || offer.driverId;
        const firstSeen = firstSeenAtRef.current.get(offerId);
        if (firstSeen === undefined) return true;
        return !getOfferCountdown(offer, firstSeen, nowTs).isExpired;
      });

      for (const offer of nonExpiredOffers) {
        const offerId = offer.id || offer.driverId;
        if (offerId && !firstSeenAtRef.current.has(offerId)) {
          firstSeenAtRef.current.set(offerId, nowTs);
          hasNewOffer = true;
          notifyNewCaptainOffer(offer, offerId, language, toast);
        }
      }

      if (hasNewOffer) {
        playNotificationSound();
      }

      setPreferredCaptainIds(favoriteIds);
      dispatch({ type: 'RECEIVE_OFFERS', offers: nonExpiredOffers });
    } catch (error) {
      if (isActive && !isActive()) return;
      if (process.env.NODE_ENV !== 'production') console.warn('[Rider Offers]', error);
      setPreferredCaptainIds([]);
      dispatch({ type: 'RECEIVE_OFFERS', offers: [] });
    }
  }, [dispatch, language, pricingPreference, state.requestCancelledAt, state.requestId, state.screen, toast]);

  const {
    acceptingOfferId,
    setAcceptingOfferId,
    handleAcceptOffer,
  } = useOfferAcceptance({
    requestId: state.requestId,
    language,
    dispatch,
    refreshOffers: () => refreshOffers(),
    toast,
    t,
  });

  React.useEffect(() => {
    let isMounted = true;
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) return;

    const runRefresh = async () => {
      await refreshOffers(() => isMounted);
    };
    void runRefresh();

    const intervalId = window.setInterval(() => void runRefresh(), 2_500);
    const onVisible = () => { if (document.visibilityState === 'visible') void runRefresh(); };
    const onFocus = () => void runRefresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    const unsubscribe = subscribeToRideOffers(
      supabase,
      state.requestId,
      () => void refreshOffers(() => isMounted),
      () => {
        if (process.env.NODE_ENV !== 'production') console.warn('[Rider Offers Realtime] subscription unavailable');
      },
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      unsubscribe();
    };
  }, [refreshOffers, state.requestCancelledAt, state.requestId, state.screen]);

  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.offers.length === 0) return;

    const pruneExpiredOffers = () => {
      const now = getServerTime();
      const stillActive = state.offers.filter((offer) => {
        const offerId = offer.id || offer.driverId;
        return !getOfferCountdown(offer, firstSeenAtRef.current.get(offerId), now).isExpired;
      });
      if (stillActive.length !== state.offers.length) {
        dispatch({ type: 'RECEIVE_OFFERS', offers: stillActive });
      }
    };

    const intervalId = window.setInterval(pruneExpiredOffers, 500);
    return () => window.clearInterval(intervalId);
  }, [dispatch, state.offers, state.screen]);

  useOffersTimeoutScheduler({
    requestId: state.requestId,
    screen: state.screen,
    requestCancelledAt: state.requestCancelledAt,
    requestStartedAt: state.requestStartedAt,
    offers: state.offers,
    firstSeenAtRef,
    dispatch,
  });

  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) return;

    const onBeforeUnload = () => {
      if (state.requestId) {
        cancelRideRequest(supabase, state.requestId).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [state.requestCancelledAt, state.requestId, state.screen]);

  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.offers.length === 0) {
      setExpandedOfferId(null);
      return;
    }

    setExpandedOfferId((current) => {
      if (current && state.offers.some((offer) => (offer.id || offer.driverId) === current)) return current;
      return null;
    });
  }, [state.offers, state.screen]);

  const reset = React.useCallback(() => {
    firstSeenAtRef.current.clear();
    setPreferredCaptainIds([]);
    setExpandedOfferId(null);
    setCaptainSearchRadiusKm(0.5);
    setIsExpandingCaptainSearch(false);
    setAcceptingOfferId(null);
  }, [setCaptainSearchRadiusKm, setIsExpandingCaptainSearch, setAcceptingOfferId]);

  return {
    preferredCaptainIds,
    expandedOfferId,
    setExpandedOfferId,
    captainSearchRadiusKm,
    isExpandingCaptainSearch,
    acceptingOfferId,
    firstSeenAtRef,
    handleAcceptOffer,
    reset,
  };
}
