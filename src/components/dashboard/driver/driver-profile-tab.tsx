'use client';

import React from 'react';
import { Car, IdCard, Loader2, LogOut, Pencil, Save, ShieldCheck, Star, X } from 'lucide-react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

interface DriverProfileTabProps {
  user: User | null;
  language: 'ar' | 'en';
  onLogout?: () => void;
}

type ProfileRow = Record<string, unknown>;

export function DriverProfileTab({ user, language, onLogout }: DriverProfileTabProps) {
  const copy = {
    ...profileCopy[language],
    badge: language === 'ar' ? 'حسابي' : 'Profile',
    title: language === 'ar' ? 'بيانات الكابتن' : 'Captain profile',
    subtitle: language === 'ar'
      ? 'يمكنك تعديل بيانات الحساب الأساسية. التقييم يتم حسابه من الرحلات فقط.'
      : 'You can edit basic account details. Ratings are calculated from completed trips only.',
    editTitle: language === 'ar' ? 'تعديل بيانات الحساب' : 'Edit account data',
    save: language === 'ar' ? 'حفظ التعديلات' : 'Save changes',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Log out',
    saveSuccessTitle: language === 'ar' ? 'تم حفظ البيانات' : 'Profile saved',
    saveSuccessDescription: language === 'ar' ? 'تم تحديث بيانات حسابك بنجاح.' : 'Your account details were updated.',
    saveErrorTitle: language === 'ar' ? 'تعذر حفظ البيانات' : 'Could not save profile',
    saveErrorDescription: language === 'ar' ? 'تحقق من الاتصال أو صلاحيات الحساب ثم حاول مرة أخرى.' : 'Check your connection or account permissions and try again.',
    account: language === 'ar' ? 'بيانات الحساب' : 'Account data',
    vehicle: language === 'ar' ? 'بيانات المركبة' : 'Vehicle data',
    name: language === 'ar' ? 'الاسم الكامل' : 'Full name',
    phone: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
    accountNumber: language === 'ar' ? 'رقم الحساب' : 'Account number',
    role: language === 'ar' ? 'نوع الحساب' : 'Account type',
    captainRole: language === 'ar' ? 'كابتن' : 'Captain',
    plate: language === 'ar' ? 'رقم اللوحة' : 'Plate number',
    make: language === 'ar' ? 'نوع المركبة' : 'Vehicle make',
    color: language === 'ar' ? 'اللون' : 'Color',
    year: language === 'ar' ? 'سنة الصنع' : 'Model year',
    notProvided: language === 'ar' ? 'غير مضاف' : 'Not added',
    trustTitle: language === 'ar' ? 'تقييم الحساب' : 'Account rating',
    trustBody: language === 'ar'
      ? 'يتم احتساب التقييم من تقييمات الرحلات المحفوظة بعد إنهاء الرحلات.'
      : 'The rating is calculated from saved trip ratings after completed trips.',
  };
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [fullName, setFullName] = React.useState(user?.name || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [vehiclePlate, setVehiclePlate] = React.useState('');
  const [vehicleMake, setVehicleMake] = React.useState('');
  const [vehicleColor, setVehicleColor] = React.useState('');
  const [vehicleYear, setVehicleYear] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(Boolean(user?.uid));
  const [profileLoadFailed, setProfileLoadFailed] = React.useState(false);
  const [profileReloadToken, setProfileReloadToken] = React.useState(0);

  React.useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setIsLoadingProfile(false);
      setProfileLoadFailed(false);
      return;
    }
    let active = true;
    setIsLoadingProfile(true);
    setProfileLoadFailed(false);

    async function loadProfile() {
      try {
        if ((process.env.NODE_ENV !== 'production') && !isUuid(user!.uid)) {
          if (!active) return;
          setProfile({
            id: user!.uid,
            full_name: user?.name,
            phone: user?.phone,
            serial_id: user?.serial_id,
          });
          setFullName(firstString(user?.name));
          setPhone(firstString(user?.phone));
          setVehiclePlate(firstString(user?.vehicle?.plate));
          setVehicleMake(firstString(user?.vehicle?.make));
          setVehicleColor(firstString(user?.vehicle?.color));
          setVehicleYear(firstString(user?.vehicle?.year));
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user!.uid)
          .maybeSingle();

        if (!active) return;
        if (error) throw error;

        setProfile((data || null) as ProfileRow | null);
        setFullName(firstString(data?.full_name, user?.name));
        setPhone(firstString(data?.phone, user?.phone));
        setVehiclePlate(firstString(getVehiclePlate(data as ProfileRow | null), user?.vehicle?.plate));
        setVehicleMake(firstString(getVehicleMake(data as ProfileRow | null), user?.vehicle?.make));
        setVehicleColor(firstString(getVehicleColor(data as ProfileRow | null), user?.vehicle?.color));
        setVehicleYear(firstString(getVehicleYear(data as ProfileRow | null), user?.vehicle?.year));
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver profile]', error);
        setProfile(null);
        setProfileLoadFailed(true);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [profileReloadToken, user?.name, user?.phone, user?.serial_id, user?.uid, user?.vehicle?.color, user?.vehicle?.make, user?.vehicle?.plate, user?.vehicle?.year]);

  const rating = firstNumber(profile?.trust_score, profile?.rating, profile?.trust_rating, user?.rating, 5);
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const percent = (normalizedRating / 5) * 100;

  const saveProfile = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      const vehicle = {
        plate: vehiclePlate.trim(),
        make: vehicleMake.trim(),
        color: vehicleColor.trim(),
        year: vehicleYear.trim(),
      };
      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        phone: phone.trim(),
      };
      if (profile && Object.prototype.hasOwnProperty.call(profile, 'updated_at')) {
        payload.updated_at = new Date().toISOString();
      }
      const vehicleColumnPayload = buildVehicleColumnPayload(profile, vehicle);
      Object.assign(payload, vehicleColumnPayload);

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.uid);
      if (error) throw error;

      if (Object.keys(vehicleColumnPayload).length === 0) {
        await supabase.auth.updateUser({ data: { vehicle } });
      }

      applySavedProfileState();
      toast({ title: copy.saveSuccessTitle, description: copy.saveSuccessDescription });
      setIsEditing(false);
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver profile save]', error);
      const fallbackSaved = (process.env.NODE_ENV !== 'production') && !isUuid(user.uid)
        ? true
        : await saveProfileToAuthMetadata();
      if (fallbackSaved) {
        applySavedProfileState();
        toast({ title: copy.saveSuccessTitle, description: copy.saveSuccessDescription });
        setIsEditing(false);
      } else {
        toast({ variant: 'destructive', title: copy.saveErrorTitle, description: copy.saveErrorDescription });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const applySavedProfileState = () => {
    setProfile((current) => ({
      ...(current || {}),
      full_name: fullName.trim(),
      phone: phone.trim(),
      vehicle_plate: vehiclePlate.trim(),
      vehicle_make: vehicleMake.trim(),
      vehicle_color: vehicleColor.trim(),
      vehicle_year: vehicleYear.trim(),
    }));
  };

  const saveProfileToAuthMetadata = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          vehicle: {
            plate: vehiclePlate.trim(),
            make: vehicleMake.trim(),
            color: vehicleColor.trim(),
            year: vehicleYear.trim(),
          },
        },
      });
      return !error;
    } catch (metadataError) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver profile metadata fallback]', metadataError);
      return false;
    }
  };

  const cancelEditing = () => {
    setFullName(firstString(profile?.full_name, user?.name));
    setPhone(firstString(profile?.phone, user?.phone));
    setVehiclePlate(firstString(getVehiclePlate(profile), user?.vehicle?.plate));
    setVehicleMake(firstString(getVehicleMake(profile), user?.vehicle?.make));
    setVehicleColor(firstString(getVehicleColor(profile), user?.vehicle?.color));
    setVehicleYear(firstString(getVehicleYear(profile), user?.vehicle?.year));
    setIsEditing(false);
  };

  if (isLoadingProfile) {
    return (
      <section className="mx-auto max-w-5xl space-y-5 text-white">
        <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <Loader2 className="h-5 w-5 animate-spin text-[#14B8A6]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#14B8A6]">
                {language === 'ar' ? 'جاري تحميل بيانات الحساب' : 'Loading profile data'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {language === 'ar'
                  ? 'نحمّل بياناتك من الخادم، يرجى الانتظار لحظة.'
                  : 'Fetching your latest account data from the server.'}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-white/[0.04]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (profileLoadFailed) {
    return (
      <section className="mx-auto max-w-5xl space-y-5 text-white">
        <div className="rounded-3xl border border-red-500/25 bg-[#05080f] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-red-200">
                {language === 'ar' ? 'تعذر تحميل بيانات الحساب' : 'Could not load profile'}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {language === 'ar'
                  ? 'تحقق من الاتصال أو صلاحيات الحساب ثم حاول مرة أخرى.'
                  : 'Check your connection or account permissions, then try again.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfileReloadToken((value) => value + 1)}
              className="rounded-2xl bg-[#14B8A6] px-5 py-3 font-black text-[#06111f]"
            >
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5 text-white">
      <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black text-[#14B8A6]">{copy.badge}</p>
            <h1 className="mt-1 text-2xl font-black">{copy.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{copy.subtitle}</p>
          </div>
          <div className="relative grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(#14B8A6 ${percent}%, rgba(255,255,255,0.08) 0)` }}>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-[#05080f]">
              <div className="text-center">
                <Star className="mx-auto h-5 w-5 fill-emerald-300 text-emerald-300" />
                <p className="mt-1 text-2xl font-black">{normalizedRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
        <div className="flex items-center gap-2 text-emerald-300">
          <IdCard className="h-5 w-5" />
          <h2 className="font-black">{copy.editTitle}</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold text-slate-400">{copy.name}</span>
            <input
              value={fullName}
              disabled={!isEditing}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold text-slate-400">{copy.phone}</span>
            <input
              value={phone}
              disabled={!isEditing}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold text-slate-400">{copy.plate}</span>
            <input
              value={vehiclePlate}
              disabled={!isEditing}
              onChange={(event) => setVehiclePlate(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold text-slate-400">{copy.make}</span>
            <input
              value={vehicleMake}
              disabled={!isEditing}
              onChange={(event) => setVehicleMake(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold text-slate-400">{copy.color}</span>
            <input
              value={vehicleColor}
              disabled={!isEditing}
              onChange={(event) => setVehicleColor(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold text-slate-400">{copy.year}</span>
            <input
              value={vehicleYear}
              disabled={!isEditing}
              onChange={(event) => setVehicleYear(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
              inputMode="numeric"
              className="w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f]"
            >
              <Pencil className="h-5 w-5" />
              {language === 'ar' ? 'تعديل البيانات' : 'Edit profile'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={isSaving || !fullName.trim() || !phone.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {copy.save}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-black text-white hover:bg-white/10 disabled:opacity-60"
              >
                <X className="h-5 w-5" />
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </>
          )}
          {onLogout ? (
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-600/15 px-5 py-4 font-black text-red-100 hover:bg-red-600/25"
            >
              <LogOut className="h-5 w-5" />
              {copy.logout}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel icon={<IdCard className="h-5 w-5" />} title={copy.account}>
          <Field label={copy.name} value={firstString(profile?.full_name, user?.name)} />
          <Field label={copy.phone} value={firstString(profile?.phone, user?.phone)} />
          <Field label={copy.accountNumber} value={firstString(profile?.serial_id, user?.serial_id, '-')} />
          <Field label={copy.role} value={copy.captainRole} />
        </Panel>

        <Panel icon={<Car className="h-5 w-5" />} title={copy.vehicle}>
          <Field label={copy.plate} value={firstString(vehiclePlate, copy.notProvided)} />
          <Field label={copy.make} value={firstString(vehicleMake, copy.notProvided)} />
          <Field label={copy.color} value={firstString(vehicleColor, copy.notProvided)} />
          <Field label={copy.year} value={firstString(vehicleYear, copy.notProvided)} />
        </Panel>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
        <div className="flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="font-black">{copy.trustTitle}</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">{copy.trustBody}</p>
      </div>
    </section>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5">
      <div className="flex items-center gap-2 text-emerald-300">
        {icon}
        <h2 className="font-black">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-black/45 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function getVehiclePlate(profile: ProfileRow | null) {
  return firstString(profile?.vehicle_plate, profile?.plate_number, profile?.car_plate);
}

function getVehicleMake(profile: ProfileRow | null) {
  return firstString(profile?.vehicle_make, profile?.vehicle_type, profile?.car_make);
}

function getVehicleColor(profile: ProfileRow | null) {
  return firstString(profile?.vehicle_color, profile?.car_color);
}

function getVehicleYear(profile: ProfileRow | null) {
  return firstString(profile?.vehicle_year, profile?.model_year);
}

function buildVehicleColumnPayload(
  profile: ProfileRow | null,
  vehicle: { plate: string; make: string; color: string; year: string },
) {
  const payload: Record<string, unknown> = {};
  const plateKey = firstExistingKey(profile, ['vehicle_plate', 'plate_number', 'car_plate']);
  const makeKey = firstExistingKey(profile, ['vehicle_make', 'vehicle_type', 'car_make']);
  const colorKey = firstExistingKey(profile, ['vehicle_color', 'car_color']);
  const yearKey = firstExistingKey(profile, ['vehicle_year', 'model_year']);
  const vehicleJsonKey = firstExistingKey(profile, ['vehicle', 'driver_vehicle']);
  const metadataKey = firstExistingKey(profile, ['metadata', 'profile_metadata']);

  if (plateKey) payload[plateKey] = vehicle.plate || null;
  if (makeKey) payload[makeKey] = vehicle.make || null;
  if (colorKey) payload[colorKey] = vehicle.color || null;
  if (yearKey) payload[yearKey] = vehicle.year || null;

  if (vehicleJsonKey) {
    payload[vehicleJsonKey] = vehicle;
  }

  if (metadataKey) {
    const currentMetadata = isRecord(profile?.[metadataKey]) ? profile?.[metadataKey] as Record<string, unknown> : {};
    payload[metadataKey] = { ...currentMetadata, vehicle };
  }

  return payload;
}

function firstExistingKey(record: ProfileRow | null, keys: string[]) {
  if (!record) return '';
  return keys.find((key) => Object.prototype.hasOwnProperty.call(record, key)) || '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const profileCopy = {
  ar: {
    badge: 'الملف الشخصي',
    title: 'بيانات الكابتن',
    subtitle: 'بيانات الحساب والتقييم تأتي من قاعدة البيانات. التقييم لا يتم تعديله من الواجهة.',
    account: 'بيانات الحساب',
    vehicle: 'بيانات المركبة',
    name: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    accountNumber: 'رقم الحساب',
    role: 'نوع الحساب',
    captainRole: 'كابتن',
    plate: 'رقم اللوحة',
    make: 'نوع المركبة',
    color: 'اللون',
    year: 'سنة الصنع',
    notProvided: 'غير مضاف',
    trustTitle: 'تقييم الحساب',
    trustBody: 'يتم احتساب التقييم من تقييمات الرحلات المحفوظة في قاعدة البيانات بعد إنهاء الرحلات.',
  },
  en: {
    badge: 'Profile',
    title: 'Captain profile',
    subtitle: 'Account and rating data come from the database. The UI does not edit the trust score.',
    account: 'Account data',
    vehicle: 'Vehicle data',
    name: 'Full name',
    phone: 'Phone number',
    accountNumber: 'Account number',
    role: 'Account type',
    captainRole: 'Captain',
    plate: 'Plate number',
    make: 'Vehicle make',
    color: 'Color',
    year: 'Model year',
    notProvided: 'Not added',
    trustTitle: 'Account rating',
    trustBody: 'The rating is calculated from saved trip ratings in the database after completed trips.',
  },
} as const;
