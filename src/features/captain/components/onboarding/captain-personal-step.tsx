'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/shared/components/ui/app-select';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import {
  useSupabaseCountries,
  useSupabaseGovernorates,
  useSupabaseDistricts,
  useDetectedCountryCode,
  getCountryLabel,
  getCountryIsoCode,
  getGovernorateOrDistrictLabel,
} from '@/features/auth/contract';
import { getCaptainPersonalSchema } from '../../lib/captain-registration-schema';
import { validateYupField, isYupSchemaValid, collectYupSchemaErrors } from '../../lib/validate-field';

export interface CaptainPersonalValues {
  name: string;
  nickname: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  // Derived from `country` (the selected Supabase row id) whenever it changes;
  // kept alongside it so the phone validator always has an ISO code to test against.
  countryIso: string;
  governorate: string;
  district: string;
}



export function CaptainPersonalStep({
  values,
  onChange,
  rememberMe,
  onRememberMeChange,
  onNext,
}: {
  values: CaptainPersonalValues;
  onChange: (values: CaptainPersonalValues) => void;
  rememberMe: boolean;
  onRememberMeChange: (remember: boolean) => void;
  onNext: () => void;
}) {
  const t = useTranslations('captainOnboarding.personal');
  const tv = useTranslations('captainOnboarding.validation');
  const { isArabic, language } = useDashboardLanguage();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const schema = React.useMemo(() => getCaptainPersonalSchema(tv), [tv]);

  const { countryRows, loading: countriesLoading } = useSupabaseCountries();
  const countryIdNum = Number(values.country) || null;
  const governorateIdNum = Number(values.governorate) || null;
  const { governorateRows, loading: governoratesLoading } = useSupabaseGovernorates(countryIdNum);
  const { districtRows, loading: districtsLoading } = useSupabaseDistricts(governorateIdNum);
  const detectedCountryCode = useDetectedCountryCode();

  const countryOptions = React.useMemo(
    () => countryRows.map((row) => ({ value: String(row.id), label: getCountryLabel(row, language) })),
    [countryRows, language],
  );
  const governorateOptions = React.useMemo(
    () => governorateRows.map((row) => ({ value: String(row.id), label: getGovernorateOrDistrictLabel(row, language) })),
    [governorateRows, language],
  );
  const districtOptions = React.useMemo(
    () => districtRows.map((row) => ({ value: String(row.id), label: getGovernorateOrDistrictLabel(row, language) })),
    [districtRows, language],
  );

  const runFieldValidation = React.useCallback(
    async (field: string, nextValues: CaptainPersonalValues) => {
      const message = await validateYupField(schema, nextValues, field);
      setErrors((current) => ({ ...current, [field]: message }));
    },
    [schema],
  );

  const handleFieldChange = (field: keyof CaptainPersonalValues, value: string) => {
    const nextValues = { ...values, [field]: value };
    if (field === 'governorate') nextValues.district = '';
    onChange(nextValues);
    void runFieldValidation(field, nextValues);
    if (field === 'governorate') setErrors((current) => ({ ...current, district: '' }));
  };

  const handleCountryChange = (id: string) => {
    const row = countryRows.find((candidate) => String(candidate.id) === id);
    const nextValues = { ...values, country: id, countryIso: getCountryIsoCode(row), governorate: '', district: '' };
    onChange(nextValues);
    void runFieldValidation('country', nextValues);
    // Re-run phone validation too: the same digits can be valid for one country and not another.
    if (values.phone.trim()) void runFieldValidation('phone', nextValues);
  };

  // Default the country to wherever the visitor appears to be, but only once and
  // only if it's actually offered by Supabase — otherwise leave the placeholder.
  React.useEffect(() => {
    if (values.country || !detectedCountryCode || countryRows.length === 0) return;
    const detected = countryRows.find((row) => getCountryIsoCode(row) === detectedCountryCode);
    if (!detected) return;
    onChange({ ...values, country: String(detected.id), countryIso: getCountryIsoCode(detected) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedCountryCode, countryRows]);

  const isValid = isYupSchemaValid(schema, values);

  const handleContinueClick = () => {
    if (isValid) {
      onNext();
      return;
    }
    // Surface every unfilled/invalid field at once, not just the ones the
    // user has already interacted with, so it's obvious why "Continue" won't advance.
    setErrors(collectYupSchemaErrors(schema, values));
  };

  const styles = {
  root: 'space-y-4  animate-fade-in',
  field: 'space-y-1.5',
  fieldRow: 'grid grid-cols-2 gap-3',
  label: 'flex items-center gap-1.5 text-[11px] font-bold text-[#94A3B8]',
  icon: 'h-3.5 w-3.5 text-[#14B8A6]',
  input:
    'w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300 ',
  passwordWrap: 'relative',
  eyeButton: `absolute top-1/2 ${isArabic? 'left-2':"right-2"} -translate-y-1/2 h-7 w-7 flex items-center justify-center text-[#94A3B8] hover:text-[#14B8A6] transition-colors`,
  eyeIcon: 'h-4 w-4',
  error: 'text-[10px] font-bold text-rose-400 mt-1',
  hint: 'text-[10px] font-medium text-[#94A3B8] mt-1',
  rememberRow:
    'flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/45 p-3',
  rememberText: '',
  rememberLabel: 'block text-sm font-black text-[#F8FAFC]',
  rememberHint: 'mt-0.5 block text-xs font-semibold text-[#94A3B8]',
  checkbox: 'h-5 w-5 shrink-0 accent-[#14B8A6]',
  continueButton:
    'w-full h-12 rounded-2xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed',
} as const;

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.field}>
        <label className={styles.label}>
          <UserRound className={styles.icon} />
          {t('name')}
        </label>
        <Input
          placeholder={t('namePlaceholder')}
          value={values.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className={styles.input}
          required
        />
        {errors.name ? <p className={styles.error}>{errors.name}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <UserRound className={styles.icon} />
          {t('nickname')}
        </label>
        <Input
          placeholder={t('nicknamePlaceholder')}
          value={values.nickname}
          onChange={(e) => handleFieldChange('nickname', e.target.value)}
          className={styles.input}
        />
        {errors.nickname ? <p className={styles.error}>{errors.nickname}</p> : null}
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>
            <MapPin className={styles.icon} />
            {t('country')}
          </label>
          <AppSelect
            value={values.country}
            onValueChange={handleCountryChange}
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
          <Input
            type="tel"
            dir="ltr"
            placeholder={t('phonePlaceholder')}
            value={values.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            className={styles.input}
            required
          />
          <p className={styles.hint}>{t('phoneHint')}</p>
          {errors.phone ? <p className={styles.error}>{errors.phone}</p> : null}
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
          onChange={(e) => handleFieldChange('email' as any, e.target.value)}
          className={styles.input}
        />
        {errors.email ? <p className={styles.error}>{errors.email}</p> : null}
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>
            <MapPin className={styles.icon} />
            {t('governorate')}
          </label>
          <AppSelect
            value={values.governorate}
            onValueChange={(value) => handleFieldChange('governorate', value)}
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
            onValueChange={(value) => handleFieldChange('district', value)}
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

      <div className={styles.field}>
        <label className={styles.label}>
          <Lock className={styles.icon} />
          {t('password')}
        </label>
        <div className={styles.passwordWrap}>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('passwordPlaceholder')}
            value={values.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            className={styles.input}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className={styles.eyeButton}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
          </button>
        </div>
        {errors.password ? <p className={styles.error}>{errors.password}</p> : null}
      </div>

      <label className={styles.rememberRow}>
        <span className={styles.rememberText}>
          <span className={styles.rememberLabel}>{t('rememberMe')}</span>
          <span className={styles.rememberHint}>{t('rememberHint')}</span>
        </span>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => onRememberMeChange(e.target.checked)}
          className={styles.checkbox}
        />
      </label>

      <button type="button" onClick={handleContinueClick} className={styles.continueButton}>
        {t('continue')}
      </button>
    </div>
  );
}
