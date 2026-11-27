// Isolated client storage and URL capture for WhatsApp group special links (?wg=).
// Strictly isolated from individual captain referral storage (radar_pending_captain_ref).

import {
  PENDING_WHATSAPP_GROUP_CODE_KEY,
  WHATSAPP_GROUP_CODE_REGEX,
  isValidWhatsAppGroupCodeFormat,
  normalizeWhatsAppGroupCode,
} from '../constants';
import type { WhatsAppGroupBrowserAdapter } from '../types';

export {
  PENDING_WHATSAPP_GROUP_CODE_KEY,
  WHATSAPP_GROUP_CODE_REGEX,
  isValidWhatsAppGroupCodeFormat,
  normalizeWhatsAppGroupCode,
};

export const defaultWhatsAppGroupBrowserAdapter: WhatsAppGroupBrowserAdapter = {
  getSearch: () => (typeof window === 'undefined' ? null : window.location.search),
  getHref: () => (typeof window === 'undefined' ? null : window.location.href),
  replaceUrl: (url: string) => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(window.history.state, '', url);
    }
  },
  getItem: (key: string) => (typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

export function readQueryWhatsAppGroupCode(
  adapter: WhatsAppGroupBrowserAdapter = defaultWhatsAppGroupBrowserAdapter,
): string | null {
  try {
    const search = adapter.getSearch();
    if (search === null) return null;
    const params = new URLSearchParams(search);
    const raw = normalizeWhatsAppGroupCode(params.get('wg'));
    if (!raw || !isValidWhatsAppGroupCodeFormat(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function storePendingWhatsAppGroupCode(
  code: string,
  adapter: WhatsAppGroupBrowserAdapter = defaultWhatsAppGroupBrowserAdapter,
): boolean {
  if (adapter === defaultWhatsAppGroupBrowserAdapter && typeof window === 'undefined') return false;
  const clean = normalizeWhatsAppGroupCode(code);
  if (!isValidWhatsAppGroupCodeFormat(clean)) return false;
  try {
    adapter.setItem(PENDING_WHATSAPP_GROUP_CODE_KEY, clean);
    return true;
  } catch {
    return false;
  }
}

export function getPendingWhatsAppGroupCode(
  adapter: WhatsAppGroupBrowserAdapter = defaultWhatsAppGroupBrowserAdapter,
): string | null {
  try {
    const raw = normalizeWhatsAppGroupCode(adapter.getItem(PENDING_WHATSAPP_GROUP_CODE_KEY));
    if (!raw || !isValidWhatsAppGroupCodeFormat(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function clearPendingWhatsAppGroupCode(
  adapter: WhatsAppGroupBrowserAdapter = defaultWhatsAppGroupBrowserAdapter,
): void {
  try {
    adapter.removeItem(PENDING_WHATSAPP_GROUP_CODE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function removeWhatsAppGroupParamFromUrl(
  adapter: WhatsAppGroupBrowserAdapter = defaultWhatsAppGroupBrowserAdapter,
): void {
  try {
    const href = adapter.getHref();
    if (!href) return;
    const url = new URL(href);
    if (!url.searchParams.has('wg')) return;
    url.searchParams.delete('wg');
    const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
    adapter.replaceUrl(cleanUrl);
  } catch {
    // ignore URL errors
  }
}

export function capturePendingWhatsAppGroupFromUrl(
  adapter: WhatsAppGroupBrowserAdapter = defaultWhatsAppGroupBrowserAdapter,
): string | null {
  const fromUrl = readQueryWhatsAppGroupCode(adapter);
  if (fromUrl) {
    storePendingWhatsAppGroupCode(fromUrl, adapter);
    return fromUrl;
  }
  return getPendingWhatsAppGroupCode(adapter);
}
