/**
 * Sovereign Territory & Carrier Filtering Kernel
 * Enforces categorical restriction: Saudi Arabia (+966 / SA) is blocked from platform usage.
 */

export const SAUDI_COUNTRY_CODES = ['SA', 'SAU'] as const;
export const SAUDI_DIAL_PREFIX = '966';

export const SAUDI_RESTRICTION_MESSAGES = {
  ar: {
    regionBlockedTitle: 'عذراً، الخدمة غير متوفرة في منطقتك',
    regionBlockedDesc: 'منصة بينكم الرقمية غير متوفرة حالياً داخل المملكة العربية السعودية.',
    phoneRejected: 'عذراً، أرقام هواتف المملكة العربية السعودية (+966) غير مدعومة حالياً.',
  },
  en: {
    regionBlockedTitle: 'Service Unavailable in Your Region',
    regionBlockedDesc: 'The platform is currently unavailable within the Kingdom of Saudi Arabia.',
    phoneRejected: 'Saudi Arabian phone numbers (+966) are currently not supported.',
  },
} as const;

/**
 * Validates whether a raw or normalized phone number belongs to Saudi Arabia (+966).
 */
export function isSaudiPhoneNumber(rawPhone: string | null | undefined): boolean {
  if (!rawPhone) return false;
  const trimmed = String(rawPhone).trim().replace(/[\s()\-]/g, '');
  if (!trimmed) return false;

  if (trimmed.startsWith('+966') || trimmed.startsWith('00966')) {
    return true;
  }

  const cleanDigits = trimmed.replace(/^\+/, '').replace(/^00/, '');
  if (cleanDigits.startsWith(SAUDI_DIAL_PREFIX)) {
    return true;
  }

  return false;
}

/**
 * Validates whether a country code string, name, or country row represents Saudi Arabia.
 */
export function isSaudiCountryCode(country: string | number | null | undefined): boolean {
  if (country === null || country === undefined) return false;
  const str = String(country).trim().toUpperCase();
  if (str === 'SA' || str === 'SAU' || str === '966' || str === '+966') {
    return true;
  }
  const lower = String(country).toLowerCase();
  return lower.includes('saudi') || lower.includes('سعود');
}

/**
 * Offline bounding box and geographic envelope check for Saudi Arabian territory.
 * Carefully avoids false positives in Jordan (Amman, Aqaba, etc.) and Egypt (Sinai, Cairo, etc.).
 */
export function isSaudiCoordinates(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  // 1. Exclude Jordan: Lat 29.18 to 33.4, Lng 34.95 to 39.3
  const isJordanEnvelope = lat >= 29.18 && lat <= 33.4 && lng >= 34.95 && lng <= 39.3;
  if (isJordanEnvelope) return false;

  // 2. Exclude Egypt: Lng <= 34.95 (Sinai, Red Sea coast, mainland) or (Lat <= 24.0 && Lng <= 37.0)
  const isEgyptEnvelope = lng <= 34.95 || (lat <= 24.0 && lng <= 37.0);
  if (isEgyptEnvelope) return false;

  // 3. Saudi Arabian territorial mainland envelope
  const isInsideSaudiBounds = lat >= 16.0 && lat <= 32.2 && lng >= 34.95 && lng <= 55.7;
  return isInsideSaudiBounds;
}

/**
 * Detects whether an incoming HTTP request originated from Saudi Arabia based on edge/CDN headers.
 */
export function isSaudiRequest(
  headers: Headers | Record<string, string | string[] | undefined> | null | undefined,
): boolean {
  if (!headers) return false;

  const getHeader = (name: string): string => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name) || '';
    }
    const val = (headers as Record<string, string | string[] | undefined>)[name];
    if (Array.isArray(val)) return val[0] || '';
    return typeof val === 'string' ? val : '';
  };

  const country = (
    getHeader('cf-ipcountry') ||
    getHeader('x-vercel-ip-country') ||
    getHeader('cloudfront-viewer-country') ||
    getHeader('x-country-code') ||
    getHeader('x-geo-country')
  ).trim().toUpperCase();

  return country === 'SA' || country === 'SAU';
}
