'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AffiliationType } from '@/core/types';
import { buildRiderSignUpMetadata, mapSupabaseAuthError, signInRiderWithPhone, signUpRiderWithPhone } from '../services/supabase-auth';
import { shouldRememberSupabaseSession, supabase } from '@/lib/supabase-client';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import {
  useSupabaseCountries,
  getCountryDialCode,
  getCountryIsoCode,
  type SupabaseCountryRow,
} from './use-supabase-countries';
import {
  useSupabaseGovernorates,
  useSupabaseDistricts,
  normalizeGovernorates,
  normalizeDistricts,
  type SupabaseGovernorateRow,
  type SupabaseDistrictRow,
} from './use-supabase-locations';
import { useDetectedCountryCode } from './use-detected-country-code';
import { parsePhoneNumberFromString, getExampleNumber, type CountryCode } from 'libphonenumber-js/min';
import phoneNumberExamples from 'libphonenumber-js/examples.mobile.json';

const styles = {
  root: "",
} as const;


const runtimeEnv = (import.meta as any).env || {};
const isStrictDevelopment =
  runtimeEnv.DEV === true ||
  runtimeEnv.MODE === 'development' ||
  (globalThis as any).process?.env?.NODE_ENV === 'development';

type RegistrationStep = 'role' | 'personal' | 'affiliation' | 'vehicle' | 'admin' | 'advertiser' | 'ProfessionalStep';
type RegistrationRole = 'rider' | 'driver' | 'advertiser' | 'delegate' | null;
type AuthMode = 'register' | 'login';
type LocationOption = { id: string; label: string; labelEn: string; value: string };

interface PersonalRegistrationState {
  name: string;
  phone: string;
  country: string;
  gov: string;
  district: string;
  verificationDoc: string;
}

interface RegistrationContextType {
  step: RegistrationStep;
  setStep: (step: RegistrationStep) => void;
  role: RegistrationRole;
  setRole: (role: RegistrationRole) => void;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  personal: PersonalRegistrationState;
  setPersonal: (personal: PersonalRegistrationState | ((current: PersonalRegistrationState) => PersonalRegistrationState)) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  advertiserProfile: { companyName: string; commercialRegister: string; adLicense: string; businessType: string };
  setAdvertiserProfile: (profile: any) => void;
  affiliation: AffiliationType | null;
  setAffiliation: (affiliation: any) => void;
  vehicle: any;
  setVehicle: (vehicle: any) => void;
  isSubmitting: boolean;
  locationDataLoading: boolean;
  countries: LocationOption[];
  selectedCountry: SupabaseCountryRow | null;
  phonePlaceholder: string;
  phoneValidationHint: string;
  governorates: LocationOption[];
  districts: LocationOption[];
  canUseDevMockData: boolean;
  fillRandomRegistrationData: () => void;
  fillCaptainRegistrationData: () => void;
  handlePersonalSubmit: (e: React.FormEvent) => void;
  handleVehicleSubmit: (e: React.FormEvent) => void;
  handleAdvertiserSubmit: (e: React.FormEvent) => void;
  adminCreds: any;
  setAdminCreds: (creds: any) => void;
  handleAdminSubmit: (e: React.FormEvent) => void;
  handleLogoTap: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<RegistrationStep>('role');
  const [role, setRole] = useState<RegistrationRole>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  // Language is owned by the shared LocaleProvider (persisted + synced app-wide),
  // so the auth/home flow and the role dashboards always agree on the language.
  const { language: lang, setLanguage: setLang } = useDashboardLanguage();
  const [personal, setPersonal] = useState<PersonalRegistrationState>({
    name: '',
    phone: '',
    country: '',
    gov: '',
    district: '',
    verificationDoc: '',
  });
  const [authPassword, setAuthPassword] = useState('');
  // Keep the first SSR/client render identical. Browser storage is hydrated
  // after mount so the remember-me preference cannot cause a hydration diff.
  const [rememberMe, setRememberMe] = useState(false);
  const [advertiserProfile, setAdvertiserProfile] = useState({ companyName: '', commercialRegister: '', adLicense: '', businessType: 'commercial' });
  const [affiliation, setAffiliation] = useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = useState({ year: '', plate: '', sideId: '', make: '', color: '', officeName: '', officePhone: '', companyName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [selectedCountry, setSelectedCountry] = useState<SupabaseCountryRow | null>(null);
  const detectedCountryCode = useDetectedCountryCode();

  const { countryRows, loading: countriesLoading } = useSupabaseCountries({
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'تعذر تحميل الدول',
        description: 'تعذر تحميل قائمة الدول. يرجى المحاولة مرة أخرى.',
      }),
  });
  const countryIdNum = Number(personal.country) || null;
  const governorateIdNum = Number(personal.gov) || null;
  const { governorateRows, loading: governoratesLoading } = useSupabaseGovernorates(countryIdNum, {
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'تعذر تحميل المحافظات',
        description: 'تعذر تحميل محافظات الدولة المختارة. يرجى المحاولة مرة أخرى.',
      }),
  });
  const { districtRows, loading: districtsLoading } = useSupabaseDistricts(governorateIdNum, {
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'تعذر تحميل المناطق',
        description: 'تعذر تحميل مناطق المحافظة المختارة. يرجى المحاولة مرة أخرى.',
      }),
  });
  const isSubmittingRef = useRef(false);

  const locationDataLoading = countriesLoading || governoratesLoading || districtsLoading;

  useEffect(() => {
    setRememberMe(shouldRememberSupabaseSession());
  }, []);

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

  // Clears the dependent fields whenever their parent selection changes; the
  // rows themselves are fetched by the hooks above, keyed off the same ids.
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
      ? 'اكتب رقمك بالصيغة المحلية لدولتك، أو بالنسق الدولي إن أحببت'
      : "Write your number in your country's local format, or international format if you prefer";

  const fillRandomRegistrationData = useCallback(() => {
    if (!isStrictDevelopment) return;

    if (!selectedCountry || !personal.gov || districtRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'المناطق غير جاهزة',
        description: 'اختر الدولة والمحافظة وانتظر تحميل المناطق ثم حاول مرة أخرى.',
      });
      return;
    }

    const dialCode = getCountryDialCode(selectedCountry);
    if (!dialCode) {
      toast({
        variant: 'destructive',
        title: 'كود الدولة غير متاح',
        description: 'بيانات الدولة المختارة لا تحتوي على كود هاتف.',
      });
      return;
    }

    const randomDistrict = districtRows[Math.floor(Math.random() * districtRows.length)];
    const serial = String(Date.now()).slice(-6);
    const demoPhone = getDemoPhoneForCountry(selectedCountry);

    setAuthMode('register');
    setPersonal((current) => ({
      ...current,
      name: `راكب تجربة ${serial}`,
      phone: demoPhone,
      country: String(selectedCountry.id),
      gov: personal.gov,
      district: String(randomDistrict.id),
    }));
    setAuthPassword(`Test${serial}!`);

    toast({
      title: 'تمت إضافة بيانات تجربة',
      description: 'تم اختيار منطقة من بيانات الدولة والمحافظة المختارة.',
    });
  }, [districtRows, personal.gov, selectedCountry, toast]);

  const fillCaptainRegistrationData = useCallback(async () => {
    const country =
      selectedCountry ||
      countryRows.find((row) => String(row.id) === personal.country) ||
      countryRows[0] ||
      null;

    let governorateOptions = governorateRows.filter((row) => row.country_id === country?.id);
    if (country && governorateOptions.length === 0) {
      const { data, error } = await supabase
        .from('governorates')
        .select('*')
        .eq('country_id', country.id)
        .order('id', { ascending: true });
      if (!error) {
        governorateOptions = normalizeGovernorates(data);
      }
    }

    const governorateId = Number(
      personal.gov && governorateOptions.some((row) => row.id === Number(personal.gov))
        ? personal.gov
        : governorateOptions[0]?.id,
    );

    let districtOptions = districtRows.filter((district) => district.governorate_id === governorateId);
    if (Number.isInteger(governorateId) && governorateId > 0 && districtOptions.length === 0) {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('governorate_id', governorateId)
        .order('id', { ascending: true });
      if (!error) {
        districtOptions = normalizeDistricts(data);
      }
    }

    const districtId = Number(
      personal.district && districtOptions.some((row) => row.id === Number(personal.district))
        ? personal.district
        : districtOptions[0]?.id,
    );

    if (!country || !Number.isInteger(governorateId) || !Number.isInteger(districtId)) {
      toast({
        variant: 'destructive',
        title: 'بيانات المنطقة غير جاهزة',
        description: 'انتظر تحميل الدولة والمحافظة والمنطقة، ثم جرّب إضافة بيانات الكابتن.',
      });
      return;
    }

    const serial = String(Date.now()).slice(-6);
    const demoPhone = getDemoPhoneForCountry(country);
    const plateSuffix = serial.slice(-4);

    setAuthMode('register');
    setRole('driver');
    setAffiliation(affiliation || 'smart-app');
    setPersonal((current) => ({
      ...current,
      name: `Captain Test ${serial}`,
      phone: demoPhone,
      country: String(country.id),
      gov: String(governorateId),
      district: String(districtId),
      verificationDoc: current.verificationDoc || 'dev-captain-license',
    }));
    setAuthPassword(`Captain${serial}!`);
    setVehicle((current: any) => ({
      ...current,
      make: 'Toyota Corolla',
      color: 'black',
      plate: `TEST-${plateSuffix}`,
      year: '2022',
      companyName: 'Smart Radar',
      officeName: 'Smart Radar Test Office',
      officePhone: demoPhone,
      sideId: `D-${plateSuffix}`,
    }));

    toast({
      title: 'تمت إضافة بيانات كابتن تجربة',
      description: 'تم تعبئة بيانات الحساب والسيارة للاختبار فقط.',
    });
  }, [
    affiliation,
    countryRows,
    districtRows,
    governorateRows,
    personal.country,
    personal.district,
    personal.gov,
    selectedCountry,
    toast,
  ]);

  const submitSupabaseAuth = useCallback(async () => {
    if (isSubmittingRef.current) return;

    const countryId = Number(personal.country);
    const governorateId = Number(personal.gov);
    const districtId = Number(personal.district);
    const selectedGovernorate = governorateRows.find(
      (governorate) => governorate.id === governorateId && governorate.country_id === countryId,
    );
    const selectedDistrict = districtRows.find(
      (district) => district.id === districtId && district.governorate_id === governorateId,
    );

    if (!personal.phone || !authPassword) {
      toast({
        variant: 'destructive',
        title: 'بيانات ناقصة',
        description: 'يرجى كتابة رقم الهاتف وكلمة المرور.',
      });
      return;
    }

    const normalizedPhone = normalizePhoneForCountry(personal.phone, selectedCountry);
    if (!normalizedPhone.ok) {
      toast({
        variant: 'destructive',
        title: 'رقم الهاتف غير صحيح',
        description: normalizedPhone.message,
      });
      return;
    }

    if (
      authMode === 'register' &&
      (!personal.name.trim() ||
        !Number.isInteger(countryId) ||
        !Number.isInteger(governorateId) ||
        !Number.isInteger(districtId) ||
        !selectedCountry ||
        !selectedGovernorate ||
        !selectedDistrict)
    ) {
      toast({
        variant: 'destructive',
        title: 'بيانات ناقصة',
        description: 'يرجى اختيار الدولة والمحافظة والمنطقة وكتابة الاسم الكامل.',
      });
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await signInRiderWithPhone({
          phone: normalizedPhone.phone,
          password: authPassword,
          rememberMe,
        });

        toast({
          title: 'تم تسجيل الدخول',
          description: 'أهلاً بك، تم فتح حسابك بنجاح.',
        });
        router.replace(role === 'driver' ? '/captain' : '/rider');
        return;
      }

      const signUpInput = {
        phone: normalizedPhone.phone,
        password: authPassword,
        fullName: personal.name.trim(),
        role: toSupabaseAuthRole(role),
        countryId,
        governorateId,
        districtId,
        rememberMe,
      };

      if ((process.env.NODE_ENV !== 'production')) {
        console.info('[Supabase Auth Payload]', {
          mode: 'register',
          data: buildRiderSignUpMetadata(signUpInput),
        });
      }

      const signUpResult = await signUpRiderWithPhone(signUpInput);

      if (role === 'driver') {
        const userId = signUpResult.user?.id;
        if (userId) {
          const isTaxi = affiliation === 'office-taxi';
          const { error: profileError } = await supabase.from('captain_profiles').insert({
            id: userId,
            vehicle_type: isTaxi ? 'تاكسي' : 'ملاكي',
            vehicle_brand: isTaxi ? null : vehicle.make,
            vehicle_color: isTaxi ? null : vehicle.color,
            vehicle_year: Number(vehicle.year) || null,
            plate_number: vehicle.plate,
            employment_type: isTaxi ? vehicle.officeName : vehicle.companyName,
            affiliation_type: affiliation,
            office_phone: isTaxi ? vehicle.officePhone : null,
            side_id: isTaxi ? vehicle.sideId : null,
            identity_url: personal.verificationDoc,
            verification_status: 'PENDING'
          });

          if (profileError) {
            console.error('[Captain Profile Insert Error]', profileError);
            throw new Error(profileError.message || 'تعذر حفظ بيانات الكابتن الإضافية.');
          }
        }
      }

      toast({
        title: 'تم إنشاء الحساب',
        description: role === 'driver'
          ? 'تم إنشاء حساب الكابتن وتقديم طلب الانضمام للمراجعة. يمكنك تسجيل الدخول الآن.'
          : 'تم حفظ بياناتك بأمان. يمكنك تسجيل الدخول الآن.',
      });
      if (signUpResult.session) {
        router.replace(role === 'driver' ? '/captain' : '/rider');
      } else {
        setAuthMode('login');
        router.replace('/');
      }
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) {
        const authError = error as { name?: string; code?: string; status?: number; message?: string };
        console.warn('[Supabase Auth]', {
          mode: authMode,
          role,
          name: authError?.name,
          code: authError?.code,
          status: authError?.status,
          message: authError?.message,
        });
      }

      toast({
        variant: 'destructive',
        title: authMode === 'register' ? 'تعذر إنشاء الحساب' : 'تعذر تسجيل الدخول',
        description: mapSupabaseAuthError(error),
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [
    affiliation,
    authMode,
    authPassword,
    districtRows,
    governorateRows,
    personal.country,
    personal.district,
    personal.gov,
    personal.name,
    personal.phone,
    personal.verificationDoc,
    rememberMe,
    role,
    router,
    selectedCountry,
    toast,
    vehicle,
  ]);

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
      title: 'غير مفعل الآن',
      description: 'تسجيل المعلن سيكتمل في مرحلة لاحقة.',
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
      title: 'غير مفعل الآن',
      description: 'دخول المشرف ليس ضمن خطوة Supabase الحالية.',
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
  };

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

function getLocationLabel(row: SupabaseCountryRow | SupabaseGovernorateRow | SupabaseDistrictRow, lang: 'ar' | 'en') {
  const preferred = lang === 'ar' ? row.name_ar : row.name_en;
  return preferred || row.name_ar || row.name_en || row.name || String(row.id);
}

// Same libphonenumber-js validation the captain onboarding form uses (see
// src/features/captain/lib/captain-registration-schema.ts), so a phone that's
// valid in one flow is valid in the other. Local-format numbers (e.g. a
// leading "0") are accepted as long as a country is selected.
function normalizePhoneForCountry(rawPhone: string, country: SupabaseCountryRow | null) {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { ok: false as const, message: 'اكتب رقم الهاتف.' };
  }

  const isoCode = getCountryIsoCode(country) as CountryCode | undefined;

  try {
    const parsed = parsePhoneNumberFromString(trimmed, isoCode || undefined);
    if (!parsed || !parsed.isValid()) {
      return {
        ok: false as const,
        message: isoCode
          ? 'رقم الهاتف غير صحيح لهذه الدولة، اكتبه بالنسق المحلي أو الدولي.'
          : 'اختر الدولة أولاً حتى نتحقق من رقم الهاتف.',
      };
    }

    return { ok: true as const, phone: parsed.number };
  } catch {
    return { ok: false as const, message: 'رقم الهاتف غير صحيح.' };
  }
}

function toSupabaseAuthRole(role: RegistrationRole): 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE' {
  if (role === 'driver') return 'CAPTAIN';
  if (role === 'advertiser') return 'ADVERTISER';
  if (role === 'delegate') return 'DELEGATE';
  return 'RIDER';
}

function getDemoPhoneForCountry(country: SupabaseCountryRow | null): string {
  const isoCode = getCountryIsoCode(country) as CountryCode | undefined;
  if (isoCode) {
    const example = getExampleNumber(isoCode, phoneNumberExamples);
    if (example) return example.number;
  }

  return '+962790000000';
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}

