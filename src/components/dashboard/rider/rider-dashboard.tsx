'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Briefcase, Clock, Heart, MessageCircle, Phone, Send, Trash2, X } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { dexieDb, RadarCaptainFavoriteKernel } from '@/lib/dexie-db';
import { auth, db } from '@/lib/firebase';
import { riderDashboardCopy } from '@/lib/i18n/rider-dashboard-copy';

export interface HistoricalTrip {
  tripId: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE';
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
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const copy = riderDashboardCopy.ar;

const sanitizeText = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
};

const captainTypeLabel = (type: FavoriteCaptain['captainType']) => {
  if (type === 'uber') return copy.recent.uber;
  if (type === 'careem') return copy.recent.careem;
  return copy.recent.independent;
};

const buildWhatsappUrl = (phone: string, name: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0')
    ? `962${cleanPhone.slice(1)}`
    : cleanPhone.startsWith('962')
      ? cleanPhone
      : `962${cleanPhone}`;

  return `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحبا كابتن ${sanitizeText(name)}، أريد التواصل بخصوص رحلة سابقة.`)}`;
};

export const RadarRiderDashboard: React.FC<RiderDashboardProps> = ({
  riderProfile,
  tripsWithin72Hours,
  systemMessages,
}) => {
  const [reportText, setReportText] = useState('');
  const [favoriteCaptains, setFavoriteCaptains] = useState<FavoriteCaptain[]>([]);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const { toast } = useToast();

  const now = Date.now();
  const activeArchive = useMemo(
    () => tripsWithin72Hours.filter((trip) => now - trip.timestamp < THREE_DAYS_MS),
    [now, tripsWithin72Hours],
  );

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

  const removeFavorite = async (favorite: FavoriteCaptain) => {
    const existing =
      favorite.id !== undefined
        ? favorite
        : await dexieDb.favoriteCaptains.where('tripId').equals(favorite.tripId).first();

    if (existing?.id !== undefined) {
      await dexieDb.favoriteCaptains.delete(existing.id);
    }

    try {
      localStorage.removeItem(`radar_preferred_captain_${favorite.tripId}`);
    } catch (error) {
      console.warn('Storage delete failed:', error);
    }

    toast({
      title: copy.toast.removedFavorite,
      description: copy.toast.removedFavoriteDesc,
    });
    loadFavorites();
  };

  const toggleFavorite = async (event: React.MouseEvent, trip: HistoricalTrip) => {
    event.stopPropagation();

    try {
      const existing = await dexieDb.favoriteCaptains.where('tripId').equals(trip.tripId).first();
      if (existing) {
        await removeFavorite({ ...(existing as FavoriteCaptain), ...trip });
        return;
      }

      const captainType =
        trip.captainRank === 'PLATINUM' ? 'careem' : trip.captainRank === 'GOLD' ? 'uber' : 'independent';

      RadarCaptainFavoriteKernel.mummifyTrustedCaptain(
        {
          captainId: trip.tripId,
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
        title: copy.toast.savedFavorite,
        description: copy.toast.savedFavoriteDesc,
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
            `radar_preferred_captain_${favorite.tripId}`,
            JSON.stringify({
              captainId: favorite.tripId,
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
        title: copy.toast.categoryUpdated,
        description: `${copy.toast.categoryUpdatedDesc} ${captainTypeLabel(type)}.`,
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
      await addDoc(collection(db, 'silent_reports'), {
        tripId,
        reportText: reportText.trim(),
        payloadText,
        riderId: auth.currentUser?.uid || riderProfile.id || 'anonymous',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to submit report:', error);
    }

    setReportText('');
    toast({
      title: copy.toast.reportSent,
      description: copy.toast.reportSentDesc,
    });
  };

  const deleteFavoriteCard = async (captain: FavoriteCaptain) => {
    if (captain.id !== undefined) {
      await dexieDb.favoriteCaptains.delete(captain.id);
    }

    try {
      localStorage.removeItem(`radar_preferred_captain_${captain.tripId}`);
    } catch (error) {
      console.warn('Storage delete failed:', error);
    }

    loadFavorites();
    toast({
      title: copy.toast.cardDeleted,
      description: copy.toast.cardDeletedDesc,
    });
  };

  return (
    <div
      className="radar-rider-container relative mx-auto max-w-xl overflow-hidden rounded-xl border border-emerald-900 bg-black p-5 text-right text-white shadow-2xl md:p-6"
      dir="rtl"
    >
      <div className="mb-4 border-b border-white/10 pb-4">
        <h3 className="mb-3 text-base font-black text-emerald-400 md:text-lg">{copy.recent.title}</h3>
        <div className="flex items-center justify-between rounded-xl border border-emerald-950/50 bg-[#0a0f0a] p-4">
          <span className="text-[11px] font-bold text-gray-300">{copy.recent.ratingLabel}</span>
          <strong
            className="rounded-lg px-3 py-1 text-lg font-black md:text-xl"
            style={{
              color: riderProfile.rating < 4.3 ? '#ff3366' : '#00ffcc',
              backgroundColor: riderProfile.rating < 4.3 ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,204,0.1)',
            }}
          >
            {riderProfile.rating.toFixed(2)} / 5.0
          </strong>
        </div>

        {riderProfile.rating < 4.3 && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[10px] text-[#ff3366]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <p className="font-bold">{copy.recent.lowRating}</p>
          </div>
        )}
      </div>

      <Button
        onClick={() => setIsPortfolioOpen(true)}
        className="mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950 text-xs font-black text-white hover:bg-emerald-900"
      >
        <Briefcase className="h-4 w-4 text-[#00ffcc]" />
        <span>
          {copy.recent.favoritesBag} ({favoriteCaptains.length})
        </span>
      </Button>

      <section className="mb-6 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">{copy.recent.recentTrips}</h4>

        {activeArchive.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center">
            <Trash2 className="mx-auto mb-2 h-5 w-5 text-gray-600" />
            <p className="text-[11px] text-gray-500">{copy.recent.noTrips}</p>
          </div>
        ) : (
          activeArchive.map((trip) => {
            const timeLeftMs = THREE_DAYS_MS - (now - trip.timestamp);
            const hoursLeft = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)));
            const isHearted = favoriteCaptains.some((fav) => fav.tripId === trip.tripId);

            return (
              <article
                key={trip.tripId}
                className="relative space-y-3 rounded-xl border border-white/10 border-r-4 border-r-emerald-500 bg-[#0b0c0b] p-4 shadow-md transition-all hover:border-emerald-500/30"
              >
                <button
                  onClick={(event) => toggleFavorite(event, trip)}
                  className="absolute left-3 top-3 rounded-md p-1.5 text-rose-500 transition-all hover:bg-neutral-900"
                  title={isHearted ? copy.toast.removedFavorite : copy.toast.savedFavorite}
                  type="button"
                >
                  <Heart
                    className={`h-5 w-5 transition-all duration-300 ${
                      isHearted ? 'fill-[#00ffcc] text-[#00ffcc]' : 'text-gray-400 hover:text-[#00ffcc]'
                    }`}
                  />
                </button>

                <div className="space-y-1 pl-8 text-[12px] md:text-[13px]">
                  <p className="text-gray-300">
                    {copy.recent.captain}:{' '}
                    <strong className="font-black text-white">
                      {trip.captainName}{' '}
                      <span className="text-[10px] text-amber-400">[{trip.captainRank}]</span>
                    </strong>
                  </p>
                  <p className="font-black text-amber-400">
                    {copy.recent.price}: {trip.finalPrice} د.أ
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {copy.recent.vehicle}: {trip.vehicleInfo}
                  </p>
                </div>

                <a
                  href={`tel:${trip.captainPhone}`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 text-[11px] font-black text-emerald-400 transition-all hover:bg-emerald-950/60"
                  style={{ textDecoration: 'none' }}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{copy.recent.callLostItems}</span>
                </a>

                <div className="flex items-center gap-2 border-t border-white/10 pt-2">
                  <input
                    type="text"
                    value={reportText}
                    placeholder={copy.recent.reportPlaceholder}
                    onChange={(event) => setReportText(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-right text-[11px] text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none"
                    dir="rtl"
                  />
                  <Button
                    onClick={() => handleSilentReport(trip.tripId)}
                    className="h-8 shrink-0 rounded-lg border border-red-500/20 bg-red-950/30 px-3 text-[10px] font-black text-red-400 hover:bg-red-900/40"
                  >
                    <Send className="ml-1 h-3 w-3" />
                    {copy.recent.silentReport}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1 font-bold text-rose-500">
                    <Clock className="h-3 w-3" />
                    {copy.recent.autoDeleteIn}: {hoursLeft} {copy.recent.hours}
                  </span>
                  <span className="font-mono text-[9px] text-gray-600">Trip ID: {trip.tripId.slice(0, 8)}</span>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-emerald-500/20 bg-[#050c05]/60 p-4">
        <h4 className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-black uppercase tracking-wide text-[#00ffcc]">
          <span>{copy.recent.savedCaptains}</span>
          <span className="rounded-full bg-emerald-950 px-2 py-0.5 font-mono text-[8px] text-emerald-400">
            {favoriteCaptains.length}
          </span>
        </h4>

        {favoriteCaptains.length === 0 ? (
          <div className="rounded-lg border border-dashed border-emerald-500/10 bg-black/30 p-4 text-center">
            <Heart className="mx-auto mb-2 h-5 w-5 text-gray-600" />
            <p className="text-[10px] leading-normal text-gray-400">{copy.recent.noFavorites}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {favoriteCaptains.map((captain) => (
              <div key={captain.id ?? captain.tripId} className="relative space-y-2 rounded-lg border border-emerald-500/20 bg-black/80 p-3">
                <button
                  onClick={() => removeFavorite(captain)}
                  className="absolute left-2 top-2 p-1 text-rose-500 transition-all hover:scale-105"
                  title={copy.toast.removedFavorite}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5 opacity-70 hover:opacity-100" />
                </button>

                <div className="pl-6 text-[11px]">
                  <h5 className="text-[12px] font-extrabold text-white">
                    {captain.captainName}{' '}
                    <span className="font-mono text-[9px] text-amber-400">[{captain.captainRank}]</span>
                  </h5>
                  <p className="text-[10px] leading-normal text-gray-400">{captain.vehicleInfo}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="rounded border border-emerald-500/10 bg-[#0a200a] px-1.5 py-0.5 text-[9px] font-bold text-[#00ffcc]">
                    {copy.recent.savedPermanent}
                  </span>
                  <a
                    href={`tel:${captain.captainPhone}`}
                    className="flex h-7 items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-600 px-2.5 text-[10px] font-black text-white hover:bg-emerald-500"
                    style={{ textDecoration: 'none' }}
                  >
                    <Phone className="h-3 w-3" />
                    <span>{copy.recent.callNow}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 space-y-3 rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
        <h4 className="border-b border-white/10 pb-2 text-xs font-black text-amber-400">
          {copy.recent.messagesTitle} - {riderProfile.district || riderProfile.governorate || copy.details.unknown}
        </h4>
        {systemMessages?.length > 0 ? (
          <ul className="space-y-2 pr-1 text-[11px] leading-relaxed text-gray-300">
            {systemMessages.map((msg, index) => (
              <li key={`${msg}-${index}`} className="flex items-start gap-2 text-right">
                <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-1 text-center text-[10px] italic text-gray-500">{copy.recent.noMessages}</p>
        )}
      </section>

      {isPortfolioOpen && (
        <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto bg-[#040604]/98 p-5 md:p-6" dir="rtl">
          <div className="mb-4 flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#00ffcc]" />
              <h3 className="text-sm font-black text-white md:text-base">{copy.recent.portfolioTitle}</h3>
            </div>
            <button
              onClick={() => setIsPortfolioOpen(false)}
              className="rounded-lg bg-neutral-900 p-1.5 text-gray-400 transition-all hover:bg-neutral-800 hover:text-white"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            <p className="mb-1 text-right text-[10px] leading-relaxed text-gray-400">
              {copy.recent.portfolioDescription}
            </p>

            {favoriteCaptains.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/10 bg-black/40 p-5 text-center opacity-80">
                <Heart className="mb-2 h-10 w-10 text-gray-600" />
                <h5 className="text-xs font-black text-gray-400">{copy.recent.portfolioEmpty}</h5>
                <p className="mt-1 text-[10px] leading-normal text-gray-500">{copy.recent.portfolioEmptyDescription}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteCaptains.map((captain) => {
                  const savedType = captain.captainType || 'independent';
                  const whatsappUrl = buildWhatsappUrl(captain.captainPhone, captain.captainName);

                  return (
                    <article
                      key={captain.id ?? captain.tripId}
                      className="relative space-y-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-[#080d08] p-4 text-right shadow-md"
                    >
                      <button
                        onClick={() => deleteFavoriteCard(captain)}
                        className="absolute left-3 top-3 rounded-lg border border-red-500/10 bg-red-950/20 p-1.5 text-red-400 transition-all hover:border-red-500/30 hover:bg-red-950/50"
                        title={copy.toast.cardDeleted}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="space-y-1 pl-8">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-white md:text-sm">{captain.captainName}</h4>
                          <span className="rounded border border-amber-500/10 bg-amber-950/20 px-1 py-0.5 font-mono text-[10px] text-amber-400">
                            [{captain.captainRank}]
                          </span>
                        </div>
                        <p className="text-[10px] leading-normal text-gray-400">{captain.vehicleInfo}</p>
                        <p className="font-mono text-[9px] text-[#00ffcc]">
                          {copy.recent.lastPrice}: {captain.finalPrice || '3.0'} د.أ
                        </p>
                      </div>

                      <div className="border-t border-dashed border-emerald-950/50 pt-2.5">
                        <span className="mb-1 block text-[9px] text-gray-400">{copy.recent.category}</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['uber', 'careem', 'independent'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => captain.id && updateCaptainType(captain.id, type)}
                              className={`h-7 rounded-md border text-[9px] font-black transition-all ${
                                savedType === type
                                  ? type === 'uber'
                                    ? 'border-white bg-white text-black'
                                    : type === 'careem'
                                      ? 'border-[#00ffc4]/30 bg-[#00ffc4]/20 text-[#00ffc4]'
                                      : 'border-emerald-500/30 bg-emerald-950 text-emerald-300'
                                  : 'border-white/10 bg-black/40 text-gray-500 hover:border-white/20'
                              }`}
                              type="button"
                            >
                              {captainTypeLabel(type)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2.5 border-t border-white/10 pt-2">
                        <a
                          href={`tel:${captain.captainPhone}`}
                          className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-[10px] font-black text-white transition-transform hover:scale-[1.01] hover:bg-emerald-500"
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>{copy.recent.callNow}</span>
                        </a>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-[10px] font-black text-[#00ffcc] transition-transform hover:scale-[1.01] hover:bg-emerald-900"
                          style={{ textDecoration: 'none' }}
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{copy.recent.whatsapp}</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <Button
              onClick={() => setIsPortfolioOpen(false)}
              className="rounded-lg bg-neutral-900 px-6 py-2 text-[11px] font-black text-white hover:bg-neutral-800"
            >
              {copy.recent.close}
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
