'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '../../hooks/use-registration';
import { normalizePhoneForCountry } from '../../utils/registration-helpers';
import { useTranslations } from "next-intl";
import { styles } from './vehicle-step.styles';
import { VehicleTaxiFields } from './vehicle-taxi-fields';
import { VehicleAppFields } from './vehicle-app-fields';
import { VehicleDocUpload } from './vehicle-doc-upload';

export function VehicleStep() {
  const tAuto = useTranslations('auto');
  const {
    affiliation,
    vehicle,
    setVehicle,
    handleVehicleSubmit,
    isSubmitting,
    setStep,
    personal,
    setPersonal,
    selectedCountry,
    fillCaptainRegistrationData,
  } = useRegistration();
  const [compressing, setCompressing] = React.useState(false);
  const isTaxi = affiliation === 'office-taxi';

  const officePhoneValidation = React.useMemo(() => {
    const val = vehicle.officePhone?.trim();
    if (!val) return { ok: false, message: tAuto('key_d9162751') };
    return normalizePhoneForCountry(val, selectedCountry, tAuto);
  }, [vehicle.officePhone, selectedCountry, tAuto]);
  const isOfficePhoneValid = officePhoneValidation.ok;

  return (
    <form onSubmit={handleVehicleSubmit} className={styles.style72_1} dir="rtl">
      <div className={styles.style74_2}>
        <Button
          type="button"
          onClick={fillCaptainRegistrationData}
          className={styles.style78_3}
        >
          {tAuto('key_f06c06a0')}
        </Button>
        <p className={styles.style82_4}>
          {tAuto('key_1e9d34e7')}
        </p>
      </div>

      {isTaxi ? (
        <VehicleTaxiFields
          vehicle={vehicle}
          setVehicle={setVehicle}
          isOfficePhoneValid={isOfficePhoneValid}
          officePhoneValidationMessage={officePhoneValidation.message}
          tAuto={tAuto}
        />
      ) : (
        <VehicleAppFields
          vehicle={vehicle}
          setVehicle={setVehicle}
          tAuto={tAuto}
        />
      )}

      {/* 📥 [معمارية SC55 - وثيقة التحقق المهنية للناقل] */}
      <VehicleDocUpload
        verificationDoc={personal.verificationDoc}
        onDocUploaded={(doc) => setPersonal({ ...personal, verificationDoc: doc })}
        compressing={compressing}
        setCompressing={setCompressing}
        tAuto={tAuto}
      />

      <div className={styles.style257_39}>
        <button
          type="submit"
          className={styles.style260_40}
          disabled={isSubmitting || compressing}
        >
          {isSubmitting ? tAuto('key_9e20ee28') : tAuto('key_210d395b')}
        </button>
      </div>

      <button
        type="button"
        className={styles.style269_41}
        onClick={() => setStep('affiliation')}
      >
        {tAuto('key_16c42f71')}
      </button>
    </form>
  );
}
