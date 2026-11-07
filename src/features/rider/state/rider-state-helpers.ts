import { toEpochMs } from '@/shared/services/trip-countdown';
import type {
  RiderDestination,
  RiderActiveTrip,
  RiderMachineState,
} from './rider-state-types';

export function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

export function extractRowStartTime(row?: Record<string, unknown> | null): number {
  const rowCreatedAt = row?.created_at ? new Date(row.created_at as string).getTime() : Date.now();
  return Number.isFinite(rowCreatedAt) && rowCreatedAt > 0 ? rowCreatedAt : Date.now();
}

export function buildDestinationFromRow(
  requestId: string,
  row: Record<string, unknown> | undefined
): RiderDestination | null {
  if (!row) return null;

  const label = firstString(
    row.destination_address_ar,
    row.destination_address,
    row.destination_address_en
  );
  const lat = firstNumber(row.destination_lat);
  const lng = firstNumber(row.destination_lng);

  if (!label && (lat === null || lng === null)) return null;

  return {
    id: requestId,
    label: label || '',
    governorate: '',
    district: '',
    coords: {
      lat: lat ?? 0,
      lng: lng ?? 0,
    },
    serverEstimatedFare: firstNumber(row.server_estimated_fare) ?? undefined,
    originCell: firstString(row.origin_h3) || undefined,
    destinationCell: firstString(row.destination_h3) || undefined,
  };
}

export function buildActiveTrip(
  state: RiderMachineState,
  acceptedRow: Record<string, unknown>
): RiderActiveTrip | null {
  const existing = state.activeTrip;
  const acceptedOfferId =
    firstString(acceptedRow.accepted_offer_id, acceptedRow.offer_id, acceptedRow.selected_offer_id) ||
    state.pendingAcceptedOfferId;
  const acceptedCaptainId = firstString(
    acceptedRow.accepted_driver_id,
    acceptedRow.driver_id,
    acceptedRow.captain_id,
    acceptedRow.accepted_captain_id
  );
  const selectedOffer = state.offers.find(
    (offer) =>
      offer.id === acceptedOfferId ||
      offer.driverId === acceptedOfferId ||
      offer.driverId === acceptedCaptainId
  );

  if (!selectedOffer && !acceptedCaptainId && !existing) return null;

  const vehicle = selectedOffer?.driverVehicle || {};
  const distanceKm =
    state.destination?.fareQuote?.estimatedRoadDistanceKm ??
    firstNumber(acceptedRow.estimated_distance_km, acceptedRow.route_distance_km) ??
    existing?.distanceKm ??
    0;
  const estimatedTripMinutes =
    firstNumber(
      acceptedRow.estimated_duration_minutes,
      acceptedRow.route_duration_minutes,
      acceptedRow.trip_duration_minutes
    ) ??
    existing?.tripDurationMinutes ??
    Math.max(1, Math.ceil((distanceKm || 2) * 1.5));

  const rowCaptain = (acceptedRow.captain || acceptedRow.captain_profile) as Record<string, any> | undefined;

  return {
    tripId:
      firstString(acceptedRow.trip_id, acceptedRow.active_trip_id, acceptedRow.id) ||
      existing?.tripId ||
      state.requestId ||
      '',
    captainId: selectedOffer?.driverId || acceptedCaptainId || existing?.captainId || '',
    captainName:
      selectedOffer?.captain?.full_name ||
      selectedOffer?.captain?.nickname ||
      rowCaptain?.full_name ||
      rowCaptain?.nickname ||
      selectedOffer?.driverName ||
      firstString(acceptedRow.driver_name, acceptedRow.captain_name) ||
      existing?.captainName ||
      'السائق',
    captainSerial:
      selectedOffer?.driverName ||
      firstString(acceptedRow.driver_serial, acceptedRow.captain_serial, acceptedRow.driver_name, acceptedRow.captain_name) ||
      acceptedCaptainId ||
      existing?.captainSerial ||
      'السائق',
    captainPhone:
      selectedOffer?.driverAffiliation?.phone ||
      firstString(acceptedRow.driver_phone, acceptedRow.captain_phone, acceptedRow.phone) ||
      existing?.captainPhone ||
      '',
    vehicleType:
      vehicle.type ||
      `${vehicle.make || 'سيارة'} ${vehicle.color || ''}`.trim() ||
      existing?.vehicleType ||
      'سيارة',
    vehiclePlate:
      vehicle.plate ||
      firstString(acceptedRow.vehicle_plate, acceptedRow.plate) ||
      existing?.vehiclePlate ||
      'غير متاح',
    finalPrice:
      firstNumber(
        acceptedRow.final_fare,
        acceptedRow.final_price,
        acceptedRow.accepted_price,
        acceptedRow.offer_price,
        acceptedRow.server_estimated_fare
      ) ??
      (selectedOffer?.price === -1
        ? state.destination?.serverEstimatedFare ?? 0
        : selectedOffer?.price ?? state.destination?.serverEstimatedFare ?? existing?.finalPrice ?? 0),
    destinationLabel:
      state.destination?.label ||
      firstString(acceptedRow.destination_address_ar, acceptedRow.destination_address, acceptedRow.destination_address_en) ||
      existing?.destinationLabel ||
      'وجهة',
    distanceKm,
    originCell: state.destination?.originCell ?? state.destination?.fareQuote?.originCell ?? existing?.originCell,
    destinationCell: state.destination?.destinationCell ?? state.destination?.fareQuote?.destinationCell ?? existing?.destinationCell,
    tortuosityFactor: state.destination?.fareQuote?.tortuosityFactor ?? existing?.tortuosityFactor,
    etaSeconds: Math.round(estimatedTripMinutes * 60) || existing?.etaSeconds || 120,
    startedAt: existing?.startedAt ?? Date.now(),
    acceptedAtMs: toEpochMs(acceptedRow.accepted_at) ?? existing?.acceptedAtMs,
    arrivedAtMs: toEpochMs(acceptedRow.arrived_at) ?? existing?.arrivedAtMs,
    startedAtMs: toEpochMs(acceptedRow.started_at) ?? existing?.startedAtMs,
    pickupEtaMinutes: firstNumber(acceptedRow.pickup_eta_minutes, selectedOffer?.pickup_eta_minutes) ?? existing?.pickupEtaMinutes,
    tripDurationMinutes: estimatedTripMinutes,
    captain: selectedOffer?.captain || rowCaptain || existing?.captain || null,
    status: String(acceptedRow.status || existing?.status || 'ACCEPTED').toUpperCase(),
    cancel_requested_by: (acceptedRow.cancel_requested_by as any) ?? existing?.cancel_requested_by ?? null,
  };
}
