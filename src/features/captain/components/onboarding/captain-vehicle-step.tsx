'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import type { AffiliationType } from '@/core/types';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { compressLicenseImage } from '../../lib/compress-license-image';
import { getCaptainTaxiVehicleSchema, getCaptainSmartAppVehicleSchema } from '../../lib/captain-registration-schema';
import { validateYupField, isYupSchemaValid } from '../../lib/validate-field';

export interface CaptainTaxiVehicleValues {
  officeName: string;
  officePhone: string;
  sideId: string;
  plate: string;
  year: string;
}

export interface CaptainSmartAppVehicleValues {
  companyName: string;
  make: string;
  color: string;
  plate: string;
  year: string;
}

export type CaptainVehicleValues = CaptainTaxiVehicleValues & CaptainSmartAppVehicleValues;

const styles = {
  root: 'space-y-4 text-right animate-fade-in',
  fieldRow: 'grid grid-cols-2 gap-2',
  label: 'block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1 text-right',
  input:
    'w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 text-right',
  colorInput:
    'w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] rounded-xl h-11 p-1 cursor-pointer',
  error: 'text-[10px] font-bold text-rose-400 mt-1',
  licenseBlock: 'p-3 rounded-xl bg-[#0B0F19] border border-[#14B8A6]/20 text-right space-y-2',
  licenseLabel: 'text-[10px] sm:text-[11px] font-black text-[#14B8A6] block',
  licenseDropzone:
    'relative border border-dashed border-[#14B8A6]/35 rounded-lg p-2.5 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-all cursor-pointer',
  licenseInput: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
  licenseDoneRow: 'flex items-center gap-2',
  licenseDoneText: 'text-[10px] text-emerald-400 font-bold',
  licenseShield: 'text-xs',
  licenseCompressing: 'text-[10px] text-gray-400 animate-pulse',
  licenseEmptyWrap: 'flex flex-col items-center',
  licenseEmptyText: 'text-[9px] text-[#94A3B8]/80 leading-normal text-center font-medium',
  licenseEmptyHint: 'text-[8px] text-[#14B8A6]/60 block font-mono',
  submitWrap: 'pt-2',
  submitButton:
    'w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-[#0B0F19] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer',
  backButton: 'w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer',
} as const;

export function CaptainVehicleStep({
  affiliation,
  vehicle,
  setVehicle,
  licenseImage,
  onLicenseChange,
  onBack,
  onSubmit,
  country,
}: {
  affiliation: AffiliationType | null;
  vehicle: CaptainVehicleValues;
  setVehicle: (vehicle: CaptainVehicleValues) => void;
  licenseImage: string;
  onLicenseChange: (base64: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  country?: string;
}) {
  const t = useTranslations('captainOnboarding.vehicle');
  const tv = useTranslations('captainOnboarding.validation');
  const { isArabic } = useDashboardLanguage();
  const [compressing, setCompressing] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const isTaxi = affiliation === 'office-taxi';
  const schema = React.useMemo(
    () => (isTaxi ? getCaptainTaxiVehicleSchema(tv, country) : getCaptainSmartAppVehicleSchema(tv)),
    [isTaxi, tv, country],
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const compressedBase64 = await compressLicenseImage(file);
      onLicenseChange(compressedBase64);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    } finally {
      setCompressing(false);
    }
  };

  const isValid = isYupSchemaValid(schema, vehicle) && Boolean(licenseImage);

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      {isTaxi ? (
        <>
          <div>
            <label className={styles.label}>{t('officeName')}</label>
            <Input
              placeholder={t('officeName')}
              value={vehicle.officeName}
              onChange={(e) => handleFieldChange('officeName', e.target.value)}
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
              placeholder="0791234567"
              value={vehicle.officePhone}
              onChange={(e) => handleFieldChange('officePhone', e.target.value)}
              className={styles.input}
              required
            />
            {errors.officePhone ? <p className={styles.error}>{errors.officePhone}</p> : null}
          </div>
          <div className={styles.fieldRow}>
            <div>
              <label className={styles.label}>{t('sideId')}</label>
              <Input
                placeholder={t('sideId')}
                value={vehicle.sideId}
                onChange={(e) => handleFieldChange('sideId', e.target.value)}
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
                onChange={(e) => handleFieldChange('plate', e.target.value)}
                className={styles.input}
                required
              />
              {errors.plate ? <p className={styles.error}>{errors.plate}</p> : null}
            </div>
          </div>
          <div>
            <label className={styles.label}>{t('year')}</label>
            <Input
              type="number"
              placeholder={t('year')}
              value={vehicle.year}
              onChange={(e) => handleFieldChange('year', e.target.value)}
              className={styles.input}
              required
              min="1990"
              max="2027"
            />
            {errors.year ? <p className={styles.error}>{errors.year}</p> : null}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className={styles.label}>{t('companyName')}</label>
            <Input
              placeholder={t('companyName')}
              value={vehicle.companyName}
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              className={styles.input}
              required
            />
            {errors.companyName ? <p className={styles.error}>{errors.companyName}</p> : null}
          </div>
          <div className={styles.fieldRow}>
            <div>
              <label className={styles.label}>{t('make')}</label>
              <Input
                placeholder={t('makePlaceholder')}
                value={vehicle.make}
                onChange={(e) => handleFieldChange('make', e.target.value)}
                className={styles.input}
                required
              />
              {errors.make ? <p className={styles.error}>{errors.make}</p> : null}
            </div>
            <div>
              <label className={styles.label}>{t('color')}</label>
              <input
                type="color"
                value={vehicle.color || '#14b8a6'}
                onChange={(e) => handleFieldChange('color', e.target.value)}
                className={styles.colorInput}
                required
              />
              {errors.color ? <p className={styles.error}>{errors.color}</p> : null}
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div>
              <label className={styles.label}>{t('plate')}</label>
              <Input
                placeholder={t('platePlaceholder')}
                value={vehicle.plate}
                onChange={(e) => handleFieldChange('plate', e.target.value)}
                className={styles.input}
                required
              />
              {errors.plate ? <p className={styles.error}>{errors.plate}</p> : null}
            </div>
            <div>
              <label className={styles.label}>{t('year')}</label>
              <Input
                type="number"
                placeholder={t('year')}
                value={vehicle.year}
                onChange={(e) => handleFieldChange('year', e.target.value)}
                className={styles.input}
                required
                min="1990"
                max="2027"
              />
              {errors.year ? <p className={styles.error}>{errors.year}</p> : null}
            </div>
          </div>
        </>
      )}

      <div className={styles.licenseBlock}>
        <label className={styles.licenseLabel}>{t('licenseLabel')}</label>
        <div className={styles.licenseDropzone}>
          <input type="file" accept="image/*" onChange={handleFileChange} className={styles.licenseInput} />
          {licenseImage ? (
            <div className={styles.licenseDoneRow}>
              <span className={styles.licenseDoneText}>{t('licenseDone')}</span>
              <span className={styles.licenseShield}>🛡️</span>
            </div>
          ) : compressing ? (
            <span className={styles.licenseCompressing}>{t('licenseCompressing')}</span>
          ) : (
            <div className={styles.licenseEmptyWrap}>
              <span className={styles.licenseEmptyText}>{t('licenseEmptyText')}</span>
              <span className={styles.licenseEmptyHint}>{t('licenseEmptyHint')}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.submitWrap}>
        <button type="button" onClick={onSubmit} className={styles.submitButton} disabled={!isValid || compressing}>
          {t('submit')}
        </button>
      </div>

      <button type="button" className={styles.backButton} onClick={onBack}>
        {t('back')}
      </button>
    </div>
  );
}
