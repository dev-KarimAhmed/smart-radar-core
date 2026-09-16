import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { dexieDb, RadarCaptainFavoriteKernel, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { HistoricalTrip, FavoriteCaptain } from '../components/dashboard/dashboard-shared';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const sanitizeText = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
};

const normalizeFavoriteValue = (value: string | null | undefined) => sanitizeText(value).trim().toLowerCase();

export const getFavoriteStableId = (favorite: Pick<FavoriteCaptain, 'captainId' | 'captainPhone' | 'captainName' | 'tripId'>) =>
  normalizeFavoriteValue(favorite.captainId) ||
  normalizeFavoriteValue(favorite.captainPhone) ||
  normalizeFavoriteValue(favorite.captainName) ||
  normalizeFavoriteValue(favorite.tripId);

export const favoriteMatchesTrip = (favorite: FavoriteCaptain, trip: HistoricalTrip) => {
  const tripCaptainId = normalizeFavoriteValue(trip.captainId);
  const favoriteCaptainId = normalizeFavoriteValue(favorite.captainId);

  if (tripCaptainId && favoriteCaptainId && tripCaptainId === favoriteCaptainId) return true;
  if (normalizeFavoriteValue(favorite.captainPhone) && normalizeFavoriteValue(favorite.captainPhone) === normalizeFavoriteValue(trip.captainPhone)) return true;

  return (
    normalizeFavoriteValue(favorite.captainName) === normalizeFavoriteValue(trip.captainName) &&
    normalizeFavoriteValue(favorite.vehicleInfo) === normalizeFavoriteValue(trip.vehicleInfo)
  );
};

export function useRiderDashboardState(
  riderProfile: { id: string },
  tripsWithin72Hours: HistoricalTrip[]
) {
  const t = useTranslations('riderDashboard');
  const { toast } = useToast();
  
  const [reportText, setReportText] = useState('');
  const [favoriteCaptains, setFavoriteCaptains] = useState<FavoriteCaptain[]>([]);
  const [ledgerTrips, setLedgerTrips] = useState<RiderTripLedgerEntry[]>([]);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const activeArchive = useMemo(
    () => ledgerTrips.filter((trip) => currentTime < trip.purgeAt).sort((a, b) => b.timestamp - a.timestamp),
    [currentTime, ledgerTrips],
  );

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
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const loadLedger = async () => {
    try {
      await dexieDb.riderTripLedger.where('purgeAt').belowOrEqual(Date.now()).delete();

      const existing = await dexieDb.riderTripLedger.toArray();
      if (existing.length === 0 && tripsWithin72Hours.length > 0) {
        for (const trip of tripsWithin72Hours) {
          const entry = {
            ...trip,
            captainName: sanitizeText(trip.captainName),
            vehicleInfo: sanitizeText(trip.vehicleInfo),
            purgeAt: trip.timestamp + THREE_DAYS_MS,
          };
          const stored = await dexieDb.riderTripLedger.where('tripId').equals(trip.tripId).first();
          if (stored?.id !== undefined) {
            await dexieDb.riderTripLedger.update(stored.id, entry);
          } else {
            try {
              await dexieDb.riderTripLedger.add(entry);
            } catch (error: any) {
              if (error?.name !== 'ConstraintError') throw error;
              const duplicate = await dexieDb.riderTripLedger.where('tripId').equals(trip.tripId).first();
              if (duplicate?.id !== undefined) {
                await dexieDb.riderTripLedger.update(duplicate.id, entry);
              }
            }
          }
        }
      }

      const ledger = await dexieDb.riderTripLedger.where('purgeAt').above(Date.now()).toArray();
      setLedgerTrips(ledger);
    } catch (error) {
      console.error('Failed to load rider ledger from Dexie:', error);
      setLedgerTrips(
        tripsWithin72Hours.map((trip) => ({
          ...trip,
          purgeAt: trip.timestamp + THREE_DAYS_MS,
        })),
      );
    }
  };

  useEffect(() => {
    loadLedger();
  }, [tripsWithin72Hours]);

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

  const handleSilentReport = async (tripId: string) => {
    if (!reportText.trim()) return;

    let localBufferCords = '';
    try {
      const stored = localStorage.getItem('sovereign_gps_local_buffer');
      if (stored) {
        const parsed = JSON.parse(stored);
        localBufferCords = parsed
          .map((pt: { lat: number; lng: number; timestamp: number }) =>
            `[${pt.lat.toFixed(5)},${pt.lng.toFixed(5)}@${new Date(pt.timestamp).toISOString().slice(11, 19)}]`,
          )
          .join(', ');
      }
    } catch (error) {
      console.warn('Failed to read local GPS buffer:', error);
    }

    const payloadText = `${reportText.trim()} | GPS buffer: ${localBufferCords || 'none'}`;

    try {
      const reports = JSON.parse(localStorage.getItem('radar_rider_local_reports') || '[]');
      reports.push({
        tripId,
        reportText: reportText.trim(),
        payloadText,
        riderId: riderProfile.id || 'anonymous',
        timestamp: Date.now(),
      });
      localStorage.setItem('radar_rider_local_reports', JSON.stringify(reports.slice(-30)));
    } catch (error) {
      console.error('Failed to store local report:', error);
    }

    setReportText('');
    toast({
      title: t('toast.reportSent'),
      description: t('toast.reportSentDesc'),
    });
  };

  return {
    reportText,
    setReportText,
    favoriteCaptains,
    isPortfolioOpen,
    setIsPortfolioOpen,
    currentTime,
    activeArchive,
    uniqueFavoriteCaptains,
    removeFavorite,
    toggleFavorite,
    updateCaptainType,
    handleSilentReport,
    favoriteMatchesTrip,
  };
}
