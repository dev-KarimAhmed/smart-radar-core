import React from 'react';
import { ClipboardPaste, Edit3, Minus, Plus } from 'lucide-react';
import type { Trip } from '@/core/types';
import { cn } from '@/lib/utils';
import { styles } from './radar-map.styles';
import { formatLocalizedNumber } from './radar-map.helpers';
import type { RadarCopyType } from './radar-copy';
import { RadarAntiDumpingAlerts } from './radar-anti-dumping-alerts';

interface RadarCardPricingSectionProps {
  request: Trip;
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  isAppMode: boolean;
  isIndependentMode: boolean;
  isRadarFreeMode: boolean;
  isTaxiMode: boolean;
  isBlockedByOtherPendingOffer: boolean;
  lastSubmittedPrice?: number;
  directPrice?: string;
  defaultPriceValue: string;
  currentPrice: number;
  priceError?: boolean;
  isDumpingCrimson: boolean;
  isDumpingAmber: boolean;
  isUpperWarn: boolean;
  floorPrice: number;
  onInitiateOffer: (trip: Trip) => void;
  onPastePrice: (tripId: string) => Promise<void>;
  onUpdateDirectPrice: (tripId: string, value: string) => void;
  onClearPriceError: (tripId: string) => void;
  onEditTariff?: () => void;
}

export function RadarCardPricingSection({
  request,
  language,
  currency,
  copy,
  isAppMode,
  isIndependentMode,
  isRadarFreeMode,
  isTaxiMode,
  isBlockedByOtherPendingOffer,
  lastSubmittedPrice,
  directPrice,
  defaultPriceValue,
  currentPrice,
  priceError,
  isDumpingCrimson,
  isDumpingAmber,
  isUpperWarn,
  floorPrice,
  onInitiateOffer,
  onPastePrice,
  onUpdateDirectPrice,
  onClearPriceError,
  onEditTariff,
}: RadarCardPricingSectionProps) {
  return (
    <div className="mt-3.5 pt-3 border-t border-slate-800/80">
      {isAppMode && (
        <div className={styles.appPriceCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.appPriceCardHeader} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <span className={styles.appPriceCardBadge}>📱 {copy.appModeBadge}</span>
            <span className={styles.appPriceCardNotice}>{copy.appModeInputNotice}</span>
          </div>
          {lastSubmittedPrice != null && (
            <div className="flex items-center justify-between gap-2 px-1 pt-0.5 text-xs">
              <span className="font-bold text-slate-300">{copy.previousOfferPrice}</span>
              <span className="font-mono font-black text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded-lg px-2.5 py-0.5 text-xs">
                {formatLocalizedNumber(lastSubmittedPrice.toFixed(2), language)} {currency}
              </span>
            </div>
          )}
          <div className={styles.appPriceInputRow} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className={styles.appPriceInputGroup} dir="ltr">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                disabled={isBlockedByOtherPendingOffer}
                value={directPrice ?? ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  const cleanVal = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                  onUpdateDirectPrice(request.id, cleanVal);
                  if (priceError) onClearPriceError(request.id);
                }}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={cn(styles.appPriceInputField, 'text-amber-300 font-mono font-black')}
                dir="ltr"
              />
              <span className={styles.appPriceCurrencyBadge}>{currency}</span>
            </div>
            <button
              type="button"
              onClick={() => void onPastePrice(request.id)}
              disabled={isBlockedByOtherPendingOffer}
              className={styles.appPricePasteBtn}
              title={copy.pastePrice}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <ClipboardPaste className={styles.appPricePasteIcon} />
              <span>{copy.paste}</span>
            </button>
          </div>
          {priceError ? <p className={styles.appPriceInputError}>{copy.appModePriceRequired}</p> : null}
        </div>
      )}

      {(isIndependentMode || isRadarFreeMode) && (
        <div className={isIndependentMode ? styles.appPriceCard : "rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 shadow-inner space-y-2"} dir={language === 'ar' ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
          <div className={isIndependentMode ? styles.appPriceCardHeader : "flex items-center justify-between gap-2.5"}>
            <span className={isIndependentMode ? styles.appPriceCardBadge : "inline-flex items-center gap-1 text-xs font-black text-emerald-300 min-w-0 flex-1 leading-snug"}>
              {isIndependentMode ? `💼 ${copy.independentBadge}` : `📡 ${copy.radarModeNotice}`}
            </span>
            {isIndependentMode ? (
              <span className={styles.appPriceCardNotice}>{copy.independentNotice}</span>
            ) : onEditTariff && (
              <button
                type="button"
                onClick={onEditTariff}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Edit3 className="h-3 w-3" />
                <span>{copy.editTariffBtn}</span>
              </button>
            )}
          </div>
          {lastSubmittedPrice != null && (
            <div className="flex items-center justify-between gap-2 px-1 pt-0.5 text-xs">
              <span className="font-bold text-slate-300">{copy.previousOfferPrice}</span>
              <span className="font-mono font-black text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded-lg px-2.5 py-0.5 text-xs">
                {formatLocalizedNumber(lastSubmittedPrice.toFixed(2), language)} {currency}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-1 w-full" dir="ltr">
            <button
              type="button"
              disabled={isBlockedByOtherPendingOffer}
              onClick={() => {
                const nextVal = Math.max(0.1, Math.round((currentPrice - 0.5) * 100) / 100);
                onUpdateDirectPrice(request.id, nextVal.toFixed(2));
                if (priceError) onClearPriceError(request.id);
              }}
              className="flex h-10 w-9 sm:h-11 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div
              className={cn(
                styles.appPriceInputGroup,
                'min-w-0 flex-1',
                isDumpingCrimson ? '!border-rose-500/80 !bg-rose-950/40' : isDumpingAmber ? '!border-amber-500/80 !bg-amber-950/30' : '',
              )}
              dir="ltr"
            >
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder={defaultPriceValue || "0.00"}
                disabled={isBlockedByOtherPendingOffer}
                value={directPrice ?? defaultPriceValue}
                onChange={(e) => {
                  onUpdateDirectPrice(request.id, e.target.value);
                  if (priceError) onClearPriceError(request.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onInitiateOffer(request);
                  }
                }}
                className={cn(
                  styles.appPriceInputField,
                  'font-mono font-black text-center text-base',
                  isDumpingCrimson ? '!text-rose-300' : isDumpingAmber ? '!text-amber-300' : '',
                )}
                dir="ltr"
              />
              <span className={styles.appPriceCurrencyBadge}>{currency}</span>
            </div>
            <button
              type="button"
              disabled={isBlockedByOtherPendingOffer}
              onClick={() => {
                const nextVal = Math.round((currentPrice + 0.5) * 100) / 100;
                onUpdateDirectPrice(request.id, nextVal.toFixed(2));
                if (priceError) onClearPriceError(request.id);
              }}
              className="flex h-10 w-9 sm:h-11 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {isIndependentMode && priceError ? (
            <p className={styles.appPriceInputError}>{copy.independentPriceRequired}</p>
          ) : null}
        </div>
      )}

      {isTaxiMode && (
        <div className={styles.taxiNoticeBanner} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-1.5">
            <span className={styles.taxiNoticeIcon}>🚕</span>
            <span>{copy.taxiModeNotice}</span>
          </div>
          <span className="font-mono font-black text-sm text-amber-300" dir="ltr">
            {request.offerPrice != null ? `${formatLocalizedNumber(request.offerPrice.toFixed(2), language)} ${currency}` : '—'}
          </span>
        </div>
      )}

      <RadarAntiDumpingAlerts
        language={language}
        currency={currency}
        copy={copy}
        requestId={request.id}
        isDumpingCrimson={isDumpingCrimson}
        isDumpingAmber={isDumpingAmber}
        isUpperWarn={isUpperWarn}
        floorPrice={floorPrice}
        onUpdateDirectPrice={onUpdateDirectPrice}
        onClearPriceError={onClearPriceError}
      />
    </div>
  );
}
