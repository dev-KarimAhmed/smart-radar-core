export interface ParsedMapLocation {
  lat: number;
  lng: number;
}

export interface ResolvedLocationGeography {
  governorate?: string | null;
  district?: string | null;
  city?: string | null;
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
  const clipboardValue = extractGoogleMapsUrl(rawValue);
  if (!clipboardValue || !looksLikeGoogleMapsLocation(clipboardValue)) {
    throw new ClipboardMapLocationError('INVALID_MAPS_LINK');
  }

  const directLocation = parseGoogleMapsLocation(clipboardValue);
  if (directLocation) {
    return { location: directLocation, resolvedUrl: clipboardValue };
  }

  let response: Response;
  try {
    response = await fetcher(`/api/maps/resolve?url=${encodeURIComponent(clipboardValue)}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ClipboardMapLocationError('RESOLUTION_FAILED');
  }

  if (!response.ok) {
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

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
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
