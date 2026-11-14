/**
 * Notification i18n Types, Constants, and Pure String Helper Utilities.
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
  titleNeedsTranslation: boolean;
  descriptionNeedsTranslation: boolean;
}

export interface DynamicNotificationMatch {
  titleAr: string;
  descriptionAr: string;
  titleEn: string;
  descriptionEn: string;
  matched: boolean;
  titleMatched?: boolean;
  descriptionMatched?: boolean;
}

export const I18N_TAG_REGEX = /<!--i18n:([\s\S]*?)-->/;
export const RUNTIME_TRANSLATION_CACHE_KEY = 'radar_notif_i18n_cache_v1';
export const MAX_CACHE_ENTRIES = 250;

export function hasArabicScript(text: string | null | undefined): boolean {
  return /[\u0600-\u06FF]/.test(text || '');
}

export function hasLatinLetters(text: string | null | undefined): boolean {
  return /[A-Za-z]/.test(text || '');
}

export function isDominantlyLatinText(text: string | null | undefined): boolean {
  const s = (text || '').trim();
  if (!s) return false;
  const arabicCount = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const latinCount = (s.match(/[A-Za-z]/g) || []).length;
  return latinCount > 0 && (arabicCount === 0 || latinCount >= arabicCount * 1.5);
}

export function isTranslationErrorBanner(text: string | null | undefined): boolean {
  return /mymemory\s*warning|query\s+length\s+limit|please\s+select\s+two\s+distinct\s+languages|invalid\s+language\s+pair/i.test(
    text || ''
  );
}

export function isValidClientTranslation(
  translated: string,
  source: string,
  targetLang: 'ar' | 'en'
): boolean {
  const tr = (translated || '').trim();
  const src = (source || '').trim();
  if (!tr || tr === src || isTranslationErrorBanner(tr)) {
    return false;
  }
  return targetLang === 'en' ? hasLatinLetters(tr) : hasArabicScript(tr);
}

export function normalizeCurrency(currency: string, targetLang: 'ar' | 'en'): string {
  const cur = (currency || '').trim();
  if (targetLang === 'en') {
    if (cur === 'ج.م' || cur === 'جنيه') return 'EGP';
    if (cur === 'د.أ' || cur === 'د' || cur === 'دينار') return 'JOD';
    return cur || 'EGP';
  }
  if (cur.toUpperCase() === 'EGP') return 'ج.م';
  if (cur.toUpperCase() === 'JOD') return 'د.أ';
  return cur || 'ج.م';
}

export function translateKnownReceiptRejectionReason(reason: string): string | null {
  const r = reason.trim();
  if (!r) return 'The receipt is unclear or the transfer has not been received.';
  if (r.includes('غير واضح أو لم يتم استلام التحويل')) {
    return 'The receipt is unclear or the transfer has not been received.';
  }
  if (r.includes('غير واضح أو المبلغ لا يطابق')) {
    return 'The receipt is unclear or the amount does not match the transfer.';
  }
  if (!hasArabicScript(r)) {
    return r;
  }
  return null;
}
