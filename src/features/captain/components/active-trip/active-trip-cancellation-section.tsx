'use client';

import React from 'react';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { styles } from './active-trip-tracker-styles';
import type { CaptainTripStep } from '../../state/captain-state-machine';

interface ActiveTripCancellationSectionProps {
  language: 'ar' | 'en';
  step: CaptainTripStep;
  isConfirmingCancel: boolean;
  setIsConfirmingCancel: (val: boolean) => void;
  isCompleting: boolean;
  isCancelling: boolean;
  mutualCancel: {
    pendingRequestFrom: 'rider' | 'captain' | null;
    isProcessing: boolean;
    acceptCancel: () => Promise<void>;
    declineCancel: () => Promise<void>;
    revokeCancel: () => Promise<void>;
    requestCancel: () => Promise<void>;
  };
  onCancelTrip: () => void;
  t: (key: string) => string;
}

export function ActiveTripCancellationSection({
  language,
  step,
  isConfirmingCancel,
  setIsConfirmingCancel,
  isCompleting,
  isCancelling,
  mutualCancel,
  onCancelTrip,
  t,
}: ActiveTripCancellationSectionProps) {
  return (
    <div className={styles.cancelSection}>
      {mutualCancel.pendingRequestFrom === 'rider' ? (
        <div className="space-y-3 rounded-2xl border-2 border-rose-500/50 bg-rose-950/40 p-4 shadow-xl">
          <div className="flex items-center gap-2 text-rose-300 font-black text-sm">
            <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{language === 'ar' ? 'المستخدم يطلب إلغاء هذه الرحلة!' : 'Rider requested trip cancellation!'}</span>
          </div>
          <p className="text-xs text-rose-100/90 leading-relaxed">
            {language === 'ar'
              ? 'طلب المستخدم إلغاء الرحلة بالتوافق المشترك. هل توافق على إلغاء الرحلة؟'
              : 'The rider requested mutual cancellation. Do you agree to cancel?'}
          </p>
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              disabled={mutualCancel.isProcessing || isCancelling}
              onClick={mutualCancel.acceptCancel}
              className="h-10 flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white transition cursor-pointer disabled:opacity-50"
            >
              {mutualCancel.isProcessing || isCancelling
                ? (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...')
                : (language === 'ar' ? 'موافق على الإلغاء' : 'Accept Cancel')}
            </button>
            <button
              type="button"
              disabled={mutualCancel.isProcessing || isCancelling}
              onClick={mutualCancel.declineCancel}
              className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              {language === 'ar' ? 'رفض الإلغاء' : 'Decline'}
            </button>
          </div>
        </div>
      ) : mutualCancel.pendingRequestFrom === 'captain' ? (
        <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <span>{language === 'ar' ? 'تم إرسال طلب إلغاء الرحلة... بانتظار موافقة المستخدم' : 'Cancellation requested... waiting for rider'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'ar'
              ? 'يتطلب إلغاء الرحلة موافقة الطرفين. جاري انتظار رد المستخدم.'
              : 'Cancellation requires mutual agreement. Waiting for rider response.'}
          </p>
          <button
            type="button"
            disabled={mutualCancel.isProcessing}
            onClick={mutualCancel.revokeCancel}
            className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
          >
            {language === 'ar' ? 'تراجع عن طلب الإلغاء' : 'Revoke Request'}
          </button>
        </div>
      ) : step !== 'ARRIVED' && !isConfirmingCancel ? (
        <button
          type="button"
          disabled={isCompleting || isCancelling}
          onClick={() => setIsConfirmingCancel(true)}
          className={styles.cancelButton}
        >
          <AlertOctagon className={styles.cancelIcon} />
          {step === 'STARTED' ? (t('stopTrip') || 'إيقاف الرحلة') : t('cancelTrip')}
        </button>
      ) : isConfirmingCancel ? (
        <div className={styles.cancelConfirmWrap}>
          <p className={styles.cancelConfirmText}>
            {step === 'STARTED'
              ? (language === 'ar'
                  ? 'الرحلة جارية حالياً ويتطلب إلغاؤها موافقة الراكب. هل تود إرسال طلب إلغاء بالتوافق؟'
                  : 'Trip is in progress and requires mutual agreement. Send cancellation request?')
              : (language === 'ar'
                  ? 'هل أنت متأكد من رغبتك في إلغاء الرحلة قبل بدئها؟'
                  : 'Are you sure you want to cancel the trip before it starts?')}
          </p>
          <div className={styles.cancelConfirmActions}>
            <button
              type="button"
              disabled={isCancelling || mutualCancel.isProcessing}
              onClick={async () => {
                setIsConfirmingCancel(false);
                if (step === 'STARTED') {
                  await mutualCancel.requestCancel();
                } else {
                  await onCancelTrip();
                }
              }}
              className={styles.cancelConfirmButton}
            >
              {step === 'STARTED'
                ? (language === 'ar' ? 'إرسال طلب الإلغاء' : 'Send Request')
                : (language === 'ar' ? 'تأكيد إلغاء الرحلة' : 'Confirm Cancel')}
            </button>
            <button
              type="button"
              disabled={isCancelling}
              onClick={() => setIsConfirmingCancel(false)}
              className={styles.cancelBackButton}
            >
              {t('cancelBackButton')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
