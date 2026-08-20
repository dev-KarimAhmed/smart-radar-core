'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AdStage } from '@/features/ads/ad-stage/contract';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useActiveTripReloadGuard } from '@/shared/hooks/use-active-trip-reload-guard';
import { useRiderDashboardMachine } from '../state/rider-state-machine';
import { useRiderGeolocation } from '../hooks/use-rider-geolocation';
import { useCaptainPresence } from '../hooks/use-captain-presence';
import { useEmergencyContact } from '../hooks/use-emergency-contact';
import { useCountryConfig } from '../hooks/use-country-config';
import { getCountryDefaultCenter } from '@/shared/hooks/use-country-config';
import { useDestinationSelectionState } from '../hooks/use-destination-selection-state';
import { useServerFareAndRoute } from '../hooks/use-server-fare-and-route';
import { useOffersLifecycle } from '../hooks/use-offers-lifecycle';
import { useRideRequestStatusSync } from '../hooks/use-ride-request-status-sync';
import { useSendCancelRideRequest } from '../hooks/use-send-cancel-ride-request';
import { useTripCompletion } from '../hooks/use-trip-completion';
import { useRiderProfileSummary } from '../hooks/use-rider-profile-summary';
import { buildRiderDestination } from '../services/rider-destination-normalizers';
import { IdleMapScreen } from './idle-map-screen';
import { RiderShellFrame } from './rider-shell-frame';
import { RiderActiveScreen } from './rider-active-screen';
import { RiderModals } from './rider-modals';
import { RadarRiderDashboard } from './rider-dashboard';

const styles = {
  adRiverWrapper: "hidden overflow-hidden rounded-[24px] border border-[#14B8A6]/15 bg-[#0B0F19]/88 shadow-2xl shadow-black/35 backdrop-blur-xl lg:block",
} as const;

export function RiderViewTab({ onExitRequestFlow, isStandbyDismissed = false }: { onExitRequestFlow?: () => void; isStandbyDismissed?: boolean } = {}) {
  const { user } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const { state, dispatch, showAdRiver } = useRiderDashboardMachine();
  useActiveTripReloadGuard(Boolean(state.requestId) && (state.screen === 'RECEIVING_OFFERS' || state.screen === 'TRIP_ACTIVE'));

  const activeCountryId = user?.countryId;
  const countryConfig = useCountryConfig(activeCountryId);
  const geolocation = useRiderGeolocation(language, getCountryDefaultCenter(countryConfig));
  const captainPresence = useCaptainPresence(user?.uid, activeCountryId, geolocation.riderH3Cell);
  const emergencyContact = useEmergencyContact(user?.uid, {
    captainName: state.activeTrip?.captainName,
    destinationLabel: state.activeTrip?.destinationLabel,
    requestId: state.requestId,
  });

  const destination = useDestinationSelectionState({
    user,
    language,
    countryConfig,
    riderLocation: geolocation.riderLocation,
  });
  const { pin, geography, search, mapPicker, clipboard, selectionHandlers } = destination;

  const offers = useOffersLifecycle(state, dispatch, language);
  const fareAndRoute = useServerFareAndRoute({
    activeCountryId,
    riderLocation: geolocation.riderLocation,
    selectedDestinationCoords: destination.selectedDestinationCoords,
    selectedDistrict: geography.selectedDistrict,
    destinationDataError: geography.destinationDataError,
    isDestinationPinMoving: pin.isDestinationPinMoving,
  });

  const selectedDraftDestination = React.useMemo(() => {
    if (!geography.selectedDistrict || !destination.selectedDestinationCoords) return null;
    const builtDestination = buildRiderDestination(
      geography.selectedDistrict,
      geolocation.riderLocation,
      fareAndRoute.currentServerFare,
      destination.selectedDestinationCoords,
      fareAndRoute.currentRouteEstimate?.distanceKm ?? null,
    );
    return search.destinationSearchStatus === 'selected' && search.destinationSearchQuery.trim()
      ? { ...builtDestination, label: search.destinationSearchQuery.trim() }
      : builtDestination;
  }, [
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
    pendingAcceptedOfferIdRef: offers.pendingAcceptedOfferIdRef,
  });
  const tripCompletion = useTripCompletion(state, dispatch);

  const resetRideDraftState = React.useCallback(() => {
    geography.reset();
    pin.reset();
    search.reset();
    clipboard.reset();
    fareAndRoute.reset();
    offers.reset();
    captainPresence.reset();
    statusSync.reset();
    tripCompletion.reset();
    destination.setIsCaptainScanPreviewActive(false);

    try {
      [
        'radar_ride_request_draft',
        'radar_destination_draft',
        'radar_auction_draft',
        'radar_external_location_draft',
        'radar_request_flow',
      ].forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Storage can be unavailable in private browsing; in-memory state is still reset.
    }
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
    pendingAcceptedOfferIdRef: offers.pendingAcceptedOfferIdRef,
    onExitRequestFlow,
    resetRideDraftState,
  });

  const { riderProfile, systemMessages, currencyLabel } = useRiderProfileSummary(user, language, countryConfig, geolocation.locationStatus, geolocation.liveCurrencyCode);

  const handleCloseOrCancel = React.useCallback(async () => {
    if (state.requestId) {
      await sendCancel.handleCancelRideRequest();
    } else if (state.screen === 'DESTINATION_SELECTION' || state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') {
      dispatch({ type: 'RETURN_TO_MAP' });
    } else if (onExitRequestFlow) {
      onExitRequestFlow();
    } else {
      window.dispatchEvent(new CustomEvent('exit-request-flow'));
    }
  }, [dispatch, onExitRequestFlow, sendCancel, state.requestId, state.screen]);

  return (
    <>
      <RiderShellFrame
        isArabic={isArabic}
        screen={state.screen}
        dispatch={dispatch}
        activeTripCaptainId={state.activeTrip?.captainId || null}
        captainLocations={captainPresence.mappedCaptains}
        destinationFlyToTarget={pin.destinationFlyToTarget || geography.selectedDistrict?.anchor || null}
        fallbackLocation={destination.profileFallbackLocation}
        onDestinationChange={pin.handleDestinationPinChange}
        onDestinationMoveStart={pin.handleDestinationPinMoveStart}
        onLocationChange={geolocation.handleLocationChange}
        onCloseOrCancel={() => void handleCloseOrCancel()}
      >
        {state.screen === 'IDLE_MAP' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <IdleMapScreen
              isArabic={isArabic}
              isGeocoding={geolocation.isGeocoding}
              currentAddressName={geolocation.currentAddressName}
              locationStatus={geolocation.locationStatus}
              riderRating={riderProfile.rating}
              onOpenDestination={statusSync.openDestination}
            />
          </motion.div>
        )}

        <RiderActiveScreen
          isArabic={isArabic}
          language={language}
          state={state}
          dispatch={dispatch}
          geography={geography}
          search={search}
          mapPicker={mapPicker}
          clipboard={clipboard}
          fareAndRoute={fareAndRoute}
          offers={offers}
          captainPresence={captainPresence}
          tripCompletion={tripCompletion}
          sendCancel={sendCancel}
          statusSync={statusSync}
          emergencyContact={emergencyContact}
          countryConfig={countryConfig}
          riderLocation={geolocation.riderLocation}
          currencyLabel={currencyLabel}
          selectedDraftDestination={selectedDraftDestination}
          selectedDestinationCoords={destination.selectedDestinationCoords}
          isDestinationPinMoving={pin.isDestinationPinMoving}
          isCaptainScanPreviewActive={destination.isCaptainScanPreviewActive}
          onGovernorateChange={selectionHandlers.onGovernorateChange}
          onDistrictChange={selectionHandlers.onDistrictChange}
          onSearchQueryChange={selectionHandlers.onSearchQueryChange}
        />

        {showAdRiver && (
          <div className={styles.adRiverWrapper}>
            <AdStage />
          </div>
        )}

        {(state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') && (
          <RadarRiderDashboard
            riderProfile={riderProfile}
            tripsWithin72Hours={tripCompletion.tripsWithin72Hours}
            systemMessages={systemMessages}
            currencyLabel={currencyLabel}
          />
        )}
      </RiderShellFrame>

      <RiderModals
        isArabic={isArabic}
        state={state}
        dispatch={dispatch}
        userId={user?.uid}
        onExitRequestFlow={onExitRequestFlow}
        onRatingSuccess={() => void captainPresence.loadBlockedCaptains()}
        onTripFullyEnded={resetRideDraftState}
        showEmergencyContactDialog={emergencyContact.showEmergencyContactDialog}
        setShowEmergencyContactDialog={emergencyContact.setShowEmergencyContactDialog}
        onAddEmergencyNumber={emergencyContact.handleAddEmergencyContact}
      />
    </>
  );
}
