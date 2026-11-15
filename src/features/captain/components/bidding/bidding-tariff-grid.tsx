import React from 'react';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { styles } from './bidding-tariff-styles';

interface BiddingTariffGridProps {
  marketBaseFare: number;
  marketPerKm: number;
  marketPerMin: number;
  currentBaseFare: number;
  currentPerKm: number;
  currentPerMin: number;
  offerBaseFare: number;
  offerPerKm: number;
  offerPerMin: number;
  onEditTariff?: () => void;
}

export function BiddingTariffGrid({
  marketBaseFare,
  marketPerKm,
  marketPerMin,
  currentBaseFare,
  currentPerKm,
  currentPerMin,
  offerBaseFare,
  offerPerKm,
  offerPerMin,
  onEditTariff,
}: BiddingTariffGridProps) {
  const t = useTranslations('captainBidding');

  return (
    <div className={styles.tariffGrid}>
      {/* Column 1: Market Avg */}
      <div className={styles.tariffColMarket}>
        <h4 className={styles.tariffTitleMarket}>
          {t('marketAvgLabel')}
        </h4>
        <div className={styles.tariffListMarket}>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('baseFareLabel')}</span>
            <span className={styles.tariffValueMarket}>{marketBaseFare.toFixed(2)}</span>
          </div>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('perKmLabel')}</span>
            <span className={styles.tariffValueMarket}>{marketPerKm.toFixed(2)}</span>
          </div>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('perMinLabel')}</span>
            <span className={styles.tariffValueMarket}>{marketPerMin.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Column 2: Current Tariff */}
      <div className={styles.tariffColCurrent}>
        <div className={styles.tariffHeaderCurrent}>
          <h4 className={styles.tariffTitleCurrent}>
            {t('yourTariff')}
          </h4>
          {onEditTariff ? (
            <button
              type="button"
              onClick={onEditTariff}
              className={styles.tariffEditBtn}
              title={t('editCurrentTariff')}
            >
              <Pencil className={styles.tariffEditIcon} />
              <span>{t('editBtn')}</span>
            </button>
          ) : null}
        </div>
        <div className={styles.tariffListWhite}>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('baseFareLabel')}</span>
            <span className={styles.tariffValueCurrent}>{currentBaseFare.toFixed(2)}</span>
          </div>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('perKmLabel')}</span>
            <span className={styles.tariffValueCurrent}>{currentPerKm.toFixed(2)}</span>
          </div>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('perMinLabel')}</span>
            <span className={styles.tariffValueCurrent}>{currentPerMin.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Column 3: Offer Tariff */}
      <div className={styles.tariffColOffer}>
        <h4 className={styles.tariffTitleOffer}>
          {t('offerTariff')}
        </h4>
        <div className={styles.tariffListWhite}>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('baseFareLabel')}</span>
            <span className={styles.tariffValueOffer}>{offerBaseFare.toFixed(2)}</span>
          </div>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('perKmLabel')}</span>
            <span className={styles.tariffValueOffer}>{offerPerKm.toFixed(2)}</span>
          </div>
          <div className={styles.tariffRow}>
            <span className={styles.tariffRowLabel}>{t('perMinLabel')}</span>
            <span className={styles.tariffValueOffer}>{offerPerMin.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
