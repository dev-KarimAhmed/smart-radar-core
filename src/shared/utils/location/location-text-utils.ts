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
