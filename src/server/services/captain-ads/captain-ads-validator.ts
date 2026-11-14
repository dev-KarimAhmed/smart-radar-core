import { CAPTAIN_ADS_CONFIG } from '@/features/captain/config/captain-ads-config';

export const SEAT_AD_PATH_PATTERN = /^[a-zA-Z0-9_-]{8,128}\/seat_\d+_\d+(?:_[a-f0-9-]+)?\.(png|jpe?g|webp|gif)$/i;

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const DATA_IMAGE_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/i;

export function isValidSeatNumber(value: unknown): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 20;
}

export function validateSafeImageInput(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'invalid_image_url' };
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 6_000_000) {
    return { ok: false, error: 'invalid_image_size' };
  }

  if (trimmed.startsWith('data:')) {
    const match = DATA_IMAGE_PATTERN.exec(trimmed);
    if (!match) {
      return { ok: false, error: 'unsupported_image_mime_type' };
    }
    const base64Clean = match[2].replace(/\s+/g, '');
    const estimatedBytes = Math.floor((base64Clean.length * 3) / 4);
    if (estimatedBytes <= 0 || estimatedBytes > CAPTAIN_ADS_CONFIG.MAX_IMAGE_SIZE_BYTES + 2048) {
      return { ok: false, error: 'image_exceeds_size_limit' };
    }
    return { ok: true, value: `data:${match[1].toLowerCase()};base64,${base64Clean}` };
  }

  if (
    trimmed.startsWith('/api/captain/ads/image?') ||
    trimmed.startsWith('/icons/') ||
    trimmed.startsWith('/images/')
  ) {
    return { ok: true, value: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && process.env.NODE_ENV !== 'production')) {
      return { ok: true, value: trimmed };
    }
  } catch {
    return { ok: false, error: 'invalid_image_url' };
  }

  return { ok: false, error: 'disallowed_image_protocol' };
}
