'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { AppSelect } from '@/shared/components/ui/app-select';
import { styles, type CaptainPersonalValues } from './personal-step-types';

interface PersonalGeoFieldsProps {
  values: CaptainPersonalValues;
  errors: Record<string, string>;
  countryOptions: { value: string; label: string }[];
  countriesLoading: boolean;
  governorateOptions: { value: string; label: string }[];
  governoratesLoading: boolean;
  districtOptions: { value: string; label: string }[];
  districtsLoading: boolean;
  onCountryChange: (id: string) => void;
  onFieldChange: (field: keyof CaptainPersonalValues, value: string) => void;
}

export function PersonalGeoFields({
  values,
  errors,
  countryOptions,
  countriesLoading,
  governorateOptions,
  governoratesLoading,
  districtOptions,
  districtsLoading,
  onCountryChange,
  onFieldChange,
}: PersonalGeoFieldsProps) {
  const t = useTranslations('captainOnboarding.personal');

  return (
    <>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>
            <MapPin className={styles.icon} />
            {t('governorate')}
          </label>
          <AppSelect
            value={values.governorate}
            onValueChange={(value) => onFieldChange('governorate', value)}
            options={governorateOptions}
            placeholder={
              !values.country
                ? t('countryPlaceholder')
                : governoratesLoading && !governorateOptions.length
                ? t('loading')
                : t('governoratePlaceholder')
            }
            disabled={!values.country || (governoratesLoading && !governorateOptions.length)}
          />
          {errors.governorate ? <p className={styles.error}>{errors.governorate}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <MapPin className={styles.icon} />
            {t('district')}
          </label>
          <AppSelect
            value={values.district}
            onValueChange={(value) => onFieldChange('district', value)}
            options={districtOptions}
            placeholder={
              !values.governorate
                ? t('districtPlaceholderDisabled')
                : districtsLoading && !districtOptions.length
                ? t('loading')
                : t('districtPlaceholder')
            }
            disabled={!values.governorate || (districtsLoading && !districtOptions.length)}
          />
          {errors.district ? <p className={styles.error}>{errors.district}</p> : null}
        </div>
      </div>
    </>
  );
}
