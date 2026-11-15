import React from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './bidding-offer-stepper-styles';
import { type PricingMode } from './bidding-pricing-selector';

interface BiddingSummaryCardsProps {
  language: string;
  currency: string;
  pricingMode: PricingMode;
  finalOfferPrice: number;
  normalizedAppPrice: number;
  waitSecondsInput: string;
  setWaitSecondsInput: React.Dispatch<React.SetStateAction<string>>;
  MIN_OFFER_WAIT_SECONDS: number;
  DEFAULT_OFFER_WAIT_SECONDS?: number;
  MAX_OFFER_WAIT_SECONDS: number;
  parsedWaitSeconds: number;
}

export function BiddingSummaryCards({
  language,
  currency,
  pricingMode,
  finalOfferPrice,
  normalizedAppPrice,
  waitSecondsInput,
  setWaitSecondsInput,
  MIN_OFFER_WAIT_SECONDS,
  DEFAULT_OFFER_WAIT_SECONDS = 90,
  MAX_OFFER_WAIT_SECONDS,
  parsedWaitSeconds,
}: BiddingSummaryCardsProps) {
  const t = useTranslations('captainBidding');

  return (
    <>
      {/* Card 2: Final Offer Price */}
      <div className={styles.finalCard}>
        <span className={styles.finalTitle}>{t('finalOffer')}</span>
        <div className={styles.finalPriceRow}>
          <strong className={styles.finalPriceValue}>
            {finalOfferPrice.toFixed(2)}
          </strong>
          <span className={styles.finalPriceCurrency}>{currency}</span>
        </div>
        <span className={styles.finalSubtitle}>
          {pricingMode === 'APP' && normalizedAppPrice <= 0
            ? t('enterAppPriceHint')
            : t('tripFareLabel')}
        </span>
      </div>

      {/* Card 3: Offer Duration */}
      <div className={styles.durationCard}>
        <span className={styles.durationTitle}>{t('offerDurationShort')}</span>
        <div className={styles.durationStepperRow}>
          <button
            type="button"
            onClick={() => setWaitSecondsInput((current: any) => {
              const value = Number(current);
              const next = (Number.isFinite(value) ? value : DEFAULT_OFFER_WAIT_SECONDS) - 5;
              return String(Math.max(MIN_OFFER_WAIT_SECONDS, next));
            })}
            disabled={parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS}
            className={cn(styles.durationBtn, parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS ? styles.inputLocked : '')}
          >
            <Minus className={styles.durationBtnIcon} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={waitSecondsInput}
            onChange={(event) => {
              const val = event.target.value.replace(/[^0-9]/g, '');
              setWaitSecondsInput(val);
            }}
            onBlur={() => {
              const val = Number(waitSecondsInput);
              if (!Number.isFinite(val) || val < MIN_OFFER_WAIT_SECONDS) {
                setWaitSecondsInput(String(DEFAULT_OFFER_WAIT_SECONDS));
              } else if (val > MAX_OFFER_WAIT_SECONDS) {
                setWaitSecondsInput(String(MAX_OFFER_WAIT_SECONDS));
              }
            }}
            className={styles.durationInput}
          />
          <button
            type="button"
            onClick={() => setWaitSecondsInput((current: any) => {
              const value = Number(current);
              const next = (Number.isFinite(value) ? value : DEFAULT_OFFER_WAIT_SECONDS) + 5;
              return String(Math.min(MAX_OFFER_WAIT_SECONDS, Math.max(MIN_OFFER_WAIT_SECONDS, next)));
            })}
            disabled={parsedWaitSeconds >= MAX_OFFER_WAIT_SECONDS}
            className={cn(styles.durationBtn, parsedWaitSeconds >= MAX_OFFER_WAIT_SECONDS ? styles.inputLocked : '')}
          >
            <Plus className={styles.durationBtnIcon} />
          </button>
        </div>
        <span className={styles.durationSubtitle}>
          {parsedWaitSeconds > 0 
            ? `${parsedWaitSeconds} ${language === 'ar' ? 'ثانية' : 'sec'}` 
            : t('secondsUnit')}
        </span>
      </div>
    </>
  );
}
