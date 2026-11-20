import { useState, useEffect, useMemo, useCallback } from 'react';
import { dexieDb } from '@/lib/dexie-db';
import { fetchFavoriteCaptainIds, setFavoriteCaptain } from '../../../services/favorite-captains';
import { getRiderLinkedCaptain, type LinkedCaptainInfo } from '@/features/referral/services/captain-referral';
import { useToast } from '@/hooks/use-toast';
import type { HistoricalTrip } from '../history-shared';

interface UseHistoryFavoritesProps {
  isPassenger: boolean;
  isArabic: boolean;
  riderHistoricalTrips: HistoricalTrip[];
  tRef: (key: string) => string;
}

export function useHistoryFavorites({
  isPassenger,
  isArabic,
  riderHistoricalTrips,
  tRef,
}: UseHistoryFavoritesProps) {
  const [favoriteCaptainIds, setFavoriteCaptainIds] = useState<Set<string>>(new Set());
  const [dexieFavorites, setDexieFavorites] = useState<any[]>([]);
  const [linkedCaptain, setLinkedCaptain] = useState<LinkedCaptainInfo | null>(null);
  const { toast } = useToast();

  const loadFavorites = useCallback(async () => {
    try {
      const ids = await fetchFavoriteCaptainIds();
      if (isPassenger) {
        try {
          const linked = await getRiderLinkedCaptain();
          setLinkedCaptain(linked);
        } catch {}
      }
      setFavoriteCaptainIds(ids);

      try {
        const stored = await dexieDb.favoriteCaptains.toArray();
        setDexieFavorites(stored || []);
      } catch {}
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, [isPassenger]);

  useEffect(() => {
    void loadFavorites();

    const handleFavoritesUpdated = () => {
      void loadFavorites();
    };

    window.addEventListener('radar_favorites_updated', handleFavoritesUpdated);
    window.addEventListener('rider-favorites-updated', handleFavoritesUpdated);
    return () => {
      window.removeEventListener('radar_favorites_updated', handleFavoritesUpdated);
      window.removeEventListener('rider-favorites-updated', handleFavoritesUpdated);
    };
  }, [loadFavorites]);

  const favoriteCaptains = useMemo(() => {
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
        captainName: linkedCaptain.captain_name || tRef('defaultCaptainName'),
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

    const rankWeight: Record<string, number> = {
      DIAMOND: 5,
      PLATINUM: 4,
      GOLD: 3,
      BRONZE: 2,
      SILVER: 1,
    };

    return [...byCaptain.entries()]
      .map(([captainId, trip]) => ({
        ...trip,
        id: captainId,
        captainId,
      }))
      .sort((a, b) => {
        const aRank = rankWeight[String(a.captainRank || '').toUpperCase()] ?? 1;
        const bRank = rankWeight[String(b.captainRank || '').toUpperCase()] ?? 1;
        if (aRank !== bRank) {
          return bRank - aRank; // Higher rank first (Diamond > Platinum > Gold > Bronze > Silver)
        }
        return (a.timestamp || 0) - (b.timestamp || 0); // Seniority: earlier addition first
      });
  }, [favoriteCaptainIds, dexieFavorites, riderHistoricalTrips, linkedCaptain, tRef, isArabic]);

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

  return {
    favoriteCaptainIds,
    dexieFavorites,
    linkedCaptain,
    loadFavorites,
    favoriteCaptains,
    toggleFavorite,
  };
}
