import type { Trip } from '@/core/types';
import { buildGoogleMapsUrl, isValidCoordinatePair, normalizeExternalMapUrl } from './ride-location';
import { toEpochMs } from '@/shared/services/trip-countdown';

export type RideOfferRow = Record<string, unknown>;
export type RideRequestRow = Record<string, unknown>;

export const MIN_OFFER_WAIT_SECONDS = 5;
export const DEFAULT_OFFER_WAIT_SECONDS = 120;
export const MAX_OFFER_WAIT_SECONDS = 180;

export function describeOfferSubmitError(rawMessage: string | undefined, t: any) {
  const message = String(rawMessage || '');
  const limit = message.match(/:\s*([\d.]+)\s*$/)?.[1];

  if (message.includes('captain_too_far_from_pickup')) {
    return {
      title: t('errorTooFarTitle'),
      description: t('errorTooFarDesc'),
    };
  }

  if (message.includes('offer_below_market_floor')) {
    return {
      title: t('errorBelowFloorTitle'),
      description: limit
        ? t('errorBelowFloorDescDynamic', { limit })
        : t('errorBelowFloorDescStatic'),
    };
  }

  if (message.includes('offer_above_rank_ceiling')) {
    return {
      title: t('errorAboveCeilingTitle'),
      description: limit
        ? t('errorAboveCeilingDescDynamic', { limit })
        : t('errorAboveCeilingDescStatic'),
    };
  }

  return {
    title: t('errorSubmitFailedTitle'),
    description: t('errorSubmitFailedDesc'),
  };
}

export function mapRideRequestToTrip(row: RideRequestRow | null): Trip | null {
  if (!row) return null;
  const id = String(row.id || '');
  const riderId = String(row.rider_id || '');
  const originLat = toNumber(row.origin_lat);
  const originLng = toNumber(row.origin_lng);
  if (!id || !riderId || !isValidCoordinatePair(originLat, originLng)) return null;

  const safeOriginLat = originLat as number;
  const safeOriginLng = originLng as number;
  const pickupGoogleMapsUrl = normalizeExternalMapUrl(row.origin_google_maps_url) || buildGoogleMapsUrl(safeOriginLat, safeOriginLng) || undefined;
  const estimatedDistance = firstPositiveNumber(row.estimated_distance_km, row.route_distance_km, row.trip_distance_km);
  const estimatedTime = firstPositiveNumber(row.estimated_duration_minutes, row.route_duration_minutes, row.trip_duration_minutes);
  const pickupEtaMinutes = firstPositiveNumber(row.pickup_eta_minutes, row.pickup_eta, row.pickup_eta_min, row.eta);
  const destinationLat = toNumber(row.destination_lat);
  const destinationLng = toNumber(row.destination_lng);

  return {
    id,
    riderId,
    driverId: String(row.accepted_captain_id || ''),
    status: mapRideRequestStatusToTripStatus(row.status),
    pickupCoords: { lat: safeOriginLat, lng: safeOriginLng },
    exactPickupCoords: { lat: safeOriginLat, lng: safeOriginLng },
    pickupLabel: String(row.origin_address || ''),
    pickupGoogleMapsUrl,
    pickupLocationIsApproximate: false,
    h3Index: String(row.origin_h3 || ''),
    gridId: String(row.origin_h3 || id),
    dropoff: String(row.destination_address_ar || row.destination_address || 'Destination'),
    dropoffCoords: isValidCoordinatePair(destinationLat, destinationLng)
      ? { lat: destinationLat as number, lng: destinationLng as number }
      : undefined,
    estimatedDistance: estimatedDistance ?? undefined,
    estimatedTime: estimatedTime ?? undefined,
    estimatedDurationMinutes: toNumber(row.estimated_duration_minutes) ?? estimatedTime ?? undefined,
    pickup_eta_minutes: pickupEtaMinutes ?? undefined,
    offerPrice: toNumber(row.final_fare) ?? toNumber(row.offered_fare) ?? toNumber(row.offer_price) ?? toNumber(row.server_estimated_fare) ?? undefined,
    createdAt: String(row.created_at || ''),
    acceptedAtMs: toEpochMs(row.accepted_at) || undefined,
    arrivedAtMs: toEpochMs(row.arrived_at) || undefined,
    startedAtMs: toEpochMs(row.started_at) || undefined,
    pricingPreference: (['APP', 'TAXI', 'FREE'].includes(String(row.pricing_preference || '').toUpperCase())
      ? String(row.pricing_preference).toUpperCase() as 'APP' | 'TAXI' | 'FREE'
      : null),
    seats: toNumber(row.number_of_riders) ?? toNumber(row.seats) ?? 1,
  };
}

export function mapRideRequestStatusToTripStatus(value: unknown): Trip['status'] {
  const status = String(value || '').toUpperCase();

  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'ARRIVED') return 'arrived';
  if (status === 'TRIP_ACTIVE' || status === 'ACTIVE' || status === 'STARTED' || status === 'IN_PROGRESS') {
    return 'in_progress';
  }
  if (status === 'ACCEPTED' || status === 'EN_ROUTE') return 'accepted';

  return 'busy';
}

export function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function firstPositiveNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return null;
}

export function isAlreadyClosedTripError(error: unknown) {
  const typedError = error as { message?: string; details?: string; code?: string } | null;
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('ride_request_not_active') ||
    message.includes('completed') ||
    message.includes('cancelled') ||
    message.includes('not active')
  );
}
