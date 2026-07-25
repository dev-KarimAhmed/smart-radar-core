import { NextRequest, NextResponse } from 'next/server';

import { isGoogleMapsLink, parseGoogleMapsLocation } from '@/lib/google-maps-location';

const MAX_REDIRECTS = 6;
const REQUEST_TIMEOUT_MS = 5_000;

export async function GET(request: NextRequest) {
  const shortUrl = request.nextUrl.searchParams.get('url')?.trim() || '';
  if (!isGoogleMapsLink(shortUrl)) {
    return NextResponse.json({ error: 'invalid_maps_url' }, { status: 400 });
  }

  try {
    const resolvedUrl = await followGoogleMapsRedirects(shortUrl);
    let location = parseGoogleMapsLocation(resolvedUrl);

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

    return NextResponse.json({ resolvedUrl, location });
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

function isAllowedRedirectHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'maps.app.goo.gl'
    || normalized === 'goo.gl'
    || normalized === 'google.com'
    || normalized.endsWith('.google.com')
  );
}
