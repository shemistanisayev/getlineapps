import { describe, expect, it } from 'vitest';
import { buildLineReport } from '@line/report';
import { loadReportFontsNode } from '@line/report/node';
import { lumoSession } from '../../../../packages/core/fixtures/hitline/load.ts';
import { LUMO_PLAN_CSV } from '../../../../packages/core/fixtures/hitline/lumo.ts';
import { analyze, analyzePopup, parsePlanCsv, type Audit } from '@line/core/hitline';
import { translator } from './i18n/index.ts';
import { dateLabel, hitlineReport, hitlineSummaryReport } from './report.ts';

const fonts = loadReportFontsNode();
const parsed = parsePlanCsv(LUMO_PLAN_CSV, 'lumo-tracking-plan.csv');
if (!parsed.ok) throw new Error('plan');
const plan = parsed.plan;
const now = new Date(2026, 10, 6, 10, 43);

/** The three Lumo runs as one audit, like the Report artboard (issues from all three). */
function lumoAudit(): Audit {
  const events = analyze(lumoSession('events'), { plan });
  const consent = analyze(lumoSession('consent'), { plan });
  const journey = analyze(lumoSession('journey'), { plan });
  return {
    ...events,
    issues: [
      ...consent.issues.filter((i) => i.tab === 'consent'),
      ...journey.issues.filter((i) => i.tab === 'attribution'),
      ...events.issues,
    ],
    attribution: journey.attribution,
    consent: { ...consent.consent },
  };
}

const text = (layout: { text: string }[]) => layout.map((l) => l.text).join('\n');

describe('hitline audit PDF', () => {
  it('formats the date per language', () => {
    expect(dateLabel(now, 'en')).toBe('Nov 6, 2026, 10:43');
    expect(dateLabel(now, 'az')).toMatch(/2026/);
  });

  it('full audit: tiles, setup and the Report artboard issues', async () => {
    const t = translator('en');
    const cfg = hitlineReport(lumoAudit(), t, 'en', fonts, now);
    expect(cfg.host).toBe('example.com');
    expect(cfg.subline).toBe(
      'Pages checked: landing page, product, cart, payment and order confirmation',
    );
    expect(cfg.tiles.map((x) => [x.value, x.label])).toEqual([
      [4, 'platforms'],
      [14, 'events'],
      [3, 'high priority'],
      [3, 'medium priority'],
    ]);
    expect(cfg.keyValue.rows).toEqual([
      { k: 'GTM', v: 'GTM-K7P2QX, 8 tags' },
      { k: 'Server-side', v: 'GA4 through data.example.com, Meta and TikTok from the browser' },
      { k: 'Consent Mode v2', v: 'Correct on Google tags, missing on Meta and TikTok' },
      { k: 'Tracking plan', v: '4 of 8 events match' },
    ]);
    expect(cfg.severity.items.map((i) => [i.level, i.lead, i.text])).toEqual([
      ['high', 'Meta Pixel fires before consent.', 'Add an ad_storage consent check in GTM.'],
      [
        'high',
        'TikTok Pixel fires after rejection.',
        'The TikTok tag needs the same consent check.',
      ],
      [
        'high',
        'Sales are credited to the payment site.',
        'Add pay.example.net to “Unwanted referrals” in GA4.',
      ],
      [
        'medium',
        'Meta AddToCart has no value or currency.',
        'Pass value and currency from the dataLayer to the tag.',
      ],
      [
        'medium',
        'generate_lead and begin_checkout never arrive.',
        'Check the GTM triggers for these events.',
      ],
      ['medium', 'sign_up has an empty method.', 'Write the method to the dataLayer.'],
    ]);
    expect(cfg.cta.href).toBe(
      'https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=pdf_footer',
    );
    const report = await buildLineReport(cfg);
    expect(report.fileName).toBe('hitline-audit-example.com-2026-11-06.pdf');
    expect(report.pages).toBe(1);
    const all = text(report.layout);
    expect(all).toContain('TRACKING AUDIT');
    expect(all).toContain('Made with Hitline. No data left the browser.');
    expect(all).toContain('Page 1 of 1');
    expect(new TextDecoder().decode(report.bytes.subarray(0, 5))).toBe('%PDF-');
  });

  it('Azerbaijani labels, with no em dashes', async () => {
    const t = translator('az');
    const cfg = hitlineReport(lumoAudit(), t, 'az', fonts, now);
    const report = await buildLineReport(cfg);
    const all = text(report.layout);
    expect(all).toContain('Problemlər və həllər');
    expect(all).toContain('Hitline ilə hazırlanıb.');
    expect(all).not.toMatch(/—/);
  });

  it('summary from the popup, and a session without issues', async () => {
    const t = translator('en');
    const session = lumoSession('events');
    const probe = {
      url: 'https://example.com/products/wireless-headphones-pro-x',
      resources: session.requests.map((r, i) => ({ name: r.url, startTime: i * 10 })),
      dataLayer: [],
      dataLayerLength: 0,
      gtmIds: ['GTM-K7P2QX'],
      cmp: [],
      cookies: {},
      serverContainerUrl: 'https://data.example.com',
    };
    const cfg = hitlineSummaryReport(analyzePopup(probe), t, 'en', fonts, now);
    expect(cfg.subline).toMatch(/Summary from the toolbar popup/);
    expect(cfg.keyValue.rows[1]).toEqual({ k: 'Server-side', v: 'GA4 through data.example.com' });
    expect(cfg.severity.items.map((i) => i.lead)).toEqual([
      'Meta AddToCart has no value or currency.',
    ]);
    expect((await buildLineReport(cfg)).pages).toBe(1);

    const clean = analyze({
      requests: [],
      navigations: [{ time: 1, url: 'https://clean.example/' }],
      snapshots: [],
    });
    const empty = hitlineReport(clean, t, 'en', fonts, now);
    expect(empty.severity.items).toEqual([
      {
        level: 'low',
        lead: 'No issues found.',
        text: 'Hitline found nothing to fix in this session.',
      },
    ]);
    expect(empty.keyValue.rows.map((r) => r.v)).toEqual([
      'Not found',
      'Not detected',
      'Not found',
      'No plan loaded',
    ]);
  });
});
