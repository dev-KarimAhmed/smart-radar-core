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
}) {
  const { userId, selectedDraftDestination, language, state, dispatch } = params;

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

// [ACT-SSOT-01] Removed duplicate reactive CONFIRM_DESTINATION useEffect to enforce single user pulse



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

      if (error || !data) {
        dispatch({ type: 'RESET_TO_IDLE' });
        return;
      }

      const row = data as Record<string, unknown>;
      const requestId = String(row.id || '');
      if (!requestId) {
        dispatch({ type: 'RESET_TO_IDLE' });
        return;
      }

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING' || status === 'RECEIVING_OFFERS') {
        const createdAt = row.created_at ? new Date(row.created_at as string).getTime() : 0;
        const now = Date.now();
        // If the request was created more than 180 seconds (3 minutes) ago, it is expired.
        if (createdAt > 0 && now - createdAt > 180000) {
          dispatch({ type: 'RESET_TO_IDLE' });
          return;
        }
        // The row goes along too: the destination only ever lived in client state, so
        // without it a reload mid-auction left the rider looking at "الوجهة: غير متاح".
        dispatch({ type: 'REHYDRATE_SEARCHING', requestId, row });
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
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || state.pendingAcceptedOfferId,
            },
          });
          if (status === 'ACCEPTED') {
            // pendingAcceptedOfferId managed centrally by state machine
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
              title: t('trip.driverArrivedTitle'),
              description: t('trip.driverArrivedNote'),
              variant: 'success',
              duration: 15000,
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
          // pendingAcceptedOfferId managed centrally by state machine
          dispatch({ type: 'REQUEST_CANCELLED' });
        }

        if (status === 'COMPLETED') {
          // pendingAcceptedOfferId managed centrally by state machine
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
  }, [dispatch, language, state.requestId, t, toast]);

  /**
   * Safety net & background recovery: re-read the request's status while any request is active.
   *
   * Leaving that screen or missing events during backgrounding (taking a call, checking a message)
   * depended on realtime events. If the socket dropped or paused during backgrounding,
   * this reconciliation catches state changes (ACCEPTED, CANCELLED, COMPLETED) immediately when
   * the rider returns to the page.
   */
  React.useEffect(() => {
    if (!state.requestId) return;

    let cancelled = false;

    const reconcile = async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('id,status,completed_at,cancelled_at,accepted_offer_id,selected_offer_id,created_at')
        .eq('id', state.requestId!)
        .maybeSingle();

      if (cancelled || error || !data) return;

      const row = data as Record<string, unknown>;
      const status = String(row.status || '').toUpperCase();

      if (
        status === 'ACCEPTED'
        || status === 'EN_ROUTE'
        || status === 'ARRIVED'
        || status === 'STARTED'
        || status === 'TRIP_ACTIVE'
        || status === 'ACTIVE'
        || status === 'IN_PROGRESS'
      ) {
        if (state.screen !== 'TRIP_ACTIVE') {
          dispatch({
            type: 'SERVER_STATUS_ACCEPTED',
            row: {
              ...row,
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || state.pendingAcceptedOfferId,
            },
          });
        }
      } else if (status === 'COMPLETED') {
        dispatch({ type: 'SERVER_STATUS_COMPLETED', row });
      } else if (status === 'CANCELLED') {
        dispatch({ type: 'REQUEST_CANCELLED' });
      }
    };

    // Once straight away: if the event was missed while the tab was hidden, the rider should
    // not have to wait a whole interval after coming back.
    void reconcile();
    const interval = window.setInterval(() => void reconcile(), 15_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void reconcile(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch, state.pendingAcceptedOfferId, state.requestId, state.screen]);

  return {
    countdown,
    openDestination,
  };
}
