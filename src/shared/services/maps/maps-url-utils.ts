import { safeDecodeURIComponent } from './maps-types';
import { extractPlusCode } from './plus-code-resolver';
import { isOpenStreetMapLink } from './osm-location-parser';

export function isCoordinatePairSegment(segment: string): boolean {
  return /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(segment);
}

export function isInvalidPlaceName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return true;

  // Google Maps protobuf parameters or internal data segments
  if (
    trimmed.startsWith('data=') ||
    trimmed.includes('data=!') ||
    trimmed.startsWith('!') ||
    /^!?[0-9]+[a-z][0-9]+/i.test(trimmed) ||
    /^am=[a-z0-9]+/i.test(trimmed)
  ) {
    return true;
  }

  // Camera / viewport / zoom / coordinate markers
  if (
    trimmed.startsWith('@') ||
    isCoordinatePairSegment(trimmed) ||
    /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(trimmed)
  ) {
    return true;
  }

  // Degrees, minutes, seconds coordinate format
  if (/^\d+°\d+['′]/i.test(trimmed) || /\d+°\d+['′"″][NSEW]/i.test(trimmed)) {
    return true;
  }

  // Raw Plus Code only
  if (/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}$/i.test(trimmed)) {
    return true;
  }

  // Raw hexadecimal IDs
  if (/^0x[0-9a-f]+(:0x[0-9a-f]+)?$/i.test(trimmed)) {
    return true;
  }

  // Generic origin keywords that are not destinations
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

export function decodeGoogleMapsPathSegment(rawSegment: string): string | null {
  let placeName = safeDecodeURIComponent(rawSegment.replace(/\+/g, ' '))
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060]/g, '')
    .trim();

  if (isInvalidPlaceName(placeName)) {
    return null;
  }

  // Strip Plus Code anywhere in name
  placeName = placeName
    .replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*[-–—,،]?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (isInvalidPlaceName(placeName)) {
    return null;
  }

  return placeName || null;
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
        .filter((segment): segment is string => Boolean(segment && !isCoordinatePairSegment(segment) && !isInvalidPlaceName(segment)));
      const lastNamedSegment = namedSegments[namedSegments.length - 1];
      if (lastNamedSegment) return lastNamedSegment;
    }

    const qParam = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('destination') || url.searchParams.get('daddr');
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

export function normalizeGoogleMapsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|google\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
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
      hostname === 'maps.app.goo.gl'
      || hostname === 'goo.gl'
      || hostname === 'google.com'
      || hostname.endsWith('.google.com')
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

export function extractGoogleMapsUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return '';

  const urlMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?(?:maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|google\.com)\/[^\s<>"']+/i,
  );
  return sanitizeGoogleMapsUrl(normalizeGoogleMapsUrl((urlMatch?.[0] || value).replace(/[),.;]+$/, '')));
}
