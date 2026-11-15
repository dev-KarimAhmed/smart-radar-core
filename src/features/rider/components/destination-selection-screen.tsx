'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderDestination } from '../state/rider-state-machine';
import type { useDestinationGeographyData } from '../hooks/use-destination-geography-data';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import type { useServerFareAndRoute } from '../hooks/use-server-fare-and-route';
import type { RiderLocation, RiderLocationStatus } from './rider-map';
import { formatMoney } from '../services/rider-view-format';
import { DestinationSearchPanel } from './destination-search-panel';
import { DestinationTripSummary } from './destination-trip-summary';
import { useDestinationSelectionLocation } from './destination-selection/use-destination-selection-location';
import { DestinationWelcomeModal } from './destination-selection/destination-welcome-modal';
import { DestinationLocationNotice } from './destination-selection/destination-location-notice';

const SAME_LOCATION_THRESHOLD_KM = 0.1;

const styles = {
  wrapper: "space-y-3 pb-20 lg:pb-4",
  inner: "space-y-3",
  header: "flex items-start justify-between gap-3",
  headerText: "min-w-0",
  eyebrow: "text-[11px] font-black text-[#14F5D5]",
  countryBadge: "shrink-0 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1.5 text-[10px] font-black text-[#14F5D5]",
} as const;

export interface DestinationSelectionScreenProps {
  isArabic: boolean;
  language: AppLanguage;
  locationStatus?: RiderLocationStatus;
  geography: ReturnType<typeof useDestinationGeographyData>;
  search: ReturnType<typeof useDestinationTextSearch>;
  mapPicker: ReturnType<typeof useDestinationMapPicker>;
  clipboard: ReturnType<typeof useClipboardLocationImport>;
  fareAndRoute: ReturnType<typeof useServerFareAndRoute>;
  countryConfig: { name_ar?: string | null; name_en?: string | null } | null;
  currencyLabel: string;
  selectedDraftDestination: RiderDestination | null;
  selectedDestinationCoords: RiderLocation | null;
  /** Resolved name of the pinned point; overrides the district label when present. */
  pinnedPlaceLabel: string;
  isDestinationPinMoving: boolean;
  riderCount: number;
  setRiderCount: (updater: (current: number) => number) => void;
  pricingPreference: 'APP' | 'TAXI' | 'FREE' | null;
  setPricingPreference: (pref: 'APP' | 'TAXI' | 'FREE' | null) => void;
  isSendingRideRequest: boolean;
  isCaptainScanPreviewActive: boolean;
  nearbyCaptainCount: number;
  onGovernorateChange: (governorateId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onSendRequest: (passengerCount?: number) => void;
  onResetDraft?: () => void;
  onCancelPreview?: () => void;
}

export function DestinationSelectionScreen({
  isArabic,
  locationStatus,
  geography,
  search,
  mapPicker,
  clipboard,
  fareAndRoute,
  countryConfig,
  currencyLabel,
  selectedDraftDestination,
  selectedDestinationCoords,
  pinnedPlaceLabel,
  isDestinationPinMoving,
  riderCount,
  setRiderCount,
  pricingPreference,
  setPricingPreference,
  isSendingRideRequest,
  isCaptainScanPreviewActive,
  nearbyCaptainCount,
  onSendRequest,
  onResetDraft,
  onCancelPreview,
}: DestinationSelectionScreenProps) {
  const t = useTranslations('riderView');
  const [hasDismissedWelcome, setHasDismissedWelcome] = React.useState(false);
  const { isLocationDisabled, handleRequestLocation } = useDestinationSelectionLocation(locationStatus);

  const hasDestinationOptions = geography.destinationGovernorates.length > 0 && geography.destinationDistricts.length > 0;
  const selectedDestinationHasCoords = !!selectedDestinationCoords;
  const { isServerFareLoading, isRouteEstimateLoading, currentRouteEstimate, serverFareError } = fareAndRoute;

  const serverFareLabel =
    isServerFareLoading || isDestinationPinMoving
      ? t('fare.updating')
      : selectedDraftDestination?.serverEstimatedFare !== undefined
        ? formatMoney(selectedDraftDestination.serverEstimatedFare, currencyLabel)
        : t('destination.notAvailable');

  const straightDistanceKm = selectedDraftDestination?.fareQuote?.straightDistanceKm;
  const isSameLocation = straightDistanceKm !== undefined && straightDistanceKm < SAME_LOCATION_THRESHOLD_KM;
  const estimatedDistanceKm = currentRouteEstimate?.distanceKm ?? null;
  const estimatedDurationMinutes = currentRouteEstimate?.durationMinutes ?? null;
  const destinationReady =
    selectedDestinationHasCoords &&
    selectedDraftDestination?.serverEstimatedFare !== undefined &&
    currentRouteEstimate !== null &&
    !isServerFareLoading &&
    !isRouteEstimateLoading &&
    !isDestinationPinMoving &&
    !isSameLocation;

  const districtLabel = geography.externalLocationContext
    ? [geography.externalLocationContext.district, geography.externalLocationContext.governorate].filter(Boolean).join(' - ')
    : geography.selectedDistrict
      ? isArabic
        ? [geography.selectedDistrict.districtAr, geography.selectedDistrict.governorateAr].filter(Boolean).join(' - ')
        : [geography.selectedDistrict.districtEn || geography.selectedDistrict.districtAr, geography.selectedDistrict.governorateEn || geography.selectedDistrict.governorateAr].filter(Boolean).join(' - ')
      : t('destination.notAvailable');

  const destinationLabel = pinnedPlaceLabel || districtLabel;

  return (
    <div className={styles.wrapper} dir={isArabic ? 'rtl' : 'ltr'}>
      <DestinationWelcomeModal
        isArabic={isArabic}
        isOpen={!hasDismissedWelcome}
        onDismiss={() => setHasDismissedWelcome(true)}
      />

      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>{t('destination.eyebrow')}</p>
          </div>
          {countryConfig?.name_ar || countryConfig?.name_en ? (
            <span className={styles.countryBadge}>
              {isArabic ? countryConfig.name_ar || countryConfig.name_en : countryConfig.name_en || countryConfig.name_ar}
            </span>
          ) : null}
        </div>
      </div>

      <DestinationLocationNotice
        isArabic={isArabic}
        isVisible={isLocationDisabled}
        onRequestLocation={handleRequestLocation}
      />

      <DestinationSearchPanel
        search={search}
        mapPicker={mapPicker}
        clipboard={clipboard}
        isRouteEstimateLoading={isRouteEstimateLoading}
        currentRouteEstimate={currentRouteEstimate}
        isCaptainScanPreviewActive={isCaptainScanPreviewActive}
        nearbyCaptainCount={nearbyCaptainCount}
        onResetDraft={onResetDraft}
        onCancelPreview={onCancelPreview}
      />

      {isSameLocation && selectedDestinationCoords && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs font-bold text-amber-300">
          ⚠️ موقع الوجهة مطابق لموقعك الحالي. يرجى البحث أو اختيار وجهة تريد الذهاب إليها.
        </div>
      )}

      {Boolean((selectedDestinationCoords && !isSameLocation) || isCaptainScanPreviewActive) && (
        <DestinationTripSummary
          riderCount={riderCount}
          setRiderCount={setRiderCount}
          pricingPreference={pricingPreference}
          setPricingPreference={setPricingPreference}
          destinationDataError={geography.destinationDataError}
          destinationReady={destinationReady}
          isServerFareLoading={isServerFareLoading}
          isDestinationPinMoving={isDestinationPinMoving}
          destinationLabel={destinationLabel}
          selectedDestinationCoords={selectedDestinationCoords}
          hasDestinationCoordsAnchor={!!geography.selectedDistrict?.anchor && !!selectedDestinationCoords}
          serverFareLabel={serverFareLabel}
          isRouteEstimateLoading={isRouteEstimateLoading}
          estimatedDurationMinutes={estimatedDurationMinutes}
          estimatedDistanceKm={estimatedDistanceKm}
          nearbyCaptainCount={nearbyCaptainCount}
          serverFareError={serverFareError}
          isSameLocation={isSameLocation}
          isSendingRideRequest={isSendingRideRequest}
          hasDestinationOptions={hasDestinationOptions}
          selectedDestinationHasCoords={selectedDestinationHasCoords}
          hasServerEstimatedFare={selectedDraftDestination?.serverEstimatedFare !== undefined}
          isCaptainScanPreviewActive={isCaptainScanPreviewActive}
          isLocationDisabled={isLocationDisabled}
          onEnableLocation={handleRequestLocation}
          onSendRequest={(count) => onSendRequest(count ?? riderCount)}
        />
      )}
    </div>
  );
}
