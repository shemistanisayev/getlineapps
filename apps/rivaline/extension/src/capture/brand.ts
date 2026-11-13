/**
 * collectBrand (docs/rivaline-SPEC.md §6). Runs in the isolated world: computed styles, fonts,
 * the logo rectangle and the main button. Self-contained, read only, raw data out; the roles are
 * worked out in @line/core/rivaline (brandKit).
 */
import type { BrandRaw, ButtonRaw, FontRaw } from '@line/core/rivaline';

export function collectBrand(): BrandRaw {
  const MAX_ELEMENTS = 4000;
  const vw = innerWidth;
  const vh = innerHeight;
  const bottom = Math.min(2 * vh, document.documentElement.scrollHeight);

  const alpha = (c: string) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return c === 'transparent' ? 0 : 1;
    const parts = m[1]!.split(/[\s,/]+/).filter(Boolean);
    return parts.length > 3 ? parseFloat(parts[3]!) : 1;
  };
  const visibleArea = (r: DOMRect) => {
    const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, bottom) - Math.max(r.top, 0));
    return w * h;
  };
  const shown = (cs: CSSStyleDeclaration) =>
    cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.1;

  // The canvas: html's background, else body's (CSS propagation), else white.
  const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
  const bodyBg = document.body ? getComputedStyle(document.body).backgroundColor : 'transparent';
  const canvas = alpha(htmlBg) > 0.5 ? htmlBg : alpha(bodyBg) > 0.5 ? bodyBg : 'rgb(255, 255, 255)';

  /* Painted backgrounds: own visible area minus the areas of opaque elements drawn over it. */
  const elements = Array.from(document.body?.querySelectorAll('*') ?? []).slice(0, MAX_ELEMENTS);
  const opaque = new Map<Element, { color: string; area: number }>();
  for (const el of elements) {
    const cs = getComputedStyle(el);
    if (!shown(cs) || alpha(cs.backgroundColor) < 0.9) continue;
    const area = visibleArea(el.getBoundingClientRect());
    if (area > 0) opaque.set(el, { color: cs.backgroundColor, area });
  }
  const painted = new Map<Element | 'canvas', { color: string; area: number }>([
    ['canvas', { color: canvas, area: vw * bottom }],
  ]);
  for (const [el, v] of opaque) painted.set(el, { ...v });
  for (const [el, v] of opaque) {
    let p = el.parentElement;
    while (p && !opaque.has(p)) p = p.parentElement;
    const host = painted.get(p ?? 'canvas')!;
    host.area -= v.area;
  }
  const backgrounds = [...painted.values()]
    .filter((b) => b.area > 0)
    .map((b) => ({ color: b.color, area: Math.round(b.area) }));

  /* Text colors with the background they sit on. */
  const bgOf = (el: Element): string => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const o = opaque.get(e);
      if (o) return o.color;
    }
    return canvas;
  };
  const texts: BrandRaw['texts'] = [];
  for (const el of elements) {
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (!shown(cs)) continue;
    const r = el.getBoundingClientRect();
    if (visibleArea(r) <= 0) continue;
    texts.push({
      color: cs.color,
      bg: bgOf(el),
      weight: Math.round(own.length * parseFloat(cs.fontSize)),
      link: el.closest('a') !== null,
    });
  }

  /* Colors in :root custom properties. */
  const rootColors: string[] = [];
  const rootCs = getComputedStyle(document.documentElement);
  for (let i = 0; i < rootCs.length && rootColors.length < 50; i++) {
    const name = rootCs[i]!;
    if (!name.startsWith('--')) continue;
    const v = rootCs.getPropertyValue(name).trim();
    if (/^(#[0-9a-f]{3,8}|rgba?\([^)]*\))$/i.test(v)) rootColors.push(v);
  }

  /* Logo: first visible match, then fallbacks for text logos. */
  const LOGO = [
    'header a[href="/"] img',
    'header a[href="/"] svg',
    'header [class*=logo] img',
    'header [class*=logo] svg',
    '[class*=logo] img',
    'header a[href="/"]',
    'header [class*=logo]',
  ];
  let logo: BrandRaw['logo'] = null;
  for (const sel of LOGO) {
    const el = Array.from(document.querySelectorAll(sel)).find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && shown(getComputedStyle(e));
    });
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const svg = el.tagName.toLowerCase() === 'svg' ? el.outerHTML : undefined;
    logo = {
      rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      dpr: devicePixelRatio,
      svg: svg && svg.length <= 50_000 ? svg : undefined,
      inView: r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw,
    };
    break;
  }

  /* Fonts. */
  const font = (el: Element | null): FontRaw | null => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { family: cs.fontFamily, weight: cs.fontWeight, size: parseFloat(cs.fontSize) };
  };
  const google: string[] = [];
  for (const l of Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[href*="fonts.googleapis.com"]'),
  )) {
    try {
      for (const f of new URL(l.href).searchParams.getAll('family'))
        for (const part of f.split('|'))
          google.push(part.split(':')[0]!.replace(/\+/g, ' ').trim());
    } catch {
      /* not a URL */
    }
  }
  const adobe =
    document.querySelector('link[href*="use.typekit.net"], script[src*="use.typekit.net"]') !==
    null;
  const faces = [
    ...new Set(Array.from(document.fonts).map((f) => f.family.replace(/^['"]|['"]$/g, ''))),
  ];

  /* Main button: the largest visible link or button with a background in the first viewport. */
  let button: ButtonRaw | null = null;
  let best = 0;
  for (const el of Array.from(document.querySelectorAll('a, button'))) {
    const cs = getComputedStyle(el);
    if (!shown(cs) || alpha(cs.backgroundColor) < 0.5) continue;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > vh || r.height > 120 || r.width > vw * 0.6) continue;
    const label = (el as HTMLElement).innerText?.trim() ?? '';
    const area = r.width * r.height;
    if (!label || area <= best) continue;
    best = area;
    button = {
      bg: cs.backgroundColor,
      color: cs.color,
      radius: cs.borderTopLeftRadius,
      height: r.height,
      paddingX: parseFloat(cs.paddingLeft),
      family: cs.fontFamily,
      weight: cs.fontWeight,
      size: parseFloat(cs.fontSize),
      label: label.slice(0, 60),
    };
  }

  return {
    backgrounds,
    texts,
    rootColors,
    logo,
    headings: font(document.querySelector('h1') ?? document.querySelector('h2')),
    body: font(document.body),
    fonts: { google: [...new Set(google)], adobe, faces },
    button,
  };
}
