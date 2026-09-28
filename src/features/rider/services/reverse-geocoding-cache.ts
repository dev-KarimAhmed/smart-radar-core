/**
 * Shared in-memory Reverse Geocoding Cache for OpenStreetMap / Nominatim.
 *
 * Prevents HTTP 429 rate-limiting by caching resolved addresses by coordinate
 * proximity (rounded to 4 decimal places, ~11 meters) and language with a 1-hour TTL.
 * Deduplicates concurrent identical requests.
 */

interface CachedGeocode {
  address: Record<string, string>;
  displayName: string;
  display_name: string;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, CachedGeocode>();
const inFlightRequests = new Map<string, Promise<{ address: Record<string, string>; displayName: string; display_name: string }>>();

function buildCacheKey(lat: number, lng: number, language: string): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)},${language}`;
}

export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
  language: string,
): Promise<{ address: Record<string, string>; displayName: string; display_name: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { address: {}, displayName: '', display_name: '' };
  }

  const key = buildCacheKey(lat, lng, language);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { address: cached.address, displayName: cached.displayName, display_name: cached.display_name };
  }

  const existingInFlight = inFlightRequests.get(key);
  if (existingInFlight) {
    return existingInFlight;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${language}`,
        { headers: { Accept: 'application/json' } },
      );

      if (!response.ok) {
        throw new Error(`Nominatim reverse geocode failed with status ${response.status}`);
      }

      const data = await response.json() as { address?: Record<string, string>; display_name?: string };
      const address = data.address || {};
      const displayName = data.display_name || '';

      const entry: CachedGeocode = {
        address,
        displayName,
        display_name: displayName,
        timestamp: Date.now(),
      };
      cache.set(key, entry);
      return { address, displayName, display_name: displayName };
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}

