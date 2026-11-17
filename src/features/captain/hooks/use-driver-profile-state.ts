import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import { useTranslations } from 'next-intl';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import {
  inputToNumber,
  firstNumber,
  getCaptainTier,
  getCaptainProfile,
  isUuid,
} from '../services/driver-profile-helpers';
import {
  validateTariffFields,
  saveProfileToAuthMetadata,
  executeProfileDatabaseSave,
} from '../services/driver-profile-service';
import { fetchDriverProfileData } from '../services/driver-profile-loader';
import { useDriverProfileFields } from './use-driver-profile-fields';

export function useDriverProfileState(user: User | null, toast: any) {
  const t = useTranslations('captainProfile');
  const f = useDriverProfileFields(user);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(Boolean(user?.uid));
  const [profileLoadFailed, setProfileLoadFailed] = React.useState(false);
  const [profileReloadToken, setProfileReloadToken] = React.useState(0);
  const [showAccuracyModal, setShowAccuracyModal] = React.useState(false);

  React.useEffect(() => {
    if (!user?.uid) {
      f.setProfile(null);
      setIsLoadingProfile(false);
      setProfileLoadFailed(false);
      return;
    }
    let active = true;
    setIsLoadingProfile(true);
    setProfileLoadFailed(false);

    async function load() {
      try {
        const { profile: loadedProfile, fields, minBaseFare: loadedFloor } = await fetchDriverProfileData(user!);
        if (!active) return;
        f.setProfile(loadedProfile);
        f.setFullName(fields.fullName);
        f.setNickname(fields.nickname);
        f.setPhone(fields.phone);
        f.setNationalIdNumber(fields.nationalIdNumber);
        f.setLicenseNumber(fields.licenseNumber);
        f.setVehiclePlate(fields.vehiclePlate);
        f.setVehicleMake(fields.vehicleMake);
        f.setVehicleModel(fields.vehicleModel);
        f.setVehicleColor(fields.vehicleColor);
        f.setVehicleYear(fields.vehicleYear);
        f.setBusinessName(fields.businessName);
        f.setOfficePhone(fields.officePhone);
        f.setSideId(fields.sideId);
        f.setCompanyCode(fields.companyCode);
        f.setFacebookUrl(fields.facebookUrl);
        f.setInstagramUrl(fields.instagramUrl);
        f.setBaseFare(fields.baseFare);
        f.setPricePerKm(fields.pricePerKm);
        f.setPricePerMin(fields.pricePerMin);
        f.setIncludedKm(fields.includedKm);
        f.setAffiliationType(fields.affiliationType);
        if (loadedFloor !== undefined) f.setMinBaseFare(loadedFloor);
        f.savedSnapshotRef.current = { ...fields };
      } catch (err) {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production') console.warn('[Driver profile]', err);
        f.setProfile(null);
        setProfileLoadFailed(true);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [profileReloadToken, user?.uid, user?.name, user?.phone, user?.serial_id, user?.vehicle?.color, user?.vehicle?.make, user?.vehicle?.plate, user?.vehicle?.year, user?.subRole, user?.affiliation?.type, (user?.affiliation as any)?.name]);

  React.useEffect(() => {
    if (!user?.uid) return;
    const channel = supabase
      .channel(`driver-profile-realtime-${user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.uid}` }, () => {
        setProfileReloadToken((prev) => prev + 1);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captain_profiles', filter: `id=eq.${user.uid}` }, () => {
        setProfileReloadToken((prev) => prev + 1);
      })
      .subscribe();

    return () => { void channel.unsubscribe(); };
  }, [user?.uid]);

  const rating = firstNumber(f.profile?.trust_score, f.profile?.rating, f.profile?.trust_rating, user?.rating, 5);
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const tier = getCaptainTier(f.profile, normalizedRating, t, user?.rank);
  const validateTariff = () => validateTariffFields(f.baseFare, f.pricePerKm, f.pricePerMin, f.includedKm, t);

  const validateBeforeSave = (): { valid: true; tariffTouched: boolean } | { valid: false } => {
    if (!user?.uid) return { valid: false };
    if (!f.fullName.trim() || !f.phone.trim() || !f.vehiclePlate.trim() || (!f.isTaxi && !f.vehicleColor.trim())) {
      const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
      const desc = !f.vehiclePlate.trim() ? (isEn ? 'Vehicle plate number is required.' : 'رقم لوحة المركبة مطلوب ولا يمكن تركه فارغاً.') : (!f.isTaxi && !f.vehicleColor.trim()) ? (isEn ? 'Vehicle color is required.' : 'لون المركبة مطلوب ولا يمكن تركه فارغاً.') : t('saveErrorDescription');
      toast({ variant: 'destructive', title: t('saveErrorTitle'), description: desc });
      return { valid: false };
    }
    const tariffTouched = [
      ['baseFare', f.baseFare],
      ['includedKm', f.includedKm],
      ['pricePerKm', f.pricePerKm],
      ['pricePerMin', f.pricePerMin],
    ].some(([key, val]) => String(val ?? '') !== String(f.savedSnapshotRef.current[key as string] ?? ''));

    if (tariffTouched) {
      const tariffProblem = validateTariff();
      f.setTariffError(tariffProblem);
      if (tariffProblem) {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: tariffProblem });
        return { valid: false };
      }
    } else {
      f.setTariffError('');
    }
    return { valid: true, tariffTouched };
  };

  const saveProfile = async () => {
    const check = validateBeforeSave();
    if (!check.valid || !user?.uid) return;
    const { tariffTouched } = check;
    setIsSaving(true);

    try {
      await executeProfileDatabaseSave({
        userId: user.uid, fullName: f.fullName, phone: f.phone, nickname: f.nickname,
        affiliationType: f.affiliationType, businessName: f.businessName, officePhone: f.officePhone,
        sideId: f.sideId, companyCode: f.companyCode, facebookUrl: f.facebookUrl, instagramUrl: f.instagramUrl,
        vehiclePlate: f.vehiclePlate, vehicleMake: f.vehicleMake, vehicleModel: f.vehicleModel,
        vehicleColor: f.vehicleColor, vehicleYear: f.vehicleYear, baseFare: f.baseFare,
        includedKm: f.includedKm, pricePerKm: f.pricePerKm, pricePerMin: f.pricePerMin,
        tariffTouched, profile: f.profile,
      });

      applySavedProfileState();
      captureSavedSnapshot();
      if (tariffTouched && user?.uid && typeof window !== 'undefined') {
        try {
          const mode = f.affiliationType === 'independent' ? 'FREE' : f.isTaxi ? 'TAXI' : 'APP';
          localStorage.setItem(`radar_captain_tariff_${user.uid}`, JSON.stringify({
            baseFare: inputToNumber(f.baseFare), pricePerKm: inputToNumber(f.pricePerKm),
            pricePerMin: inputToNumber(f.pricePerMin), includedKm: Math.max(0, inputToNumber(f.includedKm) ?? 0),
            pricingMode: mode,
          }));
        } catch {}
      }
      recordAuditLog();
      toast({ title: t('saveSuccessTitle'), description: t('saveSuccessDescription') });
      f.setEditingFields(new Set());
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver profile save]', error);
      const errText = `${error instanceof Error ? error.message : ''} ${JSON.stringify(error || '')}`.toLowerCase();
      if (errText.includes('unique_profiles_phone') || (errText.includes('phone') && errText.includes('duplicate'))) {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: 'رقم الهاتف مسجل بالفعل لحساب آخر في النظام. يرجى استخدام رقم آخر.' });
        return;
      }
      if (errText.includes('unique_plate_number') || errText.includes('unique_profiles_vehicle_plate') || (errText.includes('plate') && errText.includes('duplicate'))) {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: 'رقم لوحة المركبة مسجل بالفعل لمركبة أخرى في النظام. يرجى استخدام لوحة أخرى.' });
        return;
      }
      if ((error as { isCaptainProfileFailure?: boolean })?.isCaptainProfileFailure) {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: error instanceof Error ? error.message : t('saveErrorDescription') });
        return;
      }
      const fallbackSaved = process.env.NODE_ENV !== 'production' && !isUuid(user.uid) ? true : await saveProfileToAuthMetadata({
        fullName: f.fullName, phone: f.phone, affiliationType: f.affiliationType, businessName: f.businessName,
        companyCode: f.companyCode, officePhone: f.officePhone, sideId: f.sideId, vehiclePlate: f.vehiclePlate,
        vehicleMake: f.vehicleMake, vehicleColor: f.vehicleColor, vehicleYear: f.vehicleYear,
      });
      if (fallbackSaved) {
        applySavedProfileState();
        captureSavedSnapshot();
        recordAuditLog();
        toast({ title: t('saveSuccessTitle'), description: t('saveSuccessDescription') });
        f.setEditingFields(new Set());
      } else {
        toast({ variant: 'destructive', title: t('saveErrorTitle'), description: t('saveErrorDescription') });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const recordAuditLog = () => {
    if (user?.uid) {
      void recordLegalDeclaration({
        userId: user.uid, userSerialId: user.serial_id, actionType: 'PROFILE_UPDATE',
        actionLabel: 'تعديل بيانات الحساب والمركبة', fieldsChanged: Array.from(f.editingFields), isArabic: true,
      });
    }
  };

  const applySavedProfileState = () => {
    if (f.affiliationType === 'independent') {
      f.setBusinessName(''); f.setCompanyCode(''); f.setOfficePhone(''); f.setSideId('');
    }
    f.setProfile((current) => ({
      ...(current || {}), full_name: f.fullName.trim(), phone: f.phone.trim(),
      vehicle_plate: f.vehiclePlate.trim(), vehicle_make: f.vehicleMake.trim(),
      vehicle_color: f.vehicleColor.trim(), vehicle_year: f.vehicleYear.trim(),
      captain_profile: {
        ...(getCaptainProfile(current || null) || {}), affiliation_type: f.affiliationType,
        vehicle_model: f.vehicleModel.trim(), employment_type: f.affiliationType === 'independent' ? 'مستقل' : f.businessName.trim(),
        nickname: f.nickname.trim(), office_phone: f.affiliationType === 'office-taxi' ? f.officePhone.trim() : '',
        side_id: f.affiliationType === 'office-taxi' ? f.sideId.trim() : '', company_code: f.affiliationType === 'smart-app' ? f.companyCode.trim() : '',
        facebook_url: f.facebookUrl.trim(), instagram_url: f.instagramUrl.trim(),
        base_fare: inputToNumber(f.baseFare), price_per_km: inputToNumber(f.pricePerKm),
        price_per_min: inputToNumber(f.pricePerMin), included_km: Math.max(0, inputToNumber(f.includedKm) ?? 0),
      },
    }));
  };

  const captureSavedSnapshot = () => {
    f.savedSnapshotRef.current = {
      fullName: f.fullName, nickname: f.nickname, phone: f.phone, vehiclePlate: f.vehiclePlate,
      vehicleMake: f.vehicleMake, vehicleModel: f.vehicleModel, vehicleColor: f.vehicleColor, vehicleYear: f.vehicleYear,
      businessName: f.affiliationType === 'independent' ? '' : f.businessName, officePhone: f.officePhone, sideId: f.sideId,
      companyCode: f.companyCode, facebookUrl: f.facebookUrl, instagramUrl: f.instagramUrl,
      baseFare: f.baseFare, includedKm: f.includedKm, pricePerKm: f.pricePerKm, pricePerMin: f.pricePerMin,
      affiliationType: f.affiliationType,
    };
  };

  return {
    ...f, isFieldEditing: (key: string) => f.editingFields.has(key),
    isSaving, isLoadingProfile, profileLoadFailed, setProfileReloadToken, tier,
    showAccuracyModal,
    handleFieldSave: () => { if (validateBeforeSave().valid) setShowAccuracyModal(true); },
    confirmSaveProfile: () => { setShowAccuracyModal(false); void saveProfile(); },
    cancelSaveProfile: () => setShowAccuracyModal(false),
  };
}

export * from '../services/driver-profile-helpers';
export * from '../services/driver-profile-service';
export * from '../services/driver-profile-loader';
export * from './use-driver-profile-fields';
