import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/core/types';
import {
  HISTORY_TTL_MS,
  enrichCaptainDetails,
  appendUniqueTrips,
} from '../history-shared';
import {
  fetchRemoteLedgerTrips,
  fetchRemoteRequestsFallback,
  fetchTripReviewsMap,
} from './history-trips-ledger-service';
import {
  readLocalDexieTrips,
  mergeLocalDexieTrips,
} from './history-trips-dexie-service';

interface UseHistoryTripsFetcherProps {
  user: User | null;
  isCaptain: boolean;
  isArabic: boolean;
}

export function useHistoryTripsFetcher({ user, isCaptain, isArabic }: UseHistoryTripsFetcherProps) {
  const [realTrips, setRealTrips] = useState<any[]>([]);
  const [tripReviews, setTripReviews] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const THREE_DAYS_MS = HISTORY_TTL_MS;

  useEffect(() => {
    if (!user?.uid) {
      setRealTrips([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchTripHistory() {
      const cutoffMs = Date.now() - THREE_DAYS_MS;

      // 1. Cache-First read from Dexie
      const localTrips = await readLocalDexieTrips(isCaptain, isArabic, cutoffMs);
      if (localTrips.length > 0 && active) {
        setRealTrips(localTrips);
        setLoading(false);
      }

      // 2. Background Sync with remote Supabase
      try {
        let fetchedData = await fetchRemoteLedgerTrips(user!, isCaptain);

        // Fallback to ride_requests if ledger was empty
        if (fetchedData.length === 0) {
          const fallbackData = await fetchRemoteRequestsFallback(user!, isCaptain);
          fetchedData = appendUniqueTrips(fetchedData, fallbackData);
        }

        if (fetchedData.length > 0) {
          fetchedData = await enrichCaptainDetails(fetchedData);
        }

        // 3. Merge local Dexie records for offline-first compliance
        fetchedData = await mergeLocalDexieTrips(fetchedData, isCaptain, isArabic, cutoffMs);

        // 4. Fetch trip reviews
        const tripIds = Array.from(new Set(fetchedData.map((r) => r.id))).filter(Boolean);
        const reviewsMap = await fetchTripReviewsMap(tripIds, user?.uid);
        if (active && Object.keys(reviewsMap).length > 0) {
          setTripReviews(reviewsMap);
        }

        if (active && Array.isArray(fetchedData) && fetchedData.length > 0) {
          setRealTrips(fetchedData);
        }
      } catch (error) {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab trips fetch]', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchTripHistory();

    return () => {
      active = false;
    };
  }, [user?.uid, isCaptain, isArabic, user]);

  const refreshReviews = useCallback(async () => {
    try {
      const tripIds = realTrips.map((r) => r.id).filter(Boolean);
      const reviewsMap = await fetchTripReviewsMap(tripIds, user?.uid);
      if (Object.keys(reviewsMap).length > 0) {
        setTripReviews(reviewsMap);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab] refresh reviews failed', err);
    }
  }, [realTrips, user?.uid]);

  return {
    realTrips,
    tripReviews,
    refreshReviews,
    loading,
  };
}
