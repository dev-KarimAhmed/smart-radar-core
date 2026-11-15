import React from 'react';
import { useTranslations } from 'next-intl';
import { styles } from './bidding-pricing-styles';

interface BiddingMeterDetailsPanelProps {
  isCoveredInBaseFare: boolean;
  meterDetails: any;
  baseFare: number;
  captainMeterFare: number;
  currency: string;
  marketFare: number;
  premiumFactor: number;
  ceilingPrice: number;
  MARKET_FLOOR_FACTOR: number;
  floorPrice: number;
}

export function BiddingMeterDetailsPanel({
  isCoveredInBaseFare,
  meterDetails,
  baseFare,
  captainMeterFare,
  currency,
  marketFare,
  premiumFactor,
  ceilingPrice,
  MARKET_FLOOR_FACTOR,
  floorPrice,
}: BiddingMeterDetailsPanelProps) {
  const t = useTranslations('captainBidding');

  return (
    <div className={styles.meterDetails}>
      <div className={styles.meterDetailsHeader}>
        <p className={styles.meterDetailsTitle}>{t('meterCalculationTitle')}</p>
        {isCoveredInBaseFare ? (
          <span className={styles.meterBadgeCovered}>
            {t('coveredInBaseFare')}
          </span>
        ) : null}
      </div>
      {isCoveredInBaseFare ? (
        <p className={styles.meterDetailsHint}>
          {t('coveredInBaseFareHint', {
            baseFare: (meterDetails?.baseFare ?? baseFare).toFixed(2),
            currency,
          })}
        </p>
      ) : meterDetails ? (
        <>
          <p className={styles.meterFormula} dir="ltr">
            <span className={styles.formulaInner} dir="ltr">
              <strong className={styles.formulaTotal}>{captainMeterFare.toFixed(2)} {currency}</strong>
              <span className={styles.formulaOperator}>=</span>
              <span>{meterDetails.baseFare.toFixed(2)} {currency}</span>
              <span className={styles.formulaOperator}>+</span>
              <span className={styles.formulaPart}>({meterDetails.billableKm.toFixed(2)} <bdi>{t('kmUnit')}</bdi> × {meterDetails.perKm.toFixed(2)} {currency})</span>
              <span className={styles.formulaOperator}>+</span>
              <span className={styles.formulaPart}>({meterDetails.estimatedMinutes.toFixed(1)} <bdi>{t('minUnit')}</bdi> × {meterDetails.perMin.toFixed(2)} {currency})</span>
            </span>
          </p>
          <p className={styles.meterDetailsRoute}>
            {t('meterCalculationRoute', {
              roadKm: meterDetails.roadKm.toFixed(2),
              includedKm: meterDetails.includedKm.toFixed(2),
              billableKm: meterDetails.billableKm.toFixed(2),
              minutes: meterDetails.estimatedMinutes.toFixed(1),
            })}
          </p>
        </>
      ) : (
        <p className={styles.meterDetailsHint}>{t('meterCalculationSource')}</p>
      )}
      {marketFare > 0 && (
        <>
          <p className={styles.meterFormula}>
            <span className={styles.marketLabel}>{t('marketReference')}</span>
            <span dir="ltr" className={styles.marketValue}>
              = {marketFare.toFixed(2)} {currency}
            </span>
          </p>
          <p className={styles.meterDetailsRoute}>
            <span>{t('warningLimit')}: </span>
            <span dir="ltr" className={styles.limitValue}>
              {marketFare.toFixed(2)} + ({marketFare.toFixed(2)} × {Math.round(premiumFactor * 100)}%) = {ceilingPrice.toFixed(2)} {currency}
            </span>
          </p>
          <p className={styles.meterDetailsRoute}>
            <span>{t('lowestAllowedOffer')}: </span>
            <span dir="ltr" className={styles.limitValue}>
              {marketFare.toFixed(2)} - ({marketFare.toFixed(2)} × {Math.round(MARKET_FLOOR_FACTOR * 100)}%) = {floorPrice.toFixed(2)} {currency}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
