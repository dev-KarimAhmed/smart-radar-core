'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CaptainUser } from '@/features/admin/types/driver-management';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';

export function useDriversFilters(captains: CaptainUser[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<'ALL' | 'ar' | 'en'>('ALL');

  // Geographic filtering state
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [geoLookup, setGeoLookup] = useState<GeoLookup>({
    countries: [],
    governorates: [],
    districts: [],
  });

  // Multi-selection state
  const [selectedCaptainIds, setSelectedCaptainIds] = useState<Set<string>>(new Set());

  const handleCountryChange = useCallback((val: string) => {
    setSelectedCountry(val);
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
  }, []);

  const handleGovernorateChange = useCallback((val: string) => {
    setSelectedGovernorate(val);
    setSelectedDistrict('ALL');
    if (val !== 'ALL') {
      const gov = geoLookup.governorates.find((g) => String(g.id) === val);
      if (gov) {
        setSelectedCountry(String(gov.country_id));
      }
    }
  }, [geoLookup.governorates]);

  const handleDistrictChange = useCallback((val: string) => {
    setSelectedDistrict(val);
    if (val !== 'ALL') {
      const dist = geoLookup.districts.find((d) => String(d.id) === val);
      if (dist) {
        const gov = geoLookup.governorates.find((g) => g.id === dist.governorate_id);
        if (gov) {
          setSelectedGovernorate(String(gov.id));
          setSelectedCountry(String(gov.country_id));
        }
      }
    }
  }, [geoLookup.districts, geoLookup.governorates]);

  const handleResetGeo = useCallback(() => {
    setSelectedCountry('ALL');
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
  }, []);

  const handleResetAllFilters = useCallback(() => {
    setStatusFilter('ALL');
    setRankFilter('ALL');
    setLanguageFilter('ALL');
    setSelectedCountry('ALL');
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
    setSearchQuery('');
  }, []);

  const filteredCaptains = useMemo(() => {
    return captains.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.serial_id.toLowerCase().includes(q) ||
        c.vehicle.plate.toLowerCase().includes(q) ||
        c.vehicle.brand.toLowerCase().includes(q) ||
        c.vehicle.model.toLowerCase().includes(q) ||
        (c.governorate && c.governorate.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.country_name && c.country_name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        String(c.status || '').toUpperCase() === statusFilter.toUpperCase();

      const matchesRank =
        rankFilter === 'ALL' ||
        String(c.tier || '').toUpperCase() === rankFilter.toUpperCase();

      const targetCountry = geoLookup.countries.find((cntry) => String(cntry.id) === selectedCountry);
      const matchesCountry =
        selectedCountry === 'ALL' ||
        c.country_id === Number(selectedCountry) ||
        (targetCountry && (c.country_name === targetCountry.name_ar || (targetCountry.country_code && c.phone?.startsWith(targetCountry.country_code === 'EG' ? '+20' : '+962'))));

      const targetGov = geoLookup.governorates.find((g) => String(g.id) === selectedGovernorate);
      const matchesGov =
        selectedGovernorate === 'ALL' ||
        c.governorate_id === Number(selectedGovernorate) ||
        (targetGov && c.governorate === targetGov.name_ar);

      const targetDist = geoLookup.districts.find((d) => String(d.id) === selectedDistrict);
      const matchesDist =
        selectedDistrict === 'ALL' ||
        c.district_id === Number(selectedDistrict) ||
        (targetDist && c.district === targetDist.name_ar);

      const matchesLanguage =
        languageFilter === 'ALL' ||
        (c.preferred_language || 'ar').toLowerCase() === languageFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRank &&
        matchesLanguage &&
        matchesCountry &&
        matchesGov &&
        matchesDist
      );
    });
  }, [
    captains,
    searchQuery,
    statusFilter,
    rankFilter,
    languageFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
  ]);

  const stats = useMemo(() => {
    const total = captains.length;
    const active = captains.filter(c => c.status === 'ACTIVE' || c.status === 'BUSY').length;
    const flagged = captains.filter(c => c.status === 'SUSPENDED' || c.status === 'BANNED' || c.penalty_count > 0).length;
    return { total, active, flagged };
  }, [captains]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedCaptainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (filteredCaptains.length === 0) return;
    const allFilteredSelected = filteredCaptains.every((c) => selectedCaptainIds.has(c.id));
    if (allFilteredSelected) {
      setSelectedCaptainIds((prev) => {
        const next = new Set(prev);
        filteredCaptains.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedCaptainIds((prev) => {
        const next = new Set(prev);
        filteredCaptains.forEach((c) => next.add(c.id));
        return next;
      });
    }
  }, [filteredCaptains, selectedCaptainIds]);

  const clearSelection = useCallback(() => {
    setSelectedCaptainIds(new Set());
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    rankFilter,
    setRankFilter,
    languageFilter,
    setLanguageFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
    setGeoLookup,
    handleCountryChange,
    handleGovernorateChange,
    handleDistrictChange,
    handleResetGeo,
    handleResetAllFilters,
    filteredCaptains,
    stats,
    selectedCaptainIds,
    toggleSelectOne,
    toggleSelectAll,
    clearSelection,
  };
}

