import { type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { HISTORY_TTL_MS, UNAVAILABLE_FALLBACK } from './history-types-utils';
import {
  getCaptainIdFromTrip,
  getHistoryCaptainName,
  getHistoryCaptainRank,
  getHistoryCaptainPhone,
  getHistoryVehicleInfo,
} from './history-extractors';

export function parseTripTimestamp(trip: any): number {
  const raw = trip.completed_at ?? trip.completedAt ?? trip.created_at ?? trip.createdAt ?? trip.timestamp;
  if (typeof raw === 'number') return raw;
  if (raw?.seconds) return raw.seconds * 1000;
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getTripHistoryId(row: any): string {
  return String(row?.id || row?.request_id || row?.tripId || '');
}

export function appendUniqueTrips(existing: any[], incoming: any[]): any[] {
  const seen = new Set(existing.map(getTripHistoryId).filter(Boolean));
  const merged = [...existing];

  for (const row of incoming) {
    const id = getTripHistoryId(row);
    if (!id || seen.has(id)) continue;
    merged.push(row);
    seen.add(id);
  }

  return merged;
}

export function mapLedgerRowToTripShape(row: any, captain?: any, captainProfile?: any, rider?: any) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const vehicleInfo =
    metadata.vehicle_info ||
    metadata.vehicleInfo ||
    metadata.vehicle ||
    [
      metadata.vehicle_make || captainProfile?.vehicle_brand || captain?.vehicle_make || captain?.vehicle_brand,
      metadata.vehicle_model || captainProfile?.vehicle_model || captain?.vehicle_model,
      metadata.vehicle_color || captainProfile?.vehicle_color || captain?.vehicle_color,
      metadata.vehicle_year || captainProfile?.vehicle_year || captain?.vehicle_year,
      metadata.vehicle_plate || metadata.plate_number || captainProfile?.plate_number || captain?.vehicle_plate || captain?.plate_number,
    ]
      .filter(Boolean)
      .join(' - ');

  return {
    id: row.request_id || row.id,
    request_id: row.request_id,
    status: row.status || 'COMPLETED',
    completed_at: row.completed_at,
    created_at: row.completed_at || row.created_at,
    final_fare: row.final_fare,
    captain_id: row.captain_id,
    rider_id: row.rider_id,
    rider: rider || (row.rider_id ? {
      id: row.rider_id,
      full_name: metadata.rider_name || metadata.riderName || '',
    } : null),
    captain: captain || {
      id: row.captain_id,
      full_name: metadata.captain_name || metadata.captainName || 'Captain',
      phone: metadata.captain_phone || metadata.captainPhone || '',
      rating: metadata.captain_rating || metadata.captainRating || 5,
    },
    captain_profile: captainProfile || null,
    captain_rank: metadata.captain_rank || metadata.captainRank || captainProfile?.tier || captainProfile?.rank || captain?.tier || captain?.rank,
    destination_address_ar: metadata.destination_address_ar || metadata.destinationAddressAr || metadata.destination || '',
    destination_address: metadata.destination_address || metadata.destinationAddress || metadata.destination || '',
    metadata: {
      ...metadata,
      vehicle_info: vehicleInfo || UNAVAILABLE_FALLBACK,
    },
  };
}

export function tripShapeToRiderLedgerEntry(trip: any): RiderTripLedgerEntry | null {
  const tripId = getTripHistoryId(trip);
  const timestamp = parseTripTimestamp(trip);
  if (!tripId || !timestamp) return null;

  const acceptedOffer = trip.offers?.find((o: any) => o.driverId === trip.driverId) || trip.acceptedOffer;
  const vehicleInfo = getHistoryVehicleInfo(trip, acceptedOffer);
  const destinationAddress = trip.destination_address_ar || trip.destination_address || trip.destinationAddress || trip.metadata?.destination_address || trip.destination || '';
  const pickupAddress = trip.pickup_address_ar || trip.pickup_address || trip.pickupAddress || trip.origin_address || trip.metadata?.pickup_address_ar || '';
  const distanceKm = trip.distance_km ?? trip.distanceKm ?? (trip.distance_meters ? Number((trip.distance_meters / 1000).toFixed(1)) : undefined);
  const durationMinutes = trip.duration_minutes ?? trip.durationMinutes ?? trip.metadata?.duration_minutes;
  const captainRating = typeof trip.captain?.rating === 'number' ? trip.captain.rating : undefined;

  return {
    tripId,
    captainId: getCaptainIdFromTrip(trip),
    captainName: getHistoryCaptainName(trip, acceptedOffer),
    captainRank: getHistoryCaptainRank(trip, acceptedOffer),
    captainPhone: getHistoryCaptainPhone(trip, acceptedOffer),
    vehicleInfo,
    finalPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
    timestamp,
    purgeAt: timestamp + HISTORY_TTL_MS,
    destinationAddressAr: destinationAddress,
    pickupAddressAr: pickupAddress,
    distanceKm,
    durationMinutes,
    originLat: trip.origin_lat ?? trip.originLat ?? trip.metadata?.origin_lat,
    originLng: trip.origin_lng ?? trip.originLng ?? trip.metadata?.origin_lng,
    destinationLat: trip.destination_lat ?? trip.destinationLat ?? trip.metadata?.destination_lat,
    destinationLng: trip.destination_lng ?? trip.destinationLng ?? trip.metadata?.destination_lng,
    rating: captainRating,
  };
}
