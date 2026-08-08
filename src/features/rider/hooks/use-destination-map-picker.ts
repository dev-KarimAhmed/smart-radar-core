import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { deriveCountryIsoCode, searchDestinationPlaces } from '@/shared/services/destination-search';
import type { DistrictOption } from '../services/rider-destination-normalizers';
import type { RiderLocation } from '../components/rider-map';

interface CountryNameConfig {
  name_ar?: string | null;
  name_en?: string | null;
}

/**
 * Owns the "search a place, then fine-tune it on an embedded map" dialog —
 * distinct from the typed destination-search dropdown. Setters into the
 * shared destination-pin state, the text-search box, and the captain-scan
 * preview flag are injected.
 */
export function useDestinationMapPicker(params: {
  language: AppLanguage;
  countryConfig: CountryNameConfig | null;
  selectedDistrict: DistrictOption | null;
  profileFallbackLocation: RiderLocation;
  destinationSearchQuery: string;
  setDestinationSearchResults: (results: []) => void;
  setDestinationSearchStatus: (status: 'idle' | 'selected') => void;
  setDestinationPinLocation: (location: RiderLocation) => void;
  setDestinationFlyToTarget: (location: RiderLocation | null) => void;
  setIsCaptainScanPreviewActive: (active: boolean) => void;
}) {
  const {
    language,
    countryConfig,
    selectedDistrict,
    profileFallbackLocation,
    destinationSearchQuery,
    setDestinationSearchResults,
    setDestinationSearchStatus,
    setDestinationPinLocation,
    setDestinationFlyToTarget,
    setIsCaptainScanPreviewActive,
  } = params;

  const { toast } = useToast();
  const locationCopy = useTranslations('location');
  const destinationSearchCopy = useTranslations('riderDestinationSearch');

  const [isMapPickerOpen, setIsMapPickerOpen] = React.useState(false);
  const [modalPinLocation, setModalPinLocation] = React.useState<RiderLocation | null>(null);
  const [isLoadingMapPreview, setIsLoadingMapPreview] = React.useState(false);
  const [modalSearchQuery, setModalSearchQuery] = React.useState('');
  const [isModalSearchLoading, setIsModalSearchLoading] = React.useState(false);

  const handleOpenGoogleMapsSearch = React.useCallback(async () => {
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');
    const query = destinationSearchQuery.trim();
    if (!query) return;

    setIsLoadingMapPreview(true);
    try {
      const [match] = await searchDestinationPlaces(query, {
        language,
        countryIsoCode: deriveCountryIsoCode(countryConfig?.name_ar, countryConfig?.name_en),
        biasLocation: selectedDistrict?.anchor || profileFallbackLocation,
      }, { limit: 1 });

      if (!match) {
        toast({
          variant: 'destructive',
          title: locationCopy('err_search_no_results'),
        });
        return;
      }

      setModalPinLocation(match.location);
      setIsMapPickerOpen(true);
    } catch {
      toast({
        variant: 'destructive',
        title: destinationSearchCopy('error'),
      });
    } finally {
      setIsLoadingMapPreview(false);
    }
  }, [
    countryConfig?.name_ar,
    countryConfig?.name_en,
    destinationSearchCopy,
    destinationSearchQuery,
    language,
    locationCopy,
    profileFallbackLocation,
    selectedDistrict?.anchor,
    setDestinationSearchResults,
    setDestinationSearchStatus,
    toast,
  ]);

  const handleCloseSearchMapEmbed = React.useCallback(() => {
    setIsMapPickerOpen(false);
    setModalSearchQuery('');
  }, []);

  const handleModalPinChange = React.useCallback((location: RiderLocation) => {
    setModalPinLocation(location);
  }, []);

  const handleModalMapSearch = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = modalSearchQuery.trim();
    if (query.length < 2) return;

    setIsModalSearchLoading(true);
    try {
      const [match] = await searchDestinationPlaces(query, {
        language,
        countryIsoCode: deriveCountryIsoCode(countryConfig?.name_ar, countryConfig?.name_en),
        biasLocation: modalPinLocation || selectedDistrict?.anchor || profileFallbackLocation,
      }, { limit: 1 });

      if (!match) {
        toast({
          variant: 'destructive',
          title: locationCopy('err_search_no_results'),
        });
        return;
      }

      setModalPinLocation(match.location);
    } catch {
      toast({
        variant: 'destructive',
        title: destinationSearchCopy('error'),
      });
    } finally {
      setIsModalSearchLoading(false);
    }
  }, [
    countryConfig?.name_ar,
    countryConfig?.name_en,
    destinationSearchCopy,
    language,
    locationCopy,
    modalPinLocation,
    modalSearchQuery,
    profileFallbackLocation,
    selectedDistrict?.anchor,
    toast,
  ]);

  const handleConfirmModalLocation = React.useCallback(() => {
    if (!modalPinLocation) return;
    setDestinationPinLocation(modalPinLocation);
    setDestinationFlyToTarget(modalPinLocation);
    setDestinationSearchStatus('selected');
    setIsCaptainScanPreviewActive(false);
    setIsMapPickerOpen(false);
  }, [modalPinLocation, setDestinationFlyToTarget, setDestinationPinLocation, setDestinationSearchStatus, setIsCaptainScanPreviewActive]);

  const handleCopyModalLocationLink = React.useCallback(async () => {
    if (!modalPinLocation) return;
    const link = `https://www.google.com/maps/place/${modalPinLocation.lat},${modalPinLocation.lng}/@${modalPinLocation.lat},${modalPinLocation.lng},17z`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: locationCopy('show_copied_link') });
    } catch {
      toast({
        variant: 'destructive',
        title: locationCopy('err_invalid_clipboard_maps_link'),
      });
    }
  }, [locationCopy, modalPinLocation, toast]);

  const reset = React.useCallback(() => {
    setIsMapPickerOpen(false);
    setModalPinLocation(null);
    setModalSearchQuery('');
  }, []);

  return {
    isMapPickerOpen,
    setIsMapPickerOpen,
    modalPinLocation,
    setModalPinLocation,
    isLoadingMapPreview,
    modalSearchQuery,
    setModalSearchQuery,
    isModalSearchLoading,
    handleOpenGoogleMapsSearch,
    handleCloseSearchMapEmbed,
    handleModalPinChange,
    handleModalMapSearch,
    handleConfirmModalLocation,
    handleCopyModalLocationLink,
    reset,
  };
}
