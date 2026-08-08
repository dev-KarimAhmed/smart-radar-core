import type { ResolvedLocationGeography } from '@/shared/services/google-maps-location';

interface GovernorateNameOption {
  nameAr: string;
  nameEn: string;
}

interface DistrictNameOption {
  districtAr: string;
  districtEn: string;
}

interface LocatedDistrictOption {
  anchor: { lat: number; lng: number } | null;
}

export function findGovernorateForGeography<T extends GovernorateNameOption>(
  governorates: T[],
  geography?: ResolvedLocationGeography,
): T | null {
  const candidates = normalizedCandidates(
    geography?.governorate,
    ...(geography?.governorateCandidates || []),
  );
  return findSafeNameMatch(governorates, candidates, (item) => [item.nameAr, item.nameEn]);
}

export function findDistrictForGeography<T extends DistrictNameOption>(
  districts: T[],
  geography?: ResolvedLocationGeography,
): T | null {
  const candidates = normalizedCandidates(
    geography?.district,
    geography?.city,
    ...(geography?.districtCandidates || []),
  );
  return findSafeNameMatch(districts, candidates, (item) => [item.districtAr, item.districtEn]);
}

export function findNearestDistrict<T extends LocatedDistrictOption>(
  districts: T[],
  location: { lat: number; lng: number },
): T | null {
  let nearest: T | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const district of districts) {
    if (!district.anchor) continue;
    const distance = haversineDistanceKm(location, district.anchor);
    if (distance < nearestDistance) {
      nearest = district;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function findSafeNameMatch<T>(
  options: T[],
  candidates: string[],
  getNames: (option: T) => string[],
): T | null {
  for (const candidate of candidates) {
    const exact = options.find((option) => (
      getNames(option).some((name) => normalizeLocationName(name) === candidate)
    ));
    if (exact) return exact;
  }

  for (const candidate of candidates) {
    if (candidate.length < 4) continue;
    const contained = options.filter((option) => (
      getNames(option).some((name) => {
        const normalizedName = normalizeLocationName(name);
        return normalizedName.length >= 4
          && (normalizedName.includes(candidate) || candidate.includes(normalizedName));
      })
    ));
    if (contained.length === 1) return contained[0];
  }

  return null;
}

function normalizedCandidates(...values: Array<string | null | undefined>) {
  return values
    .map((value) => normalizeLocationName(value || ''))
    .filter((value, index, valuesList) => value && valuesList.indexOf(value) === index);
}

function normalizeLocationName(value: string) {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/(^|\s)ال(?=\p{L})/gu, '$1')
    .replace(/\b(?:governorate|province|district|city|municipality)\b/gu, ' ')
    .replace(/\b(?:al|el)\b/gu, ' ')
    .replace(/(?:^|\s)(?:محافظة|مركز|قسم|حي|مدينة)(?=\s|$)/gu, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function haversineDistanceKm(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
) {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(second.lat - first.lat);
  const longitudeDelta = toRadians(second.lng - first.lng);
  const firstLatitude = toRadians(first.lat);
  const secondLatitude = toRadians(second.lat);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
