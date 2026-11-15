import { hasLatinLetters, hasArabicLetters, transliterateArabic } from './location-text-utils';
import { translateArabicDistrict } from './districts-catalog';
import { findCanonicalGovernorate } from './location-resolvers';

/**
 * Deduplicates and canonicalizes governorate rows from Supabase.
 * - Fixes corrupted `name_en` (which held Arabic text).
 * - Collapses duplicate rows for the same governorate into ONE clean row.
 */
export function canonicalizeGovernorateRows<
  T extends {
    id: number;
    country_id: number;
    name_ar?: string | null;
    name_en?: string | null;
    name?: string | null;
  },
>(rows: T[]): T[] {
  if (!Array.isArray(rows)) return [];

  const seenKeys = new Map<string, T>();
  const output: T[] = [];

  for (const rawRow of rows) {
    const canonical = findCanonicalGovernorate(rawRow);
    const dedupeKey = canonical ? `${rawRow.country_id}-${canonical.key}` : `${rawRow.country_id}-${rawRow.id}`;

    const normalizedRow: T = {
      ...rawRow,
      name_ar: canonical ? canonical.nameAr : (rawRow.name_ar || rawRow.name || ''),
      name_en: canonical ? canonical.nameEn : (rawRow.name_en || rawRow.name || ''),
    };

    if (seenKeys.has(dedupeKey)) {
      const existing = seenKeys.get(dedupeKey)!;
      if (!existing.name_en && normalizedRow.name_en) {
        existing.name_en = normalizedRow.name_en;
      }
      continue;
    }

    seenKeys.set(dedupeKey, normalizedRow);
    output.push(normalizedRow);
  }

  return output;
}

/**
 * Canonicalizes district rows from Supabase:
 * - Translates corrupted Arabic `name_en` into clean English.
 * - Strips corrupted/dummy records like 'الواء'.
 */
export function canonicalizeDistrictRows<
  T extends {
    id: number;
    governorate_id: number;
    name_ar?: string | null;
    name_en?: string | null;
    name?: string | null;
  },
>(rows: T[]): T[] {
  if (!Array.isArray(rows)) return [];

  const output: T[] = [];

  for (const row of rows) {
    const rawAr = row.name_ar || row.name || '';
    const translated = translateArabicDistrict(rawAr);

    // Filter out dummy/corrupted rows (like 'الواء')
    if (translated === null && (rawAr === 'الواء' || rawAr.trim().length < 2)) {
      continue;
    }

    const cleanAr = translated ? translated.cleanAr : rawAr;
    let cleanEn = row.name_en || '';

    // If name_en is empty or contains Arabic, populate with clean English
    if (!cleanEn || !hasLatinLetters(cleanEn) || hasArabicLetters(cleanEn)) {
      cleanEn = translated ? translated.cleanEn : transliterateArabic(cleanAr);
    }

    output.push({
      ...row,
      name_ar: cleanAr,
      name_en: cleanEn,
    });
  }

  return output;
}
