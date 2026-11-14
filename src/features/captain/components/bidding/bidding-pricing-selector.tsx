import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import React from 'react';
import { styles, type PricingMode, type RiderPreference } from './bidding-pricing-styles';
import { BiddingMeterDetailsPanel } from './bidding-meter-details-panel';

export type { PricingMode, RiderPreference };

interface BiddingPricingSelectorProps {
  language: string;
  currency: string;
  pricingMode: PricingMode | null;
  appPrice: string;
  setAppPrice: (val: string) => void;
  marketFare: number;
  baseFare: number;
  isCoveredInBaseFare: boolean;
  meterDetails: any;
  captainMeterFare: number;
  premiumFactor: number;
  ceilingPrice: number;
  floorPrice: number;
  MARKET_FLOOR_FACTOR: number;
  normalizedIncreaseAmount: number;
  isMeterOffMarket: boolean;
  bandHeadroom: number;
  setIncreaseAmount: (val: number) => void;
  isAboveBand: boolean;
  aboveBandPercent: number;
  isDumpingBlocked?: boolean;
  isDumpingAmber?: boolean;
  handleApplyFloorPrice?: () => void;
}

export function BiddingPricingSelector({
  currency,
  pricingMode,
  marketFare,
  baseFare,
  isCoveredInBaseFare,
  meterDetails,
  captainMeterFare,
  premiumFactor,
  ceilingPrice,
  floorPrice,
  MARKET_FLOOR_FACTOR,
  normalizedIncreaseAmount,
  isMeterOffMarket,
  bandHeadroom,
  setIncreaseAmount,
  isAboveBand,
  aboveBandPercent,
}: BiddingPricingSelectorProps) {
  const t = useTranslations('captainBidding');

  return (
    <>
      {pricingMode === 'FREE' && (
        <div className={styles.freeModeNotice}>
          {t('companyPriceNotice')}
        </div>
      )}

      {pricingMode === 'APP' && (
        <div className={styles.appModeContainer}>
          <div className={styles.appModeHeader}>
            <div>
              <p className={styles.appModeTitle}>{t('appModeInputNotice')}</p>
              <p className={styles.appModeHint}>{t('appModeInputHint')}</p>
            </div>
            {marketFare > 0 && (
              <div className={styles.marketAvgBadge}>
                {t('marketAvgValue', { marketFare: marketFare.toFixed(2), currency })}
              </div>
            )}
          </div>
        </div>
      )}

      {pricingMode === 'TAXI' && (
        <div className={styles.taxiModeContainer}>
          <div className={styles.taxiModeNotice}>
            🚕 {t('taxiModeNotice')}
          </div>
          <p className={styles.taxiModeHint}>
            {t('taxiModeHint')}
          </p>
        </div>
      )}

      {pricingMode === 'FREE' && (
        <>
          <BiddingMeterDetailsPanel
            isCoveredInBaseFare={isCoveredInBaseFare}
            meterDetails={meterDetails}
            baseFare={baseFare}
            captainMeterFare={captainMeterFare}
            currency={currency}
            marketFare={marketFare}
            premiumFactor={premiumFactor}
            ceilingPrice={ceilingPrice}
            MARKET_FLOOR_FACTOR={MARKET_FLOOR_FACTOR}
            floorPrice={floorPrice}
          />

          <dl className={styles.breakdownList}>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>{t('breakdownMeter')}</dt>
              <dd dir="ltr" className={styles.breakdownValue}>{captainMeterFare.toFixed(2)} {currency}</dd>
            </div>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>{t('breakdownMarket')}</dt>
              <dd dir="ltr" className={styles.breakdownValue}>
                {marketFare > 0 ? `${marketFare.toFixed(2)} ${currency}` : t('breakdownMarketUnknown')}
              </dd>
            </div>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>
                {t('breakdownWarnLine', { percent: Math.round(premiumFactor * 100) })}
              </dt>
              <dd dir="ltr" className={styles.breakdownValue}>{ceilingPrice.toFixed(2)} {currency}</dd>
            </div>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>{t('breakdownFloor')}</dt>
              <dd dir="ltr" className={styles.breakdownValue}>{floorPrice.toFixed(2)} {currency}</dd>
            </div>
            {normalizedIncreaseAmount !== 0 && (
              <div className={cn(styles.breakdownRow, styles.breakdownRowAccent)}>
                <dt className={styles.breakdownLabel}>{t('breakdownYourIncrease')}</dt>
                <dd dir="ltr" className={styles.breakdownValue}>
                  {normalizedIncreaseAmount >= 0 ? '+' : '−'}{Math.abs(normalizedIncreaseAmount).toFixed(2)} {currency}
                </dd>
              </div>
            )}
          </dl>

          {isMeterOffMarket ? (
            <p className={styles.aboveBandWarning}>
              {t('meterOffMarket', {
                meter: baseFare.toFixed(2),
                market: marketFare.toFixed(2),
                currency,
              })}
            </p>
          ) : null}

          {bandHeadroom > 0 ? (
            <button
              type="button"
              onClick={() => setIncreaseAmount(bandHeadroom)}
              className={styles.style156_21}
            >
              {t('applyMaxIncrease')}
            </button>
          ) : null}

          {isAboveBand && !isMeterOffMarket ? (
            <p className={styles.aboveBandWarning}>
              {t('aboveBandWarning', {
                percent: aboveBandPercent,
                limit: Math.round(premiumFactor * 100),
              })}
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
