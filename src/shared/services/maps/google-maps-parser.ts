import { ParsedMapLocation, isValidLocation, safeDecodeURIComponent } from './maps-types';
import { extractPlusCode, resolvePlusCodeLocation } from './plus-code-resolver';
import { isGoogleMapsLink, normalizeGoogleMapsUrl } from './maps-url-utils';

export function parseGoogleMapsLocation(
  value: string,
  referenceLocation?: ParsedMapLocation,
): ParsedMapLocation | null {
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

  // Directions URLs
  if (isDirectionsUrl) {
    const allWaypoints = [...text.matchAll(/!2m2!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g)];
    if (allWaypoints.length > 0) {
      const lastMatch = allWaypoints[allWaypoints.length - 1];
      const lng = Number(lastMatch[1]);
      const lat = Number(lastMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }

    const all3d4d = [...text.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
    if (all3d4d.length > 1) {
      const lastMatch = all3d4d[all3d4d.length - 1];
      const lat = Number(lastMatch[1]);
      const lng = Number(lastMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }

    const destParamMatch = text.match(/[?&](?:destination|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (destParamMatch) {
      const lat = Number(destParamMatch[1]);
      const lng = Number(destParamMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }

    const dirMatch = text.match(/\/maps\/dir\/(.+?)(?:\/@|$)/i);
    if (dirMatch?.[1]) {
      const segments = dirMatch[1].split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment) {
        const coordMatch = lastSegment.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
        if (coordMatch) {
          const lat = Number(coordMatch[1]);
          const lng = Number(coordMatch[2]);
          if (isValidLocation(lat, lng)) return { lat, lng };
        }
        const plusCode = extractPlusCode(lastSegment);
        if (plusCode) {
          const resolved = resolvePlusCodeLocation(plusCode, effectiveRefLocation);
          if (resolved) return resolved;
        }
      }
    }

    const plusCode = extractPlusCode(text);
    if (plusCode) {
      const resolved = resolvePlusCodeLocation(plusCode, effectiveRefLocation);
      if (resolved) return resolved;
    }

    return null;
  }

  // HTML documents with multiple !3d!4d markers
  if (isHtml) {
    const all3d4d = [...text.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
    if (all3d4d.length > 1) {
      const lastMatch = all3d4d[all3d4d.length - 1];
      const lat = Number(lastMatch[1]);
      const lng = Number(lastMatch[2]);
      if (isValidLocation(lat, lng)) return { lat, lng };
    }
  }

  const patterns = [
    /!8m2!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /(?:[?&](?:q|query|destination|daddr)=)(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidLocation(lat, lng)) return { lat, lng };
  }

  const placePlusCode = extractPlusCode(text);
  if (placePlusCode) {
    const resolved = resolvePlusCodeLocation(placePlusCode, effectiveRefLocation);
    if (resolved) return resolved;
  }

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

export function looksLikeGoogleMapsLocation(value: string): boolean {
  const normalized = normalizeGoogleMapsUrl(value).toLowerCase();
  if (!normalized) return false;

  return (
    isGoogleMapsLink(normalized) ||
    parseGoogleMapsLocation(normalized) !== null ||
    extractPlusCode(value) !== null
  );
}
