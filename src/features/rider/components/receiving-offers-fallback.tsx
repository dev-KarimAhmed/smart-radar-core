'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { receivingOffersStyles as styles } from './receiving-offers-constants';

interface ReceivingOffersFallbackProps {
  isArabic: boolean;
  onRetry: () => void;
  onCancelRideRequest: () => void;
  isCancellingRideRequest: boolean;
  noOffersEyebrowText?: string;
  noOffersTitleText?: string;
  noOffersDescriptionText?: string;
  retryText?: string;
  cancellingText?: string;
  cancelText?: string;
}

export function ReceivingOffersFallback({
  isArabic,
  onRetry,
  onCancelRideRequest,
  isCancellingRideRequest,
  noOffersEyebrowText,
  noOffersTitleText,
  noOffersDescriptionText,
  retryText,
  cancellingText,
  cancelText,
}: ReceivingOffersFallbackProps) {
  return (
    <div className={cn(styles.cancelledWrapper, isArabic ? styles.rtl : styles.ltr)} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#0C1527] via-[#080E1C] to-[#040812] p-5 sm:p-6 shadow-2xl space-y-3 text-start">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
          <span>{isArabic ? 'لم تصل عروض' : (noOffersEyebrowText || 'No offers received')}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
          {isArabic ? 'نعتذر جميع السائقين مشغولون حالياً' : (noOffersTitleText || 'Sorry, all drivers are busy right now')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-bold">
          {isArabic ? 'يمكنك إعادة المحاولة .' : (noOffersDescriptionText || 'You can try again.')}
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onRetry}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#14B8A6] via-[#14F5D5] to-[#14B8A6] text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(20,245,213,0.35)] transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {isArabic ? 'إعادة المحاولة' : (retryText || 'Retry')}
        </button>

        <button
          type="button"
          onClick={onCancelRideRequest}
          disabled={isCancellingRideRequest}
          className="h-11 w-full rounded-2xl border border-rose-500/40 bg-rose-500/15 text-xs font-black text-rose-200 shadow-sm transition-all hover:bg-rose-500/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <X className="h-4 w-4 text-rose-400" />
          <span>
            {isCancellingRideRequest
              ? (isArabic ? 'جاري الإلغاء...' : (cancellingText || 'Cancelling...'))
              : (isArabic ? 'إلغاء الطلب' : (cancelText || 'Cancel Request'))}
          </span>
        </button>
      </div>
    </div>
  );
}
