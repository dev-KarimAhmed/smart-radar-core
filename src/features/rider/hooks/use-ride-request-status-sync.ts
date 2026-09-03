import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { Offer } from '@/core/types';
import { fetchRideOffers, subscribeToRideRequestStatus } from '../services/rider-server-marketplace';
import { getLocalizedMarketplaceError } from '../services/rider-offer-presentation';
import type { RiderDestination, RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';
import { useTripCountdown } from '@/shared/hooks/use-trip-countdown';

/**
 * Owns the server ride-request status subscription that drives most
 * state-machine transitions, the active-trip ETA countdown, and the "open
 * destination selection" entry point (triggered directly or via the
 * `rider-open-destination` window event).
 */
export function useRideRequestStatusSync(params: {
  userId: string | undefined;
  selectedDraftDestination: RiderDestination | null;
  language: AppLanguage;
  state: RiderMachineState;
  dispatch: React.Dispatch<RiderMachineAction>;
  pendingAcceptedOfferIdRef: React.RefObject<string | null>;
}) {
  const { userId, selectedDraftDestination, language, state, dispatch, pendingAcceptedOfferIdRef } = params;

  const { toast } = useToast();
  const t = useTranslations('riderView');
  /** Which request has already had its arrival announced, so it is announced exactly once. */
  const announcedArrivalForRef = React.useRef<string | null>(null);

  /**
   * The trip countdown.
   *
   * This used to be `React.useState(0)` plus an interval that decremented it, seeded from
   * `state.activeTrip.etaSeconds`. `buildActiveTrip` returns a fresh object for every
   * realtime row, so every status change and every `updated_at` touch restarted the
   * countdown at its full value — and the value itself was the trip's length regardless of
   * whether the captain was still driving over. It is now derived from the server's own
   * accepted_at / started_at, so it cannot be restarted by a re-render and reads the same
   * here as it does on the captain's screen.
   */
  const countdown = useTripCountdown({
    status: state.activeTrip?.status,
    acceptedAtMs: state.activeTrip?.acceptedAtMs,
    arrivedAtMs: state.activeTrip?.arrivedAtMs,
    startedAtMs: state.activeTrip?.startedAtMs,
    pickupEtaMinutes: state.activeTrip?.pickupEtaMinutes,
    tripDurationMinutes: state.activeTrip?.tripDurationMinutes,
    tripDistanceKm: state.activeTrip?.distanceKm,
  });

  // The status-subscription effect below only re-subscribes when requestId
  // changes (the same id spans accepted -> arrived -> started), so its
  // closure would otherwise see a stale `state.screen` from whenever the
  // subscription was created. Read the live value through this ref instead.
  const screenRef = React.useRef(state.screen);
  React.useEffect(() => {
    screenRef.current = state.screen;
  }, [state.screen]);

  const openDestination = React.useCallback(() => {
    dispatch({ type: 'OPEN_DESTINATION' });
    if (selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination]);

  React.useEffect(() => {
    if (state.screen === 'DESTINATION_SELECTION' && selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination, state.screen]);

  // Resync on mount/reload — without this, a reload mid-trip previously wiped
  // the whole flow back to the idle map even though the ride_requests row was
  // still active on the server. Look up the rider's own still-open request
  // and rebuild the screen it was on instead of blindly resetting.
  React.useEffect(() => {
    if (!userId) {
      dispatch({ type: 'RESET_TO_IDLE' });
      return;
    }

    let isCancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('rider_id', userId)
        .not('status', 'in', '("COMPLETED","CANCELLED")')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isCancelled) return;

      dispatch({ type: 'RESET_TO_IDLE' });

      if (error || !data) return;

      const row = data as Record<string, unknown>;
      const requestId = String(row.id || '');
      if (!requestId) return;

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING' || status === 'RECEIVING_OFFERS') {
        dispatch({ type: 'REHYDRATE_SEARCHING', requestId });
        return;
      }

      let offers: Offer[] = [];
      try {
        offers = await fetchRideOffers(supabase, requestId);
      } catch (offersError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider status sync] resync offers fetch failed:', offersError);
      }

      if (isCancelled) return;
      dispatch({ type: 'REHYDRATE_ACTIVE_TRIP', requestId, row, offers });
    })();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, userId]);

  React.useEffect(() => {
    window.addEventListener('rider-open-destination', openDestination);
    return () => window.removeEventListener('rider-open-destination', openDestination);
  }, [openDestination]);

  React.useEffect(() => {
    if (!state.requestId) return;

    return subscribeToRideRequestStatus(
      supabase,
      state.requestId,
      (row) => {
        const status = String(row.status || '').toUpperCase();

        if (status === 'RECEIVING_OFFERS') {
          dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });
        }

        if (
          status === 'ACCEPTED'
          || status === 'EN_ROUTE'
          || status === 'ARRIVED'
          || status === 'STARTED'
          || status === 'TRIP_ACTIVE'
          || status === 'ACTIVE'
          || status === 'IN_PROGRESS'
        ) {
          dispatch({
            type: 'SERVER_STATUS_ACCEPTED',
            row: {
              ...row,
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || pendingAcceptedOfferIdRef.current,
            },
          });
          if (status === 'ACCEPTED') {
            pendingAcceptedOfferIdRef.current = null;
          }

          // The captain pressing "إبلاغ الراكب بالوصول" is the one transition the rider is
          // actively waiting on, so it gets an announcement rather than only a changed
          // banner. Fired off the realtime row, so it needs no page reload.
          //
          // Guarded by a ref because the subscription re-delivers the row on any column
          // change: without it, every later update while still ARRIVED re-announces.
          if (status === 'ARRIVED' && announcedArrivalForRef.current !== state.requestId) {
            announcedArrivalForRef.current = state.requestId;
            toast({
              title: t('trip.captainArrivedTitle'),
              description: t('trip.captainArrivedBody'),
            });
            // Best-effort only: unsupported on iOS Safari and silently ignored when the
            // page has never been interacted with.
            try {
              navigator.vibrate?.([120, 60, 120]);
            } catch {
              // A missing buzz is not worth breaking the status update over.
            }
          }
        }

        if (status === 'CANCELLED') {
          pendingAcceptedOfferIdRef.current = null;
          // A cancellation arriving while a trip is already underway can
          // only be the captain's doing (the rider's own cancel button
          // already shows its own toast) — flag it explicitly here.
          if (screenRef.current === 'TRIP_ACTIVE') {
            toast({
              title: t('request.cancelledByCaptainTitle'),
              description: t('request.cancelledByCaptainDescription'),
            });
          }
          dispatch({ type: 'REQUEST_CANCELLED' });
        }

        if (status === 'COMPLETED') {
          pendingAcceptedOfferIdRef.current = null;
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row });
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: t('request.updateFailedTitle'),
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
      },
    );
  }, [dispatch, language, pendingAcceptedOfferIdRef, state.requestId, t, toast]);

  /**
   * Safety net: re-read the request's status while the rider sits on the trip screen.
   *
   * Leaving that screen depended on exactly ONE realtime event arriving. Miss it — dropped
   * socket, backgrounded tab, an RLS hiccup, a transaction that rolled back and republished
   * nothing — and the rider stays inside a finished trip forever, with no way out and no
   * indication anything is wrong. That is the "الكابتن نهى الرحلة ولسه شغالة عند الراكب"
   * report, and it stays possible however the underlying cause is fixed, because a live
   * subscription is not a guarantee of delivery.
   *
   * A poll is not a substitute for realtime — it is the floor under it. Realtime still does
   * the work and updates instantly; this only catches what realtime dropped, which is why
   * 20s is frequent enough.
   */
  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'TRIP_ACTIVE') return;

    let cancelled = false;

    const reconcile = async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('id,status,completed_at,cancelled_at,accepted_offer_id,selected_offer_id')
        .eq('id', state.requestId!)
        .maybeSingle();

      if (cancelled || error || !data) return;

      const status = String((data as Record<string, unknown>).status || '').toUpperCase();
      if (status === 'COMPLETED') {
        pendingAcceptedOfferIdRef.current = null;
        dispatch({ type: 'SERVER_STATUS_COMPLETED', row: data as Record<string, unknown> });
      } else if (status === 'CANCELLED') {
        pendingAcceptedOfferIdRef.current = null;
        dispatch({ type: 'REQUEST_CANCELLED' });
      }
    };

    // Once straight away: if the event was missed while the tab was hidden, the rider should
    // not have to wait a whole interval after coming back.
    void reconcile();
    const interval = window.setInterval(() => void reconcile(), 20_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void reconcile(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch, pendingAcceptedOfferIdRef, state.requestId, state.screen]);

  return {
    countdown,
    openDestination,
  };
}
