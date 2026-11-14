/**
 * Notification i18n Client-Side Batch & Single Translation Requester.
 */

import {
  isTranslationErrorBanner,
  isValidClientTranslation,
} from './notification-i18n-types';
import {
  runtimeCache,
  hydrateRuntimeCacheIfNeeded,
  persistRuntimeCache,
  makeCacheKey,
  getCachedNotificationTranslation,
} from './notification-i18n-cache';

const inFlightBatchTranslations = new Map<string, Promise<string>>();

async function translateDirectViaGtx(text: string, targetLang: 'ar' | 'en'): Promise<string | null> {
  try {
    const fallbackRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const tr = data[0].map((c: any) => (c && c[0] ? c[0] : '')).join('').trim();
        if (isValidClientTranslation(tr, text, targetLang)) {
          return tr;
        }
      }
    }
  } catch {}
  return null;
}

/**
 * Client-side helper to translate a list of texts on demand via /api/translate,
 * deduplicating concurrent requests and persisting results in cache.
 */
export async function requestBatchTranslation(
  texts: string[],
  targetLang: 'ar' | 'en' = 'en'
): Promise<Record<string, string>> {
  hydrateRuntimeCacheIfNeeded();
  const results: Record<string, string> = {};
  const uniquePending: string[] = [];
  const waitingPromises: Array<Promise<void>> = [];

  for (const raw of texts) {
    const trimmed = (raw || '').trim();
    if (!trimmed) continue;
    const key = makeCacheKey(trimmed, targetLang);
    const cached = runtimeCache.get(key);
    if (cached && !isTranslationErrorBanner(cached)) {
      results[trimmed] = cached;
      continue;
    }
    const inflight = inFlightBatchTranslations.get(key);
    if (inflight) {
      waitingPromises.push(
        inflight.then((tr) => {
          if (tr && isValidClientTranslation(tr, trimmed, targetLang)) {
            results[trimmed] = tr;
          }
        })
      );
      continue;
    }
    if (!uniquePending.includes(trimmed)) {
      uniquePending.push(trimmed);
    }
  }

  if (uniquePending.length > 0) {
    for (let i = 0; i < uniquePending.length; i += 30) {
      const chunk = uniquePending.slice(i, i + 30);
      const batchPromise = (async () => {
        let cacheUpdated = false;
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: chunk, targetLang }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && Array.isArray(data.translations)) {
              chunk.forEach((src, idx) => {
                const tr = typeof data.translations[idx] === 'string' ? data.translations[idx].trim() : '';
                if (isValidClientTranslation(tr, src, targetLang)) {
                  runtimeCache.set(makeCacheKey(src, targetLang), tr);
                  results[src] = tr;
                  cacheUpdated = true;
                }
              });
            }
          }
        } catch (err) {
          console.warn('[requestBatchTranslation] API batch failed:', err);
        }

        const remaining = chunk.filter((src) => !results[src]);
        if (remaining.length > 0) {
          await Promise.allSettled(
            remaining.slice(0, 10).map(async (src) => {
              const gtx = await translateDirectViaGtx(src, targetLang);
              if (gtx) {
                runtimeCache.set(makeCacheKey(src, targetLang), gtx);
                results[src] = gtx;
                cacheUpdated = true;
              }
            })
          );
        }

        if (cacheUpdated) persistRuntimeCache();
        return results;
      })();

      chunk.forEach((src) => {
        const key = makeCacheKey(src, targetLang);
        inFlightBatchTranslations.set(
          key,
          batchPromise.then((map) => map[src] || src).finally(() => {
            inFlightBatchTranslations.delete(key);
          })
        );
      });

      await batchPromise;
    }
  }

  if (waitingPromises.length > 0) {
    await Promise.allSettled(waitingPromises);
  }

  return results;
}

/**
 * Client-side helper to translate text on demand via /api/translate
 */
export async function requestTranslation(
  text: string,
  targetLang: 'ar' | 'en' = 'en'
): Promise<string> {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  const cached = getCachedNotificationTranslation(trimmed, targetLang);
  if (cached && !isTranslationErrorBanner(cached)) return cached;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, targetLang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.translatedText) {
        const tr = String(data.translatedText).trim();
        if (isValidClientTranslation(tr, trimmed, targetLang)) {
          runtimeCache.set(makeCacheKey(trimmed, targetLang), tr);
          persistRuntimeCache();
          return tr;
        }
      }
    }
  } catch (err) {
    console.warn('[requestTranslation] API call failed, falling back:', err);
  }

  const gtx = await translateDirectViaGtx(trimmed, targetLang);
  if (gtx) {
    runtimeCache.set(makeCacheKey(trimmed, targetLang), gtx);
    persistRuntimeCache();
    return gtx;
  }

  return trimmed;
}
