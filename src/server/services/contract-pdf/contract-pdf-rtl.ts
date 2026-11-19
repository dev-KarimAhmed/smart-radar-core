import type { PDFFont, PDFPage, RGB } from 'pdf-lib';
import reshaper from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

const ARABIC_CHAR_RE = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670]/g;
const ALLOWED_CHARS_RE = /[^\u0020-\u007E\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C-\u200F·•-]/g;

export interface PdfVisualRun {
  /** Exact visual LTR characters expected on the PDF page */
  visualText: string;
  /** String encoded for pdf-lib/fontkit so final laid-out glyphs match visualText */
  fontkitInput: string;
  isArabic: boolean;
}

export function hasArabicChars(text: string): boolean {
  return ARABIC_CHAR_RE.test(text);
}

/**
 * Converts logical text into exact Left-to-Right visual characters using
 * Arabic contextual shaping + Unicode BiDi reordering + bracket mirroring.
 */
export function toVisualLtrString(raw: string, baseDir: 'rtl' | 'ltr' = 'rtl'): string {
  const clean = raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(ARABIC_DIACRITICS_RE, '')
    .replace(ALLOWED_CHARS_RE, '')
    .trim();
  if (!clean) return '';

  try {
    const shaped = hasArabicChars(clean)
      ? reshaper.ArabicShaper.convertArabic(clean)
      : clean;
    const levels = bidi.getEmbeddingLevels(shaped, baseDir);
    return bidi.getReorderedString(shaped, levels);
  } catch {
    return clean;
  }
}

/**
 * Splits a visual LTR string into script-pure runs for @pdf-lib/fontkit.
 *
 * Why: @pdf-lib/fontkit reverses the entire glyph array whenever the first
 * non-Common character in a drawText() call has script === 'arab', and leaves
 * it LTR when the first non-Common char is Latin/Common. By isolating pure
 * Arabic runs and pre-reversing them, fontkit's internal reverse puts every
 * single glyph in exact visual LTR order regardless of mixed Arabic/Latin/digits.
 */
export function splitVisualRunsForFontkit(raw: string, baseDir: 'rtl' | 'ltr' = 'rtl'): PdfVisualRun[] {
  const visual = toVisualLtrString(raw, baseDir);
  if (!visual) return [];

  const runs: PdfVisualRun[] = [];
  let current = '';
  let currentIsArabic: boolean | null = null;

  for (const ch of Array.from(visual)) {
    const isAr = ARABIC_CHAR_RE.test(ch);
    if (currentIsArabic === null) {
      current = ch;
      currentIsArabic = isAr;
    } else if (isAr === currentIsArabic) {
      current += ch;
    } else {
      runs.push({
        visualText: current,
        fontkitInput: currentIsArabic ? Array.from(current).reverse().join('') : current,
        isArabic: currentIsArabic,
      });
      current = ch;
      currentIsArabic = isAr;
    }
  }

  if (current && currentIsArabic !== null) {
    runs.push({
      visualText: current,
      fontkitInput: currentIsArabic ? Array.from(current).reverse().join('') : current,
      isArabic: currentIsArabic,
    });
  }

  return runs;
}

export function measureRunsWidth(runs: PdfVisualRun[], font: PDFFont, size: number): number {
  let total = 0;
  for (const run of runs) {
    try {
      total += font.widthOfTextAtSize(run.fontkitInput, size);
    } catch {
      total += run.visualText.length * size * 0.55;
    }
  }
  return total;
}

export function drawRightAlignedText(
  page: PDFPage,
  text: string,
  rightX: number,
  minX: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB,
  baseDir: 'rtl' | 'ltr' = 'rtl',
): number {
  const runs = splitVisualRunsForFontkit(text, baseDir);
  if (runs.length === 0) return 0;

  const totalWidth = measureRunsWidth(runs, font, size);
  let cursorX = Math.max(minX, rightX - totalWidth);

  for (const run of runs) {
    try {
      const w = font.widthOfTextAtSize(run.fontkitInput, size);
      page.drawText(run.fontkitInput, { x: cursorX, y, size, font, color });
      cursorX += w;
    } catch {
      // Skip unencodable characters safely
    }
  }

  return totalWidth;
}

export function wrapTextLogical(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = measureRunsWidth(splitVisualRunsForFontkit(candidate, 'rtl'), font, size);
    if (width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export function drawWrappedRtl(
  page: PDFPage,
  text: string,
  rightX: number,
  minX: number,
  startY: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineHeight: number,
  color: RGB,
): number {
  const lines = wrapTextLogical(text, font, size, maxWidth);
  let y = startY;
  for (const line of lines) {
    drawRightAlignedText(page, line, rightX, minX, y, font, size, color, 'rtl');
    y -= lineHeight;
  }
  return y;
}
