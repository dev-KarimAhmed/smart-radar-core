'use client';

import React from 'react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';
import type { useDestinationGeographyData } from '../hooks/use-destination-geography-data';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import type { useServerFareAndRoute } from '../hooks/use-server-fare-and-route';
import type { useOffersLifecycle } from '../hooks/use-offers-lifecycle';
import type { useCaptainPresence } from '../hooks/use-captain-presence';
import type { useTripCompletion } from '../hooks/use-trip-completion';
import type { useSendCancelRideRequest } from '../hooks/use-send-cancel-ride-request';
import type { useRideRequestStatusSync } from '../hooks/use-ride-request-status-sync';
import type { useEmergencyContact } from '../hooks/use-emergency-contact';
import type { RiderLocation } from './rider-map';
import { DestinationSelectionScreen } from './destination-selection-screen';
import { ReceivingOffersScreen } from './receiving-offers-screen';
import { TripActiveScreen } from './trip-active-screen';

// Pure routing component — renders one of three fully-styled child screens
// and owns no DOM/className of its own, but every .tsx file must declare a
// styles object per this repo's convention.
const styles = {} as const;

interface CountryNameConfig {
  name_ar?: string | null;
  name_en?: string | null;
}

export interface RiderActiveScreenProps {
  isArabic: boolean;
  language: AppLanguage;
  state: RiderMachineState;
  dispatch: React.Dispatch<RiderMachineAction>;
  geography: ReturnType<typeof useDestinationGeographyData>;
  search: ReturnType<typeof useDestinationTextSearch>;
  mapPicker: ReturnType<typeof useDestinationMapPicker>;
  clipboard: ReturnType<typeof useClipboardLocationImport>;
  fareAndRoute: ReturnType<typeof useServerFareAndRoute>;
  offers: ReturnType<typeof useOffersLifecycle>;
  captainPresence: ReturnType<typeof useCaptainPresence>;
  tripCompletion: ReturnType<typeof useTripCompletion>;
  sendCancel: ReturnType<typeof useSendCancelRideRequest>;
  statusSync: ReturnType<typeof useRideRequestStatusSync>;
  emergencyContact: ReturnType<typeof useEmergencyContact>;
  countryConfig: CountryNameConfig | null;
  riderLocation: RiderLocation;
  currencyLabel: string;
  selectedDraftDestination: RiderMachineState['destination'];
  selectedDestinationCoords: RiderLocation | null;
  isDestinationPinMoving: boolean;
  isCaptainScanPreviewActive: boolean;
  onGovernorateChange: (governorateId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onSearchQueryChange: (value: string) => void;
}

/** Renders whichever screen matches the state machine's current step. */
export function RiderActiveScreen(props: RiderActiveScreenProps) {
  const {
    isArabic,
    language,
    state,
    dispatch,
    geography,
    search,
    mapPicker,
    clipboard,
    fareAndRoute,
    offers,
    captainPresence,
    tripCompletion,
    sendCancel,
    statusSync,
    emergencyContact,
    countryConfig,
    riderLocation,
    currencyLabel,
    selectedDraftDestination,
    selectedDestinationCoords,
    isDestinationPinMoving,
    isCaptainScanPreviewActive,
    onGovernorateChange,
    onDistrictChange,
    onSearchQueryChange,
  } = props;

  if (state.screen === 'DESTINATION_SELECTION') {
    return (
      <DestinationSelectionScreen
        isArabic={isArabic}
        language={language}
        geography={geography}
        search={search}
        mapPicker={mapPicker}
        clipboard={clipboard}
        fareAndRoute={fareAndRoute}
        countryConfig={countryConfig}
        currencyLabel={currencyLabel}
        selectedDraftDestination={selectedDraftDestination}
        selectedDestinationCoords={selectedDestinationCoords}
        isDestinationPinMoving={isDestinationPinMoving}
        riderCount={tripCompletion.riderCount}
        setRiderCount={tripCompletion.setRiderCount}
        isSendingRideRequest={sendCancel.isSendingRideRequest}
        isCaptainScanPreviewActive={isCaptainScanPreviewActive}
        nearbyCaptainCount={captainPresence.mappedCaptains.length}
        onGovernorateChange={onGovernorateChange}
        onDistrictChange={onDistrictChange}
        onSearchQueryChange={onSearchQueryChange}
        onSendRequest={sendCancel.handleSendRequest}
      />
    );
  }

  if (state.screen === 'RECEIVING_OFFERS') {
    return (
      <ReceivingOffersScreen
        isArabic={isArabic}
        language={language}
        state={state}
        currencyLabel={currencyLabel}
        riderLocation={riderLocation}
        captainLocations={captainPresence.captainLocations}
        preferredCaptainIds={offers.preferredCaptainIds}
        acceptingOfferId={offers.acceptingOfferId}
        expandedOfferId={offers.expandedOfferId}
        onToggleExpandOffer={(offerId) => offers.setExpandedOfferId((current) => (current === offerId ? null : offerId))}
        firstSeenAtRef={offers.firstSeenAtRef}
        captainSearchRadiusKm={offers.captainSearchRadiusKm}
        isExpandingCaptainSearch={offers.isExpandingCaptainSearch}
        isCancellingRideRequest={sendCancel.isCancellingRideRequest}
        onCancelRideRequest={() => void sendCancel.handleCancelRideRequest()}
        onAcceptOffer={(offer) => void offers.handleAcceptOffer(offer)}
        onRetry={() => {
          dispatch({ type: 'RESET_TO_IDLE' });
          window.setTimeout(statusSync.openDestination, 0);
        }}
      />
    );
  }

  if (state.screen === 'TRIP_ACTIVE' && state.activeTrip) {
    return (
      <TripActiveScreen
        isArabic={isArabic}
        activeTrip={state.activeTrip}
        etaSeconds={statusSync.etaSeconds}
        currencyLabel={currencyLabel}
        isCancellingRideRequest={sendCancel.isCancellingRideRequest}
        onEmergencyWhatsapp={emergencyContact.handleEmergencyWhatsapp}
        onCancelRideRequest={() => void sendCancel.handleCancelRideRequest()}
      />
    );
  }

  return null;
}
