'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/shared/components/ui/app-select';
import type { AffiliationType } from '@/core/types';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import {
  getCaptainSmartAppVehicleSchema,
  getCaptainTaxiVehicleSchema,
  VEHICLE_YEAR_MAX,
  VEHICLE_YEAR_MIN,
} from '../../lib/captain-registration-schema';
import { validateYupField, isYupSchemaValid, collectYupSchemaErrors } from '../../lib/validate-field';
import { colorNameToHex, hexToColorName } from '@/shared/services/color-name';

export interface CaptainTaxiVehicleValues {
  officeName: string;
  officePhone: string;
  sideId: string;
  make: string;
  model: string;
  plate: string;
  year: string;
  nationalIdNumber: string;
  licenseNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}

export interface CaptainSmartAppVehicleValues {
  companyName: string;
  make: string;
  model: string;
  color: string;
  plate: string;
  year: string;
  nationalIdNumber: string;
  licenseNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}

export type CaptainVehicleValues = CaptainTaxiVehicleValues & CaptainSmartAppVehicleValues;

const styles = {
  root: 'space-y-4  animate-fade-in',
  fieldRow: 'grid grid-cols-2 gap-2',
  label: 'block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 ',
  input:
    'w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ',
  colorRow: 'flex items-center gap-2',
  colorSwatch: 'h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-[#243249] bg-[#0B0F19] p-1',
  error: 'text-[10px] font-bold text-rose-400 mt-1',
  documentBlock: 'p-3 rounded-xl bg-[#0B0F19] border border-[#14B8A6]/20  space-y-2',
  documentLabel: 'text-[10px] sm:text-[11px] font-black text-[#14B8A6] block',
  documentDropzone:
    'relative border border-dashed border-[#14B8A6]/35 rounded-lg p-3 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-all cursor-pointer min-h-16',
  documentInput: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
  documentDoneRow: 'flex items-center gap-2 max-w-full',
  documentDoneText: 'text-[10px] text-emerald-400 font-bold truncate',
  documentEmptyWrap: 'flex flex-col items-center',
  documentEmptyText: 'text-[9px] text-[#94A3B8]/80 leading-normal text-center font-medium',
  documentHint: 'text-[8px] text-[#14B8A6]/60 block font-mono',
  documentDoneCheck: 'text-emerald-400',
  submitWrap: 'pt-2',
  submitButton:
    'w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-[#0B0F19] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer',
  backButton: 'w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer',
} as const;

interface CaptainVehicleStepProps {
  affiliation: AffiliationType | null;
  vehicle: CaptainVehicleValues;
  setVehicle: (vehicle: CaptainVehicleValues) => void;
  // Document image uploads are disabled for now — replaced by the plain-text
  // national ID / license number fields below. Re-enabling image upload later
  // just means uncommenting these props + the picker calls further down.
  // identityFile: File | null;
  // onIdentityFileChange: (file: File | null) => void;
  // drivingLicenseFile: File | null;
  // onDrivingLicenseFileChange: (file: File | null) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  country?: string;
}

export function CaptainVehicleStep({
  affiliation,
  vehicle,
  setVehicle,
  // identityFile,
  // onIdentityFileChange,
  // drivingLicenseFile,
  // onDrivingLicenseFileChange,
  onBack,
  onSubmit,
  isSubmitting = false,
  country,
}: CaptainVehicleStepProps) {
  const t = useTranslations('captainOnboarding.vehicle');
  const tv = useTranslations('captainOnboarding.validation');
  const { isArabic } = useDashboardLanguage();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [colorSwatch, setColorSwatch] = React.useState('#14b8a6');

  // Keeps the swatch showing the color that matches the stored name (e.g.
  // navigating back to this step) instead of sitting at an unrelated default.
  React.useEffect(() => {
    const hex = colorNameToHex(vehicle.color);
    if (hex) setColorSwatch(hex);
  }, [vehicle.color]);

  const isTaxi = affiliation === 'office-taxi';
  const schema = React.useMemo(
    () => (isTaxi ? getCaptainTaxiVehicleSchema(tv, country) : getCaptainSmartAppVehicleSchema(tv)),
    [isTaxi, tv, country],
  );
  const yearOptions = React.useMemo(
    () => Array.from({ length: VEHICLE_YEAR_MAX - VEHICLE_YEAR_MIN + 1 }, (_, index) => {
      const year = String(VEHICLE_YEAR_MAX - index);
      return { value: year, label: year };
    }),
    [],
  );

  const runFieldValidation = React.useCallback(
    async (field: string, nextValues: CaptainVehicleValues) => {
      const message = await validateYupField(schema, nextValues, field);
      setErrors((current) => ({ ...current, [field]: message }));
    },
    [schema],
  );

  const handleFieldChange = (field: keyof CaptainVehicleValues, value: string) => {
    const nextValues = { ...vehicle, [field]: value };
    setVehicle(nextValues);
    void runFieldValidation(field, nextValues);
  };

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, onChange: (file: File | null) => void) => {
  //   const file = event.target.files?.[0] || null;
  //   onChange(file);
  //   if (file && typeof navigator !== 'undefined' && navigator.vibrate) {
  //     navigator.vibrate([50, 30, 50]);
  //   }
  // };

  const isValid = isYupSchemaValid(schema, vehicle);

  const handleSubmitClick = () => {
    if (isSubmitting) return;
    if (isValid) {
      onSubmit();
      return;
    }
    // Surface every unfilled/invalid field at once, not just the ones the
    // user has already interacted with, so it's obvious why submit won't proceed.
    setErrors(collectYupSchemaErrors(schema, vehicle));
  };

  const renderYearSelect = () => (
    <AppSelect
      value={vehicle.year}
      onValueChange={(value) => handleFieldChange('year', value)}
      options={yearOptions}
      placeholder={t('yearPlaceholder')}
      className={styles.input}
    />
  );

  // Document image upload is disabled for now (see CaptainVehicleStepProps note above).
  // const renderDocumentPicker = ({
  //   label,
  //   file,
  //   emptyText,
  //   onChange,
  // }: {
  //   label: string;
  //   file: File | null;
  //   emptyText: string;
  //   onChange: (file: File | null) => void;
  // }) => (
  //   <div className={styles.documentBlock}>
  //     <label className={styles.documentLabel}>{label}</label>
  //     <div className={styles.documentDropzone}>
  //       <input
  //         type="file"
  //         accept="image/*,.pdf"
  //         onChange={(event) => handleFileChange(event, onChange)}
  //         className={styles.documentInput}
  //       />
  //       {file ? (
  //         <div className={styles.documentDoneRow}>
  //           <span className={styles.documentDoneText}>{file.name}</span>
  //           <span aria-hidden="true" className={styles.documentDoneCheck}>✓</span>
  //         </div>
  //       ) : (
  //         <div className={styles.documentEmptyWrap}>
  //           <span className={styles.documentEmptyText}>{emptyText}</span>
  //           <span className={styles.documentHint}>{t('fileSelect')}</span>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );

  const renderVehicleIdentityFields = () => (
    <div className={styles.fieldRow}>
      <div>
        <label className={styles.label}>{t('make')}</label>
        <Input
          placeholder={t('makePlaceholder')}
          value={vehicle.make}
          onChange={(event) => handleFieldChange('make', event.target.value)}
          className={styles.input}
          required
        />
        {errors.make ? <p className={styles.error}>{errors.make}</p> : null}
      </div>
      <div>
        <label className={styles.label}>{t('model')}</label>
        <Input
          placeholder={t('modelPlaceholder')}
          value={vehicle.model}
          onChange={(event) => handleFieldChange('model', event.target.value)}
          className={styles.input}
          required
        />
        {errors.model ? <p className={styles.error}>{errors.model}</p> : null}
      </div>
    </div>
  );

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      {isTaxi ? (
        <>
          <div>
            <label className={styles.label}>{t('officeName')}</label>
            <Input
              placeholder={t('officeName')}
              value={vehicle.officeName}
              onChange={(event) => handleFieldChange('officeName', event.target.value)}
              className={styles.input}
              required
            />
            {errors.officeName ? <p className={styles.error}>{errors.officeName}</p> : null}
          </div>
          <div>
            <label className={styles.label}>{t('officePhone')}</label>
            <Input
              type="tel"
              dir="ltr"
              placeholder={t('officePhone')}
              value={vehicle.officePhone}
              onChange={(event) => handleFieldChange('officePhone', event.target.value)}
              className={styles.input}
              required
            />
            {errors.officePhone ? <p className={styles.error}>{errors.officePhone}</p> : null}
          </div>
          {renderVehicleIdentityFields()}
          <div className={styles.fieldRow}>
            <div>
              <label className={styles.label}>{t('sideId')}</label>
              <Input
                placeholder={t('sideId')}
                value={vehicle.sideId}
                onChange={(event) => handleFieldChange('sideId', event.target.value)}
                className={styles.input}
                required
              />
              {errors.sideId ? <p className={styles.error}>{errors.sideId}</p> : null}
            </div>
            <div>
              <label className={styles.label}>{t('plate')}</label>
              <Input
                placeholder={t('platePlaceholder')}
                value={vehicle.plate}
                onChange={(event) => handleFieldChange('plate', event.target.value)}
                className={styles.input}
                required
              />
              {errors.plate ? <p className={styles.error}>{errors.plate}</p> : null}
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className={styles.label}>{t('companyName')}</label>
            <Input
              placeholder={t('companyName')}
              value={vehicle.companyName}
              onChange={(event) => handleFieldChange('companyName', event.target.value)}
              className={styles.input}
              required
            />
            {errors.companyName ? <p className={styles.error}>{errors.companyName}</p> : null}
          </div>
          {renderVehicleIdentityFields()}
          <div className={styles.fieldRow}>
            <div>
              <label className={styles.label}>{t('color')}</label>
              <div className={styles.colorRow}>
                <input
                  type="color"
                  value={colorSwatch}
                  onChange={(event) => {
                    setColorSwatch(event.target.value);
                    handleFieldChange('color', hexToColorName(event.target.value, isArabic ? 'ar' : 'en'));
                  }}
                  className={styles.colorSwatch}
                />
                <input
                  type="text"
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
                placeholder={t('platePlaceholder')}
                value={vehicle.plate}
                onChange={(event) => handleFieldChange('plate', event.target.value)}
                className={styles.input}
                required
              />
              {errors.plate ? <p className={styles.error}>{errors.plate}</p> : null}
            </div>
          </div>
        </>
      )}

      <div>
        <label className={styles.label}>{t('year')}</label>
        {renderYearSelect()}
        {errors.year ? <p className={styles.error}>{errors.year}</p> : null}
      </div>
      {/* {renderDocumentPicker({
        label: t('identityLabel'),
        file: identityFile,
        emptyText: t('identityEmpty'),
        onChange: onIdentityFileChange,
      })}
      {renderDocumentPicker({
        label: t('licenseRequiredLabel'),
        file: drivingLicenseFile,
        emptyText: t('licenseEmpty'),
        onChange: onDrivingLicenseFileChange,
      })}
      {!identityFile || !drivingLicenseFile ? <p className={styles.error}>{t('documentRequired')}</p> : null} */}

      <div className={styles.fieldRow}>
        <div>
          <label className={styles.label}>{t('nationalIdNumberLabel')}</label>
          <Input
            dir="ltr"
            placeholder={t('nationalIdNumberPlaceholder')}
            value={vehicle.nationalIdNumber}
            onChange={(event) => handleFieldChange('nationalIdNumber', event.target.value)}
            className={styles.input}
            required
          />
          {errors.nationalIdNumber ? <p className={styles.error}>{errors.nationalIdNumber}</p> : null}
        </div>
        <div>
          <label className={styles.label}>{t('licenseNumberLabel')}</label>
          <Input
            dir="ltr"
            placeholder={t('licenseNumberPlaceholder')}
            value={vehicle.licenseNumber}
            onChange={(event) => handleFieldChange('licenseNumber', event.target.value)}
            className={styles.input}
            required
          />
          {errors.licenseNumber ? <p className={styles.error}>{errors.licenseNumber}</p> : null}
        </div>
      </div>

      <div>
        <label className={styles.label}>{t('facebookLabel')}</label>
        <Input
          type="url"
          dir="ltr"
          placeholder={t('facebookPlaceholder')}
          value={vehicle.facebookUrl}
          onChange={(event) => handleFieldChange('facebookUrl', event.target.value)}
          className={styles.input}
        />
        {errors.facebookUrl ? <p className={styles.error}>{errors.facebookUrl}</p> : null}
      </div>
      <div>
        <label className={styles.label}>{t('instagramLabel')}</label>
        <Input
          type="url"
          dir="ltr"
          placeholder={t('instagramPlaceholder')}
          value={vehicle.instagramUrl}
          onChange={(event) => handleFieldChange('instagramUrl', event.target.value)}
          className={styles.input}
        />
        {errors.instagramUrl ? <p className={styles.error}>{errors.instagramUrl}</p> : null}
      </div>

      <div className={styles.submitWrap}>
        <button type="button" onClick={handleSubmitClick} className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </div>

      <button type="button" className={styles.backButton} onClick={onBack}>
        {t('back')}
      </button>
    </div>
  );
}
