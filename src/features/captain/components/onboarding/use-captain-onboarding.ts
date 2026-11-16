import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { mapSupabaseAuthError } from '@/features/auth/contract';
import { navigateAuth } from '@/lib/auth-routing';
import type { AffiliationType } from '@/core/types';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import type { CaptainPersonalValues } from './captain-personal-step';
import type { CaptainVehicleValues } from './captain-vehicle-step';
import {
  REMEMBER_ME_STORAGE_KEY,
  OnboardingStep,
  emptyPersonal,
  emptyVehicle,
  readStoredRememberMe,
} from './captain-onboarding-types';
import {
  checkCaptainIdentityAvailable,
  submitCaptainSignUp,
} from './captain-onboarding-service';
import { useCaptainActivationOtp } from './use-captain-activation-otp';

export function useCaptainOnboarding(isArabic: boolean) {
  const t = useTranslations('captainOnboarding');
  const { toast } = useToast();

  const [step, setStep] = React.useState<OnboardingStep>(1);
  const [showAccuracyModal, setShowAccuracyModal] = React.useState(false);
  const [personal, setPersonal] = React.useState<CaptainPersonalValues>(emptyPersonal);
  const [rememberMe, setRememberMe] = React.useState<boolean>(readStoredRememberMe);
  const [affiliation, setAffiliation] = React.useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = React.useState<CaptainVehicleValues>(emptyVehicle);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [vehicleErrors, setVehicleErrors] = React.useState<Record<string, string>>({});

  const {
    confirmedEmail,
    setConfirmedEmail,
    captainOtpInput,
    setCaptainOtpInput,
    isVerifyingCaptainOtp,
    resendCountdown,
    isResending,
    handleVerifyCaptainOtp,
    handleResendConfirmation,
  } = useCaptainActivationOtp({
    personal,
    rememberMe,
    isArabic,
  });

  const handleRememberMeChange = (value: boolean) => {
    setRememberMe(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, value ? 'true' : 'false');
    }
  };

  const handleOpenAccuracyAfterValidation = async () => {
    if (isSubmitting) return;

    if (!personal.country || !personal.governorate || !personal.district) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: isArabic
          ? 'يرجى استكمال بيانات الموقع (الدولة والمحافظة واللواء) في الخطوة الأولى أولاً.'
          : 'Please complete your location details (Country, Governorate, District) in Step 1 first.',
      });
      setStep(1);
      return;
    }

    if (!affiliation) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: isArabic ? 'يرجى اختيار صفة العمل أولاً.' : 'Please select your work affiliation first.',
      });
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const check = await checkCaptainIdentityAvailable(personal, vehicle);
      if (!check.isAvailable) {
        setVehicleErrors(check.fieldErrors);
        toast({
          variant: 'destructive',
          title: t('errorTitle'),
          description: check.errorMessage,
        });
        if (check.stepToReset) setStep(check.stepToReset as OnboardingStep);
        return;
      }
      setShowAccuracyModal(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: mapSupabaseAuthError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCaptainRegistration = async () => {
    if (isSubmitting) return;

    if (!personal.country || !personal.governorate || !personal.district || !affiliation) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: isArabic ? 'بيانات التسجيل غير مكتملة.' : 'Registration data is incomplete.',
      });
      return;
    }

    setVehicleErrors({});
    setIsSubmitting(true);

    try {
      const check = await checkCaptainIdentityAvailable(personal, vehicle);
      if (!check.isAvailable) {
        setVehicleErrors(check.fieldErrors);
        toast({
          variant: 'destructive',
          title: t('errorTitle'),
          description: check.errorMessage,
        });
        if (check.stepToReset) setStep(check.stepToReset as OnboardingStep);
        return;
      }

      const result = await submitCaptainSignUp(personal, vehicle, affiliation, rememberMe);

      if ((result as any).needsEmailConfirmation) {
        setConfirmedEmail(personal.email.trim());
        setStep('done');
        const captainId = result.user?.id;
        if (captainId) {
          void recordLegalDeclaration({
            userId: captainId,
            userSerialId: (result.user as any)?.serial_id || `D-${captainId.slice(0, 6).toUpperCase()}`,
            actionType: 'NEW_ACCOUNT',
            actionLabel: isArabic ? 'تسجيل كابتن جديد' : 'New Captain Registration',
            isArabic,
          });
        }
        toast({
          title: isArabic ? 'تم إنشاء الحساب بنجاح! ✉️' : 'Account created successfully! ✉️',
          description: isArabic
            ? 'يرجى مراجعة بريدك الإلكتروني والضغط على رابط التفعيل لتأكيد الحساب.'
            : 'Please check your email and click the confirmation link to activate your account.',
        });
        return;
      }

      toast({
        title: t('successTitle'),
        description: t(result.session ? 'successDescription' : 'successNeedsLogin'),
      });

      if (result.session) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
          } catch {}
        }
        if (personal.email?.trim().includes('@')) {
          const { supabase } = await import('@/lib/supabase-client');
          const { getAuthRedirectUrl } = await import('@/lib/utils');
          await supabase.auth.updateUser(
            { email: personal.email.trim() },
            { emailRedirectTo: getAuthRedirectUrl('/reset-password') },
          );
        }
        window.location.replace('/captain');
      } else {
        navigateAuth('login', 'driver');
      }
    } catch (error) {
      let errorMsg = mapSupabaseAuthError(error);
      const errText = `${errorMsg} ${JSON.stringify(error || '')}`.toLowerCase();
      const newVehicleErrors: Record<string, string> = {};

      if (errText.includes('national_id') || errText.includes('هوية')) newVehicleErrors.nationalIdNumber = 'رقم الهوية الوطنية مسجل بالفعل مسبقاً.';
      if (errText.includes('license') || errText.includes('رخصة')) newVehicleErrors.licenseNumber = 'رقم رخصة القيادة مسجل بالفعل مسبقاً.';
      if (errText.includes('plate') || errText.includes('لوحة')) newVehicleErrors.plate = 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.';

      if (errText.includes('unique_email') || errText.includes('missing_email') || (errText.includes('email') && (errText.includes('مسجل') || errText.includes('already exists')))) {
        errorMsg = 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.';
        setStep(1);
      }

      if (Object.keys(newVehicleErrors).length > 0) setVehicleErrors(newVehicleErrors);

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
