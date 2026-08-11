import { latLngToCell } from 'h3-js';

import { calculateSovereignFareQuote } from '@/core/logic/geospatial-kernel';
import type { RiderDestination } from '../state/rider-state-machine';
import type { RiderLocation } from '../components/rider-map';

export interface GovernorateOption {
  id: string;
  numericId: number;
  nameAr: string;
  nameEn: string;
}

export interface DistrictOption {
  id: string;
  numericId: number;
  governorateId: string;
  governorateAr: string;
  governorateEn: string;
  districtAr: string;
  districtEn: string;
  anchor: RiderLocation | null;
  tortuosityFactor: number;
}

export function normalizeGovernorates(rows: unknown, governorateFallback: (id: number) => string): GovernorateOption[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const numericId = Number(record.id);
      if (!Number.isInteger(numericId) || numericId <= 0) return null;

      return {
        id: String(numericId),
        numericId,
        nameAr: firstText(record.name_ar, record.nameAr, record.name, record.title_ar) || governorateFallback(numericId),
        nameEn: firstText(record.name_en, record.nameEn, record.title_en) || '',
      };
    })
    .filter((option): option is GovernorateOption => !!option);
}

export function normalizeDistricts(
  rows: unknown,
  governorate: GovernorateOption | null,
  districtFallback: (id: number) => string,
): DistrictOption[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const numericId = Number(record.id);
      if (!Number.isInteger(numericId) || numericId <= 0) return null;

      const anchor = getRowAnchor(record);

      return {
        id: String(numericId),
        numericId,
        governorateId: String(record.governorate_id || governorate?.id || ''),
        governorateAr: governorate?.nameAr || '',
        governorateEn: governorate?.nameEn || '',
        districtAr: firstText(record.name_ar, record.nameAr, record.name, record.title_ar) || districtFallback(numericId),
        districtEn: firstText(record.name_en, record.nameEn, record.title_en) || '',
        anchor,
        tortuosityFactor: firstNumber(record.tortuosity_factor, record.road_factor, record.factor) ?? 1.3,
      };
    })
    .filter((option): option is DistrictOption => !!option);
}

export function getRowAnchor(row: Record<string, unknown>): RiderLocation | null {
  const lat = firstNumber(row.lat, row.latitude, row.anchor_lat, row.center_lat, row.centroid_lat, row.location_lat);
  const lng = firstNumber(row.lng, row.lon, row.longitude, row.anchor_lng, row.anchor_lon, row.center_lng, row.centroid_lng, row.location_lng);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

export function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

export function slugifyLocationPart(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'external-location';
}

export function buildRiderDestination(
  destination: DistrictOption,
  origin: RiderLocation,
  serverEstimatedFare: number | null,
  preciseDestination: RiderLocation,
  roadDistanceKm: number | null = null,
  h3Resolution = 9,
): RiderDestination {
  if (!preciseDestination) {
    throw new Error('destination_missing_coordinates');
  }

  const localFareQuote = calculateSovereignFareQuote(origin, preciseDestination, destination.tortuosityFactor);
  const fareQuote = roadDistanceKm === null
    ? localFareQuote
    : { ...localFareQuote, estimatedRoadDistanceKm: roadDistanceKm };

  return {
    id: destination.id,
    label: `${destination.districtAr} - ${destination.governorateAr}`,
    governorate: destination.governorateAr,
    district: destination.districtAr,
    coords: preciseDestination,
    tortuosityFactor: destination.tortuosityFactor,
    fareQuote,
    serverEstimatedFare: serverEstimatedFare ?? undefined,
    originCell: latLngToCell(origin.lat, origin.lng, h3Resolution),
    destinationCell: latLngToCell(preciseDestination.lat, preciseDestination.lng, h3Resolution),
  };
}

export function buildFareRequestKey(origin: RiderLocation, destination: RiderLocation, countryId: unknown) {
  return [
    Number(countryId) || 'no-country',
    origin.lat.toFixed(6),
    origin.lng.toFixed(6),
    destination.lat.toFixed(6),
    destination.lng.toFixed(6),
  ].join(':');
}
