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

async function readClipboardLocationText() {
  const plainText = await navigator.clipboard.readText();
  if (!navigator.clipboard.read) return plainText;

  try {
    const items = await navigator.clipboard.read();
    const richText = await Promise.all(
      items.flatMap((item) =>
        item.types
          .filter((type) => type === 'text/plain' || type === 'text/html')
          .map(async (type) => {
            try {
              return await (await item.getType(type)).text();
            } catch {
              return '';
            }
          }),
      ),
    );

    return [plainText, ...richText].filter(Boolean).join('\n');
  } catch {
    return plainText;
  }
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
    // Google's own name for the pin (e.g. "El-Gamaleya, El Gamaliya, Cairo Governorate") is
    // what the place is actually called — the first, most specific segment of it wins over
    // Nominatim's reverse-geocoded neighbourhood/city, which names the administrative area
    // the point happens to fall inside and can legitimately be a different, less-recognised
    // name for the same spot (a real example: Nominatim called an El-Gamaleya pin "المنصورية"
    // — a real but different neighbourhood nearby). Right but in English beats wrong in
    // Arabic; only a bare coordinate link with no name falls back to Nominatim's classification.
    const primaryPlaceName = placeName?.split(',')[0]?.trim() || null;
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

  const handleConfirmClipboardLocation = React.useCallback(async () => {
    if (!navigator.clipboard?.readText) {
      toast({
        variant: 'destructive',
        title: locationCopy('err_invalid_clipboard_maps_link'),
      });
      return;
    }

    setIsReadingClipboardLocation(true);
    setIsCaptainScanPreviewActive(false);
    try {
      const clipboardText = await readClipboardLocationText();
      const result = await resolveClipboardMapLocation(clipboardText);
      applyClipboardLocation(result.resolvedUrl, result.location, result.geography);

      // The coordinate and the place name in the same link point to different places. The
      // pin is still applied — the rider may well have meant this exact spot — but they are
      // told, because the alternative is silently pricing a trip to the wrong destination.
      if (result.placeNameCheck?.isMismatch) {
        toast({
          variant: 'destructive',
          title: locationCopy('warn_place_name_mismatch_title'),
          description: locationCopy('warn_place_name_mismatch_body', {
            place: result.placeNameCheck.placeName,
            km: Math.round(result.placeNameCheck.distanceKm),
          }),
        });
      }
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
