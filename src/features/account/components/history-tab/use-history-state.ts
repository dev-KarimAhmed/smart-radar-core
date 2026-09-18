import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { fetchFavoriteCaptainIds, setFavoriteCaptain } from '../../services/favorite-captains';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_ERR_DICTIONARY } from '@/core/config/sovereign-errors';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useTranslations } from 'next-intl';
import {
  HISTORY_TTL_MS,
  type HistoricalTrip,
  getCaptainIdFromTrip,
  getHistoryCaptainName,
  getHistoryCaptainRank,
  getHistoryCaptainPhone,
  getHistoryVehicleInfo,
  parseTripTimestamp,
  fetchRowsByIds,
  enrichCaptainDetails,
  getTripHistoryId,
  appendUniqueTrips,
  mapLedgerRowToTripShape,
  tripShapeToRiderLedgerEntry
} from './history-shared';

export function useHistoryState() {

  const { user, isCaptain, isPassenger } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const t = useTranslations('historyTab');
  // NOT its own store any more. The ids come from the server (favoriteCaptainIds) and the
  // display details are read off the rider's own trips below, so there is exactly one place
  // that knows who is favourited. Keeping a second table of captain details was how the list
  // and the hearts drifted apart in the first place.
  // Captain ids, from the server. Keyed by captain so one favourite covers every trip with
  // them ظ¤ the Dexie list above is keyed by trip and cannot answer that question.
  const [favoriteCaptainIds, setFavoriteCaptainIds] = useState<Set<string>>(new Set());
  const [sovereignLogs, setSovereignLogs] = useState<any[]>([]);
  const [realTrips, setRealTrips] = useState<any[]>([]);
  const [tripReviews, setTripReviews] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true); // ┘à╪╢╪د┘ ╪«╪╡┘è╪╡╪د┘ï ┘┘à┘╪╣ ╪د┘╪▓┘è╪د╪ص CLS
  const { toast } = useToast();
  const currencyLabel = user?.currencyAr || user?.currencyEn || '';

  const [errorSearch, setErrorSearch] = useState('');
  const [errorCategory, setErrorCategory] = useState<string>('ALL');
  const [expandedErrorCode, setExpandedErrorCode] = useState<string | null>(null);

  const filteredErrors = useMemo(() => {
    const allErrors = Object.values(SOVEREIGN_ERR_DICTIONARY);
    return allErrors.filter((err) => {
      const matchesCategory = errorCategory === 'ALL' || err.code.startsWith(errorCategory);
      const matchesSearch =
        err.code.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.name.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.description.toLowerCase().includes(errorSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [errorSearch, errorCategory]);

  const THREE_DAYS_MS = HISTORY_TTL_MS;
  const now = Date.now();

  /**
   * One source: fetchFavoriteCaptainIds. It reads the server, falls back to the
   * captain-keyed offline cache, and migrates any device-only legacy favourites on the way.
   * This screen no longer reads the per-trip Dexie table at all.
   */
  const loadFavorites = async () => {
    try {
      setFavoriteCaptainIds(await fetchFavoriteCaptainIds());
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  };

  const loadSovereignLogs = async () => {
    if (!user?.uid || !isCaptain) return;
    try {
      const logs = await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .reverse()
        .sortBy('timestamp');
      setSovereignLogs(logs);
    } catch (e) {
      console.error("Failed to load captain sovereign logs from Dexie:", e);
    }
  };

  const clearSovereignLogs = async () => {
    if (!user?.uid) return;
    try {
      await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .delete();
      setSovereignLogs([]);
      toast({
        title: t('logsClearedTitle'),
        description: t('logsClearedDesc')
      });
    } catch (err) {
      console.error("Failed to clear sovereign logs:", err);
    }
  };

  useEffect(() => {
    loadFavorites();
    if (isCaptain) {
      loadSovereignLogs();
    }

    const handleLogAdded = () => {
      if (isCaptain) {
        loadSovereignLogs();
      }
    };

    window.addEventListener('sovereign-log-added', handleLogAdded);
    return () => {
      window.removeEventListener('sovereign-log-added', handleLogAdded);
    };
  }, [user, isCaptain]);

  useEffect(() => {
    if (!user?.uid) {
      setRealTrips([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchTripHistory() {
      setLoading(true);
      try {
        const userColumn = isCaptain ? 'accepted_captain_id' : 'rider_id';
        let fetchedData: any[] = [];

        // 0. Primary history source: server ledger written by complete_ride_trip.
        // This keeps the screen correct even when ride_requests joins are unavailable.
        if (!isCaptain) {
          try {
            const { data: ledgerRows, error: ledgerError } = await supabase
              .from('trips_72h_ledger')
              .select('*')
              .eq('rider_id', user!.uid)
              .gt('purge_at', new Date().toISOString())
              .order('completed_at', { ascending: false });

            if (ledgerError) {
              if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab ledger fetch skipped]', ledgerError);
            } else if (ledgerRows && ledgerRows.length > 0) {
              const captainIds = Array.from(new Set(ledgerRows.map((row: any) => row.captain_id).filter(Boolean)));
              const [captainMap, captainProfileMap] = await Promise.all([
                fetchRowsByIds('profiles', captainIds),
                fetchRowsByIds('captain_profiles', captainIds),
              ]);

              const ledgerTrips = ledgerRows.map((row: any) => mapLedgerRowToTripShape(
                row,
                row.captain_id ? captainMap.get(row.captain_id) : null,
                row.captain_id ? captainProfileMap.get(row.captain_id) : null
              ));
              fetchedData = appendUniqueTrips(fetchedData, ledgerTrips);

              try {
                const cacheEntries = ledgerTrips
                  .map(tripShapeToRiderLedgerEntry)
                  .filter((entry): entry is RiderTripLedgerEntry => Boolean(entry));
                await Promise.all(cacheEntries.map((entry) => dexieDb.riderTripLedger.put(entry)));
              } catch (cacheError) {
                if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab ledger cache skipped]', cacheError);
              }
            }
          } catch (ledgerFetchError) {
            if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab ledger fetch failed]', ledgerFetchError);
          }
        } else {
          try {
            const { data: ledgerRows, error: ledgerError } = await supabase
              .from('trips_72h_ledger')
              .select('*')
              .eq('captain_id', user!.uid)
              .gt('purge_at', new Date().toISOString())
              .order('completed_at', { ascending: false });

            if (ledgerError) {
              if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab captain ledger fetch skipped]', ledgerError);
            } else if (ledgerRows && ledgerRows.length > 0) {
              const riderIds = Array.from(new Set(ledgerRows.map((row: any) => row.rider_id).filter(Boolean)));
              const riderMap = await fetchRowsByIds('profiles', riderIds);

              const ledgerTrips = ledgerRows.map((row: any) => mapLedgerRowToTripShape(
                row,
                undefined,
                undefined,
                row.rider_id ? riderMap.get(row.rider_id) : null,
              ));
              fetchedData = appendUniqueTrips(fetchedData, ledgerTrips);
            }
          } catch (ledgerFetchError) {
            if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab captain ledger fetch failed]', ledgerFetchError);
          }
        }

        // 1. Fetch from Supabase remote database
        try {
          const { data, error } = await supabase
            .from('ride_requests')
            .select(`
              *,
              rider:profiles!rider_id(id, full_name, phone, rating),
              captain:profiles!accepted_captain_id(id, full_name, phone, rating)
            `)
            .eq(userColumn, user!.uid)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false });

          if (error) {
            if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab query notice]', error.message);
          } else if (data) {
            fetchedData = appendUniqueTrips(fetchedData, data);
          }
        } catch (supabaseError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab Supabase Fetch Failed, falling back to local]', supabaseError);
        }

        if (fetchedData.length > 0) {
          fetchedData = await enrichCaptainDetails(fetchedData);
        }

        // 2. Fetch and merge from Dexie local database for offline-first compliance (SC55)
        try {
          if (isCaptain) {
            const localCaptainTrips = await dexieDb.captainLedger.toArray();
            const localMapped = localCaptainTrips.map(entry => ({
              id: entry.requestId,
              status: 'COMPLETED',
              completed_at: new Date(entry.completedAt).toISOString(),
              created_at: new Date(entry.completedAt).toISOString(),
              final_fare: entry.finalFare,
              rider: {
                full_name: '╪▒╪د┘â╪ذ ┘à╪ص┘┘è',
                phone: '',
                rating: 5.0
              },
              destination_address_ar: entry.destination || '╪║┘è╪▒ ┘à╪ز╪د╪ص',
              destination_address: entry.destination || '╪║┘è╪▒ ┘à╪ز╪د╪ص',
              metadata: {
                pickup_address_ar: '┘à┘ê┘é╪╣┘è ╪د┘╪ص╪د┘┘è',
                destination_address_ar: entry.destination || '╪║┘è╪▒ ┘à╪ز╪د╪ص'
              }
            }));
            
            const seenIds = new Set(fetchedData.map(r => r.id));
            for (const item of localMapped) {
              if (!seenIds.has(item.id)) {
                fetchedData.push(item);
                seenIds.add(item.id);
              }
            }
          } else {
            const localRiderTrips = await dexieDb.riderTripLedger.toArray();
            const localMapped = localRiderTrips.map(entry => ({
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
                rating: entry.captainRank === 'PLATINUM' ? 5.0 : entry.captainRank === 'GOLD' ? 4.5 : 4.0
              },
              metadata: {
                vehicle_info: entry.vehicleInfo
              }
            }));

            const seenIds = new Set(fetchedData.map(r => r.id));
            for (const item of localMapped) {
              if (!seenIds.has(item.id)) {
                fetchedData.push(item);
                seenIds.add(item.id);
              }
            }
          }
        } catch (dexieError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab Dexie Merge Failed]', dexieError);
        }

        // 1.5 Fetch reviews for these trips to show detailed rating items
        try {
          const tripIds = fetchedData.map(r => r.id).filter(Boolean);
          if (tripIds.length > 0) {
            const { data: reviewsData, error: reviewsError } = await supabase
              .from('reviews')
              .select('*')
              .in('trip_id', tripIds);
            
            if (!reviewsError && reviewsData && active) {
              const reviewsMap: Record<string, any> = {};
              reviewsData.forEach(rev => {
                reviewsMap[rev.trip_id] = rev;
              });
              setTripReviews(reviewsMap);
            }
          }
        } catch (revErr) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab fetch reviews failed]', revErr);
        }

        if (active) setRealTrips(Array.isArray(fetchedData) ? fetchedData : []);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab trips fetch]', error);
        setRealTrips([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchTripHistory();

    return () => {
      active = false;
    };
  }, [user?.uid, isCaptain, toast]);

  const riderHistoricalTrips = useMemo<HistoricalTrip[]>(() => {
    const combinedReal = realTrips.map(trip => {
      const acceptedOffer = trip.offers?.find((o: any) => o.driverId === trip.driverId) || trip.acceptedOffer;
      return {
        tripId: trip.id,
        captainId: getCaptainIdFromTrip(trip),
        serialId: trip.serial_id || trip.serialId || ('T-' + trip.id.slice(0, 4).toUpperCase()),
        captainName: getHistoryCaptainName(trip, acceptedOffer),
        captainRank: getHistoryCaptainRank(trip, acceptedOffer),
        captainPhone: getHistoryCaptainPhone(trip, acceptedOffer),
        vehicleInfo: getHistoryVehicleInfo(trip, acceptedOffer),
        finalPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
        timestamp: parseTripTimestamp(trip),
      };
    });

    const all = [...combinedReal];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now]);

  /**
   * The favourites list, derived rather than stored.
   *
   * One entry per favourited CAPTAIN, with the display details taken from the most recent
   * trip the rider took with them. Previously this rendered its own Dexie table of captain
   * details keyed by trip, so the same captain could appear several times in the list while
   * the hearts on the trips above disagreed with it.
   */
  const favoriteCaptains = useMemo(() => {
    const byCaptain = new Map<string, HistoricalTrip>();
    for (const trip of riderHistoricalTrips) {
      const captainId = String(trip.captainId || '');
      if (!captainId || !favoriteCaptainIds.has(captainId)) continue;
      // Trips are already newest-first, so the first one seen is the freshest snapshot of
      // this captain's name, vehicle and phone.
      if (!byCaptain.has(captainId)) byCaptain.set(captainId, trip);
    }

    // Spread the whole trip: the "remove" button in the list calls toggleFavorite, which
    // takes a HistoricalTrip. `id` is added because the list keys on it.
    return [...byCaptain.entries()].map(([captainId, trip]) => ({
      ...trip,
      id: captainId,
      captainId,
    }));
  }, [favoriteCaptainIds, riderHistoricalTrips]);

  const captainHistoricalTrips = useMemo(() => {
    const combinedReal = realTrips.map(trip => {
      return {
        tripId: trip.id,
        serialId: trip.serial_id || trip.serialId || ('T-' + trip.id.slice(0, 4).toUpperCase()),
        riderName: trip.rider?.full_name || trip.rider_name || trip.riderName || '╪▒╪د┘â╪ذ',
        pickup: trip.metadata?.pickup_address_ar || trip.pickup_address_ar || trip.pickup || '┘à┘ê┘é╪╣┘è ╪د┘╪ص╪د┘┘è',
        dropoff: trip.destination_address_ar || trip.destination_address || trip.dropoff || '╪║┘è╪▒ ┘à╪ز╪د╪ص',
        earnedPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
        timestamp: parseTripTimestamp(trip),
        status: trip.status || 'COMPLETED'
      };
    });

    const all = [...combinedReal];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now]);

  const toggleFavorite = async (trip: HistoricalTrip) => {
    // Decided per CAPTAIN, not per trip. Looking the existing record up by tripId is what
    // made the heart light up on one trip and stay empty on every other trip with the same
    // captain.
    const wasFavorite = trip.captainId ? favoriteCaptainIds.has(String(trip.captainId)) : false;

    // The server first, because this is the copy the CAPTAIN reads. The old code wrote only
    // Dexie and localStorage, so the captain's card never learned about it at all.
    if (trip.captainId) {
      try {
        await setFavoriteCaptain(String(trip.captainId), !wasFavorite);
        setFavoriteCaptainIds((current) => {
          const next = new Set(current);
          if (wasFavorite) next.delete(String(trip.captainId));
          else next.add(String(trip.captainId));
          return next;
        });
      } catch (error) {
        console.error('[Favorites] server write failed:', error);
        toast({
          variant: 'destructive',
          title: '╪ز╪╣╪░╪▒ ╪ز╪ص╪»┘è╪س ╪د┘┘à┘╪╢┘╪ر',
          description: '╪ص╪د┘ê┘ ╪ز╪د┘┘è ╪ذ╪╣╪» ╪┤┘ê┘è╪ر.',
        });
        return;
      }
    }

    // The per-trip Dexie row is gone. It was a second, differently-keyed copy of the same
    // fact ظ¤ the row keyed by tripId, the localStorage key by captainId ظ¤ so the two could
    // not agree with each other, let alone with the server. setFavoriteCaptain above owns
    // the write and keeps the captain-keyed offline cache.
    try {
      // Stale: an old build wrote this one keyed by TRIP. Cleared so it cannot linger.
      localStorage.removeItem(`radar_preferred_captain_${trip.tripId}`);

      if (trip.captainId) {
        if (wasFavorite) {
          localStorage.removeItem(`radar_preferred_captain_${trip.captainId}`);
        } else {
          // Kept: prioritizeRiderOffers reads these keys to float a preferred captain's
          // offer to the top of the auction.
          localStorage.setItem(`radar_preferred_captain_${trip.captainId}`, JSON.stringify({
            captainId: trip.captainId,
            fullName: trip.captainName,
            phoneNumber: trip.captainPhone,
            captainType: 'independent',
            vehicleSpecs: trip.vehicleInfo,
            savedTimestamp: Date.now(),
          }));
        }
      }
    } catch (err) {
      console.warn('Preferred-captain storage update failed:', err);
    }

    toast(wasFavorite
      ? {
          title: '≡اْ¤ ╪ز┘à ╪د┘╪ح╪▓╪د┘╪ر ┘à┘ ╪د┘┘à┘╪╢┘╪ر',
          description: `╪ز┘à╪ز ╪ح╪▓╪د┘╪ر ╪د┘╪│╪د╪خ┘é ${trip.captainName} ┘à┘ ┘é╪د╪خ┘à╪ز┘â.`,
        }
      : {
          title: '╪ز┘à ╪د┘╪ص┘╪╕ ╪ذ┘╪ش╪د╪ص ≡اîا',
          description: '╪ز┘à ╪ح╪╢╪د┘╪ر ╪د┘╪│╪د╪خ┘é ┘┘à┘╪╢┘╪ز┘â ظ¤ ╪╣┘┘ë ┘â┘ ╪▒╪ص┘╪د╪ز┘â ┘à╪╣╪د┘ç╪î ┘ê╪╣┘┘ë ╪ث┘è ╪ش┘ç╪د╪▓.',
        });

    void loadFavorites();
  };

  
  
  return {
    favoriteCaptainIds,
    sovereignLogs,
    realTrips,
    tripReviews,
    loading,
    errorSearch,
    setErrorSearch,
    errorCategory,
    setErrorCategory,
    expandedErrorCode,
    setExpandedErrorCode,
    filteredErrors,
    riderHistoricalTrips,
    favoriteCaptains,
    captainHistoricalTrips,
    toggleFavorite,
    clearSovereignLogs,
    user,
    isCaptain,
    isPassenger,
    isArabic,
    language,
    currencyLabel,
    t,
  };
}
