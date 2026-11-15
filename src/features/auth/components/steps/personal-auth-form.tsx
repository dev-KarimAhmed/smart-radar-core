'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './personal-step.styles';
import { type AuthMode } from './personal-step.copy';
import { PersonalStepField } from './personal-step-field';
import { PersonalContactFields } from './personal-contact-fields';
import { PersonalLocationFields } from './personal-location-fields';

interface PersonalAuthFormProps {
  mode: AuthMode;
  isArabic: boolean;
  t: any;
  personal: any;
  setPersonal: (personal: any) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  phonePlaceholder?: string;
  phoneValidationHint: string;
  phoneValidation: { ok: boolean; message?: string };
  isPhoneValid: boolean;
  emailError: string;
  setEmailError: (val: string) => void;
  countries: any[];
  governorates: any[];
  districts: any[];
  locationDataLoading: boolean;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  isSubmitting: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  openPasswordReset: () => void;
}

export function PersonalAuthForm({
  mode,
  isArabic,
  t,
  personal,
  setPersonal,
  authPassword,
  setAuthPassword,
  showPassword,
  setShowPassword,
  phonePlaceholder,
  phoneValidationHint,
  phoneValidation,
  isPhoneValid,
  emailError,
  setEmailError,
  countries,
  governorates,
  districts,
  locationDataLoading,
  rememberMe,
  setRememberMe,
  isSubmitting,
  onFormSubmit,
  openPasswordReset,
}: PersonalAuthFormProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.form
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={styles.style405_21}
        onSubmit={onFormSubmit}
      >
        <PersonalContactFields
          mode={mode}
          isArabic={isArabic}
          fullNameLabel={t.fullName}
          fullNamePlaceholder={t.fullNamePlaceholder}
          name={personal.name}
          setName={(name) => setPersonal({ ...personal, name })}
          phoneLabel={t.phone}
          phonePlaceholder={phonePlaceholder || t.phonePlaceholder}
          phone={personal.phone}
          setPhone={(phone) => setPersonal({ ...personal, phone })}
          isPhoneValid={isPhoneValid}
          phoneValidationMessage={phoneValidation.message}
          phoneValidationHint={phoneValidationHint}
          emailLabel={t.email}
          emailPlaceholder={t.emailPlaceholder}
          email={personal.email}
          setEmail={(email) => setPersonal({ ...personal, email })}
          emailError={emailError}
          setEmailError={setEmailError}
        />

        {mode === 'register' ? (
          <PersonalLocationFields
            isArabic={isArabic}
            country={personal.country}
            gov={personal.gov}
            district={personal.district}
            onChangeCountry={(value) => setPersonal({ ...personal, country: value, gov: '', district: '' })}
            onChangeGov={(value) => setPersonal({ ...personal, gov: value, district: '' })}
            onChangeDistrict={(value) => setPersonal({ ...personal, district: value })}
            countries={countries}
            governorates={governorates}
            districts={districts}
            locationDataLoading={locationDataLoading}
            countryLabel={t.country}
            countryPlaceholder={locationDataLoading && !countries.length ? '...' : t.countryPlaceholder}
            governorateLabel={t.governorate}
            governoratePlaceholder={locationDataLoading ? '...' : t.governoratePlaceholder}
            districtLabel={t.district}
            districtPlaceholder={locationDataLoading ? '...' : t.districtPlaceholder}
          />
        ) : null}

        <PersonalStepField label={t.password} icon={<LockKeyhole className={styles.style731_112} />}>
          <div className={styles.style732_113}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t.passwordPlaceholder}
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              className={cn(styles.input, isArabic ? styles.style738_114 : styles.style738_115)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              onClick={() => setShowPassword((current) => !current)}
              className={cn(styles.style746_116, isArabic ? styles.style747_117 : styles.style747_118)}
            >
              {showPassword ? <EyeOff className={styles.style750_119} /> : <Eye className={styles.style750_120} />}
            </button>
          </div>
        </PersonalStepField>

        {mode === 'login' ? (
          <button
            type="button"
            onClick={openPasswordReset}
            className={cn(styles.style759_121, isArabic ? styles.style760_122 : styles.style760_123)}
          >
            {t.forgotPassword}
          </button>
        ) : null}

        <label className={styles.style767_124}>
          <span className={cn(isArabic ? styles.style768_125 : styles.style768_126)}>
            <span className={styles.style769_127}>{t.rememberMe}</span>
            <span className={styles.style770_128}>{t.rememberHint}</span>
          </span>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className={styles.style776_129}
          />
        </label>

        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ y: -1 }}
          type="submit"
          disabled={isSubmitting}
          className={styles.style785_130}
        >
          {isSubmitting ? '...' : mode === 'register' ? t.submitRegister : t.submitLogin}
        </motion.button>
      </motion.form>
    </AnimatePresence>
  );
}
