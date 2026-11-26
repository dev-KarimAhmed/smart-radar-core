import type { CaptainUser } from '@/features/admin/types/driver-management';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';

export interface DriversFilterSnapshot {
  searchQuery: string;
  statusFilter: string;
  rankFilter: string;
  languageFilter: 'ALL' | 'ar' | 'en';
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
}

export const INITIAL_DRIVERS_FILTER_SNAPSHOT: DriversFilterSnapshot = {
  searchQuery: '',
  statusFilter: 'ALL',
  rankFilter: 'ALL',
  languageFilter: 'ALL',
  selectedCountry: 'ALL',
  selectedGovernorate: 'ALL',
  selectedDistrict: 'ALL',
};

export function hasAnyDriversFilter(f: DriversFilterSnapshot): boolean {
  return (
    f.searchQuery.trim() !== '' ||
    f.statusFilter !== 'ALL' ||
    f.rankFilter !== 'ALL' ||
    f.languageFilter !== 'ALL' ||
    f.selectedCountry !== 'ALL' ||
    f.selectedGovernorate !== 'ALL' ||
    f.selectedDistrict !== 'ALL'
  );
}

export function areDriversFiltersEqual(a: DriversFilterSnapshot, b: DriversFilterSnapshot | null): boolean {
  if (!b) return false;
  return (
    a.searchQuery.trim() === b.searchQuery.trim() &&
    a.statusFilter === b.statusFilter &&
    a.rankFilter === b.rankFilter &&
    a.languageFilter === b.languageFilter &&
    a.selectedCountry === b.selectedCountry &&
    a.selectedGovernorate === b.selectedGovernorate &&
    a.selectedDistrict === b.selectedDistrict
  );
}

export function matchesCaptainSnapshot(
  c: CaptainUser,
  f: DriversFilterSnapshot,
  geoLookup: GeoLookup,
): boolean {
  const q = f.searchQuery.toLowerCase().trim();
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
    f.statusFilter === 'ALL' ||
    String(c.status || '').toUpperCase() === f.statusFilter.toUpperCase();

  const matchesRank =
    f.rankFilter === 'ALL' ||
    String(c.tier || '').toUpperCase() === f.rankFilter.toUpperCase();

  const targetCountry = geoLookup.countries.find((cntry) => String(cntry.id) === f.selectedCountry);
  const matchesCountry =
    f.selectedCountry === 'ALL' ||
    c.country_id === Number(f.selectedCountry) ||
    (targetCountry &&
      (c.country_name === targetCountry.name_ar ||
        (targetCountry.country_code &&
          c.phone?.startsWith(targetCountry.country_code === 'EG' ? '+20' : '+962'))));

  const targetGov = geoLookup.governorates.find((g) => String(g.id) === f.selectedGovernorate);
  const matchesGov =
    f.selectedGovernorate === 'ALL' ||
    c.governorate_id === Number(f.selectedGovernorate) ||
    (targetGov && c.governorate === targetGov.name_ar);

  const targetDist = geoLookup.districts.find((d) => String(d.id) === f.selectedDistrict);
  const matchesDist =
    f.selectedDistrict === 'ALL' ||
    c.district_id === Number(f.selectedDistrict) ||
    (targetDist && c.district === targetDist.name_ar);

  const matchesLanguage =
    f.languageFilter === 'ALL' ||
    (c.preferred_language || 'ar').toLowerCase() === f.languageFilter.toLowerCase();

  return Boolean(
    matchesSearch &&
      matchesStatus &&
      matchesRank &&
      matchesLanguage &&
      matchesCountry &&
      matchesGov &&
      matchesDist,
  );
}
