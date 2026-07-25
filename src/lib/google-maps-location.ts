export interface ParsedMapLocation {
  lat: number;
  lng: number;
}

export interface ResolvedClipboardMapLocation {
  location: ParsedMapLocation;
  resolvedUrl: string;
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
  const clipboardValue = rawValue.trim();
  if (!clipboardValue || !looksLikeGoogleMapsLocation(clipboardValue)) {
    throw new ClipboardMapLocationError('INVALID_MAPS_LINK');
  }

  const directLocation = parseGoogleMapsLocation(clipboardValue);
  if (directLocation) {
    return { location: directLocation, resolvedUrl: clipboardValue };
  }

  if (!isShortGoogleMapsLink(clipboardValue)) {
    throw new ClipboardMapLocationError('COORDINATES_NOT_FOUND');
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

  return { location, resolvedUrl };
}

export function parseGoogleMapsLocation(value: string): ParsedMapLocation | null {
  const text = safeDecodeURIComponent(value.trim());
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

export function isShortGoogleMapsLink(value: string) {
  try {
    const hostname = new URL(value.trim()).hostname.toLowerCase();
    return hostname === 'maps.app.goo.gl' || hostname === 'goo.gl';
  } catch {
    return false;
  }
}

function looksLikeGoogleMapsLocation(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const hostname = new URL(normalized).hostname;
    return (
      hostname === 'maps.app.goo.gl'
      || hostname === 'goo.gl'
      || hostname === 'google.com'
      || hostname.endsWith('.google.com')
    );
  } catch {
    return parseGoogleMapsLocation(normalized) !== null;
  }
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
