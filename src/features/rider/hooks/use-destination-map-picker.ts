import React from 'react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { DistrictOption } from '../services/rider-destination-normalizers';
import type { RiderLocation } from '../components/rider-map';

interface CountryNameConfig {
  name_ar?: string | null;
  name_en?: string | null;
}

function isValidCoord(val?: number) {
  return typeof val === 'number' && Number.isFinite(val) && val !== 0;
}

/**
 * Builds an area-scoped Google Maps search query from the typed destination
 * text and opens it in a new tab. When no search text is typed, opens Google
 * Maps directly centered on the rider's actual GPS location rather than a distant default.
 */
export function useDestinationMapPicker(params: {
  language: AppLanguage;
  countryConfig: CountryNameConfig | null;
  selectedDistrict: DistrictOption | null;
  destinationSearchQuery: string;
  setDestinationSearchResults: (results: []) => void;
  setDestinationSearchStatus: (status: 'idle' | 'selected') => void;
  riderLocation?: RiderLocation;
}) {
  const {
    language,
    countryConfig,
    selectedDistrict,
    destinationSearchQuery,
    setDestinationSearchResults,
    setDestinationSearchStatus,
    riderLocation,
  } = params;
  const isArabic = language === 'ar';

  const handleOpenGoogleMapsSearch = React.useCallback(() => {
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');

    const trimmedQuery = destinationSearchQuery.trim();
    if (trimmedQuery) {
      const queryParts = [
        trimmedQuery,
        isArabic ? selectedDistrict?.districtAr || selectedDistrict?.districtEn : selectedDistrict?.districtEn || selectedDistrict?.districtAr,
        isArabic ? selectedDistrict?.governorateAr || selectedDistrict?.governorateEn : selectedDistrict?.governorateEn || selectedDistrict?.governorateAr,
        isArabic ? countryConfig?.name_ar || countryConfig?.name_en : countryConfig?.name_en || countryConfig?.name_ar,
      ].filter(Boolean);
      const query = queryParts.join(', ') || trimmedQuery;
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    // When no search query is typed, open Google Maps centered on the rider's actual GPS location
    if (riderLocation && isValidCoord(riderLocation.lat) && isValidCoord(riderLocation.lng)) {
      window.open(`https://www.google.com/maps/@${riderLocation.lat},${riderLocation.lng},16z`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (selectedDistrict) {
      const queryParts = [
        isArabic ? selectedDistrict.districtAr || selectedDistrict.districtEn : selectedDistrict.districtEn || selectedDistrict.districtAr,
        isArabic ? selectedDistrict.governorateAr || selectedDistrict.governorateEn : selectedDistrict.governorateEn || selectedDistrict.governorateAr,
        isArabic ? countryConfig?.name_ar || countryConfig?.name_en : countryConfig?.name_en || countryConfig?.name_ar,
      ].filter(Boolean);
      const query = queryParts.join(', ');
      if (query) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer');
  }, [countryConfig, destinationSearchQuery, isArabic, riderLocation, selectedDistrict, setDestinationSearchResults, setDestinationSearchStatus]);

  return { handleOpenGoogleMapsSearch };
}
