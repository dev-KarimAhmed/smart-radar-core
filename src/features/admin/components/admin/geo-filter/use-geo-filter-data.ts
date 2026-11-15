'use client';

import { useMemo } from 'react';
import type { GeoLookup, GeoCountry, GeoGovernorate, GeoDistrict } from './geo-filter-types';
import { getCountryFlag } from './geo-filter-types';

export function useGeoFilterData(
  geoLookup: GeoLookup,
  selectedCountry: string,
  selectedGovernorate: string,
) {
  const countries = useMemo(() => {
    if (geoLookup.countries && geoLookup.countries.length > 0) {
      return geoLookup.countries;
    }
    return [
      { id: 1, name_ar: 'الأردن', country_code: 'JO' },
      { id: 2, name_ar: 'مصر', country_code: 'EG' },
    ];
  }, [geoLookup.countries]);

  const govCountryMap = useMemo(() => {
    const map = new Map<number, number>();
    (geoLookup.governorates || []).forEach((g) => {
      map.set(g.id, g.country_id);
    });
    return map;
  }, [geoLookup.governorates]);

  const filteredGovernorates = useMemo(() => {
    if (!geoLookup.governorates) return [];
    if (selectedCountry === 'ALL') {
      return geoLookup.governorates;
    }
    const cId = Number(selectedCountry);
    return geoLookup.governorates.filter((g) => g.country_id === cId);
  }, [geoLookup.governorates, selectedCountry]);

  const filteredDistricts = useMemo(() => {
    if (!geoLookup.districts) return [];
    if (selectedGovernorate !== 'ALL') {
      const gId = Number(selectedGovernorate);
      return geoLookup.districts.filter((d) => d.governorate_id === gId);
    }
    if (selectedCountry !== 'ALL') {
      const govIds = new Set(filteredGovernorates.map((g) => g.id));
      return geoLookup.districts.filter((d) => govIds.has(d.governorate_id));
    }
    return geoLookup.districts;
  }, [geoLookup.districts, selectedGovernorate, selectedCountry, filteredGovernorates]);

  const groupedGovernorates = useMemo(() => {
    return countries
      .map((c) => ({
        country: c,
        flag: getCountryFlag(c),
        governorates: filteredGovernorates.filter((g) => g.country_id === c.id),
      }))
      .filter((group) => group.governorates.length > 0);
  }, [countries, filteredGovernorates]);

  const groupedDistricts = useMemo(() => {
    return countries
      .map((c) => ({
        country: c,
        flag: getCountryFlag(c),
        districts: filteredDistricts.filter((d) => {
          const cId = govCountryMap.get(d.governorate_id);
          return cId === c.id;
        }),
      }))
      .filter((group) => group.districts.length > 0);
  }, [countries, filteredDistricts, govCountryMap]);

  return {
    countries,
    groupedGovernorates,
    groupedDistricts,
  };
}
