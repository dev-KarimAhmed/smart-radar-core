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
import { dexieDb } from '@/lib/dexie-db';
import { Database, Heart, Languages, Loader2, MapPin, RefreshCw, Save, ShieldCheck, User } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

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
  const languageCopy = profileLanguageCopy[language];

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
          dexieDb.favoriteCaptains.count().catch(() => 0),
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

    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
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
      <div className="mx-auto w-full max-w-xl pb-24 font-sans text-start">
        <Card className="border-emerald-950 bg-radar-black/95 text-white">
          <CardContent className="p-6 text-sm text-gray-300">{languageCopy.pleaseLogin}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-24 text-start font-sans">
      <Card className="border border-radar-teal/20 bg-radar-bg-deep/90 text-white shadow-xl">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="text-start">
            <p className="text-sm font-black text-white">{languageCopy.languageTitle}</p>
            <p className="mt-1 text-xs text-slate-400">{languageCopy.languageDescription}</p>
          </div>
          <Button
            type="button"
            onClick={toggleLanguage}
            className="h-11 shrink-0 gap-2 rounded-2xl border border-radar-teal/25 bg-radar-teal/10 px-4 text-sm font-black text-radar-teal-bright hover:bg-radar-teal/15"
          >
            <Languages className="h-4 w-4" />
            {isArabic ? languageCopy.switchToEnglish : languageCopy.switchToArabic}
          </Button>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-emerald-900/40 bg-radar-forest text-white shadow-2xl">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-400" />
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950 text-xl font-black text-emerald-300">
                {displayName ? displayName.substring(0, 1).toUpperCase() : <User className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{displayName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/20 bg-radar-forest text-[10px] text-emerald-300">
                    {displayRole}
                  </Badge>
                  {profile?.serial_id || user.serial_id ? (
                    <Badge variant="outline" className="border-emerald-500/20 bg-black/30 font-mono text-[10px] text-radar-neon">
                      {languageCopy.accountNumber}: {String(profile?.serial_id || user.serial_id)}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="block text-[10px] font-bold text-gray-500">{languageCopy.currentRating}</span>
              <div className="mt-1 rounded-xl border border-emerald-500/10 bg-emerald-950/40 px-3 py-1.5 text-emerald-300">
                <span className="text-base font-black">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500"> / 5</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-black/30 p-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-radar-neon">
                <MapPin className="h-3.5 w-3.5" />
                {languageCopy.location}
              </span>
              <strong className="mt-1 block text-sm text-white">
                {labelFor(selectedGovernorate, language) || languageCopy.notSet} - {labelFor(selectedDistrict, language) || languageCopy.notSet}
              </strong>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/30 p-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {languageCopy.accountData}
              </span>
              <strong className="mt-1 block text-sm text-white">{displayPhone || languageCopy.phoneUnavailable}</strong>
              {currency ? <span className="mt-1 block text-[11px] text-gray-400">{languageCopy.currency}: {currency}</span> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-emerald-950 bg-radar-black/95 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-extrabold text-radar-neon">
            <Database className="h-5 w-5 text-emerald-500" />
            {languageCopy.editTitle}
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">
            {languageCopy.editDescription}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoadingProfile ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-900/30 bg-black/30 p-5 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              {languageCopy.loadingProfile}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400">{languageCopy.fullName}</label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="rounded-xl border-emerald-900/30 bg-black/50 text-white text-start"
                  placeholder={languageCopy.fullNamePlaceholder}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400">{languageCopy.phone}
                </label>
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="rounded-xl border-emerald-900/30 bg-black/50 text-white text-start"
                  placeholder="+962790000000"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400">{languageCopy.country}</label>
                  <Select value={countryId} onValueChange={handleCountryChange} required>
                    <SelectTrigger className="h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white">
                      <SelectValue placeholder={isLoadingCountries ? languageCopy.loading : languageCopy.chooseCountry} />
                    </SelectTrigger>
                    <SelectContent className="border-emerald-900/30 bg-neutral-950 text-white">
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={String(country.id)} className="justify-end text-start">
                          {labelFor(country, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400">{languageCopy.governorate}</label>
                  <Select value={governorateId} onValueChange={handleGovernorateChange} disabled={!countryId || isLoadingGovernorates} required>
                    <SelectTrigger className="h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white">
                      <SelectValue placeholder={isLoadingGovernorates ? languageCopy.loading : languageCopy.chooseGovernorate} />
                    </SelectTrigger>
                    <SelectContent className="border-emerald-900/30 bg-neutral-950 text-white">
                      {governorates.map((governorate) => (
                        <SelectItem key={governorate.id} value={String(governorate.id)} className="justify-end text-start">
                          {labelFor(governorate, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400">{languageCopy.district}</label>
                  <Select value={districtId} onValueChange={setDistrictId} disabled={!governorateId || isLoadingDistricts} required>
                    <SelectTrigger className="h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white">
                      <SelectValue placeholder={isLoadingDistricts ? languageCopy.loading : languageCopy.chooseDistrict} />
                    </SelectTrigger>
                    <SelectContent className="border-emerald-900/30 bg-neutral-950 text-white">
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={String(district.id)} className="justify-end text-start">
                          {labelFor(district, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLocationLoading ? (
                <p className="flex items-center gap-2 text-xs text-emerald-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {languageCopy.updatingLists}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSaving || isLocationLoading}
                className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-extrabold text-white hover:bg-emerald-500"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {languageCopy.saving}
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    {languageCopy.save}
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {!isCaptain && (
        <Card className="border border-red-950/40 bg-radar-bg-deep/90 text-white shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold text-red-400">
              <ShieldCheck className="h-5 w-5 text-red-500" />
              {isArabic ? 'الكباتن المحظورون' : 'Blocked Captains'}
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              {isArabic
                ? 'قائمة بالسائقين الذين قمت بحظرهم. يمكنك إلغاء الحظر لإعادة التعامل معهم.'
                : 'List of captains you have blocked. You can unblock them to interact again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBlocks ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                {isArabic ? 'جاري تحميل قائمة الحظر...' : 'Loading blocked list...'}
              </div>
            ) : blockedCaptains.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">
                {isArabic ? 'لا يوجد كباتن محظورون حالياً.' : 'No blocked captains currently.'}
              </p>
            ) : (
              <div className="space-y-3">
                {blockedCaptains.map((captain) => (
                  <div
                    key={captain.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <strong className="block text-sm text-white">{captain.name}</strong>
                        {captain.serialId && (
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {isArabic ? `رقم الحساب: ${captain.serialId}` : `Account ID: ${captain.serialId}`}
                          </span>
                        )}
                      </div>
                      {confirmingUnblockId === captain.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              handleUnblockCaptain(captain.id);
                              setConfirmingUnblockId(null);
                            }}
                            className="h-8 rounded-lg text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-3"
                          >
                            {isArabic ? 'تأكيد' : 'Confirm'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmingUnblockId(null)}
                            className="h-8 rounded-lg text-[10px] font-bold border-white/15 bg-white/5 hover:bg-white/10 text-white px-3"
                          >
                            {isArabic ? 'تراجع' : 'Cancel'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmingUnblockId(captain.id)}
                          className="h-8 rounded-lg border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-colors px-3"
                        >
                          {isArabic ? 'إلغاء الحظر' : 'Unblock'}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 mt-1 text-[11px] text-slate-400">
                      <div>
                        <span>{isArabic ? 'التقييم: ' : 'Rating: '}</span>
                        <span className="text-amber-400 font-bold">★ {captain.rating.toFixed(1)}</span>
                      </div>
                      <div>
                        <span>{isArabic ? 'الهاتف: ' : 'Phone: '}</span>
                        <span className="text-white font-mono">{captain.phone || (isArabic ? 'غير متاح' : 'N/A')}</span>
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
            className="h-11 w-full border border-red-500/15 bg-red-950/40 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white rounded-xl"
          >
            {languageCopy.logout}
          </Button>
    </div>
  );
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
    save: 'Save changes',
    savedCaptains: 'Saved captains',
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
