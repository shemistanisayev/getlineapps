/**
 * Glyph sets, ported from design/foldline/Glyph.dc.html and design/markline/Glyph.dc.html.
 * 24x24 viewBox, stroke 2.1, round caps. `d2` is drawn dashed (2.2 3).
 */
const R = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
const C = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0z`;

export interface GlyphDef {
  title: string;
  d: string;
  d2?: string;
  /** A filled brand mark (no stroke) with its own fill and tint. */
  brand?: { fill: string; tint: string };
}

const shield = 'M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6z';
const phone = R(7, 3, 10, 18, 2.5) + 'M11 17.5h2';
const gauge = 'M4.5 16.5a7.5 7.5 0 1 1 15 0M12 16.5l3.5-4.5';
const callPath =
  'M5 4h3.5l2 5-2.5 1.5a11 11 0 0 0 5.5 5.5l1.5-2.5 5 2v3.5a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z';
const imagePath = R(3, 5, 18, 14, 2.5) + C(9, 10, 1.6) + 'M21 15.5l-5-5-9 8.5';
const keyboardPath = R(2.5, 6, 19, 12, 2.5) + 'M6.5 10h1M10.5 10h1M14.5 10h1M8 14h8';
const lockPath = R(5, 11, 14, 9.5, 2.2) + 'M8 11V8a4 4 0 0 1 8 0v3';

// WhatsApp mark from the Foldline design's brand icons (Simple Icons, CC0).
const WHATSAPP =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

export const FOLDLINE_GLYPHS = {
  firstscreen: { title: 'First screen', d: R(3, 4, 18, 15, 2.5), d2: 'M1.5 12.5h21' },
  headline: { title: 'Headline', d: 'M6 5v14M18 5v14M6 12h12' },
  button: { title: 'Main button', d: R(3, 6, 15, 9, 3) + 'M14.5 13.5l6 2.2-2.6 1.1-1.1 2.6z' },
  buttons: { title: 'Competing buttons', d: R(3, 4, 13, 6, 2) + R(8, 14, 13, 6, 2) },
  popup: { title: 'Pop-up', d: R(3, 4, 18, 16, 2.5) + R(7, 8, 10, 8, 1.5) + 'M14.5 10.5l-1.5 1.5' },
  form: { title: 'Form', d: R(4.5, 3, 15, 18, 2.5) + 'M8.5 8h7M8.5 12h7M8.5 16h4' },
  fields: { title: 'Form fields', d: R(3, 4, 18, 6, 2) + R(3, 14, 18, 6, 2) },
  label: {
    title: 'Field labels',
    d: 'M3.5 11.5V5a1.5 1.5 0 0 1 1.5-1.5h6.5l9 9-8 8z' + C(8, 8, 1.4),
  },
  keyboard: { title: 'Input type', d: keyboardPath },
  autofill: { title: 'Autofill', d: 'M4 20l10-10M15 3.5v3M19.5 5.5l-2 2M20.5 10h-3M15 13.5V11' },
  submit: { title: 'Button text', d: 'M4 12l16-8-6 16-2.6-6.6z' },
  trust: { title: 'Trust', d: shield + 'M9 12l2 2 4-4' },
  reviews: {
    title: 'Reviews',
    d: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  },
  logos: {
    title: 'Client logos',
    d:
      R(3.5, 3.5, 7, 7, 1.8) +
      R(13.5, 3.5, 7, 7, 1.8) +
      R(3.5, 13.5, 7, 7, 1.8) +
      R(13.5, 13.5, 7, 7, 1.8),
  },
  guarantee: { title: 'Guarantee', d: shield + 'M9 12l2 2 4-4' },
  privacy: { title: 'Privacy link', d: 'M7 3h7l4 4v14H7z' + 'M14 3v4h4M10 12h5M10 16h5' },
  lock: { title: 'HTTPS', d: lockPath },
  mobile: { title: 'Mobile', d: phone },
  viewport: { title: 'Viewport tag', d: phone + 'M10 7.5h4' },
  tap: { title: 'Tap targets', d: C(12, 12, 3.2), d2: C(12, 12, 8.5) },
  text: { title: 'Text size', d: 'M5 6.5h10M10 6.5V19M14 12h6M17 12v7' },
  sideways: { title: 'Sideways scroll', d: 'M3.5 12h17M7.5 8l-4 4 4 4M16.5 8l4 4-4 4' },
  zoom: { title: 'Input zoom', d: C(10.5, 10.5, 6) + 'M15 15l5 5M8 10.5h5M10.5 8v5' },
  speed: { title: 'Speed', d: gauge },
  paint: { title: 'Largest paint', d: gauge },
  shift: {
    title: 'Layout shift',
    d: R(3.5, 4, 10, 7, 2) + R(10.5, 13, 10, 7, 2) + 'M8.5 13.5v2.5h-2',
  },
  image: { title: 'Image size', d: imagePath },
  lazy: { title: 'Lazy loading', d: C(12, 12, 8.5) + 'M12 7.5V12l3 2' },
  contact: { title: 'Contact', d: 'M5 5h14v10h-7.5L7 19v-4H5z' },
  phone: { title: 'Tap-to-call', d: callPath },
  whatsapp: { title: 'WhatsApp', d: WHATSAPP, brand: { fill: '#25D366', tint: '#E7F8EE' } },
  chat: { title: 'Chat', d: 'M5 5h14v10h-7.5L7 19v-4H5z' },
  mail: { title: 'Email', d: R(3, 5, 18, 14, 2.5) + 'M3.5 7.5l8.5 6 8.5-6' },
} satisfies Record<string, GlyphDef>;

export const MARKLINE_GLYPHS = {
  visible: { title: 'Visible area', d: R(3, 5, 18, 14, 2.5) + 'M3 9.5h18' },
  fullpage: {
    title: 'Full page',
    d: R(5, 2.5, 12, 19, 2) + 'M8 7h6M8 11h6M8 15h4',
    d2: 'M20.5 5v14',
  },
  area: { title: 'Selected area', d: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5' },
  element: { title: 'Element', d: R(3, 3, 13, 10, 2) + 'M12 12l8 3-3.4 1.4L15 20z' },
  select: { title: 'Select', d: 'M5.5 3.5l12.5 6.3-5.4 1.8-1.8 5.4z' },
  arrow: { title: 'Arrow', d: 'M5 19L19 5M10 5h9v9' },
  box: { title: 'Box', d: R(4, 5, 16, 14, 2) },
  number: { title: 'Numbered note', d: C(12, 12, 8.5) + 'M10.5 9.5l2-1.5V16' },
  text: { title: 'Text', d: 'M5 6.5V4.5h14v2M12 4.5v15M9 19.5h6' },
  highlight: { title: 'Highlight', d: 'M14.5 4l5.5 5.5-8 8H6.5V12z', d2: 'M4 21h16' },
  blur: {
    title: 'Blur',
    d: 'M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z',
  },
  email: {
    title: 'Email found',
    d: C(12, 12, 3.5) + 'M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.3 6.7',
  },
  phone: { title: 'Phone found', d: callPath },
  details: { title: 'Page details', d: C(12, 12, 9) + 'M12 11v5.5M12 7.5h.01' },
  png: { title: 'PNG image', d: imagePath },
  pdf: { title: 'PDF summary', d: 'M7 3h7l4 4v14H7z' + 'M14 3v4h4M10 13h5M10 17h5' },
  copy: {
    title: 'Copy',
    d:
      R(8, 8, 12, 12, 2) +
      'M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8',
  },
  notes: { title: 'Notes list', d: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01' },
  undo: { title: 'Undo', d: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11' },
  keyboard: { title: 'Shortcuts', d: keyboardPath },
  lock: { title: 'Local only', d: lockPath },
  download: { title: 'Download', d: 'M12 4v11M7 10l5 5 5-5M5 20h14' },
} satisfies Record<string, GlyphDef>;

export type FoldlineGlyph = keyof typeof FOLDLINE_GLYPHS;
export type MarklineGlyph = keyof typeof MARKLINE_GLYPHS;

export const GLYPH_SETS = { foldline: FOLDLINE_GLYPHS, markline: MARKLINE_GLYPHS } as const;
export type GlyphSet = keyof typeof GLYPH_SETS;

/** [tint, ink] per tone, from each tool's Glyph artboard. */
export const GLYPH_TONES = {
  foldline: {
    neutral: ['#EEEDF3', '#475467'],
    brand: ['#FCE7F6', '#9E165F'],
    bad: ['#FEF3F2', '#B42318'],
    ok: ['#ECFDF3', '#067647'],
    dark: ['rgba(255,255,255,.14)', '#FFFFFF'],
  },
  markline: {
    neutral: ['#EEEDF3', '#475467'],
    brand: ['#FEF9C3', '#101828'],
    solid: ['#FACC15', '#101828'],
    ink: ['#101828', '#FACC15'],
    bad: ['#FEF3F2', '#B42318'],
    ok: ['#ECFDF3', '#067647'],
    dark: ['rgba(255,255,255,.14)', '#FFFFFF'],
  },
} as const;
