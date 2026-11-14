'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AdStage } from '@/features/ads/ad-stage/contract';
import { useRiderViewController } from '../hooks/use-rider-view-controller';
import { IdleMapScreen } from './idle-map-screen';
import { RiderShellFrame } from './rider-shell-frame';
import { RiderActiveScreen } from './rider-active-screen';
import { RiderModals } from './rider-modals';
import { RiderDashboard } from './rider-dashboard';

const styles = {
  adRiverWrapper: "hidden overflow-hidden rounded-[24px] border border-[#14B8A6]/15 bg-[#0B0F19]/88 shadow-2xl shadow-black/35 backdrop-blur-xl lg:block",
} as const;

export function RiderViewTab({
  onExitRequestFlow,
  isStandbyDismissed = false,
}: {
  onExitRequestFlow?: () => void;
  isStandbyDismissed?: boolean;
} = {}) {
  const {
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
  } = useRiderViewController({ onExitRequestFlow, isStandbyDismissed });

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
          locationStatus={geolocation.locationStatus}
          currencyLabel={currencyLabel}
          selectedDraftDestination={selectedDraftDestination}
          selectedDestinationCoords={destination.selectedDestinationCoords}
          pinnedPlaceLabel={destination.pinnedPlaceLabel}
          isDestinationPinMoving={pin.isDestinationPinMoving}
          isCaptainScanPreviewActive={destination.isCaptainScanPreviewActive}
          onGovernorateChange={selectionHandlers.onGovernorateChange}
          onDistrictChange={selectionHandlers.onDistrictChange}
          onResetDraft={resetRideDraftState}
          onCancelPreview={resetRideDraftState}
        />

        {showAdRiver && (
          <div className={styles.adRiverWrapper}>
            <AdStage audience="rider" />
          </div>
        )}

        {(state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') && (
          <RiderDashboard
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
        showConsentDialog={emergencyContact.showConsentDialog}
        setShowConsentDialog={emergencyContact.setShowConsentDialog}
        onConfirmConsent={emergencyContact.handleConfirmConsent}
      />
    </>
  );
}
