import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Offer } from '@/core/types';
import { cancelRideRequest } from '../services/rider-server-marketplace';
import { getOfferCountdown } from '../services/offer-countdown';
import { getServerTime } from '@/lib/server-time';
import { OFFER_TIMEOUT_MS } from './use-offers-lifecycle-constants';
import type { RiderMachineScreen, RiderMachineAction } from '../state/rider-state-machine';

interface UseOffersTimeoutSchedulerParams {
  requestId?: string | null;
  screen: RiderMachineScreen;
  requestCancelledAt?: number | null;
  requestStartedAt?: number | null;
  offers: Offer[];
  firstSeenAtRef: React.RefObject<Map<string, number>>;
  dispatch: React.Dispatch<RiderMachineAction>;
}

export function useOffersTimeoutScheduler({
  requestId,
  screen,
  requestCancelledAt,
  requestStartedAt,
  offers,
  firstSeenAtRef,
  dispatch,
}: UseOffersTimeoutSchedulerParams) {
  React.useEffect(() => {
    if (!requestId || screen !== 'RECEIVING_OFFERS' || requestCancelledAt) return;

    const startedAt = requestStartedAt ?? getServerTime();
    const elapsed = getServerTime() - startedAt;
    const remainingSearchMs = Math.max(0, OFFER_TIMEOUT_MS - elapsed);

    // If 4-minute search is still in progress, schedule check for when the 4 minutes complete
    if (remainingSearchMs > 0) {
      const timeoutId = window.setTimeout(() => {
        const now = getServerTime();
        const hasActiveOffers = offers.some((offer) => {
          const offerId = offer.id || offer.driverId;
          const firstSeen = firstSeenAtRef.current?.get(offerId);
          return !getOfferCountdown(offer, firstSeen, now).isExpired;
        });

        // If no active offers remain at minute 4: cancel request immediately
        if (!hasActiveOffers) {
          cancelRideRequest(supabase, requestId)
            .catch(() => {})
            .finally(() => {
              dispatch({ type: 'REQUEST_CANCELLED' });
            });
        }
      }, remainingSearchMs);

      return () => window.clearTimeout(timeoutId);
    }

    // 4 minutes have already finished. Check if any offers are STILL running:
    const now = getServerTime();
    const activeOffers = offers.filter((offer) => {
      const offerId = offer.id || offer.driverId;
      const firstSeen = firstSeenAtRef.current?.get(offerId);
      return !getOfferCountdown(offer, firstSeen, now).isExpired;
    });

    // If all offer timers have ended (or no offers arrived): cancel request immediately
    if (activeOffers.length === 0) {
      cancelRideRequest(supabase, requestId)
        .catch(() => {})
        .finally(() => {
          dispatch({ type: 'REQUEST_CANCELLED' });
        });
      return;
    }

    // If drivers are STILL running their timers past the 4 minutes:
    // Wait for the longest remaining offer timer before cancelling
    const latestRemainingMs = Math.max(
      ...activeOffers.map((offer) => {
        const offerId = offer.id || offer.driverId;
        const firstSeen = firstSeenAtRef.current?.get(offerId);
        const cd = getOfferCountdown(offer, firstSeen, now);
        return cd.remainingSeconds * 1000;
      })
    );

    const timeoutId = window.setTimeout(() => {
      cancelRideRequest(supabase, requestId)
        .catch(() => {})
        .finally(() => {
          dispatch({ type: 'REQUEST_CANCELLED' });
        });
    }, Math.max(500, latestRemainingMs));

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, offers, requestCancelledAt, requestId, requestStartedAt, screen, firstSeenAtRef]);
}
