import type { HistoricalTrip } from './history-shared';
import type { LinkedCaptainInfo } from '@/features/referral/services/captain-referral';
import {
  getCaptainIdFromTrip,
  getHistoryCaptainName,
  getHistoryCaptainRank,
  getHistoryCaptainPhone,
  getHistoryVehicleInfo,
  parseTripTimestamp,
} from './history-shared';

export function buildRiderHistoricalTrips(
  realTrips: any[],
  now: number,
  maxAgeMs: number
): HistoricalTrip[] {
  const combinedReal = realTrips.map((trip) => {
    const acceptedOffer = trip.offers?.find((o: any) => o.driverId === trip.driverId) || trip.acceptedOffer;
    return {
      tripId: trip.id,
      captainId: getCaptainIdFromTrip(trip),
      serialId: trip.serial_id || trip.serialId || (trip.id ? ('T-' + String(trip.id).slice(0, 4).toUpperCase()) : 'T-TRIP'),
      captainName: getHistoryCaptainName(trip, acceptedOffer),
      captainRank: getHistoryCaptainRank(trip, acceptedOffer),
      captainPhone: getHistoryCaptainPhone(trip, acceptedOffer),
      vehicleInfo: getHistoryVehicleInfo(trip, acceptedOffer),
      finalPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
      timestamp: parseTripTimestamp(trip),
      pickupAddress: trip.pickup_address_ar || trip.pickup_address || trip.origin_address || trip.metadata?.pickup_address_ar || '',
      destinationAddress: trip.destination_address_ar || trip.destination_address || trip.destinationAddress || trip.metadata?.destination_address_ar || trip.destination || '',
      distanceKm: trip.distance_km ?? trip.distanceKm ?? (trip.distance_meters ? Number((trip.distance_meters / 1000).toFixed(1)) : undefined),
      durationMinutes: trip.duration_minutes ?? trip.metadata?.duration_minutes,
      originLat: trip.origin_lat ?? trip.originLat ?? trip.metadata?.origin_lat,
      originLng: trip.origin_lng ?? trip.originLng ?? trip.metadata?.origin_lng,
      destinationLat: trip.destination_lat ?? trip.destinationLat ?? trip.metadata?.destination_lat,
      destinationLng: trip.destination_lng ?? trip.destinationLng ?? trip.metadata?.destination_lng,
    };
  });

  const all = [...combinedReal];
  all.sort((a, b) => b.timestamp - a.timestamp);
  return all.filter((trip) => (now - trip.timestamp) < maxAgeMs);
}

export function buildFavoriteCaptains({
  favoriteCaptainIds,
  dexieFavorites,
  riderHistoricalTrips,
  linkedCaptain,
  defaultCaptainName,
  isArabic,
}: {
  favoriteCaptainIds: Set<string>;
  dexieFavorites: any[];
  riderHistoricalTrips: HistoricalTrip[];
  linkedCaptain: LinkedCaptainInfo | null;
  defaultCaptainName: string;
  isArabic: boolean;
}) {
  const byCaptain = new Map<string, HistoricalTrip>();
  for (const trip of riderHistoricalTrips) {
    const captainId = String(trip.captainId || '');
    if (!captainId || !favoriteCaptainIds.has(captainId)) continue;
    if (!byCaptain.has(captainId)) {
      const isReferred = Boolean(linkedCaptain?.is_linked && linkedCaptain.captain_id === captainId);
      byCaptain.set(captainId, {
        ...trip,
        isReferredCaptain: isReferred,
      } as any);
    }
  }

  for (const fav of dexieFavorites) {
    const captainId = String(fav.captainId || '');
    if (!captainId || !favoriteCaptainIds.has(captainId)) continue;
    if (!byCaptain.has(captainId)) {
      const isReferred = Boolean(linkedCaptain?.is_linked && linkedCaptain.captain_id === captainId);
      byCaptain.set(captainId, {
        tripId: fav.tripId || `fav_${captainId}`,
        captainId,
        serialId: fav.serialId || ('C-' + captainId.slice(0, 4).toUpperCase()),
        captainName: fav.captainName || (isArabic ? 'كابتن معتمد' : 'Verified Captain'),
        captainRank: fav.captainRank || 'PLATINUM',
        captainPhone: fav.captainPhone || '',
        vehicleInfo: fav.vehicleInfo || (isArabic ? 'مركبة معتمدة' : 'Verified Vehicle'),
        finalPrice: fav.finalPrice || 0,
        timestamp: fav.timestamp || Date.now(),
        isReferredCaptain: isReferred,
      } as any);
    }
  }

  if (
    linkedCaptain?.is_linked &&
    linkedCaptain.captain_id &&
    favoriteCaptainIds.has(linkedCaptain.captain_id) &&
    !byCaptain.has(linkedCaptain.captain_id)
  ) {
    byCaptain.set(linkedCaptain.captain_id, {
      tripId: 'referral-' + linkedCaptain.captain_id,
      captainId: linkedCaptain.captain_id,
      serialId: linkedCaptain.captain_serial || '',
      captainName: linkedCaptain.captain_name || defaultCaptainName,
      captainRank: 'GOLD',
      captainPhone: linkedCaptain.captain_phone || '',
      vehicleInfo: '',
      finalPrice: 0,
      timestamp: linkedCaptain.linked_at ? new Date(linkedCaptain.linked_at).getTime() : Date.now(),
      isReferredCaptain: true,
    } as any);
  }

  for (const captainId of favoriteCaptainIds) {
    if (!byCaptain.has(captainId)) {
      const isReferred = Boolean(linkedCaptain?.is_linked && linkedCaptain.captain_id === captainId);
      byCaptain.set(captainId, {
        tripId: `fav_${captainId}`,
        captainId,
        serialId: 'C-' + captainId.slice(0, 4).toUpperCase(),
        captainName: isArabic ? 'كابتن معتمد' : 'Verified Captain',
        captainRank: 'PLATINUM',
        captainPhone: '',
        vehicleInfo: isArabic ? 'مركبة معتمدة' : 'Verified Vehicle',
        finalPrice: 0,
        timestamp: Date.now(),
        isReferredCaptain: isReferred,
      } as any);
    }
  }

  return [...byCaptain.entries()].map(([captainId, trip]) => ({
    ...trip,
    id: captainId,
    captainId,
  }));
}

export function buildCaptainHistoricalTrips(
  realTrips: any[],
  now: number,
  maxAgeMs: number,
  isArabic: boolean
) {
  const combinedReal = realTrips.map((trip) => {
    const rawPickup = trip.metadata?.pickup_address_ar || trip.pickup_address_ar || trip.pickup || trip.origin_address;
    const cleanPickup = (!rawPickup || rawPickup === 'موقعي الحالي' || rawPickup === 'Current Location')
      ? (isArabic ? 'نقطة الانطلاق' : 'Pickup Location')
      : rawPickup;

    const rawDropoff = trip.destination_address_ar || trip.destination_address || trip.dropoff || trip.metadata?.destination_address_ar;
    const cleanDropoff = (!rawDropoff || rawDropoff === 'غير محدد' || rawDropoff === 'Unspecified' || rawDropoff === 'Destination' || rawDropoff === 'غير متاح')
      ? (isArabic ? 'وجهة الرحلة' : 'Trip Destination')
      : rawDropoff;

    return {
      tripId: trip.id,
      riderId: trip.rider?.id || trip.rider_id || trip.metadata?.rider_id || trip.riderId || '',
      riderPhone: trip.rider?.phone || trip.rider_phone || '',
      serialId: trip.serial_id || trip.serialId || (trip.id ? ('T-' + String(trip.id).slice(0, 4).toUpperCase()) : 'T-TRIP'),
      riderName: trip.rider?.full_name || trip.rider_name || trip.riderName || (isArabic ? 'مستخدم' : 'Rider'),
      pickup: cleanPickup,
      dropoff: cleanDropoff,
      earnedPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
      timestamp: parseTripTimestamp(trip),
      status: trip.status || 'COMPLETED',
    };
  });

  const all = [...combinedReal];
  all.sort((a, b) => b.timestamp - a.timestamp);
  return all.filter((trip) => (now - trip.timestamp) < maxAgeMs);
}
