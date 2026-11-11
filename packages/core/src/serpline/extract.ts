/**
 * Extractors (SPEC §4.1). They run on any DOM Document: the raw HTML and the rendered HTML, both
 * parsed with DOMParser in the panel, so the two sides are read the same way.
 */
import { registrableDomain } from '../shared/domain.ts';

export type AltState = 'missing' | 'empty' | 'present';
export type LinkKind = 'internal' | 'external' | 'other';

export interface Heading {
  level: number;
  text: string;
  path: string;
}

export interface PageImage {
  src: string;
  /** Last path segment of the src ("pro-x-side.jpg"). */
  file: string;
  alt: AltState;
  path: string;
}

export interface PageLink {
  /** Resolved against the page URL. */
  href: string;
  text: string;
  kind: LinkKind;
  nofollow: boolean;
  sponsored: boolean;
  ugc: boolean;
  emptyText: boolean;
  path: string;
}

export interface JsonLdFacts {
  blocks: number;
  /** `@type` values in document order, without duplicates (also inside `@graph`). */
  types: string[];
  /** Blocks that are not valid JSON. */
  errors: number;
}

export interface Section {
  /** `#id`, or a CSS path for a section element without id. */
  key: string;
  tag: string;
  id: string | null;
  words: number;
  links: number;
  path: string;
}

export interface PageFacts {
  url: string;
  /** null when there is no `<title>`. */
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  googlebot: string | null;
  lang: string | null;
  viewport: string | null;
  hreflang: { lang: string; href: string }[];
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
    siteName: string | null;
  };
  twitterCard: string | null;
  headings: Heading[];
  images: PageImage[];
  links: PageLink[];
  jsonLd: JsonLdFacts;
  words: number;
  sections: Section[];
}

const SKIP_TEXT = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
const SECTION_TAGS = new Set(['SECTION', 'ARTICLE', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'NAV']);
const WORD = /[\p{L}\p{N}]/u;

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

function resolve(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

/** Visible-text words: whitespace split, tokens with a letter or digit, script/style/noscript/template skipped. */
export function countWords(root: Node | null): number {
  if (!root) return 0;
  return textOf(root)
    .split(/\s+/)
    .filter((w) => WORD.test(w)).length;
}

/** Text of a subtree, each text node separated by a space (like innerText's block breaks). */
export function textOf(root: Node): string {
  const parts: string[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === 3) {
      parts.push(n.nodeValue ?? '');
      return;
    }
    if (n.nodeType !== 1 && n.nodeType !== 9 && n.nodeType !== 11) return;
    if (n.nodeType === 1 && SKIP_TEXT.has((n as Element).tagName.toUpperCase())) return;
    if (n.nodeType === 1 && (n as Element).tagName.toUpperCase() === 'TEMPLATE') return;
    n.childNodes.forEach(walk);
  };
  walk(root);
  return parts.join(' ');
}

const SIMPLE_ID = /^[A-Za-z][\w-]*$/;

/** Short, stable CSS path: nearest ancestor with a simple id, then tag:nth-of-type steps. */
export function cssPath(el: Element): string {
  const steps: string[] = [];
  let node: Element | null = el;
  while (node && node.tagName.toUpperCase() !== 'HTML') {
    const tag = node.tagName.toLowerCase();
    if (node.id && SIMPLE_ID.test(node.id)) {
      steps.unshift(`${tag}#${node.id}`);
      break;
    }
    if (tag === 'body') {
      steps.unshift('body');
      break;
    }
    const parent: Element | null = node.parentElement;
    if (!parent) {
      steps.unshift(tag);
      break;
    }
    const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
    steps.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag);
    node = parent;
  }
  return steps.join(' > ');
}

function meta(doc: Document, attr: 'name' | 'property', key: string): string | null {
  for (const m of Array.from(doc.querySelectorAll(`meta[${attr}]`))) {
    if ((m.getAttribute(attr) ?? '').trim().toLowerCase() === key) {
      return clean(m.getAttribute('content'));
    }
  }
  return null;
}

/** Accessible name of a link: text, else aria-label, else image alt. */
function linkText(a: Element): string {
  const text = clean(textOf(a));
  if (text) return text;
  const label = clean(a.getAttribute('aria-label'));
  if (label) return label;
  const img = a.querySelector('img[alt]');
  return clean(img?.getAttribute('alt'));
}

function linkKind(href: string, pageUrl: string): LinkKind {
  let u: URL;
  let page: URL;
  try {
    u = new URL(href);
    page = new URL(pageUrl);
  } catch {
    return 'other';
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'other';
  // A jump link to a part of this page (#reviews) is neither internal nor external.
  if (
    u.hash &&
    u.origin === page.origin &&
    u.pathname === page.pathname &&
    u.search === page.search
  )
    return 'other';
  return registrableDomain(u.hostname) === registrableDomain(page.hostname)
    ? 'internal'
    : 'external';
}

function collectTypes(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v) => collectTypes(v, out));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  const t = obj['@type'];
  for (const type of Array.isArray(t) ? t : [t]) {
    if (typeof type === 'string' && type && !out.includes(type)) out.push(type);
  }
  if (obj['@graph']) collectTypes(obj['@graph'], out);
}

export function extractJsonLd(doc: Document): JsonLdFacts {
  const facts: JsonLdFacts = { blocks: 0, types: [], errors: 0 };
  for (const s of Array.from(doc.querySelectorAll('script[type]'))) {
    if ((s.getAttribute('type') ?? '').trim().toLowerCase() !== 'application/ld+json') continue;
    facts.blocks++;
    try {
      collectTypes(JSON.parse(s.textContent ?? ''), facts.types);
    } catch {
      facts.errors++;
    }
  }
  return facts;
}

export function extract(doc: Document, url: string): PageFacts {
  const titleEl = doc.querySelector('title');
  const canonicalEl = Array.from(doc.querySelectorAll('link[rel][href]')).find((l) =>
    (l.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'),
  );
  const hreflang = Array.from(doc.querySelectorAll('link[rel][hreflang][href]'))
    .filter((l) => (l.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).includes('alternate'))
    .map((l) => ({
      lang: clean(l.getAttribute('hreflang')),
      href: resolve(l.getAttribute('href') ?? '', url),
    }));

  const headings: Heading[] = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
    (h) => ({
      level: Number(h.tagName.slice(1)),
      text: clean(textOf(h)),
      path: cssPath(h),
    }),
  );

  const images: PageImage[] = Array.from(doc.querySelectorAll('img')).map((img) => {
    const raw = img.getAttribute('src') ?? img.getAttribute('data-src') ?? '';
    const src = raw ? resolve(raw, url) : '';
    const alt = img.getAttribute('alt');
    let file = src;
    try {
      file = decodeURIComponent(new URL(src).pathname.split('/').filter(Boolean).pop() ?? src);
    } catch {
      /* keep src */
    }
    return {
      src,
      file,
      alt: alt === null ? 'missing' : alt.trim() === '' ? 'empty' : 'present',
      path: cssPath(img),
    };
  });

  const links: PageLink[] = Array.from(doc.querySelectorAll('a[href]')).map((a) => {
    const href = resolve(a.getAttribute('href') ?? '', url);
    const rel = (a.getAttribute('rel') ?? '').toLowerCase().split(/\s+/);
    const text = linkText(a);
    return {
      href,
      text,
      kind: linkKind(href, url),
      nofollow: rel.includes('nofollow'),
      sponsored: rel.includes('sponsored'),
      ugc: rel.includes('ugc'),
      emptyText: text === '',
      path: cssPath(a),
    };
  });

  const sections: Section[] = Array.from(doc.body?.querySelectorAll('*') ?? [])
    .filter((el) => SECTION_TAGS.has(el.tagName.toUpperCase()) || (el.id && SIMPLE_ID.test(el.id)))
    .map((el) => {
      const id = el.id && SIMPLE_ID.test(el.id) ? el.id : null;
      const path = cssPath(el);
      return {
        key: id ? `#${id}` : path,
        tag: el.tagName.toLowerCase(),
        id,
        words: countWords(el),
        links: el.querySelectorAll('a[href]').length,
        path,
      };
    });

  return {
    url,
    title: titleEl ? clean(titleEl.textContent) : null,
    description: meta(doc, 'name', 'description'),
    canonical: canonicalEl ? resolve(canonicalEl.getAttribute('href') ?? '', url) : null,
    robots: meta(doc, 'name', 'robots'),
    googlebot: meta(doc, 'name', 'googlebot'),
    lang: clean(doc.documentElement?.getAttribute('lang')) || null,
    viewport: meta(doc, 'name', 'viewport'),
    hreflang,
    og: {
      title: meta(doc, 'property', 'og:title'),
      description: meta(doc, 'property', 'og:description'),
      image: meta(doc, 'property', 'og:image'),
      url: meta(doc, 'property', 'og:url'),
      siteName: meta(doc, 'property', 'og:site_name'),
    },
    twitterCard: meta(doc, 'name', 'twitter:card'),
    headings,
    images,
    links,
    jsonLd: extractJsonLd(doc),
    words: countWords(doc.body),
    sections,
  };
}

/** Parse HTML with the environment's DOMParser (side panel, or happy-dom in tests). */
export function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

export const extractHtml = (html: string, url: string) => extract(parseHtml(html), url);
