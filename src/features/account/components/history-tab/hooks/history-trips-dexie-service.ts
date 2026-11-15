import { dexieDb } from '@/lib/dexie-db';
import { fetchRowsByIds, fetchSafeCounterpartProfilesMap } from '../history-shared';

export async function readLocalDexieTrips(
  isCaptain: boolean,
  isArabic: boolean,
  cutoffMs: number,
): Promise<any[]> {
  try {
    if (isCaptain) {
      const localCaptain = await dexieDb.captainLedger.toArray();
      const validCaptain = localCaptain.filter((entry) => entry.completedAt >= cutoffMs);
      const expiredCaptain = localCaptain.filter((entry) => entry.completedAt < cutoffMs);
      if (expiredCaptain.length > 0) {
        void Promise.all(expiredCaptain.map((e) => dexieDb.captainLedger.delete(e.requestId)));
      }

      if (validCaptain.length > 0) {
        return validCaptain.map((entry) => ({
          id: entry.requestId,
          status: 'COMPLETED',
          completed_at: new Date(entry.completedAt).toISOString(),
          created_at: new Date(entry.completedAt).toISOString(),
          final_fare: entry.finalFare,
          rider: { full_name: isArabic ? 'مستخدم محلي' : 'Local Rider', phone: '', rating: 5.0 },
          destination_address_ar: (entry.destination && entry.destination !== 'Destination' && entry.destination !== 'غير متاح') ? entry.destination : '',
          pickup_address_ar: entry.pickup || '',
          trip_fare: entry.finalFare,
        } as any));
      }
    } else {
      const localRider = await dexieDb.riderTripLedger.toArray();
      const validRider = localRider.filter((entry) => entry.timestamp >= cutoffMs);
      const expiredRider = localRider.filter((entry) => entry.timestamp < cutoffMs);
      if (expiredRider.length > 0) {
        void Promise.all(expiredRider.map((e) => dexieDb.riderTripLedger.delete(e.tripId)));
      }

      if (validRider.length > 0) {
        return validRider.map((entry) => ({
          id: entry.tripId,
          status: 'COMPLETED',
          completed_at: new Date(entry.timestamp).toISOString(),
          created_at: new Date(entry.timestamp).toISOString(),
          final_fare: entry.finalPrice,
          accepted_captain_id: entry.captainId,
          captain: {
            id: entry.captainId,
            full_name: entry.captainName,
            phone: entry.captainPhone,
            rating: 5.0,
            rank: entry.captainRank,
          },
          vehicle: entry.vehicleInfo ? { model: entry.vehicleInfo } : undefined,
          destination_address_ar: entry.destinationAddressAr || 'رحلة سابقة',
          destination_address: entry.destinationAddressAr || 'رحلة سابقة',
          pickup_address_ar: entry.pickupAddressAr || '',
          pickup_address: entry.pickupAddressAr || '',
          distance_km: entry.distanceKm,
          duration_minutes: entry.durationMinutes,
          origin_lat: entry.originLat,
          origin_lng: entry.originLng,
          destination_lat: entry.destinationLat,
          destination_lng: entry.destinationLng,
          trip_fare: entry.finalPrice,
        } as any));
      }
    }
  } catch (cacheErr) {
    if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab Cache-First read error]', cacheErr);
  }

  return [];
}

export async function mergeLocalDexieTrips(
  fetchedData: any[],
  isCaptain: boolean,
  isArabic: boolean,
  cutoffMs: number,
): Promise<any[]> {
  const merged = [...fetchedData];
  try {
    if (isCaptain) {
      const rawCaptainTrips = await dexieDb.captainLedger.toArray();
      const localCaptainTrips = rawCaptainTrips.filter((entry) => entry.completedAt >= cutoffMs);
      const localMapped = localCaptainTrips.map((entry) => {
        const cleanDest = (entry.destination && entry.destination !== 'Destination' && entry.destination !== 'غير محدد') ? entry.destination : '';
        const cleanPick = (entry.pickup && entry.pickup !== 'موقعي الحالي') ? entry.pickup : '';
        const riderId = entry.riderId || '';
        return {
          id: entry.requestId,
          request_id: entry.requestId,
          rider_id: riderId,
          riderId,
          status: 'COMPLETED',
          completed_at: new Date(entry.completedAt).toISOString(),
          created_at: new Date(entry.completedAt).toISOString(),
          final_fare: entry.finalFare,
          rider: {
            id: riderId,
            full_name: (entry as any).riderName || (isArabic ? 'مستخدم محلي' : 'Local Rider'),
            phone: (entry as any).riderPhone || '',
            rating: 5.0,
          },
          destination_address_ar: cleanDest,
          destination_address: cleanDest,
          pickup_address_ar: cleanPick,
          pickup_address: cleanPick,
          metadata: {
            rider_id: riderId,
            riderId,
            pickup_address_ar: cleanPick,
            destination_address_ar: cleanDest,
          },
        };
      });

      const seenIds = new Set(merged.map((r) => r.id));
      for (const item of localMapped) {
        if (!seenIds.has(item.id)) {
          merged.push(item);
          seenIds.add(item.id);
        }
      }

      const unpopulatedRiderIds = Array.from(new Set(
        merged
          .filter((r) => (r.rider_id || r.riderId) && (!r.rider?.full_name || r.rider.full_name === 'مستخدم محلي' || r.rider.full_name === 'Local Rider'))
          .map((r) => r.rider_id || r.riderId)
          .filter(Boolean),
      ));
      if (unpopulatedRiderIds.length > 0) {
        try {
          const riderMap =
            (await fetchSafeCounterpartProfilesMap(unpopulatedRiderIds)) ??
            (await fetchRowsByIds('profiles', unpopulatedRiderIds));
          return merged.map((item) => {
            const targetRiderId = item.rider_id || item.riderId;
            if (targetRiderId && riderMap.has(targetRiderId)) {
              const prof = riderMap.get(targetRiderId);
              return {
                ...item,
                rider: {
                  ...item.rider,
                  id: targetRiderId,
                  full_name: prof.full_name || item.rider?.full_name,
                  phone: prof.phone || item.rider?.phone,
                },
              };
            }
            return item;
          });
        } catch {}
      }
    } else {
      const rawRiderTrips = await dexieDb.riderTripLedger.toArray();
      const localRiderTrips = rawRiderTrips.filter((entry) => entry.timestamp >= cutoffMs);
      const localMapped = localRiderTrips.map((entry) => ({
        id: entry.tripId,
        captain_id: entry.captainId,
        status: 'COMPLETED',
        completed_at: new Date(entry.timestamp).toISOString(),
        created_at: new Date(entry.timestamp).toISOString(),
        final_fare: entry.finalPrice,
        captain: {
          id: entry.captainId,
          full_name: entry.captainName,
          phone: entry.captainPhone,
          rating: entry.captainRank === 'DIAMOND' ? 5.0 : entry.captainRank === 'PLATINUM' ? 4.8 : entry.captainRank === 'GOLD' ? 4.5 : 4.0,
          rank: entry.captainRank,
        },
        destination_address_ar: entry.destinationAddressAr || '',
        destination_address: entry.destinationAddressAr || '',
        pickup_address_ar: entry.pickupAddressAr || '',
        pickup_address: entry.pickupAddressAr || '',
        distance_km: entry.distanceKm,
        duration_minutes: entry.durationMinutes,
        origin_lat: entry.originLat,
        origin_lng: entry.originLng,
        destination_lat: entry.destinationLat,
        destination_lng: entry.destinationLng,
        metadata: {
          vehicle_info: entry.vehicleInfo,
          destination_address_ar: entry.destinationAddressAr,
          pickup_address_ar: entry.pickupAddressAr,
        },
      }));

      const seenIds = new Set(merged.map((r) => r.id));
      for (const item of localMapped) {
        if (!seenIds.has(item.id)) {
          merged.push(item);
          seenIds.add(item.id);
        }
      }
    }
  } catch (dexieError) {
    if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab Dexie Merge Failed]', dexieError);
  }

  return merged;
}
