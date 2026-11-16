'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { normalizePhoneForCountry } from '@/features/auth/utils/registration-helpers';
import { styles, type CaptainVehicleValues } from './vehicle-step-types';

interface TaxiVehicleFieldsProps {
  vehicle: CaptainVehicleValues;
  errors: Record<string, string>;
  country?: string;
  onFieldChange: (field: keyof CaptainVehicleValues, value: string) => void;
  renderVehicleIdentityFields: () => React.ReactNode;
}

export function TaxiVehicleFields({
  vehicle,
  errors,
  country,
  onFieldChange,
  renderVehicleIdentityFields,
}: TaxiVehicleFieldsProps) {
  const t = useTranslations('captainOnboarding.vehicle');

  const officePhoneValidation = React.useMemo(() => {
    const val = vehicle.officePhone?.trim();
    if (!val) return { ok: false, message: '' };
    return normalizePhoneForCountry(val, country);
  }, [vehicle.officePhone, country]);
  const isOfficePhoneValid = officePhoneValidation.ok;

  return (
    <>
      <div>
        <label className={styles.label}>{t('officeName')}</label>
        <Input
          name="officeName"
          data-field="officeName"
          placeholder={t('officeName')}
          value={vehicle.officeName}
          onChange={(event) => onFieldChange('officeName', event.target.value)}
          className={styles.input}
          required
        />
        {errors.officeName ? <p className={styles.error}>{errors.officeName}</p> : null}
      </div>

      <div>
        <label className={styles.label}>{t('officePhone')}</label>
        <div className="relative">
          <Input
            name="officePhone"
            data-field="officePhone"
            type="tel"
            dir="ltr"
            placeholder={t('officePhone')}
            value={vehicle.officePhone}
            onChange={(event) => onFieldChange('officePhone', event.target.value)}
            className={cn(
              styles.input,
              isOfficePhoneValid && '!border-emerald-500/70 focus:!border-emerald-500 ring-1 ring-emerald-500/20',
              !isOfficePhoneValid && vehicle.officePhone?.trim() && '!border-amber-500/60 focus:!border-amber-500'
            )}
            required
          />
          {isOfficePhoneValid ? (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>
          ) : null}
        </div>
        {!isOfficePhoneValid && (vehicle.officePhone?.trim() || errors.officePhone) ? (
          <p className={cn(styles.error, 'text-amber-400/90 font-medium')}>
            {errors.officePhone || officePhoneValidation.message || t('phoneInvalid')}
          </p>
        ) : null}
      </div>

      {renderVehicleIdentityFields()}

      <div className={styles.fieldRow}>
        <div>
          <label className={styles.label}>{t('sideId')}</label>
          <Input
            name="sideId"
            data-field="sideId"
            placeholder={t('sideId')}
            value={vehicle.sideId}
            onChange={(event) => onFieldChange('sideId', event.target.value)}
            className={styles.input}
            required
          />
          {errors.sideId ? <p className={styles.error}>{errors.sideId}</p> : null}
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
    </>
  );
}
