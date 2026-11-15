import {
  type CanonicalLocationEntry,
  normalizeArabicText,
  normalizeEnglishText,
  hasArabicLetters,
  hasLatinLetters,
  transliterateArabic,
} from './location-text-utils';
import { GOV_INDEX } from './governorates-catalog';
import { translateArabicDistrict } from './districts-catalog';

/**
 * Match a raw governorate record to its canonical entry.
 */
export function findCanonicalGovernorate(
  rowOrName:
    | string
    | {
        name_ar?: string | null;
        name_en?: string | null;
        name?: string | null;
        title_ar?: string | null;
        title_en?: string | null;
      }
    | null
    | undefined,
): CanonicalLocationEntry | null {
  if (!rowOrName) return null;

  if (typeof rowOrName === 'string') {
    const text = rowOrName.trim();
    if (!text) return null;
    return (
      GOV_INDEX.get(normalizeArabicText(text)) ||
      GOV_INDEX.get(normalizeEnglishText(text)) ||
      null
    );
  }

  // Check candidates in order of cleanest signals
  const candidates: string[] = [];

  // If name_en contains Latin letters, it's a very strong signal (e.g. 'Madaba', 'Karak')
  if (rowOrName.name_en && hasLatinLetters(rowOrName.name_en)) {
    candidates.push(rowOrName.name_en);
  }
  if (rowOrName.title_en && hasLatinLetters(rowOrName.title_en)) {
    candidates.push(rowOrName.title_en);
  }

  // Then Arabic signals
  if (rowOrName.name_ar) candidates.push(rowOrName.name_ar);
  if (rowOrName.title_ar) candidates.push(rowOrName.title_ar);
  if (rowOrName.name) candidates.push(rowOrName.name);

  // Even if name_en has Arabic (e.g. 'اربد' or 'مادبا')
  if (rowOrName.name_en) candidates.push(rowOrName.name_en);

  for (const cand of candidates) {
    if (!cand) continue;
    const match =
      GOV_INDEX.get(normalizeArabicText(cand)) ||
      GOV_INDEX.get(normalizeEnglishText(cand));
    if (match) return match;
  }

  return null;
}

/**
 * Resolve a governorate name to the desired target language.
 * Never leaks Arabic into English mode or vice-versa.
 */
export function resolveGovernorateLabel(
  rowOrName:
    | string
    | {
        id?: number | string | null;
        name_ar?: string | null;
        name_en?: string | null;
        name?: string | null;
        title_ar?: string | null;
        title_en?: string | null;
      }
    | null
    | undefined,
  lang: 'ar' | 'en' = 'ar',
): string {
  if (!rowOrName) return '';

  const canonical = findCanonicalGovernorate(rowOrName);
  if (canonical) {
    return lang === 'ar' ? canonical.nameAr : canonical.nameEn;
  }

  if (typeof rowOrName === 'string') {
    if (lang === 'en' && hasArabicLetters(rowOrName)) {
      return transliterateArabic(rowOrName);
    }
    return rowOrName.trim();
  }

  if (lang === 'ar') {
    if (rowOrName.name_ar && hasArabicLetters(rowOrName.name_ar)) return rowOrName.name_ar.trim();
    if (rowOrName.name && hasArabicLetters(rowOrName.name)) return rowOrName.name.trim();
    return (rowOrName.name_ar || rowOrName.name || rowOrName.name_en || String(rowOrName.id || '')).trim();
  } else {
    // English mode: MUST NOT return Arabic
    if (rowOrName.name_en && hasLatinLetters(rowOrName.name_en) && !hasArabicLetters(rowOrName.name_en)) {
      return rowOrName.name_en.trim();
    }
    if (rowOrName.name && hasLatinLetters(rowOrName.name) && !hasArabicLetters(rowOrName.name)) {
      return rowOrName.name.trim();
    }
    const arabicFallback = rowOrName.name_ar || rowOrName.name || rowOrName.name_en || '';
    if (arabicFallback) {
      return transliterateArabic(arabicFallback);
    }
    return String(rowOrName.id || '');
  }
}

/**
 * Resolve a district name to the desired target language.
 * Guarantees zero Arabic in English mode and zero English in Arabic mode.
 */
export function resolveDistrictLabel(
  rowOrName:
    | string
    | {
        id?: number | string | null;
        name_ar?: string | null;
        name_en?: string | null;
        name?: string | null;
        title_ar?: string | null;
        title_en?: string | null;
      }
    | null
    | undefined,
  lang: 'ar' | 'en' = 'ar',
): string {
  if (!rowOrName) return '';

  const rawAr =
    typeof rowOrName === 'string'
      ? rowOrName.trim()
      : (rowOrName.name_ar || rowOrName.name || '').trim();

  const rawEn =
    typeof rowOrName === 'string'
      ? ''
      : (rowOrName.name_en || rowOrName.title_en || '').trim();

  if (lang === 'en') {
    // If name_en already has clean Latin letters without Arabic, use it
    if (rawEn && hasLatinLetters(rawEn) && !hasArabicLetters(rawEn)) {
      return rawEn;
    }
    // If we have an Arabic string (either in name_ar or corrupted in name_en)
    const arabicInput = rawAr || (hasArabicLetters(rawEn) ? rawEn : '');
    if (arabicInput) {
      const translated = translateArabicDistrict(arabicInput);
      if (translated) return translated.cleanEn;
    }
    if (rawEn) return rawEn;
    return typeof rowOrName === 'object' && rowOrName?.id ? String(rowOrName.id) : '';
  } else {
    // Arabic mode
    if (rawAr && hasArabicLetters(rawAr)) {
      const translated = translateArabicDistrict(rawAr);
      return translated ? translated.cleanAr : rawAr;
    }
    if (rawEn && hasArabicLetters(rawEn)) {
      return rawEn;
    }
    return rawAr || rawEn || (typeof rowOrName === 'object' && rowOrName?.id ? String(rowOrName.id) : '');
  }
}

/**
 * Universal location label resolver: safely formats country, governorate, or district
 * into the requested language ('ar' | 'en').
 */
export function resolveLocationLabel(
  row:
    | {
        id?: number | string | null;
        country_id?: number | null;
        governorate_id?: number | null;
        name_ar?: string | null;
        name_en?: string | null;
        name?: string | null;
        title_ar?: string | null;
        title_en?: string | null;
      }
    | null
    | undefined,
  lang: 'ar' | 'en',
): string {
  if (!row) return '';

  // 1. If it has governorate_id, it is a district
  if ('governorate_id' in row && row.governorate_id !== undefined) {
    return resolveDistrictLabel(row, lang);
  }

  // 2. Try governorate canonical resolution
  const canonicalGov = findCanonicalGovernorate(row);
  if (canonicalGov) {
    return lang === 'ar' ? canonicalGov.nameAr : canonicalGov.nameEn;
  }

  // 3. Try district resolution
  const rawText = row.name_ar || row.name_en || row.name || '';
  if (rawText) {
    const districtRes = resolveDistrictLabel(row, lang);
    if (districtRes) return districtRes;
  }

  // 4. Ultimate language-pure fallback
  if (lang === 'en') {
    if (row.name_en && hasLatinLetters(row.name_en) && !hasArabicLetters(row.name_en)) {
      return row.name_en.trim();
    }
    if (row.name && hasLatinLetters(row.name) && !hasArabicLetters(row.name)) {
      return row.name.trim();
    }
    if (rawText && hasArabicLetters(rawText)) {
      return transliterateArabic(rawText);
    }
    return String(row.id || '');
  } else {
    if (row.name_ar && hasArabicLetters(row.name_ar)) return row.name_ar.trim();
    if (row.name && hasArabicLetters(row.name)) return row.name.trim();
    return (row.name_ar || row.name || row.name_en || String(row.id || '')).trim();
  }
}
