export interface ParsedMapLocation {
  lat: number;
  lng: number;
}

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

export const PLUS_CODE_ALPHABET = '23456789CFGHJMPQRVWX';

export function decodePlusCode(code: string): ParsedMapLocation | null {
  const clean = code.trim().toUpperCase().replace('+', '');
  let lat = -90;
  let lng = -180;
  let latRes = 20;
  let lngRes = 20;
  const len = Math.min(clean.length, 10);
  for (let i = 0; i < len; i += 2) {
    const r = PLUS_CODE_ALPHABET.indexOf(clean[i]);
    const c = PLUS_CODE_ALPHABET.indexOf(clean[i + 1]);
    if (r === -1 || c === -1) return null;
    lat += r * latRes;
    lng += c * lngRes;
    latRes /= 20;
    lngRes /= 20;
  }
  const resultLat = lat + latRes * 10;
  const resultLng = lng + lngRes * 10;
  return isValidLocation(resultLat, resultLng) ? { lat: resultLat, lng: resultLng } : null;
}

export function recoverNearestPlusCode(
  shortCode: string,
  refLat: number,
  refLng: number,
): ParsedMapLocation | null {
  const clean = shortCode.trim().toUpperCase();
  const plusIdx = clean.indexOf('+');
  if (plusIdx === -1) return null;
  if (plusIdx >= 8) {
    return decodePlusCode(clean);
  }
  const prefixLen = 8 - plusIdx;
  if (prefixLen !== 4 && prefixLen !== 6 && prefixLen !== 2) return null;

  const step = prefixLen === 4 ? 1.0 : prefixLen === 6 ? 0.05 : 20.0;
  let best: ParsedMapLocation | null = null;
  let bestDist = Infinity;

  for (let dLat = -1; dLat <= 1; dLat++) {
    for (let dLng = -1; dLng <= 1; dLng++) {
      const candLat = refLat + dLat * step;
      const candLng = refLng + dLng * step;
      let cLat = candLat + 90;
      let cLng = candLng + 180;
      let prefix = '';
      let gLat = 20;
      let gLng = 20;
      for (let i = 0; i < prefixLen / 2; i++) {
        const lDigit = Math.floor(cLat / gLat);
        const lnDigit = Math.floor(cLng / gLng);
        cLat -= lDigit * gLat;
        cLng -= lnDigit * gLng;
        if (lDigit < 0 || lDigit >= 20 || lnDigit < 0 || lnDigit >= 20) continue;
        prefix += PLUS_CODE_ALPHABET[lDigit] + PLUS_CODE_ALPHABET[lnDigit];
        gLat /= 20;
        gLng /= 20;
      }
      if (prefix.length !== prefixLen) continue;
      const full = prefix + clean;
      const decoded = decodePlusCode(full);
      if (!decoded) continue;
      const dist = (decoded.lat - refLat) ** 2 + (decoded.lng - refLng) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = decoded;
      }
    }
  }
  return best;
}

export function extractPlusCode(text: string): string | null {
  const match = text.match(/\b([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4})\b/i);
  return match ? match[1].toUpperCase() : null;
}

export function resolvePlusCodeLocation(
  codeOrText: string,
  referenceLocation?: ParsedMapLocation,
): ParsedMapLocation | null {
  const code = extractPlusCode(codeOrText) || codeOrText.trim().toUpperCase();
  const plusIdx = code.indexOf('+');
  if (plusIdx === -1) return null;
  if (plusIdx >= 8) {
    return decodePlusCode(code);
  }
  if (referenceLocation && isValidLocation(referenceLocation.lat, referenceLocation.lng)) {
    return recoverNearestPlusCode(code, referenceLocation.lat, referenceLocation.lng);
  }
  return null;
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

  const payload = await response.json() as {
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
  const isDirectionsUrl = /\/maps\/dir\//i.test(text)
    || /[?&]daddr=/i.test(text)
    || /[?&]saddr=/i.test(text)
    || /[?&]dirflg=/i.test(text);

  // If camera coordinates are present in the URL, they serve as a reference for short Plus Codes
  const cameraMatch = text.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  const cameraCoords = cameraMatch && isValidLocation(Number(cameraMatch[1]), Number(cameraMatch[2]))
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
  // Note: `!1m3!1d{zoom}!2d{lng}!3d{lat}` is the map-framing viewport camera, NOT
  // a place pin. We must ignore `!1m3!1d` viewport matches so they don't hijack the location.
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
  // (where staticmap?center= is Google's GeoIP default for the caller server).
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

  // The loose decimal-pair pattern must ONLY run on short non-HTML strings (e.g. user input or a short URL).
  // Running this on an entire HTML document matches random numbers (like analytics or US datacenter IP coords).
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

export function parseOpenStreetMapLocation(value: string): ParsedMapLocation | null {
  const text = safeDecodeURIComponent(value.trim());

  try {
    const url = new URL(text);
    const mlatRaw = url.searchParams.get('mlat');
    const mlonRaw = url.searchParams.get('mlon');
    if (mlatRaw !== null && mlonRaw !== null) {
      const mlat = Number(mlatRaw);
      const mlon = Number(mlonRaw);
      if (isValidLocation(mlat, mlon)) return { lat: mlat, lng: mlon };
    }

    const hashMatch = url.hash.match(/map=-?\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
    if (hashMatch) {
      const lat = Number(hashMatch[1]);
      const lng = Number(hashMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }
  } catch {
    // Not a fully-qualified URL; fall through to the plain-text fragment match below.
  }

  const hashOnlyMatch = text.match(/map=-?\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
  if (hashOnlyMatch) {
    const lat = Number(hashOnlyMatch[1]);
    const lng = Number(hashOnlyMatch[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
  }

  return null;
}

export function isOpenStreetMapLink(value: string) {
  try {
    const hostname = new URL(normalizeOpenStreetMapUrl(value)).hostname.toLowerCase();
    return hostname === 'openstreetmap.org' || hostname === 'www.openstreetmap.org' || hostname === 'osm.org';
  } catch {
    return false;
  }
}

function extractOpenStreetMapUrl(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return '';

  const urlMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?(?:openstreetmap\.org|osm\.org)\/[^\s<>"']+/i,
  );
  return normalizeOpenStreetMapUrl((urlMatch?.[0] || '').replace(/[),.;]+$/, ''));
}

function normalizeOpenStreetMapUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:www\.)?(?:openstreetmap\.org|osm\.org)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function extractGoogleMapsPlaceName(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const placeMatch = url.pathname.match(/\/maps\/(?:place|search)\/([^/?#]+)/i);
    if (placeMatch?.[1]) return decodeGoogleMapsPathSegment(placeMatch[1]);

    // Directions links (`/maps/dir/{origin}/{waypoint...}/{destination}/@{viewCenter}/...`)
    // have no dedicated "place" segment \u2014 the destination's name is just the last
    // non-coordinate segment before the `@` viewport marker. Sharing a place via "Directions"
    // rather than "Share" produces exactly this shape, so without this the name (and every
    // other signal derived from it, like the plausibility cross-check) silently went missing
    // for a link that in fact names the destination right there in the URL.
    const dirMatch = url.pathname.match(/\/maps\/dir\/(.+?)(?:\/@|$)/i);
    if (dirMatch?.[1]) {
      const namedSegments = dirMatch[1].split('/').filter((segment) => segment && !isCoordinatePairSegment(segment));
      const lastNamedSegment = namedSegments[namedSegments.length - 1];
      if (lastNamedSegment) return decodeGoogleMapsPathSegment(lastNamedSegment);
    }

    const qParam = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('destination') || url.searchParams.get('daddr');
    if (qParam && !isCoordinatePairSegment(qParam)) {
      return decodeGoogleMapsPathSegment(qParam);
    }

    return null;
  } catch {
    return null;
  }
}

function isCoordinatePairSegment(segment: string) {
  return /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(segment);
}

function decodeGoogleMapsPathSegment(rawSegment: string) {
  let placeName = safeDecodeURIComponent(rawSegment.replace(/\+/g, ' '))
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060]/g, '')
    .trim();

  // Strip Plus Code anywhere in name (e.g. "XXJ5+99G ", "7CQG+25, ", "مقابر ... HRQ7+HGG ...")
  placeName = placeName
    .replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*[-–—,،]?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return placeName || null;
}

export function isShortGoogleMapsLink(value: string) {
  try {
    const hostname = new URL(normalizeGoogleMapsUrl(value)).hostname.toLowerCase();
    return hostname === 'maps.app.goo.gl' || hostname === 'goo.gl';
  } catch {
    return false;
  }
}

export function isGoogleMapsLink(value: string) {
  try {
    const hostname = new URL(normalizeGoogleMapsUrl(value)).hostname.toLowerCase();
    return (
      hostname === 'maps.app.goo.gl'
      || hostname === 'goo.gl'
      || hostname === 'google.com'
      || hostname.endsWith('.google.com')
    );
  } catch {
    return false;
  }
}

export function isMapsLink(value: string) {
  return isGoogleMapsLink(value) || isOpenStreetMapLink(value);
}

export function sanitizeGoogleMapsUrl(urlStr: string): string {
  try {
    const normalized = normalizeGoogleMapsUrl(urlStr);
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();

    // On short links (maps.app.goo.gl or goo.gl), ALL query params are mobile share tracking
    // (e.g. g_st=ac, g_st=ic, utm_*, feature=shared). The short token in the pathname
    // is all that identifies the place.
    if (hostname === 'maps.app.goo.gl' || hostname === 'goo.gl') {
      url.search = '';
      return url.toString();
    }

    // On full Google Maps links, remove tracking parameters while keeping place/navigation params:
    const trackingParams = [
      'g_st',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'feature',
      'si',
      'entry',
      'coh',
      'g_ep',
      'skid',
    ];
    for (const param of trackingParams) {
      url.searchParams.delete(param);
    }
    return url.toString();
  } catch {
    return urlStr
      .replace(/[?&]g_st=[^&#\s]+/gi, '')
      .replace(/[?&]utm_[a-z]+=[^&#\s]+/gi, '')
      .replace(/\?&/, '?')
      .replace(/[?&]$/, '');
  }
}

function looksLikeGoogleMapsLocation(value: string) {
  const normalized = normalizeGoogleMapsUrl(value).toLowerCase();
  if (!normalized) return false;

  return (
    isGoogleMapsLink(normalized) ||
    parseGoogleMapsLocation(normalized) !== null ||
    extractPlusCode(value) !== null
  );
}

function extractGoogleMapsUrl(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return '';

  const urlMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|google\.com)\/[^\s<>"']+/i,
  );
  return sanitizeGoogleMapsUrl(normalizeGoogleMapsUrl((urlMatch?.[0] || value).replace(/[),.;]+$/, '')));
}

function normalizeGoogleMapsUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|google\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isValidLocation(lat: number, lng: number) {
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && Math.abs(lat) <= 90
    && Math.abs(lng) <= 180
    // 0,0 is open water in the Gulf of Guinea. Every time it shows up here it is an unset
    // field or a stray regex match, never a destination — and the loose decimal-pair
    // pattern below can produce it from an unrelated pair of numbers in a URL.
    && !(lat === 0 && lng === 0);
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
