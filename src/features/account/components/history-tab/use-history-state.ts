import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { fetchFavoriteCaptainIds, setFavoriteCaptain } from '../../services/favorite-captains';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_ERR_DICTIONARY } from '@/core/config/sovereign-errors';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useTranslations } from 'next-intl';
import { useCountryConfig } from '@/shared/hooks/use-country-config';
import { getCurrencyLabel } from '@/shared/services/currency-label';
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const countryConfig = useCountryConfig(user?.countryId);
  const currencyLabel = getCurrencyLabel(countryConfig, user, language) || (isArabic ? 'د.أ' : 'JOD');

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
      // [ACT-SSOT-04] Offline-First / Cache-First: immediately read and render local Dexie trips
      try {
        if (isCaptain) {
          const localCaptain = await dexieDb.captainLedger.toArray();
          if (localCaptain.length > 0 && active) {
            setRealTrips(localCaptain.map(entry => ({
              id: entry.requestId,
              status: 'COMPLETED',
              completed_at: new Date(entry.completedAt).toISOString(),
              created_at: new Date(entry.completedAt).toISOString(),
              final_fare: entry.finalFare,
              rider: { full_name: isArabic ? 'راكب محلي' : 'Local Rider', phone: '', rating: 5.0 },
              destination_address_ar: (entry.destination && entry.destination !== 'Destination' && entry.destination !== 'غير متاح') ? entry.destination : '',
              pickup_address_ar: entry.pickup || '',
              trip_fare: entry.finalFare,
            } as any)));
            setLoading(false);
          }
        } else {
          const localRider = await dexieDb.riderTripLedger.toArray();
          if (localRider.length > 0 && active) {
            setRealTrips(localRider.map(entry => ({
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
            } as any)));
            setLoading(false);
          }
        }
      } catch (cacheErr) {
        if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab Cache-First read error]', cacheErr);
      }

      // Background Sync with remote Supabase
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
              const requestIds = Array.from(new Set(ledgerRows.map((row: any) => row.request_id).filter(Boolean)));
              const [captainMap, captainProfileMap, requestMap] = await Promise.all([
                fetchRowsByIds('profiles', captainIds),
                fetchRowsByIds('captain_profiles', captainIds),
                fetchRowsByIds('ride_requests', requestIds),
              ]);

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
                  }
                };
              });
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
              const requestIds = Array.from(new Set(ledgerRows.map((row: any) => row.request_id).filter(Boolean)));
              const [riderMap, requestMap] = await Promise.all([
                fetchRowsByIds('profiles', riderIds),
                fetchRowsByIds('ride_requests', requestIds),
              ]);

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
                  }
                };
              });
              fetchedData = appendUniqueTrips(fetchedData, ledgerTrips);
            }
          } catch (ledgerFetchError) {
            if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab captain ledger fetch failed]', ledgerFetchError);
          }
        }

        // 1. Fetch from Supabase remote database only if ledger rows were empty
        if (fetchedData.length === 0) {
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
        }

        if (fetchedData.length > 0) {
          fetchedData = await enrichCaptainDetails(fetchedData);
        }

        // 2. Fetch and merge from Dexie local database for offline-first compliance (SC55)
        try {
          if (isCaptain) {
            const localCaptainTrips = await dexieDb.captainLedger.toArray();
            const localMapped = localCaptainTrips.map(entry => {
              const cleanDest = (entry.destination && entry.destination !== 'Destination' && entry.destination !== 'غير محدد') ? entry.destination : '';
              const cleanPick = (entry.pickup && entry.pickup !== 'موقعي الحالي') ? entry.pickup : '';
              return {
                id: entry.requestId,
                status: 'COMPLETED',
                completed_at: new Date(entry.completedAt).toISOString(),
                created_at: new Date(entry.completedAt).toISOString(),
                final_fare: entry.finalFare,
                rider: {
                  full_name: isArabic ? 'راكب محلي' : 'Local Rider',
                  phone: '',
                  rating: 5.0
                },
                destination_address_ar: cleanDest,
                destination_address: cleanDest,
                pickup_address_ar: cleanPick,
                pickup_address: cleanPick,
                metadata: {
                  pickup_address_ar: cleanPick,
                  destination_address_ar: cleanDest
                }
              };
            });
            
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

        if (active && Array.isArray(fetchedData) && fetchedData.length > 0) {
          setRealTrips(fetchedData);
        }
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab trips fetch]', error);
        // [ACT-PWA-09] Offline-First: Retain locally loaded Dexie ledger records if remote fetch fails
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
        serialId: trip.serial_id || trip.serialId || ('T-' + trip.id.slice(0, 4).toUpperCase()),
        riderName: trip.rider?.full_name || trip.rider_name || trip.riderName || (isArabic ? 'راكب' : 'Rider'),
        pickup: cleanPickup,
        dropoff: cleanDropoff,
        earnedPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
        timestamp: parseTripTimestamp(trip),
        status: trip.status || 'COMPLETED'
      };
    });

    const all = [...combinedReal];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now, isArabic]);

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
          title: isArabic ? 'تعذر تحديث المفضلة' : 'Failed to update favorites',
          description: isArabic ? 'حاول مرة أخرى بعد قليل.' : 'Please try again later.',
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
          title: isArabic ? 'تمت الإزالة من المفضلة' : 'Removed from favorites',
          description: isArabic ? `تمت إزالة السائق ${trip.captainName} من قائمتك.` : `Removed driver ${trip.captainName} from your list.`,
        }
      : {
          title: isArabic ? 'تم الحفظ بنجاح' : 'Saved successfully',
          description: isArabic ? 'تم إضافة السائق لمفضلتك في جميع رحلاتك.' : 'Driver added to your favorites across all trips.',
        });

    void loadFavorites();
  };

  const refreshReviews = useCallback(async () => {
    try {
      const tripIds = realTrips.map(r => r.id).filter(Boolean);
      if (tripIds.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .in('trip_id', tripIds);

        if (!reviewsError && reviewsData) {
          const reviewsMap: Record<string, any> = {};
          reviewsData.forEach(rev => {
            reviewsMap[rev.trip_id] = rev;
          });
          setTripReviews(reviewsMap);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab] refresh reviews failed', err);
    }
  }, [realTrips]);

  return {
    favoriteCaptainIds,
    sovereignLogs,
    realTrips,
    tripReviews,
    refreshReviews,
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
