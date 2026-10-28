import React from 'react';
import { latLngToCell } from 'h3-js';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { calculateHaversineKm, type RoadRouteEstimate } from '@/lib/road-route';
import {
  buildRideRequestInsertPayload,
  cancelRideRequest,
  createRideRequest,
} from '../services/rider-server-marketplace';
import { getLocalizedMarketplaceError } from '../services/rider-offer-presentation';
import { useRiderOperations } from './use-rider-operations';
import type { RiderDestination, RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';
import type { RiderLocation, RiderLocationStatus } from '../components/rider-map';

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
    if (riderOps?.accountSecurityStatus) {
      toast({
        variant: 'destructive',
        title: riderOps.accountSecurityStatus === 'BANNED'
          ? (language === 'ar' ? 'الحساب محظور نهائياً 🚫' : 'Account Banned 🚫')
          : (language === 'ar' ? 'الحساب معلق مؤقتاً ⚠️' : 'Account Suspended ⚠️'),
        description: language === 'ar'
          ? 'لا يمكن إرسال طلب رحلة، الحساب معلق أو محظور حالياً من قبل الإدارة.'
          : 'Cannot create request: account is currently restricted by platform administration.',
      });
      return;
    }

    if (locationStatus === 'denied') {
      toast({
        variant: 'destructive',
        title: t('request.locationPermissionDeniedTitle'),
        description: t('request.locationPermissionDeniedDescription'),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-system-permissions-modal'));
      }
      return;
    }

    if (!userId) {
      toast({
        variant: 'destructive',
        title: t('request.loginRequiredTitle'),
        description: t('request.loginRequiredDescription'),
      });
      return;
    }

    let liveStorageCount = 0;
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('radar_rider_passenger_count');
        const parsed = stored ? parseInt(stored, 10) : 0;
        if (Number.isFinite(parsed) && parsed >= 1) liveStorageCount = parsed;
      } catch {}
    }

    let effectiveRiderCount = (typeof explicitRiderCount === 'number' && explicitRiderCount >= 1)
      ? explicitRiderCount
      : (typeof riderCount === 'number' && riderCount >= 1)
        ? riderCount
        : (liveStorageCount >= 1)
          ? liveStorageCount
          : 0;

    // Only when retrying from an already-active offer search, fallback to 1 so retry doesn't stall:
    if (state.screen === 'RECEIVING_OFFERS' && effectiveRiderCount < 1) {
      effectiveRiderCount = 1;
    }

    if (effectiveRiderCount < 1) {
      toast({
        variant: 'destructive',
        title: t('request.passengersMissingTitle'),
        description: t('request.passengersMissingDescription'),
      });
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('radar_rider_passenger_count', String(effectiveRiderCount));
      } catch {}
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

    const effectiveDraftDestination = selectedDraftDestination || state.destination;
    const effectiveDestinationCoords = selectedDestinationCoords || state.destination?.coords;

    if (!effectiveDraftDestination || !effectiveDestinationCoords) {
      toast({
        variant: 'destructive',
        title: t('request.destinationNotReadyTitle'),
        description: t('request.destinationNotReadyDescription'),
      });
      return;
    }

    const directDistanceKm =
      effectiveDraftDestination.fareQuote?.straightDistanceKm ??
      calculateHaversineKm(riderLocation, effectiveDestinationCoords);

    if (directDistanceKm < 0.1) {
      toast({
        variant: 'destructive',
        title: t('request.sameLocationTitle'),
        description: t('request.sameLocationDescription'),
      });
      return;
    }

    if (
      effectiveDraftDestination.serverEstimatedFare === undefined ||
      (isServerFareLoading && !state.destination) ||
      (isRouteEstimateLoading && !state.destination) ||
      (!currentRouteEstimate && !state.destination)
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

    dispatch({ type: 'CONFIRM_DESTINATION', destination: effectiveDraftDestination as RiderDestination });
    dispatch({ type: 'SEND_REQUEST' });
    setIsSendingRideRequest(true);

    try {
      const payload = buildRideRequestInsertPayload({
        riderId: userId,
        origin: riderLocation,
        pickupAddress,
        destination: effectiveDestinationCoords,
        originH3: effectiveDraftDestination.originCell || latLngToCell(riderLocation.lat, riderLocation.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationH3:
          effectiveDraftDestination.destinationCell ||
          latLngToCell(effectiveDestinationCoords.lat, effectiveDestinationCoords.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationAddressAr: effectiveDraftDestination.label,
        serverEstimatedFare: effectiveDraftDestination.serverEstimatedFare,
        routeDistanceKm: currentRouteEstimate?.distanceKm ?? effectiveDraftDestination.fareQuote?.estimatedRoadDistanceKm ?? 2,
        routeDurationMinutes: currentRouteEstimate?.durationMinutes ?? Math.max(1, Math.ceil((effectiveDraftDestination.fareQuote?.estimatedRoadDistanceKm ?? 2) * 1.5)),
        countryId,
        pricingPreference: pricingPreference || null,
        numberOfRiders: effectiveRiderCount,
      });

      let request;
      try {
        request = await createRideRequest(supabase, payload);
      } catch (insertError: any) {
        const errorMsg = String(insertError?.message || '') + String(insertError?.code || '') + String(insertError?.details || '');
        const isDuplicateActive =
          insertError?.code === '23505' ||
          errorMsg.includes('unique_active_rider_request') ||
          errorMsg.includes('duplicate');

        if (isDuplicateActive && userId) {
          try {
            const { data: staleRows } = await (supabase as any)
              .from('ride_requests')
              .select('id, status')
              .eq('rider_id', userId)
              .in('status', ['PENDING', 'ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE'])
              .order('created_at', { ascending: false })
              .limit(1);

            const staleId = staleRows?.[0]?.id;
            if (staleId) {
              try {
                await cancelRideRequest(supabase, staleId);
              } catch {
                await fetch('/api/trip/mutual-cancel', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ requestId: staleId, cancelledByRole: 'rider' }),
                }).catch(() => {});
              }
              request = await createRideRequest(supabase, payload);
            } else {
              throw insertError;
            }
          } catch {
            throw insertError;
          }
        } else {
          throw insertError;
        }
      }

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
      // pendingAcceptedOfferId managed centrally
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
    t,
    toast,
    userId,
    riderOps?.accountSecurityStatus,
  ]);

  const handleCancelRideRequest = React.useCallback(async () => {
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

      // The request may have been cancelled by another tab, by the server timeout, or by
      // realtime recovery before the user pressed the close button. Treat that state as an
      // idempotent close instead of trapping the rider in a dead request screen.
      if (isStaleOrAlreadyClosed) {
        // pendingAcceptedOfferId managed centrally
        resetRideDraftState();
        dispatch({ type: 'RESET_TO_IDLE' });
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
