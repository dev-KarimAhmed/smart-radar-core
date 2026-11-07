import { cellToLatLng, isValidCell } from 'h3-js';
import type { Trip } from '@/core/types';
import {
  buildGoogleMapsUrl,
  estimateHaversineDistanceKm,
  isValidCoordinatePair,
  normalizeExternalMapUrl,
} from './ride-location';

export type RideRequestRow = Record<string, unknown>;
export type RadarLocation = { lat: number; lng: number; speed?: number; source?: string };

export function playSystemNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    void audio.play().catch(() => {});
  } catch {}
}

export function getRowAnchor(row: Record<string, unknown> | null): RadarLocation | null {
  if (!row) return null;

  const lat =
    toNumber(row.lat) ??
    toNumber(row.latitude) ??
    toNumber(row.anchor_lat) ??
    toNumber(row.center_lat) ??
    toNumber(row.centroid_lat) ??
    toNumber(row.location_lat);
  const lng =
    toNumber(row.lng) ??
    toNumber(row.lon) ??
    toNumber(row.longitude) ??
    toNumber(row.anchor_lng) ??
    toNumber(row.anchor_lon) ??
    toNumber(row.center_lng) ??
    toNumber(row.centroid_lng) ??
    toNumber(row.location_lng);

  if (lat === null || lng === null) return null;
  return { lat, lng, source: 'profile' };
}

export function mapRideRequestToTrip(row: RideRequestRow): Trip | null {
  const id = stringify(row.id);
  if (!id) return null;

  const riderId = stringify(row.rider_id) || `pending-rider-${id}`;
  const originLat = toNumber(row.origin_lat);
  const originLng = toNumber(row.origin_lng);
  const originH3 = stringify(row.h3_cell) || stringify(row.origin_h3);
  const hasExactOrigin = isValidCoordinatePair(originLat, originLng);
  const hasValidOriginH3 = Boolean(originH3 && isValidCell(originH3));
  if (!hasExactOrigin && !hasValidOriginH3) return null;

  const [h3Lat, h3Lng] = hasValidOriginH3 ? cellToLatLng(originH3) : [null, null];
  const visibleLat = hasExactOrigin ? originLat : h3Lat;
  const visibleLng = hasExactOrigin ? originLng : h3Lng;
  if (!isValidCoordinatePair(visibleLat, visibleLng)) return null;

  const destinationLabel =
    stringify(row.destination_address_ar) ||
    stringify(row.destination_address_en) ||
    stringify(row.destination_address) ||
    'وجهة المستخدم';

  const fare = toNumber(row.server_fare) ?? toNumber(row.server_estimated_fare);
  const destinationLat = toNumber(row.destination_lat);
  const destinationLng = toNumber(row.destination_lng);
  const storedDistanceKm = firstPositiveNumber(row.estimated_distance_km, row.route_distance_km, row.trip_distance_km);
  const distanceKm =
    storedDistanceKm ??
    (hasExactOrigin ? estimateHaversineDistanceKm(originLat, originLng, destinationLat, destinationLng) : null);
  const storedDurationMinutes = firstPositiveNumber(
    row.estimated_duration_minutes,
    row.route_duration_minutes,
    row.trip_duration_minutes
  );
  const exactPickupMapUrl = normalizeExternalMapUrl(row.origin_google_maps_url);
  const safeVisibleLat = visibleLat as number;
  const safeVisibleLng = visibleLng as number;
  const safeOriginLat = originLat as number;
  const safeOriginLng = originLng as number;
  const pickupGoogleMapsUrl =
    exactPickupMapUrl || (hasExactOrigin ? buildGoogleMapsUrl(safeOriginLat, safeOriginLng) : null) || undefined;

  return {
    id,
    riderId,
    status: 'searching',
    pickupCoords: { lat: safeVisibleLat, lng: safeVisibleLng },
    exactPickupCoords: hasExactOrigin ? { lat: safeOriginLat, lng: safeOriginLng } : undefined,
    obfuscatedPickupCoords: hasExactOrigin ? undefined : { lat: safeVisibleLat, lng: safeVisibleLng },
    pickupLabel: stringify(row.origin_address),
    pickupGoogleMapsUrl,
    pickupLocationIsApproximate: !exactPickupMapUrl || !hasExactOrigin,
    h3Index: originH3,
    gridId: originH3 || id,
    dropoff: destinationLabel,
    riderRating: toNumber(row.rider_rating) ?? undefined,
    riderRatingCount: toNumber(row.rider_rating_count) ?? undefined,
    riderCompletedTrips: toNumber(row.rider_completed_trips) ?? undefined,
    riderFavoritedMe: row.rider_favorited_me === true,
    estimatedDistance: distanceKm ?? undefined,
    estimatedTime: storedDurationMinutes ?? (distanceKm ? Math.max(1, Math.round(distanceKm * 2.5)) : undefined),
    seats: toNumber(row.number_of_riders) ?? toNumber(row.seats) ?? toNumber((row as any).passengers) ?? 1,
    offerPrice: fare ?? undefined,
    createdAt: stringify(row.created_at),
    district: destinationLabel || originH3,
    pricingPreference: ['APP', 'TAXI', 'FREE'].includes(String(row.pricing_preference || '').toUpperCase())
      ? (String(row.pricing_preference).toUpperCase() as 'APP' | 'TAXI' | 'FREE')
      : null,
  };
}

export function stringify(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function firstPositiveNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return null;
}
