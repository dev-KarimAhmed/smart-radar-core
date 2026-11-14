import { useMemo } from 'react';
import {
  HISTORY_TTL_MS,
  type HistoricalTrip,
  getCaptainIdFromTrip,
  getHistoryCaptainName,
  getHistoryCaptainRank,
  getHistoryCaptainPhone,
  getHistoryVehicleInfo,
  parseTripTimestamp,
} from '../history-shared';

interface UseHistoryTripMappersProps {
  realTrips: any[];
  isArabic: boolean;
}

export function useHistoryTripMappers({ realTrips, isArabic }: UseHistoryTripMappersProps) {
  const THREE_DAYS_MS = HISTORY_TTL_MS;
  const now = Date.now();

  const riderHistoricalTrips = useMemo<HistoricalTrip[]>(() => {
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
    return all.filter((trip) => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now]);

  const captainHistoricalTrips = useMemo(() => {
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
    return all.filter((trip) => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now, isArabic]);

  return {
    riderHistoricalTrips,
    captainHistoricalTrips,
  };
}
