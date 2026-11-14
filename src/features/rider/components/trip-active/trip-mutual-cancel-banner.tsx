'use client';

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import type { UseTripMutualCancellationReturn } from '@/shared/hooks/use-trip-mutual-cancellation';

export interface TripMutualCancelBannerProps {
  isArabic: boolean;
  mutualCancel: UseTripMutualCancellationReturn;
  isCancellingRideRequest: boolean;
  cancelBannerRef: React.RefObject<HTMLDivElement | null>;
}

export function TripMutualCancelBanner({
  isArabic,
  mutualCancel,
  isCancellingRideRequest,
  cancelBannerRef,
}: TripMutualCancelBannerProps) {
  if (mutualCancel.pendingRequestFrom === 'captain') {
    return (
      <div ref={cancelBannerRef} className="space-y-3 rounded-2xl border-2 border-amber-500/60 bg-amber-950/40 p-4 shadow-xl shadow-amber-950/40">
        <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <span>{isArabic ? 'الكابتن المعلن يطلب إلغاء الرحلة!' : 'Captain requested trip cancellation!'}</span>
        </div>
        <p className="text-xs text-amber-100/90 leading-relaxed">
          {isArabic
            ? 'طلب الكابتن المعلن إلغاء الرحلة بالتوافق المشترك. هل توافق على إلغاء الرحلة؟'
            : 'The captain has requested mutual cancellation. Do you agree to cancel?'}
        </p>
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            disabled={mutualCancel.isProcessing || isCancellingRideRequest}
            onClick={mutualCancel.acceptCancel}
            className="h-10 flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 transition cursor-pointer disabled:opacity-50"
          >
            {mutualCancel.isProcessing || isCancellingRideRequest
              ? (isArabic ? 'جاري الإلغاء...' : 'Cancelling...')
              : (isArabic ? 'موافق على الإلغاء' : 'Accept Cancel')}
          </button>
          <button
            type="button"
            disabled={mutualCancel.isProcessing || isCancellingRideRequest}
            onClick={mutualCancel.declineCancel}
            className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            {isArabic ? 'رفض الإلغاء' : 'Decline'}
          </button>
        </div>
      </div>
    );
  }

  if (mutualCancel.pendingRequestFrom === 'rider') {
    return (
      <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
          <Clock className="h-4 w-4 animate-spin text-amber-400" />
          <span>{isArabic ? 'تم إرسال طلب الإلغاء... بانتظار موافقة الكابتن المعلن' : 'Cancellation requested... waiting for captain'}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {isArabic
            ? 'يتطلب إلغاء الرحلة موافقة الطرفين. الكابتن المعلن يراجع طلبك الآن.'
            : 'Cancelling requires mutual agreement. Waiting for captain confirmation.'}
        </p>
        <button
          type="button"
          disabled={mutualCancel.isProcessing}
          onClick={mutualCancel.revokeCancel}
          className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
        >
          {isArabic ? 'تراجع عن طلب الإلغاء' : 'Revoke Request'}
        </button>
      </div>
    );
  }

  return null;
}
