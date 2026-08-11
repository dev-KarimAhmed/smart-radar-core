import { SOVEREIGN_CONSTANTS } from '../constants/sovereign-protocols';
import {
  UNITS,
  cellToLatLng,
  getHexagonEdgeLengthAvg,
  greatCircleDistance,
  gridDisk,
  gridDistance,
  latLngToCell,
} from 'h3-js';

const H3_RESOLUTION_DEFAULT = 9;
const OPENSTREETMAP_BASE_URL = 'https://www.openstreetmap.org';

const DISTRICT_TORTUOSITY = [
  {
    district: 'Amman',
    arabicName: 'عمّان',
    factor: 1.35,
    bounds: { minLat: 31.8, maxLat: 32.05, minLng: 35.7, maxLng: 36.15 },
  },
  {
    district: 'Zarqa',
    arabicName: 'الزرقاء',
    factor: 1.34,
    bounds: { minLat: 32.0, maxLat: 32.15, minLng: 36.0, maxLng: 36.3 },
  },
  {
    district: 'Irbid',
    arabicName: 'إربد',
    factor: 1.32,
    bounds: { minLat: 32.4, maxLat: 32.7, minLng: 35.6, maxLng: 36.15 },
  },
  {
    district: 'Balqa',
    arabicName: 'البلقاء',
    factor: 1.31,
    bounds: { minLat: 31.95, maxLat: 32.2, minLng: 35.55, maxLng: 35.8 },
  },
  {
    district: 'Aqaba',
    arabicName: 'العقبة',
    factor: 1.25,
    bounds: { minLat: 29.3, maxLat: 29.8, minLng: 34.8, maxLng: 35.3 },
  },
] as const;

const JORDAN_LOCAL_FARE = {
  baseFareJod: 1.15,
  perKmJod: 0.38,
  serviceFloorJod: 1.75,
};

const findDistrictProfile = (lat: number, lng: number) =>
  DISTRICT_TORTUOSITY.find(
    ({ bounds }) =>
      lat >= bounds.minLat &&
      lat < bounds.maxLat &&
      lng >= bounds.minLng &&
      lng < bounds.maxLng,
  );

export interface SovereignFareQuote {
  straightDistanceKm: number;
  h3DistanceKm: number;
  estimatedRoadDistanceKm: number;
  h3CellDistance: number;
  tortuosityFactor: number;
  guidePriceJod: number;
  originCell: string;
  destinationCell: string;
}

export function getDynamicDetourIndex(lat: number, lng: number): number {
  if (!lat || !lng) return SOVEREIGN_CONSTANTS.URBAN_DETOUR_INDEX;
  return findDistrictProfile(lat, lng)?.factor ?? 1.3;
}

/**
 * Calculates an offline road-distance estimate using official h3-js cells,
 * local great-circle distance, and district tortuosity factors.
 */
export function calculateSovereignDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return calculateSovereignFareQuote(
    { lat: lat1, lng: lon1 },
    { lat: lat2, lng: lon2 },
    getDynamicDetourIndex(lat1, lon1),
  ).estimatedRoadDistanceKm;
}

export function calculateSovereignFareQuote(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  tortuosityFactor = getDynamicDetourIndex(destination.lat, destination.lng),
): SovereignFareQuote {
  const originCell = latLngToH3Cell(origin.lat, origin.lng, H3_RESOLUTION_DEFAULT);
  const destinationCell = latLngToH3Cell(destination.lat, destination.lng, H3_RESOLUTION_DEFAULT);
  const straightDistanceKm = greatCircleDistance([origin.lat, origin.lng], [destination.lat, destination.lng], UNITS.km);
  const h3EdgeKm = getHexagonEdgeLengthAvg(H3_RESOLUTION_DEFAULT, UNITS.km);
  let h3CellDistance = 0;
  let h3DistanceKm = straightDistanceKm;

  try {
    h3CellDistance = gridDistance(originCell, destinationCell);
    h3DistanceKm = Math.max(straightDistanceKm, h3CellDistance * h3EdgeKm);
  } catch {
    h3CellDistance = Math.ceil(straightDistanceKm / h3EdgeKm);
    h3DistanceKm = straightDistanceKm;
  }

  const estimatedRoadDistanceKm = Math.max(0.8, h3DistanceKm * tortuosityFactor);
  const rawPrice = Math.max(
    JORDAN_LOCAL_FARE.serviceFloorJod,
    JORDAN_LOCAL_FARE.baseFareJod + estimatedRoadDistanceKm * JORDAN_LOCAL_FARE.perKmJod,
  );

  return {
    straightDistanceKm: roundMetric(straightDistanceKm),
    h3DistanceKm: roundMetric(h3DistanceKm),
    estimatedRoadDistanceKm: roundMetric(estimatedRoadDistanceKm),
    h3CellDistance,
    tortuosityFactor,
    guidePriceJod: roundFare(rawPrice),
    originCell,
    destinationCell,
  };
}

export function latLngToH3Cell(lat: number, lng: number, resolution = H3_RESOLUTION_DEFAULT): string {
  return latLngToCell(lat, lng, resolution);
}

export function getH3Neighbors(h3Cell: string, ringSize = 1): string[] {
  return gridDisk(h3Cell, ringSize);
}

export function getH3CellCentroid(lat: number, lng: number, resolution = H3_RESOLUTION_DEFAULT): { lat: number; lng: number } {
  const [centroidLat, centroidLng] = cellToLatLng(latLngToH3Cell(lat, lng, resolution));
  return { lat: centroidLat, lng: centroidLng };
}

export function estimateTripTime(distance: number, trendBonus?: string): number {
  let multiplier = 1.0;
  if (trendBonus === 'critical') multiplier = 1.25;
  else if (trendBonus === 'active') multiplier = 1.15;
  return Math.ceil(((distance / 40) * 60) * multiplier);
}

export function getDistrictFromCoords(lat: number, lng: number): { district: string } {
  return { district: findDistrictProfile(lat, lng)?.district ?? 'Jordan Highlands' };
}

export function generateSovereignSearchUrl(latOrTerm: number | string, lng?: number): string {
  if (typeof latOrTerm === 'string') {
    return `${OPENSTREETMAP_BASE_URL}/search?query=${encodeURIComponent(latOrTerm)}`;
  }

  return `${OPENSTREETMAP_BASE_URL}/?mlat=${latOrTerm}&mlon=${lng}#map=16/${latOrTerm}/${lng}`;
}

export function generateSovereignRouteUrl(
  originLatOrObj: number | { pickupCoords?: { lat: number; lng: number }; dropoffCoords?: { lat: number; lng: number } },
  originLng?: number,
  destLat?: number,
  destLng?: number,
): string {
  if (typeof originLatOrObj === 'object') {
    const pickup = originLatOrObj.pickupCoords;
    const dropoff = originLatOrObj.dropoffCoords;

    if (pickup && dropoff) {
      return `${OPENSTREETMAP_BASE_URL}/directions?engine=fossgis_osrm_car&route=${pickup.lat}%2C${pickup.lng}%3B${dropoff.lat}%2C${dropoff.lng}`;
    }

    return '#';
  }

  return `${OPENSTREETMAP_BASE_URL}/directions?engine=fossgis_osrm_car&route=${originLatOrObj}%2C${originLng}%3B${destLat}%2C${destLng}`;
}

function roundMetric(value: number) {
  return Number(value.toFixed(2));
}

function roundFare(value: number) {
  return Number((Math.ceil(value * 20) / 20).toFixed(2));
}
