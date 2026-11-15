export type LiveGeolocationStatus = 'locating' | 'live' | 'fallback' | 'denied';

export interface LiveGeolocationPoint {
  lat: number;
  lng: number;
}

export interface LiveGeolocationResult {
  location: LiveGeolocationPoint;
  status: LiveGeolocationStatus;
  refresh: () => void;
}

export const MIN_GPS_DISTANCE_CHANGE_DEG = 0.00008;
export const LAST_KNOWN_LOCATION_STORAGE_KEY = 'smart_radar_last_known_location';
export const GPS_STORAGE_KEY = 'radar_last_known_gps';

export function isDummyCairo(lat: number, lng: number): boolean {
  return Math.abs(lat - 30.0444) < 0.001 && Math.abs(lng - 31.2357) < 0.001;
}

export let cachedLastKnownLocation: LiveGeolocationPoint | null = (() => {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(GPS_STORAGE_KEY) || window.localStorage.getItem(LAST_KNOWN_LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.lat === 'number' &&
          typeof parsed.lng === 'number' &&
          Number.isFinite(parsed.lat) &&
          Number.isFinite(parsed.lng) &&
          (parsed.lat !== 0 || parsed.lng !== 0) &&
          !isDummyCairo(parsed.lat, parsed.lng)
        ) {
          return parsed;
        }
      }
    } catch {}
  }
  return null;
})();

export function setCachedLastKnownLocation(point: LiveGeolocationPoint | null) {
  cachedLastKnownLocation = point;
}

export function saveLastKnownLocation(newPoint: LiveGeolocationPoint) {
  cachedLastKnownLocation = newPoint;
  if (!isDummyCairo(newPoint.lat, newPoint.lng) && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LAST_KNOWN_LOCATION_STORAGE_KEY, JSON.stringify(newPoint));
      window.localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(newPoint));
    } catch {}
  }
}

export function getLastKnownLocation(): LiveGeolocationPoint | null {
  if (cachedLastKnownLocation && !isDummyCairo(cachedLastKnownLocation.lat, cachedLastKnownLocation.lng)) {
    return cachedLastKnownLocation;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(GPS_STORAGE_KEY) || window.localStorage.getItem(LAST_KNOWN_LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          typeof parsed.lat === 'number' &&
          typeof parsed.lng === 'number' &&
          Number.isFinite(parsed.lat) &&
          Number.isFinite(parsed.lng) &&
          (parsed.lat !== 0 || parsed.lng !== 0) &&
          !isDummyCairo(parsed.lat, parsed.lng)
        ) {
          cachedLastKnownLocation = { lat: parsed.lat, lng: parsed.lng };
          return cachedLastKnownLocation;
        }
      }
    } catch {
      // Storage unavailable or parsing error
    }
  }
  return null;
}

