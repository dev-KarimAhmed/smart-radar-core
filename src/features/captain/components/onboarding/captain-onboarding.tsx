'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Languages, ShieldCheck } from 'lucide-react';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';
import { navigateAuth } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { verifyEmailOtpCode } from '@/features/auth/contract';
import type { AffiliationType } from '@/core/types';
import { LegalDataAccuracyModal } from '@/shared/components/legal-data-accuracy-modal';
import { CaptainPersonalStep, type CaptainPersonalValues } from './captain-personal-step';
import { CaptainAffiliationStep } from './captain-affiliation-step';
import { CaptainVehicleStep, type CaptainVehicleValues } from './captain-vehicle-step';
import {
  REMEMBER_ME_STORAGE_KEY,
  type OnboardingStep,
  emptyPersonal,
  emptyVehicle,
  readStoredRememberMe,
  styles,
} from './captain-onboarding-helpers';
import { CaptainOnboardingConfirmation } from './captain-onboarding-confirmation';
import { useCaptainRegistrationSubmit } from './use-captain-registration-submit';

export function CaptainOnboarding() {
  const t = useTranslations('captainOnboarding');
  const { isArabic, setLanguage } = useDashboardLanguage();
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [step, setStep] = React.useState<OnboardingStep>(1);
  const [showAccuracyModal, setShowAccuracyModal] = React.useState(false);
  const [showPwaInstallModal, setShowPwaInstallModal] = React.useState(false);
  const [personal, setPersonal] = React.useState<CaptainPersonalValues>(emptyPersonal);
  const [rememberMe, setRememberMe] = React.useState<boolean>(readStoredRememberMe);
  const [affiliation, setAffiliation] = React.useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = React.useState<CaptainVehicleValues>(emptyVehicle);
  const [confirmedEmail, setConfirmedEmail] = React.useState<string | null>(null);
  const [captainOtpInput, setCaptainOtpInput] = React.useState('');
  const [isVerifyingCaptainOtp, setIsVerifyingCaptainOtp] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState<number>(0);
  const [isResending, setIsResending] = React.useState<boolean>(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleVerifyCaptainOtp = async () => {
    const cleanCode = captainOtpInput.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6 || isVerifyingCaptainOtp) return;
    const emailToVerify = confirmedEmail || personal.email?.trim();
    if (!emailToVerify) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في التفعيل' : 'Verification error',
        description: isArabic ? 'لم يتم العثور على بريد إلكتروني مرتبط' : 'No associated email found',
      });
      return;
    }

    setIsVerifyingCaptainOtp(true);
    try {
      const res = await verifyEmailOtpCode({
        email: emailToVerify,
        code: cleanCode,
        phone: personal.phone,
      });

      if (res.success) {
        toast({
          title: isArabic ? 'تم تفعيل الحساب بنجاح! 🚀' : 'Account activated successfully! 🚀',
          description: isArabic ? 'جاري تحويلك إلى رادار الكابتن...' : 'Redirecting to Captain Radar...',
        });
        window.location.replace('/captain');
        return;
      }

      toast({
        variant: 'destructive',
        title: isArabic ? 'كود غير صحيح' : 'Invalid code',
        description: res.error || (isArabic ? 'كود التفعيل غير صحيح أو انتهت صلاحيته' : 'Verification code is invalid or expired'),
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في التفعيل' : 'Verification error',
        description: err?.message || (isArabic ? 'حدث خطأ أثناء التحقق من الكود' : 'Error verifying code'),
      });
    } finally {
      setIsVerifyingCaptainOtp(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCountdown > 0 || isResending) return;
    const emailToResend = confirmedEmail || personal.email?.trim();
    if (!emailToResend) return;

    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToResend, role: 'driver' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend confirmation email');
      }
      setResendCountdown(60);
      toast({
        title: isArabic ? 'تم إرسال كود جديد! ✉️' : 'New code sent! ✉️',
        description: isArabic ? 'يرجى مراجعة بريدك الإلكتروني للحصول على كود التفعيل.' : 'Please check your email for the new code.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في الإرسال' : 'Resend error',
        description: err?.message || (isArabic ? 'تعذر إرسال كود التفعيل، يرجى المحاولة بعد قليل' : 'Failed to resend code, please try again'),
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleRememberMeChange = (value: boolean) => {
    setRememberMe(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, String(value));
    }
  };

  const {
    isSubmitting,
    vehicleErrors,
    setVehicleErrors,
    submitCaptainRegistration,
  } = useCaptainRegistrationSubmit({
    personal,
    vehicle,
    affiliation,
    rememberMe,
    isArabic,
    t,
    toast,
    setStep,
    setShowPwaInstallModal,
    setConfirmedEmail,
  });

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <main className={styles.hydrationShell}>
        <div className={styles.hydrationSpinner} aria-hidden="true" />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.glow} />

      <button
        type="button"
        onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
        aria-label={t('switchLanguage')}
        className={cn(
          styles.langButton,
          isArabic ? styles.langButtonAr : styles.langButtonEn,
        )}
      >
        <Languages className={styles.langIcon} />
        <span>{t('languageName')}</span>
      </button>

      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.badge}>
              <ShieldCheck className={styles.badgeIcon} />
            </div>
            <p className={styles.brand}>{t('brand')}</p>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>

          {step !== 'done' && (
            <div className={styles.stepRow}>
              <span className={styles.stepLabel}>
                {t('stepCounter', { current: step, total: 3 })}
              </span>
              <span className={styles.stepName}>
                {step === 1 ? t('personalStepName') : step === 2 ? t('affiliationStepName') : t('vehicleStepName')}
              </span>
            </div>
          )}

          {step === 1 ? (
            <CaptainPersonalStep
              initialValues={personal}
              rememberMe={rememberMe}
              onRememberMeChange={handleRememberMeChange}
              onNext={(vals) => {
                setPersonal(vals);
                setStep(2);
              }}
            />
          ) : step === 2 ? (
            <CaptainAffiliationStep
              value={affiliation}
              onChange={setAffiliation}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          ) : step === 3 ? (
            <CaptainVehicleStep
              values={vehicle}
              affiliation={affiliation!}
              isSubmitting={isSubmitting}
              errors={vehicleErrors}
              onBack={() => setStep(2)}
              onChange={(next) => {
                setVehicle(next);
                setVehicleErrors({});
              }}
              onSubmit={() => setShowAccuracyModal(true)}
            />
          ) : (
            <CaptainOnboardingConfirmation
              isArabic={isArabic}
              confirmedEmail={confirmedEmail}
              captainOtpInput={captainOtpInput}
              setCaptainOtpInput={setCaptainOtpInput}
              isVerifyingCaptainOtp={isVerifyingCaptainOtp}
              handleVerifyCaptainOtp={handleVerifyCaptainOtp}
              isResending={isResending}
              resendCountdown={resendCountdown}
              handleResendConfirmation={handleResendConfirmation}
              onOpenPwaModal={() => setShowPwaInstallModal(true)}
            />
          )}

          {step !== 'done' ? (
            <p className={styles.hasAccountRow}>
              <span>{t('hasAccount')}{' '}</span>
              <button
                type="button"
                onClick={() => navigateAuth('login', 'driver')}
                className={styles.hasAccountLink}
              >
                {t('loginLink')}
              </button>
            </p>
          ) : null}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => navigateAuth('login', 'driver')}
              className={styles.backLink}
            >
              {t('backToHome')}
            </button>
          ) : null}
        </div>
      </div>

      <LegalDataAccuracyModal
        open={showAccuracyModal}
        onConfirm={() => {
          setShowAccuracyModal(false);
          void submitCaptainRegistration();
        }}
        onCancel={() => setShowAccuracyModal(false)}
      />

      <SovereignPwaInstallModal
        isOpen={showPwaInstallModal}
        onClose={() => setShowPwaInstallModal(false)}
      />
    </main>
  );
}
