/**
 * Line family brand data (docs/line-family-colors.md, design/<tool>/Logo.dc.html, design/hub/HubLogo.dc.html).
 * Pure data, no React: used by the Logo components, the icon generator and packages/report.
 */
import type { ToolSlug } from '@line/core/site';

export type { ToolSlug };
export type LogoTheme = 'light' | 'dark' | 'mono' | 'white';

export interface ToolBrand {
  slug: ToolSlug;
  name: string;
  /** Wordmark part before "line". */
  first: string;
  /** Logo tile, buttons, accents on light. */
  accent: string;
  /** On dark backgrounds. */
  bright: string;
  /** Text and glyph on the accent. */
  onAccent: string;
  /** Light tint for chips and icon squares. */
  tint: string;
  /** Text on the tint, and accent text on white (AA). */
  tintInk: string;
}

export const INK = '#0B0B14';
export const PAPER = '#F7F7FB';
export const MARK_INK = '#101828';
export const LIME = '#C6F36B';
export const LIME_INK = '#1A2E05';
export const NIGHT = '#120D24';

export const BRANDS: Record<ToolSlug, ToolBrand> = {
  hitline: {
    slug: 'hitline',
    name: 'Hitline',
    first: 'Hit',
    accent: '#7F56D9',
    bright: '#B692F6',
    onAccent: '#FFFFFF',
    tint: '#F4F3FF',
    tintInk: '#53389E',
  },
  serpline: {
    slug: 'serpline',
    name: 'Serpline',
    first: 'Serp',
    accent: '#2563EB',
    bright: '#93C5FD',
    onAccent: '#FFFFFF',
    tint: '#EFF6FF',
    tintInk: '#1D4ED8',
  },
  rivaline: {
    slug: 'rivaline',
    name: 'Rivaline',
    first: 'Riva',
    accent: '#0E7490',
    bright: '#67E8F9',
    onAccent: '#FFFFFF',
    tint: '#ECFEFF',
    tintInk: '#155E75',
  },
  foldline: {
    slug: 'foldline',
    name: 'Foldline',
    first: 'Fold',
    accent: '#C11574',
    bright: '#FAA7E0',
    onAccent: '#FFFFFF',
    tint: '#FDF2FA',
    tintInk: '#9E165F',
  },
  markline: {
    slug: 'markline',
    name: 'Markline',
    first: 'Mark',
    accent: '#FACC15',
    bright: '#FDE68A',
    onAccent: MARK_INK,
    tint: '#FEF9C3',
    tintInk: MARK_INK,
  },
};

export const STATUS = {
  ok: { text: '#067647', bg: '#ECFDF3', border: '#ABEFC6' },
  problem: { text: '#B42318', bg: '#FEF3F2', border: '#FECDCA' },
  warning: { text: '#B54708', bg: '#FFFAEB', border: '#FEDF89' },
  neutral: { text: '#475467', bg: '#EEEDF3', border: '#DCD9E6' },
} as const;
export type StatusTone = keyof typeof STATUS;

/** One stroke of a 48x48 logo glyph. */
export interface GlyphPart {
  d: string;
  opacity?: number;
  /** Filled with the glyph color, no stroke. */
  fill?: boolean;
  dash?: [number, number];
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** Logo glyphs, viewBox 0 0 48 48, stroke width 4, round caps and joins. */
export const LOGO_GLYPHS: Record<ToolSlug, GlyphPart[]> = {
  hitline: [{ d: 'M6 28L14 28L19 15L25 35L30 22L34 28L42 28' }],
  serpline: [{ d: circle(21, 21, 12) }, { d: 'M30 30L40 40' }, { d: 'M15 21L27 21' }],
  rivaline: [
    { d: circle(24, 24, 17) },
    { d: circle(24, 24, 7), opacity: 0.55 },
    { d: 'M24 24L36 12' },
    { d: circle(32, 32, 3.5), fill: true },
  ],
  foldline: [
    { d: 'M16 6H32A5 5 0 0 1 37 11V37A5 5 0 0 1 32 42H16A5 5 0 0 1 11 37V11A5 5 0 0 1 16 6Z' },
    { d: 'M17 14L31 14' },
    { d: 'M4 26L44 26', dash: [2, 6] },
  ],
  markline: [
    { d: 'M8 17V8h9' },
    { d: 'M31 8h9v9' },
    { d: 'M40 31v9h-9' },
    { d: 'M17 40H8v-9' },
    { d: 'M16 30c5-7 9-1 16-10' },
  ],
};
export const LOGO_STROKE = 4;

/** Hub logo: five nested lines bending into an L, outside to inside Hitline..Markline. */
export const HUB_LOGO_PATHS = [
  'M7 7V27A14 14 0 0 0 21 41H41',
  'M13.5 7V23A11.5 11.5 0 0 0 25 34.5H41',
  'M20 7V19A9 9 0 0 0 29 28H41',
  'M26.5 7V15A6.5 6.5 0 0 0 33 21.5H41',
  'M33 7V11A4 4 0 0 0 37 15H41',
] as const;
export const HUB_LOGO_STROKE = 3.8;
export const HUB_ORDER: ToolSlug[] = ['hitline', 'serpline', 'rivaline', 'foldline', 'markline'];

/** Logo proportions (docs/line-family-colors.md): radius 26%, glyph 64%, wordmark 66%, gap 26%. */
export function logoMetrics(size: number) {
  return {
    size,
    radius: Math.round(size * 0.26),
    gap: Math.round(size * 0.26),
    glyph: Math.round(size * 0.64),
    wordSize: Math.round(size * 0.66),
  };
}

export interface LogoColors {
  tileBg: string;
  glyph: string;
  wordInk: string;
  wordAccent: string;
  /** Markline marker highlight behind "line" (light theme only). */
  lineHighlight: string | null;
}

/** Same rules as design/<tool>/Logo.dc.html. */
export function logoColors(slug: ToolSlug, theme: LogoTheme = 'light'): LogoColors {
  const b = BRANDS[slug];
  const ink = slug === 'markline';
  const c: LogoColors = {
    tileBg: b.accent,
    glyph: ink ? MARK_INK : '#FFFFFF',
    wordInk: INK,
    wordAccent: ink ? MARK_INK : b.accent,
    lineHighlight: null,
  };
  if (ink && theme === 'light') {
    c.lineHighlight = 'linear-gradient(transparent 42%, #FACC15 42%, #FACC15 74%, transparent 74%)';
  }
  if (theme === 'dark') {
    c.tileBg = b.bright;
    c.glyph = ink ? MARK_INK : INK;
    c.wordInk = PAPER;
    c.wordAccent = b.bright;
  }
  if (theme === 'mono') {
    c.tileBg = INK;
    c.glyph = PAPER;
    c.wordInk = INK;
    c.wordAccent = INK;
  }
  if (theme === 'white') {
    c.tileBg = PAPER;
    c.glyph = INK;
    c.wordInk = PAPER;
    c.wordAccent = PAPER;
  }
  return c;
}

export interface HubLogoColors {
  tileBg: string;
  ring: string;
  lines: string[];
  wordInk: string;
  wordSoft: string;
}

/** Same rules as design/hub/HubLogo.dc.html. */
export function hubLogoColors(theme: LogoTheme = 'light'): HubLogoColors {
  const bright = HUB_ORDER.map((s) => BRANDS[s].bright);
  const c: HubLogoColors = {
    tileBg: NIGHT,
    ring: 'none',
    lines: bright,
    wordInk: INK,
    wordSoft: '#667085',
  };
  if (theme === 'dark') {
    c.tileBg = '#241C42';
    c.ring = 'inset 0 0 0 1px rgba(255,255,255,.16)';
    c.wordInk = PAPER;
    c.wordSoft = '#B9B4D0';
  }
  if (theme === 'mono') {
    c.lines = bright.map(() => PAPER);
    c.wordSoft = INK;
  }
  if (theme === 'white') {
    c.tileBg = PAPER;
    c.lines = bright.map(() => INK);
    c.wordInk = PAPER;
    c.wordSoft = PAPER;
  }
  return c;
}

/** Standalone SVG of a tool's logo tile (used for extension icons and favicons). */
export function logoTileSvg(slug: ToolSlug, size: number, theme: LogoTheme = 'light'): string {
  const m = logoMetrics(size);
  const c = logoColors(slug, theme);
  const scale = m.glyph / 48;
  const offset = (size - m.glyph) / 2;
  const parts = LOGO_GLYPHS[slug]
    .map((p) => {
      if (p.fill) return `<path d="${p.d}" fill="${c.glyph}" stroke="none"/>`;
      const extra =
        (p.opacity !== undefined ? ` opacity="${p.opacity}"` : '') +
        (p.dash ? ` stroke-dasharray="${p.dash.join(' ')}"` : '');
      return `<path d="${p.d}"${extra}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${m.radius}" fill="${c.tileBg}"/><g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${c.glyph}" stroke-width="${LOGO_STROKE}" stroke-linecap="round" stroke-linejoin="round">${parts}</g></svg>`;
}

/** Standalone SVG of the hub logo tile. */
export function hubLogoTileSvg(size: number, theme: LogoTheme = 'light'): string {
  const m = logoMetrics(size);
  const c = hubLogoColors(theme);
  const scale = m.glyph / 48;
  const offset = (size - m.glyph) / 2;
  const paths = HUB_LOGO_PATHS.map((d, i) => `<path d="${d}" stroke="${c.lines[i]}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${m.radius}" fill="${c.tileBg}"/><g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke-width="${HUB_LOGO_STROKE}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}
