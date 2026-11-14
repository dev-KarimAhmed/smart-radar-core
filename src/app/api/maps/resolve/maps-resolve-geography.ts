import {
  extractGoogleMapsPlaceName,
  extractPlusCode,
  isInvalidPlaceName,
  resolvePlusCodeLocation,
} from '@/shared/services/google-maps-location';
import { calculateHaversineKm } from '@/lib/road-route';
import { isValidLocation } from './maps-resolve-redirects';

/**
 * How far the coordinate we extracted may sit from where the place NAME in the same link
 * geocodes to before we stop trusting the extraction.
 * 3 km is wide enough for the normal case and far narrower than a wrong-point error.
 */
export const PLACE_NAME_MISMATCH_KM = 3;

/**
 * Geocodes the place name using Nominatim with cascading locality fallback:
 * tries full clean place name, then drops specific venue and tries the district/governorate.
 */
export async function geocodePlaceName(resolvedUrl: string, locationHint?: { lat: number; lng: number }) {
  const rawPlaceName = extractGoogleMapsPlaceName(resolvedUrl);
  if (!rawPlaceName) return null;

  // 1. Direct Plus Code resolution if present in URL or place name
  const plusCode = extractPlusCode(rawPlaceName) || extractPlusCode(resolvedUrl);
  if (plusCode) {
    const resolved = resolvePlusCodeLocation(plusCode, locationHint);
    if (resolved) {
      return { lat: resolved.lat, lng: resolved.lng, placeName: rawPlaceName };
    }
  }

  // 2. Clean place name: strip Plus Codes anywhere in name, remove Arabic/Latin commas
  const cleanName = rawPlaceName
    .replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*[-–—,،]?\s*/gi, '')
    .trim();
  if (!cleanName || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(cleanName)) return null;

  const segments = cleanName.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  const candidateQueries = [cleanName];
  if (segments.length > 1) {
    candidateQueries.push(segments.slice(1).join(', '));
  }
  if (segments.length > 2) {
    candidateQueries.push(segments.slice(2).join(', '));
  }

  // 3. Mapbox Geocoding: Fast, robust MENA coverage (Egypt, Jordan, etc.)
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '').trim();
  if (mapboxToken) {
    for (const q of candidateQueries) {
      try {
        const proximityParam = locationHint ? `&proximity=${locationHint.lng},${locationHint.lat}` : '';
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(mapboxToken)}${proximityParam}&limit=1`;
        const res = await fetch(endpoint, {
          signal: AbortSignal.timeout(3_000),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const payload = await res.json() as { features?: Array<{ center?: [number, number]; place_name?: string }> };
          const feature = payload.features?.[0];
          if (feature?.center && isValidLocation(feature.center[1], feature.center[0])) {
            return { lat: feature.center[1], lng: feature.center[0], placeName: cleanName };
          }
        }
      } catch {
        // try next candidate or fall back
      }
    }
  }

  // 4. OpenStreetMap Nominatim Fallback
  for (const q of candidateQueries) {
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        q,
        limit: '1',
        'accept-language': 'ar,en',
      });
      if (locationHint) {
        // Use a ~50km bounding box to strongly bias Nominatim toward the region of the coordinate.
        const viewbox = `${locationHint.lng - 0.5},${locationHint.lat + 0.5},${locationHint.lng + 0.5},${locationHint.lat - 0.5}`;
        params.set('viewbox', viewbox);
      }
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3_000),
        headers: { Accept: 'application/json', 'User-Agent': 'RadarLocationResolver/1.0' },
      });
      if (!response.ok) continue;

      const [match] = await response.json() as Array<{ lat?: string; lon?: string }>;
      const lat = Number(match?.lat);
      const lng = Number(match?.lon);
      if (isValidLocation(lat, lng)) {
        return { lat, lng, placeName: cleanName };
      }
    } catch {
      // continue to broader query
    }
  }

  return null;
}

/**
 * Second, independent reading of the same link: geocode the place NAME and see whether it
 * lands near the coordinate we extracted.
 */
export async function crossCheckPlaceName(
  resolvedUrl: string,
  location: { lat: number; lng: number },
) {
  const rawPlaceName = extractGoogleMapsPlaceName(resolvedUrl);
  const placeName = rawPlaceName?.replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*[-–—,،]?\s*/gi, '').trim() || null;
  if (!placeName || isInvalidPlaceName(placeName)) return null;
  const geocoded = await geocodePlaceName(resolvedUrl, location);
  if (!geocoded) return null;

  const distanceKm = calculateHaversineKm(location, { lat: geocoded.lat, lng: geocoded.lng });

  return {
    placeName: geocoded.placeName,
    geocodedLocation: { lat: geocoded.lat, lng: geocoded.lng },
    distanceKm: Number(distanceKm.toFixed(2)),
    isMismatch: distanceKm > PLACE_NAME_MISMATCH_KM,
  };
}

export async function reverseResolveGeography(location: { lat: number; lng: number }) {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(location.lat),
      lon: String(location.lng),
      zoom: '18',
      addressdetails: '1',
      'accept-language': 'ar,en',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RadarLocationResolver/1.0',
      },
    });
    if (!response.ok) return undefined;

    const payload = await response.json() as { address?: Record<string, unknown> };
    const address = payload.address || {};
    const governorateCandidates = addressValues(
      address,
      'state',
      'region',
      'province',
      'state_district',
    );
    const districtCandidates = addressValues(
      address,
      'neighbourhood',
      'suburb',
      'quarter',
      'borough',
      'city_district',
      'district',
      'municipality',
      'county',
      'city',
      'town',
      'village',
      'hamlet',
    );
    return {
      governorate: governorateCandidates[0] || null,
      district: districtCandidates[0] || null,
      city: firstAddressValue(address, 'city', 'town', 'village', 'municipality'),
      governorateCandidates,
      districtCandidates,
    };
  } catch {
    return undefined;
  }
}

function firstAddressValue(address: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function addressValues(address: Record<string, unknown>, ...keys: string[]) {
  return keys
    .map((key) => address[key])
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.trim())
    .filter((value, index, values) => values.indexOf(value) === index);
}
