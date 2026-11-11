import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { supabase } from '@/lib/supabase-client';
import {
  fetchRowsByIds,
  fetchSafeCaptainCardsMap,
  fetchSafeCounterpartProfilesMap,
  enrichCaptainDetails,
  appendUniqueTrips,
  mapLedgerRowToTripShape,
  tripShapeToRiderLedgerEntry,
} from './history-shared';

interface LoadHistoryOptions {
  userId: string;
  isCaptain: boolean;
  isArabic: boolean;
  cutoffMs: number;
  onLocalTripsLoaded?: (trips: any[]) => void;
}

export async function fetchTripHistoryData({
  userId,
  isCaptain,
  isArabic,
  cutoffMs,
  onLocalTripsLoaded,
}: LoadHistoryOptions): Promise<{ trips: any[]; reviews: Record<string, any> }> {
  // [ACT-SSOT-04] Offline-First / Cache-First: immediately read and render local Dexie trips
  try {
    if (isCaptain) {
      const localCaptain = await dexieDb.captainLedger.toArray();
      const validCaptain = localCaptain.filter((entry) => entry.completedAt >= cutoffMs);
      const expiredCaptain = localCaptain.filter((entry) => entry.completedAt < cutoffMs);
      if (expiredCaptain.length > 0) {
        void Promise.all(expiredCaptain.map((e) => dexieDb.captainLedger.delete(e.requestId)));
      }

      if (validCaptain.length > 0 && onLocalTripsLoaded) {
        onLocalTripsLoaded(
          validCaptain.map((entry) => ({
            id: entry.requestId,
            status: 'COMPLETED',
            completed_at: new Date(entry.completedAt).toISOString(),
            created_at: new Date(entry.completedAt).toISOString(),
            final_fare: entry.finalFare,
            rider: { full_name: isArabic ? 'مستخدم محلي' : 'Local Rider', phone: '', rating: 5.0 },
            destination_address_ar: (entry.destination && entry.destination !== 'Destination' && entry.destination !== 'غير متاح') ? entry.destination : '',
            pickup_address_ar: entry.pickup || '',
            trip_fare: entry.finalFare,
          } as any))
        );
      }
    } else {
      const localRider = await dexieDb.riderTripLedger.toArray();
      const validRider = localRider.filter((entry) => entry.timestamp >= cutoffMs);
      const expiredRider = localRider.filter((entry) => entry.timestamp < cutoffMs);
      if (expiredRider.length > 0) {
        void Promise.all(expiredRider.map((e) => dexieDb.riderTripLedger.delete(e.tripId)));
      }

      if (validRider.length > 0 && onLocalTripsLoaded) {
        onLocalTripsLoaded(
          validRider.map((entry) => ({
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
          } as any))
        );
      }
    }
  } catch (cacheErr) {
    if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab Cache-First read error]', cacheErr);
  }

  // Background Sync with remote Supabase
  let fetchedData: any[] = [];
  const reviewsMap: Record<string, any> = {};

  try {
    const userColumn = isCaptain ? 'accepted_captain_id' : 'rider_id';

    if (!isCaptain) {
      try {
        const { data: ledgerRows, error: ledgerError } = await supabase
          .from('trips_72h_ledger')
          .select('*')
          .eq('rider_id', userId)
          .gt('purge_at', new Date().toISOString())
          .order('completed_at', { ascending: false });

        if (!ledgerError && ledgerRows && ledgerRows.length > 0) {
          const captainIds = Array.from(new Set(ledgerRows.map((row: any) => row.captain_id).filter(Boolean)));
          const requestIds = Array.from(new Set(ledgerRows.map((row: any) => row.request_id).filter(Boolean)));
          const [rpcCardsMap, rpcProfilesMap, requestMap] = await Promise.all([
            fetchSafeCaptainCardsMap(captainIds),
            fetchSafeCounterpartProfilesMap(captainIds),
            fetchRowsByIds('ride_requests', requestIds),
          ]);

          let captainMap: Map<string, any>;
          let captainProfileMap: Map<string, any>;

          if (rpcCardsMap !== null || rpcProfilesMap !== null) {
            captainProfileMap = rpcCardsMap ?? new Map<string, any>();
            captainMap = new Map<string, any>();
            for (const cid of captainIds) {
              const card = rpcCardsMap?.get(cid);
              const prof = rpcProfilesMap?.get(cid);
              if (card || prof) {
                captainMap.set(cid, {
                  ...(card || {}),
                  ...(prof || {}),
                  id: cid,
                  full_name: prof?.full_name || card?.full_name,
                  phone: prof?.phone || '',
                });
              }
            }
          } else {
            [captainMap, captainProfileMap] = await Promise.all([
              fetchRowsByIds('profiles', captainIds),
              fetchRowsByIds('captain_profiles', captainIds),
            ]);
          }

          const ledgerTrips = ledgerRows.map((row: any) => {
            const req = row.request_id ? requestMap.get(row.request_id) : null;
            const base = mapLedgerRowToTripShape(
              row,
              row.captain_id ? captainMap.get(row.captain_id) : null,
              row.captain_id ? captainProfileMap.get(row.captain_id) : null
            );
            return {
              ...base,
              destination_address_ar: req?.destination_address_ar || req?.destination_address || base.destination_address_ar,
              destination_address: req?.destination_address || req?.destination_address_ar || base.destination_address,
              pickup_address_ar: req?.origin_address || base.metadata?.pickup_address_ar || '',
              pickup_address: req?.origin_address || base.metadata?.pickup_address_ar || '',
              distance_km: req?.distance_km ?? (row.distance_meters ? Number((row.distance_meters / 1000).toFixed(1)) : undefined),
              duration_minutes: req?.duration_minutes ?? row.duration_minutes,
              origin_lat: req?.origin_lat,
              origin_lng: req?.origin_lng,
              destination_lat: req?.destination_lat,
              destination_lng: req?.destination_lng,
              metadata: {
                ...base.metadata,
                pickup_address_ar: req?.origin_address,
                destination_address_ar: req?.destination_address_ar || req?.destination_address || base.destination_address_ar,
                distance_km: req?.distance_km,
                origin_lat: req?.origin_lat,
                origin_lng: req?.origin_lng,
                destination_lat: req?.destination_lat,
                destination_lng: req?.destination_lng,
              },
            };
          });
          fetchedData = appendUniqueTrips(fetchedData, ledgerTrips);

          try {
            const cacheEntries = ledgerTrips
              .map(tripShapeToRiderLedgerEntry)
              .filter((entry): entry is RiderTripLedgerEntry => Boolean(entry));
            await Promise.all(cacheEntries.map((entry) => dexieDb.riderTripLedger.put(entry)));
          } catch (cacheError) {
            if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab ledger cache skipped]', cacheError);
          }
        }
      } catch (ledgerFetchError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab ledger fetch failed]', ledgerFetchError);
      }
    } else {
      try {
        const { data: ledgerRows, error: ledgerError } = await supabase
          .from('trips_72h_ledger')
          .select('*')
          .eq('captain_id', userId)
          .gt('purge_at', new Date().toISOString())
          .order('completed_at', { ascending: false });

        if (!ledgerError && ledgerRows && ledgerRows.length > 0) {
          const riderIds = Array.from(new Set(ledgerRows.map((row: any) => row.rider_id).filter(Boolean)));
          const requestIds = Array.from(new Set(ledgerRows.map((row: any) => row.request_id).filter(Boolean)));
          const [rpcRiderMap, requestMap] = await Promise.all([
            fetchSafeCounterpartProfilesMap(riderIds),
            fetchRowsByIds('ride_requests', requestIds),
          ]);
          const riderMap = rpcRiderMap ?? (await fetchRowsByIds('profiles', riderIds));

          const ledgerTrips = ledgerRows.map((row: any) => {
            const req = row.request_id ? requestMap.get(row.request_id) : null;
            const base = mapLedgerRowToTripShape(
              row,
              undefined,
              undefined,
              row.rider_id ? riderMap.get(row.rider_id) : null
            );
            return {
              ...base,
              destination_address_ar: req?.destination_address_ar || req?.destination_address || base.destination_address_ar,
              destination_address: req?.destination_address || req?.destination_address_ar || base.destination_address,
              pickup_address_ar: req?.origin_address || '',
              pickup_address: req?.origin_address || '',
              metadata: {
                ...base.metadata,
                pickup_address_ar: req?.origin_address,
                destination_address_ar: req?.destination_address_ar || req?.destination_address || base.destination_address_ar,
              },
            };
          });
          fetchedData = appendUniqueTrips(fetchedData, ledgerTrips);
        }
      } catch (ledgerFetchError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab captain ledger fetch failed]', ledgerFetchError);
      }
    }

    if (fetchedData.length === 0) {
      try {
        const { data, error } = await supabase
          .from('ride_requests')
          .select('*')
          .eq(userColumn, userId)
          .eq('status', 'COMPLETED')
          .order('created_at', { ascending: false });

        if (!error && data) {
          let rowsToAppend = data;
          if (isCaptain && data.length > 0) {
            const rIds = Array.from(new Set(data.map((r: any) => r.rider_id).filter(Boolean)));
            const rMap = (await fetchSafeCounterpartProfilesMap(rIds)) ?? (await fetchRowsByIds('profiles', rIds));
            rowsToAppend = data.map((r: any) => ({
              ...r,
              rider: r.rider_id ? rMap.get(r.rider_id) || r.rider : r.rider,
            }));
          }
          fetchedData = appendUniqueTrips(fetchedData, rowsToAppend);
        }
      } catch (supabaseError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab Supabase Fetch Failed]', supabaseError);
      }
    }

    if (fetchedData.length > 0) {
      fetchedData = await enrichCaptainDetails(fetchedData);
    }

    // Dexie merge for offline-first compliance
    try {
      if (isCaptain) {
        const rawCaptainTrips = await dexieDb.captainLedger.toArray();
        const localCaptainTrips = rawCaptainTrips.filter((entry) => entry.completedAt >= cutoffMs);
        const localMapped = localCaptainTrips.map((entry) => {
          const cleanDest = (entry.destination && entry.destination !== 'Destination' && entry.destination !== 'غير محدد') ? entry.destination : '';
          const cleanPick = (entry.pickup && entry.pickup !== 'موقعي الحالي') ? entry.pickup : '';
          const rId = entry.riderId || '';
          return {
            id: entry.requestId,
            request_id: entry.requestId,
            rider_id: rId,
            riderId: rId,
            status: 'COMPLETED',
            completed_at: new Date(entry.completedAt).toISOString(),
            created_at: new Date(entry.completedAt).toISOString(),
            final_fare: entry.finalFare,
            rider: {
              id: rId,
              full_name: (entry as any).riderName || (isArabic ? 'مستخدم محلي' : 'Local Rider'),
              phone: (entry as any).riderPhone || '',
              rating: 5.0,
            },
            destination_address_ar: cleanDest,
            destination_address: cleanDest,
            pickup_address_ar: cleanPick,
            pickup_address: cleanPick,
            metadata: {
              rider_id: rId,
              riderId: rId,
              pickup_address_ar: cleanPick,
              destination_address_ar: cleanDest,
            },
          };
        });

        const seenIds = new Set(fetchedData.map((r) => r.id));
        for (const item of localMapped) {
          if (!seenIds.has(item.id)) {
            fetchedData.push(item);
            seenIds.add(item.id);
          }
        }

        const unpopulatedRiderIds = Array.from(new Set(
          fetchedData
            .filter((r) => (r.rider_id || r.riderId) && (!r.rider?.full_name || r.rider.full_name === 'مستخدم محلي' || r.rider.full_name === 'Local Rider'))
            .map((r) => r.rider_id || r.riderId)
            .filter(Boolean)
        ));
        if (unpopulatedRiderIds.length > 0) {
          try {
            const riderMap =
              (await fetchSafeCounterpartProfilesMap(unpopulatedRiderIds)) ??
              (await fetchRowsByIds('profiles', unpopulatedRiderIds));
            fetchedData = fetchedData.map((item) => {
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
            rating: entry.captainRank === 'PLATINUM' ? 5.0 : entry.captainRank === 'GOLD' ? 4.5 : 4.0,
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

        const seenIds = new Set(fetchedData.map((r) => r.id));
        for (const item of localMapped) {
          if (!seenIds.has(item.id)) {
            fetchedData.push(item);
            seenIds.add(item.id);
          }
        }
      }
    } catch (dexieError) {
      if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab Dexie Merge Failed]', dexieError);
    }

    // Fetch reviews
    try {
      const tripIds = Array.from(new Set(fetchedData.map((r) => r.id))).filter(Boolean);
      if (tripIds.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .in('trip_id', tripIds);

        if (!reviewsError && reviewsData) {
          reviewsData.forEach((rev) => {
            if (userId && rev.reviewer_id === userId) {
              reviewsMap[rev.trip_id] = rev;
            } else if (!userId && !reviewsMap[rev.trip_id]) {
              reviewsMap[rev.trip_id] = rev;
            }
          });
        }
      }
    } catch (revErr) {
      if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab fetch reviews failed]', revErr);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab fetchTripHistoryData]', err);
  }

  return { trips: fetchedData, reviews: reviewsMap };
}
