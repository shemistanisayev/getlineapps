/**
 * Brand kit (docs/rivaline-SPEC.md §6). collectBrand (extension, isolated world) returns BrandRaw;
 * these pure functions turn it into colors with roles, fonts, the main button and the exports.
 */

/* Raw data from the page. */

export interface FontRaw {
  /** Computed `font-family` ("Fraunces, Georgia, serif"). */
  family: string;
  weight: string;
  /** px */
  size: number;
}

export interface ButtonRaw {
  bg: string;
  color: string;
  /** Computed border-radius ("999px"). */
  radius: string;
  height: number;
  paddingX: number;
  family: string;
  weight: string;
  size: number;
  label: string;
}

export interface BrandRaw {
  /** Painted backgrounds in the first two viewports: computed color and visible area (px²). */
  backgrounds: Array<{ color: string; area: number }>;
  /** Text: color, the background it sits on, weight (characters x font size), link or not. */
  texts: Array<{ color: string; bg: string; weight: number; link: boolean }>;
  /** Colors held by `:root` custom properties. */
  rootColors: string[];
  logo: {
    rect: { x: number; y: number; width: number; height: number };
    dpr: number;
    /** Inline SVG markup (max 50 KB). */
    svg?: string;
    /** The whole logo is inside the first viewport. */
    inView: boolean;
  } | null;
  headings: FontRaw | null;
  body: FontRaw | null;
  fonts: {
    /** Families requested from fonts.googleapis.com. */
    google: string[];
    /** A use.typekit.net stylesheet is present. */
    adobe: boolean;
    /** Families with an @font-face on the page. */
    faces: string[];
  };
  button: ButtonRaw | null;
}

/* Colors. */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parses `rgb()`, `rgba()`, `#rgb`, `#rrggbb`, `#rrggbbaa` and `transparent`. */
export function parseColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hex = /^#([0-9a-f]{3,8})$/.exec(s)?.[1];
  if (hex) {
    const full = hex.length === 3 || hex.length === 4 ? [...hex].map((c) => c + c).join('') : hex;
    if (full.length !== 6 && full.length !== 8) return null;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) / 255 : 1 };
  }
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(
    s,
  );
  if (!m) return null;
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1]!, g: +m[2]!, b: +m[3]!, a };
}

export function toHex({ r, g, b }: Rgba): string {
  return `#${[r, g, b]
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function lab({ r, g, b }: Rgba): [number, number, number] {
  const lin = (v: number) => {
    const c = v / 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIE76 ΔE between two colors. */
export function deltaE(a: Rgba, b: Rgba): number {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * HSV saturation, 0 to 1. HSL would call pale tints "saturated" (Kova's #F1E3C2 product tile is
 * 0.6 in HSL, 0.2 in HSV), so the accent would be a pastel instead of the brand's yellow.
 */
export function saturation({ r, g, b }: Rgba): number {
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
}

/** Colors closer than this are one color (SPEC §6). */
export const MERGE_DELTA_E = 6;
const SATURATED = 0.3;

interface Cluster {
  hex: string;
  rgb: Rgba;
  weight: number;
}

/**
 * Groups colors closer than ΔE 6. Heaviest colors go first, so each group is named after its
 * most used member.
 */
export function mergeColors(items: Array<{ color: string; weight: number }>): {
  clusters: Cluster[];
  /** hex of any input color -> hex of its group. */
  of: (color: string) => string | null;
} {
  const totals = new Map<string, { rgb: Rgba; weight: number }>();
  for (const { color, weight } of items) {
    const rgb = parseColor(color);
    if (!rgb || rgb.a < 0.9 || weight <= 0) continue;
    const hex = toHex(rgb);
    const t = totals.get(hex);
    if (t) t.weight += weight;
    else totals.set(hex, { rgb, weight });
  }
  const sorted = [...totals.entries()].sort((a, b) => b[1].weight - a[1].weight);
  const clusters: Cluster[] = [];
  const map = new Map<string, string>();
  for (const [hex, { rgb, weight }] of sorted) {
    const into = clusters.find((c) => deltaE(c.rgb, rgb) < MERGE_DELTA_E);
    if (into) {
      into.weight += weight;
      map.set(hex, into.hex);
    } else {
      clusters.push({ hex, rgb, weight });
      map.set(hex, hex);
    }
  }
  return {
    clusters,
    of: (color) => {
      const rgb = parseColor(color);
      if (!rgb || rgb.a < 0.9) return null;
      const hex = toHex(rgb);
      return map.get(hex) ?? clusters.find((c) => deltaE(c.rgb, rgb) < MERGE_DELTA_E)?.hex ?? null;
    },
  };
}

export type ColorRole = 'primary' | 'text' | 'background' | 'accent' | 'surface';
/** Display and export order (design: Brand, BrandExport, Report). */
export const ROLE_ORDER: ColorRole[] = ['primary', 'text', 'background', 'accent', 'surface'];

export interface BrandColor {
  role: ColorRole;
  hex: string;
}

/** Roles from SPEC §6. Returns up to 5 colors in ROLE_ORDER. */
export function colorRoles(raw: Pick<BrandRaw, 'backgrounds' | 'texts' | 'button'>): BrandColor[] {
  const all = mergeColors([
    ...raw.backgrounds.map((b) => ({ color: b.color, weight: b.area })),
    ...raw.texts.map((t) => ({ color: t.color, weight: t.weight })),
    ...(raw.button ? [{ color: raw.button.bg, weight: 1 }] : []),
  ]);
  const heaviest = (entries: Array<[string | null, number]>, skip: Set<string>) => {
    const sum = new Map<string, number>();
    for (const [hex, w] of entries)
      if (hex && !skip.has(hex)) sum.set(hex, (sum.get(hex) ?? 0) + w);
    return [...sum.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const used = new Set<string>();
  const roles: Partial<Record<ColorRole, string>> = {};
  const set = (role: ColorRole, hex: string | undefined) => {
    if (!hex) return;
    roles[role] = hex;
    used.add(hex);
  };
  const bgs = raw.backgrounds.map((b): [string | null, number] => [all.of(b.color), b.area]);
  set('background', heaviest(bgs, used));
  set(
    'text',
    heaviest(
      raw.texts
        .filter((t) => all.of(t.bg) === roles.background)
        .map((t): [string | null, number] => [all.of(t.color), t.weight]),
      used,
    ),
  );
  const buttonBg = raw.button ? all.of(raw.button.bg) : null;
  set(
    'primary',
    buttonBg && !used.has(buttonBg)
      ? buttonBg
      : heaviest(
          raw.texts
            .filter((t) => t.link)
            .map((t): [string | null, number] => [all.of(t.color), t.weight]),
          used,
        ),
  );
  const saturated = all.clusters.filter((c) => !used.has(c.hex) && saturation(c.rgb) >= SATURATED);
  set('accent', saturated[0]?.hex);
  set('surface', heaviest(bgs, used));
  return ROLE_ORDER.filter((r) => roles[r]).map((role) => ({ role, hex: roles[role]! }));
}

/* Fonts. */

export type FontSource = 'google' | 'adobe' | 'self' | 'system';

export interface BrandFont {
  family: string;
  /** Generic fallback for the CSS export ("serif", "sans-serif"). */
  generic: string;
  weight: string;
  size: number;
  source: FontSource;
}

const GENERICS = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];
const unquote = (s: string) =>
  s
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();

/** First family of a computed font-family list, and its generic fallback. */
export function splitFamily(list: string): { family: string; generic: string } {
  const parts = list.split(',').map(unquote).filter(Boolean);
  const generic =
    [...parts].reverse().find((p) => GENERICS.includes(p.toLowerCase())) ?? 'sans-serif';
  return { family: parts[0] ?? '', generic: generic.toLowerCase() };
}

/** Families named in a fonts.googleapis.com URL (css and css2). */
export function googleFamilies(href: string): string[] {
  try {
    const u = new URL(href);
    return u.searchParams
      .getAll('family')
      .flatMap((f) => f.split('|'))
      .map((f) => f.split(':')[0]!.replace(/\+/g, ' ').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function fontSource(family: string, fonts: BrandRaw['fonts']): FontSource {
  const f = family.toLowerCase();
  const has = (list: string[]) => list.some((x) => x.toLowerCase() === f);
  if (has(fonts.google)) return 'google';
  if (fonts.adobe && has(fonts.faces)) return 'adobe';
  if (has(fonts.faces)) return 'self';
  return 'system';
}

export function brandFont(raw: FontRaw | null, fonts: BrandRaw['fonts']): BrandFont | null {
  if (!raw) return null;
  const { family, generic } = splitFamily(raw.family);
  if (!family) return null;
  return {
    family,
    generic,
    weight: raw.weight,
    size: Math.round(raw.size),
    source: fontSource(family, fonts),
  };
}

/* Main button. */

export interface BrandButton {
  background: string;
  text: string;
  radius: string;
  height: number;
  paddingX: number;
  family: string;
  weight: string;
  size: number;
  label: string;
}

const MAX_LABEL = 24;

export function brandButton(raw: ButtonRaw | null): BrandButton | null {
  if (!raw) return null;
  const bg = parseColor(raw.bg);
  const fg = parseColor(raw.color);
  if (!bg || !fg || bg.a === 0) return null;
  const label = raw.label.replace(/\s+/g, ' ').trim();
  return {
    background: toHex(bg),
    text: toHex(fg),
    radius: raw.radius.split(' ')[0] || '0px',
    height: Math.round(raw.height),
    paddingX: Math.round(raw.paddingX),
    family: splitFamily(raw.family).family,
    weight: raw.weight,
    size: Math.round(raw.size),
    label: label.length > MAX_LABEL ? `${label.slice(0, MAX_LABEL - 1).trimEnd()}…` : label,
  };
}

/* The kit and its exports. */

export interface BrandKit {
  colors: BrandColor[];
  heading: BrandFont | null;
  body: BrandFont | null;
  button: BrandButton | null;
  logo: BrandRaw['logo'];
}

export function brandKit(raw: BrandRaw): BrandKit {
  return {
    colors: colorRoles(raw),
    heading: brandFont(raw.headings, raw.fonts),
    body: brandFont(raw.body, raw.fonts),
    button: brandButton(raw.button),
    logo: raw.logo,
  };
}

/** "Kova Skincare" -> "kova-skincare"; empty names become "brand". */
export function brandSlug(name: string): string {
  const s = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/, '');
  return s || 'brand';
}

const fontValue = (f: BrandFont) => `"${f.family}", ${f.generic}`;

/** CSS variables export (BrandExport). */
export function exportCss(kit: BrandKit, slug: string): string {
  const lines = kit.colors.map((c) => `  --${slug}-${c.role}: ${c.hex};`);
  if (kit.heading) lines.push(`  --${slug}-font-heading: ${fontValue(kit.heading)};`);
  if (kit.body) lines.push(`  --${slug}-font-body: ${fontValue(kit.body)};`);
  if (kit.button) lines.push(`  --${slug}-button-radius: ${kit.button.radius};`);
  return `:root {\n${lines.join('\n')}\n}\n`;
}

/** JSON export: the same values, nested. */
export function exportJson(kit: BrandKit, slug: string): string {
  const data = {
    brand: slug,
    colors: Object.fromEntries(kit.colors.map((c) => [c.role, c.hex])),
    fonts: {
      ...(kit.heading ? { heading: fontValue(kit.heading) } : {}),
      ...(kit.body ? { body: fontValue(kit.body) } : {}),
    },
    ...(kit.button ? { button: { radius: kit.button.radius } } : {}),
  };
  return `${JSON.stringify(data, null, 2)}\n`;
}

/** File names (SPEC §6). */
export function exportFileNames(slug: string) {
  return { css: `${slug}.css`, json: `${slug}-brand.json`, png: `${slug}-palette.png` };
}

/**
 * Where to crop the logo out of captureVisibleTab (device pixels). null when it is not fully in
 * the first viewport: the panel then asks to scroll to the top and read the page again.
 */
export function logoCrop(
  logo: BrandRaw['logo'],
): { x: number; y: number; width: number; height: number } | null {
  if (!logo || !logo.inView || logo.rect.width < 4 || logo.rect.height < 4) return null;
  const d = logo.dpr || 1;
  return {
    x: Math.floor(logo.rect.x * d),
    y: Math.floor(logo.rect.y * d),
    width: Math.ceil(logo.rect.width * d),
    height: Math.ceil(logo.rect.height * d),
  };
}
