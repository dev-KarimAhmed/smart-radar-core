import colorNamer from 'color-namer';

// Vehicle color is picked via a native color-picker input (hex), but neither
// storing nor showing "#14b8a6" to a rider or captain is meaningful — resolve
// it to the closest basic color name via `color-namer`, then translate that
// fixed set of ~20 English names to Arabic ourselves (the package only
// speaks English).
const EN_TO_AR: Record<string, string> = {
  black: 'أسود',
  blue: 'أزرق',
  cyan: 'سماوي',
  green: 'أخضر',
  teal: 'فيروزي',
  turquoise: 'تركواز',
  indigo: 'نيلي',
  gray: 'رمادي',
  purple: 'بنفسجي',
  brown: 'بني',
  tan: 'بني فاتح',
  violet: 'أرجواني',
  beige: 'بيج',
  fuchsia: 'فوشيا',
  gold: 'ذهبي',
  magenta: 'ماجنتا',
  orange: 'برتقالي',
  pink: 'وردي',
  red: 'أحمر',
  white: 'أبيض',
  yellow: 'أصفر',
};

// Same fixed basic palette color-namer resolves against, used in reverse so
// a color-picker swatch can be re-synced to match an already-stored name
// (e.g. loaded from the database) instead of sitting at an unrelated default.
const EN_NAME_TO_HEX: Record<string, string> = {
  black: '#000000',
  blue: '#0000ff',
  cyan: '#00ffff',
  green: '#008000',
  teal: '#008080',
  turquoise: '#40e0d0',
  indigo: '#4b0082',
  gray: '#808080',
  purple: '#800080',
  brown: '#a52a2a',
  tan: '#d2b48c',
  violet: '#ee82ee',
  beige: '#f5f5dc',
  fuchsia: '#ff00ff',
  gold: '#ffd700',
  magenta: '#ff00ff',
  orange: '#ffa500',
  pink: '#ffc0cb',
  red: '#ff0000',
  white: '#ffffff',
  yellow: '#ffff00',
};

const AR_NAME_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_AR).map(([en, ar]) => [ar, en]),
);

/** Reverse of `hexToColorName` — the canonical hex for a known name (ar or en), or null. */
export function colorNameToHex(name: string | null | undefined): string | null {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (EN_NAME_TO_HEX[lower]) return EN_NAME_TO_HEX[lower];
  const enKey = AR_NAME_TO_EN[trimmed];
  return enKey ? EN_NAME_TO_HEX[enKey] || null : null;
}

/** Closest basic color name for a hex value, e.g. "Red" / "أحمر". */
export function hexToColorName(hex: string, language: 'ar' | 'en'): string {
  try {
    const closest = colorNamer(hex, { pick: ['basic'] }).basic[0]?.name || '';
    if (!closest) return hex;
    if (language === 'ar') return EN_TO_AR[closest] || closest;
    return closest.charAt(0).toUpperCase() + closest.slice(1);
  } catch {
    return hex;
  }
}

/**
 * Resolves a stored vehicle color to a display string. Hex input resolves to
 * the closest named color; anything that isn't a hex code (the normal case
 * now that color inputs store the resolved name directly, or a legacy
 * free-text entry) passes through unchanged.
 */
export function resolveColorDisplayName(color: string | null | undefined, language: 'ar' | 'en'): string {
  const trimmed = (color || '').trim();
  if (!trimmed) return '';
  if (!/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  return hexToColorName(trimmed, language);
}
