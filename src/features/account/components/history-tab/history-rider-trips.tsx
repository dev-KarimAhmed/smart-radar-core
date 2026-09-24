import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle, FileText, Heart, Phone, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHistoryMoney, type HistoricalTrip } from './history-shared';
import { HistorySkeleton } from './history-skeleton';

interface HistoryRiderTripsProps {
  riderHistoricalTrips: HistoricalTrip[];
  loading: boolean;
  favoriteCaptainIds: Set<string>;
  toggleFavorite: (trip: HistoricalTrip) => void;
  currencyLabel: string;
  isArabic: boolean;
  now: number;
  tripReviews: Record<string, any>;
  t: any;
}

function getRankBadge(rank: string = 'GOLD') {
  const normalized = (rank || 'GOLD').toUpperCase();
  if (normalized.includes('PLATINUM')) {
    return {
      label: 'PLATINUM',
      classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };
  }
  if (normalized.includes('SILVER')) {
    return {
      label: 'SILVER',
      classes: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
    };
  }
  if (normalized.includes('BRONZE')) {
    return {
      label: 'BRONZE',
      classes: 'bg-amber-700/20 text-amber-300 border-amber-600/30',
    };
  }
  return {
    label: 'GOLD',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
}

export function HistoryRiderTrips({
  riderHistoricalTrips,
  loading,
  favoriteCaptainIds,
  toggleFavorite,
  currencyLabel,
  isArabic,
  now,
  tripReviews,
  t
}: HistoryRiderTripsProps) {
  const renderDetailedReview = (tripId: string) => {
    const review = tripReviews[tripId];
    if (!review) return null;

    const stars = review.detailed_stars || {};
    const captainObj = stars.captain || {};
    const activeCaptain = Object.keys(captainObj).filter(k => Number(captainObj[k]) === 1);

    if (activeCaptain.length === 0 && !review.comment) {
      return null;
    }

    return (
      <div className="rounded-xl border border-white/5 bg-black/30 p-3 space-y-1.5 text-xs text-slate-300">
        <div className="font-bold text-slate-400 text-[11px]">
          <span>{t('detailedFeedback')}</span>
        </div>
        
        {activeCaptain.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeCaptain.map(k => (
              <span key={k} className="inline-flex items-center gap-1 rounded-md bg-[#14B8A6]/10 border border-[#14B8A6]/20 px-2 py-0.5 text-[10px] font-bold text-[#14F5D5]">
                👤 {t(`captainCriteria.${k}`)}
              </span>
            ))}
          </div>
        )}

        {review.comment && (
          <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">
            &ldquo;{review.comment}&rdquo;
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white">
      {/* Top accent bar matching #14B8A6 */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent" />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.15)]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                {t('recentTripsTitle')}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5 leading-relaxed truncate">
                {t('recentTripsDesc')}
              </CardDescription>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 text-xs font-bold text-[#14F5D5] shadow-sm font-mono">
            {riderHistoricalTrips.length} {t('tripCount')}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {loading ? (
          <HistorySkeleton />
        ) : riderHistoricalTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2">
            <AlertCircle className="h-8 w-8 text-slate-500" />
            <p className="text-xs font-semibold text-slate-400">{t('noTrips')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {riderHistoricalTrips.map((trip) => {
              const isHearted = favoriteCaptainIds.has(String(trip.captainId));
              const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));
              const rankBadge = getRankBadge(trip.captainRank);

              return (
                <div
                  key={trip.tripId}
                  className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-[#14B8A6]/40 p-4 transition-all duration-200 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Right side: Captain & Heart */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleFavorite(trip)}
                        title={isHearted ? (isArabic ? 'إزالة من المفضلة' : 'Remove from favorites') : (isArabic ? 'إضافة إلى المفضلة' : 'Add to favorites')}
                        className={cn(
                          "h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center transition-all",
                          isHearted
                            ? "border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.25)]"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-[#14F5D5] hover:border-[#14B8A6]/30 hover:bg-[#14B8A6]/10"
                        )}
                      >
                        <Heart className={cn("h-4.5 w-4.5 transition-all", isHearted ? "fill-[#14F5D5] text-[#14F5D5]" : "")} />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-white text-sm truncate">
                            {trip.captainName}
                          </h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border tracking-wider ${rankBadge.classes}`}>
                            {rankBadge.label}
                          </span>
                        </div>
                        {trip.serialId && (
                          <span className="text-[10px] font-mono text-teal-400/80 bg-teal-950/40 border border-teal-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            🧬 {trip.serialId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Left side: Price & Time */}
                    <div className="flex items-baseline sm:flex-col sm:items-end justify-between gap-1 shrink-0">
                      <span className="text-sm font-black text-[#14F5D5] font-mono">
                        {formatHistoryMoney(trip.finalPrice, currencyLabel)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isArabic ? t('before') : ''} {timeAgo === 0 ? t('lessThanHour') : `${timeAgo} ${t('hours')}`} {isArabic ? '' : t('ago')}
                      </span>
                    </div>
                  </div>

                  {trip.vehicleInfo && (
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-black/40 border border-white/5 rounded-xl px-3 py-2">
                      <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{trip.vehicleInfo}</span>
                    </div>
                  )}

                  {renderDetailedReview(trip.tripId)}

                  <div className="pt-1">
                    <a
                      href={`tel:${trip.captainPhone}`}
                      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0ea5e9] text-slate-950 font-black text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-teal-500/15"
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>{t('callCaptain')}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

