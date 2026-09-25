import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardMapLocationError,
  extractGoogleMapsPlaceName,
  resolveClipboardMapLocation,
  type ResolvedLocationGeography,
} from '@/shared/services/google-maps-location';
import { slugifyLocationPart, type DistrictOption, type GovernorateOption } from '../services/rider-destination-normalizers';
import type { useDestinationGeographyData } from './use-destination-geography-data';
import type { RiderLocation } from '../components/rider-map';

async function readClipboardLocationText(): Promise<string> {
  let plainText = '';
  try {
    if (navigator.clipboard?.readText) {
      plainText = await navigator.clipboard.readText();
    }
  } catch {
    plainText = '';
  }

  if (plainText && plainText.trim()) {
    return plainText.trim();
  }

  if (navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of ['text/plain', 'text/html']) {
          if (item.types.includes(type)) {
            try {
              const blob = await item.getType(type);
              const text = await blob.text();
              if (text && text.trim()) return text.trim();
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return '';
}

/**
 * Owns the "paste a Google Maps share link" import flow: reads the
 * clipboard, resolves it to exact coordinates, and splices a synthetic
 * "google:"-prefixed governorate/district into the geography hook's lists
 * (hence taking that hook's return value directly rather than a handful of
 * individual setters).
 *
 * Deliberately never matched against the database governorate/district
 * catalogue — that catalogue is coarse (a handful of districts per
 * governorate) and pasted links are precise pins, so snapping one to
 * "whichever known district happens to be nearest" silently substituted the
 * wrong place when the real one wasn't in the catalogue at all. The pasted
 * coordinates are always used exactly as given; only the label shown to the
 * rider comes from the link (or a reverse-geocode of its coordinates).
 */
export function useClipboardLocationImport(params: {
  geography: ReturnType<typeof useDestinationGeographyData>;
  setDestinationSearchQuery: (query: string) => void;
  setDestinationSearchResults: (results: []) => void;
  setDestinationPinLocation: (location: RiderLocation) => void;
  setDestinationFlyToTarget: (location: RiderLocation | null) => void;
  setIsDestinationPinMoving: (moving: boolean) => void;
  setIsCaptainScanPreviewActive: (active: boolean) => void;
}) {
  const {
    geography,
    setDestinationSearchQuery,
    setDestinationSearchResults,
    setDestinationPinLocation,
    setDestinationFlyToTarget,
    setIsDestinationPinMoving,
    setIsCaptainScanPreviewActive,
  } = params;

  const { toast } = useToast();
  const locationCopy = useTranslations('location');

  const [externalLocationUrl, setExternalLocationUrl] = React.useState('');
  const [isReadingClipboardLocation, setIsReadingClipboardLocation] = React.useState(false);

  const clearExternalLocationContext = React.useCallback(() => {
    geography.clearExternalEntries();
  }, [geography]);

  const applyClipboardLocation = React.useCallback((
    clipboardValue: string,
    parsedLocation: RiderLocation,
    resolvedGeography?: ResolvedLocationGeography,
  ) => {
    const placeName = extractGoogleMapsPlaceName(clipboardValue);
    const resolvedPlaceName = placeName || locationCopy('external_place_name');
    // Split on comma to get the primary name, but skip "Unnamed Road" or raw Plus Codes
    const rawSegments = (placeName || '')
      .replace(/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\s*[-–—,]?\s*/i, '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !/^unnamed\s+road/i.test(s));
    const cleanPrimaryName = rawSegments[0] || placeName?.split(',')[0]?.trim() || null;
    const primaryPlaceName = cleanPrimaryName?.replace(/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\s*[-–—,]?\s*/i, '').trim() || null;

    const governorate = resolvedGeography?.governorate || locationCopy('external_governorate');
    const district = primaryPlaceName || resolvedGeography?.district || resolvedGeography?.city || resolvedPlaceName;
    const externalGovernorateId = `google:${slugifyLocationPart(governorate)}`;
    const externalDistrictId = `google:${slugifyLocationPart(`${district}-${parsedLocation.lat}-${parsedLocation.lng}`)}`;
    const externalGovernorate: GovernorateOption = {
      id: externalGovernorateId,
      numericId: 0,
      nameAr: governorate,
      nameEn: governorate,
    };
    const externalDistrict: DistrictOption = {
      id: externalDistrictId,
      numericId: 0,
      governorateId: externalGovernorateId,
      governorateAr: governorate,
      governorateEn: governorate,
      districtAr: district,
      districtEn: district,
      anchor: parsedLocation,
      tortuosityFactor: 1.3,
    };

    setExternalLocationUrl(clipboardValue);
    geography.setExternalLocationContext({ governorate, district, placeName: resolvedPlaceName });
    geography.setDestinationGovernorates((current) => [
      externalGovernorate,
      ...current.filter((item) => !item.id.startsWith('google:')),
    ]);
    geography.setSelectedGovernorateId(externalGovernorateId);
    geography.setDestinationDistricts([externalDistrict]);
    geography.setDraftDestinationId(externalDistrictId);
    setDestinationSearchQuery(resolvedPlaceName);
    // Route distance/time are calculated by the shared road-route effect after
    // the exact clipboard coordinates become the selected destination.
    setDestinationSearchResults([]);
    setDestinationPinLocation(parsedLocation);
    setDestinationFlyToTarget(parsedLocation);
    setIsDestinationPinMoving(false);
    setIsCaptainScanPreviewActive(true);
  }, [geography, locationCopy, setDestinationFlyToTarget, setDestinationPinLocation, setDestinationSearchQuery, setDestinationSearchResults, setIsCaptainScanPreviewActive, setIsDestinationPinMoving]);

  const handleConfirmClipboardLocation = React.useCallback(async (overrideText?: string) => {
    setIsReadingClipboardLocation(true);
    setIsCaptainScanPreviewActive(false);
    try {
      let clipboardText = typeof overrideText === 'string' && overrideText.trim() ? overrideText.trim() : '';
      if (!clipboardText) {
        clipboardText = await readClipboardLocationText();
      }
      if (!clipboardText) {
        toast({
          variant: 'destructive',
          title: locationCopy('err_invalid_clipboard_maps_link'),
        });
        return;
      }

      const result = await resolveClipboardMapLocation(clipboardText);
      applyClipboardLocation(result.resolvedUrl, result.location, result.geography);

    } catch (error) {
      const errorKey =
        error instanceof ClipboardMapLocationError && error.code === 'COORDINATES_NOT_FOUND'
          ? 'err_no_coords_found'
          : error instanceof ClipboardMapLocationError && error.code === 'RESOLUTION_FAILED'
            ? 'err_short_maps_link_needs_expanded_url'
            : 'err_invalid_clipboard_maps_link';
      toast({
        variant: 'destructive',
        title: locationCopy(errorKey),
      });
    } finally {
      setIsReadingClipboardLocation(false);
    }
  }, [applyClipboardLocation, locationCopy, setIsCaptainScanPreviewActive, toast]);

  const reset = React.useCallback(() => {
    setExternalLocationUrl('');
    setIsReadingClipboardLocation(false);
  }, []);

  return {
    externalLocationUrl,
    isReadingClipboardLocation,
    clearExternalLocationContext,
    handleConfirmClipboardLocation,
    reset,
  };
}
