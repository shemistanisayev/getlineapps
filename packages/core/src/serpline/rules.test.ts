// @vitest-environment happy-dom
/** Extractors and every issue rule on small pages (SPEC §4.1, §4.5). */
import { describe, expect, it } from 'vitest';
import { analyze, type AnalyzeInput } from './analyze.ts';
import { extractHtml } from './extract.ts';
import { score, scoreLabel, makeIssue } from './issues.ts';
import { planLinkCheck } from './links.ts';

const URL_ = 'https://shop.example.com/p/one';
const page = (head: string, body: string) =>
  `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
const GOOD_HEAD =
  '<title>One | Shop</title><meta name="description" content="A short description."><meta property="og:description" content="x"><link rel="canonical" href="/p/one">';

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

describe('extract', () => {
  it('reads meta, canonical (absolute), hreflang, Open Graph and alt states', () => {
    const f = extractHtml(
      page(
        '<title> A  title </title><meta name="Description" content="D"><meta name="robots" content="noindex"><link rel="canonical" href="/c"><link rel="alternate" hreflang="az" href="/az/p"><meta property="og:title" content="T"><meta name="twitter:card" content="summary">',
        '<img src="/a.jpg" alt="A"><img src="/b.jpg" alt=""><img src="/i/c.jpg">',
      ),
      URL_,
    );
    expect(f).toMatchObject({
      title: 'A title',
      description: 'D',
      robots: 'noindex',
      canonical: 'https://shop.example.com/c',
      hreflang: [{ lang: 'az', href: 'https://shop.example.com/az/p' }],
      twitterCard: 'summary',
    });
    expect(f.og.title).toBe('T');
    expect(f.images.map((i) => [i.file, i.alt])).toEqual([
      ['a.jpg', 'present'],
      ['b.jpg', 'empty'],
      ['c.jpg', 'missing'],
    ]);
  });

  it('classifies links by registrable domain and reads rel flags', () => {
    const f = extractHtml(
      page(
        '',
        '<a href="/x">X</a><a href="https://blog.example.com/y">Y</a><a href="https://other.org" rel="nofollow sponsored">O</a><a href="#top">Top</a><a href="mailto:a@b.c">M</a><a href="/z"><img src="/z.png" alt="Zed"></a><a href="/e"></a>',
      ),
      URL_,
    );
    expect(f.links.map((l) => [l.kind, l.text])).toEqual([
      ['internal', 'X'],
      ['internal', 'Y'],
      ['external', 'O'],
      ['other', 'Top'],
      ['other', 'M'],
      ['internal', 'Zed'],
      ['internal', ''],
    ]);
    expect(f.links[2]).toMatchObject({ nofollow: true, sponsored: true, ugc: false });
    expect(f.links[6]!.emptyText).toBe(true);
    // Only same-origin URLs are requested (no host permission), each once.
    expect(planLinkCheck(f)).toEqual([
      'https://shop.example.com/x',
      'https://shop.example.com/z',
      'https://shop.example.com/e',
    ]);
  });

  it('collects JSON-LD types (also in @graph) and counts parse errors', () => {
    const f = extractHtml(
      page(
        '<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":["WebSite","Thing"]}]}</script><script type="application/ld+json">{oops</script>',
        '',
      ),
      URL_,
    );
    expect(f.jsonLd).toEqual({ blocks: 2, types: ['Organization', 'WebSite', 'Thing'], errors: 1 });
  });

  it('counts words of visible text only', () => {
    const f = extractHtml(
      page(
        '',
        '<p>One two</p><script>var a = "no words here"</script><style>p{}</style><noscript>hidden text</noscript><p>three / 4</p>',
      ),
      URL_,
    );
    expect(f.words).toBe(4);
  });
});

describe('issue rules', () => {
  it('a clean page has no issues and scores 100', () => {
    const a = run(page(GOOD_HEAD, '<h1>One</h1><h2>Two</h2><p>Text</p>'));
    expect(a.issues).toEqual([]);
    expect([a.score, a.label]).toEqual([100, 'good']);
  });

  it('NO_TITLE, DESC_MISSING, OG_DESC', () => {
    expect(ids(page('', '<h1>x</h1>'))).toEqual(['NO_TITLE', 'DESC_MISSING', 'OG_DESC']);
  });

  it('NOINDEX from the meta tag or the X-Robots-Tag header', () => {
    expect(
      ids(page(GOOD_HEAD + '<meta name="robots" content="noindex, follow">', '<h1>x</h1>')),
    ).toContain('NOINDEX');
    const html = page(GOOD_HEAD, '<h1>x</h1>');
    const a = run(html, {
      raw: { status: 200, contentType: 'text/html', text: html, xRobotsTag: 'googlebot: noindex' },
    });
    expect(a.issues[0]).toMatchObject({ id: 'NOINDEX', params: { source: 'header' } });
    expect(
      ids(page(GOOD_HEAD + '<meta name="robots" content="index, follow">', '<h1>x</h1>')),
    ).toEqual([]);
  });

  it('CANONICAL_OTHER ignores a trailing slash and the hash', () => {
    expect(ids(page(GOOD_HEAD.replace('/p/one', '/p/one/#a'), '<h1>x</h1>'))).toEqual([]);
    expect(ids(page(GOOD_HEAD.replace('/p/one', '/p/two'), '<h1>x</h1>'))).toEqual([
      'CANONICAL_OTHER',
    ]);
  });

  it('H1_MULTI and HEADING_SKIP', () => {
    expect(ids(page(GOOD_HEAD, '<h1>a</h1><h1>b</h1><h2>c</h2><h4>d</h4>'))).toEqual([
      'H1_MULTI',
      'HEADING_SKIP',
    ]);
  });

  it('TITLE_LONG and DESC_LONG', () => {
    const head = GOOD_HEAD.replace('One | Shop', 'W'.repeat(40)).replace(
      'A short description.',
      'word '.repeat(60),
    );
    expect(ids(page(head, '<h1>x</h1>'))).toEqual(['DESC_LONG', 'TITLE_LONG']);
  });

  it('RAW_H1, RAW_TEXT and SCHEMA_JS need the raw HTML; none without it', () => {
    const rendered = page(
      GOOD_HEAD + '<script type="application/ld+json">{"@type":"Product"}</script>',
      '<h1>Big</h1><p>' + 'word '.repeat(40) + '</p>',
    );
    const raw = page(GOOD_HEAD, '<p>word word</p>');
    const a = analyze({
      url: URL_,
      renderedHtml: rendered,
      raw: { status: 200, contentType: 'text/html', text: raw, xRobotsTag: null },
      robots: null,
      llms: null,
    });
    expect(a.issues.map((i) => i.id)).toEqual(['RAW_H1', 'RAW_TEXT', 'SCHEMA_JS']);
    const b = analyze({ url: URL_, renderedHtml: rendered, raw: null, robots: null, llms: null });
    expect(b.issues).toEqual([]);
    expect(b.diff).toBeNull();
  });

  it('AI_SEARCH_BLOCKED for search bots only (training bots are a business choice)', () => {
    const html = page(GOOD_HEAD, '<h1>x</h1>');
    const robots = (text: string) => ({ status: 200, text, contentType: 'text/plain' });
    expect(
      ids(html, { robots: robots('User-agent: GPTBot\nUser-agent: CCBot\nDisallow: /\n') }),
    ).toEqual([]);
    const a = run(html, {
      robots: robots('User-agent: PerplexityBot\nUser-agent: OAI-SearchBot\nDisallow: /\n'),
    });
    expect(a.issues[0]).toMatchObject({
      id: 'AI_SEARCH_BLOCKED',
      params: { bot: 'OAI-SearchBot', count: 2, more: 1 },
    });
  });

  it('link rules use the check results; failed requests are not broken', () => {
    const html = page(
      GOOD_HEAD,
      '<h1>x</h1><a href="/gone">Gone</a><a href="/moved">Moved</a><a href="/slow">Slow</a>',
    );
    const a = run(html, {
      linkResults: [
        {
          url: 'https://shop.example.com/gone',
          status: 410,
          redirected: false,
          finalUrl: 'https://shop.example.com/gone',
        },
        {
          url: 'https://shop.example.com/moved',
          status: 200,
          redirected: true,
          finalUrl: 'https://shop.example.com/new',
        },
        {
          url: 'https://shop.example.com/slow',
          status: 0,
          redirected: false,
          finalUrl: 'https://shop.example.com/slow',
        },
      ],
    });
    expect(a.issues.map((i) => i.id)).toEqual(['BROKEN_LINK', 'REDIRECT_LINKS']);
    expect(a.linkCheck).toMatchObject({ checked: 3, ok: 0, redirects: 1, broken: 1, failed: 1 });
  });

  it('score: 100 - 8 x High - 4 x Medium - 2 x Low, minimum 0, with labels', () => {
    const many = Array.from({ length: 13 }, () => makeIssue('RAW_H1'));
    expect(score(many)).toBe(0);
    expect(score([makeIssue('RAW_H1'), makeIssue('OG_DESC'), makeIssue('TITLE_LONG')])).toBe(86);
    expect([90, 89, 50, 49].map(scoreLabel)).toEqual(['good', 'needs_work', 'needs_work', 'poor']);
  });
});
