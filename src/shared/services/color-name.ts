// Vehicle color is stored as a hex code (from a color-picker input), but
// showing "#14b8a6" to a rider or captain is meaningless — resolve it to the
// closest common color name instead, in whichever language the screen is in.

interface NamedColor {
  hex: string;
  en: string;
  ar: string;
}

const NAMED_COLORS: NamedColor[] = [
  { hex: '#000000', en: 'Black', ar: 'أسود' },
  { hex: '#ffffff', en: 'White', ar: 'أبيض' },
  { hex: '#808080', en: 'Gray', ar: 'رمادي' },
  { hex: '#d3d3d3', en: 'Light gray', ar: 'رمادي فاتح' },
  { hex: '#4b5563', en: 'Dark gray', ar: 'رمادي غامق' },
  { hex: '#c0c0c0', en: 'Silver', ar: 'فضي' },
  { hex: '#ff0000', en: 'Red', ar: 'أحمر' },
  { hex: '#800000', en: 'Maroon', ar: 'عنابي' },
  { hex: '#ffa500', en: 'Orange', ar: 'برتقالي' },
  { hex: '#ffff00', en: 'Yellow', ar: 'أصفر' },
  { hex: '#ffd700', en: 'Gold', ar: 'ذهبي' },
  { hex: '#f0e68c', en: 'Khaki', ar: 'كاكي' },
  { hex: '#f5f5dc', en: 'Beige', ar: 'بيج' },
  { hex: '#008000', en: 'Green', ar: 'أخضر' },
  { hex: '#00ff00', en: 'Bright green', ar: 'أخضر فاتح' },
  { hex: '#0000ff', en: 'Blue', ar: 'أزرق' },
  { hex: '#000080', en: 'Navy blue', ar: 'كحلي' },
  { hex: '#00ffff', en: 'Cyan', ar: 'سماوي' },
  { hex: '#008080', en: 'Teal', ar: 'فيروزي' },
  { hex: '#800080', en: 'Purple', ar: 'بنفسجي' },
  { hex: '#ff00ff', en: 'Magenta', ar: 'فوشيا' },
  { hex: '#ffc0cb', en: 'Pink', ar: 'وردي' },
  { hex: '#a52a2a', en: 'Brown', ar: 'بني' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  if (expanded.length < 6) return null;

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) return null;
  return { r, g, b };
}

/**
 * Resolves a stored vehicle color to a display string. Hex input resolves to
 * the closest named color by RGB distance; anything that isn't a hex code
 * (legacy free-text entries) passes through unchanged.
 */
export function resolveColorDisplayName(color: string | null | undefined, language: 'ar' | 'en'): string {
  const trimmed = (color || '').trim();
  if (!trimmed) return '';
  if (!/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;

  const rgb = hexToRgb(trimmed);
  if (!rgb) return trimmed;

  let closest = NAMED_COLORS[0];
  let bestDistance = Infinity;
  for (const candidate of NAMED_COLORS) {
    const candidateRgb = hexToRgb(candidate.hex);
    if (!candidateRgb) continue;
    const distance = (rgb.r - candidateRgb.r) ** 2 + (rgb.g - candidateRgb.g) ** 2 + (rgb.b - candidateRgb.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      closest = candidate;
    }
  }

  return language === 'ar' ? closest.ar : closest.en;
}
