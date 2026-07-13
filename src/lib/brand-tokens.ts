/**
 * BRAND COLOR TOKENS (JavaScript mirror of the CSS `@theme` in
 * `src/app/globals.css`).
 *
 * Use these ONLY in JS/TS contexts that cannot resolve CSS custom properties:
 * canvas, MapLibre GL style objects, SVG presentation attributes, `<svg>` data
 * URIs, and Next.js metadata (`themeColor`). For plain inline `style={{…}}`
 * prefer `var(--color-radar-*)` directly — it resolves natively.
 *
 * ⚠️ REBRAND: keep these values in sync with the `@theme` block in
 * `src/app/globals.css` — that CSS block is the primary source of truth.
 */
export const BRAND = {
  // Brand / accent
  teal: '#14B8A6',
  tealBright: '#14F5D5',
  tealHover: '#2DD4BF',
  tealGlow: '#2FFFE5',
  tealAbyss: '#031315',
  tealDeep: '#074C49',
  neon: '#00FFCC',
  neonGreen: '#00CC66',
  emerald: '#10B981',
  emeraldLight: '#34D399',

  // Surfaces
  bg: '#0A0F1D',
  bgDeep: '#0B0F19',
  abyss: '#05080F',
  card: '#0F172A',
  surface: '#111827',
  elevated: '#1E293B',
  muted: '#243249',
  line: '#161F30',
  overlay: '#07101F',
  gradient: '#06101D',
  night: '#121A2D',
  ink: '#041315',
  black: '#050505',
  indigo: '#102033',
  forest: '#091B09',
  forestDeep: '#011E15',

  // Text
  text: '#F1F5F9',
  textBright: '#F8FAFC',
  textSub: '#94A3B8',
  textMuted: '#64748B',
  textFaint: '#9CA3AF',
  white: '#FFFFFF',

  // Semantic states
  danger: '#FF3366',
  dangerDeep: '#330005',
  red: '#EF4444',
  redLight: '#F87171',
  rose: '#F43F5E',
  warning: '#F59E0B',
  gold: '#FFCC00',
  blue: '#3B82F6',

  // Accent tints
  accentAmber: '#FFE0B3',
  accentRose: '#FFB3BF',
  accentLilac: '#EED4FF',
  accentMint: '#B3FFD9',
  accentAqua: '#D8FDF8',
} as const;

export type BrandColor = keyof typeof BRAND;
