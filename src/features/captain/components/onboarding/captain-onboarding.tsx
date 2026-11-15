'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Languages, ShieldCheck } from 'lucide-react';
import { navigateAuth } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { LegalDataAccuracyModal } from '@/shared/components/legal-data-accuracy-modal';
import { CaptainPersonalStep } from './captain-personal-step';
import { CaptainAffiliationStep } from './captain-affiliation-step';
import { CaptainVehicleStep } from './captain-vehicle-step';
import { CaptainActivationStep } from './captain-activation-step';
import { styles } from './captain-onboarding-styles';
import { useCaptainOnboarding } from './use-captain-onboarding';

export function CaptainOnboarding() {
  const t = useTranslations('captainOnboarding');
  const { isArabic, setLanguage } = useDashboardLanguage();
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    step,
    setStep,
    personal,
    setPersonal,
    rememberMe,
    handleRememberMeChange,
    affiliation,
    setAffiliation,
    vehicle,
    setVehicle,
    vehicleErrors,
    isSubmitting,
    showAccuracyModal,
    setShowAccuracyModal,
    confirmedEmail,
    captainOtpInput,
    setCaptainOtpInput,
    isVerifyingCaptainOtp,
    resendCountdown,
    isResending,
    handleVerifyCaptainOtp,
    handleResendConfirmation,
    handleOpenAccuracyAfterValidation,
    submitCaptainRegistration,
  } = useCaptainOnboarding(isArabic);

  if (!isHydrated) {
    return (
      <main className={styles.hydrationShell} aria-busy="true">
        <div className={styles.hydrationSpinner} aria-hidden="true" />
      </main>
    );
  }

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className={styles.main}>
      <div className={styles.glow} />

      <button
        type="button"
        onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
        className={cn(styles.langButton, isArabic ? styles.langButtonAr : styles.langButtonEn)}
      >
        <Languages className={styles.langIcon} aria-hidden="true" />
        {t('languageButton')}
      </button>

      <section className={styles.wrap}>
        <div className={styles.card}>
          <header className={styles.header}>
            <div className={styles.badge}>
              <ShieldCheck className={styles.badgeIcon} aria-hidden="true" />
            </div>
            <p className={styles.brand}>{t('brand')}</p>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </header>

          {step !== 'done' ? (
            <div className={styles.stepRow}>
              <span className={styles.stepLabel}>{t('stepOf', { step })}</span>
              <span className={styles.stepName}>{t(`steps.${step}`)}</span>
            </div>
          ) : null}

          {step === 1 ? (
            <CaptainPersonalStep
              values={personal}
              onChange={setPersonal}
              rememberMe={rememberMe}
              onRememberMeChange={handleRememberMeChange}
              onNext={() => setStep(2)}
            />
          ) : step === 2 ? (
            <CaptainAffiliationStep
              onSelect={(type) => {
                setAffiliation(type);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          ) : step === 3 ? (
            <CaptainVehicleStep
              affiliation={affiliation}
              vehicle={vehicle}
              setVehicle={setVehicle}
              serverErrors={vehicleErrors}
              onBack={() => setStep(2)}
              onSubmit={() => void handleOpenAccuracyAfterValidation()}
              isSubmitting={isSubmitting}
              country={personal.countryIso}
            />
          ) : (
            <CaptainActivationStep
              confirmedEmail={confirmedEmail}
              captainOtpInput={captainOtpInput}
              setCaptainOtpInput={setCaptainOtpInput}
              isVerifyingCaptainOtp={isVerifyingCaptainOtp}
              resendCountdown={resendCountdown}
              isResending={isResending}
              isArabic={isArabic}
              onVerify={() => handleVerifyCaptainOtp()}
              onResend={handleResendConfirmation}
              onGoToLogin={() => navigateAuth('login', 'driver')}
            />
          )}

          {step !== 'done' ? (
            <p className={styles.hasAccountRow}>
              <span>{t('hasAccountPrompt')}</span>{' '}
              <button
                type="button"
                className={styles.hasAccountLink}
                onClick={() => navigateAuth('login', 'driver')}
              >
                {t('goToLogin')}
              </button>
            </p>
          ) : null}

          <button type="button" className={styles.backLink} onClick={() => navigateAuth('role')}>
            {t('backToRole')}
          </button>
        </div>
      </section>

      <LegalDataAccuracyModal
        isOpen={showAccuracyModal}
        onConfirm={() => {
          setShowAccuracyModal(false);
          void submitCaptainRegistration();
        }}
        onClose={() => setShowAccuracyModal(false)}
        isArabic={isArabic}
        isLoading={isSubmitting}
      />
    </main>
  );
}
