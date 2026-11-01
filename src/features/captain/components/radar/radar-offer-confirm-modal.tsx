import React from 'react';
import { CheckCircle2, Loader2, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import type { ConfirmModalTripState } from './radar-map.types';
import { styles } from './radar-map.styles';
import { formatLocalizedNumber } from './radar-map.helpers';
import type { RadarCopyType } from './radar-copy';

interface RadarOfferConfirmModalProps {
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  confirmModalTrip: ConfirmModalTripState;
  modalPrice: string;
  setModalPrice: React.Dispatch<React.SetStateAction<string>>;
  waitSeconds: string;
  setWaitSeconds: React.Dispatch<React.SetStateAction<string>>;
  submittingRequestId: string | null;
  lastSubmittedPrices: Record<string, number[]>;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function RadarOfferConfirmModal({
  language,
  currency,
  copy,
  confirmModalTrip,
  modalPrice,
  setModalPrice,
  waitSeconds,
  setWaitSeconds,
  submittingRequestId,
  lastSubmittedPrices,
  onClose,
  onConfirm,
}: RadarOfferConfirmModalProps) {
  const modalTripId = confirmModalTrip.trip.id;
  const modalHistory = lastSubmittedPrices[modalTripId];
  const modalLastPrice = confirmModalTrip.previousPrice ?? (modalHistory && modalHistory.length > 0 ? modalHistory[modalHistory.length - 1] : undefined);
  const modalPriceNum = parseFloat(modalPrice) || 0;
  const baseMarketPrice = confirmModalTrip.trip.offerPrice != null && confirmModalTrip.trip.offerPrice > 0 ? confirmModalTrip.trip.offerPrice : null;
  const modalBrake = (baseMarketPrice && baseMarketPrice > 0 && modalPriceNum > 0)
    ? RadarAntiCheatKernel.enforceMarketBrakes(modalPriceNum, baseMarketPrice)
    : { status: 'NORMAL' as const };
  const isCrimson = confirmModalTrip.pricingMode !== 'TAXI' && (modalBrake.status === 'CRIMSON_BLOCK' || (Boolean(baseMarketPrice) && modalPriceNum > 0 && modalPriceNum < (baseMarketPrice! * 0.85)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0B0F19] p-5 shadow-2xl text-white space-y-4">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-black text-[#14B8A6]">
              {copy.confirmOfferTitle}
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">{confirmModalTrip.trip.dropoff || copy.destination}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {copy.confirmOfferSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Offered Price Summary */}
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3">
          <span className="text-xs font-bold text-slate-300">{copy.offerPriceLabel}:</span>
          <span className="font-mono text-base font-black text-[#14F5D5]">
            {formatLocalizedNumber(Number(modalPrice || confirmModalTrip.price).toFixed(2), language)} {currency}
          </span>
        </div>

        {/* Wait Seconds Box */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-200">
            {copy.waitSecondsLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={waitSeconds}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                setWaitSeconds(cleaned);
              }}
              onBlur={() => {
                const num = parseInt(waitSeconds, 10);
                if (isNaN(num) || num < 30) {
                  setWaitSeconds('30');
                } else if (num > 900) {
                  setWaitSeconds('900');
                } else {
                  setWaitSeconds(String(num));
                }
              }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              className="w-full rounded-xl border border-emerald-500/40 bg-black/70 px-3 py-2.5 text-start font-mono text-base font-black text-emerald-300 outline-none focus:border-emerald-400"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400/80 pointer-events-none select-none">
              {language === 'ar' ? 'ثانية' : 's'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight pt-0.5">{copy.waitSecondsHint}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={submittingRequestId === confirmModalTrip.trip.id}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14F5D5] via-[#14B8A6] to-[#0d9488] px-4 py-3 text-xs sm:text-sm font-black text-[#031518] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {submittingRequestId === confirmModalTrip.trip.id ? (
              <Loader2 className={styles.submitSpinner} />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>
              {copy.confirmBid}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
          >
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
