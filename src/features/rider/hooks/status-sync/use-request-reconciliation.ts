import React from 'react';
import { supabase } from '@/lib/supabase-client';
import { normalizeCancelRole } from '@/shared/hooks/mutual-cancellation-helpers';
import type {
  RiderActiveTrip,
  RiderMachineAction,
  RiderMachineScreen,
} from '../../state/rider-state-machine';

export function useRequestReconciliation(params: {
  requestId: string | null;
  screen: RiderMachineScreen;
  dispatch: React.Dispatch<RiderMachineAction>;
  screenRef: React.MutableRefObject<RiderMachineScreen>;
  activeTripRef: React.MutableRefObject<RiderActiveTrip | null>;
  pendingAcceptedOfferIdRef: React.MutableRefObject<string | null>;
  announcedArrivalForRef: React.MutableRefObject<string | null>;
  arrivalToastDismissRef: React.MutableRefObject<(() => void) | null>;
  t: (key: string) => string;
  toast: (opts: any) => any;
}) {
  const {
    requestId,
    screen,
    dispatch,
    screenRef,
    activeTripRef,
    pendingAcceptedOfferIdRef,
    announcedArrivalForRef,
    arrivalToastDismissRef,
    t,
    toast,
  } = params;

  React.useEffect(() => {
    if (!requestId) return;

    let cancelled = false;

    const reconcile = async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('id,status,completed_at,cancelled_at,accepted_offer_id,accepted_captain_id,final_fare,accepted_at,arrived_at,started_at,pickup_eta_minutes,estimated_duration_minutes,created_at,cancel_requested_by,cancel_request_time')
        .eq('id', requestId)
        .maybeSingle();

      if (error && process.env.NODE_ENV !== 'production') {
        console.warn('[Rider status sync] reconcile error:', error);
      }

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
        const liveActiveTrip = activeTripRef.current;
        const liveScreen = screenRef.current;
        const currentActiveStatus = liveActiveTrip?.status?.toUpperCase();
        const hasStatusChanged = currentActiveStatus !== status;
        const hasArrivalChanged = Boolean(row.arrived_at) && !liveActiveTrip?.arrivedAtMs;
        const hasStartChanged = Boolean(row.started_at) && !liveActiveTrip?.startedAtMs;
        const hasCancelRequestChanged =
          normalizeCancelRole(row.cancel_requested_by) !== normalizeCancelRole(liveActiveTrip?.cancel_requested_by);

        if (liveScreen !== 'TRIP_ACTIVE' || hasStatusChanged || hasArrivalChanged || hasStartChanged || hasCancelRequestChanged) {
          dispatch({
            type: 'SERVER_STATUS_ACCEPTED',
            row: {
              ...row,
              accepted_offer_id: row.accepted_offer_id || pendingAcceptedOfferIdRef.current,
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || pendingAcceptedOfferIdRef.current,
            },
          });
          if (status === 'ARRIVED' && announcedArrivalForRef.current !== requestId) {
            announcedArrivalForRef.current = requestId;
            const arrivalToast = toast({
              title: t('trip.driverArrivedTitle'),
              description: t('trip.driverArrivedNote'),
              variant: 'success',
              duration: 15000,
            });
            arrivalToastDismissRef.current = arrivalToast?.dismiss || null;
            try {
              navigator.vibrate?.([120, 60, 120]);
            } catch {}
          }
        }
      } else if (status === 'COMPLETED') {
        arrivalToastDismissRef.current?.();
        arrivalToastDismissRef.current = null;
        dispatch({ type: 'SERVER_STATUS_COMPLETED', row });
      } else if (status === 'CANCELLED') {
        arrivalToastDismissRef.current?.();
        arrivalToastDismissRef.current = null;
        dispatch({ type: 'REQUEST_CANCELLED' });
      }
    };

    void reconcile();
    const pollIntervalMs = (screen === 'TRIP_ACTIVE' || screen === 'RECEIVING_OFFERS') ? 3_000 : 10_000;
    const interval = window.setInterval(() => void reconcile(), pollIntervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') void reconcile(); };
    const onFocus = () => void reconcile();
    const onOnline = () => void reconcile();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      arrivalToastDismissRef.current?.();
      arrivalToastDismissRef.current = null;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [
    dispatch,
    requestId,
    screen,
    screenRef,
    activeTripRef,
    pendingAcceptedOfferIdRef,
    announcedArrivalForRef,
    arrivalToastDismissRef,
    t,
    toast,
  ]);
}

