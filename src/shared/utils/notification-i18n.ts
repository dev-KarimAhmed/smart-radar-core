/**
 * Notification Internationalization (i18n) Engine.
 * Enables zero-cost dual-language storage and automatic language delivery for notifications and admin directives.
 */

export interface NotificationI18nPayload {
  title_ar: string;
  body_ar: string;
  title_en: string;
  body_en: string;
}

export interface ParsedNotificationContent {
  title: string;
  description: string;
  hasTranslation: boolean;
  titleAr: string;
  descriptionAr: string;
  titleEn: string;
  descriptionEn: string;
}

const I18N_TAG_REGEX = /<!--i18n:([\s\S]*?)-->/;

/**
 * Encodes a dual-language notification message into clean, standard-compatible title and description.
 */
export function encodeNotificationPayload(
  titleAr: string,
  bodyAr: string,
  titleEn?: string,
  bodyEn?: string
): { title: string; description: string } {
  const cleanTitleAr = (titleAr || '').trim();
  const cleanBodyAr = (bodyAr || '').trim();
  const cleanTitleEn = (titleEn || '').trim();
  const cleanBodyEn = (bodyEn || '').trim();

  // If only one language is provided, store standard clean text
  if (!cleanTitleEn && !cleanBodyEn) {
    return {
      title: cleanTitleAr,
      description: cleanBodyAr,
    };
  }

  if (!cleanTitleAr && !cleanBodyAr) {
    return {
      title: cleanTitleEn,
      description: cleanBodyEn,
    };
  }

  // Dual-language package
  const meta: NotificationI18nPayload = {
    title_ar: cleanTitleAr || cleanTitleEn,
    body_ar: cleanBodyAr || cleanBodyEn,
    title_en: cleanTitleEn || cleanTitleAr,
    body_en: cleanBodyEn || cleanBodyAr,
  };

  const primaryTitle = cleanTitleAr || cleanTitleEn;
  const primaryBody = cleanBodyAr || cleanBodyEn;

  return {
    title: primaryTitle,
    description: `${primaryBody}\n\n<!--i18n:${JSON.stringify(meta)}-->`,
  };
}

/**
 * Parses a stored notification item, resolving the appropriate language based on the recipient's UI locale.
 */
export function parseNotificationContent(
  item: { title?: string; description?: string },
  isArabic: boolean
): ParsedNotificationContent {
  const rawTitle = (item.title || '').trim();
  const rawDesc = (item.description || '').trim();

  const match = rawDesc.match(I18N_TAG_REGEX);

  if (match && match[1]) {
    try {
      const payload: NotificationI18nPayload = JSON.parse(match[1]);
      const cleanBody = rawDesc.replace(I18N_TAG_REGEX, '').trim();

      const titleAr = payload.title_ar || rawTitle;
      const descriptionAr = payload.body_ar || cleanBody;
      const titleEn = payload.title_en || rawTitle;
      const descriptionEn = payload.body_en || cleanBody;

      const hasTranslation = Boolean(
        (payload.title_en && payload.title_en !== payload.title_ar) ||
          (payload.body_en && payload.body_en !== payload.body_ar)
      );

      return {
        title: isArabic ? titleAr : (titleEn || titleAr),
        description: isArabic ? descriptionAr : (descriptionEn || descriptionAr),
        hasTranslation,
        titleAr,
        descriptionAr,
        titleEn,
        descriptionEn,
      };
    } catch (e) {
      console.warn('[parseNotificationContent] Failed to parse i18n payload:', e);
    }
  }

  // Fallback for notifications without dual payload
  const cleanDesc = rawDesc.replace(I18N_TAG_REGEX, '').trim();
  return {
    title: rawTitle,
    description: cleanDesc,
    hasTranslation: false,
    titleAr: rawTitle,
    descriptionAr: cleanDesc,
    titleEn: rawTitle,
    descriptionEn: cleanDesc,
  };
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

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, targetLang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.translatedText) {
        return data.translatedText;
      }
    }
  } catch (err) {
    console.warn('[requestTranslation] API call failed, falling back:', err);
  }

  // Fallback directly from client if API fails
  try {
    const fallbackRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        trimmed
      )}`
    );
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((c: any) => (c && c[0] ? c[0] : '')).join('').trim();
      }
    }
  } catch {}

  return trimmed;
}

