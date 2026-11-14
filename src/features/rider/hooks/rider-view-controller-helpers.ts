import { RiderMachineState, RiderDestination } from '../state/rider-state-machine';
import { EmergencyContactTripContext } from './use-emergency-contact';
import { buildRiderDestination } from '../services/rider-destination-normalizers';

export function isJordanCoordinates(coords?: { lat: number; lng: number } | null): boolean {
  if (!coords) return false;
  return coords.lat >= 29.0 && coords.lat <= 33.5 && coords.lng >= 34.5 && coords.lng <= 39.5;
}

export function resolveActiveCountryId(
  userCountryId?: number | null,
  coords?: { lat: number; lng: number } | null
): number | undefined {
  if (typeof userCountryId === 'number') return userCountryId;
  return isJordanCoordinates(coords) ? 1 : undefined;
}

export function resolveRiderEmergencyContext(
  state: RiderMachineState,
  riderLocation?: { lat: number; lng: number }
): EmergencyContactTripContext {
  const activeTrip = state.activeTrip;
  const captain = activeTrip?.captain as any;

  return {
    captainId: activeTrip?.captainId || captain?.id || undefined,
    captainName:
      (captain?.nickname ||
        captain?.full_name ||
        captain?.name ||
        activeTrip?.captainName) ??
      undefined,
    captainPhone: (activeTrip?.captainPhone || captain?.phone) ?? undefined,
    captainSerial:
      (captain?.serial_number ||
        captain?.serial ||
        activeTrip?.captainSerial ||
        activeTrip?.captainId?.slice(0, 8).toUpperCase()) ??
      undefined,
    vehicleModel: (captain?.vehicle_model || activeTrip?.vehicleType) ?? undefined,
    vehiclePlate:
      (captain?.plate_number ||
        captain?.license_plate ||
        activeTrip?.vehiclePlate) ??
      undefined,
    vehicleColor: captain?.vehicle_color ?? undefined,
    destinationLabel:
      (activeTrip?.destinationLabel || state.destination?.label) ?? undefined,
    requestId: activeTrip?.tripId || state.requestId,
    riderLocation,
  };
}

export interface ResolveDraftDestinationParams {
  selectedDistrict: any;
  selectedDestinationCoords: { lat: number; lng: number } | null;
  riderLocation: { lat: number; lng: number };
  currentServerFare: number | null;
  distanceKm?: number | null;
  pinnedPlaceLabel?: string | null;
  destinationSearchStatus: string;
  destinationSearchQuery: string;
}

export function resolveSelectedDraftDestination({
  selectedDistrict,
  selectedDestinationCoords,
  riderLocation,
  currentServerFare,
  distanceKm,
  pinnedPlaceLabel,
  destinationSearchStatus,
  destinationSearchQuery,
}: ResolveDraftDestinationParams): RiderDestination | null {
  if (!selectedDistrict || !selectedDestinationCoords) return null;
  const builtDestination = buildRiderDestination(
    selectedDistrict,
    riderLocation,
    currentServerFare,
    selectedDestinationCoords,
    distanceKm ?? null,
    undefined,
    pinnedPlaceLabel,
  );
  return destinationSearchStatus === 'selected' && destinationSearchQuery.trim()
    ? { ...builtDestination, label: destinationSearchQuery.trim() }
    : builtDestination;
}
