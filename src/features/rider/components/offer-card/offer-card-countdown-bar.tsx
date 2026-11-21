'use client';

import React from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptainOfferCardCountdown } from './offer-card-types';

interface OfferCardCountdownBarProps {
  countdown?: CaptainOfferCardCountdown;
  isArabic: boolean;
}

export function OfferCardCountdownBar({
  countdown,
  isArabic,
}: OfferCardCountdownBarProps) {
  if (!countdown?.hasCountdown) return null;

  const isCountdownUrgent = Boolean(
    countdown.percentRemaining <= 20 || countdown.remainingSeconds <= 10,
  );

  return (
    <div className="mx-4 mt-3 rounded-xl border border-[#14B8A6]/25 bg-[#081220]/80 p-2.5 sm:mx-5">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-300">
          <Timer className="h-3.5 w-3.5 text-[#14F5D5]" />
          <span>{isArabic ? 'مدة قبول العرض' : 'Offer Acceptance Time'}</span>
        </span>
        <div className="flex items-baseline gap-1" dir={isArabic ? 'rtl' : 'ltr'}>
          <span
            className={cn(
              'font-mono font-black text-sm sm:text-base',
              isCountdownUrgent ? 'text-rose-400 animate-pulse' : 'text-[#14F5D5]',
            )}
          >
            {countdown.remainingSeconds}
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            {isArabic ? 'ثانية' : 'sec'}
          </span>
        </div>
      </div>

      {/* شريط زمني انسيابي يوضح تناقص الوقت بالثواني */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90 border border-white/5" dir="ltr">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#14F5D5] transition-all duration-200 ease-linear shadow-[0_0_8px_rgba(20,245,213,0.5)]',
            isCountdownUrgent && 'from-rose-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
          )}
          style={{ width: `${countdown.percentRemaining}%` }}
        />
      </div>
    </div>
  );
}
