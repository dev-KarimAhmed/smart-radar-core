import React from 'react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { DistrictOption } from '../services/rider-destination-normalizers';

interface CountryNameConfig {
  name_ar?: string | null;
  name_en?: string | null;
}

/**
 * Builds an area-scoped Google Maps search query from the typed destination
 * text and opens it in a new tab. The rider finds the exact spot in Google
 * Maps, copies its share link, then brings it back via the clipboard-import
 * flow (`useClipboardLocationImport`).
 */
export function useDestinationMapPicker(params: {
  language: AppLanguage;
  countryConfig: CountryNameConfig | null;
  selectedDistrict: DistrictOption | null;
  destinationSearchQuery: string;
  setDestinationSearchResults: (results: []) => void;
  setDestinationSearchStatus: (status: 'idle' | 'selected') => void;
}) {
  const {
    language,
    countryConfig,
    selectedDistrict,
    destinationSearchQuery,
    setDestinationSearchResults,
    setDestinationSearchStatus,
  } = params;
  const isArabic = language === 'ar';

  const handleOpenGoogleMapsSearch = React.useCallback(() => {
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');

    const queryParts = [
      destinationSearchQuery.trim(),
      isArabic ? selectedDistrict?.districtAr || selectedDistrict?.districtEn : selectedDistrict?.districtEn || selectedDistrict?.districtAr,
      isArabic ? selectedDistrict?.governorateAr || selectedDistrict?.governorateEn : selectedDistrict?.governorateEn || selectedDistrict?.governorateAr,
      isArabic ? countryConfig?.name_ar || countryConfig?.name_en : countryConfig?.name_en || countryConfig?.name_ar,
    ].filter(Boolean);
    const query = queryParts.join(', ') || destinationSearchQuery.trim();
    if (!query) return;

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  }, [countryConfig, destinationSearchQuery, isArabic, selectedDistrict, setDestinationSearchResults, setDestinationSearchStatus]);

  return { handleOpenGoogleMapsSearch };
}
