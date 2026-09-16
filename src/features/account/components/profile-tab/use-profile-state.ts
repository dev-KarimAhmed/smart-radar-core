import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { fetchFavoriteCaptainIds } from '../../services/favorite-captains';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { CountryRow, DistrictRow, GovernorateRow, ProfileKey, ProfileRow } from './profile-shared';
import { getProfileName, normalizeRows, numberOrEmpty, saveProfile, fetchProfileByUserId, normalizeInternationalPhone, mapProfileSaveError } from './profile-shared';
import { useTranslations } from 'next-intl';

export function useProfileState() {
  const { user, isCaptain, isPassenger, isSovereign, logout, loginAsMockUser } = useAuth();
  const { toast } = useToast();
  const { isArabic, language, toggleLanguage } = useDashboardLanguage();
  const t = useTranslations('profileTab');

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

  const isLocationLoading = isLoadingCountries || isLoadingGovernorates || isLoadingDistricts;

  const fetchBlockedCaptains = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingBlocks(true);
    try {
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

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, rating, serial_id')
        .in('id', blockedIds);

      if (profilesError) throw profilesError;

      const formatted = (profiles || []).map((prof: any) => ({
        id: prof.id,
        name: prof.full_name || t('blockedCaptain'),
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
  }, [user?.uid, t]);

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
        title: t('unblockSuccessTitle'),
        description: t('unblockSuccessDesc'),
      });

      fetchBlockedCaptains();
    } catch (err: any) {
      console.error('[Profile] Unblock captain error:', err);
      toast({
        variant: 'destructive',
        title: t('unblockErrorTitle'),
        description: err.message || t('unexpectedError'),
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
          title: t('loadErrorTitle'),
          description: t('loadErrorDesc'),
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
  }, [toast, user?.countryId, user?.district, user?.governorate, user?.name, user?.phone, user?.uid, t]);

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
            title: t('govLoadErrorTitle'),
            description: t('govLoadErrorDesc'),
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
  }, [countryId, toast, t]);

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
            title: t('districtLoadErrorTitle'),
            description: t('districtLoadErrorDesc'),
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
  }, [governorateId, toast, t]);

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
        title: t('incompleteData'),
        description: t('enterFullName'),
      });
      return;
    }

    if (![nextCountryId, nextGovernorateId, nextDistrictId].every((value) => Number.isInteger(value) && value > 0)) {
      toast({
        variant: 'destructive',
        title: t('incompleteData'),
        description: t('chooseLocationData'),
      });
      return;
    }

    const normalizedEmergencyWhatsapp = normalizeInternationalPhone(emergencyWhatsappContact);
    if (emergencyWhatsappContact.trim() && !normalizedEmergencyWhatsapp) {
      toast({
        variant: 'destructive',
        title: t('invalidEmergencyWhatsappTitle'),
        description: t('invalidEmergencyWhatsappDescription'),
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
      
      if (normalizedEmergencyWhatsapp) {
        localStorage.setItem(`radar_emergency_whatsapp_${user.uid}`, normalizedEmergencyWhatsapp);
      } else {
        localStorage.removeItem(`radar_emergency_whatsapp_${user.uid}`);
      }

      toast({
        title: t('saveSuccessTitle'),
        description: t('saveSuccessDesc'),
      });
    } catch (error) {
      const msg = mapProfileSaveError(error);
      toast({
        variant: 'destructive',
        title: t('saveErrorTitle'),
        description: t(msg as any),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    user,
    isCaptain,
    isPassenger,
    isSovereign,
    logout,
    loginAsMockUser,
    isArabic,
    language,
    toggleLanguage,
    t,
    profile,
    countries,
    governorates,
    districts,
    favoriteCount,
    blockedCaptains,
    confirmingUnblockId,
    setConfirmingUnblockId,
    isLoadingBlocks,
    fullName,
    setFullName,
    phone,
    setPhone,
    emergencyWhatsappContact,
    setEmergencyWhatsappContact,
    countryId,
    setCountryId,
    governorateId,
    setGovernorateId,
    districtId,
    setDistrictId,
    isLoadingProfile,
    isLoadingCountries,
    isLoadingGovernorates,
    isLoadingDistricts,
    isLocationLoading,
    isSaving,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    handleCountryChange,
    handleGovernorateChange,
    handleSubmit,
    handleUnblockCaptain
  };
}
