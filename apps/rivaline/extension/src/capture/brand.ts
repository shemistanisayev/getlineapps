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
  // Sample the first two viewports, but only down to where the content ends: on a short page the
  // empty canvas under it would otherwise count as background, and the result would depend on
  // the window height.
  const contentBottom = document.body
    ? Math.ceil(document.body.getBoundingClientRect().bottom)
    : document.documentElement.scrollHeight;
  const bottom = Math.max(1, Math.min(2 * vh, contentBottom));

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

  /*
   * Overlays are not the brand: dialogs, cookie banners and country pop-ups (found in QA on real
   * shops). Skipped: anything inside a dialog, and large fixed layers that are not the header.
   */
  const all = Array.from(document.body?.querySelectorAll('*') ?? []).slice(0, MAX_ELEMENTS);
  const overlays: Element[] = Array.from(
    document.querySelectorAll(
      'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]',
    ),
  );
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || !shown(cs)) continue;
    if (el.closest('header, [role="banner"]') || el.querySelector('header, nav')) continue;
    const r = el.getBoundingClientRect();
    if (visibleArea(r) > vw * vh * 0.15) overlays.push(el);
  }
  const inOverlay = (el: Element) => overlays.some((o) => o === el || o.contains(el));
  const elements = all.filter((el) => !inOverlay(el));

  /* Painted backgrounds: own visible area minus the areas of opaque elements drawn over it. */
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
  const visible = (e: Element) => {
    const r = e.getBoundingClientRect();
    return r.width > 4 && r.height > 4 && shown(getComputedStyle(e)) && !inOverlay(e);
  };
  // Home links written as full URLs (https://shop.example/) count like href="/".
  const homeLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('header a[href], [role="banner"] a[href]'),
  ).filter((a) => {
    try {
      const u = new URL(a.href);
      return u.origin === location.origin && (u.pathname === '/' || u.pathname === '');
    } catch {
      return false;
    }
  });
  const fromHome = homeLinks.map((a) => a.querySelector('img, svg') ?? a).filter(visible);
  let logoEl: Element | undefined;
  for (const sel of LOGO) {
    logoEl = Array.from(document.querySelectorAll(sel)).find(visible);
    if (logoEl) break;
    if (sel === '[class*=logo] img' && fromHome[0]) {
      logoEl = fromHome[0];
      break;
    }
  }
  let logo: BrandRaw['logo'] = null;
  if (logoEl) {
    const r = logoEl.getBoundingClientRect();
    const svg = logoEl.tagName.toLowerCase() === 'svg' ? logoEl.outerHTML : undefined;
    logo = {
      rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      dpr: devicePixelRatio,
      svg: svg && svg.length <= 50_000 ? svg : undefined,
      inView: r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw,
      viewportWidth: vw,
    };
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
  const gstatic = performance
    .getEntriesByType('resource')
    .some((e) => e.name.startsWith('https://fonts.gstatic.com/'));
  const adobe =
    document.querySelector('link[href*="use.typekit.net"], script[src*="use.typekit.net"]') !==
    null;
  const faces = [
    ...new Set(Array.from(document.fonts).map((f) => f.family.replace(/^['"]|['"]$/g, ''))),
  ];

  /*
   * Main button: the largest visible link or button with a background in the first viewport.
   * Buttons in the page content win over ones in the header or navigation (QA: a country picker
   * in the header was bigger than the hero button).
   */
  let button: ButtonRaw | null = null;
  let best = 0;
  let bestInContent = false;
  for (const el of Array.from(document.querySelectorAll('a, button'))) {
    if (inOverlay(el)) continue;
    const cs = getComputedStyle(el);
    if (!shown(cs) || alpha(cs.backgroundColor) < 0.5) continue;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > vh || r.height > 120 || r.width > vw * 0.6) continue;
    const label = (el as HTMLElement).innerText?.trim() ?? '';
    // A word, not a page number or an icon.
    if ((label.match(/\p{L}/gu) ?? []).length < 2) continue;
    const area = r.width * r.height;
    const inContent = !el.closest('header, nav, [role="banner"], [role="navigation"]');
    if (bestInContent && !inContent) continue;
    if (inContent === bestInContent && area <= best) continue;
    best = area;
    bestInContent = inContent;
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
    fonts: { google: [...new Set(google)], gstatic, adobe, faces },
    button,
  };
}
