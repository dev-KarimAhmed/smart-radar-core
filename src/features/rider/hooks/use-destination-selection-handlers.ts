import React from 'react';
import type { useDestinationGeographyData } from './use-destination-geography-data';
import type { useDestinationPin } from './use-destination-pin';
import type { useDestinationTextSearch } from './use-destination-text-search';
import type { useClipboardLocationImport } from './use-clipboard-location-import';

/**
 * The governorate/district `<Select>` change handlers and the search-box
 * `onChange` handler all reset a similar cross-cutting slice of destination
 * state — kept together here since none of them belongs to any single hook.
 */
export function useDestinationSelectionHandlers(params: {
  geography: ReturnType<typeof useDestinationGeographyData>;
  pin: ReturnType<typeof useDestinationPin>;
  search: ReturnType<typeof useDestinationTextSearch>;
  clipboard: ReturnType<typeof useClipboardLocationImport>;
  setIsCaptainScanPreviewActive: (active: boolean) => void;
}) {
  const { geography, pin, search, clipboard, setIsCaptainScanPreviewActive } = params;

  const onGovernorateChange = React.useCallback((governorateId: string) => {
    clipboard.clearExternalLocationContext();
    geography.setSelectedGovernorateId(governorateId);
    geography.setDraftDestinationId('');
    pin.setDestinationPinLocation(null);
    pin.setDestinationFlyToTarget(null);
    search.reset();
    setIsCaptainScanPreviewActive(false);
  }, [clipboard, geography, pin, search, setIsCaptainScanPreviewActive]);

  const onDistrictChange = React.useCallback((districtId: string) => {
    clipboard.clearExternalLocationContext();
    geography.setDraftDestinationId(districtId);
    const district = geography.destinationDistricts.find((item) => item.id === districtId);
    pin.setDestinationPinLocation(null);
    pin.setDestinationFlyToTarget(district?.anchor || null);
    search.reset();
    setIsCaptainScanPreviewActive(false);
  }, [clipboard, geography, pin, search, setIsCaptainScanPreviewActive]);

  const onSearchQueryChange = React.useCallback((value: string) => {
    clipboard.clearExternalLocationContext();
    search.setDestinationSearchQuery(value);
    search.setDestinationSearchResults([]);
    search.setDestinationSearchStatus('idle');
    clipboard.reset();
    setIsCaptainScanPreviewActive(false);
  }, [clipboard, search, setIsCaptainScanPreviewActive]);

  return { onGovernorateChange, onDistrictChange, onSearchQueryChange };
}
