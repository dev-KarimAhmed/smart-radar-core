import { NextRequest, NextResponse } from 'next/server';

import {
  extractGoogleMapsPlaceName,
  isGoogleMapsLink,
  parseGoogleMapsLocation,
  sanitizeGoogleMapsUrl,
} from '@/shared/services/google-maps-location';
import { calculateHaversineKm } from '@/lib/road-route';

const MAX_REDIRECTS = 6;
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * How far the coordinate we extracted may sit from where the place NAME in the same link
 * geocodes to before we stop trusting the extraction.
 *
 * This is the guard for the failure that actually bit us: a link for "مول العرب" that
 * resolved to a point ~15 km away, priced as a real trip because nothing ever asked whether
 * the coordinate and the name agreed. A distance cap cannot catch that — the wrong point was
 * a perfectly ordinary distance away. Two independent readings of the same link disagreeing
 * is the only signal that does.
 *
 * 3 km is wide enough for the normal case (a mall's geocoded centroid vs. its car-park pin,
 * a road-name match landing mid-street) and far narrower than a wrong-point error.
 */
const PLACE_NAME_MISMATCH_KM = 3;

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')?.trim() || '';
  const shortUrl = sanitizeGoogleMapsUrl(rawUrl);
  if (!isGoogleMapsLink(shortUrl)) {
    return NextResponse.json({ error: 'invalid_maps_url' }, { status: 400 });
  }

  try {
    const directLocation = parseGoogleMapsLocation(shortUrl);
    const resolvedUrl = directLocation ? shortUrl : await followGoogleMapsRedirects(shortUrl);
    let location = directLocation || parseGoogleMapsLocation(resolvedUrl);

    // A Google short link may resolve to a place URL without coordinates in
    // the address. Fetch the final page and inspect its map bootstrap payload.
    if (!location) {
      location = await readGoogleMapsPageLocation(resolvedUrl);
    }

    if (!location) {
      return NextResponse.json(
        { error: 'coordinates_not_found', resolvedUrl: sanitizeGoogleMapsUrl(resolvedUrl) },
        { status: 422 },
      );
    }

    const placeNameCheck = await crossCheckPlaceName(resolvedUrl, location);
    // If the extracted location is drastically mismatched (> 500 km, e.g. USA datacenter vs Middle East),
    // and the place name geocodes cleanly to a real spot, trust the geocoded location!
    if (
      placeNameCheck?.isMismatch
      && placeNameCheck.distanceKm > 500
      && Number.isFinite(placeNameCheck.geocodedLocation.lat)
      && Number.isFinite(placeNameCheck.geocodedLocation.lng)
    ) {
      location = placeNameCheck.geocodedLocation;
    }

    const geography = await reverseResolveGeography(location);
    return NextResponse.json({ resolvedUrl, location, geography, placeNameCheck });
    return NextResponse.json({
      resolvedUrl: sanitizeGoogleMapsUrl(resolvedUrl),
      location,
      geography,
      placeNameCheck,
    });
  } catch {
    return NextResponse.json({ error: 'maps_link_resolution_failed' }, { status: 502 });
  }
}

async function followGoogleMapsRedirects(initialUrl: string) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount < MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
    const locationHeader = response.headers.get('location');
    if (!locationHeader) return response.url || currentUrl;

    const nextUrl = new URL(locationHeader, currentUrl);
    // Google Maps redirects European / US requests to consent.google.com when cookies are absent.
    // The previous URL already contained the target place segment, so do not follow into consent.
    if (nextUrl.hostname.toLowerCase().startsWith('consent.')) {
      return currentUrl;
    }
    if (!isAllowedRedirectHost(nextUrl.hostname)) {
      throw new Error('disallowed_redirect_host');
    }
    currentUrl = nextUrl.toString();
  }

  throw new Error('too_many_redirects');
}

async function readGoogleMapsPageLocation(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) return null;
  return parseGoogleMapsLocation(await response.text());
}

/**
 * Second, independent reading of the same link: geocode the place NAME and see whether it
 * lands near the coordinate we extracted.
 *
 * Returns null when there is nothing to compare (no name in the URL, or the geocoder had no
 * answer). A null is "unknown", never "verified" — the caller must not treat it as a pass.
 */
async function crossCheckPlaceName(
  resolvedUrl: string,
  location: { lat: number; lng: number },
) {
  const rawPlaceName = extractGoogleMapsPlaceName(resolvedUrl);
  const placeName = rawPlaceName?.replace(/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\s*[-–—,]?\s*/i, '').trim() || null;
  // A bare coordinate link has no name to check against, and a name that is itself just
  // coordinates would only be comparing the extraction with itself.
  if (!placeName || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(placeName)) return null;

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      q: placeName,
      limit: '1',
      'accept-language': 'ar,en',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
      headers: { Accept: 'application/json', 'User-Agent': 'RadarLocationResolver/1.0' },
    });
    if (!response.ok) return null;

    const [match] = await response.json() as Array<{ lat?: string; lon?: string }>;
    const lat = Number(match?.lat);
    const lng = Number(match?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const distanceKm = calculateHaversineKm(location, { lat, lng });

    return {
      placeName,
      geocodedLocation: { lat, lng },
      distanceKm: Number(distanceKm.toFixed(2)),
      isMismatch: distanceKm > PLACE_NAME_MISMATCH_KM,
    };
  } catch {
    return null;
  }
}

async function reverseResolveGeography(location: { lat: number; lng: number }) {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(location.lat),
      lon: String(location.lng),
      zoom: '18',
      addressdetails: '1',
      'accept-language': 'ar,en',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RadarLocationResolver/1.0',
      },
    });
    if (!response.ok) return undefined;

    const payload = await response.json() as { address?: Record<string, unknown> };
    const address = payload.address || {};
    const governorateCandidates = addressValues(
      address,
      'state',
      'region',
      'province',
      'state_district',
    );
    const districtCandidates = addressValues(
      address,
      'neighbourhood',
      'suburb',
      'quarter',
      'borough',
      'city_district',
      'district',
      'municipality',
      'county',
      'city',
      'town',
      'village',
      'hamlet',
    );
    return {
      governorate: governorateCandidates[0] || null,
      // Was a separate, narrower list (county/municipality/city_district/suburb only) that
      // left out `neighbourhood` and `hamlet` — the two fields OSM actually tags most small
      // and old-city areas with (e.g. El-Gamaleya in Cairo has neither a suburb nor a
      // city_district tag, only a neighbourhood one). That gap meant `district` silently
      // fell through to `city` for exactly the residential-area case it exists to handle,
      // showing "Cairo - Cairo" instead of the real neighbourhood. `districtCandidates`
      // below was already the correct, complete priority order — reuse it here instead of
      // maintaining two different lists that can (and did) disagree.
      district: districtCandidates[0] || null,
      city: firstAddressValue(address, 'city', 'town', 'village', 'municipality'),
      governorateCandidates,
      districtCandidates,
    };
  } catch {
    return undefined;
  }
}

function firstAddressValue(address: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function addressValues(address: Record<string, unknown>, ...keys: string[]) {
  return keys
    .map((key) => address[key])
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.trim())
    .filter((value, index, values) => values.indexOf(value) === index);
}

function isAllowedRedirectHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'maps.app.goo.gl'
    || normalized === 'goo.gl'
    || normalized === 'google.com'
    || normalized.endsWith('.google.com')
  );
}
