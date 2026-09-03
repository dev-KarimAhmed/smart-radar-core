'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderDestination } from '../state/rider-state-machine';
import type { useDestinationGeographyData } from '../hooks/use-destination-geography-data';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import type { useServerFareAndRoute } from '../hooks/use-server-fare-and-route';
import { usePinnedPlaceLabel } from '../hooks/use-pinned-place-label';
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
  progress: "grid grid-cols-3 gap-1.5",
  progressStep: "flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-2 text-[9px] font-black transition-colors",
  progressStepComplete: "border-[#14B8A6]/30 bg-[#14B8A6]/12 text-[#BFFCF2]",
  progressStepIncomplete: "border-white/8 bg-white/[0.03] text-slate-500",
  progressBadge: "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px]",
  progressBadgeComplete: "bg-[#14B8A6] text-[#061316]",
  progressBadgeIncomplete: "bg-slate-800 text-slate-400",
  progressCheckIcon: "h-2.5 w-2.5 stroke-[3]",
  progressLabel: "truncate",
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
  isDestinationPinMoving: boolean;
  riderCount: number;
  setRiderCount: (updater: (current: number) => number) => void;
  isSendingRideRequest: boolean;
  isCaptainScanPreviewActive: boolean;
  nearbyCaptainCount: number;
  onGovernorateChange: (governorateId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onSearchQueryChange: (value: string) => void;
  onSendRequest: () => void;
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
  isDestinationPinMoving,
  riderCount,
  setRiderCount,
  isSendingRideRequest,
  isCaptainScanPreviewActive,
  nearbyCaptainCount,
  onGovernorateChange,
  onDistrictChange,
  onSearchQueryChange,
  onSendRequest,
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
  /**
   * The name of the place the pin is actually on, whenever the rider has moved it off the
   * district's own anchor.
   *
   * Without this the label came only from the dropdown or a pasted link, so dragging the pin
   * to Cairo still read "سادس من أكتوبر - الجيزة" — the coordinates, distance and fare all
   * followed the pin while only the NAME stayed behind, which reads as the app overriding
   * the rider's choice.
   */
  const districtAnchor = geography.selectedDistrict?.anchor;
  const hasMovedPin = Boolean(
    selectedDestinationCoords
    && (!districtAnchor
      || Math.abs(selectedDestinationCoords.lat - districtAnchor.lat) > 0.0005
      || Math.abs(selectedDestinationCoords.lng - districtAnchor.lng) > 0.0005),
  );
  const { label: pinnedPlaceLabel } = usePinnedPlaceLabel(
    selectedDestinationCoords,
    language,
    hasMovedPin && !geography.externalLocationContext,
  );

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

        <div className={styles.progress} aria-label={locationCopy('progress_label')}>
          {[
            { label: locationCopy('progress_area'), complete: !!geography.selectedDistrict },
            { label: locationCopy('progress_location'), complete: hasImportedLocation || selectedDestinationHasCoords },
            { label: locationCopy('progress_review'), complete: destinationReady },
          ].map((step, index) => (
            <div
              key={step.label}
              className={cn(styles.progressStep, step.complete ? styles.progressStepComplete : styles.progressStepIncomplete)}
            >
              <span className={cn(styles.progressBadge, step.complete ? styles.progressBadgeComplete : styles.progressBadgeIncomplete)}>
                {step.complete ? <Check className={styles.progressCheckIcon} /> : index + 1}
              </span>
              <span className={styles.progressLabel}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <DestinationSearchPanel
        destinationSearchQuery={search.destinationSearchQuery}
        onSearchQueryChange={onSearchQueryChange}
        search={search}
        mapPicker={mapPicker}
        clipboard={clipboard}
        isRouteEstimateLoading={isRouteEstimateLoading}
        currentRouteEstimate={currentRouteEstimate}
        isCaptainScanPreviewActive={isCaptainScanPreviewActive}
        nearbyCaptainCount={nearbyCaptainCount}
      />

      <DestinationTripSummary
        riderCount={riderCount}
        setRiderCount={setRiderCount}
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
        onSendRequest={onSendRequest}
      />
    </div>
  );
}
