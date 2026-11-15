import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { getServerTime } from '@/lib/server-time';
import { HistoricalTrip } from '../components/dashboard/dashboard-shared';
import {
  THREE_DAYS_MS,
  sanitizeText,
  favoriteMatchesTrip,
} from './use-rider-dashboard-helpers';
import { useRiderDashboardFavorites } from './use-rider-dashboard-favorites';

export {
  THREE_DAYS_MS,
  sanitizeText,
  getFavoriteStableId,
  favoriteMatchesTrip,
} from './use-rider-dashboard-helpers';

export function useRiderDashboardState(
  riderProfile: { id: string },
  tripsWithin72Hours: HistoricalTrip[]
) {
  const t = useTranslations('riderDashboard');
  const { toast } = useToast();
  
  const [reportText, setReportText] = useState('');
  const [ledgerTrips, setLedgerTrips] = useState<RiderTripLedgerEntry[]>([]);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(getServerTime());

  const {
    favoriteCaptains,
    uniqueFavoriteCaptains,
    removeFavorite,
    toggleFavorite,
    updateCaptainType,
  } = useRiderDashboardFavorites();

  const activeArchive = useMemo(
    () => ledgerTrips.filter((trip) => currentTime < trip.purgeAt).sort((a, b) => b.timestamp - a.timestamp),
    [currentTime, ledgerTrips],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(getServerTime()), 60000);
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
