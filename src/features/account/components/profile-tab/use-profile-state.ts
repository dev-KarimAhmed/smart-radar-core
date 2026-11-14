import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { fetchFavoriteCaptainIds } from '../../services/favorite-captains';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { CountryRow, ProfileKey, ProfileRow } from './profile-shared';
import { getProfileName, normalizeRows, numberOrEmpty, fetchProfileByUserId } from './profile-shared';
import { useTranslations } from 'next-intl';
import { useProfileGeography } from './use-profile-geography';
import { useProfileSubmit } from './use-profile-submit';

export function useProfileState() {
  const { user, isCaptain, isPassenger, isSovereign, logout, loginAsMockUser } = useAuth();
  const { toast } = useToast();
  const { isArabic, language, toggleLanguage } = useDashboardLanguage();
  const t = useTranslations('profileTab');

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileKey, setProfileKey] = useState<ProfileKey | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyWhatsappContact, setEmergencyWhatsappContact] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const geography = useProfileGeography();
  const {
    countryId,
    setCountryId,
    governorateId,
    setGovernorateId,
    districtId,
    setDistrictId,
    setCountries,
    setIsLoadingCountries,
  } = geography;

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
  }, [toast, user?.countryId, user?.district, user?.governorate, user?.name, user?.phone, user?.uid, t, setCountries, setCountryId, setGovernorateId, setDistrictId, setIsLoadingCountries]);

  const submit = useProfileSubmit({
    user,
    profileKey,
    fullName,
    phone,
    emergencyWhatsappContact,
    countryId,
    governorateId,
    districtId,
    isArabic,
  });

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
    favoriteCount,
    fullName,
    setFullName,
    phone,
    setPhone,
    emergencyWhatsappContact,
    setEmergencyWhatsappContact,
    isLoadingProfile,
    ...geography,
    ...submit,
  };
}
