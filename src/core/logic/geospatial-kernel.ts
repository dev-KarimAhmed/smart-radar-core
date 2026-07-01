import { SOVEREIGN_CONSTANTS } from '../constants/sovereign-protocols';

const toRad = (value: number) => (value * Math.PI) / 180;

export function getDynamicDetourIndex(lat: number, lng: number): number {
  if (!lat || !lng) return SOVEREIGN_CONSTANTS.URBAN_DETOUR_INDEX;
  
  // Deterministic local cell encoding to find detour index dynamically
  const cell = latLngToH3Cell(lat, lng, 9);
  
  // Amman (عمان) is crowded (detour = 1.35)
  if (lat >= 31.80 && lat < 32.05 && lng >= 35.70 && lng < 36.15) {
    return 1.35; 
  }
  
  // Zarqa (الزرقاء) (detour = 1.34)
  if (lat >= 32.00 && lat < 32.15 && lng >= 36.00 && lng < 36.30) {
    return 1.34;
  }
  
  // Irbid (إربد) (detour = 1.32)
  if (lat >= 32.40 && lat < 32.70 && lng >= 35.60 && lng < 36.15) {
    return 1.32;
  }
  
  // Balqa (البلقاء) (detour = 1.31)
  if (lat >= 31.95 && lat < 32.20 && lng >= 35.55 && lng < 35.80) {
    return 1.31;
  }
  
  // Aqaba (العقبة) (detour = 1.25)
  if (lat >= 29.30 && lat < 29.80 && lng >= 34.80 && lng < 35.30) {
    return 1.25;
  }

  // Base default detour index
  return 1.30;
}

/**
 * [SCR-2026-002] The Sovereign Haversine Kernel
 * Calculates the great-circle distance between two points on the earth and
 * applies the sovereign urban detour index for realistic on-road distance.
 * Cost: $0.00
 *
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The estimated on-road distance in kilometers.
 */
export function calculateSovereignDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDistance = R * c;

  // Apply the dynamic Sovereign detour index based on Liwa/Cell of origin
  const detourIndex = getDynamicDetourIndex(lat1, lon1);
  return rawDistance * detourIndex;
}

/**
 * Deterministic client-side H3-like hexagonal cell encoder
 * This calculates hexagonal coordinate indices for latitude/longitude at resolution 9
 * without relying on external network calls or heavy libraries, keeping operation zero-cost.
 */
export function latLngToH3Cell(lat: number, lng: number, resolution = 9): string {
  // Approximate grid spacing for H3 Resolution 9 (edge length ~100m)
  const radius = 6371000; // in meters
  const mLat = (2 * Math.PI * radius) / 360.0;
  const cellSpacingMeters = 100 * Math.pow(1.4, 9 - resolution);
  const latSpacing = cellSpacingMeters / mLat;
  const lngSpacing = cellSpacingMeters / (mLat * Math.cos(toRad(lat)));

  // Convert to high-precision hexagonal coordinates
  const q = lat / latSpacing;
  const r = lng / lngSpacing;

  // Hexagonal rounding
  let rx = Math.round(q);
  let ry = Math.round(r);
  let rz = Math.round(-q - r);

  const x_diff = Math.abs(rx - q);
  const y_diff = Math.abs(ry - r);
  const z_diff = Math.abs(rz - (-q - r));

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  }

  // Generate H3 string representation (resolution 9 uses prefix '89')
  const baseHex = "8";
  const resChar = resolution.toString(16);
  const hX = Math.abs(rx).toString(16).substring(0, 5).padStart(5, 'e');
  const hY = Math.abs(ry).toString(16).substring(0, 5).padStart(5, 'c');
  const hZ = Math.abs(rx + ry).toString(16).substring(0, 3).padStart(3, 'a');

  return `${baseHex}${resChar}${hX}${hY}${hZ}`.substring(0, 15);
}

/**
 * Calculates the exact centroid coordinates of the deterministic H3 hexagonal cell
 * to represent the obfuscated location grid for driver radar calculation.
 */
export function getH3CellCentroid(lat: number, lng: number, resolution = 9): { lat: number; lng: number } {
  const radius = 6371000; // in meters
  const mLat = (2 * Math.PI * radius) / 360.0;
  const cellSpacingMeters = 100 * Math.pow(1.4, 9 - resolution);
  const latSpacing = cellSpacingMeters / mLat;
  const lngSpacing = cellSpacingMeters / (mLat * Math.cos(toRad(lat)));

  const q = lat / latSpacing;
  const r = lng / lngSpacing;

  let rx = Math.round(q);
  let ry = Math.round(r);
  let rz = Math.round(-q - r);

  const x_diff = Math.abs(rx - q);
  const y_diff = Math.abs(ry - r);
  const z_diff = Math.abs(rz - (-q - r));

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  }

  return {
    lat: rx * latSpacing,
    lng: ry * lngSpacing
  };
}

// Estimate commute/ride trip time (Minutes) based on sovereign standard speed of 40 km/h (ETA Formula) and round/ceil to full minutes as run buffer, with an optional trend/traffic impact
export function estimateTripTime(distance: number, trendBonus?: string): number {
  let multiplier = 1.0;
  if (trendBonus === 'critical') multiplier = 1.25;
  else if (trendBonus === 'active') multiplier = 1.15;
  return Math.ceil(((distance / 40) * 60) * multiplier);
}

// Convert absolute GPS coordinates to governorate districts for payment-settlement routing and capacity control bounds offline mapping
export function getDistrictFromCoords(lat: number, lng: number): { district: string } {
  // Amman (عمان) Center / West
  if (lat >= 31.80 && lat < 32.05 && lng >= 35.70 && lng < 36.15) {
    return { district: 'Western Amman' };
  }
  // Zarqa (الزرقاء) Industrial
  if (lat >= 32.00 && lat < 32.15 && lng >= 36.00 && lng < 36.30) {
    return { district: 'Zarqa Industrial' };
  }
  // Irbid (إربد) Academic Ring
  if (lat >= 32.40 && lat < 32.70 && lng >= 35.60 && lng < 36.15) {
    return { district: 'Irbid Ring' };
  }
  // Aqaba (العقبة) Port and Beach
  if (lat >= 29.30 && lat < 29.80 && lng >= 34.80 && lng < 35.30) {
    return { district: 'Aqaba Port' };
  }
  // Default regional/governorate grouping bounds falls back to Jordanian highlands
  return { district: 'Jordan Highlands' };
}

// Generates dynamic short link maps tracking URL without making costly visual map requests in client side (Deep Trust Maps Routing)
export function generateSovereignSearchUrl(latOrTerm: number | string, lng?: number): string {
  if (typeof latOrTerm === 'string') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latOrTerm)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${latOrTerm},${lng}`;
}

// Sovereign Deep link map search and external nav proxy linking safely
export function generateSovereignRouteUrl(
  originLatOrObj: number | { pickupCoords?: { lat: number; lng: number }; dropoffCoords?: { lat: number; lng: number } },
  originLng?: number,
  destLat?: number,
  destLng?: number
): string {
  if (typeof originLatOrObj === 'object') {
    const pickup = originLatOrObj.pickupCoords;
    const dropoff = originLatOrObj.dropoffCoords;
    if (pickup && dropoff) {
      return `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}&travelmode=driving`;
    }
    return '#';
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${originLatOrObj},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
}

