import React from 'react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { deriveCountryIsoCode, searchDestinationPlaces, type DestinationSearchMatch } from '@/shared/services/destination-search';
import type { DistrictOption } from '../services/rider-destination-normalizers';
import type { RiderLocation } from '../components/rider-map';

interface CountryNameConfig {
  name_ar?: string | null;
  name_en?: string | null;
}

export type DestinationSearchStatus = 'idle' | 'searching' | 'empty' | 'error' | 'selected';

/**
 * Owns the typed destination search box (the dropdown-results flow, distinct
 * from the map-picker dialog's own search). Setters into the shared
 * destination-pin state and the captain-scan preview flag are injected so
 * this hook doesn't need to know about those other concerns beyond calling
 * their setters.
 */
export function useDestinationTextSearch(params: {
  language: AppLanguage;
  countryConfig: CountryNameConfig | null;
  selectedGovernorateId: string;
  selectedDistrict: DistrictOption | null;
  profileFallbackLocation: RiderLocation;
  setDestinationPinLocation: (location: RiderLocation) => void;
  setDestinationFlyToTarget: (location: RiderLocation | null) => void;
  setIsDestinationPinMoving: (moving: boolean) => void;
  setIsCaptainScanPreviewActive: (active: boolean) => void;
}) {
  const {
    language,
    countryConfig,
    selectedGovernorateId,
    selectedDistrict,
    profileFallbackLocation,
    setDestinationPinLocation,
    setDestinationFlyToTarget,
    setIsDestinationPinMoving,
    setIsCaptainScanPreviewActive,
  } = params;

  const [destinationSearchQuery, setDestinationSearchQuery] = React.useState('');
  const [destinationSearchResults, setDestinationSearchResults] = React.useState<DestinationSearchMatch[]>([]);
  const [destinationSearchStatus, setDestinationSearchStatus] = React.useState<DestinationSearchStatus>('idle');
  const destinationSearchAbortRef = React.useRef<AbortController | null>(null);
  const destinationSearchCacheRef = React.useRef(new Map<string, DestinationSearchMatch[]>());

  React.useEffect(() => () => {
    destinationSearchAbortRef.current?.abort();
  }, []);

  const handleDestinationSearch = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = destinationSearchQuery.trim();
    if (query.length < 2) {
      setDestinationSearchResults([]);
      setDestinationSearchStatus('empty');
      return;
    }

    const cacheKey = `${language}:${selectedGovernorateId}:${selectedDistrict?.id || ''}:${query.toLocaleLowerCase()}`;
    const cachedResults = destinationSearchCacheRef.current.get(cacheKey);
    if (cachedResults) {
      setDestinationSearchResults(cachedResults);
      setDestinationSearchStatus(cachedResults.length ? 'idle' : 'empty');
      return;
    }

    destinationSearchAbortRef.current?.abort();
    const controller = new AbortController();
    destinationSearchAbortRef.current = controller;
    setDestinationSearchStatus('searching');
    setDestinationSearchResults([]);

    try {
      const results = await searchDestinationPlaces(query, {
        language,
        countryIsoCode: deriveCountryIsoCode(countryConfig?.name_ar, countryConfig?.name_en),
        biasLocation: selectedDistrict?.anchor || profileFallbackLocation,
      }, { limit: 5, signal: controller.signal });

      destinationSearchCacheRef.current.set(cacheKey, results);
      setDestinationSearchResults(results);
      setDestinationSearchStatus(results.length ? 'idle' : 'empty');
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      setDestinationSearchStatus('error');
    }
  }, [
    countryConfig?.name_ar,
    countryConfig?.name_en,
    destinationSearchQuery,
    language,
    profileFallbackLocation,
    selectedDistrict,
    selectedGovernorateId,
  ]);

  const handleDestinationSearchResult = React.useCallback((result: DestinationSearchMatch) => {
    setDestinationSearchQuery(result.label);
    setDestinationSearchResults([]);
    setDestinationPinLocation(result.location);
    setDestinationFlyToTarget(result.location);
    setIsDestinationPinMoving(false);
    setDestinationSearchStatus('selected');
    setIsCaptainScanPreviewActive(false);
  }, [setDestinationFlyToTarget, setDestinationPinLocation, setIsCaptainScanPreviewActive, setIsDestinationPinMoving]);

  const reset = React.useCallback(() => {
    destinationSearchAbortRef.current?.abort();
    destinationSearchAbortRef.current = null;
    destinationSearchCacheRef.current.clear();
    setDestinationSearchQuery('');
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');
  }, []);

  return {
    destinationSearchQuery,
    setDestinationSearchQuery,
    destinationSearchResults,
    setDestinationSearchResults,
    destinationSearchStatus,
    setDestinationSearchStatus,
    handleDestinationSearch,
    handleDestinationSearchResult,
    reset,
  };
}
