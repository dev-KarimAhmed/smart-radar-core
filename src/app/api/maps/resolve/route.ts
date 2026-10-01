import { NextRequest, NextResponse } from 'next/server';

import {
  extractGoogleMapsPlaceName,
  extractPlusCode,
  isGoogleMapsLink,
  parseGoogleMapsLocation,
  resolvePlusCodeLocation,
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

function isValidLocation(lat: number, lng: number) {
  return (
    Number.isFinite(lat)
    && Number.isFinite(lng)
    && Math.abs(lat) <= 90
    && Math.abs(lng) <= 180
    && !(lat === 0 && lng === 0)
  );
}

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
  const html = await response.text();

  // 1. Google's internal place preview endpoint (highest fidelity for true place pin)
  // Google place pages include: <link href="/maps/preview/place?authuser=0&hl=ar&gl=eg&q=...&pb=...">
  // which returns the actual place coordinates [[..., lng, lat], ...] regardless of caller GeoIP or map viewport.
  const previewMatch = /href=["'](\/maps\/preview\/place[^"']+)["']/i.exec(html);
  if (previewMatch && previewMatch[1]) {
    const previewPath: string = previewMatch[1];
    try {
      const previewUrl = 'https://www.google.com' + previewPath.replace(/&amp;/g, '&');
      const prevResponse = await fetch(previewUrl, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
      if (prevResponse.ok) {
        const prevText = await prevResponse.text();
        const coordMatch = prevText.match(
          /\[\[\s*[\d.]+\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/,
        );
        const lngStr = coordMatch?.[1];
        const latStr = coordMatch?.[2];
        if (lngStr && latStr) {
          const lng = Number(lngStr);
          const lat = Number(latStr);
          if (isValidLocation(lat, lng)) {
            return { lat, lng };
          }
        }
      }
    } catch {
      // preview fetch failed, continue to fallback
    }
  }

  // 2. Direct coordinate markers inside HTML (!3d, !4d) as fallback
  const direct = parseGoogleMapsLocation(html);
  if (direct) return direct;

  return null;
}

/**
 * Geocodes the place name using Nominatim with cascading locality fallback:
 * tries full clean place name, then drops specific venue and tries the district/governorate.
 */
function buildArabicPlaceQueryCandidates(rawName: string): string[] {
  const clean = rawName.replace(/[\u200B-\u200F\u202A-\u202E\u2060]/g, '').trim();
  const segments = clean.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  const primary = segments[0] || '';
  const lastSeg = segments[segments.length - 1] || '';

  const stripPrefixes = (s: string) =>
    s
      .replace(/\b(مركز|محافظة|محافظه|مدينة|مدينه|قرية|قريه|منطقة|منطقه|حي)\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const swapTehHeh = (s: string) =>
    s
      .split(' ')
      .map((w) => {
        if (w.endsWith('ه')) return `${w.slice(0, -1)}ة`;
        if (w.endsWith('ة')) return `${w.slice(0, -1)}ه`;
        return w;
      })
      .join(' ');

  const primaryClean = stripPrefixes(primary);
  const primaryAlt = swapTehHeh(primaryClean);
  const govClean = stripPrefixes(lastSeg);
  const govAlt = swapTehHeh(govClean);

  const broader = segments.slice(1).map(stripPrefixes).join(' ');
  const broaderAlt = swapTehHeh(broader);

  const queries: string[] = [];

  // 1. High-priority targeted queries: Primary place + governorate with normalized teh/heh
  if (primaryAlt && govClean && primaryAlt !== govClean) {
    queries.push(`${primaryAlt} ${govClean}`);
  }
  if (primaryClean && govClean && primaryClean !== govClean) {
    queries.push(`${primaryClean} ${govClean}`);
  }
  if (primaryAlt && broader && broader !== govClean) {
    queries.push(`${primaryAlt} ${broader}`);
    queries.push(`${primaryAlt} ${broaderAlt}`);
  }

  // 2. Full clean with normalized teh/heh and prefix stripping
  queries.push(swapTehHeh(clean.replace(/[,،]/g, ' ')));
  queries.push(clean.replace(/[,،]/g, ' '));
  queries.push(stripPrefixes(swapTehHeh(clean)));
  queries.push(stripPrefixes(clean));

  // 3. Primary place alone (relies on proximity bias)
  if (primaryAlt) queries.push(primaryAlt);
  if (primaryClean) queries.push(primaryClean);

  // 4. Broader fallbacks only as last resort
  if (broader) {
    queries.push(broader);
    queries.push(broaderAlt);
  }

  return [...new Set(queries.map((q) => q.replace(/\s+/g, ' ').trim()).filter((q) => q.length >= 2))];
}

function matchesPrimaryPlace(featureText: string, primaryName: string): boolean {
  if (!primaryName) return false;
  const p1 = primaryName.trim().replace(/\b(مركز|محافظة|محافظه|مدينة|مدينه|قرية|قريه|حي)\s+/g, '');
  const p2 = p1.endsWith('ه') ? `${p1.slice(0, -1)}ة` : p1.endsWith('ة') ? `${p1.slice(0, -1)}ه` : p1;
  const normFeature = featureText.toLowerCase();
  return (p1.length >= 2 && normFeature.includes(p1.toLowerCase())) ||
         (p2.length >= 2 && normFeature.includes(p2.toLowerCase()));
}

async function geocodePlaceName(resolvedUrl: string, locationHint?: { lat: number; lng: number }) {
  const rawPlaceName = extractGoogleMapsPlaceName(resolvedUrl);
  if (!rawPlaceName) return null;

  // 1. Direct Plus Code resolution if present in URL or place name
  const plusCode = extractPlusCode(rawPlaceName) || extractPlusCode(resolvedUrl);
  if (plusCode) {
    const resolved = resolvePlusCodeLocation(plusCode, locationHint);
    if (resolved) {
      return { lat: resolved.lat, lng: resolved.lng, placeName: rawPlaceName };
    }
  }

  // 2. Clean place name: strip Plus Codes anywhere in name, remove Arabic/Latin commas
  const cleanName = rawPlaceName
    .replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*[-–—,،]?\s*/gi, '')
    .trim();
  if (!cleanName || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(cleanName)) return null;

  const candidateQueries = buildArabicPlaceQueryCandidates(cleanName);
  const segments = cleanName.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  const primaryName = segments[0] || '';

  // 3. Mapbox Geocoding: Fast, robust MENA coverage (Egypt, Jordan, etc.)
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '').trim();
  let firstValidResult: { lat: number; lng: number; placeName: string } | null = null;

  if (mapboxToken) {
    for (const q of candidateQueries) {
      try {
        const proximityParam = locationHint ? `&proximity=${locationHint.lng},${locationHint.lat}` : '';
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(mapboxToken)}${proximityParam}&limit=1`;
        const res = await fetch(endpoint, {
          signal: AbortSignal.timeout(3_000),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const payload = await res.json() as { features?: Array<{ center?: [number, number]; place_name?: string; text?: string }> };
          const feature = payload.features?.[0];
          if (feature?.center && isValidLocation(feature.center[1], feature.center[0])) {
            const result = { lat: feature.center[1], lng: feature.center[0], placeName: cleanName };
            const featText = `${feature.text || ''} ${feature.place_name || ''}`;
            // If the feature actually contains the primary place name, return immediately
            if (matchesPrimaryPlace(featText, primaryName)) {
              return result;
            }
            if (!firstValidResult) {
              firstValidResult = result;
            }
          }
        }
      } catch {
        // try next candidate or fall back
      }
    }
  }

  if (firstValidResult) {
    return firstValidResult;
  }

  // 4. OpenStreetMap Nominatim Fallback
  for (const q of candidateQueries) {
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        q,
        limit: '1',
        'accept-language': 'ar,en',
      });
      if (locationHint) {
        // Use a ~50km bounding box to strongly bias Nominatim toward the region of the coordinate.
        const viewbox = `${locationHint.lng - 0.5},${locationHint.lat + 0.5},${locationHint.lng + 0.5},${locationHint.lat - 0.5}`;
        params.set('viewbox', viewbox);
      }
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3_000),
        headers: { Accept: 'application/json', 'User-Agent': 'RadarLocationResolver/1.0' },
      });
      if (!response.ok) continue;

      const [match] = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
      const lat = Number(match?.lat);
      const lng = Number(match?.lon);
      if (isValidLocation(lat, lng)) {
        const result = { lat, lng, placeName: cleanName };
        if (matchesPrimaryPlace(match?.display_name || '', primaryName)) {
          return result;
        }
        if (!firstValidResult) {
          firstValidResult = result;
        }
      }
    } catch {
      // continue to broader query
    }
  }

  return firstValidResult;
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
  const placeName = rawPlaceName?.replace(/\b[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\b\s*[-–—,،]?\s*/gi, '').trim() || null;
  // A bare coordinate link has no name to check against, and a name that is itself just
  // coordinates would only be comparing the extraction with itself.
  if (!placeName || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(placeName)) return null;
  const geocoded = await geocodePlaceName(resolvedUrl, location);
  if (!geocoded) return null;

  const distanceKm = calculateHaversineKm(location, { lat: geocoded.lat, lng: geocoded.lng });

  return {
    placeName: geocoded.placeName,
    geocodedLocation: { lat: geocoded.lat, lng: geocoded.lng },
    distanceKm: Number(distanceKm.toFixed(2)),
    isMismatch: distanceKm > PLACE_NAME_MISMATCH_KM,
  };
}

async function reverseResolveGeography(location: { lat: number; lng: number }) {
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '').trim();
  if (mapboxToken) {
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json?access_token=${encodeURIComponent(mapboxToken)}&language=ar`;
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(3_000),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const payload = await res.json() as { features?: Array<{ place_type?: string[]; text?: string; place_name?: string }> };
        if (payload.features && payload.features.length > 0) {
          let governorate: string | null = null;
          let district: string | null = null;
          let city: string | null = null;

          for (const f of payload.features) {
            const type = f.place_type?.[0];
            const text = (f.text || f.place_name || '').replace(/\b(محافظة|محافظه)\s+/g, '').trim();
            if (type === 'region' && !governorate) {
              governorate = text;
            } else if (type === 'place' && !district) {
              district = text;
            } else if ((type === 'locality' || type === 'neighborhood') && !city) {
              city = text;
            }
          }

          if (governorate || district) {
            return {
              governorate: governorate || district || null,
              district: district || city || governorate || null,
              city: city || district || governorate || null,
              governorateCandidates: governorate ? [governorate] : [],
              districtCandidates: [district, city].filter(Boolean) as string[],
            };
          }
        }
      }
    } catch {
      // Fall through to Nominatim
    }
  }

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
