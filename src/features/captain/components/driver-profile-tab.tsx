'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Car, Check, IdCard, Loader2, Pencil, Wallet, X } from 'lucide-react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { RecoveryEmailField } from '@/features/auth/contract';
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
  style472_73: "min-w-0 rounded-2xl border border-slate-800 bg-black/45 px-4 py-3",
  style473_74: "text-xs text-slate-500",
  style474_75: "mt-1 truncate font-black text-white",
  editableField: "flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-black/45 px-4 py-3",
  editableFieldBody: "min-w-0 flex-1",
  editPencilButton: "grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20",
  editPencilIcon: "h-3.5 w-3.5",
  editableFieldEditingWrap: "block",
  editableFieldEditingRow: "mb-1.5 flex items-center justify-between gap-2",
  editableFieldEditingLabel: "text-xs text-slate-500",
  editActionGroup: "flex shrink-0 items-center gap-1.5",
  editSaveButton: "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40",
  editCancelButton: "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-2.5 text-[11px] font-bold text-rose-300 transition hover:bg-rose-500/30 disabled:cursor-wait disabled:opacity-60",
  editSaveIcon: "h-3.5 w-3.5",
  editActionText: "whitespace-nowrap",
  recoveryEmailBlock: "border-t border-white/5 py-3",
  editingInput: "w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400",
  tariffError: "mt-3 text-sm font-bold text-rose-400",
  tariffSectionHeader: "mt-6 flex items-center gap-2 border-t border-white/5 pt-5 text-emerald-300",
  tariffSectionHint: "mt-2 text-xs leading-5 text-slate-500",
} as const;


interface DriverProfileTabProps {
  user: User | null;
  language: 'ar' | 'en';
}

type ProfileRow = Record<string, unknown>;

export function DriverProfileTab({ user, language }: DriverProfileTabProps) {
  const t = useTranslations('captainProfile');
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [fullName, setFullName] = React.useState(user?.name || '');
  const [nickname, setNickname] = React.useState('');
  const [phone, setPhone] = React.useState(user?.phone || '');
  // Identity-verification data set once at registration — read-only here, never
  // part of the save payload.
  const [nationalIdNumber, setNationalIdNumber] = React.useState('');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [vehiclePlate, setVehiclePlate] = React.useState('');
  const [vehicleMake, setVehicleMake] = React.useState('');
  const [vehicleModel, setVehicleModel] = React.useState('');
  const [vehicleColor, setVehicleColor] = React.useState('');
  const [vehicleYear, setVehicleYear] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [officePhone, setOfficePhone] = React.useState('');
  const [sideId, setSideId] = React.useState('');
  // Smart-app/independent captains only — the aggregator's own partner code.
  const [companyCode, setCompanyCode] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const [instagramUrl, setInstagramUrl] = React.useState('');
  // The captain's own tariff, the same three components the activation modal collects.
  const [baseFare, setBaseFare] = React.useState('');
  const [pricePerKm, setPricePerKm] = React.useState('');
  const [pricePerMin, setPricePerMin] = React.useState('');
  // NOT NULL with a zero default server-side, so this is '0' rather than blank when unset.
  const [includedKm, setIncludedKm] = React.useState('');
  // Market-derived floor from captain_base_fare_floor(); a trigger re-checks it on save.
  const [minBaseFare, setMinBaseFare] = React.useState(1);
  const [tariffError, setTariffError] = React.useState('');
  const [affiliationType, setAffiliationType] = React.useState('');
  const isTaxi = affiliationType === 'office-taxi';

  const [isSaving, setIsSaving] = React.useState(false);
  // Which fields are currently showing an input instead of their plain value —
  // per field, not a single page-wide toggle, so tapping one field's pencil
  // doesn't drag every other field into edit mode too.
  const [editingFields, setEditingFields] = React.useState<Set<string>>(new Set());
  const startEditingField = React.useCallback((key: string) => {
    setEditingFields((current) => new Set(current).add(key));
  }, []);
  const stopEditingField = React.useCallback((key: string) => {
    setEditingFields((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);
  // The last value confirmed saved to the server for each field, read at render time to
  // decide whether a field's pencil should show as a check (something to save) instead.
  // A ref, not state: it only ever changes at the same moments the live field values below
  // do (right after load, right after a successful save), so there is no missed re-render.
  const savedSnapshotRef = React.useRef<Record<string, string>>({
    fullName: '', nickname: '', phone: '', vehiclePlate: '', vehicleMake: '', vehicleModel: '',
    vehicleColor: '', vehicleYear: '', businessName: '', officePhone: '', sideId: '', companyCode: '',
    facebookUrl: '', instagramUrl: '', baseFare: '', includedKm: '', pricePerKm: '', pricePerMin: '',
  });
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
          const devFullName = firstString(user?.name);
          const devPhone = firstString(user?.phone);
          const devVehiclePlate = firstString(user?.vehicle?.plate);
          const devVehicleMake = firstString(user?.vehicle?.make);
          const devVehicleColor = firstString(user?.vehicle?.color);
          const devVehicleYear = firstString(user?.vehicle?.year);
          setFullName(devFullName);
          setPhone(devPhone);
          setVehiclePlate(devVehiclePlate);
          setVehicleMake(devVehicleMake);
          setVehicleColor(devVehicleColor);
          setVehicleYear(devVehicleYear);
          savedSnapshotRef.current = {
            ...savedSnapshotRef.current,
            fullName: devFullName,
            phone: devPhone,
            vehiclePlate: devVehiclePlate,
            vehicleMake: devVehicleMake,
            vehicleColor: devVehicleColor,
            vehicleYear: devVehicleYear,
          };
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

        // The floor is computed from the market, so it has to come from the server rather
        // than any column on the profile itself.
        try {
          const { data: tariffContext } = await supabase.rpc('get_captain_tariff_context');
          const floor = Number((tariffContext as Record<string, unknown> | null)?.minBaseFare);
          if (active && Number.isFinite(floor)) setMinBaseFare(floor);
        } catch (tariffContextError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver tariff context]', tariffContextError);
        }
        if (!active) return;

        const mergedProfile = {
          ...(data || {}),
          captain_profile: captainProfile,
        } as ProfileRow;

        const newFullName = firstString(mergedProfile.full_name, user?.name);
        const newPhone = firstString(mergedProfile.phone, user?.phone);
        const newVehiclePlate = firstString(getVehiclePlate(mergedProfile), user?.vehicle?.plate);
        const newVehicleMake = firstString(getVehicleMake(mergedProfile), user?.vehicle?.make);
        const newVehicleColor = firstString(getVehicleColor(mergedProfile), user?.vehicle?.color);
        const newVehicleYear = firstString(getVehicleYear(mergedProfile), user?.vehicle?.year);
        const newBaseFare = numberToInput(captainProfile?.base_fare);
        const newPricePerKm = numberToInput(captainProfile?.price_per_km);
        const newPricePerMin = numberToInput(captainProfile?.price_per_min);
        const newIncludedKm = numberToInput(captainProfile?.included_km ?? 0);
        const newVehicleModel = firstString(captainProfile?.vehicle_model);
        const newBusinessName = firstString(captainProfile?.employment_type);
        const newOfficePhone = firstString(captainProfile?.office_phone);
        const newSideId = firstString(captainProfile?.side_id);
        const newCompanyCode = firstString(captainProfile?.company_code);
        const newFacebookUrl = firstString(captainProfile?.facebook_url);
        const newInstagramUrl = firstString(captainProfile?.instagram_url);
        const newNickname = firstString(captainProfile?.nickname);
        const newNationalIdNumber = firstString(captainProfile?.national_id_number);
        const newLicenseNumber = firstString(captainProfile?.license_number);

        setProfile(mergedProfile);
        setFullName(newFullName);
        setNickname(newNickname);
        setPhone(newPhone);
        setNationalIdNumber(newNationalIdNumber);
        setLicenseNumber(newLicenseNumber);
        setVehiclePlate(newVehiclePlate);
        setVehicleMake(newVehicleMake);
        setVehicleColor(newVehicleColor);
        setVehicleYear(newVehicleYear);
        setBaseFare(newBaseFare);
        setPricePerKm(newPricePerKm);
        setPricePerMin(newPricePerMin);
        setIncludedKm(newIncludedKm);
        setVehicleModel(newVehicleModel);
        setBusinessName(newBusinessName);
        setOfficePhone(newOfficePhone);
        setSideId(newSideId);
        setCompanyCode(newCompanyCode);
        setFacebookUrl(newFacebookUrl);
        setInstagramUrl(newInstagramUrl);
        setAffiliationType(firstString(captainProfile?.affiliation_type, user?.affiliation?.type));

        savedSnapshotRef.current = {
          fullName: newFullName,
          nickname: newNickname,
          phone: newPhone,
          vehiclePlate: newVehiclePlate,
          vehicleMake: newVehicleMake,
          vehicleModel: newVehicleModel,
          vehicleColor: newVehicleColor,
          vehicleYear: newVehicleYear,
          businessName: newBusinessName,
          officePhone: newOfficePhone,
          sideId: newSideId,
          companyCode: newCompanyCode,
          facebookUrl: newFacebookUrl,
          instagramUrl: newInstagramUrl,
          baseFare: newBaseFare,
          includedKm: newIncludedKm,
          pricePerKm: newPricePerKm,
          pricePerMin: newPricePerMin,
        };
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
  const tier = getCaptainTier(profile, normalizedRating, t, user?.rank);

  /**
   * Mirrors the checks in the setup modal so the captain gets a plain message instead of a
   * raw Postgres error. The enforce_captain_base_fare_floor trigger is still the authority;
   * this only saves a round trip.
   */
  const validateTariff = () => {
    const parsedBaseFare = inputToNumber(baseFare);
    const parsedPerKm = inputToNumber(pricePerKm);
    const parsedPerMin = inputToNumber(pricePerMin);

    // All three blank is allowed — it just leaves the tariff unset, and the mandatory modal
    // will ask for it. Filling only some of them is not.
    const filled = [parsedBaseFare, parsedPerKm, parsedPerMin].filter((value) => value !== null).length;
    if (filled === 0) return '';
    if (filled < 3) return t('tariffIncomplete');

    if (parsedBaseFare! < minBaseFare) return t('tariffBaseFareTooLow', { min: minBaseFare.toFixed(2) });
    if (parsedPerKm! <= 0) return t('tariffPerKmInvalid');
    if (parsedPerMin! < 0) return t('tariffPerMinInvalid');
    return '';
  };

  const saveProfile = async () => {
    if (!user?.uid) return;

    if (!fullName.trim() || !phone.trim()) {
      toast({ variant: 'destructive', title: t('saveErrorTitle'), description: t('saveErrorDescription') });
      return;
    }

    // Only let the tariff block the save when the captain actually touched the tariff.
    //
    // This used to run on EVERY save, so an unrelated tariff problem stopped a captain
    // editing their own company name — and `minBaseFare` is the market-derived floor, which
    // moves. A captain whose stored base_fare predates a rise in that floor was permanently
    // locked out of editing any field on this page.
    //
    // And the block was SILENT from where the click happened: setTariffError writes into the
    // tariff panel ~160 lines further down, so the button simply appeared dead. Now it says
    // so on the spot.
    const tariffTouched = [
      ['baseFare', baseFare],
      ['includedKm', includedKm],
      ['pricePerKm', pricePerKm],
      ['pricePerMin', pricePerMin],
    ].some(([key, value]) => String(value ?? '') !== String(savedSnapshotRef.current[key as string] ?? ''));

    if (tariffTouched) {
      const tariffProblem = validateTariff();
      setTariffError(tariffProblem);
      if (tariffProblem) {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: tariffProblem });
        return;
      }
    } else {
      setTariffError('');
    }

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

      const { data: updatedRows, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.uid)
        .select('id');
      if (error) throw error;

      // A row blocked by RLS (or a stale/missing id) comes back as success
      // with zero affected rows, not an error — without this check the UI
      // would report "saved" while nothing actually changed server-side.
      const profileWriteConfirmed = Array.isArray(updatedRows) && updatedRows.length > 0;

      if (!profileWriteConfirmed || Object.keys(vehicleColumnPayload).length === 0) {
        const metadataSaved = await saveProfileToAuthMetadata();
        if (!profileWriteConfirmed && !metadataSaved) {
          throw new Error('profile_update_not_confirmed');
        }
      }

      // Riders see vehicle details (including color) via captain_profiles,
      // not profiles — without this, an edit here would keep showing riders
      // whatever was set at onboarding, since the two tables never synced.
      // `vehicle_type` stores the TAXI/PRIVATE affiliation marker, not the
      // vehicle make — it's NOT NULL, so it must be included even though
      // this screen never lets the captain change their affiliation: if no
      // captain_profiles row exists yet, the upsert becomes an insert and a
      // missing NOT NULL column fails outright rather than defaulting.
      const captainProfilePayload: Record<string, unknown> = {
        id: user.uid,
        vehicle_type: isTaxi ? 'TAXI' : 'PRIVATE',
        plate_number: vehicle.plate || null,
        vehicle_brand: vehicle.make || null,
        vehicle_model: vehicleModel.trim() || null,
        vehicle_year: vehicle.year ? Number(vehicle.year) || null : null,
        employment_type: businessName.trim() || null,
        nickname: nickname.trim() || null,
        // A vehicle's color isn't tied to how the captain is affiliated — office-taxi
        // captains can set it too, so this is unconditional, not just the smart-app branch.
        vehicle_color: vehicle.color || null,
        facebook_url: facebookUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
      };

      // Tariff columns are sent ONLY when the captain actually changed them.
      //
      // Re-sending an unchanged base_fare is what triggered
      // `base_fare_below_market_minimum` on an edit to the company name: the floor is
      // derived from the market average and moves, so a value that was legal when it was
      // set becomes illegal later, and re-submitting it re-runs the check. Omitting the
      // column leaves the stored value alone on the update path, and leaves the tariff
      // unset on a genuine first insert — which is what the setup modal then asks for.
      if (tariffTouched) {
        captainProfilePayload.base_fare = inputToNumber(baseFare);
        captainProfilePayload.price_per_km = inputToNumber(pricePerKm);
        captainProfilePayload.price_per_min = inputToNumber(pricePerMin);
        // NOT NULL with a zero default, so a blank field means "no allowance", not "unset".
        captainProfilePayload.included_km = inputToNumber(includedKm) ?? 0;
      }
      if (isTaxi) {
        captainProfilePayload.office_phone = officePhone.trim() || null;
        captainProfilePayload.side_id = sideId.trim() || null;
      } else {
        captainProfilePayload.company_code = companyCode.trim() || null;
      }

      const { data: captainProfileRows, error: captainProfileError } = await supabase
        .from('captain_profiles')
        .upsert(captainProfilePayload, { onConflict: 'id' })
        .select('id');

      const captainProfileSynced = !captainProfileError && Array.isArray(captainProfileRows) && captainProfileRows.length > 0;

      // captain_profiles is the ONLY home for most of this page: nickname, company name,
      // company code, office phone, side id, social links and the whole tariff. `profiles`
      // above only ever receives full_name, phone and the vehicle columns.
      //
      // So when this upsert fails, almost nothing the captain edited was written. The code
      // used to log a dev-only warning, with its error toast commented out, and then call
      // captureSavedSnapshot() and report SUCCESS — which greys the save button out (nothing
      // left to save), closes the editor, and leaves the UI indistinguishable from a real
      // save while the backend has nothing. That is the "الزر بيقول تم بس مفيش تعديل ع
      // الباك اند" report.
      //
      // Twelve lines above, the profiles write guards against exactly this hazard and the
      // comment there spells it out: "the UI would report 'saved' while nothing actually
      // changed server-side". The same guard existed here; only its consequence was missing.
      if (!captainProfileSynced) {
        if ((process.env.NODE_ENV !== 'production')) {
          console.warn('[Driver profile save] captain_profiles sync failed:', captainProfileError || 'no rows affected');
        }

        // Thrown, not toasted-and-continued, so the snapshot is NOT advanced and the field
        // stays open with the captain's text still in it.
        //
        // Tagged, because the catch below falls back to saveProfileToAuthMetadata() and
        // reports success when THAT works — and auth user_metadata is not captain_profiles.
        // Riders read the company name, nickname and tariff from the table, so a metadata
        // write is not a save of these fields, and calling it one is the same lie in a
        // different place.
        throw Object.assign(
          new Error(captainProfileError?.message || 'captain_profile_update_not_confirmed'),
          { isCaptainProfileFailure: true },
        );
      }

      applySavedProfileState();
      captureSavedSnapshot();
      toast({ title: t('saveSuccessTitle'), description: t('saveSuccessDescription') });
      setEditingFields(new Set());
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver profile save]', error);

      // The metadata fallback cannot stand in for captain_profiles, so this failure is
      // reported as a failure — with the database's own message, because "تعذر الحفظ" alone
      // does not distinguish an RLS denial from a NOT NULL violation from a missing column,
      // and those need different fixes.
      if ((error as { isCaptainProfileFailure?: boolean })?.isCaptainProfileFailure) {
        toast({
          variant: 'destructive',
          title: t('saveErrorTitle'),
          description: error instanceof Error ? error.message : t('saveErrorDescription'),
        });
        return;
      }

      const fallbackSaved = (process.env.NODE_ENV !== 'production') && !isUuid(user.uid)
        ? true
        : await saveProfileToAuthMetadata();
      if (fallbackSaved) {
        applySavedProfileState();
        captureSavedSnapshot();
        toast({ title: t('saveSuccessTitle'), description: t('saveSuccessDescription') });
        setEditingFields(new Set());
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
      captain_profile: {
        ...(getCaptainProfile(current || null) || {}),
        vehicle_model: vehicleModel.trim(),
        employment_type: businessName.trim(),
        nickname: nickname.trim(),
        office_phone: officePhone.trim(),
        side_id: sideId.trim(),
        company_code: companyCode.trim(),
        facebook_url: facebookUrl.trim(),
        instagram_url: instagramUrl.trim(),
      },
    }));
  };

  // Reads the CURRENT field values right after a confirmed successful save — safe to read
  // directly (not stale) since nothing has changed them since the user's last edit.
  const captureSavedSnapshot = () => {
    savedSnapshotRef.current = {
      fullName, nickname, phone, vehiclePlate, vehicleMake, vehicleModel, vehicleColor, vehicleYear,
      businessName, officePhone, sideId, companyCode, facebookUrl, instagramUrl,
      baseFare, includedKm, pricePerKm, pricePerMin,
    };
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

  const isFieldEditing = (key: string) => editingFields.has(key);
  const handleFieldSave = () => void saveProfile();


  return (
    <section className={styles.style300_16}>
      <div className={styles.style430_61}>
        <Panel icon={<IdCard className={styles.style431_62} />} title={t('account')}>
          {/* Fixed at registration — matches the national ID card, so it never gets a pencil. */}
          <Field label={t('name')} value={fullName} />
          <EditableField
            label={t('nickname')}
            value={firstString(nickname, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.nickname, t('notProvided'))}
            isEditing={isFieldEditing('nickname')}
            isSaving={isSaving}
            onEdit={() => startEditingField('nickname')}
            onSave={handleFieldSave}
            onCancel={() => { setNickname(savedSnapshotRef.current.nickname); stopEditingField('nickname'); }}
          >
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} className={styles.editingInput} />
          </EditableField>
          <EditableField
            label={t('phone')}
            value={phone}
            originalValue={savedSnapshotRef.current.phone}
            isEditing={isFieldEditing('phone')}
            isSaving={isSaving}
            onEdit={() => startEditingField('phone')}
            onSave={handleFieldSave}
            onCancel={() => { setPhone(savedSnapshotRef.current.phone); stopEditingField('phone'); }}
          >
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className={styles.editingInput} />
          </EditableField>
          {/* The only thing that makes password recovery self-service. Without it a locked
              out captain must go through an admin, who then has the power to set their
              password. Shared component — the same "unconfirmed is not yet active" caveat
              has to read identically on every screen that offers this. */}
          <div className={styles.recoveryEmailBlock}>
            <RecoveryEmailField />
          </div>
          <Field label={t('accountNumber')} value={firstString(profile?.serial_id, user?.serial_id, '-')} />
          <Field label={t('role')} value={t('captainRole')} />
          <Field label={t('tier')} value={tier.label} />
          {/* Identity-verification data set at registration — read-only here too. */}
          <Field label={t('nationalIdNumber')} value={firstString(nationalIdNumber, t('notProvided'))} />
          <Field label={t('licenseNumber')} value={firstString(licenseNumber, t('notProvided'))} />
        </Panel>

        <Panel icon={<Car className={styles.style439_63} />} title={t('vehicle')}>
          <EditableField
            label={t('plate')}
            value={firstString(vehiclePlate, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehiclePlate, t('notProvided'))}
            isEditing={isFieldEditing('vehiclePlate')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehiclePlate')}
            onSave={handleFieldSave}
            onCancel={() => { setVehiclePlate(savedSnapshotRef.current.vehiclePlate); stopEditingField('vehiclePlate'); }}
          >
            <input value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value)} className={styles.editingInput} />
          </EditableField>
          <EditableField
            label={t('make')}
            value={firstString(vehicleMake, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehicleMake, t('notProvided'))}
            isEditing={isFieldEditing('vehicleMake')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehicleMake')}
            onSave={handleFieldSave}
            onCancel={() => { setVehicleMake(savedSnapshotRef.current.vehicleMake); stopEditingField('vehicleMake'); }}
          >
            <input value={vehicleMake} onChange={(event) => setVehicleMake(event.target.value)} className={styles.editingInput} />
          </EditableField>
          <EditableField
            label={t('model')}
            value={firstString(vehicleModel, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehicleModel, t('notProvided'))}
            isEditing={isFieldEditing('vehicleModel')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehicleModel')}
            onSave={handleFieldSave}
            onCancel={() => { setVehicleModel(savedSnapshotRef.current.vehicleModel); stopEditingField('vehicleModel'); }}
          >
            <input value={vehicleModel} onChange={(event) => setVehicleModel(event.target.value)} className={styles.editingInput} />
          </EditableField>
          {/* Fixed at registration — never editable from the account. */}
          <Field label={t('color')} value={vehicleColor ? resolveColorDisplayName(vehicleColor, language) : t('notProvided')} />
          <EditableField
            label={t('year')}
            value={firstString(vehicleYear, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehicleYear, t('notProvided'))}
            isEditing={isFieldEditing('vehicleYear')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehicleYear')}
            onSave={handleFieldSave}
            onCancel={() => { setVehicleYear(savedSnapshotRef.current.vehicleYear); stopEditingField('vehicleYear'); }}
          >
            <input
              value={vehicleYear}
              onChange={(event) => setVehicleYear(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
              inputMode="numeric"
              className={styles.editingInput}
            />
          </EditableField>
          <EditableField
            label={isTaxi ? t('officeName') : t('companyName')}
            value={firstString(businessName, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.businessName, t('notProvided'))}
            isEditing={isFieldEditing('businessName')}
            isSaving={isSaving}
            onEdit={() => startEditingField('businessName')}
            onSave={handleFieldSave}
            onCancel={() => { setBusinessName(savedSnapshotRef.current.businessName); stopEditingField('businessName'); }}
          >
            <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className={styles.editingInput} />
          </EditableField>
          {!isTaxi ? (
            <EditableField
              label={t('companyCode')}
              value={firstString(companyCode, t('notProvided'))}
              originalValue={firstString(savedSnapshotRef.current.companyCode, t('notProvided'))}
              isEditing={isFieldEditing('companyCode')}
              isSaving={isSaving}
              onEdit={() => startEditingField('companyCode')}
              onSave={handleFieldSave}
              onCancel={() => { setCompanyCode(savedSnapshotRef.current.companyCode); stopEditingField('companyCode'); }}
            >
              <input value={companyCode} onChange={(event) => setCompanyCode(event.target.value)} className={styles.editingInput} dir="ltr" />
            </EditableField>
          ) : null}
          {isTaxi ? (
            <>
              <EditableField
                label={t('officePhone')}
                value={firstString(officePhone, t('notProvided'))}
                originalValue={firstString(savedSnapshotRef.current.officePhone, t('notProvided'))}
                isEditing={isFieldEditing('officePhone')}
                isSaving={isSaving}
                onEdit={() => startEditingField('officePhone')}
                onSave={handleFieldSave}
                onCancel={() => { setOfficePhone(savedSnapshotRef.current.officePhone); stopEditingField('officePhone'); }}
              >
                <input value={officePhone} onChange={(event) => setOfficePhone(event.target.value)} className={styles.editingInput} />
              </EditableField>
              <EditableField
                label={t('sideId')}
                value={firstString(sideId, t('notProvided'))}
                originalValue={firstString(savedSnapshotRef.current.sideId, t('notProvided'))}
                isEditing={isFieldEditing('sideId')}
                isSaving={isSaving}
                onEdit={() => startEditingField('sideId')}
                onSave={handleFieldSave}
                onCancel={() => { setSideId(savedSnapshotRef.current.sideId); stopEditingField('sideId'); }}
              >
                <input value={sideId} onChange={(event) => setSideId(event.target.value)} className={styles.editingInput} />
              </EditableField>
            </>
          ) : null}
          <EditableField
            label={t('facebook')}
            value={firstString(facebookUrl, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.facebookUrl, t('notProvided'))}
            isEditing={isFieldEditing('facebookUrl')}
            isSaving={isSaving}
            onEdit={() => startEditingField('facebookUrl')}
            onSave={handleFieldSave}
            onCancel={() => { setFacebookUrl(savedSnapshotRef.current.facebookUrl); stopEditingField('facebookUrl'); }}
          >
            <input value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} className={styles.editingInput} dir="ltr" />
          </EditableField>
          <EditableField
            label={t('instagram')}
            value={firstString(instagramUrl, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.instagramUrl, t('notProvided'))}
            isEditing={isFieldEditing('instagramUrl')}
            isSaving={isSaving}
            onEdit={() => startEditingField('instagramUrl')}
            onSave={handleFieldSave}
            onCancel={() => { setInstagramUrl(savedSnapshotRef.current.instagramUrl); stopEditingField('instagramUrl'); }}
          >
            <input value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className={styles.editingInput} dir="ltr" />
          </EditableField>
        </Panel>

        <Panel icon={<Wallet className={styles.style439_63} />} title={t('tariffTitle')}>
          <EditableField
            label={`${t('tariffBaseFare')} (${t('tariffMinimum', { min: minBaseFare.toFixed(2) })})`}
            value={firstString(baseFare, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.baseFare, t('notProvided'))}
            isEditing={isFieldEditing('baseFare')}
            isSaving={isSaving}
            onEdit={() => startEditingField('baseFare')}
            onSave={handleFieldSave}
            onCancel={() => { setBaseFare(savedSnapshotRef.current.baseFare); stopEditingField('baseFare'); }}
          >
            <input
              value={baseFare}
              onChange={(event) => setBaseFare(event.target.value)}
              type="number"
              inputMode="decimal"
              min={minBaseFare}
              step="0.01"
              className={styles.editingInput}
            />
          </EditableField>
          <EditableField
            label={t('tariffIncludedKm')}
            value={firstString(includedKm, '0')}
            originalValue={firstString(savedSnapshotRef.current.includedKm, '0')}
            isEditing={isFieldEditing('includedKm')}
            isSaving={isSaving}
            onEdit={() => startEditingField('includedKm')}
            onSave={handleFieldSave}
            onCancel={() => { setIncludedKm(savedSnapshotRef.current.includedKm); stopEditingField('includedKm'); }}
          >
            <input
              value={includedKm}
              onChange={(event) => setIncludedKm(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              className={styles.editingInput}
            />
          </EditableField>
          <EditableField
            label={t('tariffPerKm')}
            value={firstString(pricePerKm, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.pricePerKm, t('notProvided'))}
            isEditing={isFieldEditing('pricePerKm')}
            isSaving={isSaving}
            onEdit={() => startEditingField('pricePerKm')}
            onSave={handleFieldSave}
            onCancel={() => { setPricePerKm(savedSnapshotRef.current.pricePerKm); stopEditingField('pricePerKm'); }}
          >
            <input
              value={pricePerKm}
              onChange={(event) => setPricePerKm(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.editingInput}
            />
          </EditableField>
          <EditableField
            label={t('tariffPerMin')}
            value={firstString(pricePerMin, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.pricePerMin, t('notProvided'))}
            isEditing={isFieldEditing('pricePerMin')}
            isSaving={isSaving}
            onEdit={() => startEditingField('pricePerMin')}
            onSave={handleFieldSave}
            onCancel={() => { setPricePerMin(savedSnapshotRef.current.pricePerMin); stopEditingField('pricePerMin'); }}
          >
            <input
              value={pricePerMin}
              onChange={(event) => setPricePerMin(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.editingInput}
            />
          </EditableField>
          {tariffError ? <p className={styles.tariffError}>{tariffError}</p> : null}
        </Panel>
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
      {/* dir="auto" so a Latin value truncates from its own tail instead of the RTL page's. */}
      <p dir="auto" className={styles.style474_75}>{value}</p>
    </div>
  );
}

/**
 * A Field that turns into its own input the moment its pencil is tapped —
 * per field, not a page-wide toggle, so tapping one field's pencil leaves
 * every other field showing its plain value. Once the typed value actually
 * differs from `originalValue` (what's on the server right now), the pencil
 * slot swaps to a check + cancel (X) pair: check commits the save (the same
 * shared saveProfile, which writes every field's current value at once, not
 * just this one — there is no per-field partial write); X calls `onCancel`,
 * which reverts this field's own state and closes it without saving.
 *
 * Clicking away with nothing changed closes the field back to its pencil on
 * its own (via onBlur, using the standard focus-left-the-whole-group check
 * so clicking the check/cancel buttons themselves — which briefly steal
 * focus from the input — doesn't trigger this). Clicking away WITH a real
 * edit pending does nothing: silently discarding a typed change just
 * because focus moved elsewhere would be surprising, so that only happens
 * through the explicit X.
 */
function EditableField({
  label,
  value,
  originalValue,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  label: string;
  value: string;
  originalValue: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const fieldActions = useTranslations('captainProfile');

  if (isEditing) {
    const isChanged = value !== originalValue;
    return (
      <label
        className={styles.editableFieldEditingWrap}
        onBlur={(event) => {
          if (!isChanged && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
            onCancel();
          }
        }}
      >
        <div className={styles.editableFieldEditingRow}>
          <span className={styles.editableFieldEditingLabel}>{label}</span>
          {/* Always rendered while editing, disabled until something actually changes.
              Previously the whole group only appeared once the value differed, so opening a
              field showed no save control at all and there was nothing to tell the captain
              their edit needed saving. Both buttons also carried aria-label={label}, which
              announced them identically — "Save" and "Cancel" were indistinguishable to a
              screen reader. */}
          <div className={styles.editActionGroup}>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !isChanged}
              className={styles.editSaveButton}
            >
              <Check className={styles.editSaveIcon} />
              <span className={styles.editActionText}>{fieldActions('saveChanges')}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className={styles.editCancelButton}
            >
              <X className={styles.editSaveIcon} />
              <span className={styles.editActionText}>{fieldActions('cancelChanges')}</span>
            </button>
          </div>
        </div>
        {children}
      </label>
    );
  }

  return (
    <div className={styles.editableField}>
      <div className={styles.editableFieldBody}>
        <p className={styles.style473_74}>{label}</p>
        {/* dir="auto" so a Latin value truncates from its own tail instead of the RTL page's. */}
      <p dir="auto" className={styles.style474_75}>{value}</p>
      </div>
      <button type="button" onClick={onEdit} aria-label={label} className={styles.editPencilButton}>
        <Pencil className={styles.editPencilIcon} />
      </button>
    </div>
  );
}

/** Empty string means "not set"; the column stays NULL so the setup modal keeps gating. */
function inputToNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberToInput(value: unknown) {
  const parsed = Number(value);
  return value === null || value === undefined || !Number.isFinite(parsed) ? '' : String(parsed);
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
  // captain_profiles.vehicle_year is a Postgres integer (unlike profiles'
  // text column of the same name) — firstString only matches actual strings,
  // so a numeric year from captain_profiles was silently skipped every time.
  const captainYear = captainProfile?.vehicle_year;
  return firstString(
    profile?.vehicle_year,
    profile?.model_year,
    typeof captainYear === 'number' ? String(captainYear) : captainYear,
  );
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
