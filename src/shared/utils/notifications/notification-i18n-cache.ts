/**
 * Notification i18n Client-Side Cache & Synchronous Display Resolver.
 */

import {
  MAX_CACHE_ENTRIES,
  ParsedNotificationContent,
  RUNTIME_TRANSLATION_CACHE_KEY,
  isTranslationErrorBanner,
} from './notification-i18n-types';
import { parseNotificationContent } from './notification-i18n-resolver';

export const runtimeCache = new Map<string, string>();
let isRuntimeCacheHydrated = false;

export function hydrateRuntimeCacheIfNeeded(): void {
  if (isRuntimeCacheHydrated || typeof window === 'undefined') return;
  isRuntimeCacheHydrated = true;
  try {
    const raw = window.localStorage.getItem(RUNTIME_TRANSLATION_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.trim() && !isTranslationErrorBanner(v)) {
          runtimeCache.set(k, v);
        }
      }
    }
  } catch {}
}

export function persistRuntimeCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(runtimeCache.entries()).slice(-MAX_CACHE_ENTRIES);
    const obj: Record<string, string> = {};
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    window.localStorage.setItem(RUNTIME_TRANSLATION_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

export function makeCacheKey(text: string, targetLang: 'ar' | 'en'): string {
  return `${targetLang}::${text.trim()}`;
}

export function getCachedNotificationTranslation(
  text: string,
  targetLang: 'ar' | 'en'
): string | null {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  hydrateRuntimeCacheIfNeeded();
  return runtimeCache.get(makeCacheKey(trimmed, targetLang)) ?? null;
}

/**
 * Resolves a notification item synchronously using both static rules / i18n payload
 * AND any previously cached client-side translations.
 */
export function resolveNotificationForDisplay(
  item: { title?: string; description?: string },
  isArabic: boolean
): ParsedNotificationContent {
  const parsed = parseNotificationContent(item, isArabic);
  const targetLang: 'ar' | 'en' = isArabic ? 'ar' : 'en';

  let title = parsed.title;
  let description = parsed.description;
  let titleNeedsTranslation = parsed.titleNeedsTranslation;
  let descriptionNeedsTranslation = parsed.descriptionNeedsTranslation;

  if (titleNeedsTranslation && title) {
    const cached = getCachedNotificationTranslation(title, targetLang);
    if (cached) {
      title = cached;
      titleNeedsTranslation = false;
    }
  }

  if (descriptionNeedsTranslation && description) {
    const cached = getCachedNotificationTranslation(description, targetLang);
    if (cached) {
      description = cached;
      descriptionNeedsTranslation = false;
    }
  }

  return {
    ...parsed,
    title,
    description,
    titleNeedsTranslation,
    descriptionNeedsTranslation,
  };
}
