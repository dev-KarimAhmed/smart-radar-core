/**
 * Unified Location Translator and Canonicalizer
 *
 * Solves mixed-language and duplicate entries in governorates and districts
 * (e.g. database rows where name_en was mistakenly populated with Arabic,
 * or duplicate rows inserted with different spellings such as 'إربد' vs 'اربد'
 * or 'مادبا' vs 'مأدبا', or districts prefixed with 'لواء' / 'قضاء').
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
 * Core district stems mapping: matches both raw core names and prefixed forms
 * (e.g. 'لواء قصبة معان' or 'قضاء الجفر' or 'قصبة معان').
 */
export const DISTRICT_STEM_MAP: Record<string, string> = {
  // Amman
  'قصبة عمان': 'Amman Qasabah',
  'قصبة عمّان': 'Amman Qasabah',
  'الجامعة': 'University',
  'الموقر': 'Al Muwaqqar',
  'القويسمة': 'Al Qweismeh',
  'سحاب': 'Sahab',
  'الجيزة': 'Al Jizah',
  'ماركا': 'Marka',
  'ناعور': 'Naour',
  'وادي السير': 'Wadi Al Seer',
  'رجم الشامي': 'Rujm Al Shami',
  'ام الرصاص': 'Umm Al Rasas',
  'ام البساتين': 'Umm Al Basatin',
  'حسبان': 'Hisban',

  // Irbid
  'قصبة اربد': 'Irbid Qasabah',
  'قصبة إربد': 'Irbid Qasabah',
  'الكورة': 'Koura',
  'الرمثا': 'Ramtha',
  'الطيبة': 'Taybeh',
  'المزار /ش': 'Northern Mazar',
  'المزار الشمالي': 'Northern Mazar',
  'الوسيطة': 'Wasatiyah',
  'الوسطية': 'Wasatiyah',
  'بني كنانة': 'Bani Kinanah',
  'بني كنانه': 'Bani Kinanah',
  'بني عبيد': 'Bani Obeid',
  'الاغوار /ش': 'Northern Ghor',
  'الأغوار الشمالية': 'Northern Ghor',

  // Balqa
  'قصبة المركز': 'Salt Qasabah',
  'قصبة السلط': 'Salt Qasabah',
  'دير علا': 'Deir Alla',
  'عين الباشا': 'Ain Al Basha',
  'الشونة /ج': 'Southern Shuna',
  'الشونة الجنوبية': 'Southern Shuna',
  'ماحص / الفحيص': 'Mahis and Fuheis',
  'ماحص والفحيص': 'Mahis and Fuheis',
  'عيرا / يرقا': 'Ira and Yarqa',
  'عيرا ويرقا': 'Ira and Yarqa',
  'زي': 'Zai',
  'العارضة': 'Al Arda',

  // Karak
  'قصبة الكرك': 'Karak Qasabah',
  'المزار / ج': 'Southern Mazar',
  'المزار الجنوبي': 'Southern Mazar',
  'القصر': 'Al Qasr',
  'الاغوار / ج': 'Southern Ghor',
  'الأغوار الجنوبية': 'Southern Ghor',
  'عي': 'Ayy',
  'فقوع': 'Faqqu',
  'القطرانة': 'Qatraneh',
  'مؤاب': 'Moab',
  'الموجب': 'Al Mujib',
  'غور المزرعة': 'Ghor Al Mazra\'a',

  // Ma'an
  'قصبة معان': "Ma'an Qasabah",
  'معان': "Ma'an",
  'البتراء': 'Petra',
  'البترا': 'Petra',
  'الشوبك': 'Shobak',
  'الحسينية': 'Al Husseiniya',
  'الجفر': 'Al Jafr',
  'مريغة': 'Mureigha',
  'ايل': 'Ayl',
  'اذرح': 'Udhruh',

  // Zarqa
  'قصبة الزرقاء': 'Zarqa Qasabah',
  'الهاشمية': 'Hashemiyah',
  'الرصيفة': 'Russeifa',
  'بيرين': 'Berein',
  'الضليل': 'Al Dhulail',
  'الازرق': 'Azraq',
  'الأزرق': 'Azraq',

  // Mafraq
  'قصبة المفرق': 'Mafraq Qasabah',
  'بلعما': 'Balama',
  'البادية /ش': 'Northern Badia',
  'البادية الشمالية': 'Northern Badia',
  'البادية الشمالية الغربية': 'North Western Badia',
  'الرويشد': 'Ruwaished',
  'سما السرحان': 'Sama Al Sarhan',
  'حوشا': 'Hawsha',
  'الخالدية': 'Al Khalidiya',
  'رحاب': 'Rihab',
  'المنشية': 'Al Manshiyya',
  'صبحا': 'Sabha',
  'ام الجمال': 'Umm Al Jimal',
  'دير الكهف': 'Deir Al Kahf',
  'ام القطين': 'Umm Al Quttain',

  // Tafilah
  'قصبة الطفيلة': 'Tafilah Qasabah',
  'الحسا': 'Hasa',
  'بصيرا': 'Busaira',

  // Madaba
  'قصبة مادبا': 'Madaba Qasabah',
  'ذيبان': 'Dhiban',
  'جرينة': 'Jrainah',
  'ماعين': 'Ma\'in',
  'الفيصلية': 'Al Faisaliyah',
  'العريض': 'Al Urayd',
  'مليح': 'Mlaih',

  // Jerash
  'القصبة': 'Jerash Qasabah',
  'قصبة جرش': 'Jerash Qasabah',
  'المسطبة': 'Al Mastaba',
  'المصطبة': 'Al Mastaba',
  'برما': 'Burma',

  // Ajloun
  'قصبة عجلون': 'Ajloun Qasabah',
  'كفرنجة': 'Kufranjah',
  'صخرة': 'Sakhra',
  'عرجان': 'Arjan',

  // Aqaba
  'قصبة العقبة': 'Aqaba Qasabah',
  'القويرة': 'Quweira',
  'وادي عربه': 'Wadi Araba',
  'وادي عربة': 'Wadi Araba',
  'الديسة': 'Disah',
};

const STEM_INDEX = new Map<string, string>();
for (const [k, v] of Object.entries(DISTRICT_STEM_MAP)) {
  STEM_INDEX.set(normalizeArabicText(k), v);
  STEM_INDEX.set(normalizeEnglishText(v), v);
}

/**
 * Phonetic fallback transliterator: Converts Arabic strings into Latin characters
 * so that English mode NEVER leaks Arabic strings.
 */
export function transliterateArabic(text: string): string {
  const letters: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ء': "'", 'ئ': "'", 'ؤ': "'",
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': "'", 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'ah',
  };

  return text
    .split(/\s+/)
    .map((word) => {
      let w = word.trim();
      let isAl = false;
      if (w.startsWith('ال') && w.length > 2) {
        isAl = true;
        w = w.slice(2);
      }
      let latin = '';
      for (const char of w) {
        latin += letters[char] || char;
      }
      if (latin) {
        latin = latin.charAt(0).toUpperCase() + latin.slice(1);
      }
      return isAl ? `Al ${latin}` : latin;
    })
    .join(' ')
    .trim();
}

/**
 * Translates an Arabic district name into clean English, handling
 * prefixes like 'لواء', 'قضاء', 'مركز', etc.
 */
export function translateArabicDistrict(rawAr: string): { cleanAr: string; cleanEn: string } | null {
  const trimmed = rawAr.trim();
  // Filter corrupted dummy rows (e.g. 'الواء' in older test/seed records)
  if (trimmed === 'الواء' || trimmed.length < 2) {
    return null;
  }

  let prefixType: 'district' | 'subdistrict' | 'center' | 'area' | 'none' = 'none';
  let core = trimmed;

  if (/^لواء\s*/.test(core)) {
    prefixType = 'district';
    core = core.replace(/^لواء\s*/, '').trim();
  } else if (/^قضاء\s*ام\s+/.test(core) || /^قضاءام\s*/.test(core)) {
    prefixType = 'subdistrict';
    core = core.replace(/^قضاء\s*ام\s+/, 'ام ').replace(/^قضاءام\s*/, 'ام ').trim();
  } else if (/^قضاء\s*/.test(core)) {
    prefixType = 'subdistrict';
    core = core.replace(/^قضاء\s*/, '').trim();
  } else if (/^مركز\s*/.test(core)) {
    prefixType = 'center';
    core = core.replace(/^مركز\s*/, '').trim();
  } else if (/^(منطقة|حي)\s*/.test(core)) {
    prefixType = 'area';
    core = core.replace(/^(منطقة|حي)\s*/, '').trim();
  }

  const normCore = normalizeArabicText(core);
  let enCore = STEM_INDEX.get(normCore);

  if (!enCore) {
    // Try matching without slash variants like "المزار /ش"
    const cleanedSlash = normCore.replace(/\s*\/\s*/g, ' ').trim();
    enCore = STEM_INDEX.get(cleanedSlash);
  }

  // Fallback: transliterate core phonetically
  if (!enCore) {
    enCore = transliterateArabic(core);
  }

  let enSuffix = '';
  if (prefixType === 'district') {
    enSuffix = enCore.endsWith('District') ? '' : ' District';
  } else if (prefixType === 'subdistrict') {
    enSuffix = ' Sub-district';
  } else if (prefixType === 'center') {
    enSuffix = ' Center';
  } else if (prefixType === 'area') {
    enSuffix = ' Area';
  }

  return {
    cleanAr: trimmed,
    cleanEn: `${enCore}${enSuffix}`.trim(),
  };
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
