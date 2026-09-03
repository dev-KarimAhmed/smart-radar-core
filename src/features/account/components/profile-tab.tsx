'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RecoveryEmailField } from '@/features/auth/contract';
import { fetchFavoriteCaptainIds } from '../services/favorite-captains';
import { dexieDb } from '@/lib/dexie-db';
import { Database, Heart, Languages, Loader2, MapPin, MessageCircle, RefreshCw, Save, ShieldCheck, Trash2, User } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

const styles = {
  recoveryEmailSlot: "mt-1",
  style549_1: "mx-auto w-full max-w-xl pb-24 font-sans text-start",
  style550_2: "border-emerald-950 bg-[#020502]/95 text-white",
  style551_3: "p-6 text-sm text-gray-300",
  style558_4: "mx-auto w-full max-w-xl space-y-6 pb-24 text-start font-sans",
  style559_5: "border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-xl",
  style560_6: "flex items-center justify-between gap-4 p-4",
  style561_7: "text-start",
  style562_8: "text-sm font-black text-white",
  style563_9: "mt-1 text-xs text-slate-400",
  style568_10: "h-11 shrink-0 gap-2 rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-4 text-sm font-black text-[#14F5D5] hover:bg-[#14B8A6]/15",
  style570_11: "h-4 w-4",
  style576_12: "relative overflow-hidden border-emerald-900/40 bg-[#050c05] text-white shadow-2xl",
  style577_13: "absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-400",
  style578_14: "space-y-5 p-6",
  style579_15: "flex items-center justify-between gap-4",
  style580_16: "flex items-center gap-3",
  style581_17: "flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950 text-xl font-black text-emerald-300",
  style582_18: "h-6 w-6",
  style585_19: "text-xl font-black text-white",
  style586_20: "mt-1 flex flex-wrap items-center gap-2",
  style587_21: "border-emerald-500/20 bg-[#0a1e0a] text-[10px] text-emerald-300",
  style591_22: "border-emerald-500/20 bg-black/30 font-mono text-[10px] text-[#00ffcc]",
  style599_23: "text-left font-mono",
  style600_24: "block text-[10px] font-bold text-gray-500",
  style601_25: "mt-1 rounded-xl border border-emerald-500/10 bg-emerald-950/40 px-3 py-1.5 text-emerald-300",
  style602_26: "text-base font-black",
  style603_27: "text-xs text-gray-500",
  style608_28: "grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2",
  style609_29: "rounded-xl border border-white/5 bg-black/30 p-3",
  style610_30: "flex items-center gap-1 text-[10px] font-bold text-[#00ffcc]",
  style611_31: "h-3.5 w-3.5",
  style614_32: "mt-1 block text-sm text-white",
  style619_33: "rounded-xl border border-white/5 bg-black/30 p-3",
  style620_34: "flex items-center gap-1 text-[10px] font-bold text-emerald-300",
  style621_35: "h-3.5 w-3.5",
  style624_36: "mt-1 block text-sm text-white",
  style625_37: "mt-1 block text-[11px] text-gray-400",
  style631_38: "border border-emerald-950 bg-[#020502]/95 shadow-xl",
  style632_39: "pb-3",
  style633_40: "flex items-center gap-2 text-base font-extrabold text-[#00ffcc]",
  style634_41: "h-5 w-5 text-emerald-500",
  style637_42: "text-xs text-gray-400",
  style644_43: "flex items-center justify-center gap-2 rounded-xl border border-emerald-900/30 bg-black/30 p-5 text-sm text-gray-300",
  style645_44: "h-4 w-4 animate-spin text-emerald-400",
  style649_45: "space-y-4",
  style650_46: "space-y-1.5",
  style651_47: "block text-xs font-bold text-gray-400",
  style655_48: "rounded-xl border-emerald-900/30 bg-black/50 text-white text-start",
  style661_49: "space-y-1.5",
  style662_50: "block text-xs font-bold text-gray-400",
  style667_51: "rounded-xl border-emerald-900/30 bg-black/50 text-white text-start",
  style673_52: "space-y-1.5",
  style674_53: "flex items-center gap-2 text-xs font-bold text-gray-400",
  style675_54: "h-4 w-4 text-[#14F5D5]",
  style678_55: "flex gap-2",
  style682_56: "rounded-xl border-emerald-900/30 bg-black/50 text-white text-start",
  style690_57: "h-11 shrink-0 rounded-xl border-red-500/20 bg-red-950/20 px-3 text-red-300 hover:bg-red-500 hover:text-white",
  style693_58: "h-4 w-4",
  style699_59: "grid gap-3 sm:grid-cols-3",
  style700_60: "space-y-1.5",
  style701_61: "block text-xs font-bold text-gray-400",
  style703_62: "h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white",
  style706_63: "border-emerald-900/30 bg-neutral-950 text-white",
  style708_64: "justify-end text-start",
  style716_65: "space-y-1.5",
  style717_66: "block text-xs font-bold text-gray-400",
  style719_67: "h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white",
  style722_68: "border-emerald-900/30 bg-neutral-950 text-white",
  style724_69: "justify-end text-start",
  style732_70: "space-y-1.5",
  style733_71: "block text-xs font-bold text-gray-400",
  style735_72: "h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white",
  style738_73: "border-emerald-900/30 bg-neutral-950 text-white",
  style740_74: "justify-end text-start",
  style750_75: "flex items-center gap-2 text-xs text-emerald-300",
  style751_76: "h-3.5 w-3.5 animate-spin",
  style759_77: "h-12 w-full rounded-xl bg-emerald-600 text-sm font-extrabold text-white hover:bg-emerald-500",
  style763_78: "ml-2 h-4 w-4 animate-spin",
  style768_79: "ml-2 h-4 w-4",
  style779_80: "border border-red-950/40 bg-[#0B0F19]/90 text-white shadow-xl",
  style780_81: "pb-3",
  style781_82: "flex items-center gap-2 text-base font-extrabold text-red-400",
  style782_83: "h-5 w-5 text-red-500",
  style785_84: "text-xs text-gray-400",
  style793_85: "flex items-center justify-center gap-2 py-4 text-sm text-gray-400",
  style794_86: "h-4 w-4 animate-spin text-red-400",
  style798_87: "text-center py-4 text-sm text-gray-500",
  style802_88: "space-y-3",
  style806_89: "flex flex-col gap-2 rounded-xl border border-white/5 bg-white/5 p-4",
  style808_90: "flex items-center justify-between gap-4",
  style810_91: "block text-sm text-white",
  style812_92: "text-[10px] text-slate-400 mt-0.5 block",
  style818_93: "flex gap-2",
  style826_94: "h-8 rounded-lg text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-3",
  style834_95: "h-8 rounded-lg text-[10px] font-bold border-white/15 bg-white/5 hover:bg-white/10 text-white px-3",
  style844_96: "h-8 rounded-lg border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-colors px-3",
  style851_97: "grid grid-cols-2 gap-2 border-t border-white/5 pt-2 mt-1 text-[11px] text-slate-400",
  style854_98: "text-amber-400 font-bold",
  style858_99: "text-white font-mono",
  style873_100: "h-11 w-full border border-red-500/15 bg-red-950/40 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white rounded-xl",
} as const;


type LocationRow = {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
};

type CountryRow = LocationRow & {
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
};

type GovernorateRow = LocationRow & {
  country_id: number;
};

type DistrictRow = LocationRow & {
  governorate_id: number;
};

type ProfileRow = Record<string, unknown> & {
  id?: string;
  user_id?: string;
  auth_user_id?: string;
  serial_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  emergency_whatsapp_contact?: string | null;
  role?: string | null;
  country_id?: number | string | null;
  governorate_id?: number | string | null;
  district_id?: number | string | null;
  rating?: number | string | null;
  rating_sum?: number | string | null;
  rating_count?: number | string | null;
};

type ProfileKey = {
  field: 'id';
  value: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function labelFor(row?: LocationRow | null, language: 'ar' | 'en' = 'ar') {
  if (!row) return '';
  return (language === 'ar' ? row.name_ar || row.name_en : row.name_en || row.name_ar) || row.name || String(row.id);
}

function numberOrEmpty(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? String(numberValue) : '';
}

function normalizeRows<T extends LocationRow>(rows: unknown): T[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<T>)
        .filter((row): row is T => Number.isInteger(row.id))
    : [];
}

function getProfileName(profile: ProfileRow | null, fallbackName: string) {
  return String(profile?.full_name || profile?.name || fallbackName || '').trim();
}

function getProfileRating(profile: ProfileRow | null, fallbackRating?: number) {
  const direct = Number(profile?.rating);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const sum = Number(profile?.rating_sum);
  const count = Number(profile?.rating_count);
  if (Number.isFinite(sum) && Number.isFinite(count) && count > 0) return sum / count;

  return fallbackRating || 5;
}

async function fetchProfileByUserId(userId: string): Promise<{ profile: ProfileRow | null; key: ProfileKey | null }> {
  if (!UUID_REGEX.test(userId)) {
    return { profile: null, key: null };
  }

  const key: ProfileKey = { field: 'id', value: userId };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq(key.field, key.value)
    .maybeSingle();

  if (error) {
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Profile Fetch:id]', error);
    return { profile: null, key: null };
  }

  return { profile: (data as ProfileRow | null) || null, key: data ? key : null };
}

async function saveProfile(profileKey: ProfileKey | null, userId: string, payload: Record<string, unknown>) {
  if (!UUID_REGEX.test(userId)) {
    return;
  }

  if (profileKey) {
    const { error } = await supabase.from('profiles').update(payload).eq(profileKey.field, profileKey.value);
    if (!error) return;
    throw error;
  }

  const { error } = await supabase.from('profiles').upsert({ id: userId, ...payload }, { onConflict: 'id' });
  if (error) throw error;
}

function mapProfileSaveError(error: unknown) {
  const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
  const code = String(supabaseError?.code || '').toLowerCase();
  const message = [supabaseError?.message, supabaseError?.details, supabaseError?.hint, String(error || '')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'لا توجد صلاحية لتعديل هذا الحساب. راجع سياسات RLS لجدول profiles وتأكد أن المستخدم يعدل بيانات حسابه فقط.';
  }

  if (code === 'pgrst204' || message.includes('could not find') || message.includes('schema cache') || message.includes('column')) {
    return 'تعذر الحفظ لأن جدول profiles لا يحتوي أحد الحقول المطلوبة. تأكد من وجود full_name و phone و country_id و governorate_id و district_id.';
  }

  if (
    code === '23503' ||
    message.includes('foreign key') ||
    message.includes('country_id') ||
    message.includes('governorate_id') ||
    message.includes('district_id')
  ) {
    return 'الدولة أو المحافظة أو المنطقة غير موجودة في قاعدة البيانات. اختر قيمة من القوائم ثم حاول مرة أخرى.';
  }

  if (code === '23505' || message.includes('duplicate')) {
    return 'يوجد ملف حساب بهذا المعرف بالفعل. أعد تحميل الصفحة ثم حاول مرة أخرى.';
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'عذراً، تعذر الاتصال بالخادم. تحقق من شبكة الإنترنت ثم حاول مرة أخرى.';
  }

  return 'تعذر تحديث بيانات الحساب. حاول مرة أخرى.';
}

export function ProfileTab() {
  const { user, isCaptain, isPassenger, isSovereign, logout, loginAsMockUser } = useAuth();
  const { toast } = useToast();
  const { isArabic, language, toggleLanguage } = useDashboardLanguage();
  const languageCopy = profileLanguageCopy[language] as Record<string, any>;

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileKey, setProfileKey] = useState<ProfileKey | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [blockedCaptains, setBlockedCaptains] = useState<{ id: string; name: string; phone: string; rating: number; serialId: string }[]>([]);
  const [confirmingUnblockId, setConfirmingUnblockId] = useState<string | null>(null);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyWhatsappContact, setEmergencyWhatsappContact] = useState('');
  const [countryId, setCountryId] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [districtId, setDistrictId] = useState('');

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find((country) => String(country.id) === countryId) || null,
    [countries, countryId],
  );
  const selectedGovernorate = useMemo(
    () => governorates.find((governorate) => String(governorate.id) === governorateId) || null,
    [governorates, governorateId],
  );
  const selectedDistrict = useMemo(
    () => districts.find((district) => String(district.id) === districtId) || null,
    [districts, districtId],
  );

  const rating = getProfileRating(profile, user?.rating);
  const displayName = fullName || user?.name || 'مستخدم جديد';
  const displayPhone = phone || user?.phone || '';
  const displayRole = isSovereign ? languageCopy.roles.admin : isCaptain ? languageCopy.roles.driver : isPassenger ? languageCopy.roles.rider : languageCopy.roles.user;
  const currency = isArabic
    ? selectedCountry?.currency_ar || selectedCountry?.currency_en || selectedCountry?.currency_code || user?.currencyAr || user?.currencyEn
    : selectedCountry?.currency_en || selectedCountry?.currency_code || selectedCountry?.currency_ar || user?.currencyEn || user?.currencyAr;
  const isLocationLoading = isLoadingCountries || isLoadingGovernorates || isLoadingDistricts;

  const fetchBlockedCaptains = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingBlocks(true);
    try {
      // 1. Fetch blocked IDs
      const { data: blocks, error: blocksError } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.uid);

      if (blocksError) throw blocksError;

      const blockedIds = (blocks || []).map((b: any) => b.blocked_id);
      if (blockedIds.length === 0) {
        setBlockedCaptains([]);
        return;
      }

      // 2. Fetch profiles of these blocked IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, rating, serial_id')
        .in('id', blockedIds);

      if (profilesError) throw profilesError;

      const formatted = (profiles || []).map((prof: any) => ({
        id: prof.id,
        name: prof.full_name || 'كابتن محظور',
        phone: prof.phone || '',
        rating: Number(prof.rating || 5),
        serialId: prof.serial_id || '',
      }));
      setBlockedCaptains(formatted);
    } catch (err) {
      console.error('[Profile] Fetch blocked captains error:', err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }, [user?.uid]);

  const handleUnblockCaptain = async (captainId: string) => {
    if (!user?.uid) return;
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.uid)
        .eq('blocked_id', captainId);

      if (error) throw error;

      toast({
        title: 'تم إلغاء الحظر',
        description: 'تم إلغاء حظر هذا الكابتن بنجاح.',
      });

      fetchBlockedCaptains();
    } catch (err: any) {
      console.error('[Profile] Unblock captain error:', err);
      toast({
        variant: 'destructive',
        title: 'تعذر إلغاء الحظر',
        description: err.message || 'حدث خطأ غير متوقع.',
      });
    }
  };

  useEffect(() => {
    if (user?.uid && !isCaptain) {
      fetchBlockedCaptains();
    }
  }, [user?.uid, isCaptain, fetchBlockedCaptains]);

  useEffect(() => {
    let active = true;

    async function loadBaseData() {
      if (!user?.uid) return;
      setIsLoadingProfile(true);
      setIsLoadingCountries(true);

      try {
        const [profileResult, countriesResult, favorites] = await Promise.all([
          fetchProfileByUserId(user.uid),
          supabase.from('countries').select('*').order('id', { ascending: true }),
          // Counted from the server list, not the per-trip Dexie table. That table held one
          // row per hearted TRIP, so a rider who favourited one captain on three rides was
          // shown "3 favourites".
          fetchFavoriteCaptainIds().then((ids) => ids.size).catch(() => 0),
        ]);

        if (!active) return;

        if (countriesResult.error) throw countriesResult.error;

        const nextProfile = profileResult.profile;
        setProfile(nextProfile);
        setProfileKey(profileResult.key);
        setCountries(normalizeRows<CountryRow>(countriesResult.data));
        setFavoriteCount(favorites);

        setFullName(getProfileName(nextProfile, user.name));
        setPhone(String(nextProfile?.phone || user.phone || ''));
        setEmergencyWhatsappContact(String(
          nextProfile?.emergency_whatsapp_contact ||
            localStorage.getItem(`radar_emergency_whatsapp_${user.uid}`) ||
            '',
        ));
        setCountryId(numberOrEmpty(nextProfile?.country_id ?? user.countryId));
        setGovernorateId(numberOrEmpty(nextProfile?.governorate_id ?? user.governorate));
        setDistrictId(numberOrEmpty(nextProfile?.district_id ?? user.district));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Profile Load]', error);
        toast({
          variant: 'destructive',
          title: 'تعذر تحميل بيانات الحساب',
          description: 'تعذر الاتصال بقاعدة البيانات. تحقق من الإنترنت ثم حاول مرة أخرى.',
        });
      } finally {
        if (active) {
          setIsLoadingProfile(false);
          setIsLoadingCountries(false);
        }
      }
    }

    void loadBaseData();

    return () => {
      active = false;
    };
  }, [toast, user?.countryId, user?.district, user?.governorate, user?.name, user?.phone, user?.uid]);

  useEffect(() => {
    let active = true;
    const selectedCountryId = Number(countryId);

    setGovernorates([]);
    setDistricts([]);

    if (!Number.isInteger(selectedCountryId) || selectedCountryId <= 0) {
      return;
    }

    async function loadGovernorates() {
      setIsLoadingGovernorates(true);
      try {
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('country_id', selectedCountryId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setGovernorates(normalizeRows<GovernorateRow>(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Profile Governorates]', error);
        if (active) {
          toast({
            variant: 'destructive',
            title: 'تعذر تحميل المحافظات',
            description: 'تعذر تحميل محافظات الدولة المختارة.',
          });
        }
      } finally {
        if (active) setIsLoadingGovernorates(false);
      }
    }

    void loadGovernorates();

    return () => {
      active = false;
    };
  }, [countryId, toast]);

  useEffect(() => {
    let active = true;
    const selectedGovernorateId = Number(governorateId);

    setDistricts([]);

    if (!Number.isInteger(selectedGovernorateId) || selectedGovernorateId <= 0) {
      return;
    }

    async function loadDistricts() {
      setIsLoadingDistricts(true);
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .eq('governorate_id', selectedGovernorateId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setDistricts(normalizeRows<DistrictRow>(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Profile Districts]', error);
        if (active) {
          toast({
            variant: 'destructive',
            title: 'تعذر تحميل المناطق',
            description: 'تعذر تحميل مناطق المحافظة المختارة.',
          });
        }
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }

    void loadDistricts();

    return () => {
      active = false;
    };
  }, [governorateId, toast]);

  const handleCountryChange = (value: string) => {
    setCountryId(value);
    setGovernorateId('');
    setDistrictId('');
  };

  const handleGovernorateChange = (value: string) => {
    setGovernorateId(value);
    setDistrictId('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid) return;

    const nextCountryId = Number(countryId);
    const nextGovernorateId = Number(governorateId);
    const nextDistrictId = Number(districtId);

    if (!fullName.trim()) {
      toast({
        variant: 'destructive',
        title: 'بيانات غير مكتملة',
        description: 'يرجى كتابة الاسم الكامل.',
      });
      return;
    }

    if (![nextCountryId, nextGovernorateId, nextDistrictId].every((value) => Number.isInteger(value) && value > 0)) {
      toast({
        variant: 'destructive',
        title: 'بيانات غير مكتملة',
        description: 'يرجى اختيار الدولة والمحافظة والمنطقة.',
      });
      return;
    }

    const normalizedEmergencyWhatsapp = normalizeInternationalPhone(emergencyWhatsappContact);
    if (emergencyWhatsappContact.trim() && !normalizedEmergencyWhatsapp) {
      toast({
        variant: 'destructive',
        title: languageCopy.invalidEmergencyWhatsappTitle || (isArabic ? 'رقم الطوارئ غير صحيح' : 'Invalid emergency contact'),
        description: languageCopy.invalidEmergencyWhatsappDescription || (isArabic ? 'اكتب رقم واتساب بصيغة دولية مثل +201234567890.' : 'Enter an international WhatsApp number like +201234567890.'),
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        emergency_whatsapp_contact: normalizedEmergencyWhatsapp || null,
        country_id: nextCountryId,
        governorate_id: nextGovernorateId,
        district_id: nextDistrictId,
      };

      await saveProfile(profileKey, user.uid, payload);

      const nextProfile = { ...(profile || {}), ...payload, name: fullName.trim() };
      setProfile(nextProfile);

      if ((process.env.NODE_ENV !== 'production')) {
        loginAsMockUser({
          ...user,
          name: fullName.trim(),
          phone: phone.trim(),
          countryId: nextCountryId,
          governorate: String(nextGovernorateId),
          district: String(nextDistrictId),
          currencyAr: selectedCountry?.currency_ar || user.currencyAr,
          currencyEn: selectedCountry?.currency_en || selectedCountry?.currency_code || user.currencyEn,
        });
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          emergency_whatsapp_contact: normalizedEmergencyWhatsapp || null,
          country_id: nextCountryId,
          governorate_id: nextGovernorateId,
          district_id: nextDistrictId,
          currency_ar: selectedCountry?.currency_ar || null,
          currency_en: selectedCountry?.currency_en || selectedCountry?.currency_code || null,
        },
      });

      if (metadataError && (process.env.NODE_ENV !== 'production')) {
        console.warn('[Supabase Auth Metadata Update]', metadataError);
      }

      if (normalizedEmergencyWhatsapp) {
        localStorage.setItem(`radar_emergency_whatsapp_${user.uid}`, normalizedEmergencyWhatsapp);
      } else {
        localStorage.removeItem(`radar_emergency_whatsapp_${user.uid}`);
      }

      toast({
        title: 'تم حفظ التعديلات',
        description: 'تم تحديث بيانات الحساب والمنطقة من قاعدة البيانات.',
      });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Profile Save]', error);
      toast({
        variant: 'destructive',
        title: 'تعذر حفظ البيانات',
        description: mapProfileSaveError(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.style549_1}>
        <Card className={styles.style550_2}>
          <CardContent className={styles.style551_3}>{languageCopy.pleaseLogin}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.style558_4}>
      <Card className={styles.style559_5}>
        <CardContent className={styles.style560_6}>
          <div className={styles.style561_7}>
            <p className={styles.style562_8}>{languageCopy.languageTitle}</p>
            <p className={styles.style563_9}>{languageCopy.languageDescription}</p>
          </div>
          <Button
            type="button"
            onClick={toggleLanguage}
            className={styles.style568_10}
          >
            <Languages className={styles.style570_11} />
            {isArabic ? languageCopy.switchToEnglish : languageCopy.switchToArabic}
          </Button>
        </CardContent>
      </Card>

      <Card className={styles.style576_12}>
        <div className={styles.style577_13} />
        <CardContent className={styles.style578_14}>
          <div className={styles.style579_15}>
            <div className={styles.style580_16}>
              <div className={styles.style581_17}>
                {displayName ? displayName.substring(0, 1).toUpperCase() : <User className={styles.style582_18} />}
              </div>
              <div>
                <h2 className={styles.style585_19}>{displayName}</h2>
                <div className={styles.style586_20}>
                  <Badge variant="outline" className={styles.style587_21}>
                    {displayRole}
                  </Badge>
                  {profile?.serial_id || user.serial_id ? (
                    <Badge variant="outline" className={styles.style591_22}>
                      {languageCopy.accountNumber}: {String(profile?.serial_id || user.serial_id)}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.style599_23}>
              <span className={styles.style600_24}>{languageCopy.currentRating}</span>
              <div className={styles.style601_25}>
                <span className={styles.style602_26}>{rating.toFixed(1)}</span>
                <span className={styles.style603_27}> / 5</span>
              </div>
            </div>
          </div>

          <div className={styles.style608_28}>
            <div className={styles.style609_29}>
              <span className={styles.style610_30}>
                <MapPin className={styles.style611_31} />
                {languageCopy.location}
              </span>
              <strong className={styles.style614_32}>
                {labelFor(selectedGovernorate, language) || languageCopy.notSet} - {labelFor(selectedDistrict, language) || languageCopy.notSet}
              </strong>
            </div>

            <div className={styles.style619_33}>
              <span className={styles.style620_34}>
                <ShieldCheck className={styles.style621_35} />
                {languageCopy.accountData}
              </span>
              <strong className={styles.style624_36}>{displayPhone || languageCopy.phoneUnavailable}</strong>
              {currency ? <span className={styles.style625_37}>{languageCopy.currency}: {currency}</span> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={styles.style631_38}>
        <CardHeader className={styles.style632_39}>
          <CardTitle className={styles.style633_40}>
            <Database className={styles.style634_41} />
            {languageCopy.editTitle}
          </CardTitle>
          <CardDescription className={styles.style637_42}>
            {languageCopy.editDescription}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoadingProfile ? (
            <div className={styles.style644_43}>
              <Loader2 className={styles.style645_44} />
              {languageCopy.loadingProfile}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.style649_45}>
              <div className={styles.style650_46}>
                <label className={styles.style651_47}>{languageCopy.fullName}</label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={styles.style655_48}
                  placeholder={languageCopy.fullNamePlaceholder}
                  required
                />
              </div>

              <div className={styles.style661_49}>
                <label className={styles.style662_50}>{languageCopy.phone}
                </label>
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={styles.style667_51}
                  placeholder="+962790000000"
                  required
                />
              </div>

              {/* Riders were locked out of self-service recovery entirely: without an email
                  on the account every forgotten password had to go through an admin, who
                  then has the power to set it. */}
              <div className={styles.recoveryEmailSlot}>
                <RecoveryEmailField />
              </div>

              <div className={styles.style673_52}>
                <label className={styles.style674_53}>
                  <MessageCircle className={styles.style675_54} />
                  {languageCopy.emergencyWhatsappContact || (isArabic ? 'رقم واتساب للطوارئ' : 'Emergency WhatsApp Contact')}
                </label>
                <div className={styles.style678_55}>
                  <Input
                    value={emergencyWhatsappContact}
                    onChange={(event) => setEmergencyWhatsappContact(event.target.value)}
                    className={styles.style682_56}
                    placeholder={languageCopy.emergencyWhatsappPlaceholder || '+201234567890'}
                  />
                  {emergencyWhatsappContact ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEmergencyWhatsappContact('')}
                      className={styles.style690_57}
                      aria-label={languageCopy.deleteEmergencyContact || (isArabic ? 'حذف رقم الطوارئ' : 'Delete emergency contact')}
                    >
                      <Trash2 className={styles.style693_58} />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className={styles.style699_59}>
                <div className={styles.style700_60}>
                  <label className={styles.style701_61}>{languageCopy.country}</label>
                  <Select value={countryId} onValueChange={handleCountryChange} required>
                    <SelectTrigger className={styles.style703_62}>
                      <SelectValue placeholder={isLoadingCountries ? languageCopy.loading : languageCopy.chooseCountry} />
                    </SelectTrigger>
                    <SelectContent className={styles.style706_63}>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={String(country.id)} className={styles.style708_64}>
                          {labelFor(country, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.style716_65}>
                  <label className={styles.style717_66}>{languageCopy.governorate}</label>
                  <Select value={governorateId} onValueChange={handleGovernorateChange} disabled={!countryId || isLoadingGovernorates} required>
                    <SelectTrigger className={styles.style719_67}>
                      <SelectValue placeholder={isLoadingGovernorates ? languageCopy.loading : languageCopy.chooseGovernorate} />
                    </SelectTrigger>
                    <SelectContent className={styles.style722_68}>
                      {governorates.map((governorate) => (
                        <SelectItem key={governorate.id} value={String(governorate.id)} className={styles.style724_69}>
                          {labelFor(governorate, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.style732_70}>
                  <label className={styles.style733_71}>{languageCopy.district}</label>
                  <Select value={districtId} onValueChange={setDistrictId} disabled={!governorateId || isLoadingDistricts} required>
                    <SelectTrigger className={styles.style735_72}>
                      <SelectValue placeholder={isLoadingDistricts ? languageCopy.loading : languageCopy.chooseDistrict} />
                    </SelectTrigger>
                    <SelectContent className={styles.style738_73}>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={String(district.id)} className={styles.style740_74}>
                          {labelFor(district, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLocationLoading ? (
                <p className={styles.style750_75}>
                  <Loader2 className={styles.style751_76} />
                  {languageCopy.updatingLists}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSaving || isLocationLoading}
                className={styles.style759_77}
              >
                {isSaving ? (
                  <>
                    <Loader2 className={styles.style763_78} />
                    {languageCopy.saving}
                  </>
                ) : (
                  <>
                    <Save className={styles.style768_79} />
                    {languageCopy.save}
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {!isCaptain && (
        <Card className={styles.style779_80}>
          <CardHeader className={styles.style780_81}>
            <CardTitle className={styles.style781_82}>
              <ShieldCheck className={styles.style782_83} />
              {isArabic ? 'الكباتن المحظورون' : 'Blocked Captains'}
            </CardTitle>
            <CardDescription className={styles.style785_84}>
              {isArabic
                ? 'قائمة بالسائقين الذين قمت بحظرهم. يمكنك إلغاء الحظر لإعادة التعامل معهم.'
                : 'List of captains you have blocked. You can unblock them to interact again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBlocks ? (
              <div className={styles.style793_85}>
                <Loader2 className={styles.style794_86} />
                {isArabic ? 'جاري تحميل قائمة الحظر...' : 'Loading blocked list...'}
              </div>
            ) : blockedCaptains.length === 0 ? (
              <p className={styles.style798_87}>
                {isArabic ? 'لا يوجد كباتن محظورون حالياً.' : 'No blocked captains currently.'}
              </p>
            ) : (
              <div className={styles.style802_88}>
                {blockedCaptains.map((captain) => (
                  <div
                    key={captain.id}
                    className={styles.style806_89}
                  >
                    <div className={styles.style808_90}>
                      <div>
                        <strong className={styles.style810_91}>{captain.name}</strong>
                        {captain.serialId && (
                          <span className={styles.style812_92}>
                            {isArabic ? `رقم الحساب: ${captain.serialId}` : `Account ID: ${captain.serialId}`}
                          </span>
                        )}
                      </div>
                      {confirmingUnblockId === captain.id ? (
                        <div className={styles.style818_93}>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              handleUnblockCaptain(captain.id);
                              setConfirmingUnblockId(null);
                            }}
                            className={styles.style826_94}
                          >
                            {isArabic ? 'تأكيد' : 'Confirm'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmingUnblockId(null)}
                            className={styles.style834_95}
                          >
                            {isArabic ? 'تراجع' : 'Cancel'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmingUnblockId(captain.id)}
                          className={styles.style844_96}
                        >
                          {isArabic ? 'إلغاء الحظر' : 'Unblock'}
                        </Button>
                      )}
                    </div>

                    <div className={styles.style851_97}>
                      <div>
                        <span>{isArabic ? 'التقييم: ' : 'Rating: '}</span>
                        <span className={styles.style854_98}>★ {captain.rating.toFixed(1)}</span>
                      </div>
                      <div>
                        <span>{isArabic ? 'الهاتف: ' : 'Phone: '}</span>
                        <span className={styles.style858_99}>{captain.phone || (isArabic ? 'غير متاح' : 'N/A')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
            type="button"
            onClick={logout}
            variant="destructive"
            className={styles.style873_100}
          >
            {languageCopy.logout}
          </Button>
    </div>
  );
}

function normalizeInternationalPhone(value: string) {
  const compact = value.trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (!compact) return '';

  const international = compact.startsWith('+')
    ? compact
    : `+${compact.replace(/^00/, '').replace(/^0+/, '')}`;

  return /^\+[1-9]\d{7,14}$/.test(international) ? international : '';
}

const profileLanguageCopy = {
  ar: {
    accountData: 'بيانات الحساب',
    accountNumber: 'رقم الحساب',
    accountSource: 'مصدر بيانات الحساب',
    chooseCountry: 'اختر الدولة',
    chooseDistrict: 'اختر المنطقة',
    chooseGovernorate: 'اختر المحافظة',
    country: 'الدولة',
    currency: 'العملة',
    currentRating: 'التقييم الحالي',
    district: 'المنطقة',
    pleaseLogin: 'يرجى تسجيل الدخول لعرض بيانات الحساب.',
    editDescription: 'يتم تحميل الدولة والمحافظة والمنطقة مباشرة من قاعدة البيانات.',
    editTitle: 'تعديل بيانات الحساب والمنطقة',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'اكتب اسمك الكامل',
    governorate: 'المحافظة',
    languageTitle: 'لغة التطبيق',
    languageDescription: 'اختر اللغة التي تظهر في لوحة التحكم.',
    loading: 'جاري التحميل...',
    loadingProfile: 'جاري تحميل بيانات الحساب...',
    localInfoDescription: 'هذه معلومات محفوظة على جهازك لتحسين التجربة بدون اتصال دائم.',
    localInfoTitle: 'معلومات محلية',
    location: 'المحافظة والمنطقة',
    logout: 'تسجيل الخروج',
    notSet: 'غير محدد',
    phone: 'رقم الهاتف',
    phoneUnavailable: 'رقم الهاتف غير متاح',
    save: 'حفظ التعديلات',
    savedCaptains: 'السائقون المحفوظون',
    saving: 'جاري حفظ البيانات...',
    switchToArabic: 'العربية',
    switchToEnglish: 'English',
    updatingLists: 'جاري تحديث القوائم من قاعدة البيانات...',
    roles: {
      admin: 'مشرف',
      driver: 'سائق',
      rider: 'راكب',
      user: 'مستخدم',
    },
  },
  en: {
    accountData: 'Account data',
    accountNumber: 'Account number',
    accountSource: 'Account data source',
    chooseCountry: 'Choose country',
    chooseDistrict: 'Choose district',
    chooseGovernorate: 'Choose governorate',
    country: 'Country',
    currency: 'Currency',
    currentRating: 'Current rating',
    district: 'District',
    pleaseLogin: 'Please sign in to view account details.',
    editDescription: 'Country, governorate, and district are loaded directly from the database.',
    editTitle: 'Edit account and area',
    fullName: 'Full name',
    fullNamePlaceholder: 'Enter your full name',
    governorate: 'Governorate',
    languageTitle: 'App language',
    languageDescription: 'Choose the language used in the dashboard.',
    loading: 'Loading...',
    loadingProfile: 'Loading account data...',
    localInfoDescription: 'This information is saved on your device to improve the experience without constant connection.',
    localInfoTitle: 'Local information',
    location: 'Governorate and district',
    logout: 'Log out',
    notSet: 'Not set',
    phone: 'Phone number',
    phoneUnavailable: 'Phone number unavailable',
    emergencyWhatsappContact: 'Emergency WhatsApp Contact',
    emergencyWhatsappPlaceholder: '+201234567890',
    deleteEmergencyContact: 'Delete emergency contact',
    invalidEmergencyWhatsappTitle: 'Invalid emergency contact',
    invalidEmergencyWhatsappDescription: 'Enter an international WhatsApp number like +201234567890.',
    save: 'Save changes',
    savedCaptains: 'Favorite captains',
    saving: 'Saving data...',
    switchToArabic: 'العربية',
    switchToEnglish: 'English',
    updatingLists: 'Updating lists from the database...',
    roles: {
      admin: 'Admin',
      driver: 'Driver',
      rider: 'Rider',
      user: 'User',
    },
  },
} as const;
