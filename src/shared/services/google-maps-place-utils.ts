import {
  type ParsedMapLocation,
  isValidLocation,
  safeDecodeURIComponent,
  extractPlusCode,
} from './google-maps-plus-codes';

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
  } catch {}

  const hashOnlyMatch = text.match(/map=-?\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
  if (hashOnlyMatch) {
    const lat = Number(hashOnlyMatch[1]);
    const lng = Number(hashOnlyMatch[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
  }

  return null;
}

export function isOpenStreetMapLink(value: string): boolean {
  try {
    const hostname = new URL(normalizeOpenStreetMapUrl(value)).hostname.toLowerCase();
    return hostname === 'openstreetmap.org' || hostname === 'www.openstreetmap.org' || hostname === 'osm.org';
  } catch {
    return false;
  }
}

export function extractOpenStreetMapUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return '';

  const urlMatch = value.match(/(?:https?:\/\/)?(?:www\.)?(?:openstreetmap\.org|osm\.org)\/[^\s<>"']+/i);
  const clean = (urlMatch?.[0] || '').replace(/[),.;]+$/, '');
  return normalizeOpenStreetMapUrl(clean);
}

export function normalizeOpenStreetMapUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:www\.)?(?:openstreetmap\.org|osm\.org)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function isInvalidPlaceName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return true;

  if (
    trimmed.startsWith('data=') ||
    trimmed.includes('data=!') ||
    trimmed.startsWith('!') ||
    /^!?[0-9]+[a-z][0-9]+/i.test(trimmed) ||
    /^am=[a-z0-9]+/i.test(trimmed)
  ) {
    return true;
  }

  if (
    trimmed.startsWith('@') ||
    isCoordinatePairSegment(trimmed) ||
    /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(trimmed)
  ) {
    return true;
  }

  if (/^\d+°\d+['′]/i.test(trimmed) || /\d+°\d+['′"″][NSEW]/i.test(trimmed)) {
    return true;
  }

  if (/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}$/i.test(trimmed)) {
    return true;
  }

  if (/^0x[0-9a-f]+(:0x[0-9a-f]+)?$/i.test(trimmed)) {
    return true;
  }

  const normalized = trimmed.replace(/\+/g, ' ').toLowerCase();
  if (
    normalized === 'current location' ||
    normalized === 'my location' ||
    normalized === 'your location' ||
    normalized === 'موقعي' ||
    normalized === 'موقعي الحالي' ||
    normalized === 'موقعك' ||
    normalized === 'موقعك الحالي'
  ) {
    return true;
  }

  return false;
}

export function extractGoogleMapsPlaceName(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const placeMatch = url.pathname.match(/\/maps\/(?:place|search)\/([^/?#]+)/i);
    if (placeMatch?.[1]) {
      const decoded = decodeGoogleMapsPathSegment(placeMatch[1]);
      if (decoded && !isInvalidPlaceName(decoded)) {
        return decoded;
      }
    }

    const dirMatch = url.pathname.match(/\/maps\/dir\/(.+?)(?:\/@|\/data=!|\/am=|$)/i);
    if (dirMatch?.[1]) {
      const namedSegments = dirMatch[1]
        .split('/')
        .map((segment) => decodeGoogleMapsPathSegment(segment))
        .filter(
          (segment): segment is string =>
            Boolean(segment && !isCoordinatePairSegment(segment) && !isInvalidPlaceName(segment))
        );
      const lastNamedSegment = namedSegments[namedSegments.length - 1];
      if (lastNamedSegment) return lastNamedSegment;
    }

    const qParam =
      url.searchParams.get('q') ||
      url.searchParams.get('query') ||
      url.searchParams.get('destination') ||
      url.searchParams.get('daddr');
    if (qParam && !isCoordinatePairSegment(qParam)) {
      const decoded = decodeGoogleMapsPathSegment(qParam);
      if (decoded && !isInvalidPlaceName(decoded)) {
        return decoded;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function isCoordinatePairSegment(segment: string): boolean {
  return /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(segment);
}

export function decodeGoogleMapsPathSegment(rawSegment: string): string | null {
  let placeName = safeDecodeURIComponent(rawSegment.replace(/\+/g, ' '))
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060]/g, '')
    .trim();

  if (isInvalidPlaceName(placeName)) {
    return null;
  }

  placeName = placeName
    .replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*[-–—,،]?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (isInvalidPlaceName(placeName)) {
    return null;
  }

  return placeName || null;
}

export function isShortGoogleMapsLink(value: string): boolean {
  try {
    const hostname = new URL(normalizeGoogleMapsUrl(value)).hostname.toLowerCase();
    return hostname === 'maps.app.goo.gl' || hostname === 'goo.gl';
  } catch {
    return false;
  }
}

export function isGoogleMapsLink(value: string): boolean {
  try {
    const hostname = new URL(normalizeGoogleMapsUrl(value)).hostname.toLowerCase();
    return (
      hostname === 'maps.app.goo.gl' ||
      hostname === 'goo.gl' ||
      hostname === 'google.com' ||
      hostname.endsWith('.google.com')
    );
  } catch {
    return false;
  }
}

export function isMapsLink(value: string): boolean {
  return isGoogleMapsLink(value) || isOpenStreetMapLink(value);
}

export function sanitizeGoogleMapsUrl(urlStr: string): string {
  try {
    const normalized = normalizeGoogleMapsUrl(urlStr);
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'maps.app.goo.gl' || hostname === 'goo.gl') {
      url.search = '';
      return url.toString();
    }

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

export function looksLikeGoogleMapsLocation(
  value: string,
  parseGMLoc?: (val: string) => ParsedMapLocation | null
): boolean {
  const normalized = normalizeGoogleMapsUrl(value).toLowerCase();
  if (!normalized) return false;

  return (
    isGoogleMapsLink(normalized) ||
    (parseGMLoc ? parseGMLoc(normalized) !== null : false) ||
    extractPlusCode(value) !== null
  );
}

export function extractGoogleMapsUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return '';

  const urlMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|google\.com)\/[^\s<>"']+/i
  );
  return sanitizeGoogleMapsUrl(normalizeGoogleMapsUrl((urlMatch?.[0] || value).replace(/[),.;]+$/, '')));
}

export function normalizeGoogleMapsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|google\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
