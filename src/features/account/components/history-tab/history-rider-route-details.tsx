import React from 'react';
import { Navigation } from 'lucide-react';
import type { HistoricalTrip } from './history-shared';

interface HistoryRiderRouteDetailsProps {
  trip: HistoricalTrip;
  isArabic: boolean;
  routeMapUrl?: string | null;
  t: any;
}

export function HistoryRiderRouteDetails({
  trip,
  isArabic,
  t,
}: HistoryRiderRouteDetailsProps) {
  return (
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
    </div>
  );
}
