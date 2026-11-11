'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { styles } from './tariff-modal-styles';
import type { MarketAverageTariff } from '../../hooks/use-price-per-km-setup';

interface FreePricingComparisonGridProps {
  isArabic: boolean;
  marketAverage: MarketAverageTariff | null;
  pricePerKm: string;
  onPricePerKmChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStepPricePerKm: (delta: number) => void;
  pricePerMin: string;
  onPricePerMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStepPricePerMin: (delta: number) => void;
}

export function FreePricingComparisonGrid({
  isArabic,
  marketAverage,
  pricePerKm,
  onPricePerKmChange,
  onStepPricePerKm,
  pricePerMin,
  onPricePerMinChange,
  onStepPricePerMin,
}: FreePricingComparisonGridProps) {
  return (
    <div className={styles.comparisonGrid}>
      {/* 1. عمود معدل سعر السوق */}
      <div className={styles.comparisonCard}>
        <div className={styles.comparisonCardHeader}>{isArabic ? 'معدل سعر السوق' : 'Market Avg'}</div>
        <div className={styles.comparisonCardRows}>
          <div className={styles.comparisonCardRow}>
            <span className={styles.comparisonCardValue}>
              {marketAverage?.pricePerKm != null ? marketAverage.pricePerKm.toFixed(2) : '0.35'}
            </span>
            <span className={styles.comparisonCardLabel}>{isArabic ? 'لكل كم' : '/ km'}</span>
          </div>
          <div className={styles.comparisonCardRow}>
            <span className={styles.comparisonCardValue}>
              {marketAverage?.pricePerMin != null ? marketAverage.pricePerMin.toFixed(2) : '0.04'}
            </span>
            <span className={styles.comparisonCardLabel}>{isArabic ? 'لكل دقيقة' : '/ min'}</span>
          </div>
        </div>
      </div>

      {/* 2. عمود سعر التطبيقات الذكية */}
      <div className={styles.comparisonCard}>
        <div className={styles.comparisonCardHeader}>{isArabic ? 'سعر التطبيقات' : 'App Price'}</div>
        <div className={styles.comparisonCardRows}>
          <div className={styles.comparisonCardRow}>
            <span className={styles.comparisonCardValue}>0.40</span>
            <span className={styles.comparisonCardLabel}>{isArabic ? 'لكل كم' : '/ km'}</span>
          </div>
          <div className={styles.comparisonCardRow}>
            <span className={styles.comparisonCardValue}>0.05</span>
            <span className={styles.comparisonCardLabel}>{isArabic ? 'لكل دقيقة' : '/ min'}</span>
          </div>
        </div>
      </div>

      {/* 3. عمود حدد سعرك الخاص */}
      <div className={styles.comparisonCardAccent}>
        <div className={styles.comparisonCardHeaderAccent}>{isArabic ? 'حدد سعرك' : 'Your Price'}</div>
        <div className={styles.comparisonCardAccentRows}>
          <div className={styles.comparisonCardRow}>
            <div className="flex items-center justify-center gap-1 w-full min-w-0">
              <button
                type="button"
                onClick={() => onStepPricePerKm(-0.01)}
                className="h-7 w-7 sm:w-6 flex shrink-0 items-center justify-center rounded-md bg-white/5 hover:bg-white/15 text-slate-300 font-bold transition cursor-pointer"
                title="-0.01"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                id="tariff-price-per-km"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={pricePerKm}
                onChange={onPricePerKmChange}
                className={styles.miniInput}
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={() => onStepPricePerKm(0.01)}
                className="h-7 w-7 sm:w-6 flex shrink-0 items-center justify-center rounded-md bg-white/5 hover:bg-white/15 text-slate-300 font-bold transition cursor-pointer"
                title="+0.01"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className={styles.comparisonCardLabel}>{isArabic ? 'لكل كم' : '/ km'}</span>
          </div>

          <div className={styles.comparisonCardRow}>
            <div className="flex items-center justify-center gap-1 w-full min-w-0">
              <button
                type="button"
                onClick={() => onStepPricePerMin(-0.01)}
                className="h-7 w-7 sm:w-6 flex shrink-0 items-center justify-center rounded-md bg-white/5 hover:bg-white/15 text-slate-300 font-bold transition cursor-pointer"
                title="-0.01"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                id="tariff-price-per-min"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={pricePerMin}
                onChange={onPricePerMinChange}
                className={styles.miniInput}
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={() => onStepPricePerMin(0.01)}
                className="h-7 w-7 sm:w-6 flex shrink-0 items-center justify-center rounded-md bg-white/5 hover:bg-white/15 text-slate-300 font-bold transition cursor-pointer"
                title="+0.01"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className={styles.comparisonCardLabel}>{isArabic ? 'لكل دقيقة' : '/ min'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
