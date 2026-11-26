'use client';

import React from 'react';
import { Mail } from 'lucide-react';
import { LegalDataAccuracyModal } from '@/shared/components/legal-data-accuracy-modal';
import { UserPrivacyModal } from '@/shared/components/user-privacy-policy/user-privacy-modal';
import { navigateAuth } from '@/lib/auth-routing';
import { styles } from './personal-step.styles';
import {
  type Lang,
  type AuthMode,
  copy,
  authCopy,
  roleLabels,
  authRoleLabels,
  maskEmail,
} from './personal-step.copy';
import { AccountActivationScreen } from './account-activation-screen';
import {
  PasswordResetDialog,
  SUPPORT_EMAIL,
  buildSupportEmailUrl,
  buildSupportTelUrl,
  getSupportPhone,
} from './password-reset-dialog';
import { PersonalLocationFields } from './personal-location-fields';
import { PersonalStepField } from './personal-step-field';
import {
  PersonalLanguageToggle,
  PersonalBrandHeader,
  PersonalModeSwitch,
  PersonalTicker,
} from './personal-step-header';
import { PersonalAuthForm } from './personal-auth-form';
import { usePersonalStepState } from '../../hooks/use-personal-step-state';

export {
  styles,
  copy,
  authCopy,
  roleLabels,
  authRoleLabels,
  maskEmail,
  SUPPORT_EMAIL,
  buildSupportEmailUrl,
  buildSupportTelUrl,
  getSupportPhone,
  AccountActivationScreen,
  PasswordResetDialog,
  PersonalLocationFields,
  PersonalStepField,
  PersonalLanguageToggle,
  PersonalBrandHeader,
  PersonalModeSwitch,
  PersonalTicker,
  PersonalAuthForm,
  usePersonalStepState,
};
export type { Lang, AuthMode };

export function PersonalStep() {
  const state = usePersonalStepState();

  if (state.awaitingConfirmationEmail) {
    return (
      <AccountActivationScreen
        awaitingConfirmationEmail={state.awaitingConfirmationEmail}
        isArabic={state.isArabic}
        otpInput={state.otpInput}
        setOtpInput={state.setOtpInput}
        isVerifyingOtp={state.isVerifyingOtp}
        handleVerifyOtp={state.handleVerifyOtp}
        isResending={state.isResending}
        resendCountdown={state.resendCountdown}
        handleResendConfirmation={state.handleResendConfirmation}
        onGoToLogin={() => {
          state.setAwaitingConfirmationEmail(null);
          state.goToMode('login');
        }}
      />
    );
  }

  return (
    <main dir={state.isArabic ? 'rtl' : 'ltr'} className={styles.style329_1}>
      <div className={styles.style331_2} />

      <section className={styles.style345_7}>
        <div className={styles.style346_8}>
          <PersonalLanguageToggle
            isArabic={state.isArabic}
            languageAria={state.t.languageAria}
            languageButton={state.t.languageButton}
            onToggle={() => state.setLang(state.isArabic ? 'en' : 'ar')}
          />

          <PersonalBrandHeader
            currentLang={state.currentLang}
            isArabic={state.isArabic}
            brand={state.t.brand}
            roleName={state.roleName}
            mode={state.mode}
            registerTitle={state.t.registerTitle}
            loginTitle={state.t.loginTitle}
            registerSubtitle={state.t.registerSubtitle}
            loginSubtitle={state.t.loginSubtitle}
          />

          <PersonalAuthForm
            mode={state.mode}
            isArabic={state.isArabic}
            t={state.t}
            personal={state.personal}
            setPersonal={state.setPersonal}
            authPassword={state.authPassword}
            setAuthPassword={state.setAuthPassword}
            showPassword={state.showPassword}
            setShowPassword={state.setShowPassword}
            phonePlaceholder={state.phonePlaceholder}
            phoneValidationHint={state.phoneValidationHint}
            phoneValidation={state.phoneValidation}
            isPhoneValid={state.isPhoneValid}
            emailError={state.emailError}
            setEmailError={state.setEmailError}
            countries={state.countries}
            governorates={state.governorates}
            districts={state.districts}
            locationDataLoading={state.locationDataLoading}
            rememberMe={state.rememberMe}
            setRememberMe={state.setRememberMe}
            agreePrivacy={state.agreePrivacy}
            setAgreePrivacy={state.setAgreePrivacy}
            privacyError={state.privacyError}
            onOpenPrivacyModal={() => state.setShowPrivacyModal(true)}
            isSubmitting={state.isSubmitting}
            onFormSubmit={state.onFormSubmit}
            openPasswordReset={state.openPasswordReset}
          />

          <PersonalModeSwitch
            role={state.role}
            mode={state.mode}
            hasAccount={state.t.hasAccount}
            noAccount={state.t.noAccount}
            switchToLogin={state.t.switchToLogin}
            switchToRegister={state.t.switchToRegister}
            createAccountPulseKey={state.createAccountPulseKey}
            onToggleMode={() => state.goToMode(state.mode === 'register' ? 'login' : 'register')}
          />

          <button
            type="button"
            className={styles.style807_133}
            onClick={() => navigateAuth('role')}
          >
            {state.t.back}
          </button>

          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(state.isArabic ? 'استفسار ودعم فني - بينكم' : 'Support Inquiry - Bynkcom')}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#14F5D5] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{state.isArabic ? 'الدعم الفني:' : 'Support:'}</span>
              <span className="font-mono text-slate-300 hover:underline">{SUPPORT_EMAIL}</span>
            </a>
          </div>
        </div>
      </section>

      <PasswordResetDialog
        open={state.resetOpen}
        onOpenChange={state.setResetOpen}
        isArabic={state.isArabic}
        resetTitle={state.t.resetTitle}
        resetPhoneLabel={state.t.resetPhone}
        resetPhone={state.resetPhone}
        setResetPhone={state.setResetPhone}
        resetEmail={state.resetEmail}
        setResetEmail={state.setResetEmail}
        resetSubmitting={state.resetSubmitting}
        resetMessage={state.resetMessage}
        resetError={state.resetError}
        onSubmit={() => void state.submitPasswordRecovery()}
        isResetPhoneValid={state.isResetPhoneValid}
        resetPhoneValidationMessage={state.resetPhoneValidation.message}
        phoneValidationHint={state.phoneValidationHint}
      />

      <PersonalTicker
        tickerItems={state.tickerItems}
        isArabic={state.isArabic}
      />

      <LegalDataAccuracyModal
        isOpen={state.showAccuracyModal}
        onConfirm={state.handleConfirmAccuracy}
        onClose={() => state.setShowAccuracyModal(false)}
        isArabic={state.isArabic}
        isLoading={state.isSubmitting}
      />

      <UserPrivacyModal
        isOpen={state.showPrivacyModal}
        onClose={() => state.setShowPrivacyModal(false)}
        isArabic={state.isArabic}
        readOnly={true}
        onAccept={() => {
          state.setAgreePrivacy(true);
          state.setShowPrivacyModal(false);
        }}
      />
    </main>
  );
}

export default PersonalStep;
