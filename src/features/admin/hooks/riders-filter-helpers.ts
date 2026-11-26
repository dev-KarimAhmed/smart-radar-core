import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import type { RiderUser } from '@/features/admin/types/rider-management';

export interface RidersFilterSnapshot {
  searchQuery: string;
  statusFilter: string;
  immunityFilter: string;
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
}

export const INITIAL_RIDERS_FILTER_SNAPSHOT: RidersFilterSnapshot = {
  searchQuery: '',
  statusFilter: 'ALL',
  immunityFilter: 'ALL',
  selectedCountry: 'ALL',
  selectedGovernorate: 'ALL',
  selectedDistrict: 'ALL',
};

export function hasAnyRidersFilter(s: RidersFilterSnapshot): boolean {
  return (
    s.searchQuery.trim() !== '' ||
    s.statusFilter !== 'ALL' ||
    s.immunityFilter !== 'ALL' ||
    s.selectedCountry !== 'ALL' ||
    s.selectedGovernorate !== 'ALL' ||
    s.selectedDistrict !== 'ALL'
  );
}

export function areRidersFiltersEqual(
  a: RidersFilterSnapshot,
  b: RidersFilterSnapshot
): boolean {
  return (
    a.searchQuery.trim() === b.searchQuery.trim() &&
    a.statusFilter === b.statusFilter &&
    a.immunityFilter === b.immunityFilter &&
    a.selectedCountry === b.selectedCountry &&
    a.selectedGovernorate === b.selectedGovernorate &&
    a.selectedDistrict === b.selectedDistrict
  );
}

export function matchesRiderSnapshot(
  r: RiderUser,
  s: RidersFilterSnapshot,
  geoLookup: GeoLookup
): boolean {
  const q = s.searchQuery.toLowerCase().trim();
  const matchesSearch =
    !q ||
    r.full_name.toLowerCase().includes(q) ||
    r.phone.toLowerCase().includes(q) ||
    r.serial_id.toLowerCase().includes(q) ||
    (r.governorate && r.governorate.toLowerCase().includes(q)) ||
    (r.district && r.district.toLowerCase().includes(q)) ||
    (r.country_name && r.country_name.toLowerCase().includes(q));

  const matchesStatus =
    s.statusFilter === 'ALL' || r.status === s.statusFilter;

  let matchesImmunity = true;
  if (s.immunityFilter === 'HIGH') matchesImmunity = r.trust_score >= 4.5;
  else if (s.immunityFilter === 'WARNING') {
    matchesImmunity = r.trust_score >= 4.2 && r.trust_score < 4.5;
  } else if (s.immunityFilter === 'CRITICAL') {
    matchesImmunity = r.trust_score < 4.2;
  }

  const targetCountry = geoLookup.countries.find(
    (cntry) => String(cntry.id) === s.selectedCountry
  );
  const matchesCountry =
    s.selectedCountry === 'ALL' ||
    r.country_id === Number(s.selectedCountry) ||
    Boolean(
      targetCountry &&
        (r.country_name === targetCountry.name_ar ||
          (targetCountry.country_code &&
            r.phone?.startsWith(
              targetCountry.country_code === 'EG' ? '+20' : '+962'
            )))
    );

  const targetGov = geoLookup.governorates.find(
    (g) => String(g.id) === s.selectedGovernorate
  );
  const matchesGov =
    s.selectedGovernorate === 'ALL' ||
    r.governorate_id === Number(s.selectedGovernorate) ||
    Boolean(targetGov && r.governorate === targetGov.name_ar);

  const targetDist = geoLookup.districts.find(
    (d) => String(d.id) === s.selectedDistrict
  );
  const matchesDist =
    s.selectedDistrict === 'ALL' ||
    r.district_id === Number(s.selectedDistrict) ||
    Boolean(targetDist && r.district === targetDist.name_ar);

  return (
    Boolean(matchesSearch) &&
    matchesStatus &&
    matchesImmunity &&
    matchesCountry &&
    matchesGov &&
    matchesDist
  );
}
