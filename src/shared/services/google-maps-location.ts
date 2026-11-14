import {
  ParsedMapLocation,
  ResolvedLocationGeography,
  PlaceNameCheck,
  ResolvedClipboardMapLocation,
  FetchLike,
  ClipboardMapLocationError,
  isValidLocation,
  safeDecodeURIComponent,
} from './maps/maps-types';
import {
  PLUS_CODE_ALPHABET,
  decodePlusCode,
  recoverNearestPlusCode,
  extractPlusCode,
  resolvePlusCodeLocation,
} from './maps/plus-code-resolver';
import {
  parseOpenStreetMapLocation,
  isOpenStreetMapLink,
  extractOpenStreetMapUrl,
  normalizeOpenStreetMapUrl,
} from './maps/osm-location-parser';
import {
  isInvalidPlaceName,
  extractGoogleMapsPlaceName,
  isShortGoogleMapsLink,
  isGoogleMapsLink,
  isMapsLink,
  sanitizeGoogleMapsUrl,
  extractGoogleMapsUrl,
  normalizeGoogleMapsUrl,
} from './maps/maps-url-utils';
import {
  parseGoogleMapsLocation,
  looksLikeGoogleMapsLocation,
} from './maps/google-maps-parser';

export type {
  ParsedMapLocation,
  ResolvedLocationGeography,
  PlaceNameCheck,
  ResolvedClipboardMapLocation,
};
export {
  ClipboardMapLocationError,
  PLUS_CODE_ALPHABET,
  decodePlusCode,
  recoverNearestPlusCode,
  extractPlusCode,
  resolvePlusCodeLocation,
  parseOpenStreetMapLocation,
  isOpenStreetMapLink,
  isInvalidPlaceName,
  extractGoogleMapsPlaceName,
  isShortGoogleMapsLink,
  isGoogleMapsLink,
  isMapsLink,
  sanitizeGoogleMapsUrl,
  parseGoogleMapsLocation,
};

export async function resolveClipboardMapLocation(
  rawValue: string,
  fetcher: FetchLike = fetch,
  referenceLocation?: ParsedMapLocation,
): Promise<ResolvedClipboardMapLocation> {
  const openStreetMapValue = extractOpenStreetMapUrl(rawValue);
  if (openStreetMapValue && isOpenStreetMapLink(openStreetMapValue)) {
    const location = parseOpenStreetMapLocation(openStreetMapValue);
    if (!location) throw new ClipboardMapLocationError('COORDINATES_NOT_FOUND');
    return { location, resolvedUrl: openStreetMapValue };
  }

  // Check if rawValue contains a standalone Plus Code or Plus Code with address text
  const plusLocation = resolvePlusCodeLocation(rawValue, referenceLocation);

  const clipboardValue = extractGoogleMapsUrl(rawValue);
  if (!clipboardValue || (!looksLikeGoogleMapsLocation(clipboardValue) && !plusLocation)) {
    throw new ClipboardMapLocationError('INVALID_MAPS_LINK');
  }

  const directLocation = plusLocation || parseGoogleMapsLocation(clipboardValue, referenceLocation);
  const queryParams = new URLSearchParams({ url: clipboardValue });
  if (referenceLocation && isValidLocation(referenceLocation.lat, referenceLocation.lng)) {
    queryParams.set('lat', String(referenceLocation.lat));
    queryParams.set('lng', String(referenceLocation.lng));
  }

  let response: Response;
  try {
    response = await fetcher(`/api/maps/resolve?${queryParams.toString()}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    if (directLocation) {
      return { location: directLocation, resolvedUrl: clipboardValue };
    }
    throw new ClipboardMapLocationError('RESOLUTION_FAILED');
  }

  if (!response.ok) {
    if (directLocation) {
      return { location: directLocation, resolvedUrl: clipboardValue };
    }
    throw new ClipboardMapLocationError(
      response.status === 422 ? 'COORDINATES_NOT_FOUND' : 'RESOLUTION_FAILED',
    );
  }

  const payload = (await response.json()) as {
    resolvedUrl?: unknown;
    location?: { lat?: unknown; lng?: unknown };
    geography?: ResolvedLocationGeography;
    placeNameCheck?: PlaceNameCheck | null;
  };
  const resolvedUrl = typeof payload.resolvedUrl === 'string' ? payload.resolvedUrl : clipboardValue;
  const lat = Number(payload.location?.lat);
  const lng = Number(payload.location?.lng);
  const location = isValidLocation(lat, lng)
    ? { lat, lng }
    : directLocation || parseGoogleMapsLocation(resolvedUrl, referenceLocation);

  if (!location) {
    throw new ClipboardMapLocationError('COORDINATES_NOT_FOUND');
  }

  return {
    location,
    resolvedUrl,
    geography: payload.geography,
    placeNameCheck: payload.placeNameCheck ?? undefined,
  };
}
