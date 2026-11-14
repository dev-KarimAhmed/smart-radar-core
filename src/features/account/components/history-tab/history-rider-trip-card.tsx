import React from 'react';
import { Heart, Phone, Car, ChevronDown, Navigation, Star, ExternalLink, Ban, ShieldCheck } from 'lucide-react';
import { cn, formatTelUri } from '@/lib/utils';
import { formatHistoryMoney, type HistoricalTrip } from './history-shared';
import { getRouteMapUrl, getRankBadge } from './history-rider-trip-utils';
import { HistoryRiderTripReview } from './history-rider-trip-review';

interface HistoryRiderTripCardProps {
  trip: HistoricalTrip;
  isHearted: boolean;
  toggleFavorite: (trip: HistoricalTrip) => void;
  timeAgo: number;
  currencyLabel: string;
  isArabic: boolean;
  isExpanded: boolean;
  toggleRouteExpand: (tripId: string) => void;
  hasReview: boolean;
  review?: any;
  isBlocked: boolean;
  confirmingBlock: boolean;
  onConfirmBlock: () => void;
  onCancelBlock: () => void;
  onRequestBlock: () => void;
  onUnblock: () => void;
  onRateTrip: () => void;
  t: any;
}

export function HistoryRiderTripCard({
  trip,
  isHearted,
  toggleFavorite,
  timeAgo,
  currencyLabel,
  isArabic,
  isExpanded,
  toggleRouteExpand,
  hasReview,
  review,
  isBlocked,
  confirmingBlock,
  onConfirmBlock,
  onCancelBlock,
  onRequestBlock,
  onUnblock,
  onRateTrip,
  t,
}: HistoryRiderTripCardProps) {
  const rankBadge = getRankBadge(trip.captainRank);
  const routeMapUrl = getRouteMapUrl(trip);

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-[#14B8A6]/40 p-4 transition-all duration-200 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => toggleFavorite(trip)}
            title={isHearted ? (isArabic ? 'إزالة من المفضلة' : 'Remove from favorites') : (isArabic ? 'إضافة إلى المفضلة' : 'Add to favorites')}
            className={cn(
              'h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center transition-all',
              isHearted
                ? 'border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.25)]'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-[#14F5D5] hover:border-[#14B8A6]/30 hover:bg-[#14B8A6]/10'
            )}
          >
            <Heart className={cn('h-4.5 w-4.5 transition-all', isHearted ? 'fill-[#14F5D5] text-[#14F5D5]' : '')} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-white text-sm truncate">{trip.captainName}</h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border tracking-wider ${rankBadge.classes}`}>
                {rankBadge.label}
              </span>
            </div>
            {trip.serialId && (
              <span className="text-[10px] font-mono text-teal-400/80 bg-teal-950/40 border border-teal-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                #{trip.serialId}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline sm:flex-col sm:items-end justify-between gap-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-[#14F5D5] font-mono">
              {formatHistoryMoney(trip.finalPrice, currencyLabel)}
            </span>
            <button
              type="button"
              onClick={() => toggleRouteExpand(trip.tripId)}
              aria-expanded={isExpanded}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer',
                isExpanded
                  ? 'border-[#14B8A6]/50 bg-[#14B8A6]/20 text-[#14F5D5] shadow-[0_0_10px_rgba(20,245,213,0.15)]'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-[#14B8A6]/30 hover:text-[#14F5D5] hover:bg-[#14B8A6]/10'
              )}
              title={isExpanded ? (t('hideRoute') || (isArabic ? 'إخفاء المسار' : 'Hide Route')) : (t('showRoute') || (isArabic ? 'عرض المسار' : 'Show Route'))}
            >
              <span>{t('route') || (isArabic ? 'المسار' : 'Route')}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', isExpanded && 'rotate-180')} />
            </button>
          </div>
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

      {isExpanded && (
        <div className="rounded-xl border border-[#14B8A6]/25 bg-gradient-to-b from-[#14B8A6]/10 to-black/30 p-3 space-y-2.5 text-xs text-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[#14F5D5] text-[11px]">
              <Navigation className="h-3.5 w-3.5 text-[#14F5D5]" />
              <span>{t('routeDetails') || (isArabic ? 'مسار الرحلة' : 'Trip Route')}</span>
            </div>
            {trip.distanceKm && (
              <span className="text-[10px] font-mono font-black text-slate-200 bg-black/50 border border-teal-500/20 px-2 py-0.5 rounded-md">
                {trip.distanceKm} {isArabic ? 'كم' : 'km'}
              </span>
            )}
          </div>

          <div className="space-y-2 text-start">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1 shrink-0 ring-2 ring-emerald-400/20" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {t('pickupPoint') || (isArabic ? 'نقطة الانطلاق' : 'Pickup Point')}:
                </span>
                <span className="text-xs font-medium text-white break-words">
                  {trip.pickupAddress && trip.pickupAddress !== 'موقعي الحالي'
                    ? trip.pickupAddress
                    : (isArabic ? 'موقع الركوب المحدد' : 'Pickup location')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 mt-1 shrink-0 ring-2 ring-cyan-400/20" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {t('dropoffPoint') || (isArabic ? 'الوجهة' : 'Dropoff Point')}:
                </span>
                <span className="text-xs font-medium text-white break-words">
                  {trip.destinationAddress && trip.destinationAddress !== 'رحلة سابقة' && trip.destinationAddress !== 'غير محدد'
                    ? trip.destinationAddress
                    : (isArabic ? 'الوجهة المحددة' : 'Destination location')}
                </span>
              </div>
            </div>
          </div>

          {routeMapUrl && (
            <div className="pt-2 border-t border-white/5 flex justify-end">
              <a
                href={routeMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#14F5D5] hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{t('viewOnMap') || (isArabic ? 'عرض على الخريطة' : 'View on Map')}</span>
              </a>
            </div>
          )}
        </div>
      )}

      <HistoryRiderTripReview review={review} t={t} />

      <div className="pt-1 flex items-center justify-between gap-2.5 flex-wrap">
        <a
          href={formatTelUri(trip.captainPhone)}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0ea5e9] text-slate-950 font-black text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-teal-500/15 no-underline"
        >
          <Phone className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>{t('callCaptain')}</span>
        </a>

        <div className="flex items-center gap-2">
          {!hasReview && !isBlocked && (
            <button
              type="button"
              onClick={onRateTrip}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white font-black text-xs active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
              <span>{t('rateCaptain') || (isArabic ? 'تقييم الكابتن المعلن' : 'Rate Captain')}</span>
            </button>
          )}

          {hasReview && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
              <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
              <span>{t('rated') || (isArabic ? 'تم التقييم' : 'Rated')}</span>
            </span>
          )}

          {trip.captainId && (
            isBlocked ? (
              <button
                type="button"
                onClick={onUnblock}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-300 font-bold text-xs transition-all cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isArabic ? 'إلغاء حظر الكابتن المعلن' : 'Unblock Captain'}</span>
              </button>
            ) : confirmingBlock ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onConfirmBlock}
                  className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                >
                  {isArabic ? 'تأكيد الحظر' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={onCancelBlock}
                  className="h-9 px-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onRequestBlock}
                title={isArabic ? 'حظر هذا الكابتن المعلن' : 'Block Captain'}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-white/10 bg-white/5 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>{isArabic ? 'حظر الكابتن المعلن' : 'Block'}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
