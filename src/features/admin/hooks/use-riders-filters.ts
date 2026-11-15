'use client';

import { useState, useMemo, useCallback } from 'react';
import type { RiderUser, RiderStats } from '@/features/admin/types/rider-management';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';

interface UseRidersFiltersProps {
  riders: RiderUser[];
}

export function useRidersFilters({ riders }: UseRidersFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [immunityFilter, setImmunityFilter] = useState<string>('ALL');

  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [geoLookup, setGeoLookup] = useState<GeoLookup>({
    countries: [],
    governorates: [],
    districts: [],
  });

  const [selectedRiderIds, setSelectedRiderIds] = useState<Set<string>>(new Set());

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

  const resetAllFilters = useCallback(() => {
    setStatusFilter('ALL');
    setImmunityFilter('ALL');
    setSelectedCountry('ALL');
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
    setSearchQuery('');
  }, []);

  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.serial_id.toLowerCase().includes(q) ||
        (r.governorate && r.governorate.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.country_name && r.country_name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' || r.status === statusFilter;

      let matchesImmunity = true;
      if (immunityFilter === 'HIGH') matchesImmunity = r.trust_score >= 4.5;
      else if (immunityFilter === 'WARNING') matchesImmunity = r.trust_score >= 4.2 && r.trust_score < 4.5;
      else if (immunityFilter === 'CRITICAL') matchesImmunity = r.trust_score < 4.2;

      const targetCountry = geoLookup.countries.find((cntry) => String(cntry.id) === selectedCountry);
      const matchesCountry =
        selectedCountry === 'ALL' ||
        r.country_id === Number(selectedCountry) ||
        (targetCountry && (r.country_name === targetCountry.name_ar || (targetCountry.country_code && r.phone?.startsWith(targetCountry.country_code === 'EG' ? '+20' : '+962'))));

      const targetGov = geoLookup.governorates.find((g) => String(g.id) === selectedGovernorate);
      const matchesGov =
        selectedGovernorate === 'ALL' ||
        r.governorate_id === Number(selectedGovernorate) ||
        (targetGov && r.governorate === targetGov.name_ar);

      const targetDist = geoLookup.districts.find((d) => String(d.id) === selectedDistrict);
      const matchesDist =
        selectedDistrict === 'ALL' ||
        r.district_id === Number(selectedDistrict) ||
        (targetDist && r.district === targetDist.name_ar);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesImmunity &&
        matchesCountry &&
        matchesGov &&
        matchesDist
      );
    });
  }, [
    riders,
    searchQuery,
    statusFilter,
    immunityFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
  ]);

  const handleSelectAll = useCallback(() => {
    if (selectedRiderIds.size === filteredRiders.length) {
      setSelectedRiderIds(new Set());
    } else {
      setSelectedRiderIds(new Set(filteredRiders.map((r) => r.id)));
    }
  }, [selectedRiderIds.size, filteredRiders]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedRiderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRiderIds(new Set());
  }, []);

  const stats: RiderStats = useMemo(() => {
    const total = riders.length;
    const online = riders.filter(r => r.status === 'ACTIVE' || r.status === 'BUSY').length;
    const idle = riders.filter(r => r.status === 'IDLE').length;
    const suspended = riders.filter(r => r.status === 'SUSPENDED' || r.status === 'BANNED').length;
    const atRisk = riders.filter(r => r.trust_score < 4.2 || r.consecutive_cancellations >= 3).length;
    const completedTrips = riders.reduce((acc, r) => acc + (r.completed_trips_count || 0), 0);
    return { total, online, idle, suspended, atRisk, completedTrips };
  }, [riders]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    immunityFilter,
    setImmunityFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
    setGeoLookup,
    handleCountryChange,
    handleGovernorateChange,
    handleDistrictChange,
    handleResetGeo,
    resetAllFilters,
    selectedRiderIds,
    handleSelectAll,
    handleToggleSelect,
    clearSelection,
    filteredRiders,
    stats,
  };
}

