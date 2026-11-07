import {
  type ParsedMapLocation,
  isValidLocation,
  safeDecodeURIComponent,
  PLUS_CODE_ALPHABET,
  decodePlusCode,
  recoverNearestPlusCode,
  extractPlusCode,
  resolvePlusCodeLocation,
} from './google-maps-plus-codes';
import {
  parseOpenStreetMapLocation,
  isOpenStreetMapLink,
  extractOpenStreetMapUrl,
  normalizeOpenStreetMapUrl,
  isInvalidPlaceName,
  extractGoogleMapsPlaceName,
  isCoordinatePairSegment,
  decodeGoogleMapsPathSegment,
  isShortGoogleMapsLink,
  isGoogleMapsLink,
  isMapsLink,
  sanitizeGoogleMapsUrl,
  looksLikeGoogleMapsLocation,
  extractGoogleMapsUrl,
  normalizeGoogleMapsUrl,
} from './google-maps-place-utils';

export type { ParsedMapLocation };
export {
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
};

export interface ResolvedLocationGeography {
  governorate?: string | null;
  district?: string | null;
  city?: string | null;
  governorateCandidates?: string[];
  districtCandidates?: string[];
}

/**
 * Result of comparing the extracted coordinate against where the link's place NAME geocodes
 * to. Absent means "could not be checked" — never "checked and fine".
 */
export interface PlaceNameCheck {
  placeName: string;
  geocodedLocation: ParsedMapLocation;
  distanceKm: number;
  isMismatch: boolean;
}

export interface ResolvedClipboardMapLocation {
  location: ParsedMapLocation;
  resolvedUrl: string;
  geography?: ResolvedLocationGeography;
  placeNameCheck?: PlaceNameCheck;
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class ClipboardMapLocationError extends Error {
  constructor(
    public readonly code: 'INVALID_MAPS_LINK' | 'COORDINATES_NOT_FOUND' | 'RESOLUTION_FAILED',
  ) {
    super(code);
    this.name = 'ClipboardMapLocationError';
  }
}

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
  if (!clipboardValue || (!looksLikeGoogleMapsLocation(clipboardValue, parseGoogleMapsLocation) && !plusLocation)) {
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

export function parseGoogleMapsLocation(
  value: string,
  referenceLocation?: ParsedMapLocation,
): ParsedMapLocation | null {
  // Google embeds the place preview URL inside HTML with `%21`-encoded
  // exclamation markers and `%2C`-encoded commas. Decode those markers even when
  // the full HTML cannot be URI-decoded because it contains unrelated percent-encoded content.
  const trimmed = value.trim();
  let text = safeDecodeURIComponent(trimmed);
  if (text === trimmed) {
    text = text
      .replace(/%21/gi, '!')
      .replace(/%2c/gi, ',')
      .replace(/%2f/gi, '/')
      .replace(/%3a/gi, ':')
      .replace(/%3d/gi, '=')
      .replace(/%26/gi, '&')
      .replace(/%2b/gi, '+');
  } else {
    text = text.replace(/%21/gi, '!').replace(/%2c/gi, ',');
  }

  const isHtml = /<html|<!doctype|<body|<meta\s+/i.test(text);
  const isDirectionsUrl =
    /\/maps\/dir\//i.test(text) ||
    /[?&]daddr=/i.test(text) ||
    /[?&]saddr=/i.test(text) ||
    /[?&]dirflg=/i.test(text);

  // If camera coordinates are present in the URL, they serve as a reference for short Plus Codes
  const cameraMatch = text.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  const cameraCoords =
    cameraMatch && isValidLocation(Number(cameraMatch[1]), Number(cameraMatch[2]))
      ? { lat: Number(cameraMatch[1]), lng: Number(cameraMatch[2]) }
      : null;
  const effectiveRefLocation = referenceLocation || cameraCoords || undefined;

  // Directions URLs (`/maps/dir/{origin}/{destination}/...` or `?saddr=...&daddr=...`)
  // Waypoints are ordered from origin to destination. The destination waypoint is the
  // LAST marker in the payload.
  if (isDirectionsUrl) {
    const allWaypoints = [...text.matchAll(/!2m2!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g)];
    if (allWaypoints.length > 0) {
      const lastMatch = allWaypoints[allWaypoints.length - 1];
      const lng = Number(lastMatch[1]);
      const lat = Number(lastMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }

    // Directions HTML payloads often embed origin and destination as !3d{lat}!4d{lng} markers.
    // The LAST marker is the destination.
    const all3d4d = [...text.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
    if (all3d4d.length > 1) {
      const lastMatch = all3d4d[all3d4d.length - 1];
      const lat = Number(lastMatch[1]);
      const lng = Number(lastMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }

    // Explicit numeric coordinates in destination query parameter (daddr or destination).
    // Note: NEVER match saddr (start address) as the trip destination.
    const destParamMatch = text.match(/[?&](?:destination|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (destParamMatch) {
      const lat = Number(destParamMatch[1]);
      const lng = Number(destParamMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }

    // Check if the destination path segment in /maps/dir/{origin}/{destination}/... is coordinates or Plus Code
    const dirMatch = text.match(/\/maps\/dir\/(.+?)(?:\/@|$)/i);
    if (dirMatch?.[1]) {
      const segments = dirMatch[1].split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment) {
        // Explicit coordinates in destination segment: e.g. /maps/dir/.../26.5889,31.8137/@...
        const coordMatch = lastSegment.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
        if (coordMatch) {
          const lat = Number(coordMatch[1]);
          const lng = Number(coordMatch[2]);
          if (isValidLocation(lat, lng)) return { lat, lng };
        }
        // Plus code in destination segment: e.g. HRQ7+HGG or 7GRHHRQ7+HGG
        const plusCode = extractPlusCode(lastSegment);
        if (plusCode) {
          const resolved = resolvePlusCodeLocation(plusCode, effectiveRefLocation);
          if (resolved) return resolved;
        }
      }
    }

    // Plus code anywhere in the directions URL text
    const plusCode = extractPlusCode(text);
    if (plusCode) {
      const resolved = resolvePlusCodeLocation(plusCode, effectiveRefLocation);
      if (resolved) return resolved;
    }

    // CRITICAL: A directions URL uses `@lat,lng` ONLY as the map-framing viewport camera,
    // and `saddr=` as the start point. Under NO circumstances should `@lat,lng` or `saddr`
    // be returned as the destination of a directions trip.
    return null;
  }

  // In HTML documents with multiple !3d!4d markers (such as directions pages with origin and destination),
  // the LAST marker represents the destination.
  if (isHtml) {
    const all3d4d = [...text.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
    if (all3d4d.length > 1) {
      const lastMatch = all3d4d[all3d4d.length - 1];
      const lat = Number(lastMatch[1]);
      const lng = Number(lastMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }
  }

  // Non-directions URLs: canonical place markers in a /maps/place data= payload
  const patterns = [
    // `!8m2!3d{lat}!4d{lng}` — the canonical place marker in a /maps/place data= payload.
    /!8m2!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    // Same marker without the !8m2 wrapper.
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    // Coordinates the URL states outright as the target.
    /(?:[?&](?:q|query|destination|daddr)=)(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
  }

  // Check Plus Code in non-directions URL
  const placePlusCode = extractPlusCode(text);
  if (placePlusCode) {
    const resolved = resolvePlusCodeLocation(placePlusCode, effectiveRefLocation);
    if (resolved) return resolved;
  }

  // Google place pages and short-link redirects often embed the map center as
  // longitude first (`!2d{lng}!3d{lat}`) inside the page bootstrap payload.
  const placePayloadMatches = text.matchAll(
    /(!1m3!1d[\d.]+)?!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/g,
  );
  for (const m of placePayloadMatches) {
    if (!m[1]) {
      const lng = Number(m[2]);
      const lat = Number(m[3]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }
  }

  // Only allow URL parameters like ?center= or camera @lat,lng on URL/plain text, never in HTML documents
  if (!isHtml) {
    const fallbackPatterns = [
      /(?:[?&](?:ll|center)=)(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
      /(?:[?&](?:ll|center)=)(-?\d+(?:\.\d+)?)(?:%2c|%2C|,|\s*)(-?\d+(?:\.\d+)?)/i,
      /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    ];
    for (const pattern of fallbackPatterns) {
      const match = text.match(pattern);
      if (!match) continue;
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }
  }

  // The loose decimal-pair pattern must ONLY run on short non-HTML strings
  if (!isHtml && text.length < 500) {
    const looseMatch = text.match(/(^|[^\d.-])(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)([^\d.]|$)/);
    if (looseMatch) {
      const lat = Number(looseMatch[2]);
      const lng = Number(looseMatch[3]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }
  }

  return null;
}
