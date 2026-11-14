'use client';

import React from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCountdown } from '@/shared/services/trip-countdown';
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
        <span
          className={cn(
            'font-mono font-black text-xs sm:text-sm',
            isCountdownUrgent ? 'text-rose-400 animate-pulse' : 'text-[#14F5D5]',
          )}
          dir="ltr"
        >
          {formatCountdown(countdown.remainingSeconds)}
        </span>
      </div>

      {/* مؤشر مقسم إلى 4 مراحل مع مسار تفاعلي */}
      <div className="grid grid-cols-4 gap-1.5" dir="ltr">
        {[1, 2, 3, 4].map((stage) => {
          const stageStart = (stage - 1) * 25;
          const percent = countdown.percentRemaining;
          const fill = Math.max(0, Math.min(100, ((percent - stageStart) / 25) * 100));
          return (
            <div
              key={stage}
              className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90 border border-white/5"
            >
              <div
                className={cn(
                  'h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#14F5D5] transition-all duration-200 ease-linear shadow-[0_0_8px_rgba(20,245,213,0.5)]',
                  isCountdownUrgent && 'from-rose-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
                )}
                style={{ width: `${fill}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* مقياس المراحل بالأسفل: صفر، 1، 2، 3، 4 مع علامات التحديد */}
      <div className="relative mt-1.5 h-6 text-[10px] font-bold text-slate-400 font-mono select-none" dir="ltr">
        <div className="absolute left-0 flex flex-col items-start">
          <div className="h-1 w-0.5 bg-slate-600 rounded-full mb-0.5 ml-0.5" />
          <span className={cn(countdown.percentRemaining <= 5 ? 'text-rose-400 font-black' : '')}>
            {isArabic ? 'صفر' : '0'}
          </span>
        </div>
        <div className="absolute left-1/4 -translate-x-1/2 flex flex-col items-center">
          <div className="h-1 w-0.5 bg-slate-600 rounded-full mb-0.5" />
          <span className={cn(countdown.percentRemaining > 0 && countdown.percentRemaining <= 25 ? 'text-[#14F5D5] font-black' : '')}>1</span>
        </div>
        <div className="absolute left-2/4 -translate-x-1/2 flex flex-col items-center">
          <div className="h-1 w-0.5 bg-slate-600 rounded-full mb-0.5" />
          <span className={cn(countdown.percentRemaining > 25 && countdown.percentRemaining <= 50 ? 'text-[#14F5D5] font-black' : '')}>2</span>
        </div>
        <div className="absolute left-3/4 -translate-x-1/2 flex flex-col items-center">
          <div className="h-1 w-0.5 bg-slate-600 rounded-full mb-0.5" />
          <span className={cn(countdown.percentRemaining > 50 && countdown.percentRemaining <= 75 ? 'text-[#14F5D5] font-black' : '')}>3</span>
        </div>
        <div className="absolute right-0 flex flex-col items-end">
          <div className="h-1 w-0.5 bg-slate-600 rounded-full mb-0.5 mr-0.5" />
          <span className={cn(countdown.percentRemaining > 75 ? 'text-[#14F5D5] font-black' : '')}>4</span>
        </div>
      </div>
    </div>
  );
}
