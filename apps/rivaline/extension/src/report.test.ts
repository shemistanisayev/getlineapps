/** Competitor report PDF from the Kova fixture against design/rivaline/Report.dc.html (SPEC §8). */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeStack,
  brandDomain,
  brandKit,
  brandName,
  libraryLinks,
  type BrandRaw,
  type PageSnapshot,
} from '@line/core/rivaline';
import { buildLineReport } from '@line/report';
import { loadReportFontsNode } from '@line/report/node';
import { describe, expect, it } from 'vitest';
import { translator } from './i18n/index.ts';
import { dateLabel, rivalineReport, type ReportInput } from './report.ts';

const here = dirname(fileURLToPath(import.meta.url));
const FX = join(here, '../../../../packages/core/fixtures/rivaline');
const load = <T>(n: string) => JSON.parse(readFileSync(join(FX, `${n}.json`), 'utf8')) as T;

const snap = load<PageSnapshot>('kova-snapshot');
const stack = analyzeStack(snap);
const kit = brandKit(load<BrandRaw>('kova-brand'));
const input: ReportInput = {
  url: snap.url,
  stack,
  brand: kit,
  searchBrand: brandName(snap),
  links: libraryLinks({ brand: brandName(snap), domain: brandDomain(snap.url) }, stack.tools),
};
const fonts = loadReportFontsNode();
const now = new Date(2026, 10, 7, 11, 52);

describe('rivaline competitor report', () => {
  it('formats the date like the Report artboard', () => {
    expect(dateLabel(now, 'en')).toBe('Nov 7, 2026, 11:52');
  });

  it('has the Report artboard header, tiles, stack table and gaps', () => {
    const cfg = rivalineReport(input, translator('en'), 'en', fonts, now);
    expect([cfg.eyebrow, cfg.host, cfg.subline]).toEqual([
      'Competitor report',
      'example.com',
      'Page read: home page. Brand name used for ad searches: Kova',
    ]);
    expect(cfg.tiles.map((x) => [x.value, x.label, x.tone ?? ''])).toEqual([
      [13, 'tools', ''],
      [8, 'categories', ''],
      [4, 'ad pixels', ''],
      [3, 'gaps', 'warning'],
    ]);
    expect(cfg.keyValue.title).toBe('Stack');
    expect(cfg.keyValue.rows.map((r) => r.k)).toEqual([
      'Advertising',
      'Analytics',
      'Tag management',
      'Email and push',
      'Chat',
      'E-commerce',
      'Reviews',
      'Payments',
    ]);
    // SPEC §8: tool names with their IDs in brackets.
    expect(cfg.keyValue.rows[0]!.v).toBe(
      'Meta Pixel (418273650912345), TikTok Pixel (C9H3KQ7RC77U2M0V5PLG), Google Ads (AW-11284956), Pinterest Tag (2612345678901)',
    );
    expect(cfg.keyValue.rows[2]!.v).toBe('Google Tag Manager (GTM-N4KV8R)');
    expect(cfg.keyValue.rows[7]!.v).toBe('Klarna, PayPal');
    expect(cfg.severity.items).toEqual([
      {
        level: 'high',
        lead: 'No server-side tracking.',
        text: 'All 4 ad pixels send from the browser, so blocked requests never reach the ad platforms.',
      },
      {
        level: 'high',
        lead: 'No consent banner.',
        text: 'Ad pixels load for every visitor before any choice is made.',
      },
      {
        level: 'medium',
        lead: 'No CRM on the site.',
        text: 'Mailchimp collects emails, but chat and form leads are not tied to one customer record.',
      },
    ]);
  });

  it('puts the brand kit and the ad libraries side by side, with real links', () => {
    const cfg = rivalineReport(input, translator('en'), 'en', fonts, now);
    expect(cfg.extras).toHaveLength(1);
    const cols = cfg.extras![0]!;
    if (cols.type !== 'columns') throw new Error('columns expected');
    const [brand, libs] = cols.columns;
    expect(brand).toEqual({
      type: 'swatches',
      title: 'Brand kit',
      colors: ['#2F5D46', '#1E2B24', '#F6F1EA', '#EBC56B', '#DCE5D8'],
      note: 'Fraunces 600 for headings, DM Sans 400 for body. Main button #2F5D46, fully rounded.',
    });
    if (libs.type !== 'links') throw new Error('links expected');
    expect(libs.rows.map((r) => [r.label, r.linkText])).toEqual([
      ['Meta Ad Library', 'Kova'],
      ['Google Ads Transparency Center', 'example.com'],
      ['TikTok Ad Library', 'Kova'],
      ['LinkedIn Ad Library', 'Kova'],
    ]);
    expect(libs.rows[1]!.href).toBe(
      'https://adstransparency.google.com/?region=anywhere&domain=example.com',
    );
    expect(cfg.cta.href).toBe(
      'https://shamistanisayev.com/?utm_source=rivaline&utm_medium=extension&utm_campaign=pdf_footer',
    );
  });

  it('builds one A4 page named rivaline-report-<host>-<date>.pdf, EN and AZ', async () => {
    for (const lang of ['en', 'az'] as const) {
      const report = await buildLineReport(
        rivalineReport(input, translator(lang), lang, fonts, now),
      );
      expect(report.fileName).toBe('rivaline-report-example.com-2026-11-07.pdf');
      expect(report.pages).toBe(1);
      const text = report.layout.map((l) => l.text).join(' ');
      expect(text).toContain(lang === 'en' ? 'Gaps and opportunities' : 'Boşluqlar və imkanlar');
      expect(text).toContain(
        lang === 'en'
          ? 'Made with Rivaline. No data left the browser.'
          : 'Rivaline ilə hazırlanıb.',
      );
      if (process.env.REPORT_OUT) {
        mkdirSync(process.env.REPORT_OUT, { recursive: true });
        writeFileSync(join(process.env.REPORT_OUT, `rivaline-report-${lang}.pdf`), report.bytes);
      }
    }
  });

  it('a page without tools still makes a report', async () => {
    const empty = analyzeStack(load<PageSnapshot>('mira-snapshot'));
    const cfg = rivalineReport(
      {
        url: 'http://example.org/',
        stack: empty,
        brand: null,
        searchBrand: 'Mira Studio',
        links: [],
      },
      translator('en'),
      'en',
      fonts,
      now,
    );
    expect(cfg.keyValue.rows).toEqual([{ k: 'Tools', v: 'No marketing tools found on this page' }]);
    expect(cfg.severity.items.map((i) => i.lead)).toEqual(['No analytics.']);
    expect((await buildLineReport(cfg)).pages).toBe(1);
  });
});
