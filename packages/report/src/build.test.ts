import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { buildLineReport, reportFileName } from './build.ts';
import { loadReportFontsNode } from './fonts-node.ts';
import { hitlineSample, rivalineSample } from './samples.ts';

const fonts = loadReportFontsNode();

describe('buildLineReport', () => {
  it('builds the Hitline audit on one A4 page', async () => {
    const r = await buildLineReport(hitlineSample(fonts));
    expect(r.fileName).toBe('hitline-audit-example.com-2026-11-06.pdf');
    expect(r.pages).toBe(1);
    const doc = await PDFDocument.load(r.bytes);
    const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
    expect(Math.round(w)).toBe(596);
    expect(Math.round(h)).toBe(842);
    const texts = r.layout.map((l) => l.text).join('|');
    expect(texts).toContain('TRACKING AUDIT');
    expect(texts).toContain('Made with Hitline. No data left the browser.');
    expect(texts).toContain('Page 1 of 1');
  });

  it('builds tables with real page data: code ligatures, emoji, long rows', async () => {
    const cfg = hitlineSample(fonts);
    cfg.extras = [
      {
        type: 'table',
        title: 'Events',
        columns: [
          { label: 'Event', width: 0.4, mono: true },
          { label: 'Parameters', width: 0.6, mono: true },
        ],
        // Seen on irshad.az: JetBrains Mono code ligatures in "-data-layer-" crashed fontkit.
        rows: Array.from({ length: 60 }, (_, i) => [
          `__ym.ec2.begin_checkout.ga4-data-layer-begin-checkout.id,${i}`,
          'page_title=Sifariş 🛒 -> != === <= ✓ 中文',
        ]),
      },
    ];
    const r = await buildLineReport(cfg);
    expect(r.pages).toBeGreaterThan(1);
    const texts = r.layout.map((l) => l.text).join('|');
    expect(texts).toContain('-data-layer-');
    expect(texts).toContain('Sifariş ? ->');
  });

  // Hitline's layout must stay identical when the builder changes for other tools.
  it('keeps the Hitline text layer and positions (snapshot)', async () => {
    const r = await buildLineReport(hitlineSample(fonts));
    expect(r.layout).toMatchSnapshot();
  });

  it('builds the Rivaline report with the side-by-side sections (snapshot)', async () => {
    const r = await buildLineReport(rivalineSample(fonts));
    expect(r.pages).toBe(1);
    expect(r.fileName).toBe('rivaline-report-example.com-2026-11-07.pdf');
    expect(r.layout).toMatchSnapshot();
  });

  it('goes multi-page with many issues and numbers every page', async () => {
    const cfg = hitlineSample(fonts);
    const one = cfg.severity.items[0]!;
    cfg.severity.items = Array.from({ length: 60 }, (_, i) => ({
      ...one,
      lead: `Issue ${i + 1}.`,
    }));
    const r = await buildLineReport(cfg);
    expect(r.pages).toBeGreaterThan(1);
    const labels = r.layout.filter((l) => l.text.startsWith('Page ')).map((l) => l.text);
    expect(labels).toEqual(
      Array.from({ length: r.pages }, (_, i) => `Page ${i + 1} of ${r.pages}`),
    );
    // Nothing is drawn below the footer line.
    expect(Math.max(...r.layout.map((l) => l.y))).toBeLessThan(1123 - 48 + 1);
    expect((await PDFDocument.load(r.bytes)).getPageCount()).toBe(r.pages);
  });

  it('handles Azerbaijani text', async () => {
    const cfg = hitlineSample(fonts);
    cfg.eyebrow = 'İzləmə auditi';
    cfg.subline = 'Yoxlanılan səhifələr: məhsul, səbət, ödəniş';
    cfg.footer = 'Hitline ilə hazırlanıb. Heç bir məlumat brauzerdən çıxmadı.';
    const r = await buildLineReport(cfg);
    expect(r.layout.some((l) => l.text.includes('səhifələr'))).toBe(true);
  });
});

describe('reportFileName', () => {
  it('keeps the host readable and safe', () => {
    expect(reportFileName('foldline-audit', 'shop.example.com', new Date(2026, 0, 2))).toBe(
      'foldline-audit-shop.example.com-2026-01-02.pdf',
    );
    expect(reportFileName('x', 'a b/c', new Date(2026, 0, 2))).toBe('x-a-b-c-2026-01-02.pdf');
  });
});
