import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HistorySkeleton } from './history-skeleton';
import { useBlockedRiders } from '@/features/captain/hooks/use-blocked-riders';
import { DriverRatingModal } from '@/features/captain/components/driver-rating-modal';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { setCaptainFavoriteRider, fetchFavoriteRiderIds } from '@/features/referral/services/captain-referral';
import { styles } from './captain-trips/history-captain-trips-styles';
import { HistoryCaptainTripCard } from './captain-trips/history-captain-trip-card';

interface HistoryCaptainTripsProps {
  captainHistoricalTrips: any[];
  loading: boolean;
  currencyLabel: string;
  isArabic: boolean;
  now: number;
  tripReviews?: Record<string, any>;
  currentUserId?: string;
  onRatingSuccess?: (tripId: string) => void;
  defaultExpanded?: boolean;
  t: any;
}

export function HistoryCaptainTrips({
  captainHistoricalTrips,
  loading,
  currencyLabel,
  isArabic,
  now,
  tripReviews = {},
  currentUserId,
  onRatingSuccess,
  defaultExpanded = false,
  t,
}: HistoryCaptainTripsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (defaultExpanded) {
      setIsExpanded(true);
    }
  }, [defaultExpanded]);
  const [ratingTargetTrip, setRatingTargetTrip] = useState<any | null>(null);
  const activeCurrency = currencyLabel || (isArabic ? 'د.أ' : 'JOD');

  const { toast } = useToast();
  const [favoriteRiderIds, setFavoriteRiderIds] = useState<Set<string>>(new Set());

  const loadFavoriteRiderIds = React.useCallback(async () => {
    try {
      const ids = await fetchFavoriteRiderIds(currentUserId);
      setFavoriteRiderIds(ids);
    } catch {}
  }, [currentUserId]);

  useEffect(() => {
    void loadFavoriteRiderIds();
    const handleUpdated = () => void loadFavoriteRiderIds();
    window.addEventListener('radar_favorites_updated', handleUpdated);
    window.addEventListener('captain-favorites-updated', handleUpdated);
    return () => {
      window.removeEventListener('radar_favorites_updated', handleUpdated);
      window.removeEventListener('captain-favorites-updated', handleUpdated);
    };
  }, [loadFavoriteRiderIds]);

  const handleToggleFavorite = async (trip: any) => {
    let resolvedRiderId = trip.riderId;
    if (!resolvedRiderId && trip.tripId) {
      try {
        const { data } = await supabase
          .from('ride_requests')
          .select('rider_id')
          .eq('id', trip.tripId)
          .maybeSingle();
        resolvedRiderId = data?.rider_id;
      } catch {}
    }
    if (!resolvedRiderId) return;

    const isFav = favoriteRiderIds.has(resolvedRiderId);
    const newFav = !isFav;

    await setCaptainFavoriteRider(
      resolvedRiderId,
      newFav,
      { name: trip.riderName },
      currentUserId,
    );

    setFavoriteRiderIds((prev) => {
      const next = new Set(prev);
      if (newFav) next.add(resolvedRiderId);
      else next.delete(resolvedRiderId);
      return next;
    });

    toast({
      title: newFav
        ? (isArabic ? 'تمت إضافة المستخدم للمفضلة' : 'Added to favorites')
        : (isArabic ? 'تمت الإزالة من المفضلة' : 'Removed from favorites'),
    });
  };

  const { blockedRiders = [], handleBlockRider, handleUnblockRider } = useBlockedRiders(isArabic ? 'ar' : 'en');
  const blockedRiderIdSet = useMemo(() => new Set((blockedRiders || []).map((r) => r.id)), [blockedRiders]);
  const [confirmingBlockId, setConfirmingBlockId] = useState<string | null>(null);

  const handleOpenRating = async (trip: any) => {
    if (trip.riderId) {
      setRatingTargetTrip(trip);
      return;
    }
    try {
      const { data } = await supabase
        .from('ride_requests')
        .select('rider_id')
        .eq('id', trip.tripId)
        .maybeSingle();
      if (data?.rider_id) {
        let resolvedRiderName = trip.riderName;
        try {
          const { data: safeProfiles } = await supabase.rpc('get_safe_counterpart_profiles', {
            p_user_ids: [data.rider_id],
          });
          if (Array.isArray(safeProfiles) && safeProfiles[0]?.full_name) {
            resolvedRiderName = safeProfiles[0].full_name;
          }
        } catch {}
        setRatingTargetTrip({
          ...trip,
          riderId: data.rider_id,
          riderName: resolvedRiderName,
        });
        return;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to resolve riderId:', err);
    }
    setRatingTargetTrip(trip);
  };

  const handleBlockRiderWithFallback = async (trip: any) => {
    let targetRiderId = trip.riderId;
    if (!targetRiderId) {
      try {
        const { data } = await supabase
          .from('ride_requests')
          .select('rider_id')
          .eq('id', trip.tripId)
          .maybeSingle();
        targetRiderId = data?.rider_id;
      } catch {}
    }
    if (targetRiderId) {
      await handleBlockRider(targetRiderId);
    }
    setConfirmingBlockId(null);
  };

  return (
    <div id="captain-trips-section" className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.accentBar} />
        <CardHeader
          className={cn(styles.header, styles.headerButton)}
          onClick={() => setIsExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          aria-expanded={isExpanded}
        >
          <div className={styles.headerRow}>
            {/* Top on Mobile: Icon + Full Title */}
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <FileText className={styles.icon} />
              </div>
              <div className={styles.titleBox}>
                <CardTitle className={styles.title}>
                  {t('captainSectionTitle')}
                </CardTitle>
                <CardDescription className={styles.descDesktop}>
                  {t('captainSectionDesc')}
                </CardDescription>
              </div>
            </div>

            {/* Bottom on Mobile: Subtitle + Badge + Chevron */}
            <div className={styles.actionsRow}>
              <CardDescription className={styles.descMobile}>
                {t('captainSectionDesc')}
              </CardDescription>

              <div className={styles.actionsGroup}>
                <Badge variant="outline" className={styles.countBadge}>
                  {captainHistoricalTrips.length} {isArabic ? t('tripCount') : 'trips'}
                </Badge>
                <div className={styles.chevronBox}>
                  <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className={styles.content}>
            {loading ? (
              <HistorySkeleton />
            ) : captainHistoricalTrips.length === 0 ? (
              <div className={styles.emptyBox}>
                <AlertCircle className={styles.emptyIcon} />
                <p className={styles.emptyText}>
                  {isArabic ? 'لا توجد رحلات مكتملة مسجلة حالياً.' : 'No completed field tasks recorded for this area currently.'}
                </p>
              </div>
            ) : (
              <div className={styles.tripsList}>
                {captainHistoricalTrips.map((trip) => (
                  <HistoryCaptainTripCard
                    key={trip.tripId}
                    trip={trip}
                    now={now}
                    isArabic={isArabic}
                    activeCurrency={activeCurrency}
                    hasReview={Boolean(tripReviews[trip.tripId])}
                    isBlocked={trip.riderId ? blockedRiderIdSet.has(trip.riderId) : false}
                    isHearted={trip.riderId ? favoriteRiderIds.has(trip.riderId) : false}
                    onToggleFavorite={handleToggleFavorite}
                    confirmingBlockId={confirmingBlockId}
                    onSetConfirmingBlockId={setConfirmingBlockId}
                    onOpenRating={handleOpenRating}
                    onBlockRider={handleBlockRiderWithFallback}
                    onUnblockRider={handleUnblockRider}
                    t={t}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {ratingTargetTrip && currentUserId && (
        <DriverRatingModal
          isOpen={Boolean(ratingTargetTrip)}
          onClose={() => setRatingTargetTrip(null)}
          language={isArabic ? 'ar' : 'en'}
          tripId={ratingTargetTrip.tripId}
          riderId={ratingTargetTrip.riderId}
          captainId={currentUserId}
          supabase={supabase}
          riderName={ratingTargetTrip.riderName}
          onSuccess={() => {
            onRatingSuccess?.(ratingTargetTrip.tripId);
            setRatingTargetTrip(null);
          }}
        />
      )}
    </div>
  );
}
