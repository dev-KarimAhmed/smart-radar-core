'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AffiliationType } from '@/core/types';
import { buildRiderSignUpMetadata, mapSupabaseAuthError, signInRiderWithPhone, signUpRiderWithPhone } from '@/lib/supabase-auth';
import { shouldRememberSupabaseSession, supabase } from '@/lib/supabase-client';
import { useToast } from './use-toast';

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
  governorates: LocationOption[];
  districts: LocationOption[];
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
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
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
  const [vehicle, setVehicle] = useState({ year: '', plate: '', sideId: '', make: '', color: '', officeName: '', officePhone: '', companyName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [countryRows, setCountryRows] = useState<SupabaseCountryRow[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<SupabaseCountryRow | null>(null);
  const [governorateRows, setGovernorateRows] = useState<SupabaseGovernorateRow[]>([]);
  const [districtRows, setDistrictRows] = useState<SupabaseDistrictRow[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [governoratesLoading, setGovernoratesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const locationDataLoading = countriesLoading || governoratesLoading || districtsLoading;

  useEffect(() => {
    let active = true;

    async function fetchCountries() {
      setCountriesLoading(true);

      try {
        const { data, error } = await supabase.from('countries').select('*').order('id', { ascending: true });
        if (error) throw error;
        if (active) setCountryRows(normalizeCountries(data));
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[Supabase Countries Fetch]', error);
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
        if (import.meta.env.DEV) console.warn('[Supabase Governorates Fetch]', error);
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
        if (import.meta.env.DEV) console.warn('[Supabase Districts Fetch]', error);
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

  const fillRandomRegistrationData = useCallback(() => {
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
    const phoneSuffix = String(Math.floor(1000000 + Math.random() * 9000000));

    setAuthMode('register');
    setPersonal((current) => ({
      ...current,
      name: `راكب تجربة ${serial}`,
      phone: `${dialCode}${phoneSuffix}`,
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

  const submitRiderAuth = useCallback(async () => {
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
        description: 'يرجى اختيار الدولة والمحافظة والمنطقة وكتابة الاسم.',
      });
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await signInRiderWithPhone({
          phone: personal.phone,
          password: authPassword,
          rememberMe,
        });

        toast({
          title: 'تم تسجيل الدخول',
          description: 'أهلا بك، تم فتح لوحة الراكب.',
        });
        return;
      }

      const signUpInput = {
        phone: personal.phone,
        password: authPassword,
        fullName: personal.name.trim(),
        countryId,
        governorateId,
        districtId,
        rememberMe,
      };

      if (import.meta.env.DEV) {
        console.info('[Supabase Auth Payload]', {
          mode: 'register',
          data: buildRiderSignUpMetadata(signUpInput),
        });
      }

      await signUpRiderWithPhone(signUpInput);

      toast({
        title: 'تم إنشاء الحساب',
        description: 'تم إرسال بياناتك بأمان. يمكنك تسجيل الدخول الآن إذا طلب النظام التأكيد.',
      });
      setAuthMode('login');
    } catch (error) {
      if (import.meta.env.DEV) {
        const authError = error as { name?: string; code?: string; status?: number; message?: string };
        console.warn('[Supabase Auth]', {
          mode: authMode,
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
    selectedCountry,
    toast,
  ]);

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (role && role !== 'rider') {
      toast({
        variant: 'destructive',
        title: 'هذه الخطوة للراكب فقط',
        description: 'تكامل Supabase الحالي مخصص لتسجيل ودخول الراكب في هذه المرحلة.',
      });
      return;
    }

    void submitRiderAuth();
  };

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: 'غير مفعل الآن',
      description: 'هذه المرحلة مخصصة لدخول الراكب فقط. سيتم ربط السائق لاحقا.',
    });
  };

  const handleAdvertiserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: 'غير مفعل الآن',
      description: 'هذه المرحلة مخصصة لدخول الراكب فقط. سيتم ربط المعلن لاحقا.',
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
    governorates,
    districts,
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

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
