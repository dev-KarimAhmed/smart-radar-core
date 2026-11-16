'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/shared/components/ui/app-select';
import { colorNameToHex, hexToColorName } from '@/shared/services/color-name';
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

export function ColorAndPlateFields({ vehicle, errors, onFieldChange, isArabic }: Omit<FieldProps, 'country'>) {
  const t = useTranslations('captainOnboarding.vehicle');
  const [colorSwatch, setColorSwatch] = React.useState('#14b8a6');

  React.useEffect(() => {
    if (!vehicle.color || vehicle.color.startsWith('#')) {
      onFieldChange('color', hexToColorName(colorSwatch, isArabic ? 'ar' : 'en'));
    } else {
      const hex = colorNameToHex(vehicle.color);
      if (hex) setColorSwatch(hex);
    }
  }, [vehicle.color, isArabic]);

  return (
    <div className={styles.fieldRow}>
      <div>
        <label className={styles.label}>{t('color')}</label>
        <div className={styles.colorRow}>
          <input
            type="color"
            value={colorSwatch}
            onChange={(event) => {
              setColorSwatch(event.target.value);
              onFieldChange('color', hexToColorName(event.target.value, isArabic ? 'ar' : 'en'));
            }}
            className={styles.colorSwatch}
          />
          <input
            type="text"
            name="color"
            data-field="color"
            value={vehicle.color || ''}
            readOnly
            className={styles.input}
            placeholder={t('colorPlaceholder')}
            required
          />
        </div>
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

export function SharedVehicleFields({ vehicle, errors, onFieldChange, country }: Omit<FieldProps, 'isArabic'>) {
  const t = useTranslations('captainOnboarding.vehicle');
  const isJordan = !country || country.toUpperCase() === 'JO' || country === '1' || country.toUpperCase() === 'JORDAN';

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

      <div className={styles.fieldRow}>
        <div>
          <label className={styles.label}>{t('nationalIdNumberLabel')}</label>
          <Input
            name="nationalIdNumber"
            data-field="nationalIdNumber"
            dir="ltr"
            inputMode={isJordan ? 'numeric' : 'text'}
            maxLength={isJordan ? 10 : 20}
            placeholder={t('nationalIdNumberPlaceholder')}
            value={vehicle.nationalIdNumber}
            onChange={(event) =>
              onFieldChange(
                'nationalIdNumber',
                isJordan ? event.target.value.replace(/[^0-9]/g, '') : event.target.value.replace(/[^A-Za-z0-9؀-ۿ]/g, '')
              )
            }
            className={styles.input}
            required
          />
          {errors.nationalIdNumber ? <p className={styles.error}>{errors.nationalIdNumber}</p> : null}
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
