import React from 'react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { useDestinationPin } from './use-destination-pin';
import { useDestinationGeographyData } from './use-destination-geography-data';
import { useDestinationTextSearch } from './use-destination-text-search';
import { useDestinationMapPicker } from './use-destination-map-picker';
import { useClipboardLocationImport } from './use-clipboard-location-import';
import { useDestinationSelectionHandlers } from './use-destination-selection-handlers';
import { usePinnedPlaceLabel } from './use-pinned-place-label';
import type { RiderLocation, RiderLocationStatus } from '../components/rider-map';

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
  riderLocationStatus?: RiderLocationStatus;
}) {
  const { user, language, countryConfig, riderLocation, riderLocationStatus } = params;

  const pin = useDestinationPin();
  const geography = useDestinationGeographyData(user, pin.destinationPinLocation);

  const hasUserMovedPinRef = React.useRef(false);

  // Sync destination pin to rider's position initially, and auto-update when live GPS locks in
  React.useEffect(() => {
    if (hasUserMovedPinRef.current) return;
    if (
      riderLocation &&
      Number.isFinite(riderLocation.lat) &&
      Number.isFinite(riderLocation.lng) &&
      (riderLocation.lat !== 0 || riderLocation.lng !== 0)
    ) {
      if (riderLocationStatus === 'live' || !pin.destinationPinLocation) {
        pin.setDestinationPinLocation(riderLocation);
      }
    }
  }, [pin, riderLocation, riderLocationStatus]);

  const handleDestinationPinChange = React.useCallback((location: RiderLocation) => {
    hasUserMovedPinRef.current = true;
    pin.handleDestinationPinChange(location);
  }, [pin]);

  const resetPin = React.useCallback(() => {
    hasUserMovedPinRef.current = false;
    pin.reset();
  }, [pin]);

  const wrappedPin = React.useMemo(() => ({
    ...pin,
    handleDestinationPinChange,
    reset: resetPin,
  }), [pin, handleDestinationPinChange, resetPin]);

  // Recenter the pin to its anchor only when an external location is imported (google:*),
  // never on initial mount so a distant district is never preselected as a destination.
  React.useEffect(() => {
    const isGoogle = geography.selectedGovernorateId.startsWith('google:');
    if (isGoogle && geography.selectedDistrict?.anchor) {
      pin.setDestinationPinLocation(geography.selectedDistrict.anchor);
    }
    pin.setIsDestinationPinMoving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geography.selectedDistrict?.anchor, geography.selectedGovernorateId]);

  const [isCaptainScanPreviewActive, setIsCaptainScanPreviewActive] = React.useState(false);
  const profileFallbackLocation = geography.profileDistrict?.anchor || geography.selectedDistrict?.anchor || riderLocation;
  const selectedDestinationCoords = pin.destinationPinLocation;

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
  const isMapPoint = Boolean(
    !geography.draftDestinationId
    || geography.selectedDistrict?.id.startsWith('map:')
  );
  const hasMovedPinOffDistrict = Boolean(
    selectedDestinationCoords
    && (isMapPoint
      || !districtAnchor
      || Math.abs(selectedDestinationCoords.lat - districtAnchor.lat) > 0.0005
      || Math.abs(selectedDestinationCoords.lng - districtAnchor.lng) > 0.0005),
  );
  const { label: pinnedPlaceLabel, isResolving: isResolvingPinnedPlace } = usePinnedPlaceLabel(
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
    riderLocation,
  });
  const clipboard = useClipboardLocationImport({
    geography,
    setDestinationSearchQuery: search.setDestinationSearchQuery,
    setDestinationSearchResults: search.setDestinationSearchResults,
    setDestinationPinLocation: pin.setDestinationPinLocation,
    setDestinationFlyToTarget: pin.setDestinationFlyToTarget,
    setIsDestinationPinMoving: pin.setIsDestinationPinMoving,
    setIsCaptainScanPreviewActive,
    riderLocation,
  });
  const selectionHandlers = useDestinationSelectionHandlers({
    geography,
    pin,
    search,
    clipboard,
    setIsCaptainScanPreviewActive,
  });

  return {
    pin: wrappedPin,
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
    isResolvingPinnedPlace,
  };
}
