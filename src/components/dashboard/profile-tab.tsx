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
import { Database, Heart, Loader2, MapPin, RefreshCw, Save, ShieldCheck, User } from 'lucide-react';

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

function labelFor(row?: LocationRow | null) {
  if (!row) return '';
  return row.name_ar || row.name_en || row.name || String(row.id);
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
    if (import.meta.env.DEV) console.warn('[Supabase Profile Fetch:id]', error);
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

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileKey, setProfileKey] = useState<ProfileKey | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

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
  const displayRole = isSovereign ? 'مشرف' : isCaptain ? 'سائق' : isPassenger ? 'راكب' : 'مستخدم';
  const currency = selectedCountry?.currency_ar || selectedCountry?.currency_en || selectedCountry?.currency_code || user?.currencyAr || user?.currencyEn;
  const isLocationLoading = isLoadingCountries || isLoadingGovernorates || isLoadingDistricts;

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
        if (import.meta.env.DEV) console.warn('[Profile Load]', error);
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
        if (import.meta.env.DEV) console.warn('[Profile Governorates]', error);
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
        if (import.meta.env.DEV) console.warn('[Profile Districts]', error);
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

      if (import.meta.env.DEV) {
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

      if (metadataError && import.meta.env.DEV) {
        console.warn('[Supabase Auth Metadata Update]', metadataError);
      }

      toast({
        title: 'تم حفظ التعديلات',
        description: 'تم تحديث بيانات الحساب والمنطقة من قاعدة البيانات.',
      });
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Profile Save]', error);
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
      <div className="mx-auto w-full max-w-xl pb-24 text-right font-sans" dir="rtl">
        <Card className="border-emerald-950 bg-[#020502]/95 text-white">
          <CardContent className="p-6 text-sm text-gray-300">يرجى تسجيل الدخول لعرض بيانات الحساب.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-24 text-right font-sans" dir="rtl">
      <Card className="relative overflow-hidden border-emerald-900/40 bg-[#050c05] text-white shadow-2xl">
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
                  <Badge variant="outline" className="border-emerald-500/20 bg-[#0a1e0a] text-[10px] text-emerald-300">
                    {displayRole}
                  </Badge>
                  {profile?.serial_id || user.serial_id ? (
                    <Badge variant="outline" className="border-emerald-500/20 bg-black/30 font-mono text-[10px] text-[#00ffcc]">
                      رقم الحساب: {String(profile?.serial_id || user.serial_id)}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="block text-[10px] font-bold text-gray-500">التقييم الحالي</span>
              <div className="mt-1 rounded-xl border border-emerald-500/10 bg-emerald-950/40 px-3 py-1.5 text-emerald-300">
                <span className="text-base font-black">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500"> / 5</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-black/30 p-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#00ffcc]">
                <MapPin className="h-3.5 w-3.5" />
                المحافظة والمنطقة
              </span>
              <strong className="mt-1 block text-sm text-white">
                {labelFor(selectedGovernorate) || 'غير محدد'} - {labelFor(selectedDistrict) || 'غير محدد'}
              </strong>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/30 p-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                بيانات الحساب
              </span>
              <strong className="mt-1 block text-sm text-white">{displayPhone || 'رقم الهاتف غير متاح'}</strong>
              {currency ? <span className="mt-1 block text-[11px] text-gray-400">العملة: {currency}</span> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-emerald-950 bg-[#020502]/95 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-extrabold text-[#00ffcc]">
            <Database className="h-5 w-5 text-emerald-500" />
            تعديل بيانات الحساب والمنطقة
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">
            يتم تحميل الدولة والمحافظة والمنطقة مباشرة من قاعدة البيانات.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoadingProfile ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-900/30 bg-black/30 p-5 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              جاري تحميل بيانات الحساب...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400">الاسم الكامل</label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="rounded-xl border-emerald-900/30 bg-black/50 text-right text-white"
                  placeholder="اكتب اسمك الكامل"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400">رقم الهاتف</label>
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="rounded-xl border-emerald-900/30 bg-black/50 text-right text-white"
                  placeholder="+962790000000"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400">الدولة</label>
                  <Select value={countryId} onValueChange={handleCountryChange} required>
                    <SelectTrigger className="h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white" dir="rtl">
                      <SelectValue placeholder={isLoadingCountries ? 'جاري التحميل...' : 'اختر الدولة'} />
                    </SelectTrigger>
                    <SelectContent className="border-emerald-900/30 bg-neutral-950 text-white">
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={String(country.id)} className="justify-end text-right">
                          {labelFor(country)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400">المحافظة</label>
                  <Select value={governorateId} onValueChange={handleGovernorateChange} disabled={!countryId || isLoadingGovernorates} required>
                    <SelectTrigger className="h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white" dir="rtl">
                      <SelectValue placeholder={isLoadingGovernorates ? 'جاري التحميل...' : 'اختر المحافظة'} />
                    </SelectTrigger>
                    <SelectContent className="border-emerald-900/30 bg-neutral-950 text-white">
                      {governorates.map((governorate) => (
                        <SelectItem key={governorate.id} value={String(governorate.id)} className="justify-end text-right">
                          {labelFor(governorate)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400">المنطقة</label>
                  <Select value={districtId} onValueChange={setDistrictId} disabled={!governorateId || isLoadingDistricts} required>
                    <SelectTrigger className="h-11 rounded-xl border-emerald-900/30 bg-black/50 text-white" dir="rtl">
                      <SelectValue placeholder={isLoadingDistricts ? 'جاري التحميل...' : 'اختر المنطقة'} />
                    </SelectTrigger>
                    <SelectContent className="border-emerald-900/30 bg-neutral-950 text-white">
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={String(district.id)} className="justify-end text-right">
                          {labelFor(district)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLocationLoading ? (
                <p className="flex items-center gap-2 text-xs text-emerald-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جاري تحديث القوائم من قاعدة البيانات...
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
                    جاري حفظ البيانات...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border border-blue-900/20 bg-[#050510]/40 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-blue-400">
            <Heart className="h-4.5 w-4.5 text-blue-500" />
            معلومات محلية
          </CardTitle>
          <CardDescription className="text-[11px] text-gray-400">
            هذه معلومات محفوظة على جهازك لتحسين التجربة بدون اتصال دائم.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5 pb-5">
          <div className="grid grid-cols-2 gap-2.5 text-right font-mono text-[11px]">
            <div className="rounded-lg border border-white/5 bg-black/40 p-3">
              <span className="block text-[9px] text-[#00ffcc]/80">السائقون المحفوظون</span>
              <strong className="mt-1 block text-sm text-[#00ffcc]">{favoriteCount}</strong>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/40 p-3">
              <span className="block text-[9px] text-blue-400">مصدر بيانات الحساب</span>
              <strong className="mt-1 flex items-center gap-1 text-sm text-blue-300">
                <RefreshCw className="h-3.5 w-3.5" />
                Supabase
              </strong>
            </div>
          </div>

          <Button
            type="button"
            onClick={logout}
            variant="destructive"
            className="h-11 w-full border border-red-500/15 bg-red-950/40 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white"
          >
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
