'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { styles } from './tariff-modal-styles';

interface PricingModeSelectorProps {
  setupMode: 'FREE' | 'APP' | 'TAXI';
  isArabic: boolean;
  onSelectMode: (mode: 'FREE' | 'APP' | 'TAXI') => void;
}

export function PricingModeSelector({
  setupMode,
  isArabic,
  onSelectMode,
}: PricingModeSelectorProps) {
  return (
    <div className={styles.modeSelector}>
      <button
        type="button"
        onClick={() => onSelectMode('FREE')}
        className={cn(
          styles.modeButton,
          setupMode === 'FREE' ? styles.modeButtonActive : styles.modeButtonInactive,
        )}
      >
        <span className={styles.modeButtonTitle}>
          {isArabic ? 'سعر حر' : 'Free Pricing'}
        </span>
        <span className={styles.modeButtonSubtitle}>
          {isArabic ? 'حدد تسعيرتك بحرية' : 'Full freedom'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onSelectMode('APP')}
        className={cn(
          styles.modeButton,
          setupMode === 'APP' ? styles.modeButtonActive : styles.modeButtonInactive,
        )}
      >
        <span className={styles.modeButtonTitle}>
          {isArabic ? 'تطبيقات ذكية' : 'Smart App'}
        </span>
        <span className={styles.modeButtonSubtitle}>
          {isArabic ? 'تسعيرة التطبيقات المعتمدة' : 'Official app rates'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onSelectMode('TAXI')}
        className={cn(
          styles.modeButton,
          setupMode === 'TAXI' ? styles.modeButtonActive : styles.modeButtonInactive,
        )}
      >
        <span className={styles.modeButtonTitle}>
          {isArabic ? 'تكسي عمومي' : 'Yellow Taxi'}
        </span>
        <span className={styles.modeButtonSubtitle}>
          {isArabic ? 'تسعيرة العداد المعتمدة' : 'Official meter rates'}
        </span>
      </button>
    </div>
  );
}
