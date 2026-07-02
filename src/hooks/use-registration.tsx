'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AffiliationType } from '@/core/types';
import { buildRiderSignUpMetadata, mapSupabaseAuthError, signInRiderWithPhone, signUpRiderWithPhone } from '@/lib/supabase-auth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from './use-toast';

type RegistrationStep = 'role' | 'personal' | 'affiliation' | 'vehicle' | 'admin' | 'advertiser' | 'ProfessionalStep';
type RegistrationRole = 'rider' | 'driver' | 'advertiser' | 'delegate' | null;
type AuthMode = 'register' | 'login';
type LocationOption = { id: string; label: string; labelEn: string; value: string };

interface SupabaseGovernorateRow {
  id: number;
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

interface RegistrationContextType {
  step: RegistrationStep;
  setStep: (step: RegistrationStep) => void;
  role: RegistrationRole;
  setRole: (role: RegistrationRole) => void;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  personal: { name: string; phone: string; gov: string; district: string; verificationDoc: string };
  setPersonal: (personal: any) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  advertiserProfile: { companyName: string; commercialRegister: string; adLicense: string; businessType: string };
  setAdvertiserProfile: (profile: any) => void;
  affiliation: AffiliationType | null;
  setAffiliation: (affiliation: any) => void;
  vehicle: any;
  setVehicle: (vehicle: any) => void;
  isSubmitting: boolean;
  locationDataLoading: boolean;
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
  const [personal, setPersonal] = useState({ name: '', phone: '', gov: '', district: '', verificationDoc: '' });
  const [authPassword, setAuthPassword] = useState('');
  const [advertiserProfile, setAdvertiserProfile] = useState({ companyName: '', commercialRegister: '', adLicense: '', businessType: 'commercial' });
  const [affiliation, setAffiliation] = useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = useState({ year: '', plate: '', sideId: '', make: '', color: '', officeName: '', officePhone: '', companyName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [governorateRows, setGovernorateRows] = useState<SupabaseGovernorateRow[]>([]);
  const [districtRows, setDistrictRows] = useState<SupabaseDistrictRow[]>([]);
  const [locationDataLoading, setLocationDataLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function fetchLocationRows() {
      setLocationDataLoading(true);

      try {
        const [governoratesResult, districtsResult] = await Promise.all([
          supabase.from('governorates').select('*').order('id', { ascending: true }),
          supabase.from('districts').select('*').order('id', { ascending: true }),
        ]);

        if (governoratesResult.error) throw governoratesResult.error;
        if (districtsResult.error) throw districtsResult.error;

        if (!active) return;

        setGovernorateRows(normalizeGovernorates(governoratesResult.data));
        setDistrictRows(normalizeDistricts(districtsResult.data));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[Supabase Location Fetch]', error);
        }

        if (active) {
          toast({
            variant: 'destructive',
            title: 'تعذر تحميل المناطق',
            description: 'تعذر تحميل المحافظات والمناطق. يرجى المحاولة مرة أخرى.',
          });
        }
      } finally {
        if (active) setLocationDataLoading(false);
      }
    }

    void fetchLocationRows();

    return () => {
      active = false;
    };
  }, [toast]);

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

  const districts = useMemo(() => {
    const selectedGovernorateId = Number(personal.gov);
    if (!Number.isInteger(selectedGovernorateId)) return [];

    return districtRows
      .filter((district) => district.governorate_id === selectedGovernorateId)
      .map((district) => ({
        id: String(district.id),
        label: getLocationLabel(district, 'ar'),
        labelEn: getLocationLabel(district, 'en'),
        value: String(district.id),
      }));
  }, [districtRows, personal.gov]);

  useEffect(() => {
    if (personal.gov && governorates.length > 0 && !governorates.some((governorate) => governorate.value === personal.gov)) {
      setPersonal((current) => ({ ...current, gov: '', district: '' }));
      return;
    }

    if (personal.gov && personal.district && districts.length > 0 && !districts.some((district) => district.value === personal.district)) {
      setPersonal((current) => ({ ...current, district: '' }));
    }
  }, [districts, governorates, personal.district, personal.gov]);

  const fillRandomRegistrationData = useCallback(() => {
    const usableDistricts = districtRows.filter((district) =>
      governorateRows.some((governorate) => governorate.id === district.governorate_id),
    );

    if (!usableDistricts.length) {
      toast({
        variant: 'destructive',
        title: 'المناطق غير جاهزة',
        description: 'انتظر تحميل المحافظات والمناطق ثم حاول مرة أخرى.',
      });
      return;
    }

    const randomDistrict = usableDistricts[Math.floor(Math.random() * usableDistricts.length)];
    const serial = String(Date.now()).slice(-6);
    const phoneSuffix = String(Math.floor(1000000 + Math.random() * 9000000));

    setAuthMode('register');
    setPersonal((current) => ({
      ...current,
      name: `راكب تجربة ${serial}`,
      phone: `+96279${phoneSuffix}`,
      gov: String(randomDistrict.governorate_id),
      district: String(randomDistrict.id),
    }));
    setAuthPassword(`Test${serial}!`);

    toast({
      title: 'تمت إضافة بيانات تجربة',
      description: 'تم اختيار محافظة ومنطقة من قاعدة البيانات مباشرة.',
    });
  }, [districtRows, governorateRows, toast]);

  const submitRiderAuth = useCallback(async () => {
    if (isSubmittingRef.current) return;

    const governorateId = Number(personal.gov);
    const districtId = Number(personal.district);
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
        !Number.isInteger(governorateId) ||
        !Number.isInteger(districtId) ||
        !selectedDistrict)
    ) {
      toast({
        variant: 'destructive',
        title: 'بيانات ناقصة',
        description: 'يرجى كتابة الاسم واختيار المحافظة والمنطقة.',
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
        governorateId,
        districtId,
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
  }, [authMode, authPassword, districtRows, personal.district, personal.gov, personal.name, personal.phone, toast]);

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
      title: 'غير مفعّل الآن',
      description: 'هذه المرحلة مخصصة لدخول الراكب فقط. سيتم ربط الكابتن لاحقا.',
    });
  };

  const handleAdvertiserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: 'غير مفعّل الآن',
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
      title: 'غير مفعّل الآن',
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
    advertiserProfile,
    setAdvertiserProfile,
    affiliation,
    setAffiliation,
    vehicle,
    setVehicle,
    isSubmitting,
    locationDataLoading,
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

function normalizeGovernorates(rows: unknown): SupabaseGovernorateRow[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<SupabaseGovernorateRow>)
        .filter((row): row is SupabaseGovernorateRow => Number.isInteger(row.id))
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

function getLocationLabel(row: SupabaseGovernorateRow | SupabaseDistrictRow, lang: 'ar' | 'en') {
  const preferred = lang === 'ar' ? row.name_ar : row.name_en;
  return preferred || row.name_ar || row.name_en || row.name || String(row.id);
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
