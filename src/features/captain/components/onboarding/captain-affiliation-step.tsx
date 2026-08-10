'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { AffiliationType } from '@/core/types';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

const styles = {
  root: 'space-y-4 animate-fade-in text-right',
  taxiButton:
    'w-full h-14 text-base border border-[#243249] hover:border-[#14B8A6]/60 bg-[#0B0F19] hover:bg-[#161F30] text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(20,184,166,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]',
  smartAppButton:
    'w-full h-14 text-base border border-[#243249] hover:border-[#3B82F6]/60 bg-[#0B0F19] hover:bg-[#161F30] text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]',
  backButton: 'w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer',
} as const;

export function CaptainAffiliationStep({
  onSelect,
  onBack,
}: {
  onSelect: (affiliation: AffiliationType) => void;
  onBack: () => void;
}) {
  const t = useTranslations('captainOnboarding.affiliation');
  const { isArabic } = useDashboardLanguage();

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      <button type="button" className={styles.taxiButton} onClick={() => onSelect('office-taxi')}>
        <span>🚕</span>
        <span>{t('taxi')}</span>
      </button>

      <button type="button" className={styles.smartAppButton} onClick={() => onSelect('smart-app')}>
        <span>📱</span>
        <span>{t('smartApp')}</span>
      </button>

      <button type="button" className={styles.backButton} onClick={onBack}>
        {t('back')}
      </button>
    </div>
  );
}
