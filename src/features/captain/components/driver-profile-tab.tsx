'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Car, IdCard, Loader2, LogOut, Pencil, Save, ShieldCheck, Star, X } from 'lucide-react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { resolveColorDisplayName } from '@/shared/services/color-name';

const styles = {
  style244_1: "mx-auto max-w-5xl space-y-5 text-white",
  style245_2: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-6",
  style246_3: "flex items-center gap-3",
  style247_4: "grid h-11 w-11 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10",
  style248_5: "h-5 w-5 animate-spin text-[#14B8A6]",
  style251_6: "text-sm font-black text-[#14B8A6]",
  style254_7: "mt-1 text-sm text-slate-400",
  style261_8: "mt-6 grid gap-3 md:grid-cols-2",
  style263_9: "h-20 animate-pulse rounded-2xl border border-slate-800 bg-white/[0.04]",
  style273_10: "mx-auto max-w-5xl space-y-5 text-white",
  style274_11: "rounded-3xl border border-red-500/25 bg-[#05080f] p-6",
  style275_12: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
  style277_13: "text-sm font-black text-red-200",
  style280_14: "mt-2 text-sm leading-6 text-slate-400",
  style289_15: "rounded-2xl bg-[#14B8A6] px-5 py-3 font-black text-[#06111f]",
  style300_16: "mx-auto max-w-5xl space-y-5 text-white",
  style301_17: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style302_18: "flex flex-col gap-5 md:flex-row md:items-center md:justify-between",
  style304_19: "text-xs font-black text-[#14B8A6]",
  style305_20: "mt-1 text-2xl font-black",
  style306_21: "mt-2 text-sm text-slate-400",
  style307_22: "mt-4 inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1.5 text-xs font-black text-[#14F5D5]",
  style308_23: "h-3.5 w-3.5 fill-[#14F5D5]",
  style312_24: "relative grid h-32 w-32 place-items-center rounded-full",
  style313_25: "grid h-24 w-24 place-items-center rounded-full bg-[#05080f]",
  style314_26: "text-center",
  style315_27: "mx-auto h-5 w-5 fill-emerald-300 text-emerald-300",
  style316_28: "mt-1 text-2xl font-black",
  style323_29: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style324_30: "flex items-center gap-2 text-emerald-300",
  style325_31: "h-5 w-5",
  style326_32: "font-black",
  style328_33: "mt-4 grid gap-3 md:grid-cols-2",
  style329_34: "space-y-2",
  style330_35: "text-xs font-bold text-slate-400",
  style335_36: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style338_37: "space-y-2",
  style339_38: "text-xs font-bold text-slate-400",
  style344_39: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style347_40: "space-y-2",
  style348_41: "text-xs font-bold text-slate-400",
  style353_42: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style356_43: "space-y-2",
  style357_44: "text-xs font-bold text-slate-400",
  style362_45: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style365_46: "space-y-2",
  style366_47: "text-xs font-bold text-slate-400",
  style371_48: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style374_49: "space-y-2",
  style375_50: "text-xs font-bold text-slate-400",
  style381_51: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70",
  style385_52: "mt-4 flex flex-col gap-3 sm:flex-row",
  style390_53: "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f]",
  style392_54: "h-5 w-5",
  style401_55: "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:opacity-60",
  style403_56: "h-5 w-5",
  style410_57: "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-black text-white hover:bg-white/10 disabled:opacity-60",
  style412_58: "h-5 w-5",
  style421_59: "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-600/15 px-5 py-4 font-black text-red-100 hover:bg-red-600/25",
  style423_60: "h-5 w-5",
  style430_61: "grid gap-5 lg:grid-cols-2",
  style431_62: "h-5 w-5",
  style439_63: "h-5 w-5",
  style447_64: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style448_65: "flex items-center gap-2 text-emerald-300",
  style449_66: "h-5 w-5",
  style450_67: "font-black",
  style452_68: "mt-2 text-sm leading-6 text-slate-400",
  style460_69: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5",
  style461_70: "flex items-center gap-2 text-emerald-300",
  style463_71: "font-black",
  style465_72: "mt-4 space-y-3",
  style472_73: "rounded-2xl border border-slate-800 bg-black/45 px-4 py-3",
  style473_74: "text-xs text-slate-500",
  style474_75: "mt-1 font-black text-white",
} as const;


interface DriverProfileTabProps {
  user: User | null;
  language: 'ar' | 'en';
  onLogout?: () => void;
}

type ProfileRow = Record<string, unknown>;

export function DriverProfileTab({ user, language, onLogout }: DriverProfileTabProps) {
  const t = useTranslations('captainProfile');
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

        let captainProfile: ProfileRow | null = null;
        try {
          const { data: captainData, error: captainError } = await supabase
            .from('captain_profiles')
            .select('*')
            .eq('id', user!.uid)
            .maybeSingle();
          if (captainError) throw captainError;
          captainProfile = (captainData || null) as ProfileRow | null;
        } catch (captainProfileError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver captain profile]', captainProfileError);
        }

        const mergedProfile = {
          ...(data || {}),
          captain_profile: captainProfile,
        } as ProfileRow;

        setProfile(mergedProfile);
        setFullName(firstString(mergedProfile.full_name, user?.name));
        setPhone(firstString(mergedProfile.phone, user?.phone));
        setVehiclePlate(firstString(getVehiclePlate(mergedProfile), user?.vehicle?.plate));
        setVehicleMake(firstString(getVehicleMake(mergedProfile), user?.vehicle?.make));
        setVehicleColor(firstString(getVehicleColor(mergedProfile), user?.vehicle?.color));
        setVehicleYear(firstString(getVehicleYear(mergedProfile), user?.vehicle?.year));
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
  const tier = getCaptainTier(profile, normalizedRating, t, user?.rank);

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
      toast({ title: t('saveSuccessTitle'), description: t('saveSuccessDescription') });
      setIsEditing(false);
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver profile save]', error);
      const fallbackSaved = (process.env.NODE_ENV !== 'production') && !isUuid(user.uid)
        ? true
        : await saveProfileToAuthMetadata();
      if (fallbackSaved) {
        applySavedProfileState();
        toast({ title: t('saveSuccessTitle'), description: t('saveSuccessDescription') });
        setIsEditing(false);
      } else {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: t('saveErrorDescription') });
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
      <section className={styles.style244_1}>
        <div className={styles.style245_2}>
          <div className={styles.style246_3}>
            <div className={styles.style247_4}>
              <Loader2 className={styles.style248_5} />
            </div>
            <div>
              <p className={styles.style251_6}>
                {t('loadingTitle')}
              </p>
              <p className={styles.style254_7}>
                {t('loadingBody')}
              </p>
            </div>
          </div>
          <div className={styles.style261_8}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles.style263_9} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (profileLoadFailed) {
    return (
      <section className={styles.style273_10}>
        <div className={styles.style274_11}>
          <div className={styles.style275_12}>
            <div>
              <p className={styles.style277_13}>
                {t('loadErrorTitle')}
              </p>
              <p className={styles.style280_14}>
                {t('loadErrorBody')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfileReloadToken((value) => value + 1)}
              className={styles.style289_15}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.style300_16}>
      <div className={styles.style301_17}>
        <div className={styles.style302_18}>
          <div>
            <p className={styles.style304_19}>{t('badge')}</p>
            <h1 className={styles.style305_20}>{t('title')}</h1>
            <p className={styles.style306_21}>{t('subtitle')}</p>
            <div className={styles.style307_22}>
              <Star className={styles.style308_23} />
              <span>{t('tier')}: {tier.label}</span>
            </div>
          </div>
          <div className={styles.style312_24} style={{ background: `conic-gradient(#14B8A6 ${percent}%, rgba(255,255,255,0.08) 0)` }}>
            <div className={styles.style313_25}>
              <div className={styles.style314_26}>
                <Star className={styles.style315_27} />
                <p className={styles.style316_28}>{normalizedRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.style323_29}>
        <div className={styles.style324_30}>
          <IdCard className={styles.style325_31} />
          <h2 className={styles.style326_32}>{t('editTitle')}</h2>
        </div>
        <div className={styles.style328_33}>
          <label className={styles.style329_34}>
            <span className={styles.style330_35}>{t('name')}</span>
            <input
              value={fullName}
              disabled={!isEditing}
              onChange={(event) => setFullName(event.target.value)}
              className={styles.style335_36}
            />
          </label>
          <label className={styles.style338_37}>
            <span className={styles.style339_38}>{t('phone')}</span>
            <input
              value={phone}
              disabled={!isEditing}
              onChange={(event) => setPhone(event.target.value)}
              className={styles.style344_39}
            />
          </label>
          <label className={styles.style347_40}>
            <span className={styles.style348_41}>{t('plate')}</span>
            <input
              value={vehiclePlate}
              disabled={!isEditing}
              onChange={(event) => setVehiclePlate(event.target.value)}
              className={styles.style353_42}
            />
          </label>
          <label className={styles.style356_43}>
            <span className={styles.style357_44}>{t('make')}</span>
            <input
              value={vehicleMake}
              disabled={!isEditing}
              onChange={(event) => setVehicleMake(event.target.value)}
              className={styles.style362_45}
            />
          </label>
          <label className={styles.style365_46}>
            <span className={styles.style366_47}>{t('color')}</span>
            <input
              value={vehicleColor}
              disabled={!isEditing}
              onChange={(event) => setVehicleColor(event.target.value)}
              className={styles.style371_48}
            />
          </label>
          <label className={styles.style374_49}>
            <span className={styles.style375_50}>{t('year')}</span>
            <input
              value={vehicleYear}
              disabled={!isEditing}
              onChange={(event) => setVehicleYear(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
              inputMode="numeric"
              className={styles.style381_51}
            />
          </label>
        </div>
        <div className={styles.style385_52}>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={styles.style390_53}
            >
              <Pencil className={styles.style392_54} />
              {t('edit')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={isSaving || !fullName.trim() || !phone.trim()}
                className={styles.style401_55}
              >
                <Save className={styles.style403_56} />
                {t('save')}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className={styles.style410_57}
              >
                <X className={styles.style412_58} />
                {t('cancel')}
              </button>
            </>
          )}
          {onLogout ? (
            <button
              type="button"
              onClick={() => void onLogout()}
              className={styles.style421_59}
            >
              <LogOut className={styles.style423_60} />
              {t('logout')}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.style430_61}>
        <Panel icon={<IdCard className={styles.style431_62} />} title={t('account')}>
          <Field label={t('name')} value={firstString(profile?.full_name, user?.name)} />
          <Field label={t('phone')} value={firstString(profile?.phone, user?.phone)} />
          <Field label={t('accountNumber')} value={firstString(profile?.serial_id, user?.serial_id, '-')} />
          <Field label={t('role')} value={t('captainRole')} />
          <Field label={t('tier')} value={tier.label} />
        </Panel>

        <Panel icon={<Car className={styles.style439_63} />} title={t('vehicle')}>
          <Field label={t('plate')} value={firstString(vehiclePlate, t('notProvided'))} />
          <Field label={t('make')} value={firstString(vehicleMake, t('notProvided'))} />
          <Field label={t('color')} value={vehicleColor ? resolveColorDisplayName(vehicleColor, language) : t('notProvided')} />
          <Field label={t('year')} value={firstString(vehicleYear, t('notProvided'))} />
        </Panel>
      </div>

      <div className={styles.style447_64}>
        <div className={styles.style448_65}>
          <ShieldCheck className={styles.style449_66} />
          <h2 className={styles.style450_67}>{t('trustTitle')}</h2>
        </div>
        <p className={styles.style452_68}>{t('trustBody')}</p>
      </div>
    </section>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className={styles.style460_69}>
      <div className={styles.style461_70}>
        {icon}
        <h2 className={styles.style463_71}>{title}</h2>
      </div>
      <div className={styles.style465_72}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.style472_73}>
      <p className={styles.style473_74}>{label}</p>
      <p className={styles.style474_75}>{value}</p>
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
  const captainProfile = getCaptainProfile(profile);
  return firstString(profile?.vehicle_plate, profile?.plate_number, profile?.car_plate, captainProfile?.plate_number);
}

function getVehicleMake(profile: ProfileRow | null) {
  const captainProfile = getCaptainProfile(profile);
  const captainVehicleName = [captainProfile?.vehicle_brand, captainProfile?.vehicle_model]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ');
  return firstString(profile?.vehicle_make, profile?.vehicle_type, profile?.car_make, captainVehicleName, captainProfile?.vehicle_type);
}

function getVehicleColor(profile: ProfileRow | null) {
  const captainProfile = getCaptainProfile(profile);
  return firstString(profile?.vehicle_color, profile?.car_color, captainProfile?.vehicle_color, captainProfile?.color);
}

function getVehicleYear(profile: ProfileRow | null) {
  const captainProfile = getCaptainProfile(profile);
  return firstString(profile?.vehicle_year, profile?.model_year, captainProfile?.vehicle_year);
}

function getCaptainProfile(profile: ProfileRow | null) {
  return isRecord(profile?.captain_profile) ? profile.captain_profile as ProfileRow : null;
}

type TFunction = (key: string) => string;

function getCaptainTier(profile: ProfileRow | null, rating: number, t: TFunction, userRank?: unknown) {
  const captainProfile = getCaptainProfile(profile);
  const explicitTier = firstString(
    profile?.tier,
    profile?.rank,
    profile?.driver_rank,
    profile?.captain_rank,
    profile?.membership_tier,
    captainProfile?.tier,
    captainProfile?.rank,
    captainProfile?.driver_rank,
    captainProfile?.captain_rank,
    captainProfile?.membership_tier,
    userRank,
  );
  const normalizedTier = normalizeTier(explicitTier);

  if (normalizedTier) {
    return { key: normalizedTier, label: tierLabel(normalizedTier, t) };
  }

  if (rating >= 4.9) return { key: 'platinum', label: tierLabel('platinum', t) };
  if (rating >= 4.7) return { key: 'gold', label: tierLabel('gold', t) };
  if (rating >= 4.4) return { key: 'silver', label: tierLabel('silver', t) };
  return { key: 'bronze', label: tierLabel('bronze', t) };
}

function normalizeTier(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('platinum') || normalized.includes('بلات')) return 'platinum';
  if (normalized.includes('gold') || normalized.includes('ذهب')) return 'gold';
  if (normalized.includes('silver') || normalized.includes('فض')) return 'silver';
  if (normalized.includes('bronze') || normalized.includes('برون')) return 'bronze';
  return normalized;
}

function tierLabel(value: string, t: TFunction) {
  const key = normalizeTier(value);
  if (key === 'platinum' || key === 'gold' || key === 'silver' || key === 'bronze') {
    return t(`tierLabels.${key}`);
  }
  return value;
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
