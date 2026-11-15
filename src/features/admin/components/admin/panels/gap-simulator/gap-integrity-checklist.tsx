'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { gapSimulatorStyles as styles } from './gap-simulator-styles';

export function GapIntegrityChecklist() {
  const t = useTranslations('adminTab.simulator');

  return (
    <div className={styles.style295_33}>
      <h4 className={styles.style296_34}>{t('metrics.title')}</h4>
      <ul className={styles.style297_35}>
        <li className={styles.style298_36}>
          <Check className={cn(styles.style299_37, 'w-4 h-4')} />
          <span>{t('metrics.item1')}</span>
        </li>
        <li className={styles.style302_38}>
          <Check className={cn(styles.style303_39, 'w-4 h-4')} />
          <span>{t('metrics.item2')}</span>
        </li>
        <li className={styles.style306_40}>
          <Check className={cn(styles.style307_41, 'w-4 h-4')} />
          <span className={styles.style308_42}>
            {t('metrics.item3Text')}
            <code className={styles.style308_43}>{t('metrics.item3Code')}</code>
            {t('metrics.item3Suffix')}
          </span>
        </li>
      </ul>
    </div>
  );
}
