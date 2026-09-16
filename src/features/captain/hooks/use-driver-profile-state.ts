import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import { useTranslations } from 'next-intl';

type ProfileRow = Record<string, unknown>;

type TFunction = (key: string) => string;

export function useDriverProfileState(user: User | null, toast: any) {
  const t = useTranslations('captainProfile');
  
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

  const isFieldEditing = (key: string) => editingFields.has(key);
  const handleFieldSave = () => void saveProfile();

  return {
    profile, fullName, setFullName, nickname, setNickname, phone, setPhone,
    nationalIdNumber, licenseNumber, vehiclePlate, setVehiclePlate,
    vehicleMake, setVehicleMake, vehicleModel, setVehicleModel,
    vehicleColor, vehicleYear, setVehicleYear, businessName,
    officePhone, setOfficePhone, sideId, setSideId, companyCode, setCompanyCode,
    facebookUrl, setFacebookUrl, instagramUrl, setInstagramUrl,
    baseFare, setBaseFare, pricePerKm, setPricePerKm, pricePerMin, setPricePerMin,
    includedKm, setIncludedKm, minBaseFare, tariffError, affiliationType, isTaxi,
    isSaving, isFieldEditing, startEditingField, stopEditingField, savedSnapshotRef,
    isLoadingProfile, profileLoadFailed, setProfileReloadToken, handleFieldSave, tier
  };
}

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
