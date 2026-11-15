'use client';

import React from 'react';
import { Lock, MapPinOff } from 'lucide-react';

export interface DestinationLocationNoticeProps {
  isArabic: boolean;
  isVisible: boolean;
  onRequestLocation: () => void;
}

export function DestinationLocationNotice({
  isArabic,
  isVisible,
  onRequestLocation,
}: DestinationLocationNoticeProps) {
  if (!isVisible) return null;

  return (
    <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 space-y-2 text-start shadow-lg shadow-rose-950/30 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm">
        <MapPinOff className="h-4 w-4 shrink-0 text-rose-400" />
        <span>{isArabic ? 'إذن الموقع الجغرافي (GPS) مغلق' : 'Location Permission Disabled'}</span>
      </div>
      <p className="text-[11px] sm:text-xs leading-relaxed text-slate-200 font-medium">
        {isArabic
          ? 'لن تتمكن من تحديد نقطة انطلاقك أو إرسال طلب رحلة للكباتن دون تفعيل الموقع. يجب تفعيل إذن الموقع للمتابعة.'
          : 'You cannot determine your pickup location or request a ride without location access. Please enable location to continue.'}
      </p>
      <button
        type="button"
        onClick={onRequestLocation}
        className="min-h-[44px] w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm py-2.5 rounded-xl transition-transform active:scale-[0.98] shadow-md shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer border border-rose-400/30"
      >
        <Lock className="h-4 w-4" />
        <span>{isArabic ? 'تفعيل إذن الموقع لبدء الطلب' : 'Enable Location to Request'}</span>
      </button>
    </div>
  );
}
