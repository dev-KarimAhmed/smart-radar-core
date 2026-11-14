import React from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './bidding-offer-stepper-styles';
import { type PricingMode } from './bidding-pricing-selector';

interface BiddingFareCardProps {
  pricingMode: PricingMode;
  currency: string;
  appPrice?: string;
  setAppPrice?: (val: string) => void;
  increaseAmount: number | string;
  setIncreaseAmount: React.Dispatch<React.SetStateAction<number | string>>;
  minIncreaseAmount: number;
  step: number;
  isMinusDisabled: boolean;
  isPlusDisabled: boolean;
  normalizedAppPrice: number;
  baseFare: number;
  marketFare: number;
  roundMoney: (val: number) => number;
}

export function BiddingFareCard({
  pricingMode,
  currency,
  appPrice = '',
  setAppPrice,
  increaseAmount,
  setIncreaseAmount,
  minIncreaseAmount,
  step,
  isMinusDisabled,
  isPlusDisabled,
  normalizedAppPrice,
  baseFare,
  marketFare,
  roundMoney,
}: BiddingFareCardProps) {
  const t = useTranslations('captainBidding');

  const handlePastePrice = React.useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const cleaned = text.replace(/,/g, '.');
        const match = cleaned.match(/\d+(?:\.\d+)?/);
        if (match && setAppPrice) {
          setAppPrice(match[0]);
        }
      }
    } catch {
      // Clipboard denied or unsupported - fail silently
    }
  }, [setAppPrice]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          {pricingMode === 'APP'
            ? t('pasteAppPrice')
            : pricingMode === 'TAXI'
              ? t('pricingModeTaxi')
              : t('increaseAmount')}
        </span>
        {pricingMode === 'APP' && (
          <button
            type="button"
            onClick={() => void handlePastePrice()}
            className={styles.pasteBtn}
            title={t('pasteAction')}
          >
            <ClipboardPaste className={styles.pasteIcon} />
            <span>{t('pasteAction')}</span>
          </button>
        )}
      </div>

      {pricingMode === 'APP' || pricingMode === 'TAXI' ? (
        <div className={styles.inputWrapper}>
          <input
            type="number"
            step="0.01"
            min="0.1"
            inputMode="decimal"
            value={appPrice}
            onChange={(e) => setAppPrice?.(e.target.value)}
            placeholder={marketFare > 0 ? marketFare.toFixed(2) : '0.00'}
            className={styles.cardInput}
            autoFocus
          />
          <span className={styles.currencyBadge}>{currency}</span>
        </div>
      ) : (
        <div className={styles.stepperRow}>
          <button
            type="button"
            onClick={() => setIncreaseAmount((value: any) => Math.max(minIncreaseAmount, roundMoney((Number(value) || 0) - step)))}
            disabled={isMinusDisabled}
            className={cn(styles.stepperBtn, isMinusDisabled ? styles.inputLocked : '')}
          >
            <Minus className={styles.stepperIcon} />
          </button>
          <input
            value={increaseAmount.toString()}
            onChange={(event) => {
              const val = event.target.value;
              if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                setIncreaseAmount(val);
              }
            }}
            inputMode="decimal"
            className={styles.stepperInput}
          />
          <button
            type="button"
            onClick={() => setIncreaseAmount((value: any) => roundMoney((Number(value) || 0) + step))}
            disabled={isPlusDisabled}
            className={cn(styles.stepperBtn, isPlusDisabled ? styles.inputLocked : '')}
          >
            <Plus className={styles.stepperIcon} />
          </button>
        </div>
      )}

      <span className={styles.cardHint}>
        {pricingMode === 'APP'
          ? (normalizedAppPrice > 0 ? `${normalizedAppPrice.toFixed(2)} ${currency}` : t('appModeHint'))
          : pricingMode === 'TAXI'
            ? t('taxiModeHint')
            : `${baseFare.toFixed(2)} ${currency}`}
      </span>
    </div>
  );
}
