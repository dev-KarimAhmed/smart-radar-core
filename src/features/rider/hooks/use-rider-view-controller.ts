import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useActiveTripReloadGuard } from '@/shared/hooks/use-active-trip-reload-guard';
import { useRiderDashboardMachine } from '../state/rider-state-machine';
import { useRiderGeolocation } from './use-rider-geolocation';
import { getLastKnownLocation } from '@/shared/hooks/use-live-geolocation';
import { useCaptainPresence } from './use-captain-presence';
import { useEmergencyContact } from './use-emergency-contact';
import { useCountryConfig } from './use-country-config';
import { getCountryDefaultCenter } from '@/shared/hooks/use-country-config';
import { useDestinationSelectionState } from './use-destination-selection-state';
import { useServerFareAndRoute } from './use-server-fare-and-route';
import { useOffersLifecycle } from './use-offers-lifecycle';
import { useRideRequestStatusSync } from './use-ride-request-status-sync';
import { useSendCancelRideRequest } from './use-send-cancel-ride-request';
import { useTripCompletion } from './use-trip-completion';
import { useRiderProfileSummary } from './use-rider-profile-summary';
import { useRiderOperations } from './use-rider-operations';
import { useRiderPresenceSync } from './use-rider-presence-sync';
import { clearRiderDraftStorage } from '../services/rider-draft-storage';
import {
  isJordanCoordinates,
  resolveActiveCountryId,
  resolveRiderEmergencyContext,
  resolveSelectedDraftDestination,
} from './rider-view-controller-helpers';

export * from './rider-view-controller-helpers';

export interface UseRiderViewControllerOptions {
  onExitRequestFlow?: () => void;
  isStandbyDismissed?: boolean;
}

export function useRiderViewController({
  onExitRequestFlow,
  isStandbyDismissed = false,
}: UseRiderViewControllerOptions = {}) {
  const { user } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const { state, dispatch, showAdRiver } = useRiderDashboardMachine();
  const riderOperations = useRiderOperations();
  useActiveTripReloadGuard(Boolean(state.requestId) && (state.screen === 'RECEIVING_OFFERS' || state.screen === 'TRIP_ACTIVE'));
  useRiderPresenceSync(user, Boolean(riderOperations.accountSecurityStatus), state.screen);

  const lastKnown = getLastKnownLocation();
  const activeCountryId = resolveActiveCountryId(user?.countryId, lastKnown);
  const countryConfig = useCountryConfig(activeCountryId);
  const geolocation = useRiderGeolocation(language, getCountryDefaultCenter(countryConfig));
  const captainPresence = useCaptainPresence(user?.uid, activeCountryId, geolocation.riderH3Cell);
  const emergencyContact = useEmergencyContact(
    user?.uid,
    resolveRiderEmergencyContext(state, geolocation.riderLocation)
  );

  const destination = useDestinationSelectionState({
    user,
    language,
    countryConfig,
    riderLocation: geolocation.riderLocation,
    riderLocationStatus: geolocation.locationStatus,
  });
  const { pin, geography, search, mapPicker, clipboard, selectionHandlers } = destination;

  const tripCompletion = useTripCompletion(state, dispatch, user?.uid);
  const offers = useOffersLifecycle(state, dispatch, language, tripCompletion.pricingPreference);
  const effectiveCountryId = activeCountryId ?? (isJordanCoordinates(geolocation.riderLocation) ? 1 : undefined);
  const fareAndRoute = useServerFareAndRoute({
    activeCountryId: effectiveCountryId,
    trafficFactor: countryConfig?.traffic_factor,
    riderLocation: geolocation.riderLocation,
    riderLocationStatus: geolocation.locationStatus,
    selectedDestinationCoords: destination.selectedDestinationCoords,
    selectedDistrict: geography.selectedDistrict,
    destinationDataError: geography.destinationDataError,
    isDestinationPinMoving: pin.isDestinationPinMoving,
  });

  const selectedDraftDestination = React.useMemo(() => {
    return resolveSelectedDraftDestination({
      selectedDistrict: geography.selectedDistrict,
      selectedDestinationCoords: destination.selectedDestinationCoords,
      riderLocation: geolocation.riderLocation,
      currentServerFare: fareAndRoute.currentServerFare,
      distanceKm: fareAndRoute.currentRouteEstimate?.distanceKm,
      pinnedPlaceLabel: destination.pinnedPlaceLabel,
      destinationSearchStatus: search.destinationSearchStatus,
      destinationSearchQuery: search.destinationSearchQuery,
    });
  }, [
    destination.pinnedPlaceLabel,
    destination.selectedDestinationCoords,
    fareAndRoute.currentRouteEstimate?.distanceKm,
    fareAndRoute.currentServerFare,
    geography.selectedDistrict,
    geolocation.riderLocation,
    search.destinationSearchQuery,
    search.destinationSearchStatus,
  ]);

  const statusSync = useRideRequestStatusSync({
    userId: user?.uid,
    selectedDraftDestination,
    language,
    state,
    dispatch,
  });

  const resetRideDraftState = React.useCallback(() => {
    geography.reset();
    pin.reset();
    search.reset();
    clipboard.reset();
    fareAndRoute.reset();
    offers.reset();
    captainPresence.reset();
    tripCompletion.reset();
    destination.setIsCaptainScanPreviewActive(false);

    clearRiderDraftStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captainPresence, clipboard, destination, fareAndRoute, geography, offers, pin, search, statusSync, tripCompletion]);

  const sendCancel = useSendCancelRideRequest({
    userId: user?.uid,
    activeCountryId,
    riderLocation: geolocation.riderLocation,
    pickupAddress: geolocation.currentAddressName,
    selectedDraftDestination,
    selectedDestinationCoords: destination.selectedDestinationCoords,
    isServerFareLoading: fareAndRoute.isServerFareLoading,
    isRouteEstimateLoading: fareAndRoute.isRouteEstimateLoading,
    currentRouteEstimate: fareAndRoute.currentRouteEstimate,
    language,
    state,
    dispatch,
    pricingPreference: tripCompletion.pricingPreference,
    riderCount: tripCompletion.riderCount,
    onExitRequestFlow,
    resetRideDraftState,
    locationStatus: geolocation.locationStatus,
  });

  const { riderProfile, systemMessages, currencyLabel } = useRiderProfileSummary(
    user,
    language,
    countryConfig,
    geolocation.locationStatus,
    geolocation.liveCurrencyCode,
  );

  const prevStandbyDismissedRef = React.useRef(isStandbyDismissed);
  React.useEffect(() => {
    if (!prevStandbyDismissedRef.current && isStandbyDismissed) {
      dispatch({ type: 'OPEN_DESTINATION' });
    }
    prevStandbyDismissedRef.current = isStandbyDismissed;
  }, [isStandbyDismissed, dispatch]);

  React.useEffect(() => {
    const handleExit = () => {
      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
    };
    window.addEventListener('exit-request-flow', handleExit);
    return () => window.removeEventListener('exit-request-flow', handleExit);
  }, [dispatch, resetRideDraftState]);

  // Auto-dissolve active ride request / buoy if account becomes suspended or banned
  React.useEffect(() => {
    if (riderOperations.accountSecurityStatus && state.requestId) {
      void sendCancel.handleCancelRideRequest();
      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
    }
  }, [riderOperations.accountSecurityStatus, state.requestId, sendCancel, resetRideDraftState, dispatch]);

  const handleCloseOrCancel = React.useCallback(async () => {
    if (state.requestId) {
      try {
        await sendCancel.handleCancelRideRequest();
      } catch (err) {
        console.warn('[RiderView] error cancelling ride request:', err);
      }
    }
    resetRideDraftState();
    dispatch({ type: 'RESET_TO_IDLE' });
    if (onExitRequestFlow) {
      onExitRequestFlow();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('exit-request-flow'));
    }
  }, [dispatch, onExitRequestFlow, resetRideDraftState, sendCancel, state.requestId]);

  return {
    user,
    isArabic,
    language,
    state,
    dispatch,
    showAdRiver,
    countryConfig,
    geolocation,
    captainPresence,
    emergencyContact,
    destination,
    pin,
    geography,
    search,
    mapPicker,
    clipboard,
    selectionHandlers,
    fareAndRoute,
    selectedDraftDestination,
    tripCompletion,
    offers,
    statusSync,
    sendCancel,
    riderProfile,
    systemMessages,
    currencyLabel,
    resetRideDraftState,
    handleCloseOrCancel,
  };
}
