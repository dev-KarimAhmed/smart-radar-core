'use client';

import React from 'react';
import { Clock, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface TripActiveHeaderProps {
  isArabic: boolean;
  captainName: string;
  serialNumber?: string | null;
  activeTripStatus: string;
  tripHasStarted: boolean;
  displayTimer: string;
  isFavorite?: boolean;
}

export function TripActiveHeader({
  isArabic,
  captainName,
  serialNumber,
  activeTripStatus,
  tripHasStarted,
  displayTimer,
  isFavorite = false,
}: TripActiveHeaderProps) {
  const t = useTranslations('riderView');

  const timerLabel = activeTripStatus === 'ARRIVED'
    ? (isArabic ? 'السائق بانتظارك' : t('trip.driverArrivedTitle'))
    : tripHasStarted
    ? (isArabic ? 'الوقت المتبقي للوصول' : t('trip.timeRemaining'))
    : (isArabic ? 'وقت الوصول المتوقع' : t('trip.driverArrival'));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#0C1527] via-[#080E1C] to-[#040812] p-3.5 sm:p-4 shadow-xl shadow-black/40">
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

      <div className="flex items-center justify-between gap-3">
        {/* بيانات السائق وحالة المسار */}
        <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-2.5 py-0.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F5D5]" />
            </span>
            <span className="text-[10px] font-black text-[#14F5D5]">
              {activeTripStatus === 'ARRIVED'
                ? (isArabic ? 'وصل السائق إلى موقعك' : t('trip.driverArrivedTitle'))
                : tripHasStarted
                ? (isArabic ? 'الرحلة جارية الآن' : t('trip.started'))
                : (isArabic ? 'السائق في الطريق إليك' : 'Driver on the way')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">
              {captainName}
            </h2>
            {isFavorite ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.3)]">
                <Heart className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                <span>{isArabic ? 'كابتن مفضل' : 'Favorite Captain'}</span>
              </span>
            ) : null}
            {serialNumber ? (
              <span className="font-mono text-xs font-black text-[#14F5D5] bg-[#14B8A6]/15 border border-[#14B8A6]/35 rounded-md px-2 py-0.5 shadow-sm">
                #{serialNumber}
              </span>
            ) : null}
          </div>
        </div>

        {/* التايمر الرقمي الواضح جداً */}
        <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl border-2 border-[#14B8A6]/40 bg-[#040814] px-3.5 py-2 sm:px-4 sm:py-2.5 text-center min-w-[110px] shadow-lg shadow-[#14B8A6]/10">
          <div className="flex items-center gap-1 text-[#14F5D5] mb-0.5">
            <Clock className="h-3.5 w-3.5 animate-pulse text-[#14F5D5]" />
            <span className="text-[10px] font-black text-slate-300 whitespace-nowrap">
              {timerLabel}
            </span>
          </div>
          <strong className="font-mono text-2xl sm:text-3xl font-black text-[#14F5D5] tracking-wider block drop-shadow-[0_0_10px_rgba(20,245,213,0.4)]">
            {displayTimer}
          </strong>
        </div>
      </div>
    </div>
  );
}
