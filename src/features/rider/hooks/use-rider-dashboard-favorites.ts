import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { dexieDb, RadarCaptainFavoriteKernel } from '@/lib/dexie-db';
import { setFavoriteCaptain } from '@/features/account/services/favorite-captains';
import { HistoricalTrip, FavoriteCaptain } from '../components/dashboard/dashboard-shared';
import {
  sanitizeText,
  getFavoriteStableId,
  favoriteMatchesTrip,
} from './use-rider-dashboard-helpers';

export function useRiderDashboardFavorites() {
  const t = useTranslations('riderDashboard');
  const { toast } = useToast();
  const [favoriteCaptains, setFavoriteCaptains] = useState<FavoriteCaptain[]>([]);

  const uniqueFavoriteCaptains = useMemo(() => {
    const byCaptain = new Map<string, FavoriteCaptain>();

    for (const favorite of favoriteCaptains) {
      const stableId = getFavoriteStableId(favorite);
      const existing = byCaptain.get(stableId);
      if (!existing || (favorite.heartedAt || 0) > (existing.heartedAt || 0)) {
        byCaptain.set(stableId, favorite);
      }
    }

    return Array.from(byCaptain.values()).sort((a, b) => (b.heartedAt || 0) - (a.heartedAt || 0));
  }, [favoriteCaptains]);

  const loadFavorites = async () => {
    try {
      const favs = await dexieDb.favoriteCaptains.toArray();
      setFavoriteCaptains(favs as FavoriteCaptain[]);
    } catch (error) {
      console.error('Failed to load favorites from Dexie:', error);
    }
  };

  useEffect(() => {
    loadFavorites();

    const onFavUpdate = () => {
      void loadFavorites();
    };
    window.addEventListener('rider-favorites-updated', onFavUpdate);
    return () => window.removeEventListener('rider-favorites-updated', onFavUpdate);
  }, []);

  const removeFavorite = async (favorite: FavoriteCaptain) => {
    const allFavorites = (await dexieDb.favoriteCaptains.toArray()) as FavoriteCaptain[];
    const stableId = getFavoriteStableId(favorite);
    const matchingFavorites = allFavorites.filter((item) => {
      if (favorite.id !== undefined && item.id === favorite.id) return true;
      return getFavoriteStableId(item) === stableId;
    });

    for (const item of matchingFavorites) {
      if (item.id !== undefined) {
        await dexieDb.favoriteCaptains.delete(item.id);
      }
    }

    try {
      if (favorite.captainId) {
        void setFavoriteCaptain(favorite.captainId, false).catch(() => {});
        localStorage.removeItem(`radar_preferred_captain_${favorite.captainId}`);
      }
      localStorage.removeItem(`radar_preferred_captain_${favorite.tripId}`);
    } catch (error) {
      console.warn('Storage delete failed:', error);
    }

    toast({
      title: t('toast.removedFavorite'),
      description: t('toast.removedFavoriteDesc'),
    });
    loadFavorites();
  };

  const toggleFavorite = async (event: React.MouseEvent, trip: HistoricalTrip) => {
    event.stopPropagation();

    try {
      const existing = favoriteCaptains.find((favorite) => favoriteMatchesTrip(favorite, trip));
      if (existing) {
        await removeFavorite({ ...(existing as FavoriteCaptain), ...trip });
        return;
      }

      if (trip.captainId) {
        void setFavoriteCaptain(trip.captainId, true).catch(() => {});
      }

      const captainType =
        trip.captainRank === 'PLATINUM' ? 'careem' : trip.captainRank === 'GOLD' ? 'uber' : 'independent';

      RadarCaptainFavoriteKernel.mummifyTrustedCaptain(
        {
          captainId: trip.captainId || trip.captainPhone || trip.tripId,
          captainName: sanitizeText(trip.captainName),
          captainPhone: trip.captainPhone,
          vehicleInfo: sanitizeText(trip.vehicleInfo),
          captainType,
          tripId: trip.tripId,
        },
        true,
      );

      await dexieDb.favoriteCaptains.add({
        tripId: trip.tripId,
        captainId: trip.captainId || trip.captainPhone || trip.tripId,
        captainName: sanitizeText(trip.captainName),
        captainRank: trip.captainRank,
        captainPhone: trip.captainPhone,
        vehicleInfo: sanitizeText(trip.vehicleInfo),
        finalPrice: trip.finalPrice,
        timestamp: trip.timestamp,
        heartedAt: Date.now(),
        captainType,
      } as FavoriteCaptain);

      toast({
        title: t('toast.savedFavorite'),
        description: t('toast.savedFavoriteDesc'),
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 60]);
      }

      loadFavorites();
    } catch (error) {
      console.error(error);
    }
  };

  const updateCaptainType = async (favId: number, type: FavoriteCaptain['captainType'], captainTypeLabel: (type: FavoriteCaptain['captainType']) => string) => {
    if (!type) return;

    try {
      await dexieDb.favoriteCaptains.update(favId, { captainType: type } as FavoriteCaptain);
      const favorite = favoriteCaptains.find((item) => item.id === favId);

      if (favorite) {
        try {
          localStorage.setItem(
            `radar_preferred_captain_${favorite.captainId || favorite.tripId}`,
            JSON.stringify({
              captainId: favorite.captainId || favorite.tripId,
              fullName: sanitizeText(favorite.captainName),
              phoneNumber: favorite.captainPhone,
              captainType: type,
              vehicleSpecs: sanitizeText(favorite.vehicleInfo),
              savedTimestamp: favorite.heartedAt || Date.now(),
            }),
          );
        } catch (error) {
          console.warn('Storage write failed:', error);
        }
      }

      toast({
        title: t('toast.categoryUpdated'),
        description: `${t('toast.categoryUpdatedDesc')} ${captainTypeLabel(type)}.`,
      });
      loadFavorites();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    favoriteCaptains,
    uniqueFavoriteCaptains,
    loadFavorites,
    removeFavorite,
    toggleFavorite,
    updateCaptainType,
  };
}
