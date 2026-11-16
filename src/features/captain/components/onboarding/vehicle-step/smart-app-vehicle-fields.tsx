'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { styles, type CaptainVehicleValues } from './vehicle-step-types';

interface SmartAppVehicleFieldsProps {
  vehicle: CaptainVehicleValues;
  errors: Record<string, string>;
  onFieldChange: (field: keyof CaptainVehicleValues, value: string) => void;
  renderVehicleIdentityFields: () => React.ReactNode;
  renderColorAndPlateFields: () => React.ReactNode;
}

export function SmartAppVehicleFields({
  vehicle,
  errors,
  onFieldChange,
  renderVehicleIdentityFields,
  renderColorAndPlateFields,
}: SmartAppVehicleFieldsProps) {
  const t = useTranslations('captainOnboarding.vehicle');

  return (
    <>
      <div>
        <label className={styles.label}>{t('companyName')}</label>
        <Input
          name="companyName"
          data-field="companyName"
          placeholder={t('companyName')}
          value={vehicle.companyName}
          onChange={(event) => onFieldChange('companyName', event.target.value)}
          className={styles.input}
          required
        />
        {errors.companyName ? <p className={styles.error}>{errors.companyName}</p> : null}
      </div>

      <div>
        <label className={styles.label}>{t('companyCode')}</label>
        <Input
          name="companyCode"
          data-field="companyCode"
          placeholder={t('companyCodePlaceholder')}
          value={vehicle.companyCode}
          onChange={(event) => onFieldChange('companyCode', event.target.value)}
          className={styles.input}
          required
        />
        <p className={styles.helper}>{t('companyCodeHelper')}</p>
        {errors.companyCode ? <p className={styles.error}>{errors.companyCode}</p> : null}
      </div>

      {renderVehicleIdentityFields()}
      {renderColorAndPlateFields()}
    </>
  );
}
