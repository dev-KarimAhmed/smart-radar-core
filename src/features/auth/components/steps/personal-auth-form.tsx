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
import { WhatsAppGroupRegistrationField } from '@/features/whatsapp-groups/contract';

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
  agreePrivacy?: boolean;
  setAgreePrivacy?: (val: boolean) => void;
  privacyError?: string;
  onOpenPrivacyModal?: () => void;
  isSubmitting: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  openPasswordReset: () => void;
  isRiderRegistration?: boolean;
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
  agreePrivacy = false,
  setAgreePrivacy,
  privacyError = '',
  onOpenPrivacyModal,
  isSubmitting,
  onFormSubmit,
  openPasswordReset,
  isRiderRegistration = false,
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

        {mode === 'register' && isRiderRegistration ? <WhatsAppGroupRegistrationField /> : null}

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

        {mode === 'register' && setAgreePrivacy ? (
          <div className="space-y-1 my-1">
            <label className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-teal-500/5 border border-teal-500/20 hover:border-teal-500/40 transition cursor-pointer">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-teal-500/40 bg-black/40 text-teal-400 focus:ring-teal-500/20 cursor-pointer"
                required
              />
              <span className="text-xs text-slate-300 select-none leading-relaxed">
                {isArabic ? 'قرأت وأوافق على ' : 'I have read and agree to the '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onOpenPrivacyModal) onOpenPrivacyModal();
                  }}
                  className="font-bold text-[#14F5D5] underline hover:text-teal-300 transition cursor-pointer"
                >
                  {isArabic ? 'سياسة خصوصية المستخدم والإعلانات' : 'User Privacy & Advertising Policy'}
                </button>
              </span>
            </label>
            {privacyError ? (
              <p className="text-[11px] font-bold text-rose-400 ps-1.5">{privacyError}</p>
            ) : null}
          </div>
        ) : null}

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
