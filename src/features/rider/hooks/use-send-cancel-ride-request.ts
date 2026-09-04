import React from 'react';
import { latLngToCell } from 'h3-js';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RoadRouteEstimate } from '@/lib/road-route';
import {
  buildRideRequestInsertPayload,
  cancelRideRequest,
  createRideRequest,
} from '../services/rider-server-marketplace';
import { getLocalizedMarketplaceError } from '../services/rider-offer-presentation';
import type { RiderDestination, RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';
import type { RiderLocation } from '../components/rider-map';

const H3_RIDER_REQUEST_RESOLUTION = 9;

/**
 * Owns sending and cancelling a ride request. `resetRideDraftState` is
 * injected because it's a composition of every other hook's own `reset()` —
 * assembled once, in the orchestrator, after all hooks exist.
 */
export function useSendCancelRideRequest(params: {
  userId: string | undefined;
  activeCountryId: number | undefined;
  riderLocation: RiderLocation;
  pickupAddress?: string;
  selectedDraftDestination: RiderDestination | null;
  selectedDestinationCoords: RiderLocation | null;
  isServerFareLoading: boolean;
  isRouteEstimateLoading: boolean;
  currentRouteEstimate: RoadRouteEstimate | null;
  language: AppLanguage;
  state: RiderMachineState;
  dispatch: React.Dispatch<RiderMachineAction>;
  pendingAcceptedOfferIdRef: React.RefObject<string | null>;
  onExitRequestFlow?: () => void;
  resetRideDraftState: () => void;
}) {
  const {
    userId,
    activeCountryId,
    riderLocation,
    pickupAddress,
    selectedDraftDestination,
    selectedDestinationCoords,
    isServerFareLoading,
    isRouteEstimateLoading,
    currentRouteEstimate,
    language,
    state,
    dispatch,
    pendingAcceptedOfferIdRef,
    onExitRequestFlow,
    resetRideDraftState,
  } = params;

  const { toast } = useToast();
  const t = useTranslations('riderView');

  const [isSendingRideRequest, setIsSendingRideRequest] = React.useState(false);
  const [isCancellingRideRequest, setIsCancellingRideRequest] = React.useState(false);

  const errorLabels = React.useMemo(() => ({
    permissionDenied: t('errors.permissionDenied'),
    authRequired: t('errors.authRequired'),
    network: t('errors.network'),
    fareCalculation: t('errors.fareCalculation'),
    missingColumns: t('errors.missingColumns'),
    invalidStatus: t('errors.invalidStatus'),
    foreignKeyMismatch: t('errors.foreignKeyMismatch'),
    duplicateActive: t('errors.duplicateActive'),
    generic: t('errors.generic'),
  }), [t]);

  const handleSendRequest = React.useCallback(async () => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: t('request.loginRequiredTitle'),
        description: t('request.loginRequiredDescription'),
      });
      return;
    }

    const countryId = Number(activeCountryId);
    if (!Number.isInteger(countryId) || countryId <= 0) {
      toast({
        variant: 'destructive',
        title: t('request.countryMissingTitle'),
        description: t('request.countryMissingDescription'),
      });
      return;
    }

    if (!selectedDraftDestination || !selectedDestinationCoords) {
      toast({
        variant: 'destructive',
        title: t('request.destinationNotReadyTitle'),
        description: t('request.destinationNotReadyDescription'),
      });
      return;
    }

    if (
      selectedDraftDestination.serverEstimatedFare === undefined ||
      isServerFareLoading ||
      isRouteEstimateLoading ||
      !currentRouteEstimate
    ) {
      toast({
        variant: 'destructive',
        title: t('request.fareNotReadyTitle'),
        description: t('request.fareNotReadyDescription'),
      });
      return;
    }

    // Unlock audio context for modern browser autoplay policies
    if (typeof window !== 'undefined') {
      const unlockAudio = new Audio('/sounds/notification.mp3');
      unlockAudio.volume = 0;
      unlockAudio.play().catch(() => {});
    }

    dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    dispatch({ type: 'SEND_REQUEST' });
    setIsSendingRideRequest(true);

    try {
      const payload = buildRideRequestInsertPayload({
        riderId: userId,
        origin: riderLocation,
        pickupAddress,
        destination: selectedDestinationCoords,
        originH3: selectedDraftDestination.originCell || latLngToCell(riderLocation.lat, riderLocation.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationH3:
          selectedDraftDestination.destinationCell ||
          latLngToCell(selectedDestinationCoords.lat, selectedDestinationCoords.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationAddressAr: selectedDraftDestination.label,
        serverEstimatedFare: selectedDraftDestination.serverEstimatedFare,
        routeDistanceKm: currentRouteEstimate.distanceKm,
        routeDurationMinutes: currentRouteEstimate.durationMinutes,
        countryId,
      });

      const request = await createRideRequest(supabase, payload);
      dispatch({ type: 'SERVER_REQUEST_CREATED', requestId: request.id });
      dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });

      toast({
        title: t('request.sentTitle'),
        description: t('request.sentDescription'),
      });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) {
        console.warn('[Rider Ride Request Insert]', error);
      }
      pendingAcceptedOfferIdRef.current = null;
      dispatch({ type: 'REQUEST_FAILED' });
      toast({
        variant: 'destructive',
        title: t('request.failedTitle'),
        description: getLocalizedMarketplaceError(error, language, errorLabels),
      });
    } finally {
      setIsSendingRideRequest(false);
    }
  }, [
    activeCountryId,
    currentRouteEstimate,
    dispatch,
    errorLabels,
    isRouteEstimateLoading,
    isServerFareLoading,
    language,
    pendingAcceptedOfferIdRef,
    pickupAddress,
    riderLocation,
    selectedDestinationCoords,
    selectedDraftDestination,
    t,
    toast,
    userId,
  ]);

  const handleCancelRideRequest = React.useCallback(async () => {
    if (!state.requestId) {
      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
      onExitRequestFlow?.();
      return;
    }

    setIsCancellingRideRequest(true);

    try {
      await cancelRideRequest(supabase, state.requestId);
      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
      onExitRequestFlow?.();
      toast({
        title: t('request.cancelledTitle'),
        description: t('request.cancelledDescription'),
      });
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message ?? '').toLowerCase()
        : String(error ?? '').toLowerCase();
      const isStaleOrAlreadyClosed =
        errorMessage.includes('ride_request_closed') ||
        errorMessage.includes('ride_request_not_found');

      // The request may have been cancelled by another tab, by the server timeout, or by
      // realtime recovery before the user pressed the close button. Treat that state as an
      // idempotent close instead of trapping the rider in a dead request screen.
      if (isStaleOrAlreadyClosed) {
        pendingAcceptedOfferIdRef.current = null;
        resetRideDraftState();
        dispatch({ type: 'RESET_TO_IDLE' });
        onExitRequestFlow?.();
        return;
      }

      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Cancel Request]', error);
      toast({
        variant: 'destructive',
        title: t('request.cancelFailedTitle'),
        description: getLocalizedMarketplaceError(error, language, errorLabels),
      });
    } finally {
      setIsCancellingRideRequest(false);
    }
  }, [dispatch, errorLabels, language, onExitRequestFlow, resetRideDraftState, state.requestId, t, toast]);

  return {
    isSendingRideRequest,
    isCancellingRideRequest,
    handleSendRequest,
    handleCancelRideRequest,
  };
}
