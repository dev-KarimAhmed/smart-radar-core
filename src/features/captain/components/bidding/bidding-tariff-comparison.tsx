import React from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Sparkles } from 'lucide-react';
import { styles, type BiddingTariffComparisonProps } from './bidding-tariff-styles';
import { BiddingTariffGrid } from './bidding-tariff-grid';

export * from './bidding-tariff-styles';
export * from './bidding-tariff-grid';

export function BiddingTariffComparison({
  currency,
  tierLabel,
  rankIncreaseFactor,
  premiumFactor,
  bandHeadroom,
  isGoldOrPlatinum,
  isSilver,
  isWithinBaseFare,
  marketBaseFare,
  marketPerKm,
  marketPerMin,
  currentBaseFare,
  currentPerKm,
  currentPerMin,
  offerBaseFare,
  offerPerKm,
  offerPerMin,
  isDumpingAmber,
  dumpingDeviationRatio,
  riderPreference,
  onEditTariff,
}: BiddingTariffComparisonProps) {
  const t = useTranslations('captainBidding');

  return (
    <>
      <div className={styles.header}>
        <div>
          <p className={styles.tierPremiumTitle}>
            <Sparkles className={styles.tierPremiumIcon} />
            {t('tierPremium')}
          </p>

          <p className={styles.tierPremiumDesc}>
            {rankIncreaseFactor > 0
              ? t('tierPremiumDescription', {
                tier: tierLabel,
                rankPercent: Math.round(rankIncreaseFactor * 100),
                warnPercent: Math.round(premiumFactor * 100),
              })
              : t('noTierPremium', {
                tier: tierLabel,
                warnPercent: Math.round(premiumFactor * 100),
              })}
          </p>
        </div>

        <div className={styles.maxIncreaseContainer}>
          <p className={styles.maxIncreaseLabel}>{t('maxIncrease')}</p>
          <p className={styles.maxIncreaseValue}>{bandHeadroom.toFixed(2)} {currency}</p>
        </div>
      </div>

      {isGoldOrPlatinum && (
        <div className={styles.goldBanner}>
          {t('goldBannerMessage', {
            tier: tierLabel,
            percent: Math.round(rankIncreaseFactor * 100),
          })}
        </div>
      )}

      {isWithinBaseFare ? (
        <div className={styles.withinBaseBanner}>
          {t('withinBaseBanner')}
        </div>
      ) : (
        <BiddingTariffGrid
          marketBaseFare={marketBaseFare}
          marketPerKm={marketPerKm}
          marketPerMin={marketPerMin}
          currentBaseFare={currentBaseFare}
          currentPerKm={currentPerKm}
          currentPerMin={currentPerMin}
          offerBaseFare={offerBaseFare}
          offerPerKm={offerPerKm}
          offerPerMin={offerPerMin}
          onEditTariff={onEditTariff}
        />
      )}

      {isSilver && (isDumpingAmber || dumpingDeviationRatio > 0.15) && (
        <div className={styles.silverWarning}>
          {t('silverWarning')}
        </div>
      )}

      {riderPreference ? (
        <div className={styles.pricingModeContainer}>
          <div className={styles.riderPrefBadge}>
            <Lock className={styles.riderPrefIcon} />
            <span>
              {t('pricingModeLockedByRider', {
                mode: t(
                  riderPreference === 'APP'
                    ? 'appPriceMode'
                    : riderPreference === 'TAXI'
                    ? 'taxiMeterMode'
                    : 'freePriceMode'
                ),
              })}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
