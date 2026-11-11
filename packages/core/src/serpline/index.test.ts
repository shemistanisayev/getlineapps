// @vitest-environment happy-dom
/**
 * The Lumo scenario through the whole core (SPEC Phase 3 "done when"): the recorded fixture gives
 * the design's issues and score 56 after the link check (62 before it, PLAN decision 4).
 * Re-record with scripts/record-serpline-fixture.ts after changing apps/fixture/public/serpline.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { analyze, needsJsPercent, TOOL, type AnalyzeInput, type LinkResult } from './index.ts';

// happy-dom replaces URL, so build the path with node:path.
const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/serpline');
const fx = (name: string) => readFileSync(join(DIR, name), 'utf8');

const URL_ = 'http://example.com/products/wireless-headphones-pro-x';
const input: AnalyzeInput = {
  url: URL_,
  renderedHtml: fx('lumo-rendered.html'),
  raw: {
    status: 200,
    contentType: 'text/html; charset=utf-8',
    text: fx('lumo-raw.html'),
    xRobotsTag: null,
  },
  robots: { status: 200, text: fx('lumo-robots.txt'), contentType: 'text/plain' },
  llms: { status: 404, text: 'Not found', contentType: 'text/plain' },
};
const linkResults = JSON.parse(fx('lumo-links.json')) as LinkResult[];

describe('serpline core: Lumo scenario', () => {
  it('is the serpline tool', () => expect(TOOL).toBe('serpline'));

  it('gives the design issues and score 56 after the link check', () => {
    const a = analyze({ ...input, linkResults });
    expect(a.issues.map((i) => `${i.severity} ${i.id}`)).toEqual([
      'high RAW_H1',
      'high RAW_TEXT',
      'medium SCHEMA_JS',
      'medium DESC_LONG',
      'medium IMG_ALT',
      'medium OG_DESC',
      'medium BROKEN_LINK',
      'medium AI_SEARCH_BLOCKED',
      'low HEADING_SKIP',
      'low REDIRECT_LINKS',
    ]);
    expect(a.counts).toEqual({ high: 2, medium: 6, low: 2 });
    expect(a.score).toBe(56);
    expect(a.label).toBe('needs_work');
    // Tab badges as in PanelHeader: Headings 2, Links 2, Render 3, AI 1.
    expect(a.byTab).toMatchObject({ headings: 2, links: 2, render: 3, ai: 1 });
  });

  it('gives 62 before the link check (link issues count only after it)', () => {
    const a = analyze(input);
    expect(a.counts).toEqual({ high: 2, medium: 5, low: 1 });
    expect(a.score).toBe(62);
    expect(a.linkCheck).toBeNull();
    expect(a.byTab.links).toBe(0);
  });

  it('issue numbers match the design copy', () => {
    const a = analyze({ ...input, linkResults });
    const p = Object.fromEntries(a.issues.map((i) => [i.id, i.params]));
    expect(p.RAW_TEXT).toEqual({ percent: 91, raw: 38, rendered: 412 });
    expect(p.SCHEMA_JS).toMatchObject({ type: 'Product' });
    expect(p.DESC_LONG).toEqual({ length: 191, desktop: 147, mobile: 107 });
    expect(p.IMG_ALT).toEqual({
      count: 3,
      total: 9,
      files: 'pro-x-side.jpg, pro-x-folded.jpg, pro-x-case.jpg',
    });
    expect(p.BROKEN_LINK).toMatchObject({
      count: 1,
      text: 'Earbuds Mini',
      href: '/products/earbuds-mini-old',
      status: 404,
    });
    expect(p.AI_SEARCH_BLOCKED).toEqual({ bot: 'PerplexityBot', count: 1, more: 0 });
    expect(p.HEADING_SKIP).toMatchObject({ from: 2, to: 4, text: 'Bluetooth 5.3', fix: 3 });
    expect(p.REDIRECT_LINKS).toEqual({
      count: 2,
      targets: '/electronics/headphones, /help/returns',
    });
  });

  it('Render: 38 vs 412 words, table and "Added by JavaScript"', () => {
    const a = analyze(input);
    const d = a.diff!;
    expect([d.rawWords, d.renderedWords, needsJsPercent(d)]).toEqual([38, 412, 91]);
    expect(Object.fromEntries(d.signals.map((s) => [s.id, s.state]))).toEqual({
      title: 'same',
      description: 'same',
      canonical: 'same',
      robots: 'same',
      h1: 'raw_missing',
      words: 'changed',
      links: 'changed',
      jsonld: 'changed',
    });
    expect(d.signals.find((s) => s.id === 'links')).toMatchObject({ raw: 18, rendered: 64 });
    expect(d.signals.find((s) => s.id === 'jsonld')).toMatchObject({
      raw: ['BreadcrumbList'],
      rendered: ['BreadcrumbList', 'Product'],
    });
    expect(d.added.map((x) => x.kind)).toEqual([
      'heading',
      'schema',
      'sectionWords',
      'sectionLinks',
    ]);
    expect(d.added[0]).toMatchObject({ level: 1, text: 'Wireless Headphones Pro X' });
    expect(d.added[2]).toMatchObject({ id: 'details' });
    expect(d.added[3]).toMatchObject({ id: 'reviews', links: 20 });
  });

  it('Headings: tiles 1 / 4 / 5 / 1 and the outline order', () => {
    const { headings } = analyze(input).rendered;
    const count = (l: number) => headings.filter((h) => h.level === l).length;
    expect([1, 2, 3, 4].map(count)).toEqual([1, 4, 5, 1]);
    expect(headings.map((h) => `H${h.level} ${h.text}`)).toEqual([
      'H1 Wireless Headphones Pro X',
      'H2 Product details',
      'H3 Noise cancelling',
      'H3 Battery and charging',
      'H2 Specifications',
      'H4 Bluetooth 5.3',
      'H2 Reviews (128)',
      'H3 Great sound for the price',
      'H3 Comfortable on long flights',
      'H2 You may also like',
      'H3 Earbuds Mini',
    ]);
  });

  it('Links: 64 = 52 internal + 9 external + 3 others; 49 OK, 2 redirects, 1 broken', () => {
    const a = analyze({ ...input, linkResults });
    expect(a.links).toEqual({ total: 64, internal: 52, external: 9, nofollow: 3 });
    expect(a.linkCheck).toMatchObject({ checked: 52, ok: 49, redirects: 2, broken: 1, failed: 0 });
    const issues = a.linkCheck!.links.filter((l) => l.state === 'broken' || l.state === 'redirect');
    expect(issues.map((l) => [l.text, new URL(l.href).pathname, l.state, l.target])).toEqual([
      ['Headphones', '/headphones', 'redirect', '/electronics/headphones'],
      ['Free returns', '/returns', 'redirect', '/help/returns'],
      ['Earbuds Mini', '/products/earbuds-mini-old', 'broken', null],
    ]);
  });

  it('Summary: on-page checks and the Google preview', () => {
    const a = analyze(input);
    expect(a.rendered).toMatchObject({
      title: 'Wireless Headphones Pro X | Lumo',
      canonical: URL_,
      robots: 'index, follow',
      lang: 'en',
      hreflang: [],
    });
    expect(a.rendered.og.description).toBeNull();
    expect(a.serp.siteName).toBe('Lumo');
    expect(a.serp.urlLine).toBe('http://example.com › products › wireless-headphones-pro-x');
    expect(a.serp.title).toMatchObject({ length: 32, px: 318, cut: false });
    expect(a.serp.description!.mobile).toMatchObject({ length: 191, cut: true, cutAfter: 107 });
    expect(a.serp.description!.mobile.shown).toBe(
      'Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once ...',
    );
  });

  it('AI: 10 of 13 allowed, robots.txt 38 lines with a sitemap, no llms.txt', () => {
    const a = analyze(input);
    expect(a.botsAllowed).toBe(10);
    expect(a.bots).toHaveLength(13);
    expect(a.bots.filter((b) => b.state === 'blocked').map((b) => b.userAgent)).toEqual([
      'PerplexityBot',
      'CCBot',
      'Bytespider',
    ]);
    expect(a.bots.find((b) => b.userAgent === 'PerplexityBot')!.rule).toBe(
      'User-agent: PerplexityBot  Disallow: /',
    );
    expect(a.bots.find((b) => b.userAgent === 'OAI-SearchBot')!.state).toBe('allowed');
    expect(a.bots.find((b) => b.userAgent === 'Claude-SearchBot')!.state).toBe('allowed_default');
    expect(a.robots).toEqual({
      status: 200,
      found: true,
      lineCount: 38,
      sitemaps: ['http://example.com/sitemap.xml'],
    });
    expect(a.llms).toBe('not_found');
  });
});
