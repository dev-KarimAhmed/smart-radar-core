import {
  normalizeArabicText,
  normalizeEnglishText,
  transliterateArabic,
} from './location-text-utils';

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

export const STEM_INDEX = new Map<string, string>();
for (const [k, v] of Object.entries(DISTRICT_STEM_MAP)) {
  STEM_INDEX.set(normalizeArabicText(k), v);
  STEM_INDEX.set(normalizeEnglishText(v), v);
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
