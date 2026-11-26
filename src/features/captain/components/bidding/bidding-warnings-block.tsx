import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { styles } from './bidding-offer-stepper-styles';

interface BiddingWarningsBlockProps {
  isTierAmber: boolean;
  isAboveBand: boolean;
  premiumFactor: number;
  isDumpingAmber: boolean;
  finalOfferPrice: number;
  marketFare: number;
  marketDifference: number;
  marketDifferencePercent: number;
  currency: string;
  isDumpingBlocked: boolean;
  floorPrice: number;
  handleApplyFloorPrice: () => void;
  professionalAd: any;
}

export function BiddingWarningsBlock({
  isTierAmber,
  isAboveBand,
  premiumFactor,
  isDumpingAmber,
  finalOfferPrice,
  marketFare,
  marketDifference,
  marketDifferencePercent,
  currency,
  isDumpingBlocked,
  floorPrice,
  handleApplyFloorPrice,
  professionalAd,
}: BiddingWarningsBlockProps) {
  const t = useTranslations('captainBidding');

  return (
    <>
      {/* Tier Amber Warning */}
      {isTierAmber && !isAboveBand ? (
        <div className={styles.amberWarningBox}>
          <AlertTriangle className={styles.warningIcon} />
          <span>{t('tierAmberWarning', { limit: Math.round(premiumFactor * 100) })}</span>
        </div>
      ) : null}

      {/* Below Market 3-Minute Delay Notice */}
      {marketFare > 0 && finalOfferPrice > 0 && finalOfferPrice < marketFare && !isDumpingBlocked ? (
        <div className={styles.dumpingAmberBox}>
          <div className={styles.dumpingAmberInner}>
            <AlertTriangle className={styles.dumpingAmberIcon} />
            <div className={styles.dumpingAmberText}>
              {'تنبيه: عرضك أقل من متوسط السوق — سيتأخر ظهور عرضك للمستخدم لمدة 3 دقائق.'}
            </div>
          </div>
        </div>
      ) : null}

      {/* Dumping Amber Warning */}
      {isDumpingAmber ? (
        <div className={styles.dumpingAmberBox}>
          <div className={styles.dumpingAmberInner}>
            <AlertTriangle className={styles.dumpingAmberIcon} />
            <div className={styles.dumpingAmberText}>
              {t('dumpingAmberCalculationWarning', {
                offer: finalOfferPrice.toFixed(2),
                market: marketFare.toFixed(2),
                difference: marketDifference.toFixed(2),
                percent: marketDifferencePercent,
                currency,
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Dumping Block Box */}
      {isDumpingBlocked ? (
        <div className={styles.dumpingBlockBox}>
          <div className={styles.dumpingBlockHeader}>
            <div className={styles.dumpingBlockIconWrap}>
              <AlertTriangle className={styles.dumpingBlockIcon} />
            </div>
            <div className={styles.dumpingBlockContent}>
              <h4 className={styles.dumpingBlockTitle}>
                {t('dumpingCrimsonBlockTitle')}
              </h4>
              <p className={styles.dumpingBlockDesc}>
                {t('dumpingCrimsonBlockDesc', {
                  limit: Math.round(15),
                })}
              </p>
            </div>
          </div>

          {marketFare > 0 ? (
            <div className={styles.dumpingStatsGrid}>
              <div className={styles.dumpingStatItemMarket}>
                <span className={styles.dumpingStatLabelMarket}>
                  {t('breakdownMarket')}
                </span>
                <strong className={styles.dumpingStatValueMarket}>
                  {marketFare.toFixed(2)} {currency}
                </strong>
              </div>

              <div className={styles.dumpingStatItemFloor}>
                <span className={styles.dumpingStatLabelFloor}>
                  {t('breakdownFloor')}
                </span>
                <strong className={styles.dumpingStatValueFloor}>
                  {floorPrice.toFixed(2)} {currency}
                </strong>
              </div>

              <div className={styles.dumpingStatItemCurrent}>
                <span className={styles.dumpingStatLabelCurrent}>
                  {t('currentOfferFare')}
                </span>
                <strong className={styles.dumpingStatValueCurrent}>
                  {finalOfferPrice.toFixed(2)} {currency}
                </strong>
              </div>
            </div>
          ) : null}

          {floorPrice > 0 ? (
            <button
              type="button"
              onClick={handleApplyFloorPrice}
              className={styles.applyFloorBtn}
            >
              <Sparkles className={styles.sparklesIcon} />
              <span>
                {t('applyMinimumAllowedPrice', {
                  price: floorPrice.toFixed(2),
                  currency,
                })}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Professional Ad on Block */}
      {isDumpingBlocked && professionalAd ? (
        <AdDisplayCard
          ad={professionalAd}
          showHeart={false}
          badgeText={t('professionalAdBadge')}
          ctaText={professionalAd.buttonText}
          className={styles.professionalAdCard}
          onOpen={(event: React.MouseEvent) => {
            event.stopPropagation();
            window.open(professionalAd.actionUrl, '_blank', 'noopener,noreferrer');
          }}
        />
      ) : null}
    </>
  );
}
