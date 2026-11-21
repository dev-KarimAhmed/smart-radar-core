'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/shared/components/ui/app-select';
import { VEHICLE_YEAR_MAX, VEHICLE_YEAR_MIN } from '../../../lib/captain-registration-schema';
import { styles, type CaptainVehicleValues } from './vehicle-step-types';

interface FieldProps {
  vehicle: CaptainVehicleValues;
  errors: Record<string, string>;
  onFieldChange: (field: keyof CaptainVehicleValues, value: string) => void;
  isArabic: boolean;
  country?: string;
}

export function VehicleIdentityFields({ vehicle, errors, onFieldChange }: Omit<FieldProps, 'isArabic' | 'country'>) {
  const t = useTranslations('captainOnboarding.vehicle');

  return (
    <div className={styles.fieldRow}>
      <div>
        <label className={styles.label}>{t('make')}</label>
        <Input
          name="make"
          data-field="make"
          placeholder={t('makePlaceholder')}
          value={vehicle.make}
          onChange={(event) => onFieldChange('make', event.target.value)}
          className={styles.input}
          required
        />
        {errors.make ? <p className={styles.error}>{errors.make}</p> : null}
      </div>
      <div>
        <label className={styles.label}>{t('model')}</label>
        <Input
          name="model"
          data-field="model"
          placeholder={t('modelPlaceholder')}
          value={vehicle.model}
          onChange={(event) => onFieldChange('model', event.target.value)}
          className={styles.input}
          required
        />
        {errors.model ? <p className={styles.error}>{errors.model}</p> : null}
      </div>
    </div>
  );
}

export function ColorAndPlateFields({ vehicle, errors, onFieldChange }: Omit<FieldProps, 'country' | 'isArabic'> & { isArabic?: boolean }) {
  const t = useTranslations('captainOnboarding.vehicle');

  return (
    <div className={styles.fieldRow}>
      <div>
        <label className={styles.label}>{t('color')}</label>
        <Input
          name="color"
          data-field="color"
          value={vehicle.color || ''}
          onChange={(event) => onFieldChange('color', event.target.value)}
          className={styles.input}
          placeholder={t('colorPlaceholder')}
          required
        />
        {errors.color ? <p className={styles.error}>{errors.color}</p> : null}
      </div>
      <div>
        <label className={styles.label}>{t('plate')}</label>
        <Input
          name="plate"
          data-field="plate"
          placeholder={t('platePlaceholder')}
          value={vehicle.plate}
          onChange={(event) => onFieldChange('plate', event.target.value)}
          className={styles.input}
          required
        />
        {errors.plate ? <p className={styles.error}>{errors.plate}</p> : null}
      </div>
    </div>
  );
}

export function SharedVehicleFields({ vehicle, errors, onFieldChange }: Omit<FieldProps, 'isArabic'>) {
  const t = useTranslations('captainOnboarding.vehicle');

  const yearOptions = React.useMemo(
    () =>
      Array.from({ length: VEHICLE_YEAR_MAX - VEHICLE_YEAR_MIN + 1 }, (_, index) => {
        const year = String(VEHICLE_YEAR_MAX - index);
        return { value: year, label: year };
      }),
    []
  );

  return (
    <>
      <div className={styles.fieldRow}>
        <div data-field="year">
          <label className={styles.label}>{t('year')}</label>
          <AppSelect
            value={vehicle.year}
            onValueChange={(value) => onFieldChange('year', value)}
            options={yearOptions}
            placeholder={t('yearPlaceholder')}
            className={styles.input}
          />
          {errors.year ? <p className={styles.error}>{errors.year}</p> : null}
        </div>
        <div>
          <label className={styles.label}>{t('licenseNumberLabel')}</label>
          <Input
            name="licenseNumber"
            data-field="licenseNumber"
            dir="ltr"
            placeholder={t('licenseNumberPlaceholder')}
            value={vehicle.licenseNumber}
            onChange={(event) => onFieldChange('licenseNumber', event.target.value)}
            className={styles.input}
            required
          />
          {errors.licenseNumber ? <p className={styles.error}>{errors.licenseNumber}</p> : null}
        </div>
      </div>

      <div>
        <label className={styles.label}>{t('facebookLabel')}</label>
        <Input
          name="facebookUrl"
          data-field="facebookUrl"
          type="url"
          dir="ltr"
          placeholder={t('facebookPlaceholder')}
          value={vehicle.facebookUrl}
          onChange={(event) => onFieldChange('facebookUrl', event.target.value)}
          className={styles.input}
        />
        {errors.facebookUrl ? <p className={styles.error}>{errors.facebookUrl}</p> : null}
      </div>

      <div>
        <label className={styles.label}>{t('instagramLabel')}</label>
        <Input
          name="instagramUrl"
          data-field="instagramUrl"
          type="url"
          dir="ltr"
          placeholder={t('instagramPlaceholder')}
          value={vehicle.instagramUrl}
          onChange={(event) => onFieldChange('instagramUrl', event.target.value)}
          className={styles.input}
        />
        {errors.instagramUrl ? <p className={styles.error}>{errors.instagramUrl}</p> : null}
      </div>
    </>
  );
}
