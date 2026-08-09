export interface DestinationSearchLocation {
  lat: number;
  lng: number;
}

export interface DestinationSearchMatch {
  placeId: number;
  label: string;
  location: DestinationSearchLocation;
}

export interface DestinationSearchScope {
  language: string;
  countryIsoCode?: string | null;
  biasLocation?: DestinationSearchLocation | null;
}

// Soft-bias radius around the selected area/current position. Nominatim's
// `bounded=0` only ranks matches inside this box higher — it does not
// exclude results outside it, unlike `countrycodes`, which is a hard filter.
const BIAS_BOX_DEGREES = 0.4;

export function deriveCountryIsoCode(nameAr?: string | null, nameEn?: string | null): string | null {
  const normalized = `${nameAr || ''} ${nameEn || ''}`.toLocaleLowerCase();
  if (normalized.includes('egypt') || normalized.includes('مصر')) return 'eg';
  if (normalized.includes('jordan') || normalized.includes('أردن') || normalized.includes('اردن')) return 'jo';
  return null;
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildViewbox(center: DestinationSearchLocation) {
  const left = center.lng - BIAS_BOX_DEGREES;
  const right = center.lng + BIAS_BOX_DEGREES;
  const top = center.lat + BIAS_BOX_DEGREES;
  const bottom = center.lat - BIAS_BOX_DEGREES;
  return `${left},${top},${right},${bottom}`;
}

function buildNominatimUrl(query: string, options: {
  limit: number;
  language: string;
  countryIsoCode?: string | null;
  biasLocation?: DestinationSearchLocation | null;
}) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(options.limit),
    'accept-language': options.language,
  });
  if (options.countryIsoCode) params.set('countrycodes', options.countryIsoCode);
  if (options.biasLocation) {
    params.set('viewbox', buildViewbox(options.biasLocation));
    params.set('bounded', '0');
  }
  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}

function mapNominatimResults(payload: unknown): DestinationSearchMatch[] {
  return (Array.isArray(payload) ? payload : []).flatMap((item: any) => {
    const lat = Number(item?.lat);
    const lng = Number(item?.lon);
    const label = String(item?.display_name || '').trim();
    const placeId = Number(item?.place_id);
    return Number.isFinite(lat) && Number.isFinite(lng) && label && Number.isFinite(placeId)
      ? [{ placeId, label, location: { lat, lng } }]
      : [];
  });
}

/**
 * Searches OpenStreetMap/Nominatim for a destination, biased toward the
 * caller's selected area/current position instead of concatenating district
 * and governorate names into the free-text query (which was silently
 * defeating matches whenever the query and the appended names were in
 * different scripts). Falls back to an unrestricted global search when the
 * biased/country-scoped attempt finds nothing, so a real match outside the
 * selected area still surfaces. Role-agnostic — usable by any feature that
 * needs a destination/place search.
 */
export async function searchDestinationPlaces(
  rawQuery: string,
  scope: DestinationSearchScope,
  options: { limit?: number; signal?: AbortSignal } = {},
): Promise<DestinationSearchMatch[]> {
  const query = normalizeSearchText(rawQuery);
  if (query.length < 2) return [];

  const limit = options.limit ?? 5;
  const fetchNominatim = async (biasLocation?: DestinationSearchLocation | null, countryIsoCode?: string | null) => {
    const response = await fetch(
      buildNominatimUrl(query, { limit, language: scope.language, countryIsoCode, biasLocation }),
      { signal: options.signal, headers: { Accept: 'application/json' } },
    );
    if (!response.ok) throw new Error(`Destination search failed: ${response.status}`);
    return mapNominatimResults(await response.json());
  };

  const scoped = await fetchNominatim(scope.biasLocation, scope.countryIsoCode);
  if (scoped.length) return scoped;

  return fetchNominatim(null, null);
}
