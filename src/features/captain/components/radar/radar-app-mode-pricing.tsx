import React from 'react';
import { ClipboardPaste } from 'lucide-react';
import type { Trip } from '@/core/types';
import { cn } from '@/lib/utils';
import { styles } from './radar-map.styles';
import { formatLocalizedNumber } from './radar-map.helpers';
import type { RadarCopyType } from './radar-copy';

interface RadarAppModePricingProps {
  request: Trip;
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  isBlockedByOtherPendingOffer: boolean;
  lastSubmittedPrice?: number;
  directPrice?: string;
  priceError?: boolean;
  onPastePrice: (tripId: string) => Promise<void>;
  onUpdateDirectPrice: (tripId: string, value: string) => void;
  onClearPriceError: (tripId: string) => void;
}

export function RadarAppModePricing({
  request,
  language,
  currency,
  copy,
  isBlockedByOtherPendingOffer,
  lastSubmittedPrice,
  directPrice,
  priceError,
  onPastePrice,
  onUpdateDirectPrice,
  onClearPriceError,
}: RadarAppModePricingProps) {
  return (
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
  );
}

