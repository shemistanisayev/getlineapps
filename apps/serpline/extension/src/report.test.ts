/** Audit PDF from the Lumo fixture against design/serpline/Report.dc.html (SPEC §6). */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, type LinkResult } from '@line/core/serpline';
import { buildLineReport } from '@line/report';
import { loadReportFontsNode } from '@line/report/node';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { translator } from './i18n/index.ts';
import { dateLabel, serplineReport } from './report.ts';

const here = dirname(fileURLToPath(import.meta.url));
const FX = join(here, '../../../../packages/core/fixtures/serpline');
const fx = (n: string) => readFileSync(join(FX, n), 'utf8');

// Node environment (the font loader needs real file URLs); happy-dom only provides DOMParser.
const win = new Window({
  settings: {
    disableCSSFileLoading: true,
    disableJavaScriptFileLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
  },
});
(globalThis as unknown as { DOMParser: unknown }).DOMParser = win.DOMParser;

const audit = analyze({
  url: 'http://example.com/products/wireless-headphones-pro-x',
  renderedHtml: fx('lumo-rendered.html'),
  raw: { status: 200, contentType: 'text/html', text: fx('lumo-raw.html'), xRobotsTag: null },
  robots: { status: 200, text: fx('lumo-robots.txt'), contentType: 'text/plain' },
  llms: { status: 404, text: '', contentType: 'text/plain' },
  linkResults: JSON.parse(fx('lumo-links.json')) as LinkResult[],
});
const fonts = loadReportFontsNode();
const now = new Date(2026, 10, 7, 10, 42);

describe('serpline audit PDF', () => {
  it('formats the date like the Report artboard', () => {
    expect(dateLabel(now, 'en')).toBe('Nov 7, 2026, 10:42');
  });

  it('has the Report artboard tiles, page table and issues', () => {
    const cfg = serplineReport(audit, translator('en'), 'en', fonts, now);
    expect([cfg.eyebrow, cfg.host, cfg.subline]).toEqual([
      'SEO and AI search audit',
      'example.com',
      'Page checked: /products/wireless-headphones-pro-x',
    ]);
    expect(cfg.tiles.map((x) => [x.value, x.suffix ?? '', x.label])).toEqual([
      [56, '/100', 'SEO score'],
      [2, '', 'high priority'],
      [6, '', 'medium priority'],
      [2, '', 'low priority'],
    ]);
    expect(cfg.keyValue.rows).toEqual([
      { k: 'Title', v: 'Wireless Headphones Pro X | Lumo (32 characters)' },
      { k: 'Description', v: '191 characters, Google cuts it after 107 on mobile' },
      { k: 'Canonical and robots', v: 'Points to this page, index, follow' },
      {
        k: 'Raw HTML vs rendered',
        v: '38 of 412 words in raw HTML, H1 and Product schema added by JavaScript',
      },
      { k: 'Links', v: '64 links, 52 internal checked: 1 broken, 2 redirects' },
      {
        k: 'AI bots',
        v: '10 of 13 allowed. PerplexityBot, CCBot and Bytespider blocked. No llms.txt',
      },
    ]);
    expect(cfg.severity.items.map((i) => [i.level, i.lead, i.text])).toEqual([
      ['high', 'The H1 appears only after JavaScript.', 'Render the H1 in the server HTML.'],
      [
        'high',
        '91% of the text needs JavaScript.',
        'Most AI crawlers see 38 words. Server-render the main content.',
      ],
      ['medium', 'Product schema is added by JavaScript.', 'Put the JSON-LD in the server HTML.'],
      [
        'medium',
        'The description is cut off in Google.',
        'Keep it under 150 characters, key point first.',
      ],
      ['medium', '3 images have no alt text.', 'Describe each photo in a few words.'],
      ['medium', 'og:description is missing.', 'Shares on social and chat apps show no summary.'],
      ['medium', 'A link leads to a 404.', '"Earbuds Mini" points to /products/earbuds-mini-old.'],
      [
        'medium',
        'PerplexityBot is blocked in robots.txt.',
        'Remove the rule if you want Perplexity to cite the site.',
      ],
      ['low', 'An H4 follows an H2.', 'Make "Bluetooth 5.3" an H3.'],
      [
        'low',
        '2 links point to redirects.',
        'Link to /electronics/headphones and /help/returns directly.',
      ],
    ]);
    expect(cfg.cta.href).toBe(
      'https://shamistanisayev.com/?utm_source=serpline&utm_medium=extension&utm_campaign=pdf_footer',
    );
  });

  it('builds a one-page A4 PDF with selectable text and the right file name', async () => {
    const report = await buildLineReport(serplineReport(audit, translator('en'), 'en', fonts, now));
    expect(report.fileName).toBe('serpline-audit-example.com-2026-11-07.pdf');
    expect(report.pages).toBe(1);
    expect(Buffer.from(report.bytes.subarray(0, 5)).toString()).toBe('%PDF-');
    const text = report.layout.map((l) => l.text).join('\n');
    for (const s of [
      '56',
      '/100',
      'Made with Serpline. The page was read in your browser and nothing was sent anywhere.',
      'Page 1 of 1',
      'Need help fixing these issues?',
    ])
      expect(text).toContain(s);
    // For a look at the result: test-results/serpline-audit-sample.pdf (not committed).
    const out = join(here, '../../../../test-results');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'serpline-audit-sample.pdf'), report.bytes);
  });

  it('follows the language: Azerbaijani labels and fixes', () => {
    const cfg = serplineReport(audit, translator('az'), 'az', fonts, now);
    expect(cfg.eyebrow).toBe('SEO və AI axtarış auditi');
    expect(cfg.keyValue.rows[5]!.v).toBe(
      '13 botdan 10-nə icazə var. PerplexityBot, CCBot və Bytespider bloklanıb. llms.txt yoxdur',
    );
    expect(cfg.severity.items[9]!.text).toBe(
      'Birbaşa /electronics/headphones və /help/returns ünvanlarına link ver.',
    );
  });
});
