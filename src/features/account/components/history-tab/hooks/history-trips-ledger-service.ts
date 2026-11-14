import { supabase } from '@/lib/supabase-client';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import type { User } from '@/core/types';
import {
  fetchRowsByIds,
  fetchSafeCaptainCardsMap,
  fetchSafeCounterpartProfilesMap,
  appendUniqueTrips,
  mapLedgerRowToTripShape,
  tripShapeToRiderLedgerEntry,
} from '../history-shared';

export async function fetchRemoteLedgerTrips(user: User, isCaptain: boolean): Promise<any[]> {
  let fetchedData: any[] = [];

  if (!isCaptain) {
    try {
      const { data: ledgerRows, error: ledgerError } = await supabase
        .from('trips_72h_ledger')
        .select('*')
        .eq('rider_id', user.uid)
        .gt('purge_at', new Date().toISOString())
        .order('completed_at', { ascending: false });

      if (ledgerError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab ledger fetch skipped]', ledgerError);
      } else if (ledgerRows && ledgerRows.length > 0) {
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
            row.captain_id ? captainProfileMap.get(row.captain_id) : null,
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
        .eq('captain_id', user.uid)
        .gt('purge_at', new Date().toISOString())
        .order('completed_at', { ascending: false });

      if (ledgerError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab captain ledger fetch skipped]', ledgerError);
      } else if (ledgerRows && ledgerRows.length > 0) {
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
            row.rider_id ? riderMap.get(row.rider_id) : null,
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

  return fetchedData;
}

export async function fetchRemoteRequestsFallback(user: User, isCaptain: boolean): Promise<any[]> {
  const userColumn = isCaptain ? 'accepted_captain_id' : 'rider_id';
  try {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq(userColumn, user.uid)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false });

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab query notice]', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    if (isCaptain) {
      const rIds = Array.from(new Set(data.map((r: any) => r.rider_id).filter(Boolean)));
      const rMap = (await fetchSafeCounterpartProfilesMap(rIds)) ?? (await fetchRowsByIds('profiles', rIds));
      return data.map((r: any) => ({
        ...r,
        rider: r.rider_id ? rMap.get(r.rider_id) || r.rider : r.rider,
      }));
    }

    return data;
  } catch (supabaseError) {
    if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab Supabase Fetch Failed, falling back to local]', supabaseError);
    return [];
  }
}

export async function fetchTripReviewsMap(tripIds: string[], userId?: string): Promise<Record<string, any>> {
  if (tripIds.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .in('trip_id', tripIds);

    if (error || !data) return {};

    const reviewsMap: Record<string, any> = {};
    data.forEach((rev: any) => {
      if (userId && rev.reviewer_id === userId) {
        reviewsMap[rev.trip_id] = rev;
      } else if (!userId && !reviewsMap[rev.trip_id]) {
        reviewsMap[rev.trip_id] = rev;
      }
    });
    return reviewsMap;
  } catch {
    return {};
  }
}
