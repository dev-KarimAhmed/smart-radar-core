'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check, Mail, MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/shared/components/ui/app-select';
import { cn } from '@/lib/utils';
import { styles, type CaptainPersonalValues } from './personal-step-types';

interface PersonalContactFieldsProps {
  values: CaptainPersonalValues;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isArabic: boolean;
  countryOptions: { value: string; label: string }[];
  countriesLoading: boolean;
  phoneValidation: { ok: boolean; message: string };
  onCountryChange: (id: string) => void;
  onFieldChange: (field: keyof CaptainPersonalValues, value: string) => void;
  checkPhoneUniqueness: (phone: string) => Promise<boolean>;
  checkEmailUniqueness: (email: string) => Promise<boolean>;
}

export function PersonalContactFields({
  values,
  errors,
  setErrors,
  isArabic,
  countryOptions,
  countriesLoading,
  phoneValidation,
  onCountryChange,
  onFieldChange,
  checkPhoneUniqueness,
  checkEmailUniqueness,
}: PersonalContactFieldsProps) {
  const t = useTranslations('captainOnboarding.personal');
  const isPhoneValid = phoneValidation.ok;

  return (
    <>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>
            <MapPin className={styles.icon} />
            {t('country')}
          </label>
          <AppSelect
            value={values.country}
            onValueChange={onCountryChange}
            options={countryOptions}
            placeholder={countriesLoading && !countryOptions.length ? t('loading') : t('countryPlaceholder')}
            disabled={countriesLoading && !countryOptions.length}
          />
          {errors.country ? <p className={styles.error}>{errors.country}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <Phone className={styles.icon} />
            {t('phone')}
          </label>
          <div className="relative">
            <Input
              type="tel"
              dir="ltr"
              placeholder={t('phonePlaceholder')}
              value={values.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              onBlur={() => {
                if (values.phone?.trim()) {
                  void checkPhoneUniqueness(values.phone);
                }
              }}
              className={cn(
                styles.input,
                isPhoneValid && '!border-emerald-500/70 focus:!border-emerald-500 ring-1 ring-emerald-500/20',
                !isPhoneValid && values.phone?.trim() && '!border-amber-500/60 focus:!border-amber-500'
              )}
              required
            />
            {isPhoneValid ? (
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
                <Check className="h-4 w-4 stroke-[2.5]" />
              </span>
            ) : null}
          </div>
          {!isPhoneValid ? (
            <p className={cn(styles.hint, values.phone?.trim() && 'text-amber-400/90 font-medium')}>
              {phoneValidation.message || errors.phone || t('phoneHint')}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <Mail className={styles.icon} />
          {t('email')}
        </label>
        <Input
          type="email"
          dir="ltr"
          inputMode="email"
          placeholder={t('emailPlaceholder')}
          value={values.email}
          onChange={(e) => {
            const val = e.target.value;
            onFieldChange('email', val);
            const clean = val.trim();
            if (!clean) {
              setErrors((curr) => ({
                ...curr,
                email: isArabic ? 'البريد الإلكتروني مطلوب لتفعيل الحساب' : 'Email is required',
              }));
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
              setErrors((curr) => ({
                ...curr,
                email: isArabic
                  ? 'يرجى إدخال بريد إلكتروني صحيح (مثل: name@example.com)'
                  : 'Please enter a valid email address',
              }));
            } else {
              setErrors((curr) => {
                const next = { ...curr };
                delete next.email;
                return next;
              });
            }
          }}
          onBlur={() => {
            if (values.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
              void checkEmailUniqueness(values.email);
            }
          }}
          className={cn(
            styles.input,
            errors.email
              ? '!border-rose-500/70 focus:!border-rose-500'
              : values.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
              ? '!border-emerald-500/70 focus:!border-emerald-500'
              : ''
          )}
          required
        />
        {errors.email ? (
          <p className={styles.error}>{errors.email}</p>
        ) : values.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? (
          <p className="text-emerald-400 mt-1 font-bold text-[10px] animate-in fade-in duration-150 flex items-center gap-1">
            <Check className="h-3 w-3 inline stroke-[2.5]" />
            <span>{isArabic ? 'صيغة البريد الإلكتروني صحيحة' : 'Valid email format'}</span>
          </p>
        ) : null}
      </div>
    </>
  );
}
