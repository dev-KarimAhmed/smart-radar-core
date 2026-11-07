import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb } from '@/lib/dexie-db';
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
} from './history-shared';
import { getRiderLinkedCaptain, type LinkedCaptainInfo } from '@/features/referral/services/captain-referral';
import {
  buildRiderHistoricalTrips,
  buildFavoriteCaptains,
  buildCaptainHistoricalTrips,
} from './history-transforms';
import { fetchTripHistoryData } from './history-fetch-service';

export {
  buildRiderHistoricalTrips,
  buildFavoriteCaptains,
  buildCaptainHistoricalTrips,
} from './history-transforms';
export { fetchTripHistoryData } from './history-fetch-service';

export function useHistoryState() {
  const { user, isCaptain, isPassenger } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const t = useTranslations('historyTab');
  const tRef = useTranslations('referral.linkedCaptain');

  const [favoriteCaptainIds, setFavoriteCaptainIds] = useState<Set<string>>(new Set());
  const [dexieFavorites, setDexieFavorites] = useState<any[]>([]);
  const [linkedCaptain, setLinkedCaptain] = useState<LinkedCaptainInfo | null>(null);
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

  const loadFavorites = async () => {
    try {
      const ids = await fetchFavoriteCaptainIds();
      if (isPassenger) {
        try {
          const linked = await getRiderLinkedCaptain();
          setLinkedCaptain(linked);
        } catch {
          // ignore
        }
      }
      setFavoriteCaptainIds(ids);

      try {
        const stored = await dexieDb.favoriteCaptains.toArray();
        setDexieFavorites(stored || []);
      } catch {
        // ignore
      }
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
        description: t('logsClearedDesc'),
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

    const handleFavoritesUpdated = () => {
      void loadFavorites();
    };

    window.addEventListener('sovereign-log-added', handleLogAdded);
    window.addEventListener('radar_favorites_updated', handleFavoritesUpdated);
    window.addEventListener('rider-favorites-updated', handleFavoritesUpdated);

    return () => {
      window.removeEventListener('sovereign-log-added', handleLogAdded);
      window.removeEventListener('radar_favorites_updated', handleFavoritesUpdated);
      window.removeEventListener('rider-favorites-updated', handleFavoritesUpdated);
    };
  }, [user, isCaptain, isPassenger]);

  useEffect(() => {
    if (!user?.uid) {
      setRealTrips([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function syncTrips() {
      const result = await fetchTripHistoryData({
        userId: user!.uid,
        isCaptain: Boolean(isCaptain),
        isArabic,
        cutoffMs: Date.now() - THREE_DAYS_MS,
        onLocalTripsLoaded: (localTrips) => {
          if (active && localTrips.length > 0) {
            setRealTrips(localTrips);
            setLoading(false);
          }
        },
      });

      if (!active) return;
      if (result.trips.length > 0) {
        setRealTrips(result.trips);
      }
      if (Object.keys(result.reviews).length > 0) {
        setTripReviews(result.reviews);
      }
      setLoading(false);
    }

    void syncTrips();

    return () => {
      active = false;
    };
  }, [user?.uid, isCaptain, isArabic]);

  const riderHistoricalTrips = useMemo<HistoricalTrip[]>(() => {
    return buildRiderHistoricalTrips(realTrips, now, THREE_DAYS_MS);
  }, [realTrips, now, THREE_DAYS_MS]);

  const favoriteCaptains = useMemo(() => {
    return buildFavoriteCaptains({
      favoriteCaptainIds,
      dexieFavorites,
      riderHistoricalTrips,
      linkedCaptain,
      defaultCaptainName: tRef('defaultCaptainName'),
      isArabic,
    });
  }, [favoriteCaptainIds, dexieFavorites, riderHistoricalTrips, linkedCaptain, tRef, isArabic]);

  const captainHistoricalTrips = useMemo(() => {
    return buildCaptainHistoricalTrips(realTrips, now, THREE_DAYS_MS, isArabic);
  }, [realTrips, now, THREE_DAYS_MS, isArabic]);

  const toggleFavorite = async (trip: HistoricalTrip) => {
    const wasFavorite = trip.captainId ? favoriteCaptainIds.has(String(trip.captainId)) : false;

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

    try {
      localStorage.removeItem(`radar_preferred_captain_${trip.tripId}`);

      if (trip.captainId) {
        if (wasFavorite) {
          localStorage.removeItem(`radar_preferred_captain_${trip.captainId}`);
        } else {
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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('radar_favorites_updated'));
    }
    void loadFavorites();
  };

  const refreshReviews = useCallback(async () => {
    try {
      const tripIds = realTrips.map((r) => r.id).filter(Boolean);
      if (tripIds.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .in('trip_id', tripIds);

        if (!reviewsError && reviewsData) {
          const reviewsMap: Record<string, any> = {};
          reviewsData.forEach((rev) => {
            if (user?.uid && rev.reviewer_id === user.uid) {
              reviewsMap[rev.trip_id] = rev;
            } else if (!user?.uid && !reviewsMap[rev.trip_id]) {
              reviewsMap[rev.trip_id] = rev;
            }
          });
          setTripReviews(reviewsMap);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[HistoryTab] refresh reviews failed', err);
    }
  }, [realTrips, user?.uid]);

  return {
    favoriteCaptainIds,
    linkedCaptain,
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
