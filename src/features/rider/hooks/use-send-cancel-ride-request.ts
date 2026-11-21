import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RoadRouteEstimate } from '@/lib/road-route';
import { cancelRideRequest } from '../services/rider-server-marketplace';
import { getLocalizedMarketplaceError } from '../services/rider-offer-presentation';
import { useRiderOperations } from './use-rider-operations';
import type { RiderDestination, RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';
import type { RiderLocation, RiderLocationStatus } from '../components/rider-map';
import { validateRideRequestInput } from './send-cancel/send-cancel-validation';
import { executeCreateRideRequest } from './send-cancel/send-cancel-service';

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
  pricingPreference: 'APP' | 'TAXI' | 'FREE' | null;
  riderCount?: number;
  onExitRequestFlow?: () => void;
  resetRideDraftState: () => void;
  locationStatus?: RiderLocationStatus;
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
    pricingPreference,
    riderCount,
    onExitRequestFlow,
    resetRideDraftState,
    locationStatus,
  } = params;

  const { toast } = useToast();
  const t = useTranslations('riderView');
  const riderOps = useRiderOperations();

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

  const handleSendRequest = React.useCallback(async (explicitRiderCount?: number) => {
    const rawDestination = selectedDraftDestination || state.destination;
    const effectiveDestinationCoords = selectedDestinationCoords || state.destination?.coords || rawDestination?.coords || null;

    const resolvedFare =
      rawDestination?.serverEstimatedFare ??
      (rawDestination?.fareQuote as any)?.serverEstimatedFare ??
      (rawDestination?.fareQuote as any)?.finalFare ??
      (rawDestination?.fareQuote as any)?.guidePriceJod ??
      state.activeTrip?.finalPrice ??
      state.activeTrip?.serverEstimatedFare ??
      0;

    const effectiveDraftDestination: RiderDestination | null = rawDestination
      ? {
          ...rawDestination,
          coords: effectiveDestinationCoords || rawDestination.coords,
          serverEstimatedFare: typeof rawDestination.serverEstimatedFare === 'number'
            ? rawDestination.serverEstimatedFare
            : resolvedFare,
        }
      : null;

    const validation = validateRideRequestInput({
      userId,
      accountSecurityStatus: riderOps?.accountSecurityStatus,
      locationStatus,
      language,
      t,
      toast,
      explicitRiderCount,
      riderCount,
      screen: state.screen,
      autoRetryRequested: state.autoRetryRequested,
      activeCountryId,
      effectiveDraftDestination,
      effectiveDestinationCoords,
      riderLocation,
      isServerFareLoading,
      isRouteEstimateLoading,
      currentRouteEstimate,
      hasDestinationInState: Boolean(state.destination),
    });

    if (!validation.isValid || !effectiveDraftDestination || !effectiveDestinationCoords || !userId) {
      return;
    }

    // Unlock audio context for modern browser autoplay policies
    if (typeof window !== 'undefined') {
      const unlockAudio = new Audio('/sounds/notification.mp3');
      unlockAudio.volume = 0;
      unlockAudio.play().catch(() => {});
    }

    dispatch({ type: 'CONFIRM_DESTINATION', destination: effectiveDraftDestination as RiderDestination });
    dispatch({ type: 'SEND_REQUEST' });
    setIsSendingRideRequest(true);

    try {
      const request = await executeCreateRideRequest({
        userId,
        riderLocation,
        pickupAddress,
        effectiveDestinationCoords,
        effectiveDraftDestination: effectiveDraftDestination as RiderDestination,
        currentRouteEstimate,
        countryId: Number(activeCountryId),
        pricingPreference,
        effectiveRiderCount: validation.effectiveRiderCount,
      });

      dispatch({ type: 'SERVER_REQUEST_CREATED', requestId: request.id });
      dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });

      toast({
        title: t('request.sentTitle'),
        description: t('request.sentDescription'),
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Rider Ride Request Insert]', error);
      }
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
    locationStatus,
    pricingPreference,
    pickupAddress,
    riderCount,
    riderLocation,
    selectedDestinationCoords,
    selectedDraftDestination,
    state.autoRetryRequested,
    state.destination,
    state.screen,
    t,
    toast,
    userId,
    riderOps?.accountSecurityStatus,
  ]);

  const handleCancelRideRequest = React.useCallback(async () => {
    if (state.screen === 'TRIP_ACTIVE') {
      dispatch({ type: 'REQUEST_CANCELLED' });
      return;
    }

    if (!state.requestId) {
      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
      return;
    }

    setIsCancellingRideRequest(true);

    try {
      await cancelRideRequest(supabase, state.requestId);

      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
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

      if (isStaleOrAlreadyClosed) {
        resetRideDraftState();
        dispatch({ type: 'RESET_TO_IDLE' });
        return;
      }

      if (process.env.NODE_ENV !== 'production') console.warn('[Rider Cancel Request]', error);
      toast({
        variant: 'destructive',
        title: t('request.cancelFailedTitle'),
        description: getLocalizedMarketplaceError(error, language, errorLabels),
      });
    } finally {
      setIsCancellingRideRequest(false);
    }
  }, [dispatch, errorLabels, language, onExitRequestFlow, resetRideDraftState, state.requestId, state.screen, t, toast]);

  return {
    isSendingRideRequest,
    isCancellingRideRequest,
    handleSendRequest,
    handleCancelRideRequest,
  };
}
