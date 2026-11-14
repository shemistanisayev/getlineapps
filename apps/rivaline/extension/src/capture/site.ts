/**
 * collectSite (docs/rivaline/PLAN-1.1.md, step 2). Runs in the isolated world after a click:
 * reads what the page says and links to (headline, offers, links, languages, structured data).
 * Self-contained and read only; nothing leaves the panel. The meaning is worked out in
 * @line/core/rivaline (siteInfo).
 */
import type { SiteRaw, SiteText } from '@line/core/rivaline';

export function collectSite(): SiteRaw {
  const MAX_ELEMENTS = 6000;
  const MAX_TEXTS = 400;
  const MAX_LINKS = 1500;
  const MAX_LD = 20;
  const MAX_LD_CHARS = 60_000;
  const vw = innerWidth;
  const vh = innerHeight;
  const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
  const shown = (el: Element) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1)
      return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const metaContent = (sel: string) =>
    document.querySelector<HTMLMetaElement>(sel)?.content?.trim() ?? '';

  /* Meta */
  const meta: Record<string, string> = {};
  for (const name of [
    'og:title',
    'og:description',
    'og:site_name',
    'og:price:currency',
    'product:price:currency',
  ]) {
    const v = metaContent(`meta[property="${name}"], meta[name="${name}"]`);
    if (v) meta[name] = v;
  }
  for (const name of ['apple-itunes-app', 'google-play-app']) {
    const v = metaContent(`meta[name="${name}"]`);
    if (v) meta[name] = v;
  }

  /* Where an element sits */
  const where = (el: Element): SiteText['where'] => {
    if (el.closest('footer, [role="contentinfo"]')) return 'footer';
    if (el.closest('nav, [role="navigation"]')) return 'nav';
    if (el.closest('header, [role="banner"]')) return 'header';
    return 'main';
  };

  /* Headline and the line under it */
  const h1 = Array.from(document.querySelectorAll('h1')).find(shown) ?? null;
  let sub = '';
  if (h1) {
    // The first paragraph after the headline in the same block (hero text).
    const block = h1.parentElement;
    const all = Array.from(block?.querySelectorAll('p') ?? []);
    const after = all.find(
      (p) =>
        shown(p) &&
        h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING &&
        clean(p.textContent).length > 10,
    );
    sub = clean(after?.textContent);
  }

  /*
   * Announcement bar: a thin full-width bar at the very top, or a block named like one. Only its
   * first message (carousels repeat several), without countdown digits. A bar full of links is a
   * utility menu, not an announcement (QA: HubSpot).
   */
  const barText = (el: Element) => {
    const lines = ((el as HTMLElement).innerText ?? '')
      .split(/\n+/)
      .map((l) => clean(l.replace(/(\b\d{1,3}\b[\s:]*){4,}/g, ' ')))
      .filter((l) => l.length >= 6);
    return lines[0] ?? '';
  };
  const fewLinks = (el: Element, max = 3) =>
    el.querySelectorAll('a, button').length <= max && !el.querySelector('nav, input, select');
  let announcement = '';
  const named = Array.from(
    document.querySelectorAll(
      '[class*="announcement" i], [id*="announcement" i], [class*="promo-bar" i], [class*="topbar" i], [class*="top-bar" i], [class*="ticker" i], [class*="marquee" i]',
    ),
  ).find((el) => shown(el) && el.getBoundingClientRect().top < vh * 0.3 && fewLinks(el, 6));
  if (named) announcement = barText(named);
  if (!announcement) {
    for (const el of Array.from(document.body?.children ?? []).slice(0, 6)) {
      const r = el.getBoundingClientRect();
      const text = barText(el);
      if (
        shown(el) &&
        r.top < 60 &&
        r.width > vw * 0.8 &&
        r.height >= 16 &&
        r.height <= 64 &&
        text.length >= 6 &&
        text.length <= 200 &&
        !el.matches('header, nav') &&
        fewLinks(el)
      ) {
        announcement = text;
        break;
      }
    }
  }
  announcement = announcement.slice(0, 200);

  /* Buttons in the first viewport, in page order. Not in fixed layers (country pickers, cookie
   * banners, sticky bars) and not skip links. */
  const inFixed = (el: Element) => {
    for (let e: Element | null = el; e && e !== document.body; e = e.parentElement)
      if (getComputedStyle(e).position === 'fixed') return true;
    return false;
  };
  const ctas: string[] = [];
  for (const el of Array.from(document.querySelectorAll('a, button'))) {
    if (ctas.length >= 8) break;
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > vh || r.height < 24) continue;
    if (el.closest('nav, [role="navigation"], footer, dialog, [aria-modal="true"]')) continue;
    const cs = getComputedStyle(el);
    const filled = !/rgba?\([^)]*,\s*0\)|transparent/.test(cs.backgroundColor);
    const outlined = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
    if (!filled && !outlined) continue;
    const label = clean((el as HTMLElement).innerText);
    if ((label.match(/\p{L}/gu) ?? []).length < 4 || label.length > 40) continue;
    if (/^skip to/i.test(label) || inFixed(el)) continue;
    ctas.push(label);
  }

  /* Visible short texts with where they sit */
  const texts: SiteText[] = [];
  const seen = new Set<string>();
  const all = Array.from(document.body?.querySelectorAll('*') ?? []).slice(0, MAX_ELEMENTS);
  for (const el of all) {
    if (texts.length >= MAX_TEXTS) break;
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|OPTION)$/i.test(el.tagName)) continue;
    // Own text only, so a block is not counted twice with its children.
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? '')
      .join(' ');
    if (!clean(own)) continue;
    const text = clean((el as HTMLElement).innerText ?? own);
    if (text.length < 2 || text.length > 200 || seen.has(text)) continue;
    if (!shown(el) || el.closest('dialog, [aria-modal="true"]')) continue;
    seen.add(text);
    texts.push({ text, where: where(el) });
  }

  /* Links, hreflang, structured data, email fields */
  const links: string[] = [];
  for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    if (links.length >= MAX_LINKS) break;
    const href = a.href;
    if (href && !href.startsWith('javascript:') && !links.includes(href)) links.push(href);
  }
  const hreflang = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]'),
  )
    .slice(0, 100)
    .map((l) => ({ lang: l.hreflang, href: l.href }));
  const jsonld: unknown[] = [];
  for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]')).slice(
    0,
    MAX_LD,
  )) {
    const raw = s.textContent ?? '';
    if (raw.length > MAX_LD_CHARS) continue;
    try {
      jsonld.push(JSON.parse(raw));
    } catch {
      /* broken JSON-LD on the page: skip it */
    }
  }
  const emailForm = Array.from(
    document.querySelectorAll(
      'input[type="email"], input[name*="email" i], input[autocomplete="email"]',
    ),
  ).some((el) => shown(el) && !el.closest('dialog, [aria-modal="true"]'));

  return {
    url: location.href,
    lang: document.documentElement.lang || '',
    title: clean(document.title),
    description: metaContent('meta[name="description"]'),
    meta,
    h1: clean(h1?.textContent),
    sub,
    ctas,
    announcement,
    texts,
    links,
    hreflang,
    jsonld,
    emailForm,
  };
}
