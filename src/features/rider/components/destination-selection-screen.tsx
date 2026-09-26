'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderDestination } from '../state/rider-state-machine';
import type { useDestinationGeographyData } from '../hooks/use-destination-geography-data';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import type { useServerFareAndRoute } from '../hooks/use-server-fare-and-route';
import type { RiderLocation } from './rider-map';
import { formatMoney } from '../services/rider-view-format';
import { DestinationSearchPanel } from './destination-search-panel';
import { DestinationTripSummary } from './destination-trip-summary';

const SAME_LOCATION_THRESHOLD_KM = 0.1;

const styles = {
  wrapper: "space-y-3 pb-20 lg:pb-4",
  inner: "space-y-3",
  header: "flex items-start justify-between gap-3",
  headerText: "min-w-0",
  eyebrow: "text-[11px] font-black text-[#14F5D5]",
  title: "mt-1 text-2xl font-black leading-tight text-white",
  subtitle: "mt-1 text-xs leading-relaxed text-slate-400",
  countryBadge: "shrink-0 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1.5 text-[10px] font-black text-[#14F5D5]",
} as const;

export interface DestinationSelectionScreenProps {
  isArabic: boolean;
  language: AppLanguage;
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
  onSendRequest: () => void;
  onResetDraft?: () => void;
  onCancelPreview?: () => void;
}

export function DestinationSelectionScreen({
  isArabic,
  language,
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
  onGovernorateChange,
  onDistrictChange,
  onSendRequest,
  onResetDraft,
  onCancelPreview,
}: DestinationSelectionScreenProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');

  const hasDestinationOptions = geography.destinationGovernorates.length > 0 && geography.destinationDistricts.length > 0;
  const selectedDestinationHasCoords = !!selectedDestinationCoords;
  const { isServerFareLoading, isRouteEstimateLoading, currentRouteEstimate, serverFareError } = fareAndRoute;

  const serverFareLabel =
    isServerFareLoading || isDestinationPinMoving
      ? t('fare.updating')
      : selectedDraftDestination?.serverEstimatedFare !== undefined
        ? formatMoney(selectedDraftDestination.serverEstimatedFare, currencyLabel)
        : t('destination.notAvailable');

  // Real straight-line distance, not H3-cell equality — resolution-9 cells are
  // ~350m wide, so comparing cell IDs falsely flagged destinations several
  // hundred meters from the rider (e.g. right after a trip ends nearby) as
  // "same location". SAME_LOCATION_THRESHOLD_KM only catches genuinely
  // unmoved selections, not district-anchor/GPS coincidences.
  const straightDistanceKm = selectedDraftDestination?.fareQuote?.straightDistanceKm;
  const isSameLocation = straightDistanceKm !== undefined && straightDistanceKm < SAME_LOCATION_THRESHOLD_KM;
  const estimatedDistanceKm = currentRouteEstimate?.distanceKm ?? null;
  const estimatedDurationMinutes = currentRouteEstimate?.durationMinutes ?? null;
  const hasImportedLocation = clipboard.externalLocationUrl.length > 0;
  const destinationReady =
    selectedDestinationHasCoords &&
    selectedDraftDestination?.serverEstimatedFare !== undefined &&
    currentRouteEstimate !== null &&
    !isServerFareLoading &&
    !isRouteEstimateLoading &&
    !isDestinationPinMoving &&
    !isSameLocation;
  const districtLabel = geography.externalLocationContext
    ? `${geography.externalLocationContext.district} - ${geography.externalLocationContext.governorate}`
    : geography.selectedDistrict
      ? isArabic
        ? `${geography.selectedDistrict.districtAr} - ${geography.selectedDistrict.governorateAr}`
        : `${geography.selectedDistrict.districtEn || geography.selectedDistrict.districtAr} - ${geography.selectedDistrict.governorateEn || geography.selectedDistrict.governorateAr}`
      : t('destination.notAvailable');

  // The pin wins when it has one: it is what the trip is actually priced and driven to.
  const destinationLabel = pinnedPlaceLabel || districtLabel;

  return (
    <div className={styles.wrapper} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>{t('destination.eyebrow')}</p>
            <h2 className={styles.title}>{t('panel.whereTo')}</h2>
            <p className={styles.subtitle}>{locationCopy('flow_helper')}</p>
          </div>
          {countryConfig?.name_ar || countryConfig?.name_en ? (
            <span className={styles.countryBadge}>
              {isArabic ? countryConfig.name_ar || countryConfig.name_en : countryConfig.name_en || countryConfig.name_ar}
            </span>
          ) : null}
        </div>
      </div>

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
        onSendRequest={onSendRequest}
      />
    </div>
  );
}
