import type { RoadRouteEstimate } from '@/lib/road-route';
import type { DistrictOption } from '../services/rider-destination-normalizers';
import type { RiderLocation } from '../components/rider-map';

export const FARE_RECALCULATION_DEBOUNCE_MS = 350;

export interface UseServerFareAndRouteParams {
  activeCountryId: number | undefined;
  riderLocation: RiderLocation;
  riderLocationStatus?: string;
  selectedDestinationCoords: RiderLocation | null;
  selectedDistrict: DistrictOption | null;
  destinationDataError: string | null;
  isDestinationPinMoving: boolean;
  trafficFactor?: number | null;
}

export interface ServerFareState {
  key: string;
  fare: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface RouteEstimateState {
  key: string;
  estimate: RoadRouteEstimate | null;
  isLoading: boolean;
}

/**
 * Validates whether coordinates represent a real GPS fix rather than
 * uninitialized or Cairo placeholder coordinates.
 */
export function isUsableRiderLocation(
  riderLocation: RiderLocation,
  riderLocationStatus?: string
): boolean {
  const isDummyCairo =
    Math.abs(riderLocation.lat - 30.0444) < 0.001 &&
    Math.abs(riderLocation.lng - 31.2357) < 0.001;

  return (
    Number.isFinite(riderLocation.lat) &&
    Number.isFinite(riderLocation.lng) &&
    (riderLocation.lat !== 0 || riderLocation.lng !== 0) &&
    (!isDummyCairo || riderLocationStatus === 'live')
  );
}

/**
 * Checks whether the destination is virtually identical to the origin.
 */
export function isNearbyOriginLocation(
  origin: RiderLocation,
  destination: RiderLocation
): boolean {
  return (
    Math.abs(destination.lat - origin.lat) < 0.0008 &&
    Math.abs(destination.lng - origin.lng) < 0.0008
  );
}
