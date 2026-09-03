import React from 'react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { useDestinationPin } from './use-destination-pin';
import { useDestinationGeographyData } from './use-destination-geography-data';
import { useDestinationTextSearch } from './use-destination-text-search';
import { useDestinationMapPicker } from './use-destination-map-picker';
import { useClipboardLocationImport } from './use-clipboard-location-import';
import { useDestinationSelectionHandlers } from './use-destination-selection-handlers';
import { usePinnedPlaceLabel } from './use-pinned-place-label';
import type { RiderLocation } from '../components/rider-map';

interface RiderProfileLike {
  countryId?: number;
  governorate?: string;
  district?: string;
}
interface CountryNameConfig { name_ar?: string | null; name_en?: string | null; }

/**
 * Composes every hook involved in picking a destination (pin position,
 * governorate/district data, typed search, the map-picker dialog, and
 * clipboard import) plus the shared "captain scan preview" flag and the
 * cross-hook select-change handlers — this subsystem is cohesive enough to
 * assemble in one place rather than spelling out all six hook calls in the
 * top-level orchestrator.
 */
export function useDestinationSelectionState(params: {
  user: RiderProfileLike | null | undefined;
  language: AppLanguage;
  countryConfig: CountryNameConfig | null;
  riderLocation: RiderLocation;
}) {
  const { user, language, countryConfig, riderLocation } = params;

  const pin = useDestinationPin();
  const geography = useDestinationGeographyData(user, pin.destinationPinLocation);

  // District selection changed: recenter the pin to its anchor (leaves any
  // in-flight fly-to target alone) — a genuinely cross-hook concern.
  React.useEffect(() => {
    pin.setDestinationPinLocation(geography.selectedDistrict?.anchor || null);
    pin.setIsDestinationPinMoving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geography.selectedDistrict?.anchor, geography.selectedDistrict?.id]);

  const [isCaptainScanPreviewActive, setIsCaptainScanPreviewActive] = React.useState(false);
  const profileFallbackLocation = geography.profileDistrict?.anchor || geography.selectedDistrict?.anchor || riderLocation;
  const selectedDestinationCoords = pin.destinationPinLocation || geography.selectedDistrict?.anchor || null;

  /**
   * The name of the place the pin actually sits on, resolved once here rather than in the
   * screen that displays it.
   *
   * It has to live at this level because TWO consumers need the same answer: the summary the
   * rider reads, and buildRiderDestination in rider-view, whose `label` is the string sent
   * to the server and shown to the CAPTAIN as the destination. Resolving it in the display
   * component fixed only what the rider saw and left the captain reading the district.
   */
  const districtAnchor = geography.selectedDistrict?.anchor;
  const hasMovedPinOffDistrict = Boolean(
    selectedDestinationCoords
    && (!districtAnchor
      || Math.abs(selectedDestinationCoords.lat - districtAnchor.lat) > 0.0005
      || Math.abs(selectedDestinationCoords.lng - districtAnchor.lng) > 0.0005),
  );
  const { label: pinnedPlaceLabel } = usePinnedPlaceLabel(
    selectedDestinationCoords,
    language,
    hasMovedPinOffDistrict && !geography.externalLocationContext,
  );

  const search = useDestinationTextSearch({
    language,
    countryConfig,
    selectedGovernorateId: geography.selectedGovernorateId,
    selectedDistrict: geography.selectedDistrict,
    profileFallbackLocation,
    setDestinationPinLocation: pin.setDestinationPinLocation,
    setDestinationFlyToTarget: pin.setDestinationFlyToTarget,
    setIsDestinationPinMoving: pin.setIsDestinationPinMoving,
    setIsCaptainScanPreviewActive,
  });
  const mapPicker = useDestinationMapPicker({
    language,
    countryConfig,
    selectedDistrict: geography.selectedDistrict,
    destinationSearchQuery: search.destinationSearchQuery,
    setDestinationSearchResults: search.setDestinationSearchResults,
    setDestinationSearchStatus: search.setDestinationSearchStatus,
  });
  const clipboard = useClipboardLocationImport({
    geography,
    setDestinationSearchQuery: search.setDestinationSearchQuery,
    setDestinationSearchResults: search.setDestinationSearchResults,
    setDestinationPinLocation: pin.setDestinationPinLocation,
    setDestinationFlyToTarget: pin.setDestinationFlyToTarget,
    setIsDestinationPinMoving: pin.setIsDestinationPinMoving,
    setIsCaptainScanPreviewActive,
  });
  const selectionHandlers = useDestinationSelectionHandlers({
    geography,
    pin,
    search,
    clipboard,
    setIsCaptainScanPreviewActive,
  });

  return {
    pin,
    geography,
    search,
    mapPicker,
    clipboard,
    selectionHandlers,
    isCaptainScanPreviewActive,
    setIsCaptainScanPreviewActive,
    profileFallbackLocation,
    selectedDestinationCoords,
    pinnedPlaceLabel,
  };
}
