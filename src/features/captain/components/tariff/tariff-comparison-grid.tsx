'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { MarketAverageTariff } from '../../hooks/use-price-per-km-setup';
import { tariffModalStyles as styles } from './tariff-modal-styles';

interface TariffComparisonGridProps {
  isGoldOrPlatinum: boolean;
  isSilver: boolean;
  isArabic: boolean;
  marketAverage?: MarketAverageTariff | null;
  initialTariff?: { pricePerKm: number | null; pricePerMin: number | null };
  pricePerKm: string;
  setPricePerKm: (val: string) => void;
  pricePerMin: string;
  setPricePerMin: (val: string) => void;
  handleStepPricePerKm: (delta: number) => void;
  handleStepPricePerMin: (delta: number) => void;
  setIsSilverConfirmed: (val: boolean) => void;
  isSaving: boolean;
  t: (key: string, values?: any) => string;
}

export function TariffComparisonGrid({
  isGoldOrPlatinum,
  isSilver,
  isArabic,
  marketAverage,
  initialTariff,
  pricePerKm,
  setPricePerKm,
  pricePerMin,
  setPricePerMin,
  handleStepPricePerKm,
  handleStepPricePerMin,
  setIsSilverConfirmed,
  isSaving,
  t,
}: TariffComparisonGridProps) {
  return (
    <>
      {isGoldOrPlatinum ? (
        <div className={styles.goldRankNotice}>{t('tariffGoldBonusNotice')}</div>
      ) : null}

      {isSilver &&
      marketAverage &&
      (Number(pricePerKm) < marketAverage.perKm * 0.85 ||
        Number(pricePerMin) < marketAverage.perMin * 0.85) ? (
        <div className={styles.silverWarningLine}>{t('tariffSilverReduceWarning')}</div>
      ) : null}

      {/* 3 Horizontal Columns: Market Average, Current Price, Update Price */}
      <div className={styles.comparisonGrid}>
        {/* Column 1: Market Average */}
        <div className={styles.comparisonCard}>
          <h4 className={styles.comparisonCardHeader}>{t('tariffMarketAverage')}</h4>
          <div className={styles.comparisonCardRows}>
            <div className={styles.comparisonCardRow}>
              <span className={styles.comparisonCardLabel}>{t('tariffPerKmShort')}</span>
              <span className={styles.comparisonCardValue}>
                {marketAverage?.perKm?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className={styles.comparisonCardRow}>
              <span className={styles.comparisonCardLabel}>{t('tariffPerMinShort')}</span>
              <span className={styles.comparisonCardValue}>
                {marketAverage?.perMin?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Current Price */}
        <div className={styles.comparisonCard}>
          <h4 className={styles.comparisonCardHeader}>{t('tariffCurrentPrice')}</h4>
          <div className={styles.comparisonCardRows}>
            <div className={styles.comparisonCardRow}>
              <span className={styles.comparisonCardLabel}>{t('tariffPerKmShort')}</span>
              <span className={styles.comparisonCardValue}>
                {initialTariff?.pricePerKm?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className={styles.comparisonCardRow}>
              <span className={styles.comparisonCardLabel}>{t('tariffPerMinShort')}</span>
              <span className={styles.comparisonCardValue}>
                {initialTariff?.pricePerMin?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Update Price */}
        <div className={styles.comparisonCardAccent}>
          <h4 className={styles.comparisonCardHeaderAccent}>{t('tariffUpdatePrice')}</h4>
          <div className={styles.comparisonCardRows}>
            <div className={styles.comparisonCardRow}>
              <span className={styles.comparisonCardLabel}>{t('tariffPerKmShort')}</span>
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 w-full min-w-0">
                <button
                  type="button"
                  onClick={() => handleStepPricePerKm(-0.1)}
                  className="h-7 w-5 sm:w-6 shrink-0 rounded bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center text-xs active:scale-90 transition cursor-pointer select-none"
                  title="-0.10"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={pricePerKm}
                  onChange={(event) => {
                    setPricePerKm(event.target.value);
                    setIsSilverConfirmed(false);
                  }}
                  placeholder={marketAverage?.perKm?.toFixed(2) || '0.00'}
                  disabled={isSaving}
                  className={styles.miniInput}
                />
                <button
                  type="button"
                  onClick={() => handleStepPricePerKm(0.1)}
                  className="h-7 w-5 sm:w-6 shrink-0 rounded bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center text-xs active:scale-90 transition cursor-pointer select-none"
                  title="+0.10"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className={styles.comparisonCardRow}>
              <span className={styles.comparisonCardLabel}>{t('tariffPerMinShort')}</span>
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 w-full min-w-0">
                <button
                  type="button"
                  onClick={() => handleStepPricePerMin(-0.1)}
                  className="h-7 w-5 sm:w-6 shrink-0 rounded bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center text-xs active:scale-90 transition cursor-pointer select-none"
                  title="-0.10"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={pricePerMin}
                  onChange={(event) => {
                    setPricePerMin(event.target.value);
                    setIsSilverConfirmed(false);
                  }}
                  placeholder="0.00"
                  disabled={isSaving}
                  className={styles.miniInput}
                />
                <button
                  type="button"
                  onClick={() => handleStepPricePerMin(0.1)}
                  className="h-7 w-5 sm:w-6 shrink-0 rounded bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center text-xs active:scale-90 transition cursor-pointer select-none"
                  title="+0.10"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
