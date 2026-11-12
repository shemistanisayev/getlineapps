// @vitest-environment happy-dom
/** Serpline 1.1 checks (SPEC §4.6, §4.7): indexing, schema, hreflang, links, speed and mobile. */
import { describe, expect, it } from 'vitest';
import { analyze, isWeakAnchor, zoomBlocked, type AnalyzeInput } from './analyze.ts';
import { validHreflang } from './hreflang.ts';
import { imageFindings, rate, type LiveFacts, type LiveImage } from './live.ts';
import { checkSchema } from './schema.ts';

const URL_ = 'https://shop.example.com/p/one';
const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">';
const HEAD =
  VIEWPORT +
  '<title>One | Shop</title><meta name="description" content="A short description."><meta property="og:description" content="x"><link rel="canonical" href="/p/one">';
const page = (head: string, body = '<h1>One</h1>') =>
  `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;

function run(html: string, extra: Partial<AnalyzeInput> = {}) {
  return analyze({
    url: URL_,
    renderedHtml: html,
    raw: { status: 200, contentType: 'text/html', text: html, xRobotsTag: null },
    robots: null,
    llms: null,
    ...extra,
  });
}
const ids = (html: string, extra?: Partial<AnalyzeInput>) =>
  run(html, extra).issues.map((i) => i.id);

const img = (o: Partial<LiveImage>): LiveImage => ({
  path: 'img',
  src: 'https://shop.example.com/a.jpg',
  file: 'a.jpg',
  naturalWidth: 400,
  naturalHeight: 400,
  width: 400,
  height: 400,
  sized: true,
  loading: null,
  aboveFold: false,
  bytes: 10_000,
  type: 'image/webp',
  ...o,
});

function live(o: Partial<LiveFacts> = {}): LiveFacts {
  return {
    vitals: {
      lcp: 1200,
      lcpPath: 'main > img',
      lcpTag: 'img',
      lcpUrl: null,
      cls: 0.01,
      clsPaths: [],
      inp: null,
      fcp: 800,
      ttfb: 200,
      hiddenAtLoad: false,
    },
    weight: {
      requests: 3,
      bytes: 1000,
      byKind: {
        document: { requests: 1, bytes: 500 },
        script: { requests: 1, bytes: 300 },
        css: { requests: 1, bytes: 200 },
        image: { requests: 0, bytes: 0 },
        font: { requests: 0, bytes: 0 },
        other: { requests: 0, bytes: 0 },
      },
      unknownSize: 0,
    },
    images: [],
    mobile: {
      viewportWidth: 1200,
      dpr: 1,
      overflow: 0,
      overflowPaths: [],
      smallText: 0,
      textBlocks: 10,
      smallTextPaths: [],
      smallTargets: 0,
      targets: 5,
      smallTargetPaths: [],
    },
    sitemap: { source: 'robots', files: [], found: true, complete: true },
    canonical: null,
    hreflang: [],
    ...o,
  };
}

describe('clean page', () => {
  it('a clean page with good live numbers has no issues and indexes', () => {
    const a = run(page(HEAD), { live: live() });
    expect(a.issues).toEqual([]);
    expect(a.indexability.verdict).toBe('yes');
    expect(a.score).toBe(100);
  });
});

describe('indexing', () => {
  it('HTTP_ERROR and the "no" verdict for a 404', () => {
    const html = page(HEAD);
    const a = run(html, {
      raw: { status: 404, contentType: 'text/html', text: html, xRobotsTag: null },
    });
    expect(a.issues.map((i) => i.id)).toContain('HTTP_ERROR');
    expect(a.indexability.verdict).toBe('no');
  });

  it('ROBOTS_BLOCKED when Googlebot or Bingbot may not crawl the path', () => {
    const robots = (text: string) => ({ status: 200, text, contentType: 'text/plain' });
    const a = run(page(HEAD), { robots: robots('User-agent: Googlebot\nDisallow: /p/') });
    expect(a.issues.find((i) => i.id === 'ROBOTS_BLOCKED')?.params).toMatchObject({
      bot: 'Googlebot',
    });
    expect(a.indexability.verdict).toBe('no');
    const b = run(page(HEAD), { robots: robots('User-agent: bingbot\nDisallow: /') });
    expect(b.issues.map((i) => i.id)).toContain('ROBOTS_BLOCKED');
    expect(b.indexability.verdict).toBe('risky');
    // A rule for * alone blocks both.
    expect(ids(page(HEAD), { robots: robots('User-agent: *\nDisallow: /') })).toContain(
      'ROBOTS_BLOCKED',
    );
  });

  it('canonical target status, redirects and duplicates', () => {
    const head = HEAD.replace('/p/one', '/p/main');
    const target = 'https://shop.example.com/p/main';
    expect(
      ids(page(head), {
        live: live({
          canonical: { url: target, status: 404, redirected: false, finalUrl: target },
        }),
      }),
    ).toContain('CANONICAL_BROKEN');
    expect(
      ids(page(head), {
        live: live({
          canonical: { url: target, status: 200, redirected: true, finalUrl: target + '-new' },
        }),
      }),
    ).toContain('CANONICAL_REDIRECT');
    expect(ids(page(HEAD + '<link rel="canonical" href="/p/two">'))).toContain('CANONICAL_MULTI');
    expect(ids(page(HEAD + '<link rel="canonical" href="/p/one/">'))).not.toContain(
      'CANONICAL_MULTI',
    );
  });

  it('NOT_IN_SITEMAP only when a sitemap was read and the page is indexable', () => {
    const missing = live({
      sitemap: {
        source: 'robots',
        files: [
          { url: 'https://shop.example.com/sitemap.xml', status: 200, kind: 'urlset', urls: 4 },
        ],
        found: false,
        complete: true,
      },
    });
    expect(ids(page(HEAD), { live: missing })).toContain('NOT_IN_SITEMAP');
    expect(
      ids(page(HEAD), {
        live: live({ sitemap: { source: 'default', files: [], found: null, complete: true } }),
      }),
    ).not.toContain('NOT_IN_SITEMAP');
    expect(
      ids(page(HEAD + '<meta name="robots" content="noindex">'), { live: missing }),
    ).not.toContain('NOT_IN_SITEMAP');
  });
});

describe('structured data', () => {
  it('lists missing required and recommended properties', () => {
    const items = checkSchema([
      { '@type': 'Product', name: 'X', offers: { '@type': 'Offer', price: '9' } },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { position: 1, name: 'Home' },
          { position: 2, name: 'X' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [{ '@type': 'Question', name: 'Q', acceptedAnswer: { text: 'A' } }],
      },
      { '@type': 'WebSite', name: 'Shop' },
    ]);
    expect(items.map((i) => [i.type, i.missing])).toEqual([
      ['Product', ['offers.priceCurrency']],
      ['BreadcrumbList', ['itemListElement.item']],
      ['FAQPage', []],
      ['WebSite', []],
    ]);
    expect(items[0]!.recommended).toEqual(
      expect.arrayContaining(['image', 'brand', 'offers.availability']),
    );
    expect(items[3]!.result).toBeNull();
  });

  it('SCHEMA_REQUIRED and SCHEMA_PARSE', () => {
    expect(
      ids(page(HEAD + '<script type="application/ld+json">{"@type":"Product"}</script>')),
    ).toContain('SCHEMA_REQUIRED');
    expect(ids(page(HEAD + '<script type="application/ld+json">{oops</script>'))).toContain(
      'SCHEMA_PARSE',
    );
  });
});

describe('hreflang', () => {
  it('validates codes', () => {
    expect(['en', 'en-GB', 'az-Latn-AZ', 'es-419', 'x-default'].map(validHreflang)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(['en-UK', 'english', 'e', 'en_GB'].map(validHreflang)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('HREFLANG_INVALID, HREFLANG_NO_SELF and HREFLANG_NO_RETURN', () => {
    const alt = (lang: string, href: string) =>
      `<link rel="alternate" hreflang="${lang}" href="${href}">`;
    expect(ids(page(HEAD + alt('en-UK', '/p/one') + alt('az', '/az/p/one')))).toEqual([
      'HREFLANG_INVALID',
    ]);
    expect(ids(page(HEAD + alt('az', '/az/p/one')))).toEqual(['HREFLANG_NO_SELF']);
    const az = 'https://shop.example.com/az/p/one';
    const a = run(page(HEAD + alt('en', '/p/one') + alt('az', '/az/p/one')), {
      live: live({
        hreflang: [
          { url: az, lang: 'az', status: 200, redirected: false, finalUrl: az, linksBack: false },
        ],
      }),
    });
    expect(a.issues.map((i) => i.id)).toEqual(['HREFLANG_NO_RETURN']);
  });
});

describe('links', () => {
  it('flags weak anchors in several languages', () => {
    expect(
      ['Click here', 'Ətraflı', 'Подробнее', 'read more →', 'Read the manual'].map(isWeakAnchor),
    ).toEqual([true, true, true, true, false]);
  });

  it('LINK_NO_TEXT, WEAK_ANCHOR, INTERNAL_NOFOLLOW and HTTP_LINKS', () => {
    const body =
      '<h1>One</h1><a href="/a"></a><a href="/b">Read more</a><a href="/c" rel="nofollow">C</a><a href="http://shop.example.com/d">D</a>';
    expect(ids(page(HEAD, body))).toEqual([
      'LINK_NO_TEXT',
      'WEAK_ANCHOR',
      'INTERNAL_NOFOLLOW',
      'HTTP_LINKS',
    ]);
  });
});

describe('speed, server and mobile', () => {
  it('rates the vitals with Google thresholds', () => {
    expect([rate('lcp', 2500), rate('lcp', 3000), rate('lcp', 4100)]).toEqual([
      'good',
      'needs_improvement',
      'poor',
    ]);
    expect(rate('cls', 0.3)).toBe('poor');
  });

  it('vitals rules', () => {
    const v = live().vitals;
    const a = run(page(HEAD), {
      live: live({ vitals: { ...v, lcp: 4200, cls: 0.2, inp: 350, ttfb: 1200 } }),
    });
    expect(a.issues.map((i) => i.id)).toEqual(['LCP_SLOW', 'CLS_HIGH', 'INP_SLOW', 'TTFB_SLOW']);
  });

  it('image findings', () => {
    const f = imageFindings(
      [
        img({ file: 'hero.jpg', aboveFold: true, loading: 'lazy' }),
        img({ file: 'big.jpg', bytes: 400_000 }),
        img({ file: 'nosize.jpg', sized: false }),
        img({ file: 'old.png', type: 'image/png', bytes: 80_000 }),
        img({ file: 'small-old.png', type: 'image/png', bytes: 2_000 }),
        img({ file: 'thumb.jpg', naturalWidth: 1600, width: 200 }),
        img({ file: 'hidden.jpg', width: 0, height: 0, loading: 'lazy', aboveFold: true }),
      ],
      2,
    );
    const names = (l: LiveImage[]) => l.map((i) => i.file);
    expect(names(f.lazyTop)).toEqual(['hero.jpg']);
    expect(names(f.heavy)).toEqual(['big.jpg']);
    expect(names(f.unsized)).toEqual(['nosize.jpg']);
    expect(names(f.legacy)).toEqual(['old.png']);
    expect(names(f.oversized)).toEqual(['thumb.jpg']);
  });

  it('NO_HTTPS, MIXED_CONTENT and NO_COMPRESSION', () => {
    expect(ids(page(HEAD), { url: 'http://shop.example.com/p/one' })).toContain('NO_HTTPS');
    expect(ids(page(HEAD), { url: 'http://localhost:4321/p/one' })).not.toContain('NO_HTTPS');
    expect(ids(page(HEAD, '<h1>x</h1><img src="http://cdn.example.com/a.jpg" alt="a">'))).toContain(
      'MIXED_CONTENT',
    );
    const html = page(HEAD, '<h1>x</h1><p>' + 'word '.repeat(800) + '</p>');
    const raw = (enc: string | null) => ({
      status: 200,
      contentType: 'text/html',
      text: html,
      xRobotsTag: null,
      headers: { contentEncoding: enc, cacheControl: null, hsts: null },
    });
    expect(ids(html, { raw: raw(null) })).toContain('NO_COMPRESSION');
    expect(ids(html, { raw: raw('br') })).not.toContain('NO_COMPRESSION');
  });

  it('viewport and mobile layout', () => {
    expect(ids(page(HEAD.replace(VIEWPORT, '')))).toEqual(['VIEWPORT_MISSING']);
    expect(zoomBlocked('width=device-width, user-scalable=no')).toBe(true);
    expect(zoomBlocked('width=device-width, maximum-scale=1')).toBe(true);
    expect(zoomBlocked('width=device-width, initial-scale=1')).toBe(false);
    const m = live().mobile;
    const a = run(page(HEAD), {
      live: live({
        mobile: { ...m, overflow: 120, smallText: 8, textBlocks: 20, smallTargets: 4 },
      }),
    });
    expect(a.issues.map((i) => i.id)).toEqual(['H_SCROLL', 'SMALL_TEXT', 'TAP_SMALL']);
  });
});
