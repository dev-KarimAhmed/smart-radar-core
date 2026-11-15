'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { styles, type CaptainPersonalValues } from './personal-step-types';

interface PersonalSecurityFieldsProps {
  values: CaptainPersonalValues;
  errors: Record<string, string>;
  isArabic: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  rememberMe: boolean;
  onRememberMeChange: (remember: boolean) => void;
  isCheckingAvailability: boolean;
  onFieldChange: (field: keyof CaptainPersonalValues, value: string) => void;
  onContinue: () => void;
}

export function PersonalSecurityFields({
  values,
  errors,
  isArabic,
  showPassword,
  setShowPassword,
  rememberMe,
  onRememberMeChange,
  isCheckingAvailability,
  onFieldChange,
  onContinue,
}: PersonalSecurityFieldsProps) {
  const t = useTranslations('captainOnboarding.personal');

  return (
    <>
      <div className={styles.field}>
        <label className={styles.label}>
          <Lock className={styles.icon} />
          {t('password')}
        </label>
        <div className={styles.passwordWrap}>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('passwordPlaceholder')}
            value={values.password}
            onChange={(e) => onFieldChange('password', e.target.value)}
            className={styles.input}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className={`${styles.eyeButton} ${isArabic ? 'left-2' : 'right-2'}`}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
          </button>
        </div>
        {errors.password ? <p className={styles.error}>{errors.password}</p> : null}
      </div>

      <label className={styles.rememberRow}>
        <span className={styles.rememberText}>
          <span className={styles.rememberLabel}>{t('rememberMe')}</span>
          <span className={styles.rememberHint}>{t('rememberHint')}</span>
        </span>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => onRememberMeChange(e.target.checked)}
          className={styles.checkbox}
        />
      </label>

      <button
        type="button"
        onClick={onContinue}
        disabled={isCheckingAvailability}
        className={styles.continueButton}
      >
        {isCheckingAvailability ? '...' : t('continue')}
      </button>
    </>
  );
}
