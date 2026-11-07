'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { shouldRememberSupabaseSession } from '@/lib/supabase-client';
import { signInRiderWithPhone } from '../services/supabase-auth';
import {
  clearPendingCaptainReferral,
  storePendingCaptainReferral,
  removeReferralParamFromUrl,
} from '@/features/referral/services/captain-referral';
import {
  useSupabaseCountries,
  getCountryIsoCode,
  type SupabaseCountryRow,
} from './use-supabase-countries';
import {
  useSupabaseGovernorates,
  useSupabaseDistricts,
} from './use-supabase-locations';
import { useDetectedCountryCode } from './use-detected-country-code';
import { useTranslations } from "next-intl";
import type { AffiliationType } from '@/core/types';
import type {
  RegistrationStep,
  RegistrationRole,
  AuthMode,
  PersonalRegistrationState,
  RegistrationContextType,
} from '../types/registration-types';
import {
  getLocationLabel,
  getDemoPhoneForCountry,
  normalizePhoneForCountry,
  toSupabaseAuthRole,
} from '../utils/registration-helpers';
import { useRegistrationMockData } from './use-registration-mock-data';
import { useRegistrationAuthSubmit } from './use-registration-auth-submit';

// Re-export for any modules importing from here directly
export type {
  RegistrationStep,
  RegistrationRole,
  AuthMode,
  LocationOption,
  PersonalRegistrationState,
  RegistrationContextType,
} from '../types/registration-types';
export {
  getLocationLabel,
  normalizePhoneForCountry,
  toSupabaseAuthRole,
  getDemoPhoneForCountry,
} from '../utils/registration-helpers';

const isStrictDevelopment = process.env.NODE_ENV === 'development';

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const tAuto = useTranslations('auto');
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<RegistrationStep>('role');
  const [role, setRole] = useState<RegistrationRole>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const { language: lang, setLanguage: setLang } = useDashboardLanguage();

  const [personal, setPersonal] = useState<PersonalRegistrationState>({
    name: '',
    phone: '',
    email: '',
    country: '',
    gov: '',
    district: '',
    verificationDoc: '',
  });
  const [authPassword, setAuthPassword] = useState('');
  const [awaitingConfirmationEmail, setAwaitingConfirmationEmail] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [advertiserProfile, setAdvertiserProfile] = useState({
    companyName: '',
    commercialRegister: '',
    adLicense: '',
    businessType: 'commercial',
  });
  const [affiliation, setAffiliation] = useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = useState({
    year: '',
    plate: '',
    sideId: '',
    make: '',
    color: '',
    officeName: '',
    officePhone: '',
    companyName: '',
  });
  const [createAccountPulseKey, setCreateAccountPulseKey] = useState(0);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [selectedCountry, setSelectedCountry] = useState<SupabaseCountryRow | null>(null);
  const detectedCountryCode = useDetectedCountryCode();

  const verifyEmailCode = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'رمز تفعيل غير مكتمل' : 'Incomplete code',
        description: lang === 'ar' ? 'يرجى إدخال كود التفعيل المكون من 6 أرقام.' : 'Please enter the 6-digit activation code.',
      });
      return false;
    }

    const emailToVerify = (awaitingConfirmationEmail || personal.email)?.trim();
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          email: emailToVerify,
          phone: personal.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'كود التفعيل غير صحيح أو انتهت صلاحيته.');
      }

      toast({
        title: lang === 'ar' ? 'تم تفعيل الحساب بنجاح! 🎉' : 'Account activated successfully! 🎉',
        description: data.message || (lang === 'ar' ? 'تم تأكيد بريدك الإلكتروني بنجاح.' : 'Your email has been confirmed successfully.'),
      });

      if (personal.phone && authPassword) {
        try {
          await signInRiderWithPhone({
            phone: personal.phone,
            password: authPassword,
            rememberMe,
          });
          setAwaitingConfirmationEmail(null);
          router.replace('/');
          return true;
        } catch (loginErr) {
          console.warn('[Auto-login after OTP failed]', loginErr);
        }
      }

      setAwaitingConfirmationEmail(null);
      setAuthMode('login');
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'فشل تأكيد الكود' : 'Verification failed',
        description: err?.message || (lang === 'ar' ? 'كود التفعيل غير صحيح أو انتهت صلاحيته.' : 'Invalid or expired code.'),
      });
      return false;
    }
  };

  const resendConfirmationEmail = async (overrideEmail?: string) => {
    const emailToResend = (overrideEmail || awaitingConfirmationEmail || personal.email)?.trim();
    if (!emailToResend) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'البريد الإلكتروني غير متوفر' : 'Email missing',
        description: lang === 'ar' ? 'يرجى إدخال بريدك الإلكتروني لإعادة إرسال رسالة التأكيد.' : 'Please provide your email to resend confirmation.',
      });
      return false;
    }

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
        title: lang === 'ar' ? 'تم الإرسال بنجاح ✉️' : 'Sent successfully ✉️',
        description: data.message || (lang === 'ar' ? 'تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.' : 'New confirmation link sent to your email.'),
      });
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'خطأ أثناء الإرسال' : 'Dispatch error',
        description: err?.message || (lang === 'ar' ? 'تعذر إعادة إرسال رسالة التأكيد. حاول مرة أخرى لاحقاً.' : 'Failed to resend confirmation email.'),
      });
      return false;
    }
  };

  const { countryRows, loading: countriesLoading } = useSupabaseCountries({
    onError: () =>
      toast({
        variant: 'destructive',
        title: tAuto('key_2a3ac6a0'),
        description: tAuto('key_4a1a36ba'),
      }),
  });

  const countryIdNum = Number(personal.country) || null;
  const governorateIdNum = Number(personal.gov) || null;

  const { governorateRows, loading: governoratesLoading } = useSupabaseGovernorates(countryIdNum, {
    onError: () =>
      toast({
        variant: 'destructive',
        title: tAuto('key_64ee8ed7'),
        description: tAuto('key_4966bf15'),
      }),
  });

  const { districtRows, loading: districtsLoading } = useSupabaseDistricts(governorateIdNum, {
    onError: () =>
      toast({
        variant: 'destructive',
        title: tAuto('key_ae97e002'),
        description: tAuto('key_9a947721'),
      }),
  });

  const locationDataLoading = countriesLoading || governoratesLoading || districtsLoading;

  useEffect(() => {
    setRememberMe(shouldRememberSupabaseSession());
    if (typeof window !== 'undefined') {
      try {
        const isLoginRoute = window.location.pathname.includes('/login');
        if (isLoginRoute) {
          clearPendingCaptainReferral();
          removeReferralParamFromUrl();
          window.sessionStorage.removeItem('radar_newly_registered_referral');
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref') || params.get('captain');
        if (ref && ref.trim()) {
          storePendingCaptainReferral(ref.trim());
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (authMode === 'login') {
      clearPendingCaptainReferral();
      removeReferralParamFromUrl();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('radar_newly_registered_referral');
      }
    }
  }, [authMode]);

  useEffect(() => {
    const countryId = Number(personal.country);
    setSelectedCountry(countryRows.find((country) => country.id === countryId) || null);
  }, [countryRows, personal.country]);

  useEffect(() => {
    if (personal.country || !detectedCountryCode || countryRows.length === 0) return;

    const detectedCountry = countryRows.find((country) => getCountryIsoCode(country) === detectedCountryCode);
    if (!detectedCountry) return;

    setPersonal((current) =>
      current.country ? current : { ...current, country: String(detectedCountry.id), gov: '', district: '' },
    );
  }, [countryRows, detectedCountryCode, personal.country]);

  useEffect(() => {
    setPersonal((current) => (current.gov || current.district ? { ...current, gov: '', district: '' } : current));
  }, [personal.country]);

  useEffect(() => {
    setPersonal((current) => (current.district ? { ...current, district: '' } : current));
  }, [personal.gov]);

  const countries = useMemo(
    () =>
      countryRows.map((country) => ({
        id: String(country.id),
        label: getLocationLabel(country, 'ar'),
        labelEn: getLocationLabel(country, 'en'),
        value: String(country.id),
      })),
    [countryRows],
  );

  const governorates = useMemo(
    () =>
      governorateRows.map((governorate) => ({
        id: String(governorate.id),
        label: getLocationLabel(governorate, 'ar'),
        labelEn: getLocationLabel(governorate, 'en'),
        value: String(governorate.id),
      })),
    [governorateRows],
  );

  const districts = useMemo(
    () =>
      districtRows.map((district) => ({
        id: String(district.id),
        label: getLocationLabel(district, 'ar'),
        labelEn: getLocationLabel(district, 'en'),
        value: String(district.id),
      })),
    [districtRows],
  );

  const phonePlaceholder = useMemo(() => getDemoPhoneForCountry(selectedCountry), [selectedCountry]);
  const phoneValidationHint =
    lang === 'ar'
      ? tAuto('key_1a0de9e5')
      : "Write your number in your country's local format, or international format if you prefer";

  const { fillRandomRegistrationData, fillCaptainRegistrationData } = useRegistrationMockData({
    isStrictDevelopment,
    selectedCountry,
    countryRows,
    governorateRows,
    districtRows,
    personal,
    setPersonal,
    setAuthMode,
    setAuthPassword,
    setRole,
    affiliation,
    setAffiliation,
    setVehicle,
    toast,
    tAuto,
  });

  const { isSubmitting, submitSupabaseAuth } = useRegistrationAuthSubmit({
    personal,
    authPassword,
    rememberMe,
    role,
    authMode,
    affiliation,
    vehicle,
    selectedCountry,
    governorateRows,
    districtRows,
    router,
    toast,
    lang,
    tAuto,
    setAwaitingConfirmationEmail,
    setAuthMode,
    setCreateAccountPulseKey,
  });

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitSupabaseAuth();
  };
  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitSupabaseAuth();
  };
  const handleAdvertiserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: tAuto('key_002904c4'),
      description: tAuto('key_dea165fb'),
    });
  };

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (newCount >= 5) {
      setStep('admin');
      setLogoTapCount(0);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: tAuto('key_002904c4'),
      description: tAuto('key_91e1ce75'),
    });
  };

  const value = {
    step,
    setStep,
    role,
    setRole,
    authMode,
    setAuthMode,
    lang,
    setLang,
    personal,
    setPersonal,
    authPassword,
    setAuthPassword,
    rememberMe,
    setRememberMe,
    advertiserProfile,
    setAdvertiserProfile,
    affiliation,
    setAffiliation,
    vehicle,
    setVehicle,
    isSubmitting,
    locationDataLoading,
    countries,
    selectedCountry,
    phonePlaceholder,
    phoneValidationHint,
    governorates,
    districts,
    canUseDevMockData: isStrictDevelopment,
    fillRandomRegistrationData,
    fillCaptainRegistrationData,
    handlePersonalSubmit,
    handleVehicleSubmit,
    handleAdvertiserSubmit,
    adminCreds,
    setAdminCreds,
    handleAdminSubmit,
    handleLogoTap,
    createAccountPulseKey,
    awaitingConfirmationEmail,
    setAwaitingConfirmationEmail,
    resendConfirmationEmail,
    verifyEmailCode,
  };

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
