import React from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase-client';
import { buildDistrictLoadKey } from '../services/rider-district-query';
import {
  normalizeDistricts,
  normalizeGovernorates,
  slugifyLocationPart,
  type DistrictOption,
  type GovernorateOption,
} from '../services/rider-destination-normalizers';
import type { RiderLocation } from '../components/rider-map';

interface RiderProfileLike { countryId?: number; governorate?: string; district?: string; }
export interface ExternalLocationContext { governorate?: string; district?: string; placeName?: string; }

/**
 * Loads governorates/districts for the account's country from Supabase, and
 * owns `externalLocationContext` (a clipboard-imported location outside the
 * database) since the district-fetch effect re-reads it every run, not just
 * once. Exposes raw list setters too, since `useClipboardLocationImport`
 * splices a synthetic "google:"-prefixed governorate/district into them.
 */
export function useDestinationGeographyData(
  user: RiderProfileLike | null | undefined,
  destinationPinLocation: RiderLocation | null,
) {
  const activeCountryId = user?.countryId;
  const [selectedGovernorateId, setSelectedGovernorateId] = React.useState('');
  const [draftDestinationId, setDraftDestinationId] = React.useState('');
  const [destinationGovernorates, setDestinationGovernorates] = React.useState<GovernorateOption[]>([]);
  const [destinationDistricts, setDestinationDistricts] = React.useState<DistrictOption[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = React.useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = React.useState(false);
  const [destinationDataError, setDestinationDataError] = React.useState<string | null>(null);
  const [externalLocationContext, setExternalLocationContext] = React.useState<ExternalLocationContext | null>(null);
  const t = useTranslations('riderView');

  const selectedGovernorate = React.useMemo(
    () => destinationGovernorates.find((governorate) => governorate.id === selectedGovernorateId) || null,
    [destinationGovernorates, selectedGovernorateId],
  );
  const districtLoadKey = buildDistrictLoadKey({
    selectedGovernorateId,
    destinationPinLocation,
    externalLocationContext,
    selectedGovernorateName: selectedGovernorate?.nameAr || selectedGovernorate?.nameEn || '',
  });

  const selectedDistrict = React.useMemo(() => {
    if (draftDestinationId) {
      const direct = destinationDistricts.find((district) => district.id === draftDestinationId);
      if (direct) return direct;
    }
    if (destinationPinLocation && destinationPinLocation.lat !== 0 && destinationPinLocation.lng !== 0) {
      const pinId = `map:${destinationPinLocation.lat.toFixed(5)}-${destinationPinLocation.lng.toFixed(5)}`;
      return {
        id: pinId,
        numericId: 0,
        governorateId: selectedGovernorateId || 'map',
        governorateAr: externalLocationContext?.governorate || selectedGovernorate?.nameAr || 'الموقع المحدد',
        governorateEn: externalLocationContext?.governorate || selectedGovernorate?.nameEn || 'Selected Location',
        districtAr: externalLocationContext?.district || externalLocationContext?.placeName || 'نقطة على الخريطة',
        districtEn: externalLocationContext?.district || externalLocationContext?.placeName || 'Map Point',
        anchor: destinationPinLocation,
        tortuosityFactor: 1.3,
      };
    }
    return null;
  }, [destinationDistricts, draftDestinationId, destinationPinLocation, externalLocationContext, selectedGovernorate, selectedGovernorateId]);

  const profileDistrict = React.useMemo(() => {
    const profileDistrictId = String(user?.district || '');
    return destinationDistricts.find((district) => district.id === profileDistrictId) || null;
  }, [destinationDistricts, user?.district]);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    setDestinationGovernorates([]);
    setDestinationDistricts([]);
    setSelectedGovernorateId('');
    setDraftDestinationId('');
    setDestinationDataError(null);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setDestinationDataError(t('destination.noCountryLinkedError'));
      return;
    }

    async function fetchDestinationGovernorates() {
      setIsLoadingGovernorates(true);
      try {
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('country_id', countryId)
          .order('id', { ascending: true });

        if (error) throw error;
        if (!active) return;

        const options = normalizeGovernorates(data, (id) => t('destination.governorateFallback', { id }));
        setDestinationGovernorates(options);

        const profileGovernorateId = String(user?.governorate || '');
        const preferred = options.find((governorate) => governorate.id === profileGovernorateId) || options[0] || null;
        setSelectedGovernorateId(preferred?.id || '');
        if (!preferred) setDestinationDataError(t('destination.noGovernoratesAvailableError'));
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Destinations: Governorates]', error);
        setDestinationDataError(t('request.networkError'));
      } finally {
        if (active) setIsLoadingGovernorates(false);
      }
    }

    void fetchDestinationGovernorates();

    return () => {
      active = false;
    };
  }, [activeCountryId, t, user?.governorate]);

  React.useEffect(() => {
    let active = true;
    const governorateId = Number(selectedGovernorateId);

    setDestinationDistricts([]);
    setDraftDestinationId('');
    setDestinationDataError(null);

    if (selectedGovernorateId.startsWith('google:')) {
      const governorate = externalLocationContext?.governorate || selectedGovernorate?.nameAr || '';
      const district = externalLocationContext?.district || externalLocationContext?.placeName || '';
      if (governorate && district && destinationPinLocation) {
        const externalDistrict: DistrictOption = {
          id: `google:${slugifyLocationPart(`${district}-${destinationPinLocation.lat}-${destinationPinLocation.lng}`)}`,
          numericId: 0,
          governorateId: selectedGovernorateId,
          governorateAr: governorate,
          governorateEn: governorate,
          districtAr: district,
          districtEn: district,
          anchor: destinationPinLocation,
          tortuosityFactor: 1.3,
        };
        setDestinationDistricts([externalDistrict]);
        setDraftDestinationId(externalDistrict.id);
      }
      setIsLoadingDistricts(false);
      return () => {
        active = false;
      };
    }

    if (!Number.isInteger(governorateId) || governorateId <= 0) {
      return;
    }

    async function fetchDestinationDistricts() {
      setIsLoadingDistricts(true);
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .eq('governorate_id', governorateId)
          .order('id', { ascending: true });

        if (error) throw error;
        if (!active) return;

        const options = normalizeDistricts(data, selectedGovernorate, (id) => t('destination.districtFallback', { id }));
        setDestinationDistricts(options);

        setDraftDestinationId('');
        if (options.length === 0) setDestinationDataError(t('destination.noDistrictsAvailableError'));
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Destinations: Districts]', error);
        setDestinationDataError(t('request.networkError'));
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }

    void fetchDestinationDistricts();

    return () => {
      active = false;
    };
    // `districtLoadKey` gates this effect to avoid re-fetching every pin-drag frame.
  }, [districtLoadKey, t, user?.district]);

  // Drops synthetic "google:" entries + external context, keeps selection.
  const clearExternalEntries = React.useCallback(() => {
    setExternalLocationContext(null);
    setDestinationGovernorates((current) => current.filter((item) => !item.id.startsWith('google:')));
    setDestinationDistricts((current) => current.filter((item) => !item.id.startsWith('google:')));
  }, []);

  // Used by the ride-request draft reset (cancel/send, and trip completion) —
  // returns the governorate back to the account's own default and clears the draft destination.
  const reset = React.useCallback(() => {
    clearExternalEntries();
    const profileGovernorateId = String(user?.governorate || '');
    const preferredGovernorate =
      destinationGovernorates.find((governorate) => governorate.id === profileGovernorateId)
      || destinationGovernorates[0]
      || null;
    const nextGovernorateId = preferredGovernorate?.id || '';
    setSelectedGovernorateId(nextGovernorateId);
    setDraftDestinationId('');
    setDestinationDataError(null);
  }, [clearExternalEntries, destinationGovernorates, user?.governorate]);

  return {
    activeCountryId,
    selectedGovernorateId,
    setSelectedGovernorateId,
    draftDestinationId,
    setDraftDestinationId,
    destinationGovernorates,
    setDestinationGovernorates,
    destinationDistricts,
    setDestinationDistricts,
    isLoadingGovernorates,
    isLoadingDistricts,
    destinationDataError,
    externalLocationContext,
    setExternalLocationContext,
    selectedGovernorate,
    selectedDistrict,
    profileDistrict,
    clearExternalEntries,
    reset,
  };
}
