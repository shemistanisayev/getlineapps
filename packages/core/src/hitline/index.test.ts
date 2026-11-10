/**
 * The Lumo scenarios through core produce exactly what the design shows
 * (docs/hitline-SPEC.md Phase 3 "done when"). Fixtures: packages/core/fixtures/hitline.
 */
import { describe, expect, it } from 'vitest';
import { lumoSession } from '../../fixtures/hitline/load.ts';
import { at, LUMO_PLAN_CSV, LUMO_SCENARIOS, type RunId } from '../../fixtures/hitline/lumo.ts';
import {
  analyze,
  analyzePopup,
  parsePlanCsv,
  reportIssues,
  TOOL,
  type PopupProbe,
} from './index.ts';

const parsed = parsePlanCsv(LUMO_PLAN_CSV, 'lumo-tracking-plan.csv');
if (!parsed.ok) throw new Error('Lumo plan does not parse');
const plan = parsed.plan;
const audit = (run: RunId) => analyze(lumoSession(run), { plan });

describe('hitline core: Lumo "events" run (Events, GTM, Plan artboards)', () => {
  const a = audit('events');

  it('records 14 events: GA4 5, Meta 3, TikTok 2, Google Ads 1, dataLayer 3', () => {
    expect(TOOL).toBe('hitline');
    expect(a.counts.events).toBe(14);
    const by = (p: string) => a.events.filter((e) => e.platform === p).length;
    expect([by('ga4'), by('meta'), by('tiktok'), by('ads'), by('datalayer')]).toEqual([
      5, 3, 2, 1, 3,
    ]);
  });

  it('keeps the design rows in order with routes', () => {
    expect(a.events.slice(0, 11).map((e) => `${e.platform} ${e.event} ${e.route}`)).toEqual([
      'ga4 page_view sgtm',
      'meta PageView browser',
      'tiktok Pageview browser',
      'datalayer view_item page',
      'ga4 view_item sgtm',
      'meta ViewContent browser',
      'datalayer add_to_cart page',
      'ga4 add_to_cart sgtm',
      'meta AddToCart browser',
      'ads conversion browser',
      'tiktok AddToCart browser',
    ]);
  });

  it('decodes the add_to_cart parameters like the detail pane', () => {
    const hit = a.events.find((e) => e.platform === 'ga4' && e.event === 'add_to_cart')!;
    expect(hit.time).toBe(at('10:42:31.950'));
    expect(hit.method).toBe('POST');
    expect(hit.gcs).toBe('G111');
    expect(hit.params).toEqual([
      { key: 'currency', value: 'USD' },
      { key: 'value', value: '89.90' },
      { key: 'items[0].item_id', value: 'LUMO-PRO-X' },
      { key: 'items[0].item_name', value: 'Wireless Headphones Pro X' },
      { key: 'items[0].price', value: '89.90' },
      { key: 'items[0].quantity', value: '1' },
    ]);
  });

  it('detects server-side GTM with all 4 signals and the browser-only warning', () => {
    expect(a.sgtm.detected).toBe(true);
    expect(a.sgtm.host).toBe('data.example.com');
    expect(a.sgtm.signals.map((s) => [s.id, s.found])).toEqual([
      ['own_subdomain', true],
      ['ga4_path', true],
      ['server_container_url', true],
      ['fpid_cookie', true],
    ]);
    expect(a.sgtm.signals[3]!.days).toBe(400);
    expect(a.sgtm.browserPlatforms).toEqual(['meta', 'tiktok']);
  });

  it('lists the 8 GTM tags with type, trigger and status', () => {
    expect(a.gtm).toHaveLength(1);
    expect(a.gtm[0]!.container.id).toBe('GTM-K7P2QX');
    expect(a.gtm[0]!.tags.map((t) => [t.name, t.type, t.trigger, t.status])).toEqual([
      ['GA4 Config', 'Google Tag', 'All Pages', 'fired'],
      ['GA4 add_to_cart', 'GA4 Event', 'dl add_to_cart', 'fired'],
      ['Google Ads Conversion', 'Google Ads', 'dl add_to_cart', 'fired'],
      ['Meta Pixel Base', 'Custom HTML', 'All Pages', 'fired'],
      ['Meta AddToCart', 'Custom HTML', 'dl add_to_cart', 'missing_value'],
      ['TikTok Pixel', 'Custom HTML', 'All Pages', 'no_consent_check'],
      ['Hotjar', 'Custom HTML', 'All Pages', 'waiting_consent'],
      ['GA4 purchase', 'GA4 Event', 'dl purchase', 'not_fired'],
    ]);
  });

  it('compares with the plan: 4 match, 2 missing, 2 wrong parameters', () => {
    expect(a.plan!.counts).toEqual({ match: 4, missing: 2, wrong: 2 });
    expect(a.plan!.rows.map((r) => [r.row.event, r.status, r.arrived.kind])).toEqual([
      ['generate_lead', 'missing', 'never'],
      ['begin_checkout', 'missing', 'datalayer_only'],
      ['AddToCart', 'wrong', 'params'],
      ['sign_up', 'wrong', 'params'],
      ['page_view', 'match', 'same'],
      ['view_item', 'match', 'same'],
      ['add_to_cart', 'match', 'same'],
      ['ViewContent', 'match', 'same'],
    ]);
    expect(a.counts.plan).toBe(4);
  });

  it('has no consent or attribution issues, Meta AddToCart has no value', () => {
    expect(a.consent.model.choice!.kind).toBe('accept');
    expect(a.counts.consent).toBe(0);
    expect(a.counts.attribution).toBe(0);
    expect(a.issues.map((i) => i.key)).toContain('VALUE_MISSING:meta:AddToCart');
    expect(a.issues.find((i) => i.id === 'BROWSER_ONLY')!.data.browser).toEqual(['meta', 'tiktok']);
  });
});

describe('hitline core: Lumo "consent" run (Consent artboard)', () => {
  const a = audit('consent');

  it('banner found, visitor rejected all, defaults and choice all denied', () => {
    const m = a.consent.model;
    expect(m.bannerFound).toBe(true);
    expect(m.choice).toEqual({ kind: 'reject', time: at('10:41:09.480') });
    for (const s of ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization']) {
      expect([m.defaults[s], m.afterChoice[s]]).toEqual(['denied', 'denied']);
    }
    expect(a.consent.google).toBe('ok');
  });

  it('splits the timeline at the choice with the design statuses', () => {
    expect(
      a.consent.timeline.map((r) => `${r.phase} ${r.platform} ${r.event} ${r.status}`),
    ).toEqual([
      'before ga4 page_view cookieless',
      'before meta PageView before_consent',
      'after ga4 view_item cookieless',
      'after tiktok ViewContent after_reject',
      'after hotjar script not_loaded',
    ]);
  });

  it('raises the two consent issues and names the GTM tags to fix', () => {
    const consent = a.issues.filter((i) => i.tab === 'consent');
    expect(consent.map((i) => [i.id, i.data.platform, i.data.tags])).toEqual([
      ['CONSENT_BEFORE', 'meta', ['Meta Pixel Base']],
      ['CONSENT_AFTER_REJECT', 'tiktok', ['TikTok Pixel']],
    ]);
    expect(a.counts.consent).toBe(2);
  });
});

describe('hitline core: Lumo "journey" run (Attribution artboard)', () => {
  const a = audit('journey');

  it('builds the 5-step visit path with the design badges', () => {
    expect(a.attribution.campaign).toBe(true);
    expect(a.attribution.steps.map((s) => [s.page.kind, s.badge.kind, s.badge.ok])).toEqual([
      ['landing', 'utm_click', true],
      ['product', 'gcl_saved', true],
      ['cart', 'source_medium', true],
      ['payment', 'gl_missing', false],
      ['confirmation', 'referral', false],
    ]);
    expect(a.attribution.steps[2]!.badge).toMatchObject({ value: 'google / cpc' });
    expect(a.attribution.steps[4]!.badge).toMatchObject({ value: 'example.net' });
  });

  it('fills the parameter table across pages', () => {
    const steps = a.attribution.steps;
    expect(steps.map((s) => s.source)).toEqual([
      'present',
      'in_session',
      'in_session',
      'lost',
      'referral',
    ]);
    expect(steps.map((s) => s.gclid)).toEqual([
      'present',
      'in_cookie',
      'in_cookie',
      'lost',
      'in_cookie',
    ]);
    expect(steps.map((s) => s.clientId)).toEqual(['created', 'same', 'same', 'new', 'same']);
  });

  it('raises one issue: the sale is credited to the payment site', () => {
    const attr = a.issues.filter((i) => i.tab === 'attribution');
    expect(attr.map((i) => [i.id, i.data.host, i.data.domain])).toEqual([
      ['UNWANTED_REFERRAL', 'pay.example.net', 'example.net'],
    ]);
    expect(a.counts.attribution).toBe(1);
  });
});

describe('hitline core: Report artboard issues', () => {
  it('the three runs together give 3 high and 3 medium items, as in the PDF', () => {
    const events = audit('events');
    const consent = audit('consent');
    const journey = audit('journey');
    const all = reportIssues([
      ...consent.issues.filter((i) => i.tab === 'consent'),
      ...journey.issues.filter((i) => i.tab === 'attribution'),
      ...events.issues,
    ]);
    expect(all.map((i) => [i.severity, i.id])).toEqual([
      ['high', 'CONSENT_BEFORE'],
      ['high', 'CONSENT_AFTER_REJECT'],
      ['high', 'UNWANTED_REFERRAL'],
      ['medium', 'VALUE_MISSING'],
      ['medium', 'PLAN_MISSING'],
      ['medium', 'PLAN_PARAMS'],
    ]);
    expect(all[4]!.data.events).toEqual(['generate_lead', 'begin_checkout']);
    expect(all[5]!.data.event).toBe('sign_up');
  });
});

/** What the popup's executeScript would return for a run (URLs only, start times relative). */
function probeFor(run: RunId): PopupProbe {
  const s = LUMO_SCENARIOS[run];
  const page = s.pages[0]!;
  const t0 = at(page.at);
  const resources: PopupProbe['resources'] = [];
  const dataLayer: unknown[] = [];
  for (const step of page.steps) {
    if ('req' in step) resources.push({ name: step.req.url, startTime: at(step.t) - t0 });
    else dataLayer.push(step.dl);
  }
  return {
    url: page.url,
    resources,
    dataLayer,
    dataLayerLength: dataLayer.length,
    gtmIds: ['GTM-K7P2QX'],
    cmp: [],
    cookies: page.cookies,
    serverContainerUrl: 'https://data.example.com',
  };
}

describe('hitline core: popup summary from URLs only', () => {
  it('events run: sGTM, 4 platform tiles, Meta AddToCart without value', () => {
    const p = analyzePopup(probeFor('events'));
    expect(p.host).toBe('example.com');
    expect(p.requests).toBe(12);
    expect(p.sgtm).toEqual({ detected: true, host: 'data.example.com', signals: 3 });
    expect(p.platforms.map((x) => [x.platform, x.events, x.issues])).toEqual([
      ['ga4', 5, 0],
      ['ads', 1, 0],
      ['meta', 3, 1],
      ['tiktok', 2, 0],
    ]);
    expect(p.issues.map((i) => i.key)).toEqual(['VALUE_MISSING:meta:AddToCart']);
    expect(p.noTracking).toBe(false);
  });

  it('consent run: proves TikTok after rejection from the gcd order', () => {
    const p = analyzePopup(probeFor('consent'));
    expect(p.issues.map((i) => i.key)).toEqual(['CONSENT_AFTER_REJECT:tiktok']);
  });

  it('no tracking', () => {
    const p = analyzePopup({
      ...probeFor('events'),
      resources: [{ name: 'https://example.com/app.js', startTime: 1 }],
    });
    expect(p.noTracking).toBe(true);
    expect(p.platforms).toEqual([]);
  });
});

describe('hitline core: empty session', () => {
  it('reports no tracking', () => {
    const a = analyze({
      requests: [],
      navigations: [{ time: 1, url: 'https://example.com/' }],
      snapshots: [],
    });
    expect(a.issues.map((i) => i.id)).toEqual(['NO_TRACKING']);
    expect(a.counts).toEqual({ events: 0, gtm: 0, consent: 0, attribution: 0, plan: 0 });
    expect(a.sgtm.detected).toBe(false);
  });
});

describe('hitline core: Lumo "clean" run (QA: no false positives)', () => {
  it('a correct setup raises no high or medium issue, with or without the popup', () => {
    const a = analyze(lumoSession('clean'));
    expect(a.issues.filter((i) => i.severity !== 'info')).toEqual([]);
    expect(a.counts).toMatchObject({ consent: 0, attribution: 0, plan: 0 });
    expect(a.consent.model.choice?.kind).toBe('accept');
    expect(a.consent.timeline.every((r) => r.status === 'granted')).toBe(true);
    expect(a.sgtm.detected).toBe(true);
    const p = analyzePopup(probeFor('clean'));
    expect(p.issues).toEqual([]);
    expect(p.platforms.every((x) => x.issues === 0)).toBe(true);
  });
});
