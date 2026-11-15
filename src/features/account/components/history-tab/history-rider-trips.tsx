import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle, FileText } from 'lucide-react';
import type { HistoricalTrip } from './history-shared';
import { HistorySkeleton } from './history-skeleton';
import { RatingModal } from '@/components/dashboard/shared/rating-modal';
import { supabase } from '@/lib/supabase-client';
import { useBlockedCaptains } from '../../hooks/use-blocked-captains';
import { HistoryRiderTripCard } from './history-rider-trip-card';

interface HistoryRiderTripsProps {
  riderHistoricalTrips: HistoricalTrip[];
  loading: boolean;
  favoriteCaptainIds: Set<string>;
  toggleFavorite: (trip: HistoricalTrip) => void;
  currencyLabel: string;
  isArabic: boolean;
  now: number;
  tripReviews: Record<string, any>;
  currentUserId?: string;
  onRatingSuccess?: (tripId: string) => void;
  t: any;
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
  currentUserId,
  onRatingSuccess,
  t,
}: HistoryRiderTripsProps) {
  const [expandedTripIds, setExpandedTripIds] = useState<Set<string>>(new Set());
  const [ratingTargetTrip, setRatingTargetTrip] = useState<HistoricalTrip | null>(null);
  const [confirmingBlockId, setConfirmingBlockId] = useState<string | null>(null);

  const { blockedCaptains = [], handleBlockCaptain, handleUnblockCaptain } = useBlockedCaptains();
  const blockedCaptainIdSet = React.useMemo(() => new Set((blockedCaptains || []).map((c) => c.id)), [blockedCaptains]);

  const toggleRouteExpand = (tripId: string) => {
    setExpandedTripIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else {
        next.add(tripId);
      }
      return next;
    });
  };

  return (
    <Card id="rider-trips-section" className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent" />

      <CardHeader className="p-4 sm:p-5 pb-3.5 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.15)]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-black text-white font-sans">
                {t('recentTripsTitle')}
              </CardTitle>
              <CardDescription className="hidden sm:block text-xs text-slate-400 mt-0.5 leading-relaxed font-sans">
                {t('recentTripsDesc')}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-white/[0.05] sm:border-0 shrink-0">
            <CardDescription className="sm:hidden text-xs text-slate-400 leading-relaxed font-sans truncate min-w-0 flex-1">
              {t('recentTripsDesc')}
            </CardDescription>
            <span className="shrink-0 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 sm:px-3 py-1 text-xs font-bold text-[#14F5D5] shadow-sm font-mono">
              {riderHistoricalTrips.length} {t('tripCount')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {loading ? (
          <HistorySkeleton />
        ) : riderHistoricalTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2">
            <AlertCircle className="h-8 w-8 text-slate-500" />
            <p className="text-xs font-semibold text-slate-400">
              {isArabic
                ? 'انت لم تتفاعل مع إعلانات الكباتن آخر 72 ساعة.'
                : t('noTrips')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {riderHistoricalTrips.map((trip) => {
              const isHearted = favoriteCaptainIds.has(String(trip.captainId));
              const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));
              const isExpanded = expandedTripIds.has(trip.tripId);
              const hasReview = Boolean(tripReviews[trip.tripId]);
              const review = tripReviews[trip.tripId];
              const isBlocked = blockedCaptainIdSet.has(trip.captainId || '');

              return (
                <HistoryRiderTripCard
                  key={trip.tripId}
                  trip={trip}
                  isHearted={isHearted}
                  toggleFavorite={toggleFavorite}
                  timeAgo={timeAgo}
                  currencyLabel={currencyLabel}
                  isArabic={isArabic}
                  isExpanded={isExpanded}
                  toggleRouteExpand={toggleRouteExpand}
                  hasReview={hasReview}
                  review={review}
                  isBlocked={isBlocked}
                  confirmingBlock={confirmingBlockId === trip.tripId}
                  onConfirmBlock={async () => {
                    await handleBlockCaptain(trip.captainId!);
                    setConfirmingBlockId(null);
                  }}
                  onCancelBlock={() => setConfirmingBlockId(null)}
                  onRequestBlock={() => setConfirmingBlockId(trip.tripId)}
                  onUnblock={() => void handleUnblockCaptain(trip.captainId!)}
                  onRateTrip={() => setRatingTargetTrip(trip)}
                  t={t}
                />
              );
            })}
          </div>
        )}
      </CardContent>

      {ratingTargetTrip && (
        <RatingModal
          isOpen={Boolean(ratingTargetTrip)}
          onClose={() => setRatingTargetTrip(null)}
          tripId={ratingTargetTrip.tripId}
          captainId={ratingTargetTrip.captainId || ''}
          reviewerId={currentUserId || ''}
          supabase={supabase}
          onSuccess={() => {
            onRatingSuccess?.(ratingTargetTrip.tripId);
            setRatingTargetTrip(null);
          }}
          captainName={ratingTargetTrip.captainName}
          captainPhone={ratingTargetTrip.captainPhone}
          captainRank={ratingTargetTrip.captainRank}
          vehicleInfo={ratingTargetTrip.vehicleInfo}
          finalPrice={ratingTargetTrip.finalPrice}
        />
      )}
    </Card>
  );
}
