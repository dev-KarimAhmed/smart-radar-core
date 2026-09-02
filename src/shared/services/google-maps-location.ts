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

export interface ResolvedClipboardMapLocation {
  location: ParsedMapLocation;
  resolvedUrl: string;
  geography?: ResolvedLocationGeography;
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
): Promise<ResolvedClipboardMapLocation> {
  const openStreetMapValue = extractOpenStreetMapUrl(rawValue);
  if (openStreetMapValue && isOpenStreetMapLink(openStreetMapValue)) {
    const location = parseOpenStreetMapLocation(openStreetMapValue);
    if (!location) throw new ClipboardMapLocationError('COORDINATES_NOT_FOUND');
    return { location, resolvedUrl: openStreetMapValue };
  }

  const clipboardValue = extractGoogleMapsUrl(rawValue);
  if (!clipboardValue || !looksLikeGoogleMapsLocation(clipboardValue)) {
    throw new ClipboardMapLocationError('INVALID_MAPS_LINK');
  }

  const directLocation = parseGoogleMapsLocation(clipboardValue);
  let response: Response;
  try {
    response = await fetcher(`/api/maps/resolve?url=${encodeURIComponent(clipboardValue)}`, {
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
  };
  const resolvedUrl = typeof payload.resolvedUrl === 'string' ? payload.resolvedUrl : clipboardValue;
  const lat = Number(payload.location?.lat);
  const lng = Number(payload.location?.lng);
  const location = isValidLocation(lat, lng)
    ? { lat, lng }
    : parseGoogleMapsLocation(resolvedUrl);

  if (!location) {
    throw new ClipboardMapLocationError('COORDINATES_NOT_FOUND');
  }

  return { location, resolvedUrl, geography: payload.geography };
}

export function parseGoogleMapsLocation(value: string): ParsedMapLocation | null {
  // Google embeds the place preview URL inside HTML with `%21`-encoded
  // exclamation markers. Decode those markers even when the full HTML cannot
  // be URI-decoded because it contains unrelated percent-encoded content.
  const text = safeDecodeURIComponent(value.trim()).replace(/%21/gi, '!');

  // Google place pages and short-link redirects often embed the map center as
  // longitude first (`!2d{lng}!3d{lat}`) inside the page bootstrap payload.
  const placePayloadMatch = text.match(
    /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/,
  );
  if (placePayloadMatch) {
    const lng = Number(placePayloadMatch[1]);
    const lat = Number(placePayloadMatch[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
  }

  // Directions URLs (`/maps/dir/{origin}/{destination}/@{viewCenter}/data=!...
  // !2m2!1d{lng}!2d{lat}!...`) embed the actual destination pin, longitude
  // first, inside the `data=` payload's `!2m2` marker. This must be checked
  // before the generic `@lat,lng` pattern below, because that pattern matches
  // the URL's map-framing viewport center (the midpoint used to fit both
  // origin and destination on screen) rather than the destination itself —
  // the two can be a kilometers-wide error, silently producing a route that
  // is neither the origin-to-viewport-center distance nor the real trip.
  const dirWaypointMatch = text.match(
    /!2m2!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/,
  );
  if (dirWaypointMatch) {
    const lng = Number(dirWaypointMatch[1]);
    const lat = Number(dirWaypointMatch[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
  }

  // Place-page URLs (`/maps/place/{name}/@{viewCenter}/data=!...!8m2!3d{lat}!4d{lng}!...`)
  // embed the actual pinned place this same way, latitude first this time. Same reasoning
  // as the directions case above: this must win over the generic `@lat,lng` pattern below,
  // which is only the viewport center Google picked to frame the map, not the place itself —
  // the two are frequently close but not identical, and the whole point of resolving a
  // pasted link is the exact pin, not "somewhere near it".
  const placeMarkerMatch = text.match(
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  );
  if (placeMarkerMatch) {
    const lat = Number(placeMarkerMatch[1]);
    const lng = Number(placeMarkerMatch[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
  }

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /(?:[?&](?:q|query|ll|center)=)(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /(^|[^\d.-])(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)([^\d.]|$)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match.length === 5 ? match[2] : match[1]);
    const lng = Number(match.length === 5 ? match[3] : match[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
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
    const match = url.pathname.match(/\/maps\/(?:place|search)\/([^/?#]+)/i);
    if (!match?.[1]) return null;

    const placeName = safeDecodeURIComponent(match[1].replace(/\+/g, ' '))
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060]/g, '')
      .trim();

    return placeName || null;
  } catch {
    return null;
  }
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

function looksLikeGoogleMapsLocation(value: string) {
  const normalized = normalizeGoogleMapsUrl(value).toLowerCase();
  if (!normalized) return false;

  return isGoogleMapsLink(normalized) || parseGoogleMapsLocation(normalized) !== null;
}

function extractGoogleMapsUrl(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return '';

  const urlMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|google\.com)\/[^\s<>"']+/i,
  );
  return normalizeGoogleMapsUrl((urlMatch?.[0] || value).replace(/[),.;]+$/, ''));
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
    && Math.abs(lng) <= 180;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
