'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { styles, type CaptainPersonalValues } from './personal-step-types';

interface PersonalIdentityFieldsProps {
  values: CaptainPersonalValues;
  errors: Record<string, string>;
  onFieldChange: (field: keyof CaptainPersonalValues, value: string) => void;
}

export function PersonalIdentityFields({ values, errors, onFieldChange }: PersonalIdentityFieldsProps) {
  const t = useTranslations('captainOnboarding.personal');

  return (
    <>
      <div className={styles.field}>
        <label className={styles.label}>
          <UserRound className={styles.icon} />
          {t('name')}
        </label>
        <Input
          placeholder={t('namePlaceholder')}
          value={values.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          className={styles.input}
          required
        />
        {errors.name ? <p className={styles.error}>{errors.name}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <UserRound className={styles.icon} />
          {t('nickname')}
        </label>
        <Input
          placeholder={t('nicknamePlaceholder')}
          value={values.nickname}
          onChange={(e) => onFieldChange('nickname', e.target.value)}
          className={styles.input}
        />
        {errors.nickname ? <p className={styles.error}>{errors.nickname}</p> : null}
      </div>
    </>
  );
}
