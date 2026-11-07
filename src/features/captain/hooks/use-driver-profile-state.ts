import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import { useTranslations } from 'next-intl';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import {
  type ProfileRow,
  type TFunction,
  inputToNumber,
  numberToInput,
  firstString,
  firstNumber,
  getVehiclePlate,
  getVehicleMake,
  getVehicleColor,
  getVehicleYear,
  getCaptainProfile,
  getCaptainTier,
  buildVehicleColumnPayload,
  buildCaptainProfileDbPayload,
  fetchCaptainFullProfileData,
  extractDriverProfileInitialValues,
  saveProfileToAuthMetadata,
  parseProfileSaveError,
  mergeSavedProfileState,
  validateDriverTariff,
  getDevMockDriverProfile,
  isUuid,
} from '../services/driver-profile-helpers';

export function useDriverProfileState(user: User | null, toast: any) {
  const t = useTranslations('captainProfile');
  
const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [fullName, setFullName] = React.useState(user?.name || '');
  const [nickname, setNickname] = React.useState('');
  const [phone, setPhone] = React.useState(user?.phone || '');
  // Identity-verification data set once at registration — read-only here, never
  // part of the save payload.
  const [nationalIdNumber, setNationalIdNumber] = React.useState(''); const [licenseNumber, setLicenseNumber] = React.useState('');
  const [vehiclePlate, setVehiclePlate] = React.useState('');
  const [vehicleMake, setVehicleMake] = React.useState(''); const [vehicleModel, setVehicleModel] = React.useState('');
  const [vehicleColor, setVehicleColor] = React.useState(''); const [vehicleYear, setVehicleYear] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [officePhone, setOfficePhone] = React.useState(''); const [sideId, setSideId] = React.useState('');
  // Smart-app/independent captains only — the aggregator's own partner code.
  const [companyCode, setCompanyCode] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState(''); const [instagramUrl, setInstagramUrl] = React.useState('');
  // The captain's own tariff, the same three components the activation modal collects.
  const [baseFare, setBaseFare] = React.useState('');
  const [pricePerKm, setPricePerKm] = React.useState(''); const [pricePerMin, setPricePerMin] = React.useState('');
  // NOT NULL with a zero default server-side, so this is '0' rather than blank when unset.
  const [includedKm, setIncludedKm] = React.useState('');
  // Market-derived floor from captain_base_fare_floor(); a trigger re-checks it on save.
  const [minBaseFare, setMinBaseFare] = React.useState(1);
  const [tariffError, setTariffError] = React.useState('');
  const initialAffiliation = (user?.affiliation?.type as string) || 'independent';
  const [affiliationType, setAffiliationType] = React.useState(initialAffiliation);
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
    affiliationType: initialAffiliation,
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
          const mock = getDevMockDriverProfile(user);
          setProfile(mock.profile);
          setFullName(mock.devFullName);
          setPhone(mock.devPhone);
          setVehiclePlate(mock.devVehiclePlate);
          setVehicleMake(mock.devVehicleMake);
          setVehicleColor(mock.devVehicleColor);
          setVehicleYear(mock.devVehicleYear);
          savedSnapshotRef.current = {
            ...savedSnapshotRef.current,
            fullName: mock.devFullName,
            phone: mock.devPhone,
            vehiclePlate: mock.devVehiclePlate,
            vehicleMake: mock.devVehicleMake,
            vehicleColor: mock.devVehicleColor,
            vehicleYear: mock.devVehicleYear,
          };
          return;
        }

        const { profile: data, captainProfile, floor } = await fetchCaptainFullProfileData(user!.uid);
        if (!active) return;
        if (floor != null && Number.isFinite(floor)) setMinBaseFare(floor);

        const initial = extractDriverProfileInitialValues(data, captainProfile, user);

        setProfile(initial.mergedProfile);
        setFullName(initial.fullName);
        setNickname(initial.nickname);
        setPhone(initial.phone);
        setNationalIdNumber(initial.nationalIdNumber);
        setLicenseNumber(initial.licenseNumber);
        setVehiclePlate(initial.vehiclePlate);
        setVehicleMake(initial.vehicleMake);
        setVehicleColor(initial.vehicleColor);
        setVehicleYear(initial.vehicleYear);
        setBaseFare(initial.baseFare);
        setPricePerKm(initial.pricePerKm);
        setPricePerMin(initial.pricePerMin);
        setIncludedKm(initial.includedKm);
        setVehicleModel(initial.vehicleModel);
        setOfficePhone(initial.officePhone);
        setSideId(initial.sideId);
        setCompanyCode(initial.companyCode);
        setFacebookUrl(initial.facebookUrl);
        setInstagramUrl(initial.instagramUrl);
        setAffiliationType(initial.affiliationType);
        setBusinessName(initial.businessName);

        savedSnapshotRef.current = {
          fullName: initial.fullName,
          nickname: initial.nickname,
          phone: initial.phone,
          vehiclePlate: initial.vehiclePlate,
          vehicleMake: initial.vehicleMake,
          vehicleModel: initial.vehicleModel,
          vehicleColor: initial.vehicleColor,
          vehicleYear: initial.vehicleYear,
          businessName: initial.businessName,
          officePhone: initial.officePhone,
          sideId: initial.sideId,
          companyCode: initial.companyCode,
          facebookUrl: initial.facebookUrl,
          instagramUrl: initial.instagramUrl,
          baseFare: initial.baseFare,
          includedKm: initial.includedKm,
          pricePerKm: initial.pricePerKm,
          pricePerMin: initial.pricePerMin,
          affiliationType: initial.affiliationType,
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
  }, [profileReloadToken, user?.name, user?.phone, user?.serial_id, user?.uid, user?.vehicle?.color, user?.vehicle?.make, user?.vehicle?.plate, user?.vehicle?.year, user?.subRole, user?.affiliation?.type, (user?.affiliation as any)?.name]);

  // Real-time synchronization: reload profile immediately whenever admin updates tier, rating, or verification
  React.useEffect(() => {
    if (!user?.uid) return;
    const channel = supabase
      .channel(`driver-profile-realtime-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.uid}`,
        },
        () => {
          setProfileReloadToken((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'captain_profiles',
          filter: `id=eq.${user.uid}`,
        },
        () => {
          setProfileReloadToken((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [user?.uid]);

  const rating = firstNumber(profile?.trust_score, profile?.rating, profile?.trust_rating, user?.rating, 5);
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const tier = getCaptainTier(profile, normalizedRating, t, user?.rank);

  /**
   * Mirrors the checks in the setup modal so the captain gets a plain message instead of a
   * raw Postgres error. The enforce_captain_base_fare_floor trigger is still the authority;
   * this only saves a round trip.
   */
  const validateTariff = () => validateDriverTariff(baseFare, pricePerKm, pricePerMin, minBaseFare, t);

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
        const metadataSaved = await triggerAuthMetadataFallback();
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
      const captainProfilePayload = buildCaptainProfileDbPayload({
        userId: user.uid,
        affiliationType,
        businessName,
        vehicle,
        vehicleModel,
        nickname,
        facebookUrl,
        instagramUrl,
        tariffTouched,
        baseFare,
        pricePerKm,
        pricePerMin,
        includedKm,
        officePhone,
        sideId,
        companyCode,
      });

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
      if (user?.uid) {
        void recordLegalDeclaration({
          userId: user.uid,
          userSerialId: user.serial_id,
          actionType: 'PROFILE_UPDATE',
          actionLabel: 'تعديل بيانات الحساب والمركبة',
          fieldsChanged: Array.from(editingFields),
          isArabic: true,
        });
      }
      toast({ title: t('saveSuccessTitle'), description: t('saveSuccessDescription') });
      setEditingFields(new Set());
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver profile save]', error);

      const { isDuplicatePhone, isDuplicatePlate } = parseProfileSaveError(error);
      if (isDuplicatePhone) {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: 'رقم الهاتف مسجل بالفعل لحساب آخر في النظام. يرجى استخدام رقم آخر.' });
        return;
      }
      if (isDuplicatePlate) {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: 'رقم لوحة المركبة مسجل بالفعل لمركبة أخرى في النظام. يرجى استخدام لوحة أخرى.' });
        return;
      }

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
        : await triggerAuthMetadataFallback();
      if (fallbackSaved) {
        applySavedProfileState();
        captureSavedSnapshot();
      if (user?.uid) {
        void recordLegalDeclaration({
          userId: user.uid,
          userSerialId: user.serial_id,
          actionType: 'PROFILE_UPDATE',
          actionLabel: 'تعديل بيانات الحساب والمركبة',
          fieldsChanged: Array.from(editingFields),
          isArabic: true,
        });
      }
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
    if (affiliationType === 'independent') {
      setBusinessName('');
      setCompanyCode('');
      setOfficePhone('');
      setSideId('');
    }
    setProfile((current) => mergeSavedProfileState(current, {
      fullName, phone, vehiclePlate, vehicleMake, vehicleColor, vehicleYear,
      affiliationType, vehicleModel, businessName, nickname, officePhone, sideId,
      companyCode, facebookUrl, instagramUrl,
    }));
  };

  // Reads the CURRENT field values right after a confirmed successful save — safe to read
  // directly (not stale) since nothing has changed them since the user's last edit.
  const captureSavedSnapshot = () => {
    savedSnapshotRef.current = {
      fullName, nickname, phone, vehiclePlate, vehicleMake, vehicleModel, vehicleColor, vehicleYear,
      businessName: affiliationType === 'independent' ? '' : businessName, officePhone, sideId, companyCode, facebookUrl, instagramUrl,
      baseFare, includedKm, pricePerKm, pricePerMin,
      affiliationType,
    };
  };

  const triggerAuthMetadataFallback = () => saveProfileToAuthMetadata({
    fullName, phone, affiliationType, businessName, companyCode, officePhone, sideId,
    vehicle: { plate: vehiclePlate, make: vehicleMake, color: vehicleColor, year: vehicleYear },
  });

  const isFieldEditing = (key: string) => editingFields.has(key);
  const [showAccuracyModal, setShowAccuracyModal] = React.useState(false);
  const handleFieldSave = () => setShowAccuracyModal(true);
  const confirmSaveProfile = () => {
    setShowAccuracyModal(false);
    void saveProfile();
  };
  const cancelSaveProfile = () => setShowAccuracyModal(false);

  return {
    profile, fullName, setFullName, nickname, setNickname, phone, setPhone,
    nationalIdNumber, licenseNumber, vehiclePlate, setVehiclePlate,
    vehicleMake, setVehicleMake, vehicleModel, setVehicleModel,
    vehicleColor, setVehicleColor, vehicleYear, setVehicleYear, businessName, setBusinessName,
    officePhone, setOfficePhone, sideId, setSideId, companyCode, setCompanyCode,
    facebookUrl, setFacebookUrl, instagramUrl, setInstagramUrl,
    baseFare, setBaseFare, pricePerKm, setPricePerKm, pricePerMin, setPricePerMin,
    includedKm, setIncludedKm, minBaseFare, tariffError, affiliationType, setAffiliationType, isTaxi,
    isSaving, isFieldEditing, startEditingField, stopEditingField, savedSnapshotRef,
    isLoadingProfile, profileLoadFailed, setProfileReloadToken, handleFieldSave, tier,
    showAccuracyModal, confirmSaveProfile, cancelSaveProfile
  };
}
