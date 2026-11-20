'use client';

import React from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketAverageTariff } from '../../hooks/use-price-per-km-setup';
import { tariffModalStyles as styles } from './tariff-modal-styles';

interface TariffShortDistancesSectionProps {
  isArabic: boolean;
  currency?: string;
  minBaseFare: number;
  marketAverage?: MarketAverageTariff | null;
  isShortDistancesOpen: boolean;
  setIsShortDistancesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shortDistanceTotal: number;
  shortDistancesError: string;
  includedKm: string;
  setIncludedKm: (val: string) => void;
  handleStepIncludedKm: (delta: number) => void;
  baseFare: string;
  setBaseFare: (val: string) => void;
  handleStepBaseFare: (delta: number) => void;
  isSaving: boolean;
  t: (key: string, values?: any) => string;
}

export function TariffShortDistancesSection({
  isArabic,
  currency,
  minBaseFare,
  marketAverage,
  isShortDistancesOpen,
  setIsShortDistancesOpen,
  shortDistanceTotal,
  shortDistancesError,
  includedKm,
  setIncludedKm,
  handleStepIncludedKm,
  baseFare,
  setBaseFare,
  handleStepBaseFare,
  isSaving,
  t,
}: TariffShortDistancesSectionProps) {
  return (
    <div className={styles.shortDistancesSection}>
      <button
        type="button"
        onClick={() => setIsShortDistancesOpen((current) => !current)}
        className={styles.shortDistancesToggle}
        aria-expanded={isShortDistancesOpen}
      >
        <span>{t('tariffModalShortDistancesToggle')}</span>
        <div className="flex items-center gap-2.5">
          {shortDistanceTotal > 0 ? (
            <span className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border-2 border-emerald-400 bg-emerald-500/25 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)] tracking-wide">
              <span className="text-xs font-bold text-emerald-200">
                {t('tariffModalYourPrice') || (isArabic ? 'سعرك' : 'Your price')}
              </span>
              <span className="font-mono font-black text-base">
                {shortDistanceTotal}
              </span>
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              styles.shortDistancesToggleIcon,
              isShortDistancesOpen ? styles.shortDistancesToggleIconOpen : ''
            )}
          />
        </div>
      </button>

      {isShortDistancesOpen ? (
        <div className={styles.shortDistancesFields}>
          {shortDistancesError ? <p className={styles.shortDistancesError}>{shortDistancesError}</p> : null}
          {/* Distance included in opening charge */}
          <div className={styles.field}>
            <div className="flex items-center justify-between">
              <label className={styles.fieldLabel}>
                {isArabic ? 'حدد المسافة القصيرة بنسبة لك:' : t('tariffModalIncludedKmLabel')}
              </label>
              {marketAverage ? (
                <span className="text-[11px] font-bold text-slate-400">
                  {isArabic
                    ? `متوسط السوق: ${marketAverage.includedKm.toFixed(1)} كم`
                    : t('tariffModalMarketAverageKm', { avg: marketAverage.includedKm.toFixed(1) })}
                </span>
              ) : null}
            </div>
            <span className={styles.fieldHint}>{t('tariffModalIncludedKmHint')}</span>
            <div className={styles.inputRow}>
              <button
                type="button"
                onClick={() => handleStepIncludedKm(-0.5)}
                className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black flex items-center justify-center active:scale-95 transition cursor-pointer"
                title="-0.5"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={includedKm}
                onChange={(event) => setIncludedKm(event.target.value)}
                placeholder="0"
                disabled={isSaving}
                className={cn(styles.input, 'text-center font-mono font-bold text-base')}
              />
              <button
                type="button"
                onClick={() => handleStepIncludedKm(0.5)}
                className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black flex items-center justify-center active:scale-95 transition cursor-pointer"
                title="+0.5"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className={styles.currencyBadge}>{t('tariffModalKmUnit')}</span>
            </div>
          </div>

          {/* Base fare (opening charge) */}
          <div className={styles.field}>
            <div className="flex items-center justify-between">
              <label className={styles.fieldLabel}>
                {isArabic ? 'حدد السعر المقطوع للمسافة القصيرة:' : t('tariffModalBaseFareLabel')}
              </label>
              <span className="text-[11px] font-bold text-emerald-300">
                {isArabic
                  ? `متوسط سعر السوق للمسافات القصيرة: ${(minBaseFare || 2.1).toFixed(2)} ${currency || 'د.أ'}`
                  : t('tariffModalMarketFloor', { min: minBaseFare.toFixed(2), currency: currency || '' })}
              </span>
            </div>
            <span className={styles.fieldHint}>{t('tariffModalBaseFareHint')}</span>
            <div className={styles.inputRow}>
              <button
                type="button"
                onClick={() => handleStepBaseFare(-0.5)}
                className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black flex items-center justify-center active:scale-95 transition cursor-pointer"
                title="-0.5"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={baseFare}
                onChange={(event) => setBaseFare(event.target.value)}
                placeholder="0.00"
                disabled={isSaving}
                className={cn(styles.input, 'text-center font-mono font-bold text-base')}
              />
              <button
                type="button"
                onClick={() => handleStepBaseFare(0.5)}
                className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black flex items-center justify-center active:scale-95 transition cursor-pointer"
                title="+0.5"
              >
                <Plus className="h-4 w-4" />
              </button>
              {currency ? <span className={styles.currencyBadge}>{currency}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
