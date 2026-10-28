'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Languages, ShieldCheck, MailCheck, Mail, Loader2, RefreshCw, Clock, Check } from 'lucide-react';
import { navigateAuth } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { mapSupabaseAuthError, signUpCaptainWithPhone, signInRiderWithPhone, verifyEmailOtpCode, type CaptainProfileMetadata } from '@/features/auth/contract';
import type { AffiliationType } from '@/core/types';
import { CaptainPersonalStep, type CaptainPersonalValues } from './captain-personal-step';
import { CaptainAffiliationStep } from './captain-affiliation-step';
import { CaptainVehicleStep, type CaptainVehicleValues } from './captain-vehicle-step';

const REMEMBER_ME_STORAGE_KEY = 'radar_captain_remember_me';

type OnboardingStep = 1 | 2 | 3 | 'done';

const emptyPersonal: CaptainPersonalValues = {
  name: '',
  nickname: '',
  phone: '',
  email: '',
  password: '',
  country: '',
  countryIso: '',
  governorate: '',
  district: '',
};
const emptyVehicle: CaptainVehicleValues = {
  officeName: '',
  officePhone: '',
  sideId: '',
  companyName: '',
  companyCode: '',
  make: '',
  model: '',
  color: '#14b8a6',
  plate: '',
  year: '',
  nationalIdNumber: '',
  licenseNumber: '',
  facebookUrl: '',
  instagramUrl: '',
};

function readStoredRememberMe(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) !== 'false';
}

const styles = {
  hydrationShell: 'flex min-h-screen w-full items-center justify-center bg-[#0B0F19]',
  hydrationSpinner: 'h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6]/25 border-t-[#14B8A6]',
  main: 'relative min-h-screen overflow-hidden bg-[#0B0F19] text-slate-100',
  glow: 'pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(45,212,191,0.08),transparent_28%)]',
  langButton:
    'fixed top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#161F30]/70 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
  langButtonAr: 'left-4',
  langButtonEn: 'right-4',
  langIcon: 'h-4 w-4 text-[#14B8A6]',
  wrap: 'relative z-10 flex min-h-screen w-full items-center justify-center px-0 py-0 sm:px-6 sm:py-10',
  card: 'flex min-h-screen w-full max-w-md flex-col justify-center rounded-none border border-white/5 bg-[#161F30]/70 p-6 shadow-2xl backdrop-blur-xl sm:my-12 sm:min-h-0 sm:rounded-3xl sm:p-8',
  header: 'mb-6 text-center',
  badge: 'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]',
  badgeIcon: 'h-7 w-7',
  brand: 'text-sm font-bold text-[#14B8A6]',
  title: 'mt-3 text-2xl font-black tracking-normal text-[#F8FAFC]',
  subtitle: 'mt-2 text-sm font-medium leading-6 text-[#94A3B8]',
  stepRow: 'flex justify-between items-center text-xs text-slate-400 mb-4 bg-white/5 border border-white/10 rounded-2xl p-3',
  stepLabel: 'font-bold text-[#14B8A6]',
  stepName: 'font-bold text-[#94A3B8]',
  hasAccountRow: 'mt-6 text-center text-sm font-semibold text-[#94A3B8]',
  hasAccountLink: 'font-black text-[#14B8A6] underline-offset-4 transition hover:text-[#2DD4BF] hover:underline',
  backLink: 'mt-5 w-full text-xs font-bold text-[#94A3B8]/70 transition hover:text-white',
  doneWrap: 'flex flex-col items-center text-center gap-3 py-6',
  doneIcon: 'h-14 w-14 text-[#14B8A6]',
  doneTitle: 'text-lg font-black text-[#F8FAFC]',
  doneText: 'text-sm font-medium leading-6 text-[#94A3B8]',
} as const;

export function CaptainOnboarding() {
  const t = useTranslations('captainOnboarding');
  const { isArabic, setLanguage } = useDashboardLanguage();
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [step, setStep] = React.useState<OnboardingStep>(1);
  const [personal, setPersonal] = React.useState<CaptainPersonalValues>(emptyPersonal);
  const [rememberMe, setRememberMe] = React.useState<boolean>(readStoredRememberMe);
  const [affiliation, setAffiliation] = React.useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = React.useState<CaptainVehicleValues>(emptyVehicle);
  // Document image uploads are disabled for now — see captain-vehicle-step.tsx.
  // const [identityFile, setIdentityFile] = React.useState<File | null>(null);
  // const [drivingLicenseFile, setDrivingLicenseFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [vehicleErrors, setVehicleErrors] = React.useState<Record<string, string>>({});
  const [confirmedEmail, setConfirmedEmail] = React.useState<string | null>(null);
  const [captainOtpInput, setCaptainOtpInput] = React.useState('');
  const [isVerifyingCaptainOtp, setIsVerifyingCaptainOtp] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState<number>(0);
  const [isResending, setIsResending] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleVerifyCaptainOtp = async () => {
    const cleanCode = captainOtpInput.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6 || isVerifyingCaptainOtp) return;
    setIsVerifyingCaptainOtp(true);
    try {
      await verifyEmailOtpCode({
        code: cleanCode,
        email: confirmedEmail || personal.email.trim(),
        phone: personal.phone,
      });
      toast({
        title: isArabic ? 'تم تأكيد الحساب بنجاح! 🎉' : 'Account activated successfully! 🎉',
        description: isArabic ? 'تم تفعيل بريدك الإلكتروني بنجاح.' : 'Your email has been confirmed successfully.',
      });
      try {
        await signInRiderWithPhone({
          phone: personal.phone,
          password: personal.password,
          rememberMe,
        });
        window.location.replace('/captain');
        return;
      } catch (loginErr) {
        console.warn('[Captain auto-login after OTP]', loginErr);
      }
      navigateAuth('login', 'driver');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل تأكيد الكود' : 'Verification failed',
        description: err?.message || (isArabic ? 'كود التفعيل غير صحيح أو انتهت صلاحيته.' : 'Invalid or expired code.'),
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
        body: JSON.stringify({ email: emailToResend, phone: personal.phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر إعادة إرسال رسالة التأكيد.');
      }
      toast({
        title: isArabic ? 'تم الإرسال بنجاح ✉️' : 'Sent successfully ✉️',
        description: data.message || (isArabic ? 'تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.' : 'New confirmation link sent to your email.'),
      });
      setResendCountdown(60);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ أثناء الإرسال' : 'Dispatch error',
        description: err?.message || (isArabic ? 'تعذر إعادة إرسال رسالة التأكيد.' : 'Failed to resend email.'),
      });
    } finally {
      setIsResending(false);
    }
  };
  const { toast } = useToast();

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleRememberMeChange = (value: boolean) => {
    setRememberMe(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, value ? 'true' : 'false');
    }
  };

  const submitCaptainRegistration = async () => {
    if (!personal.country || !personal.governorate || !personal.district || !affiliation) return;

    setVehicleErrors({});
    setIsSubmitting(true);

    try {
      const { supabase } = await import('@/lib/supabase-client');

      // Pre-check national ID number, driver license number, vehicle plate, and email uniqueness via Security Definer RPC
      const trimmedNatId = vehicle.nationalIdNumber.trim();
      const trimmedLic = vehicle.licenseNumber.trim();
      const trimmedPlate = vehicle.plate.trim();
      const cleanEmail = personal.email?.trim().toLowerCase() || null;
      const cleanPhone = personal.phone?.trim() || null;

      if (trimmedNatId || trimmedLic || trimmedPlate || cleanEmail || cleanPhone) {
        const { data: availability, error: rpcError } = await supabase.rpc('check_captain_identity_available', {
          p_national_id: trimmedNatId || null,
          p_license_number: trimmedLic || null,
          p_plate_number: trimmedPlate || null,
          p_email: cleanEmail,
          p_phone: cleanPhone,
        });

        if (!rpcError && availability) {
          if (availability.phone_taken) {
            toast({
              variant: 'destructive',
              title: t('errorTitle'),
              description: 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر. يرجى تسجيل الدخول أو استخدام رقم آخر.',
            });
            setStep(1);
            setIsSubmitting(false);
            return;
          }

          if (availability.email_taken) {
            toast({
              variant: 'destructive',
              title: t('errorTitle'),
              description: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.',
            });
            setStep(1);
            setIsSubmitting(false);
            return;
          }

          const newErrors: Record<string, string> = {};

          if (availability.national_id_taken) {
            newErrors.nationalIdNumber = 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
          }
          if (availability.license_taken) {
            newErrors.licenseNumber = 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
          }
          if (availability.plate_taken) {
            newErrors.plate = 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى. يرجى التأكد من اللوحة أو استخدام رقم آخر.';
          }

          if (Object.keys(newErrors).length > 0) {
            setVehicleErrors(newErrors);
            toast({
              variant: 'destructive',
              title: t('errorTitle'),
              description: newErrors.plate || newErrors.nationalIdNumber || newErrors.licenseNumber,
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      const isTaxi = affiliation === 'office-taxi';
      const isIndependent = affiliation === 'independent';
      const captainProfile: CaptainProfileMetadata = {
        vehicle_type: isTaxi ? 'TAXI' : 'PRIVATE',
        vehicle_brand: isTaxi ? null : vehicle.make.trim() || null,
        vehicle_model: vehicle.model.trim() || null,
        vehicle_color: isTaxi ? null : vehicle.color.trim() || null,
        vehicle_year: Number(vehicle.year) || null,
        plate_number: vehicle.plate.trim() || null,
        employment_type: isTaxi ? vehicle.officeName.trim() || null : isIndependent ? 'مستقل' : vehicle.companyName.trim() || null,
        affiliation_type: affiliation,
        office_phone: isTaxi ? vehicle.officePhone.trim() || null : null,
        side_id: isTaxi ? vehicle.sideId.trim() || null : null,
        company_code: isTaxi || isIndependent ? null : vehicle.companyCode.trim() || null,
        identity_url: null,
        contact_page_url: null,
        driving_license_url: null,
        national_id_number: trimmedNatId || null,
        license_number: trimmedLic || null,
        nickname: personal.nickname.trim() || null,
        facebook_url: vehicle.facebookUrl.trim() || null,
        instagram_url: vehicle.instagramUrl.trim() || null,
        verification_status: 'PENDING',
      };

      const result = await signUpCaptainWithPhone({
        phone: personal.phone,
        password: personal.password,
        fullName: personal.name,
        email: personal.email?.trim() || undefined,
        countryId: Number(personal.country),
        governorateId: Number(personal.governorate),
        districtId: Number(personal.district),
        rememberMe,
        captainProfile,
      });

      if ((result as any).needsEmailConfirmation) {
        setConfirmedEmail(personal.email.trim());
        setStep('done');
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
        if (personal.email?.trim().includes('@')) {
          const { getAuthRedirectUrl } = await import('@/lib/utils');
          const { error: emailError } = await supabase.auth.updateUser(
            { email: personal.email.trim() },
            { emailRedirectTo: getAuthRedirectUrl('/reset-password') },
          );
          if (emailError && (process.env.NODE_ENV !== 'production')) {
            console.warn('[Registration Email Update Error]', emailError);
          }
        }
        window.location.replace('/captain');
      } else {
        navigateAuth('login', 'driver');
      }
    } catch (error) {
      let errorMsg = mapSupabaseAuthError(error);
      const errText = `${errorMsg} ${JSON.stringify(error || '')}`.toLowerCase();
      const newVehicleErrors: Record<string, string> = {};

      if (errText.includes('national_id') || errText.includes('هوية')) {
        newVehicleErrors.nationalIdNumber = 'رقم الهوية الوطنية مسجل بالفعل مسبقاً.';
      }
      if (errText.includes('license') || errText.includes('رخصة')) {
        newVehicleErrors.licenseNumber = 'رقم رخصة القيادة مسجل بالفعل مسبقاً.';
      }
      if (errText.includes('plate') || errText.includes('لوحة')) {
        newVehicleErrors.plate = 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.';
      }

      if (
        errText.includes('unique_email') ||
        errText.includes('missing_email') ||
        (errText.includes('email') && (errText.includes('مسجل') || errText.includes('مسبق') || errText.includes('already exists') || errText.includes('taken')))
      ) {
        errorMsg = 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.';
        setStep(1);
      }

      // If generic DB error occurred, verify via RPC if it was caused by identity, plate, or email uniqueness
      if (Object.keys(newVehicleErrors).length === 0) {
        try {
          const { supabase } = await import('@/lib/supabase-client');
          const { data: availability } = await supabase.rpc('check_captain_identity_available', {
            p_national_id: vehicle.nationalIdNumber.trim() || null,
            p_license_number: vehicle.licenseNumber.trim() || null,
            p_plate_number: vehicle.plate.trim() || null,
            p_email: personal.email?.trim().toLowerCase() || null,
            p_phone: personal.phone?.trim() || null,
          });
          if (availability?.phone_taken) {
            errorMsg = 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.';
            setStep(1);
          }
          if (availability?.email_taken) {
            errorMsg = 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.';
            setStep(1);
          }
          if (availability?.national_id_taken) {
            newVehicleErrors.nationalIdNumber = 'رقم الهوية الوطنية مسجل بالفعل مسبقاً.';
            errorMsg = 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
          }
          if (availability?.license_taken) {
            newVehicleErrors.licenseNumber = 'رقم رخصة القيادة مسجل بالفعل مسبقاً.';
            errorMsg = 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
          }
          if (availability?.plate_taken) {
            newVehicleErrors.plate = 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.';
            errorMsg = 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى. يرجى التأكد من اللوحة أو استخدام رقم آخر.';
          }
        } catch {}
      }

      if (Object.keys(newVehicleErrors).length > 0) {
        setVehicleErrors(newVehicleErrors);
      }

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // The locale and remember-me preference are restored from browser storage
  // after mount. Keep the first render identical on the server and client so
  // Next.js never hydrates two different onboarding trees.
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
              // identityFile={identityFile}
              // onIdentityFileChange={setIdentityFile}
              // drivingLicenseFile={drivingLicenseFile}
              // onDrivingLicenseFileChange={setDrivingLicenseFile}
              onBack={() => setStep(2)}
              onSubmit={() => void submitCaptainRegistration()}
              isSubmitting={isSubmitting}
              country={personal.countryIso}
            />
          ) : (
            <div className="text-center space-y-6 py-6 animate-in fade-in duration-200">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#14B8A6]/25 to-teal-500/10 border border-[#14B8A6]/40 text-[#14F5D5] shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                <MailCheck className="h-10 w-10 animate-pulse drop-shadow-[0_0_10px_rgba(20,245,213,0.6)]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">
                  {isArabic ? 'تأكيد وتفعيل الحساب' : 'Account Activation'}
                </h2>
                <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {isArabic
                    ? 'أرسلنا كود تفعيل مكون من 6 أرقام إلى بريدك الإلكتروني لتأكيد حسابك:'
                    : 'A 6-digit activation code was sent to your email to verify your account:'}
                </p>
              </div>

              {confirmedEmail && (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 px-4 py-2 text-xs font-bold font-mono text-[#14F5D5]" dir="ltr">
                  <Mail className="h-4 w-4" />
                  <span>{confirmedEmail}</span>
                </div>
              )}

              {/* 6-digit OTP Code Input Card */}
              <div className="rounded-2xl border border-emerald-500/30 bg-black/50 p-4 space-y-3.5" dir={isArabic ? 'rtl' : 'ltr'}>
                <label className="block text-xs font-bold text-slate-200 text-center">
                  {isArabic ? 'أدخل كود التفعيل المكون من 6 أرقام:' : 'Enter the 6-digit verification code:'}
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={captainOtpInput}
                  onChange={(e) => setCaptainOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  dir="ltr"
                  className="w-full h-13 rounded-xl border-2 border-[#14B8A6]/50 bg-black/70 px-4 text-center font-mono text-2xl sm:text-3xl font-black text-[#14F5D5] tracking-[0.4em] focus:border-[#14F5D5] focus:outline-none focus:ring-2 focus:ring-[#14F5D5]/30 transition-all placeholder:tracking-normal placeholder:text-slate-600 shadow-inner"
                />

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-300">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400 animate-pulse" />
                  <span>{isArabic ? 'الكود صالح لمدة 15 دقيقة فقط' : 'Code is valid for 15 minutes only'}</span>
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  disabled={captainOtpInput.trim().length !== 6 || isVerifyingCaptainOtp}
                  onClick={handleVerifyCaptainOtp}
                  className="w-full min-h-12 flex items-center justify-center gap-2 rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] active:scale-95 text-[#0B0F19] font-black text-sm transition shadow-[0_10px_25px_rgba(20,184,166,0.35)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isVerifyingCaptainOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" />
                  ) : (
                    <Check className="h-4 w-4 stroke-[3]" />
                  )}
                  <span>{isArabic ? 'تأكيد الكود وتفعيل الحساب 🚀' : 'Confirm & Activate 🚀'}</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={isResending || resendCountdown > 0}
                  onClick={handleResendConfirmation}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 h-11 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#14F5D5]" />
                  ) : (
                    <RefreshCw className={cn("h-4 w-4 text-[#14F5D5]", resendCountdown > 0 ? "" : "hover:rotate-180 transition-transform")} />
                  )}
                  <span>
                    {resendCountdown > 0
                      ? (isArabic ? `إعادة الإرسال خلال (${resendCountdown} ثانية)` : `Resend in (${resendCountdown}s)`)
                      : (isArabic ? 'إعادة إرسال كود التفعيل' : 'Resend activation code')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateAuth('login', 'driver')}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-transparent hover:bg-white/5 active:scale-95 h-10 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <span>{isArabic ? 'الانتقال إلى تسجيل الدخول' : 'Go to login'}</span>
                </button>
              </div>
            </div>
          )}

          {step !== 'done' ? (
            <p className={styles.hasAccountRow}>
              <span>{t('hasAccountPrompt')}</span>{' '}
              <button type="button" className={styles.hasAccountLink} onClick={() => navigateAuth('login', 'driver')}>
                {t('goToLogin')}
              </button>
            </p>
          ) : null}

          <button type="button" className={styles.backLink} onClick={() => navigateAuth('role')}>
            {t('backToRole')}
          </button>
        </div>
      </section>
    </main>
  );
}
