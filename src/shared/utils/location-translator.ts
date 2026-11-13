/**
 * Unified Location Translator and Canonicalizer
 *
 * Solves mixed-language and duplicate entries in governorates and districts
 * (e.g. database rows where name_en was mistakenly populated with Arabic,
 * or duplicate rows inserted with different spellings such as 'إربد' vs 'اربد'
 * or 'مادبا' vs 'مأدبا').
 */

export interface CanonicalLocationEntry {
  key: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
}

export function normalizeArabicText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    // Strip diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0640]/g, '')
    // Normalize Alefs
    .replace(/[إأآٱ]/g, 'ا')
    // Normalize Taa Marbuta / Haa
    .replace(/[ة]/g, 'ه')
    // Normalize Alef Maksura
    .replace(/[ى]/g, 'ي')
    // Remove extra spaces & punctuation
    .replace(/['"\-_.]/g, '')
    .replace(/\s+/g, ' ');
}

export function normalizeEnglishText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/['"\-_.]/g, '')
    .replace(/\s+/g, ' ');
}

export function hasArabicLetters(value: string | null | undefined): boolean {
  if (!value) return false;
  return /[\u0600-\u06FF]/.test(value);
}

export function hasLatinLetters(value: string | null | undefined): boolean {
  if (!value) return false;
  return /[a-zA-Z]/.test(value);
}

// Canonical database of Jordan Governorates
export const JORDAN_GOVERNORATE_ENTRIES: CanonicalLocationEntry[] = [
  { key: 'amman', nameAr: 'عمّان', nameEn: 'Amman', aliases: ['عمان', 'عمان العاصمة', 'العاصمة', 'amman'] },
  { key: 'irbid', nameAr: 'إربد', nameEn: 'Irbid', aliases: ['اربد', 'إربد', 'عروس الشمال', 'irbid'] },
  { key: 'zarqa', nameAr: 'الزرقاء', nameEn: 'Zarqa', aliases: ['الزرقا', 'الزرقاء', 'zarqa', 'al zarqa'] },
  { key: 'balqa', nameAr: 'البلقاء', nameEn: 'Balqa', aliases: ['البلقا', 'البلقاء', 'السلط', 'salt', 'balqa', 'al balqa'] },
  { key: 'aqaba', nameAr: 'العقبة', nameEn: 'Aqaba', aliases: ['العقبه', 'العقبة', 'aqaba', 'al aqaba'] },
  { key: 'madaba', nameAr: 'مادبا', nameEn: 'Madaba', aliases: ['مادبا', 'مأدبا', 'مدينة الفسيفساء', 'madaba'] },
  { key: 'karak', nameAr: 'الكرك', nameEn: 'Karak', aliases: ['الكرك', 'karak', 'al karak'] },
  { key: 'maan', nameAr: 'معان', nameEn: "Ma'an", aliases: ['معان', 'maan', "ma'an"] },
  { key: 'tafilah', nameAr: 'الطفيلة', nameEn: 'Tafilah', aliases: ['الطفيله', 'الطفيلة', 'tafilah', 'tafila', 'at tafilah'] },
  { key: 'ajloun', nameAr: 'عجلون', nameEn: 'Ajloun', aliases: ['عجلون', 'ajloun', 'ajlun'] },
  { key: 'jerash', nameAr: 'جرش', nameEn: 'Jerash', aliases: ['جرش', 'jerash'] },
  { key: 'mafraq', nameAr: 'المفرق', nameEn: 'Mafraq', aliases: ['المفرق', 'mafraq', 'al mafraq'] },
];

// Canonical database of Egypt Governorates
export const EGYPT_GOVERNORATE_ENTRIES: CanonicalLocationEntry[] = [
  { key: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', aliases: ['القاهرة', 'القاهره', 'cairo'] },
  { key: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', aliases: ['الإسكندرية', 'الاسكندرية', 'الاسكندريه', 'alexandria', 'alex'] },
  { key: 'giza', nameAr: 'الجيزة', nameEn: 'Giza', aliases: ['الجيزة', 'الجيزه', 'giza'] },
  { key: 'qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia', aliases: ['القليوبية', 'القليوبيه', 'qalyubia', 'qalyubiyah'] },
  { key: 'dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia', aliases: ['الدقهلية', 'الدقهليه', 'dakahlia', 'daqahliya'] },
  { key: 'sharqia', nameAr: 'الشرقية', nameEn: 'Al Sharqia', aliases: ['الشرقية', 'الشرقيه', 'al sharqia', 'sharqia'] },
  { key: 'monufia', nameAr: 'المنوفية', nameEn: 'Monufia', aliases: ['المنوفية', 'المنوفيه', 'monufia', 'menofia'] },
  { key: 'gharbia', nameAr: 'الغربية', nameEn: 'Gharbia', aliases: ['الغربية', 'الغربيه', 'gharbia', 'al gharbia'] },
  { key: 'kafr-el-sheikh', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', aliases: ['كفر الشيخ', 'كفرالشيخ', 'kafr el sheikh'] },
  { key: 'beheira', nameAr: 'البحيرة', nameEn: 'Beheira', aliases: ['البحيرة', 'البحيره', 'beheira'] },
  { key: 'damietta', nameAr: 'دمياط', nameEn: 'Damietta', aliases: ['دمياط', 'damietta'] },
  { key: 'port-said', nameAr: 'بورسعيد', nameEn: 'Port Said', aliases: ['بورسعيد', 'بور سعيد', 'port said'] },
  { key: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia', aliases: ['الإسماعيلية', 'الاسماعيلية', 'الاسماعيليه', 'ismailia'] },
  { key: 'suez', nameAr: 'السويس', nameEn: 'Suez', aliases: ['السويس', 'suez'] },
  { key: 'beni-suef', nameAr: 'بني سويف', nameEn: 'Beni Suef', aliases: ['بني سويف', 'بنى سويف', 'beni suef'] },
  { key: 'faiyum', nameAr: 'الفيوم', nameEn: 'Faiyum', aliases: ['الفيوم', 'faiyum', 'fayoum'] },
  { key: 'minya', nameAr: 'المنيا', nameEn: 'Minya', aliases: ['المنيا', 'minya'] },
  { key: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut', aliases: ['أسيوط', 'اسيوط', 'asyut', 'assiut'] },
  { key: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag', aliases: ['سوهاج', 'sohag'] },
  { key: 'qena', nameAr: 'قنا', nameEn: 'Qena', aliases: ['قنا', 'qena'] },
  { key: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor', aliases: ['الأقصر', 'الاقصر', 'luxor'] },
  { key: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', aliases: ['أسوان', 'اسوان', 'aswan'] },
  { key: 'red-sea', nameAr: 'البحر الأحمر', nameEn: 'Red Sea', aliases: ['البحر الأحمر', 'البحر الاحمر', 'red sea'] },
  { key: 'new-valley', nameAr: 'الوادي الجديد', nameEn: 'New Valley', aliases: ['الوادي الجديد', 'الوادى الجديد', 'new valley'] },
  { key: 'matrouh', nameAr: 'مطروح', nameEn: 'Matrouh', aliases: ['مطروح', 'مرسى مطروح', 'matrouh'] },
  { key: 'north-sinai', nameAr: 'شمال سيناء', nameEn: 'North Sinai', aliases: ['شمال سيناء', 'شمال سينا', 'north sinai'] },
  { key: 'south-sinai', nameAr: 'جنوب سيناء', nameEn: 'South Sinai', aliases: ['جنوب سيناء', 'جنوب سينا', 'south sinai'] },
];

export const ALL_GOVERNORATES: CanonicalLocationEntry[] = [
  ...JORDAN_GOVERNORATE_ENTRIES,
  ...EGYPT_GOVERNORATE_ENTRIES,
];

// Pre-built lookup index for rapid O(1) matching
const GOV_INDEX = new Map<string, CanonicalLocationEntry>();

for (const entry of ALL_GOVERNORATES) {
  GOV_INDEX.set(normalizeArabicText(entry.nameAr), entry);
  GOV_INDEX.set(normalizeEnglishText(entry.nameEn), entry);
  GOV_INDEX.set(entry.key, entry);
  for (const alias of entry.aliases) {
    if (hasArabicLetters(alias)) {
      GOV_INDEX.set(normalizeArabicText(alias), entry);
    } else {
      GOV_INDEX.set(normalizeEnglishText(alias), entry);
    }
  }
}

/**
 * Common Jordanian & Egyptian District translations for instances where
 * the database column `name_en` has identical Arabic text or is null.
 */
export const DISTRICT_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  // Amman
  'قصبة عمان': { ar: 'قصبة عمّان', en: 'Amman Qasabah' },
  'الجامعة': { ar: 'الجامعة', en: 'University District' },
  'القويسمة': { ar: 'القويسمة', en: 'Al Qweismeh' },
  'ماركا': { ar: 'ماركا', en: 'Marka' },
  'الجيزة': { ar: 'الجيزة', en: 'Al Jizah' },
  'الموقر': { ar: 'الموقر', en: 'Al Muwaqqar' },
  'ناعور': { ar: 'ناعور', en: 'Naour' },
  'سحاب': { ar: 'سحاب', en: 'Sahab' },
  'وادي السير': { ar: 'وادي السير', en: 'Wadi Al Seer' },

  // Irbid
  'قصبة إربد': { ar: 'قصبة إربد', en: 'Irbid Qasabah' },
  'قصبة اربد': { ar: 'قصبة إربد', en: 'Irbid Qasabah' },
  'الرمثا': { ar: 'الرمثا', en: 'Ramtha' },
  'بني كنانة': { ar: 'بني كنانة', en: 'Bani Kinanah' },
  'بني كنانه': { ar: 'بني كنانة', en: 'Bani Kinanah' },
  'الأغوار الشمالية': { ar: 'الأغوار الشمالية', en: 'Northern Ghor' },
  'الاغوار الشمالية': { ar: 'الأغوار الشمالية', en: 'Northern Ghor' },
  'الاغوار الشماليه': { ar: 'الأغوار الشمالية', en: 'Northern Ghor' },
  'الكورة': { ar: 'الكورة', en: 'Koura' },
  'الكوره': { ar: 'الكورة', en: 'Koura' },
  'المزار الشمالي': { ar: 'المزار الشمالي', en: 'Northern Mazar' },
  'الطيبة': { ar: 'الطيبة', en: 'Taybeh' },
  'الطيبه': { ar: 'الطيبة', en: 'Taybeh' },
  'الوسطية': { ar: 'الوسطية', en: 'Wasatiyah' },
  'الوسطيه': { ar: 'الوسطية', en: 'Wasatiyah' },
  'بني عبيد': { ar: 'بني عبيد', en: 'Bani Obeid' },

  // Zarqa
  'قصبة الزرقاء': { ar: 'قصبة الزرقاء', en: 'Zarqa Qasabah' },
  'قصبة الزرقا': { ar: 'قصبة الزرقاء', en: 'Zarqa Qasabah' },
  'الرصيفة': { ar: 'الرصيفة', en: 'Russeifa' },
  'الرصيفه': { ar: 'الرصيفة', en: 'Russeifa' },
  'الهاشمية': { ar: 'الهاشمية', en: 'Hashemiyah' },
  'الهاشميه': { ar: 'الهاشمية', en: 'Hashemiyah' },
  'بيرين': { ar: 'بيرين', en: 'Berein' },

  // Balqa
  'قصبة السلط': { ar: 'قصبة السلط', en: 'Salt Qasabah' },
  'قصبة البلقاء': { ar: 'قصبة السلط', en: 'Salt Qasabah' },
  'الشونة الجنوبية': { ar: 'الشونة الجنوبية', en: 'Southern Shuna' },
  'الشونه الجنوبيه': { ar: 'الشونة الجنوبية', en: 'Southern Shuna' },
  'دير علا': { ar: 'دير علا', en: 'Deir Alla' },
  'عين الباشا': { ar: 'عين الباشا', en: 'Ain Al Basha' },
  'ماحص والفحيص': { ar: 'ماحص والفحيص', en: 'Mahis and Fuheis' },

  // Aqaba
  'قصبة العقبة': { ar: 'قصبة العقبة', en: 'Aqaba Qasabah' },
  'قصبة العقبه': { ar: 'قصبة العقبة', en: 'Aqaba Qasabah' },
  'القويرة': { ar: 'القويرة', en: 'Quweira' },
  'القويره': { ar: 'القويرة', en: 'Quweira' },
  'الديسة': { ar: 'الديسة', en: 'Disah' },

  // Madaba
  'قصبة مادبا': { ar: 'قصبة مادبا', en: 'Madaba Qasabah' },
  'قصبة مأدبا': { ar: 'قصبة مادبا', en: 'Madaba Qasabah' },
  'ذيبان': { ar: 'ذيبان', en: 'Dhiban' },

  // Karak
  'قصبة الكرك': { ar: 'قصبة الكرك', en: 'Karak Qasabah' },
  'المزار الجنوبي': { ar: 'المزار الجنوبي', en: 'Southern Mazar' },
  'القصر': { ar: 'القصر', en: 'Al Qasr' },
  'الأغوار الجنوبية': { ar: 'الأغوار الجنوبية', en: 'Southern Ghor' },
  'الاغوار الجنوبية': { ar: 'الأغوار الجنوبية', en: 'Southern Ghor' },
  'الاغوار الجنوبيه': { ar: 'الأغوار الجنوبية', en: 'Southern Ghor' },
  'عي': { ar: 'عي', en: 'Ayy' },
  'فقوع': { ar: 'فقوع', en: 'Faqqu' },
  'القطرانة': { ar: 'القطرانة', en: 'Qatraneh' },
  'القطرانه': { ar: 'القطرانة', en: 'Qatraneh' },
  'مؤاب': { ar: 'مؤاب', en: 'Moab' },

  // Ma'an
  'قصبة معان': { ar: 'قصبة معان', en: "Ma'an Qasabah" },
  'البتراء': { ar: 'البتراء', en: 'Petra' },
  'البترا': { ar: 'البتراء', en: 'Petra' },
  'الشوبك': { ar: 'الشوبك', en: 'Shobak' },
  'الحسينية': { ar: 'الحسينية', en: 'Husseiniya' },
  'الحسينيه': { ar: 'الحسينية', en: 'Husseiniya' },

  // Tafilah
  'قصبة الطفيلة': { ar: 'قصبة الطفيلة', en: 'Tafilah Qasabah' },
  'قصبة الطفيله': { ar: 'قصبة الطفيلة', en: 'Tafilah Qasabah' },
  'الحسا': { ar: 'الحسا', en: 'Hasa' },
  'بصيرا': { ar: 'بصيرا', en: 'Busaira' },

  // Ajloun
  'قصبة عجلون': { ar: 'قصبة عجلون', en: 'Ajloun Qasabah' },
  'كفرنجة': { ar: 'كفرنجة', en: 'Kufranjah' },
  'كفرنجه': { ar: 'كفرنجة', en: 'Kufranjah' },

  // Jerash
  'قصبة جرش': { ar: 'قصبة جرش', en: 'Jerash Qasabah' },

  // Mafraq
  'قصبة المفرق': { ar: 'قصبة المفرق', en: 'Mafraq Qasabah' },
  'البادية الشمالية': { ar: 'البادية الشمالية', en: 'Northern Badia' },
  'البادية الشمالية الغربية': { ar: 'البادية الشمالية الغربية', en: 'North Western Badia' },
  'الرويشد': { ar: 'الرويشد', en: 'Ruwaished' },
  'بلعما': { ar: 'بلعما', en: 'Balama' },
};

const DISTRICT_INDEX = new Map<string, { ar: string; en: string }>();

for (const [key, val] of Object.entries(DISTRICT_TRANSLATIONS)) {
  DISTRICT_INDEX.set(normalizeArabicText(key), val);
  DISTRICT_INDEX.set(normalizeArabicText(val.ar), val);
  DISTRICT_INDEX.set(normalizeEnglishText(val.en), val);
}

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
    return rowOrName.trim();
  }

  // Fallback when canonical lookup doesn't hit
  if (lang === 'ar') {
    if (rowOrName.name_ar && hasArabicLetters(rowOrName.name_ar)) return rowOrName.name_ar.trim();
    if (rowOrName.name && hasArabicLetters(rowOrName.name)) return rowOrName.name.trim();
    return (rowOrName.name_ar || rowOrName.name || rowOrName.name_en || String(rowOrName.id || '')).trim();
  } else {
    // English mode: MUST NOT return Arabic if English exists
    if (rowOrName.name_en && hasLatinLetters(rowOrName.name_en)) return rowOrName.name_en.trim();
    if (rowOrName.name && hasLatinLetters(rowOrName.name)) return rowOrName.name.trim();
    return (rowOrName.name_en || rowOrName.name || rowOrName.name_ar || String(rowOrName.id || '')).trim();
  }
}

/**
 * Resolve a district name to the desired target language.
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

  const rawText =
    typeof rowOrName === 'string'
      ? rowOrName.trim()
      : (rowOrName.name_ar || rowOrName.name_en || rowOrName.name || rowOrName.title_ar || rowOrName.title_en || '').trim();

  // Try dictionary lookup
  const match =
    DISTRICT_INDEX.get(normalizeArabicText(rawText)) ||
    DISTRICT_INDEX.get(normalizeEnglishText(rawText));

  if (match) {
    return lang === 'ar' ? match.ar : match.en;
  }

  if (typeof rowOrName === 'string') {
    return rawText;
  }

  // If not in dictionary, check if the record already has the right language
  if (lang === 'ar') {
    if (rowOrName.name_ar && hasArabicLetters(rowOrName.name_ar)) return rowOrName.name_ar.trim();
    if (rowOrName.name && hasArabicLetters(rowOrName.name)) return rowOrName.name.trim();
    return (rowOrName.name_ar || rowOrName.name || rowOrName.name_en || String(rowOrName.id || '')).trim();
  } else {
    if (rowOrName.name_en && hasLatinLetters(rowOrName.name_en)) return rowOrName.name_en.trim();
    if (rowOrName.name && hasLatinLetters(rowOrName.name)) return rowOrName.name.trim();
    return (rowOrName.name_en || rowOrName.name || rowOrName.name_ar || String(rowOrName.id || '')).trim();
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

  // 1. Try governorate canonical resolution
  const canonicalGov = findCanonicalGovernorate(row);
  if (canonicalGov) {
    return lang === 'ar' ? canonicalGov.nameAr : canonicalGov.nameEn;
  }

  // 2. Try district canonical resolution
  const rawCandidate = row.name_ar || row.name_en || row.name || '';
  const canonicalDistrict =
    DISTRICT_INDEX.get(normalizeArabicText(rawCandidate)) ||
    DISTRICT_INDEX.get(normalizeEnglishText(rawCandidate));
  if (canonicalDistrict) {
    return lang === 'ar' ? canonicalDistrict.ar : canonicalDistrict.en;
  }

  // 3. Fallback: check language appropriateness
  if (lang === 'en') {
    if (row.name_en && hasLatinLetters(row.name_en)) return row.name_en.trim();
    if (row.name && hasLatinLetters(row.name)) return row.name.trim();
    return (row.name_en || row.name || row.name_ar || String(row.id || '')).trim();
  } else {
    if (row.name_ar && hasArabicLetters(row.name_ar)) return row.name_ar.trim();
    if (row.name && hasArabicLetters(row.name)) return row.name.trim();
    return (row.name_ar || row.name || row.name_en || String(row.id || '')).trim();
  }
}

/**
 * Deduplicates and canonicalizes governorate rows from Supabase.
 * - Fixes corrupted `name_en` (which held Arabic text).
 * - Collapses duplicate rows for the same governorate (e.g. 'Madaba' and 'مادبا') into ONE clean row.
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
      // Already have this governorate! Prefer the row that had cleaner Latin name_en or smaller ID.
      const existing = seenKeys.get(dedupeKey)!;
      // If the incoming row has a cleaner original name_en, or existing lacked one, update properties
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
 * Canonicalizes district rows from Supabase, fixing corrupted `name_en` where Arabic text was placed.
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

  return rows.map((row) => {
    const rawName = row.name_ar || row.name_en || row.name || '';
    const match =
      DISTRICT_INDEX.get(normalizeArabicText(rawName)) ||
      DISTRICT_INDEX.get(normalizeEnglishText(rawName));

    if (match) {
      return {
        ...row,
        name_ar: match.ar,
        name_en: match.en,
      };
    }

    // If name_en contains only Arabic characters, clear or transliterate it
    let cleanEn = row.name_en || '';
    if (cleanEn && !hasLatinLetters(cleanEn)) {
      cleanEn = '';
    }

    return {
      ...row,
      name_ar: row.name_ar || row.name || '',
      name_en: cleanEn,
    };
  });
}
