import { NextRequest, NextResponse } from 'next/server';

import { isGoogleMapsLink, parseGoogleMapsLocation } from '@/shared/services/google-maps-location';

const MAX_REDIRECTS = 6;
const REQUEST_TIMEOUT_MS = 5_000;

export async function GET(request: NextRequest) {
  const shortUrl = request.nextUrl.searchParams.get('url')?.trim() || '';
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
        { error: 'coordinates_not_found', resolvedUrl },
        { status: 422 },
      );
    }

    const geography = await reverseResolveGeography(location);
    return NextResponse.json({ resolvedUrl, location, geography });
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
        'User-Agent': 'Mozilla/5.0 (compatible; RadarLocationResolver/1.0)',
      },
    });
    const locationHeader = response.headers.get('location');
    if (!locationHeader) return response.url || currentUrl;

    const nextUrl = new URL(locationHeader, currentUrl);
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
      'User-Agent': 'Mozilla/5.0 (compatible; RadarLocationResolver/1.0)',
    },
  });

  if (!response.ok) return null;
  return parseGoogleMapsLocation(await response.text());
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
      district: firstAddressValue(address, 'county', 'municipality', 'city_district', 'suburb'),
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
