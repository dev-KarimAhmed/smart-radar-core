import {
  type CanonicalLocationEntry,
  normalizeArabicText,
  normalizeEnglishText,
  hasArabicLetters,
} from './location-text-utils';

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
export const GOV_INDEX = new Map<string, CanonicalLocationEntry>();

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
