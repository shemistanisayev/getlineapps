import { describe, expect, it } from 'vitest';
import { classifyRequest } from './classify.ts';
import { extractResource, parseGtmContainer } from './gtm.ts';
import {
  diffPlan,
  draftPlan,
  parsePlan,
  parsePlanCsv,
  parsePlanJson,
  planToCsv,
  SAMPLE_PLAN_CSV,
  splitCsvLine,
} from './plan.ts';

describe('tracking plan parsing', () => {
  it('splits quoted CSV cells', () => {
    expect(splitCsvLine('add_to_cart,GA4,"currency,value,items"')).toEqual([
      'add_to_cart',
      'GA4',
      'currency,value,items',
    ]);
    expect(splitCsvLine('a,"say ""hi""",c')).toEqual(['a', 'say "hi"', 'c']);
  });

  it('parses the sample CSV and round-trips it', () => {
    const r = parsePlanCsv(SAMPLE_PLAN_CSV);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.rows[1]).toEqual({
      event: 'AddToCart',
      platform: 'meta',
      parameters: ['value', 'currency', 'content_ids'],
    });
    expect(planToCsv(r.plan.rows)).toBe(SAMPLE_PLAN_CSV);
    expect(SAMPLE_PLAN_CSV.split('\n')[1]).toBe('add_to_cart,GA4,"currency,value,items"');
  });

  it('gives clear errors for bad files', () => {
    expect(parsePlanCsv('')).toEqual({ ok: false, error: { code: 'empty' } });
    expect(parsePlanCsv('name,type\nx,y')).toEqual({ ok: false, error: { code: 'header' } });
    expect(parsePlanCsv('event,platform,parameters\npurchase,Snapchat,"value"')).toEqual({
      ok: false,
      error: { code: 'row', line: 2, reason: 'platform' },
    });
    expect(parsePlanCsv('event,platform,parameters\n,GA4,"value"')).toEqual({
      ok: false,
      error: { code: 'row', line: 2, reason: 'event' },
    });
    expect(parsePlanCsv('x'.repeat(300 * 1024))).toEqual({ ok: false, error: { code: 'too_big' } });
    expect(parsePlanJson('{nope')).toEqual({ ok: false, error: { code: 'json' } });
    expect(parsePlanJson('[{"event":"x","platform":"GA4"}]')).toMatchObject({ ok: true });
  });

  it('picks the parser by name or content', () => {
    const json = '[{"event":"purchase","platform":"Google Ads","parameters":["value"]}]';
    expect(parsePlan(json, 'plan.txt')).toMatchObject({
      ok: true,
      plan: { rows: [{ platform: 'ads' }] },
    });
    expect(parsePlan(SAMPLE_PLAN_CSV, 'p.csv')).toMatchObject({ ok: true });
  });
});

describe('plan diff and draft', () => {
  const hits = [
    'https://www.facebook.com/tr/?id=1&ev=AddToCart&cd[content_ids]=A',
    'https://data.example.com/g/collect?v=2&tid=G-1&en=sign_up&ep.method=',
    'https://data.example.com/g/collect?v=2&tid=G-1&en=add_to_cart&cu=USD&epn.value=1&pr1=idA~nmB',
  ].flatMap((url, i) => classifyRequest({ id: `r${i}`, time: i, method: 'GET', url }));

  it('marks match, missing and wrong parameters', () => {
    const r = parsePlanCsv(
      'event,platform,parameters\nAddToCart,Meta,"value,currency,content_ids"\nsign_up,GA4,"method"\nadd_to_cart,GA4,"currency,value,items"\ngenerate_lead,GA4,"form_id"',
    );
    if (!r.ok) throw new Error('parse');
    const d = diffPlan(r.plan, hits);
    expect(d.counts).toEqual({ match: 1, missing: 1, wrong: 2 });
    expect(d.rows[0]!.arrived).toEqual({
      kind: 'params',
      present: ['content_ids'],
      missing: ['value', 'currency'],
      empty: [],
    });
    expect(d.rows[1]!.arrived).toMatchObject({ empty: ['method'] });
    expect(d.rows[3]!.arrived).toEqual({ kind: 'never' });
  });

  it('drafts a plan from the session', () => {
    expect(planToCsv(draftPlan(hits))).toBe(
      'event,platform,parameters\nAddToCart,Meta,"content_ids"\nsign_up,GA4,"method"\nadd_to_cart,GA4,"currency,value,items"\n',
    );
  });
});

describe('GTM container', () => {
  it('extracts the resource block, ignoring braces in strings', () => {
    expect(
      extractResource('var data = {"resource": {"a": "}{", "b": [1]}, "runtime": []};'),
    ).toEqual({
      a: '}{',
      b: [1],
    });
    expect(extractResource('nothing here')).toBeNull();
    expect(parseGtmContainer('GTM-X', 'var data = {"resource": {"tags": "nope"}}')).toBeNull();
  });

  it('names tags from what they do', () => {
    const body = JSON.stringify({
      resource: {
        macros: [{ function: '__e' }],
        tags: [
          { function: '__html', vtp_html: "<script>ttq.track('CompletePayment')</script>" },
          { function: '__html', vtp_html: '<script>console.log(1)</script>', paused: true },
        ],
        predicates: [{ function: '_eq', arg0: ['macro', 0], arg1: 'gtm.load' }],
        rules: [
          [
            ['if', 0],
            ['add', 0, 1],
          ],
        ],
      },
    });
    const c = parseGtmContainer('GTM-X', body)!;
    expect(c.tags.map((t) => [t.name, t.trigger, t.paused])).toEqual([
      ['TikTok CompletePayment', 'Window Loaded', false],
      ['Custom HTML', 'Window Loaded', true],
    ]);
  });
});
