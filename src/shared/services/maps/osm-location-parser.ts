import { ParsedMapLocation, isValidLocation, safeDecodeURIComponent } from './maps-types';

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

  const urlMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?(?:openstreetmap\.org|osm\.org)\/[^\s<>"']+/i,
  );
  return normalizeOpenStreetMapUrl((urlMatch?.[0] || '').replace(/[),.;]+$/, ''));
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
