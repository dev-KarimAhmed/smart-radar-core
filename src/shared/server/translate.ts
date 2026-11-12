import { encodeNotificationPayload, resolveDynamicNotification } from '@/shared/utils/notification-i18n';

const ALLOWED_SOURCE_LANGS = new Set(['auto', 'ar', 'en']);
const MAX_TEXT_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 5_000;

export function hasArabicCharacters(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text || '');
}

export function hasLatinCharacters(text: string): boolean {
  return /[A-Za-z]/.test(text || '');
}

/**
 * Server-side translation helper (0 external API key cost).
 * Translates text between Arabic and English with automatic language detection.
 */
export async function translateTextServer(
  text: string,
  targetLang: 'ar' | 'en',
  sourceLang: string = 'auto'
): Promise<string> {
  const trimmed = (text || '').trim().slice(0, MAX_TEXT_LENGTH);
  if (!trimmed) return '';

  const safeSourceLang = ALLOWED_SOURCE_LANGS.has(sourceLang) ? sourceLang : 'auto';

  // Skip external network call if text is already clearly in target script without opposing script
  if (targetLang === 'en' && !hasArabicCharacters(trimmed)) {
    return trimmed;
  }
  if (targetLang === 'ar' && hasArabicCharacters(trimmed) && !hasLatinCharacters(trimmed)) {
    return trimmed;
  }

  // 1. Primary: Google GTX Translation Gateway
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      safeSourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((chunk: any) => (chunk && chunk[0] ? chunk[0] : '')).join('');
        if (translated && translated.trim().length > 0) {
          return translated.trim();
        }
      }
    }
  } catch (err) {
    console.warn('[translateTextServer] Primary GTX error:', err);
  }

  // 2. Secondary Fallback: MyMemory Open Translation API
  try {
    const src = safeSourceLang === 'auto' ? (targetLang === 'en' ? 'ar' : 'en') : safeSourceLang;
    const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(targetLang)}`;

    const fallbackRes = await fetch(fallbackUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });

    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      const match = fbData?.responseData?.translatedText;
      if (match && typeof match === 'string' && match.trim().length > 0) {
        return match.trim();
      }
    }
  } catch (fbErr) {
    console.warn('[translateTextServer] Secondary MyMemory error:', fbErr);
  }

  return trimmed;
}

/**
 * Builds a properly dual-language (AR + EN) notification payload on the server.
 * Handles rule-matched backend templates, explicit EN overrides, and automatic
 * AR <-> EN translation for custom free-text admin notices.
 */
export async function buildBilingualNotificationServer(params: {
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  preferredLanguage?: string | null;
}): Promise<{
  title: string;
  description: string;
  titleAr: string;
  descriptionAr: string;
  titleEn: string;
  descriptionEn: string;
}> {
  const rawTitle = (params.title || '').trim();
  const rawDesc = (params.description || '').trim();
  const explicitTitleEn = (params.titleEn || '').trim();
  const explicitDescEn = (params.descriptionEn || '').trim();

  // 1. Check rule-based dynamic templates first
  const dynamic = resolveDynamicNotification(rawTitle, rawDesc);

  let titleAr = dynamic.matched ? dynamic.titleAr : rawTitle;
  let titleEn = explicitTitleEn || (dynamic.matched ? dynamic.titleEn : '');
  let bodyAr = dynamic.matched ? dynamic.descriptionAr : rawDesc;
  let bodyEn = explicitDescEn || (dynamic.matched ? dynamic.descriptionEn : '');

  const tasks: Array<Promise<void>> = [];

  // Resolve missing English title from Arabic title
  const titleNeedsEn =
    !titleEn || (titleEn === titleAr && hasArabicCharacters(titleAr));
  if (titleNeedsEn && hasArabicCharacters(titleAr)) {
    tasks.push(
      translateTextServer(titleAr, 'en', 'ar').then((tr) => {
        if (tr && !hasArabicCharacters(tr)) {
          titleEn = tr;
        }
      })
    );
  }

  // Resolve missing Arabic title if authored in English
  if (!hasArabicCharacters(titleAr) && hasLatinCharacters(titleAr)) {
    const sourceEn = titleEn || titleAr;
    titleEn = sourceEn;
    tasks.push(
      translateTextServer(sourceEn, 'ar', 'en').then((tr) => {
        if (tr && hasArabicCharacters(tr)) {
          titleAr = tr;
        }
      })
    );
  }

  // Resolve missing English body from Arabic body
  const bodyNeedsEn =
    !bodyEn || (bodyEn === bodyAr && hasArabicCharacters(bodyAr));
  if (bodyNeedsEn && hasArabicCharacters(bodyAr)) {
    tasks.push(
      translateTextServer(bodyAr, 'en', 'ar').then((tr) => {
        if (tr && !hasArabicCharacters(tr)) {
          bodyEn = tr;
        }
      })
    );
  }

  // Resolve missing Arabic body if authored in English
  if (!hasArabicCharacters(bodyAr) && hasLatinCharacters(bodyAr)) {
    const sourceEn = bodyEn || bodyAr;
    bodyEn = sourceEn;
    tasks.push(
      translateTextServer(sourceEn, 'ar', 'en').then((tr) => {
        if (tr && hasArabicCharacters(tr)) {
          bodyAr = tr;
        }
      })
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }

  const encoded = encodeNotificationPayload(titleAr, bodyAr, titleEn, bodyEn);
  const preferEn = (params.preferredLanguage || '').toLowerCase() === 'en';
  const dbTitle = preferEn && titleEn ? titleEn : (titleAr || titleEn || rawTitle);

  return {
    title: dbTitle,
    description: encoded.description,
    titleAr: titleAr || rawTitle,
    descriptionAr: bodyAr || rawDesc,
    titleEn: titleEn || titleAr || rawTitle,
    descriptionEn: bodyEn || bodyAr || rawDesc,
  };
}
