'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import {
  getCaptainIndependentVehicleSchema,
  getCaptainSmartAppVehicleSchema,
  getCaptainTaxiVehicleSchema,
} from '../../lib/captain-registration-schema';
import { validateYupField, isYupSchemaValid, collectYupSchemaErrors } from '../../lib/validate-field';
import {
  styles,
  type CaptainVehicleStepProps,
  type CaptainVehicleValues,
} from './vehicle-step/vehicle-step-types';
import { TaxiVehicleFields } from './vehicle-step/taxi-vehicle-fields';
import { SmartAppVehicleFields } from './vehicle-step/smart-app-vehicle-fields';
import {
  VehicleIdentityFields,
  ColorAndPlateFields,
  SharedVehicleFields,
} from './vehicle-step/common-vehicle-fields';

export type {
  CaptainTaxiVehicleValues,
  CaptainSmartAppVehicleValues,
  CaptainIndependentVehicleValues,
  CaptainVehicleValues,
  CaptainVehicleStepProps,
} from './vehicle-step/vehicle-step-types';
export { styles as captainVehicleStepStyles } from './vehicle-step/vehicle-step-types';

export function CaptainVehicleStep({
  affiliation,
  vehicle,
  setVehicle,
  serverErrors,
  onBack,
  onSubmit,
  isSubmitting = false,
  country,
}: CaptainVehicleStepProps) {
  const t = useTranslations('captainOnboarding.vehicle');
  const tv = useTranslations('captainOnboarding.validation');
  const { isArabic } = useDashboardLanguage();
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      setErrors((current) => ({ ...current, ...serverErrors }));
    }
  }, [serverErrors]);

  const isTaxi = affiliation === 'office-taxi';
  const isIndependent = affiliation === 'independent';
  const schema = React.useMemo(() => {
    if (isTaxi) {
      return getCaptainTaxiVehicleSchema(tv, country);
    }
    if (isIndependent) {
      return getCaptainIndependentVehicleSchema(tv, country);
    }
    return getCaptainSmartAppVehicleSchema(tv, country);
  }, [isTaxi, isIndependent, tv, country]);

  const runFieldValidation = React.useCallback(
    async (field: string, nextValues: CaptainVehicleValues) => {
      const message = await validateYupField(schema, nextValues, field);
      setErrors((current) => ({ ...current, [field]: message }));
    },
    [schema]
  );

  const handleFieldChange = (field: keyof CaptainVehicleValues, value: string) => {
    const nextValues = { ...vehicle, [field]: value };
    setVehicle(nextValues);
    setErrors((current) => {
      if (!current[field]) return current;
      const copy = { ...current };
      delete copy[field];
      return copy;
    });
    void runFieldValidation(field, nextValues);
  };

  const isValid = isYupSchemaValid(schema, vehicle);

  const handleSubmitClick = () => {
    if (isSubmitting) return;
    if (isValid) {
      onSubmit();
      return;
    }
    setErrors(collectYupSchemaErrors(schema, vehicle));
  };

  const renderVehicleIdentityFields = () => (
    <VehicleIdentityFields vehicle={vehicle} errors={errors} onFieldChange={handleFieldChange} />
  );

  const renderColorAndPlateFields = () => (
    <ColorAndPlateFields
      vehicle={vehicle}
      errors={errors}
      onFieldChange={handleFieldChange}
      isArabic={isArabic}
    />
  );

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      {isTaxi ? (
        <TaxiVehicleFields
          vehicle={vehicle}
          errors={errors}
          country={country}
          onFieldChange={handleFieldChange}
          renderVehicleIdentityFields={renderVehicleIdentityFields}
        />
      ) : isIndependent ? (
        <>
          {renderVehicleIdentityFields()}
          {renderColorAndPlateFields()}
        </>
      ) : (
        <SmartAppVehicleFields
          vehicle={vehicle}
          errors={errors}
          onFieldChange={handleFieldChange}
          renderVehicleIdentityFields={renderVehicleIdentityFields}
          renderColorAndPlateFields={renderColorAndPlateFields}
        />
      )}

      <SharedVehicleFields vehicle={vehicle} errors={errors} onFieldChange={handleFieldChange} />

      <div className={styles.submitWrap}>
        <button
          type="button"
          onClick={handleSubmitClick}
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </div>

      <button type="button" className={styles.backButton} onClick={onBack}>
        {t('back')}
      </button>
    </div>
  );
}
