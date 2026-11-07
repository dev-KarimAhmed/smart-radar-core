'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  Mail,
  Phone,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { LegalDataAccuracyModal } from '@/shared/components/legal-data-accuracy-modal';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';
import { useRegistration } from '../../hooks/use-registration';
import { requestPasswordRecovery } from '../../services/password-recovery';
import { navigateAuth } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';
import { getLandingPageUrl } from '@/lib/constants';
import { useTranslations } from "next-intl";
import {
  authCopy,
  authRoleLabels,
  styles,
  type AuthMode,
  type Lang,
} from './personal-step-constants';
import { ActivationConfirmationView } from './activation-confirmation-view';
import { PasswordResetDialog } from './password-reset-dialog';
import { PersonalLocationSelectors } from './personal-location-selectors';
import { Field } from './personal-step-field';

export function PersonalStep() {
  const tAuto = useTranslations('auto');
  const {
    personal,
    setPersonal,
    authPassword,
    setAuthPassword,
    rememberMe,
    setRememberMe,
    handlePersonalSubmit,
    countries,
    phonePlaceholder,
    phoneValidationHint,
    governorates,
    districts,
    locationDataLoading,
    role,
    authMode,
    setAuthMode,
    lang,
    setLang,
    createAccountPulseKey,
    awaitingConfirmationEmail,
    setAwaitingConfirmationEmail,
    resendConfirmationEmail,
    verifyEmailCode,
    isSubmitting,
  } = useRegistration();

  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState(personal.phone);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleVerifyOtp = async () => {
    const cleanCode = otpInput.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6 || isVerifyingOtp) return;
    setIsVerifyingOtp(true);
    try {
      await verifyEmailCode(cleanCode);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    try {
      const success = await resendConfirmationEmail(awaitingConfirmationEmail || undefined);
      if (success) {
        setResendCountdown(60);
      }
    } finally {
      setIsResending(false);
    }
  };

  const submitPasswordRecovery = async () => {
    const cleanPhone = resetPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setResetError(isArabic ? 'يرجى إدخال رقم هاتف صحيح (8 أرقام على الأقل).' : 'Please enter a valid phone number (at least 8 digits).');
      return;
    }
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setResetError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }

    setResetSubmitting(true);
    setResetError('');
    setResetMessage('');
    try {
      const res = await requestPasswordRecovery(resetPhone, resetEmail);
      setResetMessage(res.message);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : tAuto('key_ae0a0345'));
    } finally {
      setResetSubmitting(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (authMode === 'register') {
      const cleanEmail = personal.email?.trim() || '';
      if (!cleanEmail) {
        setEmailError(lang === 'ar' ? 'البريد الإلكتروني مطلوب لتفعيل الحساب' : 'Email is required for verification');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setEmailError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Invalid email format');
        return;
      }
      setShowAccuracyModal(true);
      return;
    }
    handlePersonalSubmit(e);
  };

  const handleConfirmAccuracy = () => {
    setShowAccuracyModal(false);
    setShowPwaInstallModal(true);
    handlePersonalSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const currentLang = lang as Lang;
  const mode = authMode as AuthMode;
  const isArabic = currentLang === 'ar';
  const t = authCopy[currentLang];
  const roleName = role ? authRoleLabels[role]?.[currentLang] : authRoleLabels.rider[currentLang];
  const tickerItems = useMemo(() => [...t.ticker, ...t.ticker, ...t.ticker], [t.ticker]);

  const openPasswordReset = () => {
    setResetPhone(personal.phone);
    setResetEmail('');
    setResetMessage('');
    setResetError('');
    setResetOpen(true);
  };

  const goToMode = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    navigateAuth(nextMode, role);
  };

  if (awaitingConfirmationEmail) {
    return (
      <ActivationConfirmationView
        awaitingConfirmationEmail={awaitingConfirmationEmail}
        isArabic={isArabic}
        role={role}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        isVerifyingOtp={isVerifyingOtp}
        handleVerifyOtp={handleVerifyOtp}
        isResending={isResending}
        resendCountdown={resendCountdown}
        handleResendConfirmation={handleResendConfirmation}
        onBackToLogin={() => {
          setAwaitingConfirmationEmail(null);
          goToMode('login');
        }}
        showPwaInstallModal={showPwaInstallModal}
        setShowPwaInstallModal={setShowPwaInstallModal}
      />
    );
  }

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className={styles.style329_1}>
      <div className={styles.style331_2} />

      <button
        type="button"
        aria-label={t.languageAria}
        onClick={() => setLang(isArabic ? 'en' : 'ar')}
        className={cn(styles.style337_3, isArabic ? styles.style338_4 : styles.style338_5)}
      >
        <Languages className={styles.style341_6} aria-hidden="true" />
        {t.languageButton}
      </button>

      <section className={styles.style345_7}>
        <div className={styles.style346_8}>
          <header className={styles.style347_9}>
            <div className={styles.style348_10}>
              <a
                href={getLandingPageUrl()}
                className="inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/icons/logo-header.png"
                  alt="Radar"
                  width={585}
                  height={152}
                  priority
                  className={styles.brandLogoImg}
                />
              </a>
            </div>
            <p className={styles.style351_12}>
              {t.brand} · {roleName}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${mode}-${currentLang}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className={styles.style362_13}>
                  {mode === 'register' ? t.registerTitle : t.loginTitle}
                </h1>
                <p className={styles.style365_14}>
                  {mode === 'register' ? t.registerSubtitle : t.loginSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </header>

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
              {mode === 'register' ? (
                <Field label={t.fullName} icon={<UserRound className={styles.style621_79} />}>
                  <input
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    value={personal.name}
                    onChange={(event) => setPersonal({ ...personal, name: event.target.value })}
                    className={cn(styles.input, isArabic ? styles.style627_80 : styles.style627_81)}
                    autoComplete="name"
                    required
                  />
                </Field>
              ) : null}

              <Field label={t.phone} icon={<Phone className={styles.style634_82} />}>
                <input
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  placeholder={phonePlaceholder || t.phonePlaceholder}
                  value={personal.phone}
                  onChange={(event) => setPersonal({ ...personal, phone: event.target.value })}
                  className={cn(styles.input, styles.style642_83)}
                  autoComplete="tel"
                  required
                />
                <p className={cn(isArabic ? styles.style646_84 : styles.style646_85, styles.style646_86)}>
                  {phoneValidationHint}
                </p>
              </Field>

              {mode === 'register' ? (
                <Field label={t.email} icon={<Mail className={styles.style634_82} />}>
                  <input
                    type="email"
                    dir="ltr"
                    inputMode="email"
                    placeholder={t.emailPlaceholder}
                    value={personal.email}
                    onChange={(event) => {
                      const val = event.target.value;
                      setPersonal({ ...personal, email: val });
                      const cleanVal = val.trim();
                      if (!cleanVal) {
                        setEmailError(isArabic ? 'البريد الإلكتروني مطلوب لتفعيل الحساب' : 'Email is required');
                      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanVal)) {
                        setEmailError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح (مثل: name@example.com)' : 'Please enter a valid email address');
                      } else {
                        setEmailError('');
                      }
                    }}
                    className={cn(
                      styles.input,
                      styles.style642_83,
                      emailError
                        ? '!border-rose-500/70 focus:!border-rose-500'
                        : personal.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())
                          ? '!border-emerald-500/70 focus:!border-emerald-500'
                          : ''
                    )}
                    autoComplete="email"
                  />
                  {emailError ? (
                    <p className={cn(isArabic ? styles.style646_84 : styles.style646_85, 'text-rose-400 mt-1 font-bold text-[10px] animate-in fade-in duration-150')}>
                      {emailError}
                    </p>
                  ) : personal.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim()) ? (
                    <p className={cn(isArabic ? styles.style646_84 : styles.style646_85, 'text-emerald-400 mt-1 font-bold text-[10px] animate-in fade-in duration-150 flex items-center gap-1')}>
                      <Check className="h-3 w-3 inline stroke-[2.5]" />
                      <span>{isArabic ? 'صيغة البريد الإلكتروني صحيحة' : 'Valid email format'}</span>
                    </p>
                  ) : null}
                </Field>
              ) : null}

              {mode === 'register' ? (
                <PersonalLocationSelectors
                  isArabic={isArabic}
                  t={t}
                  personal={personal}
                  setPersonal={setPersonal}
                  locationDataLoading={locationDataLoading}
                  countries={countries}
                  governorates={governorates}
                  districts={districts}
                />
              ) : null}

              <Field label={t.password} icon={<LockKeyhole className={styles.style731_112} />}>
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
              </Field>

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

          {role !== 'admin' && (
            <div className={styles.style794_131}>
              <span>{mode === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
              <motion.button
                key={mode === 'login' ? createAccountPulseKey : 'static'}
                type="button"
                onClick={() => goToMode(mode === 'register' ? 'login' : 'register')}
                className={styles.createAccountLink}
                initial={mode === 'login' ? { scale: 1, color: '#94A3B8' } : false}
                animate={mode === 'login' ? { scale: [1, 1.22, 0.94, 1.06, 1], color: '#14B8A6' } : undefined}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                {mode === 'login' ? <UserPlus className={styles.createAccountIcon} aria-hidden="true" /> : null}
                {mode === 'register' ? t.switchToLogin : t.switchToRegister}
              </motion.button>
            </div>
          )}

          <button
            type="button"
            className={styles.style807_133}
            onClick={() => navigateAuth('role')}
          >
            {t.back}
          </button>
        </div>
      </section>

      <PasswordResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        isArabic={isArabic}
        resetPhone={resetPhone}
        setResetPhone={setResetPhone}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        resetSubmitting={resetSubmitting}
        resetMessage={resetMessage}
        resetError={resetError}
        onSubmit={submitPasswordRecovery}
        title={t.resetTitle}
        phoneLabel={t.resetPhone || (isArabic ? 'رقم الهاتف المسجل' : 'Registered phone number')}
      />

      <div className={styles.style871_148}>
        <div
          className={cn(styles.style873_149, isArabic
            ? styles.style875_150
            : styles.style876_151)}
        >
          {tickerItems.map((item, index) => (
            <span key={`${item}-${index}`} className={styles.style880_152}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <LegalDataAccuracyModal
        isOpen={showAccuracyModal}
        onConfirm={handleConfirmAccuracy}
        onClose={() => setShowAccuracyModal(false)}
        isArabic={isArabic}
        isLoading={isSubmitting}
      />
      <SovereignPwaInstallModal
        isOpen={showPwaInstallModal}
        onClose={() => setShowPwaInstallModal(false)}
        isArabic={isArabic}
        role={role === 'driver' ? 'captain' : 'rider'}
      />
    </main>
  );
}


