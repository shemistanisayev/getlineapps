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
    expect(cfg.subline).toBe('Page checked: example.com/products/wireless-headphones-pro-x');
    expect(cfg.tiles.map((x) => [x.value, x.label])).toEqual([
      [4, 'platforms'],
      [14, 'events'],
      [3, 'high priority'],
      [3, 'medium priority'],
    ]);
    expect(cfg.keyValue.rows).toEqual([
      { k: 'GTM', v: 'GTM-K7P2QX, 8 tags' },
      { k: 'GA4 properties', v: 'G-4LMX82PQ1S' },
      { k: 'Server-side', v: 'GA4 through data.example.com, Meta and TikTok from the browser' },
      { k: 'Consent Mode v2', v: 'Correct on Google tags, missing on Meta and TikTok' },
      { k: 'Tracking plan', v: '4 of 8 events match' },
    ]);
    // Each line: what happens, why it matters, the fix, and when it was seen.
    expect(cfg.severity.items.map((i) => [i.level, i.lead])).toEqual([
      ['high', 'Meta Pixel fires before consent.'],
      ['high', 'TikTok Pixel fires after rejection.'],
      ['high', 'Sales are credited to the payment site.'],
      ['medium', 'Meta AddToCart has no value or currency.'],
      ['medium', 'generate_lead and begin_checkout never arrive.'],
      ['medium', 'sign_up has an empty method.'],
    ]);
    expect(cfg.severity.items[0]!.text).toMatch(
      /^Personal data is sent without the visitor’s permission, which breaks GDPR\. Add an ad_storage consent check in GTM\./,
    );
    expect(cfg.severity.items[1]!.text).toContain('The TikTok tag needs the same consent check.');
    expect(cfg.severity.items[2]!.text).toContain(
      'Add pay.example.net to “Unwanted referrals” in GA4.',
    );
    expect(cfg.severity.items[3]!.text).toMatch(
      /Pass value and currency from the dataLayer to the tag\. Seen at /,
    );
    // Detailed sections: platforms with ids, events, GTM tags, consent timeline, visit path.
    const tables = (cfg.extras ?? []).flatMap((e) => (e.type === 'table' ? [e] : []));
    expect(tables.map((x) => x.title)).toEqual([
      'Platforms and IDs',
      'Events',
      'GTM tags in GTM-K7P2QX',
      'Consent timeline',
      'Visit path',
    ]);
    expect(tables[0]!.rows).toEqual([
      ['GA4', 'G-4LMX82PQ1S', '5', 'sGTM'],
      ['Google Ads', '987654321', '1', 'Browser'],
      ['Meta', '1234567890123456', '3', 'Browser'],
      ['TikTok', 'CTLUMO12345', '2', 'Browser'],
    ]);
    expect(tables[4]!.rows.map((r) => r[2])).toEqual([
      'Campaign link',
      'Saved in _gcl_aw',
      'google / cpc',
      '_gl not passed',
      'example.net / referral',
    ]);
    expect(cfg.cta.href).toBe(
      'https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=pdf_footer',
    );
    const report = await buildLineReport(cfg);
    expect(report.fileName).toBe('hitline-audit-example.com-2026-11-06.pdf');
    expect(report.pages).toBe(3);
    const all = text(report.layout);
    expect(all).toContain('TRACKING AUDIT');
    expect(all).toContain('Made with Hitline. No data left the browser.');
    expect(all).toContain('Page 1 of 3');
    expect(all).toContain('G-4LMX82PQ1S');
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
    expect(cfg.keyValue.rows[0]).toEqual({ k: 'Server-side', v: 'GA4 through data.example.com' });
    expect(cfg.keyValue.rows.some((r) => r.k === 'Full audit')).toBe(false);
    expect(cfg.severity.items.map((i) => i.lead)).toEqual([
      'Meta AddToCart has no value or currency.',
    ]);
    expect((await buildLineReport(cfg)).pages).toBeGreaterThanOrEqual(1);

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
    // Without a plan or consent setup the PDF says so once and adds no empty rows.
    expect(empty.keyValue.rows.map((r) => r.v)).toEqual([
      'Not found',
      'Not detected',
      'Not set up: Google tags send full hits whatever the visitor chooses',
    ]);
    expect(empty.extras).toEqual([]);
  });
});
