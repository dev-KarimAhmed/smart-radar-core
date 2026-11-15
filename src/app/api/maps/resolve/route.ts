import { NextRequest, NextResponse } from 'next/server';

import {
  isGoogleMapsLink,
  parseGoogleMapsLocation,
  sanitizeGoogleMapsUrl,
} from '@/shared/services/google-maps-location';
import {
  isValidLocation,
  followGoogleMapsRedirects,
  readGoogleMapsPageLocation,
} from './maps-resolve-redirects';
import {
  geocodePlaceName,
  crossCheckPlaceName,
  reverseResolveGeography,
} from './maps-resolve-geography';

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')?.trim() || '';
  const latParam = Number(request.nextUrl.searchParams.get('lat'));
  const lngParam = Number(request.nextUrl.searchParams.get('lng'));
  const locationHint = isValidLocation(latParam, lngParam) ? { lat: latParam, lng: lngParam } : undefined;

  const shortUrl = sanitizeGoogleMapsUrl(rawUrl);
  if (!isGoogleMapsLink(shortUrl)) {
    return NextResponse.json({ error: 'invalid_maps_url' }, { status: 400 });
  }

  try {
    const directLocation = parseGoogleMapsLocation(shortUrl, locationHint);
    const resolvedUrl = directLocation ? shortUrl : await followGoogleMapsRedirects(shortUrl);
    let location = directLocation || parseGoogleMapsLocation(resolvedUrl, locationHint);

    // A Google short link may resolve to a place URL without coordinates in
    // the address. Fetch the final page and inspect its map bootstrap payload.
    if (!location) {
      location = await readGoogleMapsPageLocation(resolvedUrl);
    }

    // If coordinates are still missing, attempt cascading locality geocode:
    if (!location) {
      const fallback = await geocodePlaceName(resolvedUrl, locationHint);
      if (fallback) {
        location = { lat: fallback.lat, lng: fallback.lng };
      }
    }

    if (!location) {
      return NextResponse.json(
        { error: 'coordinates_not_found', resolvedUrl: sanitizeGoogleMapsUrl(resolvedUrl) },
        { status: 422 },
      );
    }

    const placeNameCheck = await crossCheckPlaceName(resolvedUrl, location);
    // We deliberately do not override the parsed location with the geocoded location here,
    // even if they are drastically mismatched. Nominatim's global search can return a place
    // on the other side of the world for generic names like "KFC" or "Dubai Mall", and
    // overriding the explicit URL coordinate with Nominatim's guess causes wrong addresses.

    const geography = await reverseResolveGeography(location);
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
