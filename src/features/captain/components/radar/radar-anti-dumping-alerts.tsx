import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { formatLocalizedNumber } from './radar-map.helpers';
import type { RadarCopyType } from './radar-copy';

interface RadarAntiDumpingAlertsProps {
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  requestId: string;
  isDumpingCrimson: boolean;
  isDumpingAmber: boolean;
  isUpperWarn: boolean;
  floorPrice: number;
  onUpdateDirectPrice: (tripId: string, value: string) => void;
  onClearPriceError: (tripId: string) => void;
}

export function RadarAntiDumpingAlerts({
  language,
  currency,
  copy,
  requestId,
  isDumpingCrimson,
  isDumpingAmber,
  isUpperWarn,
  floorPrice,
  onUpdateDirectPrice,
  onClearPriceError,
}: RadarAntiDumpingAlertsProps) {
  if (isDumpingCrimson) {
    return (
      <div className="mt-2.5 rounded-xl border border-rose-500/40 bg-rose-950/50 p-2.5 text-xs text-rose-200 space-y-2 animate-in fade-in duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-start gap-2 font-bold">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{copy.dumpingCrimsonMsg}</span>
        </div>
        {floorPrice > 0 && (
          <button
            type="button"
            onClick={() => {
              onUpdateDirectPrice(requestId, floorPrice.toFixed(2));
              onClearPriceError(requestId);
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/20 py-1.5 px-3 text-xs font-black text-rose-200 hover:bg-rose-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{copy.applyFloorBtn} ({formatLocalizedNumber(floorPrice.toFixed(2), language)} {currency})</span>
          </button>
        )}
      </div>
    );
  }

  if (isDumpingAmber) {
    return (
      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs font-bold text-amber-200 animate-in fade-in duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <span>{copy.dumpingAmberMsg}</span>
      </div>
    );
  }

  if (isUpperWarn) {
    return (
      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs font-bold text-amber-200 animate-in fade-in duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <span>{copy.upperWarnMsg}</span>
      </div>
    );
  }

  return null;
}
