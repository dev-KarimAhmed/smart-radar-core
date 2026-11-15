import { parseGoogleMapsLocation } from '@/shared/services/google-maps-location';

export const MAX_REDIRECTS = 6;
export const REQUEST_TIMEOUT_MS = 5_000;

export function isValidLocation(lat: number, lng: number) {
  return (
    Number.isFinite(lat)
    && Number.isFinite(lng)
    && Math.abs(lat) <= 90
    && Math.abs(lng) <= 180
    && !(lat === 0 && lng === 0)
  );
}

export function isAllowedRedirectHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'maps.app.goo.gl'
    || normalized === 'goo.gl'
    || normalized === 'google.com'
    || normalized.endsWith('.google.com')
  );
}

export async function followGoogleMapsRedirects(initialUrl: string): Promise<string> {
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

export async function readGoogleMapsPageLocation(url: string): Promise<{ lat: number; lng: number } | null> {
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
