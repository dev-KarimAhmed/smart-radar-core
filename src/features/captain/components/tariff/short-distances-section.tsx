'use client';

import React from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './tariff-modal-styles';

interface ShortDistancesSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  shortDistanceTotal: number;
  currencyLabel: string;
  isArabic: boolean;
  baseFare: string;
  onBaseFareChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStepBaseFare: (delta: number) => void;
  includedKm: string;
  onIncludedKmChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStepIncludedKm: (delta: number) => void;
  error?: string;
}

export function ShortDistancesSection({
  isOpen,
  onToggle,
  shortDistanceTotal,
  currencyLabel,
  isArabic,
  baseFare,
  onBaseFareChange,
  onStepBaseFare,
  includedKm,
  onIncludedKmChange,
  onStepIncludedKm,
  error,
}: ShortDistancesSectionProps) {
  return (
    <div className={styles.shortDistancesSection}>
      <button
        type="button"
        onClick={onToggle}
        className={styles.shortDistancesToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            className={cn(
              styles.shortDistancesToggleIcon,
              isOpen && styles.shortDistancesToggleIconOpen,
            )}
          />
<<<<<<< Updated upstream
          <span className="font-bold">
            {isArabic ? 'قم بإعداد سعر المسافات القصيرة' : 'Configure Short Distance Fare'}
=======
          <span className="font-bold text-start">
            {isArabic ? 'إعداد تسعيرة المسافات القصيرة' : 'Configure Short Distance Fare'}
>>>>>>> Stashed changes
          </span>
        </div>
        <span className="shrink-0 text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
          {isArabic ? `السعر الحالي: ${shortDistanceTotal} ${currencyLabel}` : `Current: ${shortDistanceTotal} ${currencyLabel}`}
        </span>
      </button>

      {isOpen && (
        <div className={styles.shortDistancesFields}>
          {/* Base Fare */}
          <div className={styles.field}>
            <div className="flex items-center justify-between">
              <label htmlFor="tariff-base-fare" className={styles.fieldLabel}>
                {isArabic ? 'سعر فتح العداد' : 'Base Fare (Meter Opening)'}
              </label>
            </div>
            <p className={styles.fieldHint}>
              {isArabic ? 'يبدأ العداد من هذا المبلغ لكل رحلة' : 'Trip counter starts from this amount'}
            </p>
            <div className={styles.inputRow}>
              <div className="flex items-center rounded-2xl border border-slate-800 bg-black/60 px-1 focus-within:border-emerald-400 transition">
                <button
                  type="button"
                  onClick={() => onStepBaseFare(-0.1)}
                  className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
                  title="-0.10"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id="tariff-base-fare"
                  type="number"
                  step="0.05"
                  min="0"
                  inputMode="decimal"
                  value={baseFare}
                  onChange={onBaseFareChange}
                  className="w-20 text-center font-mono font-bold text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => onStepBaseFare(0.1)}
                  className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
                  title="+0.10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className={styles.currencyBadge}>{currencyLabel}</span>
            </div>
          </div>

          {/* Included Km */}
          <div className={styles.field}>
            <div className="flex items-center justify-between">
              <label htmlFor="tariff-included-km" className={styles.fieldLabel}>
                {isArabic ? 'المسافة المشمولة بفتح العداد' : 'Included Distance in Base Fare'}
              </label>
            </div>
            <p className={styles.fieldHint}>
              {isArabic ? 'المسافة التي يغطيها فتح العداد قبل احتساب الكيلومترات الإضافية' : 'Distance covered by base fare before calculating extra kilometers'}
            </p>
            <div className={styles.inputRow}>
              <div className="flex items-center rounded-2xl border border-slate-800 bg-black/60 px-1 focus-within:border-emerald-400 transition">
                <button
                  type="button"
                  onClick={() => onStepIncludedKm(-0.5)}
                  className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
                  title="-0.5"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id="tariff-included-km"
                  type="number"
                  step="0.5"
                  min="0"
                  inputMode="decimal"
                  value={includedKm}
                  onChange={onIncludedKmChange}
                  className="w-20 text-center font-mono font-bold text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => onStepIncludedKm(0.5)}
                  className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
                  title="+0.5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className={styles.currencyBadge}>{isArabic ? 'كم' : 'km'}</span>
            </div>
          </div>

          {error && <p className={styles.shortDistancesError}>{error}</p>}
        </div>
      )}
    </div>
  );
}
