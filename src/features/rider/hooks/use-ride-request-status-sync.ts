import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderDestination, RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';
import { useTripCountdown } from '@/shared/hooks/use-trip-countdown';
import { useRequestMountResync } from './status-sync/use-request-mount-resync';
import { useRequestRealtimeSub } from './status-sync/use-request-realtime-sub';
import { useRequestReconciliation } from './status-sync/use-request-reconciliation';
import { useRequestCaptainPhone } from './status-sync/use-request-captain-phone';

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
  const announcedArrivalForRef = React.useRef<string | null>(null);
  const arrivalToastDismissRef = React.useRef<(() => void) | null>(null);

  const countdown = useTripCountdown({
    status: state.activeTrip?.status,
    acceptedAtMs: state.activeTrip?.acceptedAtMs,
    arrivedAtMs: state.activeTrip?.arrivedAtMs,
    startedAtMs: state.activeTrip?.startedAtMs,
    pickupEtaMinutes: state.activeTrip?.pickupEtaMinutes,
    tripDurationMinutes: state.activeTrip?.tripDurationMinutes,
    tripDistanceKm: state.activeTrip?.distanceKm,
  });

  const screenRef = React.useRef(state.screen);
  React.useEffect(() => {
    screenRef.current = state.screen;
  }, [state.screen]);

  const activeTripRef = React.useRef(state.activeTrip);
  React.useEffect(() => {
    activeTripRef.current = state.activeTrip;
  }, [state.activeTrip]);

  const pendingAcceptedOfferIdRef = React.useRef(state.pendingAcceptedOfferId);
  React.useEffect(() => {
    pendingAcceptedOfferIdRef.current = state.pendingAcceptedOfferId;
  }, [state.pendingAcceptedOfferId]);

  const openDestination = React.useCallback(() => {
    dispatch({ type: 'OPEN_DESTINATION' });
    if (selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination]);

  useRequestMountResync({
    userId,
    dispatch,
  });

  React.useEffect(() => {
    window.addEventListener('rider-open-destination', openDestination);
    return () => window.removeEventListener('rider-open-destination', openDestination);
  }, [openDestination]);

  useRequestRealtimeSub({
    requestId: state.requestId,
    language,
    dispatch,
    pendingAcceptedOfferIdRef,
    announcedArrivalForRef,
    arrivalToastDismissRef,
    t,
    toast,
  });

  useRequestReconciliation({
    requestId: state.requestId,
    screen: state.screen,
    dispatch,
    screenRef,
    activeTripRef,
    pendingAcceptedOfferIdRef,
    announcedArrivalForRef,
    arrivalToastDismissRef,
    t,
    toast,
  });

  useRequestCaptainPhone({
    screen: state.screen,
    captainId: state.activeTrip?.captainId,
    captainPhone: state.activeTrip?.captainPhone,
    dispatch,
  });

  return {
    countdown,
    openDestination,
  };
}
