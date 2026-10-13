'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Languages, ShieldCheck } from 'lucide-react';
import { navigateAuth } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { mapSupabaseAuthError, signUpCaptainWithPhone, type CaptainProfileMetadata } from '@/features/auth/contract';
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
        // identityFile,
        // drivingLicenseFile,
      });

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
            <div className={styles.doneWrap}>
              <CheckCircle2 className={styles.doneIcon} aria-hidden="true" />
              <h2 className={styles.doneTitle}>{t('doneTitle')}</h2>
              <p className={styles.doneText}>{t('doneText')}</p>
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
