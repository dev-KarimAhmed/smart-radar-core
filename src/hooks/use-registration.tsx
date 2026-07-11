'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AffiliationType } from '@/core/types';
import { buildRiderSignUpMetadata, mapSupabaseAuthError, signInRiderWithPhone, signUpRiderWithPhone } from '@/lib/supabase-auth';
import { shouldRememberSupabaseSession, supabase } from '@/lib/supabase-client';
import { useDashboardLanguage } from './use-dashboard-language';
import { useToast } from './use-toast';

const isStrictDevelopment =
  (globalThis as any).process?.env?.NODE_ENV === 'development' ||
  ((process.env.NODE_ENV !== 'production') && process.env.MODE === 'development');

type RegistrationStep = 'role' | 'personal' | 'affiliation' | 'vehicle' | 'admin' | 'advertiser' | 'ProfessionalStep';
type RegistrationRole = 'rider' | 'driver' | 'advertiser' | 'delegate' | null;
type AuthMode = 'register' | 'login';
type LocationOption = { id: string; label: string; labelEn: string; value: string };

interface SupabaseCountryRow {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
  phone_code?: string | null;
  dial_code?: string | null;
  calling_code?: string | null;
  country_code?: string | null;
  iso2?: string | null;
  code?: string | null;
  example_phone?: string | null;
  phone_example?: string | null;
}

interface SupabaseGovernorateRow {
  id: number;
  country_id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
}

interface SupabaseDistrictRow {
  id: number;
  governorate_id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
}

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
  const [rememberMe, setRememberMe] = useState(() => shouldRememberSupabaseSession());
  const [advertiserProfile, setAdvertiserProfile] = useState({ companyName: '', commercialRegister: '', adLicense: '', businessType: 'commercial' });
  const [affiliation, setAffiliation] = useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = useState({ year: '', plate: '', sideId: '', make: '', color: '', officeName: '', officePhone: '', companyName: '', type: '', brand: '', model: '', employment_type: '', identity_url: '', contact_page_url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [countryRows, setCountryRows] = useState<SupabaseCountryRow[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<SupabaseCountryRow | null>(null);
  const [governorateRows, setGovernorateRows] = useState<SupabaseGovernorateRow[]>([]);
  const [districtRows, setDistrictRows] = useState<SupabaseDistrictRow[]>([]);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);

  const [countriesLoading, setCountriesLoading] = useState(false);
  const [governoratesLoading, setGovernoratesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const locationDataLoading = countriesLoading || governoratesLoading || districtsLoading;

  useEffect(() => {
    let active = true;

    async function detectSignupCountry() {
      try {
        const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as { country_code?: string; country?: string };
        const code = String(payload.country_code || payload.country || '').trim().toUpperCase();
        if (active && code) setDetectedCountryCode(code);
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[IP Country Detect]', error);
      }
    }

    void detectSignupCountry();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchCountries() {
      setCountriesLoading(true);

      try {
        const { data, error } = await supabase.from('countries').select('*').order('id', { ascending: true });
        if (error) throw error;
        if (active) setCountryRows(normalizeCountries(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Countries Fetch]', error);
        if (active) {
          toast({
            variant: 'destructive',
            title: 'تعذر تحميل الدول',
            description: 'تعذر تحميل قائمة الدول. يرجى المحاولة مرة أخرى.',
          });
        }
      } finally {
        if (active) setCountriesLoading(false);
      }
    }

    void fetchCountries();

    return () => {
      active = false;
    };
  }, [toast]);

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
    let active = true;
    const countryId = Number(personal.country);

    setGovernorateRows([]);
    setDistrictRows([]);
    setPersonal((current) => (current.gov || current.district ? { ...current, gov: '', district: '' } : current));

    if (!Number.isInteger(countryId) || countryId <= 0) {
      return;
    }

    async function fetchGovernorates() {
      setGovernoratesLoading(true);

      try {
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('country_id', countryId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setGovernorateRows(normalizeGovernorates(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Governorates Fetch]', error);
        if (active) {
          toast({
            variant: 'destructive',
            title: 'تعذر تحميل المحافظات',
            description: 'تعذر تحميل محافظات الدولة المختارة. يرجى المحاولة مرة أخرى.',
          });
        }
      } finally {
        if (active) setGovernoratesLoading(false);
      }
    }

    void fetchGovernorates();

    return () => {
      active = false;
    };
  }, [personal.country, toast]);

  useEffect(() => {
    let active = true;
    const governorateId = Number(personal.gov);

    setDistrictRows([]);
    setPersonal((current) => (current.district ? { ...current, district: '' } : current));

    if (!Number.isInteger(governorateId) || governorateId <= 0) {
      return;
    }

    async function fetchDistricts() {
      setDistrictsLoading(true);

      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .eq('governorate_id', governorateId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setDistrictRows(normalizeDistricts(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Districts Fetch]', error);
        if (active) {
          toast({
            variant: 'destructive',
            title: 'تعذر تحميل المناطق',
            description: 'تعذر تحميل مناطق المحافظة المختارة. يرجى المحاولة مرة أخرى.',
          });
        }
      } finally {
        if (active) setDistrictsLoading(false);
      }
    }

    void fetchDistricts();

    return () => {
      active = false;
    };
  }, [personal.gov, toast]);

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

  const phoneRule = useMemo(() => getPhoneRule(selectedCountry), [selectedCountry]);
  const phonePlaceholder = phoneRule.example;
  const phoneValidationHint =
    lang === 'ar'
      ? `اكتب الرقم بصيغة دولية مثل ${phoneRule.example}.`
      : `Use international format like ${phoneRule.example}.`;

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
    const demoPhone = getDemoPhoneForCountry(selectedCountry, serial);

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
          const { error: profileError } = await supabase.from('captain_profiles').insert({
            id: userId,
            vehicle_type: vehicle.type,
            vehicle_brand: vehicle.brand,
            vehicle_model: vehicle.model,
            vehicle_year: Number(vehicle.year) || null,
            plate_number: vehicle.plate,
            employment_type: vehicle.employment_type,
            identity_url: vehicle.identity_url,
            contact_page_url: vehicle.contact_page_url,
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
      setAuthMode('login');
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
    authMode,
    authPassword,
    districtRows,
    governorateRows,
    personal.country,
    personal.district,
    personal.gov,
    personal.name,
    personal.phone,
    rememberMe,
    role,
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

function normalizeCountries(rows: unknown): SupabaseCountryRow[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<SupabaseCountryRow>)
        .filter((row): row is SupabaseCountryRow => Number.isInteger(row.id))
    : [];
}

function normalizeGovernorates(rows: unknown): SupabaseGovernorateRow[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<SupabaseGovernorateRow>)
        .filter((row): row is SupabaseGovernorateRow => Number.isInteger(row.id) && Number.isInteger(row.country_id))
    : [];
}

function normalizeDistricts(rows: unknown): SupabaseDistrictRow[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<SupabaseDistrictRow>)
        .filter(
          (row): row is SupabaseDistrictRow =>
            Number.isInteger(row.id) && Number.isInteger(row.governorate_id),
        )
    : [];
}

function getLocationLabel(row: SupabaseCountryRow | SupabaseGovernorateRow | SupabaseDistrictRow, lang: 'ar' | 'en') {
  const preferred = lang === 'ar' ? row.name_ar : row.name_en;
  return preferred || row.name_ar || row.name_en || row.name || String(row.id);
}

function getCountryDialCode(country: SupabaseCountryRow) {
  const rawCode = country.phone_code || country.dial_code || country.calling_code || '';
  if (!rawCode) return '';
  return rawCode.startsWith('+') ? rawCode : `+${rawCode}`;
}

type PhoneRule = {
  dialCode: string;
  example: string;
  localRegex?: RegExp;
  message: string;
};

const COUNTRY_PHONE_RULES: Record<string, Omit<PhoneRule, 'dialCode'>> = {
  EG: {
    example: '\u200E+201234567890\u200E',
    localRegex: /^1[0125]\d{8}$/,
    message: 'اكتب رقم مصري صحيح مثل \u200E+201234567890\u200E.',
  },
  JO: {
    example: '\u200E+962791234567\u200E',
    localRegex: /^7[789]\d{7}$/,
    message: 'اكتب رقم أردني صحيح مثل \u200E+962791234567\u200E.',
  },
};

const COUNTRY_DIAL_OVERRIDES: Record<string, string> = {
  EG: '+20',
  JO: '+962',
};

const DEFAULT_PHONE_RULE: Omit<PhoneRule, 'dialCode'> = {
  example: '\u200E+962791234567\u200E',
  message: 'اكتب رقم الهاتف بصيغة دولية صحيحة.',
};

function getCountryIsoCode(country: SupabaseCountryRow | null) {
  if (!country) return '';
  const explicitCode = String(country.country_code || country.iso2 || country.code || '').slice(0, 2).toUpperCase();
  if (explicitCode) return explicitCode;

  const searchableText = [
    country.name_ar,
    country.name_en,
    country.name,
    country.phone_code,
    country.dial_code,
    country.calling_code,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (searchableText.includes('egypt') || searchableText.includes('مصر')) return 'EG';
  if (searchableText.includes('jordan') || searchableText.includes('اردن') || searchableText.includes('الأردن')) {
    return 'JO';
  }

  const dialDigits = getCountryDialCode(country).replace(/\D/g, '');
  if (dialDigits.startsWith('20')) return 'EG';
  if (dialDigits.startsWith('962')) return 'JO';

  return '';
}

function getPhoneRule(country: SupabaseCountryRow | null): PhoneRule {
  const isoCode = getCountryIsoCode(country);
  const dialCode = COUNTRY_DIAL_OVERRIDES[isoCode] || (country ? getCountryDialCode(country) : '');
  const staticRule = COUNTRY_PHONE_RULES[isoCode] || DEFAULT_PHONE_RULE;
  const fallbackExample = dialCode ? `${dialCode}123456789` : staticRule.example;
  const example = country?.example_phone || country?.phone_example || (COUNTRY_PHONE_RULES[isoCode] ? staticRule.example : fallbackExample);

  return {
    ...staticRule,
    dialCode: dialCode || inferDialCodeFromExample(example) || '+962',
    example,
  };
}

function normalizePhoneForCountry(rawPhone: string, country: SupabaseCountryRow | null) {
  const rule = country ? getPhoneRule(country) : inferPhoneRuleFromRaw(rawPhone) || getPhoneRule(country);
  const dialDigits = rule.dialCode.replace(/\D/g, '');
  const compact = rawPhone.trim().replace(/[\s().-]/g, '');
  const normalizedPrefix = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  const digits = normalizedPrefix.replace(/\D/g, '');

  if (!dialDigits) {
    return { ok: false as const, message: 'اختر الدولة أولاً حتى نتحقق من كود الهاتف.' };
  }

  let localDigits = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits;
  if (normalizedPrefix.startsWith('+') && !digits.startsWith(dialDigits)) {
    return { ok: false as const, message: rule.message };
  }

  localDigits = localDigits.replace(/^0+/, '');

  if (rule.localRegex && !rule.localRegex.test(localDigits)) {
    return { ok: false as const, message: rule.message };
  }

  const phone = `+${dialDigits}${localDigits}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return { ok: false as const, message: rule.message };
  }

  return { ok: true as const, phone };
}

function toSupabaseAuthRole(role: RegistrationRole): 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE' {
  if (role === 'driver') return 'CAPTAIN';
  if (role === 'advertiser') return 'ADVERTISER';
  if (role === 'delegate') return 'DELEGATE';
  return 'RIDER';
}

function inferPhoneRuleFromRaw(rawPhone: string): PhoneRule | null {
  const digits = rawPhone.trim().replace(/^00/, '').replace(/\D/g, '');
  if (digits.startsWith('20')) return { ...COUNTRY_PHONE_RULES.EG, dialCode: '+20' };
  if (digits.startsWith('962')) return { ...COUNTRY_PHONE_RULES.JO, dialCode: '+962' };
  return null;
}

function inferDialCodeFromExample(example: string) {
  const match = example.match(/\+(\d{1,4})/);
  return match ? `+${match[1]}` : '';
}

function getDemoPhoneForCountry(country: SupabaseCountryRow, serial: string) {
  const rule = getPhoneRule(country);
  if (getCountryIsoCode(country) === 'EG') return `+2012${serial.padStart(8, '0').slice(-8)}`;
  if (getCountryIsoCode(country) === 'JO') return `+96279${serial.padStart(7, '0').slice(-7)}`;

  const dialDigits = rule.dialCode.replace(/\D/g, '');
  return `+${dialDigits}${String(Date.now()).slice(-8)}`;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}

