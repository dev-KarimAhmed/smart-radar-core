'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Briefcase, Clock, Heart, MessageCircle, Phone, Send, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { dexieDb, RadarCaptainFavoriteKernel, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

import { cn } from '@/lib/utils';
const styles = {
  style358_1: "radar-rider-container relative mx-auto max-w-xl overflow-hidden rounded-xl border border-[#14B8A6]/20 bg-[#0F172A]/70 p-5 text-white shadow-2xl shadow-black/40 backdrop-blur-xl md:p-6",
  style358_2: "text-right",
  style358_3: "text-left",
  style361_4: "mb-4 border-b border-white/10 pb-4",
  style362_5: "mb-3 text-base font-black text-[#14B8A6] md:text-lg",
  style363_6: "flex items-center justify-between rounded-xl border border-[#14B8A6]/20 bg-white/[0.04] p-4 backdrop-blur",
  style364_7: "text-[11px] font-bold text-gray-300",
  style366_8: "rounded-lg px-3 py-1 text-lg font-black md:text-xl",
  style377_9: "mt-2 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[10px] text-[#ff3366]",
  style378_10: "h-3.5 w-3.5 shrink-0",
  style379_11: "font-bold",
  style386_12: "mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-xs font-black text-white hover:bg-[#14B8A6]/20",
  style388_13: "h-4 w-4 text-[#14B8A6]",
  style394_14: "mb-6 space-y-3",
  style395_15: "text-xs font-bold uppercase tracking-wide text-gray-400",
  style398_16: "rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center",
  style399_17: "mx-auto mb-2 h-5 w-5 text-gray-600",
  style400_18: "text-[11px] text-gray-500",
  style411_19: "relative space-y-3 rounded-xl border border-white/10 border-r-4 border-r-[#14B8A6] bg-white/[0.04] p-4 shadow-md backdrop-blur transition-all hover:border-[#14B8A6]/30",
  style415_20: "absolute left-3 top-3 rounded-md p-1.5 text-rose-500 transition-all hover:bg-neutral-900",
  style420_21: "h-5 w-5 transition-all duration-300",
  style421_22: "fill-[#14B8A6] text-[#14B8A6]",
  style421_23: "text-gray-400 hover:text-[#14B8A6]",
  style426_24: "space-y-1 pl-8 text-[12px] md:text-[13px]",
  style427_25: "text-gray-300",
  style429_26: "font-black text-white",
  style431_27: "text-[10px] text-amber-400",
  style434_28: "font-black text-amber-400",
  style437_29: "text-[11px] text-gray-400",
  style444_30: "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-4 text-[11px] font-black text-[#14B8A6] transition-all hover:bg-[#14B8A6]/20",
  style447_31: "h-3.5 w-3.5",
  style451_32: "flex items-center gap-2 border-t border-white/10 pt-2",
  style457_33: "min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-[11px] text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none",
  style457_34: "text-right",
  style457_35: "text-left",
  style462_36: "h-8 shrink-0 rounded-lg border border-red-500/20 bg-red-950/30 px-3 text-[10px] font-black text-red-400 hover:bg-red-900/40",
  style464_37: "ml-1 h-3 w-3",
  style469_38: "flex items-center justify-between text-[10px] text-gray-500",
  style470_39: "flex items-center gap-1 font-bold text-rose-500",
  style471_40: "h-3 w-3",
  style474_41: "font-mono text-[9px] text-gray-600",
  style482_42: "space-y-3 rounded-xl border border-white/[0.06] bg-[#0F172A]/40 p-4",
  style483_43: "flex items-center justify-between border-b border-white/10 pb-2 text-xs font-black uppercase tracking-wide text-[#14B8A6]",
  style485_44: "rounded-full bg-[#14B8A6]/10 px-2 py-0.5 font-mono text-[8px] text-[#14B8A6]",
  style491_45: "rounded-lg border border-dashed border-[#14B8A6]/10 bg-black/30 p-4 text-center",
  style492_46: "mx-auto mb-2 h-5 w-5 text-gray-600",
  style493_47: "text-[10px] leading-normal text-gray-400",
  style496_48: "grid grid-cols-1 gap-2.5",
  style498_49: "relative space-y-2 rounded-lg border border-[#14B8A6]/20 bg-black/80 p-3",
  style501_50: "absolute left-2 top-2 p-1 text-rose-500 transition-all hover:scale-105",
  style505_51: "h-3.5 w-3.5 opacity-70 hover:opacity-100",
  style508_52: "pl-6 text-[11px]",
  style509_53: "text-[12px] font-extrabold text-white",
  style511_54: "font-mono text-[9px] text-amber-400",
  style513_55: "text-[10px] leading-normal text-gray-400",
  style516_56: "flex items-center justify-between border-t border-white/10 pt-2",
  style517_57: "rounded border border-[#14B8A6]/10 bg-[#14B8A6]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#14B8A6]",
  style522_58: "flex h-7 items-center gap-1 rounded-md border border-[#14B8A6]/20 bg-[#14B8A6] px-2.5 text-[10px] font-black text-[#031315] hover:bg-[#2DD4BF]",
  style525_59: "h-3 w-3",
  style535_60: "mt-6 space-y-3 rounded-xl border border-white/[0.06] bg-[#0F172A]/40 p-4",
  style536_61: "border-b border-white/10 pb-2 text-xs font-black text-amber-400",
  style540_62: "space-y-2 pr-1 text-[11px] leading-relaxed text-gray-300",
  style542_63: "flex items-start gap-2 text-right",
  style543_64: "mt-0.5 shrink-0 text-amber-500",
  style549_65: "py-1 text-center text-[10px] italic text-gray-500",
  style554_66: "absolute inset-0 z-50 flex flex-col overflow-y-auto bg-[#0A0F1D]/98 p-5 md:p-6",
  style554_67: "text-right",
  style554_68: "text-left",
  style555_69: "mb-4 flex items-center justify-between border-b border-[#14B8A6]/20 pb-4",
  style556_70: "flex items-center gap-2",
  style557_71: "h-5 w-5 text-[#14B8A6]",
  style558_72: "text-sm font-black text-white md:text-base",
  style562_73: "rounded-lg bg-neutral-900 p-1.5 text-gray-400 transition-all hover:bg-neutral-800 hover:text-white",
  style565_74: "h-5 w-5",
  style569_75: "flex-1 space-y-4",
  style570_76: "mb-1 text-right text-[10px] leading-relaxed text-gray-400",
  style575_77: "flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#14B8A6]/10 bg-black/40 p-5 text-center opacity-80",
  style576_78: "mb-2 h-10 w-10 text-gray-600",
  style577_79: "text-xs font-black text-gray-400",
  style578_80: "mt-1 text-[10px] leading-normal text-gray-500",
  style581_81: "space-y-3",
  style589_82: "relative space-y-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0F172A]/40 p-4 shadow-md",
  style589_83: "text-right",
  style589_84: "text-left",
  style593_85: "absolute left-3 top-3 rounded-lg border border-red-500/10 bg-red-950/20 p-1.5 text-red-400 transition-all hover:border-red-500/30 hover:bg-red-950/50",
  style597_86: "h-3.5 w-3.5",
  style600_87: "space-y-1 pl-8",
  style601_88: "flex items-center gap-1.5",
  style602_89: "text-xs font-extrabold text-white md:text-sm",
  style603_90: "rounded border border-amber-500/10 bg-amber-950/20 px-1 py-0.5 font-mono text-[10px] text-amber-400",
  style607_91: "text-[10px] leading-normal text-gray-400",
  style608_92: "font-mono text-[9px] text-[#14B8A6]",
  style613_93: "border-t border-dashed border-white/[0.06] pt-2.5",
  style614_94: "mb-1 block text-[9px] text-gray-400",
  style615_95: "grid grid-cols-3 gap-1.5",
  style620_96: "h-7 rounded-md border text-[9px] font-black transition-all",
  style623_97: "border-white bg-white text-black",
  style625_98: "border-[#14B8A6]/30 bg-[#14B8A6]/20 text-[#14B8A6]",
  style626_99: "border-blue-500/30 bg-blue-950/20 text-blue-300",
  style627_100: "border-white/10 bg-black/40 text-gray-500 hover:border-white/20",
  style637_101: "flex gap-2.5 border-t border-white/10 pt-2",
  style640_102: "flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-[#14B8A6] text-[10px] font-black text-[#031315] transition-transform hover:scale-[1.01] hover:bg-[#2DD4BF]",
  style643_103: "h-3.5 w-3.5",
  style650_104: "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[10px] font-black text-[#14B8A6] transition-transform hover:scale-[1.01] hover:bg-[#14B8A6]/20",
  style653_105: "h-3.5 w-3.5 text-[#14B8A6]",
  style664_106: "mt-6 border-t border-white/10 pt-4 text-center",
  style667_107: "rounded-lg bg-neutral-900 px-6 py-2 text-[11px] font-black text-white hover:bg-neutral-800",
} as const;


export interface HistoricalTrip {
  tripId: string;
  captainId?: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
}

interface FavoriteCaptain extends HistoricalTrip {
  id?: number;
  heartedAt: number;
  captainType?: 'uber' | 'careem' | 'independent';
}

interface RiderDashboardProps {
  riderProfile: {
    id: string;
    rating: number;
    governorate: string;
    district: string;
  };
  tripsWithin72Hours: HistoricalTrip[];
  systemMessages: string[];
  currencyLabel?: string;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;


const sanitizeText = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
};

const normalizeFavoriteValue = (value: string | null | undefined) => sanitizeText(value).trim().toLowerCase();

const getCaptainStableId = (trip: Pick<HistoricalTrip, 'captainId' | 'captainPhone' | 'captainName'>) =>
  normalizeFavoriteValue(trip.captainId) ||
  normalizeFavoriteValue(trip.captainPhone) ||
  normalizeFavoriteValue(trip.captainName);

const getFavoriteStableId = (favorite: Pick<FavoriteCaptain, 'captainId' | 'captainPhone' | 'captainName' | 'tripId'>) =>
  normalizeFavoriteValue(favorite.captainId) ||
  normalizeFavoriteValue(favorite.captainPhone) ||
  normalizeFavoriteValue(favorite.captainName) ||
  normalizeFavoriteValue(favorite.tripId);

const favoriteMatchesTrip = (favorite: FavoriteCaptain, trip: HistoricalTrip) => {
  const tripCaptainId = normalizeFavoriteValue(trip.captainId);
  const favoriteCaptainId = normalizeFavoriteValue(favorite.captainId);

  if (tripCaptainId && favoriteCaptainId && tripCaptainId === favoriteCaptainId) return true;
  if (normalizeFavoriteValue(favorite.captainPhone) && normalizeFavoriteValue(favorite.captainPhone) === normalizeFavoriteValue(trip.captainPhone)) return true;

  return (
    normalizeFavoriteValue(favorite.captainName) === normalizeFavoriteValue(trip.captainName) &&
    normalizeFavoriteValue(favorite.vehicleInfo) === normalizeFavoriteValue(trip.vehicleInfo)
  );
};

const formatDashboardMoney = (value: number, currencyLabel: string) =>
  currencyLabel ? `${Number(value).toFixed(2)} ${currencyLabel}` : Number(value).toFixed(2);

const buildWhatsappUrl = (phone: string, name: string, isArabic: boolean) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0')
    ? `962${cleanPhone.slice(1)}`
    : cleanPhone.startsWith('962')
      ? cleanPhone
      : `962${cleanPhone}`;

  return `https://wa.me/${waPhone}?text=${encodeURIComponent(`${isArabic ? 'مرحبا سائق ' : 'Hello driver '}${sanitizeText(name)}${isArabic ? '، أريد التواصل بخصوص رحلة سابقة.' : ', I want to connect regarding a previous trip.'}`)}`;
};

export const RadarRiderDashboard: React.FC<RiderDashboardProps> = ({
  riderProfile,
  tripsWithin72Hours,
  systemMessages,
  currencyLabel = '',
}) => {
  const { isArabic } = useDashboardLanguage();
  const t = useTranslations('riderDashboard');

  const captainTypeLabel = (type: FavoriteCaptain['captainType']) => {
    if (type === 'uber') return t('recent.uber');
    if (type === 'careem') return t('recent.careem');
    return t('recent.independent');
  };
  const [reportText, setReportText] = useState('');
  const [favoriteCaptains, setFavoriteCaptains] = useState<FavoriteCaptain[]>([]);
  const [ledgerTrips, setLedgerTrips] = useState<RiderTripLedgerEntry[]>([]);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { toast } = useToast();

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

  const updateCaptainType = async (favId: number, type: FavoriteCaptain['captainType']) => {
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

  const deleteFavoriteCard = async (captain: FavoriteCaptain) => {
    await removeFavorite(captain);
  };

  return (
    <div
      className={cn(styles.style358_1, isArabic ? styles.style358_2 : styles.style358_3)}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className={styles.style361_4}>
        <h3 className={styles.style362_5}>{t('recent.title')}</h3>
        <div className={styles.style363_6}>
          <span className={styles.style364_7}>{t('recent.ratingLabel')}</span>
          <strong
            className={styles.style366_8}
            style={{
              color: riderProfile.rating < 4.3 ? '#ff3366' : '#14B8A6',
              backgroundColor: riderProfile.rating < 4.3 ? 'rgba(255,51,102,0.1)' : 'rgba(20,184,166,0.1)',
            }}
          >
            {Math.floor(riderProfile.rating || 5)} / 5
          </strong>
        </div>

        {riderProfile.rating < 4.3 && (
          <div className={styles.style377_9}>
            <AlertCircle className={styles.style378_10} />
            <p className={styles.style379_11}>{t('recent.lowRating')}</p>
          </div>
        )}
      </div>

      <Button
        onClick={() => setIsPortfolioOpen(true)}
        className={styles.style386_12}
      >
        <Briefcase className={styles.style388_13} />
        <span>
          {t('recent.favoritesBag')} ({uniqueFavoriteCaptains.length})
        </span>
      </Button>

      <section className={styles.style394_14}>
        <h4 className={styles.style395_15}>{t('recent.recentTrips')}</h4>

        {activeArchive.length === 0 ? (
          <div className={styles.style398_16}>
            <Trash2 className={styles.style399_17} />
            <p className={styles.style400_18}>{t('recent.noTrips')}</p>
          </div>
        ) : (
          activeArchive.map((trip) => {
            const timeLeftMs = trip.purgeAt - currentTime;
            const hoursLeft = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)));
            const isHearted = favoriteCaptains.some((fav) => favoriteMatchesTrip(fav, trip));

            return (
              <article
                key={trip.tripId}
                className={styles.style411_19}
              >
                <button
                  onClick={(event) => toggleFavorite(event, trip)}
                  className={styles.style415_20}
                  title={isHearted ? t('toast.removedFavorite') : t('toast.savedFavorite')}
                  type="button"
                >
                  <Heart
                    className={cn(styles.style420_21, isHearted ? styles.style421_22 : styles.style421_23)}
                  />
                </button>

                <div className={styles.style426_24}>
                  <p className={styles.style427_25}>
                    {t('recent.captain')}:{' '}
                    <strong className={styles.style429_26}>
                      {trip.captainName}{' '}
                      <span className={styles.style431_27}>[{trip.captainRank}]</span>
                    </strong>
                  </p>
                  <p className={styles.style434_28}>
                    {t('recent.price')}: {formatDashboardMoney(trip.finalPrice, currencyLabel)}
                  </p>
                  <p className={styles.style437_29}>
                    {t('recent.vehicle')}: {trip.vehicleInfo}
                  </p>
                </div>

                <a
                  href={`tel:${trip.captainPhone}`}
                  className={styles.style444_30}
                  style={{ textDecoration: 'none' }}
                >
                  <Phone className={styles.style447_31} />
                  <span>{t('recent.callLostItems')}</span>
                </a>

                <div className={styles.style451_32}>
                  <input
                    type="text"
                    value={reportText}
                    placeholder={t('recent.reportPlaceholder')}
                    onChange={(event) => setReportText(event.target.value)}
                    className={cn(styles.style457_33, isArabic ? styles.style457_34 : styles.style457_35)}
                    dir={isArabic ? 'rtl' : 'ltr'}
                  />
                  <Button
                    onClick={() => handleSilentReport(trip.tripId)}
                    className={styles.style462_36}
                  >
                    <Send className={styles.style464_37} />
                    {t('recent.silentReport')}
                  </Button>
                </div>

                <div className={styles.style469_38}>
                  <span className={styles.style470_39}>
                    <Clock className={styles.style471_40} />
                    {t('recent.autoDeleteIn')}: {hoursLeft} {t('recent.hours')}
                  </span>
                  <span className={styles.style474_41}>Trip ID: {trip.tripId.slice(0, 8)}</span>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className={styles.style482_42}>
        <h4 className={styles.style483_43}>
          <span>{t('recent.savedCaptains')}</span>
          <span className={styles.style485_44}>
            {uniqueFavoriteCaptains.length}
          </span>
        </h4>

        {uniqueFavoriteCaptains.length === 0 ? (
          <div className={styles.style491_45}>
            <Heart className={styles.style492_46} />
            <p className={styles.style493_47}>{t('recent.noFavorites')}</p>
          </div>
        ) : (
          <div className={styles.style496_48}>
            {uniqueFavoriteCaptains.map((captain) => (
              <div key={captain.id ?? captain.tripId} className={styles.style498_49}>
                <button
                  onClick={() => removeFavorite(captain)}
                  className={styles.style501_50}
                  title={t('toast.removedFavorite')}
                  type="button"
                >
                  <Trash2 className={styles.style505_51} />
                </button>

                <div className={styles.style508_52}>
                  <h5 className={styles.style509_53}>
                    {captain.captainName}{' '}
                    <span className={styles.style511_54}>[{captain.captainRank}]</span>
                  </h5>
                  <p className={styles.style513_55}>{captain.vehicleInfo}</p>
                </div>

                <div className={styles.style516_56}>
                  <span className={styles.style517_57}>
                    {t('recent.savedPermanent')}
                  </span>
                  <a
                    href={`tel:${captain.captainPhone}`}
                    className={styles.style522_58}
                    style={{ textDecoration: 'none' }}
                  >
                    <Phone className={styles.style525_59} />
                    <span>{t('recent.callNow')}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.style535_60}>
        <h4 className={styles.style536_61}>
          {t('recent.messagesTitle')} - {riderProfile.district || riderProfile.governorate || t('details.unknown')}
        </h4>
        {systemMessages?.length > 0 ? (
          <ul className={styles.style540_62}>
            {systemMessages.map((msg, index) => (
              <li key={`${msg}-${index}`} className={styles.style542_63}>
                <span className={styles.style543_64}>•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.style549_65}>{t('recent.noMessages')}</p>
        )}
      </section>

      {isPortfolioOpen && (
        <div className={cn(styles.style554_66, isArabic ? styles.style554_67 : styles.style554_68)} dir={isArabic ? 'rtl' : 'ltr'}>
          <div className={styles.style555_69}>
            <div className={styles.style556_70}>
              <Briefcase className={styles.style557_71} />
              <h3 className={styles.style558_72}>{t('recent.portfolioTitle')}</h3>
            </div>
            <button
              onClick={() => setIsPortfolioOpen(false)}
              className={styles.style562_73}
              type="button"
            >
              <X className={styles.style565_74} />
            </button>
          </div>

          <div className={styles.style569_75}>
            <p className={styles.style570_76}>
              {t('recent.portfolioDescription')}
            </p>

            {uniqueFavoriteCaptains.length === 0 ? (
              <div className={styles.style575_77}>
                <Heart className={styles.style576_78} />
                <h5 className={styles.style577_79}>{t('recent.portfolioEmpty')}</h5>
                <p className={styles.style578_80}>{t('recent.portfolioEmptyDescription')}</p>
              </div>
            ) : (
              <div className={styles.style581_81}>
                {uniqueFavoriteCaptains.map((captain) => {
                  const savedType = captain.captainType || 'independent';
                  const whatsappUrl = buildWhatsappUrl(captain.captainPhone, captain.captainName, isArabic);

                  return (
                    <article
                      key={captain.id ?? captain.tripId}
                      className={cn(styles.style589_82, isArabic ? styles.style589_83 : styles.style589_84)}
                    >
                      <button
                        onClick={() => deleteFavoriteCard(captain)}
                        className={styles.style593_85}
                        title={t('toast.cardDeleted')}
                        type="button"
                      >
                        <Trash2 className={styles.style597_86} />
                      </button>

                      <div className={styles.style600_87}>
                        <div className={styles.style601_88}>
                          <h4 className={styles.style602_89}>{captain.captainName}</h4>
                          <span className={styles.style603_90}>
                            [{captain.captainRank}]
                          </span>
                        </div>
                        <p className={styles.style607_91}>{captain.vehicleInfo}</p>
                        <p className={styles.style608_92}>
                          {t('recent.lastPrice')}: {formatDashboardMoney(captain.finalPrice || 3, currencyLabel)}
                        </p>
                      </div>

                      <div className={styles.style613_93}>
                        <span className={styles.style614_94}>{t('recent.category')}</span>
                        <div className={styles.style615_95}>
                          {(['uber', 'careem', 'independent'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => captain.id && updateCaptainType(captain.id, type)}
                              className={cn(styles.style620_96, savedType === type
                                  ? type === 'uber'
                                    ? styles.style623_97
                                    : type === 'careem'
                                      ? styles.style625_98
                                      : styles.style626_99
                                  : styles.style627_100)}
                              type="button"
                            >
                              {captainTypeLabel(type)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.style637_101}>
                        <a
                          href={`tel:${captain.captainPhone}`}
                          className={styles.style640_102}
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className={styles.style643_103} />
                          <span>{t('recent.callNow')}</span>
                        </a>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.style650_104}
                          style={{ textDecoration: 'none' }}
                        >
                          <MessageCircle className={styles.style653_105} />
                          <span>{t('recent.whatsapp')}</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.style664_106}>
            <Button
              onClick={() => setIsPortfolioOpen(false)}
              className={styles.style667_107}
            >
              {t('recent.close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

try {
  Object.freeze(RadarRiderDashboard);
} catch (error) {
  console.warn('Failed to freeze RadarRiderDashboard component definition', error);
}
