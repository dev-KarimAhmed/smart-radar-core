import React from 'react';
import { Clock, Loader2, Route, X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { cn } from '@/lib/utils';
import { styles } from './radar-map.styles';
import type { RadarCopyType } from './radar-copy';

interface RadarCardActionsProps {
  request: Trip;
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  isOwnPendingOffer: boolean;
  lastSubmittedPrice?: number;
  isSubmitting: boolean;
  isCancelling: boolean;
  isDumpingCrimson: boolean;
  isDumpingAmber: boolean;
  onInitiateOffer: (trip: Trip) => void;
  onCancelOffer?: (tripId: string) => Promise<boolean | void>;
  onIgnoreRequest: (tripId: string) => void;
}

export function RadarCardActions({
  request,
  language,
  currency,
  copy,
  isOwnPendingOffer,
  lastSubmittedPrice,
  isSubmitting,
  isCancelling,
  isDumpingCrimson,
  isDumpingAmber,
  onInitiateOffer,
  onCancelOffer,
  onIgnoreRequest,
}: RadarCardActionsProps) {
  return (
    <>
      {isOwnPendingOffer && (
        <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 p-2.5 text-xs text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.12)] backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={styles.ownPendingPulseWrap}>
                <span className={styles.ownPendingPing} />
                <span className={styles.ownPendingDot} />
              </span>
              <Clock className={styles.ownPendingIcon} />
              <span className={styles.ownPendingText}>
                {copy.ownPendingOffer}
              </span>
            </div>
            {lastSubmittedPrice != null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                {language === 'ar' ? `السعر المقدم: ${lastSubmittedPrice.toFixed(2)} ${currency}` : `Offered: ${lastSubmittedPrice.toFixed(2)} ${currency}`}
              </span>
            )}
          </div>
        </div>
      )}

      <div className={styles.style231_39} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {isOwnPendingOffer ? (
          onCancelOffer ? (
            <button
              type="button"
              onClick={() => void onCancelOffer(request.id)}
              disabled={isCancelling}
              className={styles.cancelOfferBtnFull}
              title={copy.cancelOfferTitle}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <X className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {isCancelling ? copy.cancellingOffer : copy.cancelOffer}
              </span>
            </button>
          ) : null
        ) : (
          <>
            <button
              type="button"
              onClick={() => onInitiateOffer(request)}
              disabled={isSubmitting}
              className={cn(
                styles.style232_40,
                isSubmitting ? styles.pendingOfferDisabled : '',
                isDumpingCrimson ? '!border-rose-500/80' : isDumpingAmber ? '!border-amber-500/80' : '',
              )}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {isSubmitting ? (
                <Loader2 className={styles.submitSpinner} />
              ) : (
                <Route className={styles.style233_41} />
              )}
              <span className="truncate">
                {copy.submitDirect}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onIgnoreRequest(request.id)}
              className={styles.style236_42}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {copy.ignore}
            </button>
          </>
        )}
      </div>
    </>
  );
}

