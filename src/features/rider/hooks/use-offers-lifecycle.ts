import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { dexieDb } from '@/lib/dexie-db';
import { supabase } from '@/lib/supabase-client';
import type { Offer } from '@/core/types';
import {
  acceptRideOffer,
  cancelRideRequest,
  fetchRideOffers,
  subscribeToRideOffers,
} from '../services/rider-server-marketplace';
import { getLocalizedMarketplaceError } from '../services/rider-offer-presentation';
import { collectPreferredCaptainIds, prioritizeRiderOffers } from '../services/rider-offer-ranking';
import { getOfferCountdown } from '../services/offer-countdown';
import type { RiderMachineState, RiderMachineAction } from '../state/rider-state-machine';

const OFFER_TIMEOUT_MS = 240 * 1000; // 4 minutes (240s) search window

/**
 * Owns the incoming-offers poll/subscription for `RECEIVING_OFFERS`, the
 * auto-cancel-if-nothing-arrives timeout, the auto-expanding search radius,
 * and accepting an offer. `pendingAcceptedOfferIdRef` is exposed because the
 * ride-request status subscription (a different hook) needs to read/clear it
 * once the server confirms the acceptance.
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
  const [captainSearchRadiusKm, setCaptainSearchRadiusKm] = React.useState(1.5);
  const [isExpandingCaptainSearch, setIsExpandingCaptainSearch] = React.useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = React.useState<string | null>(null);
  const pendingAcceptedOfferIdRef = React.useRef<string | null>(null);

  // Shared with the screen's countdown UI so both sides agree on exactly
  // when each offer's visibility window started — anchored to when THIS
  // client first observed the offer, not the server's created_at (see
  // services/offer-countdown.ts for why).
  const firstSeenAtRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) return;

    let active = true;

    const refreshOffers = async () => {
      try {
        const [offers, favs] = await Promise.all([
          fetchRideOffers(supabase, state.requestId!),
          dexieDb.favoriteCaptains.toArray().catch(() => [])
        ]);

        const favoriteIds = collectPreferredCaptainIds(favs);
        // جميع العروض المقدمة من الكباتن المتاحين للطلب يتم عرضها للراكب
        const validOffers = offers;

        // حصة الراكب من السوق: 9 عروض كباتن كحد أقصى تفرز حسب: الفئة، المفضلين، الرتبة، السعر
        const sortedOffers = prioritizeRiderOffers(validOffers, favoriteIds, pricingPreference).slice(0, 9);

        const nowTs = Date.now();
        for (const offer of sortedOffers) {
          const offerId = offer.id || offer.driverId;
          if (offerId && !firstSeenAtRef.current.has(offerId)) {
            firstSeenAtRef.current.set(offerId, nowTs);
          }
        }

        if (active) {
          setPreferredCaptainIds(favoriteIds);
          dispatch({ type: 'RECEIVE_OFFERS', offers: sortedOffers });
        }
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Offers]', error);
        setPreferredCaptainIds([]);
        dispatch({ type: 'RECEIVE_OFFERS', offers: [] });
      }
    };

    void refreshOffers();

    const unsubscribe = subscribeToRideOffers(
      supabase,
      state.requestId,
      () => void refreshOffers(),
      () => {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Offers Realtime] subscription unavailable');
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [captainSearchRadiusKm, dispatch, pricingPreference, state.requestCancelledAt, state.requestId, state.screen]);

  // Drops an offer from state the moment its captain-chosen wait_seconds
  // window elapses — without this, an expired offer stayed in state.offers
  // forever (only hidden at render time), so the expand logic below still
  // considered it "present" and kept it selected: the rider had a card open
  // that no longer rendered, and no way to see it was gone.
  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.offers.length === 0) return;

    const pruneExpiredOffers = () => {
      const now = Date.now();
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

  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.offers.length > 0 || state.requestCancelledAt) return;

    const startedAt = state.requestStartedAt ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remainingMs = Math.max(0, OFFER_TIMEOUT_MS - elapsed);

    const timeoutId = window.setTimeout(() => {
      cancelRideRequest(supabase, state.requestId!)
        .catch(() => { })
        .finally(() => {
          toast({
            variant: 'destructive',
            title: '🛑 لا يوجد سائقين متوفرين في محيطك الحالي',
            description: 'يرجى إعادة المحاولة بعد قليل.',
          });
          dispatch({ type: 'RESET_TO_IDLE' });
        });
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, state.offers.length, state.requestCancelledAt, state.requestId, state.requestStartedAt, state.screen, toast]);

  // Cancel trip if the user leaves the app (backgrounds or logs out) for more than 30s during RECEIVING_OFFERS
  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) return;

    const currentRequestId = state.requestId;
    let timeoutId: number | undefined;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        timeoutId = window.setTimeout(() => {
          cancelRideRequest(supabase, currentRequestId).catch(() => {});
          dispatch({ type: 'RESET_TO_IDLE' });
        }, 30_000);
      } else {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
          timeoutId = undefined;
        }
      }
    };

    const onBeforeUnload = () => {
      cancelRideRequest(supabase, currentRequestId).catch(() => {});
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [state.requestId, state.screen, state.requestCancelledAt, dispatch]);

  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) {
      setCaptainSearchRadiusKm(1.5);
      setIsExpandingCaptainSearch(false);
      return;
    }

    if (state.offers.length > 0 || captainSearchRadiusKm >= 2.5) {
      setIsExpandingCaptainSearch(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsExpandingCaptainSearch(true);
      window.setTimeout(() => {
        setCaptainSearchRadiusKm(2.5);
        setIsExpandingCaptainSearch(false);
      }, 900);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [captainSearchRadiusKm, state.offers.length, state.requestCancelledAt, state.screen]);

  // Cards start collapsed — the rider opens whichever offer they want to look at,
  // rather than the first one arriving being force-expanded for them. This effect
  // only clears the expanded id once its offer is no longer in the list; it never
  // picks a new one on its own.
  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.offers.length === 0) {
      setExpandedOfferId(null);
      return;
    }

    // Every card starts closed and only the rider opens one. This used to auto-expand the
    // first offer, which both hid the fact that the card is expandable and gave whichever
    // offer sorted first a permanent head start in the rider's attention.
    setExpandedOfferId((current) => {
      if (current && state.offers.some((offer) => (offer.id || offer.driverId) === current)) return current;
      return null;
    });
  }, [state.offers, state.screen]);

  const handleAcceptOffer = React.useCallback(async (offer: Offer) => {
    if (!state.requestId) {
      toast({
        variant: 'destructive',
        title: t('offers.acceptNoActiveTitle'),
        description: t('offers.acceptNoActiveDescription'),
      });
      return;
    }

    const offerId = offer.id;
    if (!offerId || offerId === offer.driverId) {
      toast({
        variant: 'destructive',
        title: t('offers.acceptIncompleteTitle'),
        description: t('offers.acceptIncompleteDescription'),
      });
      return;
    }

    setAcceptingOfferId(offerId);
    pendingAcceptedOfferIdRef.current = offerId;

    try {
      await acceptRideOffer(supabase, {
        requestId: state.requestId,
        offerId,
      });
      dispatch({ type: 'SELECT_OFFER', offerId });
    } catch (error) {
      pendingAcceptedOfferIdRef.current = null;
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Accept Offer]', error);
      toast({
        variant: 'destructive',
        title: t('offers.acceptFailedTitle'),
        description: getLocalizedMarketplaceError(error, language, {
          permissionDenied: t('errors.permissionDenied'),
          authRequired: t('errors.authRequired'),
          network: t('errors.network'),
          fareCalculation: t('errors.fareCalculation'),
          missingColumns: t('errors.missingColumns'),
          invalidStatus: t('errors.invalidStatus'),
          foreignKeyMismatch: t('errors.foreignKeyMismatch'),
          duplicateActive: t('errors.duplicateActive'),
          generic: t('errors.generic'),
        }),
      });
    } finally {
      setAcceptingOfferId(null);
    }
  }, [dispatch, language, state.requestId, t, toast]);

  const reset = React.useCallback(() => {
    pendingAcceptedOfferIdRef.current = null;
    firstSeenAtRef.current.clear();
    setPreferredCaptainIds([]);
    setExpandedOfferId(null);
    setCaptainSearchRadiusKm(1.5);
    setIsExpandingCaptainSearch(false);
    setAcceptingOfferId(null);
  }, []);

  return {
    preferredCaptainIds,
    expandedOfferId,
    setExpandedOfferId,
    captainSearchRadiusKm,
    isExpandingCaptainSearch,
    acceptingOfferId,
    pendingAcceptedOfferIdRef,
    firstSeenAtRef,
    handleAcceptOffer,
    reset,
  };
}
