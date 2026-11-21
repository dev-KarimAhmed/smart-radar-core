import React from 'react';
import { Ban, Clock, Heart, ShieldCheck, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatHistoryMoney } from '../history-shared';
import { formatReadableDateTime } from '@/shared/utils/date-format';
import { styles } from './history-captain-trips-styles';

export interface HistoryCaptainTripCardProps {
  trip: any;
  now: number;
  isArabic: boolean;
  activeCurrency: string;
  hasReview: boolean;
  isBlocked: boolean;
  isHearted?: boolean;
  onToggleFavorite?: (trip: any) => Promise<void>;
  confirmingBlockId: string | null;
  onSetConfirmingBlockId: (id: string | null) => void;
  onOpenRating: (trip: any) => Promise<void>;
  onBlockRider: (trip: any) => Promise<void>;
  onUnblockRider: (riderId: string) => Promise<void>;
  t: any;
}

export function HistoryCaptainTripCard({
  trip,
  now,
  isArabic,
  activeCurrency,
  hasReview,
  isBlocked,
  isHearted = false,
  onToggleFavorite,
  confirmingBlockId,
  onSetConfirmingBlockId,
  onOpenRating,
  onBlockRider,
  onUnblockRider,
  t,
}: HistoryCaptainTripCardProps) {
  const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));
  const { dateText: formattedDate, timeText: formattedTime } = formatReadableDateTime(trip.timestamp, isArabic);

  return (
    <div className={styles.tripCard}>
      {/* Top Row: Rider Info & Earned Price */}
      <div className={styles.tripTopRow}>
        <div className={styles.riderBox}>
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={() => void onToggleFavorite(trip)}
              title={
                isHearted
                  ? isArabic
                    ? 'إزالة من المفضلة'
                    : 'Remove from favorites'
                  : isArabic
                    ? 'إضافة إلى المفضلة'
                    : 'Add to favorites'
              }
              className={cn(
                'h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer',
                isHearted
                  ? 'border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.25)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-[#14F5D5] hover:border-[#14B8A6]/30 hover:bg-[#14B8A6]/10'
              )}
            >
              <Heart className={cn('h-4.5 w-4.5 transition-all', isHearted ? 'fill-[#14F5D5] text-[#14F5D5]' : '')} />
            </button>
          ) : (
            <div className={styles.riderAvatar}>
              <User className={styles.riderAvatarIcon} />
            </div>
          )}
          <div className={styles.riderNameContainer}>
            <span className={styles.riderLabel}>{isArabic ? 'المستخدم' : 'Rider'}</span>
            <h4 className={styles.riderName} dir="auto">{trip.riderName}</h4>
          </div>
        </div>

        <div className={styles.priceBox}>
          <span className={styles.priceLabel}>{isArabic ? 'سعر الرحلة:' : 'Trip Fare:'}</span>
          <span className={styles.priceText}>
            +{formatHistoryMoney(trip.earnedPrice, activeCurrency)}
          </span>
        </div>
      </div>

      {/* Middle Row: Route Details (Pickup & Dropoff) */}
      <div className={styles.routeBox}>
        <div className={styles.routeItem}>
          <span className={styles.pickupDot} aria-hidden="true" />
          <span className={styles.routeLabel}>{isArabic ? 'من:' : 'From:'}</span>
          <span className={styles.routeValue} dir="auto">{trip.pickup}</span>
        </div>
        <div className={styles.routeDivider} />
        <div className={styles.routeItem}>
          <span className={styles.dropoffDot} aria-hidden="true" />
          <span className={styles.routeLabel}>{isArabic ? 'إلى:' : 'To:'}</span>
          <span className={styles.routeValue} dir="auto">{trip.dropoff}</span>
        </div>
      </div>

      {/* Bottom Row: Date, Time & Serial */}
      <div className={styles.tripBottomRow}>
        <div className={styles.dateTimeBox}>
          <Clock className={styles.clockIcon} />
          <span className={styles.dateValue}>{formattedDate}</span>
          <span className={styles.separatorDot}>•</span>
          <span className={styles.timeValue}>{formattedTime}</span>
          <span className={styles.timeAgoBadge}>
            {isArabic ? t('before') : ''} {timeAgo === 0 ? t('lessThanHour') : `${timeAgo} ${t('hours')}`} {isArabic ? '' : t('ago')}
          </span>
        </div>

        {trip.serialId && (
          <div>
            <span dir="ltr" className={styles.serialBadge}>
              #{trip.serialId}
            </span>
          </div>
        )}
      </div>

      {/* Actions Row: Rating & Block / Unblock Rider */}
      {(trip.riderId || trip.tripId) && (
        <div className="pt-2 flex items-center justify-between border-t border-white/5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {!hasReview && !isBlocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void onOpenRating(trip)}
                className="h-8 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white font-bold text-[11px] active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
              >
                <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                <span>{t('rateRider') || (isArabic ? 'تقييم الراكب' : 'Rate Rider')}</span>
              </Button>
            )}
            {hasReview && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                <span>{t('rated') || (isArabic ? 'تم التقييم' : 'Rated')}</span>
              </span>
            )}
            {onToggleFavorite && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void onToggleFavorite(trip)}
                className={cn(
                  'h-8 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  isHearted
                    ? 'border-[#14B8A6]/40 bg-[#14B8A6]/20 text-[#14F5D5] shadow-sm shadow-[#14B8A6]/10'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-[#14F5D5] hover:border-[#14B8A6]/30'
                )}
              >
                <Heart className={cn('h-3.5 w-3.5', isHearted ? 'fill-[#14F5D5] text-[#14F5D5]' : '')} />
                <span>{isHearted ? (isArabic ? 'مفضل لديك' : 'Favorited') : (isArabic ? 'إضافة للمفضلة' : 'Favorite')}</span>
              </Button>
            )}
            <span className="text-[11px] font-medium text-slate-400">
              {isBlocked
                ? (isArabic ? 'هذا المستخدم محظور من رادارك' : 'Rider is blocked from radar')
                : ''}
            </span>
          </div>
          <div>
            {isBlocked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void onUnblockRider(trip.riderId)}
                className="h-8 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-[11px] font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isArabic ? 'إلغاء الحظر' : 'Unblock Rider'}</span>
              </Button>
            ) : confirmingBlockId === trip.tripId ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void onBlockRider(trip)}
                  className="h-8 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
                >
                  {isArabic ? 'تأكيد الحظر' : 'Confirm'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetConfirmingBlockId(null)}
                  className="h-8 px-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-[11px] cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetConfirmingBlockId(trip.tripId)}
                className="h-8 px-3 rounded-xl border border-white/10 bg-white/5 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>{isArabic ? 'حظر المستخدم' : 'Block Rider'}</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

