/** Rivaline 1.1 Compare (docs/rivaline/PLAN-1.1.md, step 4): Kova against Glowbar, as recorded. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { brandKit, type BrandRaw } from './brand.ts';
import { compareSites, type CompareSide } from './compare.ts';
import { analyzeStack } from './match.ts';
import { siteInfo, type SiteRaw } from './research.ts';
import type { PageSnapshot } from './types.ts';

const fixture = <T>(name: string): T =>
  JSON.parse(
    readFileSync(new URL(`../../fixtures/rivaline/${name}.json`, import.meta.url), 'utf8'),
  ) as T;

function side(name: 'kova' | 'glow', brand: boolean): CompareSide {
  const stack = analyzeStack(fixture<PageSnapshot>(`${name}-snapshot`));
  return {
    stack,
    site: siteInfo(fixture<SiteRaw>(`${name}-site`), stack),
    brand: brand ? brandKit(fixture<BrandRaw>(`${name}-brand`)) : null,
  };
}

describe('compareSites: Kova against Glowbar', () => {
  const c = compareSites(side('kova', true), side('glow', false));

  it('numbers side by side', () => {
    expect(c.numbers).toEqual([
      { id: 'tools', a: 13, b: 5 },
      { id: 'adPixels', a: 4, b: 1 },
      { id: 'offers', a: 3, b: 1 },
      { id: 'profiles', a: 4, b: 3 },
      { id: 'apps', a: 2, b: 0 },
      { id: 'languages', a: 2, b: 1 },
    ]);
  });

  it('tools only on one side and on both, by category in stack order', () => {
    const ids = c.tools.map((g) => [
      g.category,
      g.onlyA.map((t) => t.id),
      g.onlyB.map((t) => t.id),
      g.both.map((t) => t.id),
    ]);
    expect(ids).toEqual([
      ['advertising', ['tiktok_pixel', 'google_ads', 'pinterest_tag'], [], ['meta_pixel']],
      ['analytics', ['hotjar'], [], ['ga4']],
      ['tagmanagement', ['gtm'], [], []],
      ['consent', [], ['cookiebot'], []],
      ['email', ['mailchimp'], ['klaviyo'], []],
      ['chat', ['intercom'], [], []],
      ['ecommerce', [], [], ['shopify']],
      ['reviews', ['trustpilot'], [], []],
      ['payments', ['klarna', 'paypal'], [], []],
    ]);
  });

  it('ad channels, gaps, offers', () => {
    expect(c.adChannels).toEqual([
      { channel: 'Meta', a: true, b: true },
      { channel: 'TikTok', a: true, b: false },
      { channel: 'Google', a: true, b: false },
      { channel: 'Pinterest', a: true, b: false },
    ]);
    expect(c.gaps).toEqual({
      a: ['GAP_SERVER_SIDE', 'GAP_CONSENT', 'GAP_CRM'],
      b: ['GAP_SERVER_SIDE', 'GAP_CRM'],
    });
    expect(c.promos).toEqual([
      { kind: 'discount', a: true, b: true },
      { kind: 'code', a: true, b: true },
      { kind: 'shipping', a: true, b: false },
      { kind: 'installments', a: true, b: false },
      { kind: 'returns', a: true, b: false },
    ]);
  });

  it('channels, leads, markets', () => {
    expect(c.social).toEqual([
      { network: 'instagram', a: 'kova.skin', b: 'glowbar.beauty' },
      { network: 'facebook', a: null, b: 'glowbarbeauty' },
      { network: 'tiktok', a: '@kova.skin', b: '@glowbar' },
      { network: 'youtube', a: '@kovaskin', b: null },
      { network: 'pinterest', a: 'kovaskin', b: null },
    ]);
    expect(c.apps).toEqual({ a: ['appstore', 'googleplay'], b: [] });
    expect(c.leads).toEqual([
      { way: 'email', a: ['Mailchimp'], b: ['Klaviyo'] },
      { way: 'chat', a: ['Intercom'], b: null },
    ]);
    expect(c.markets).toEqual({
      languages: { a: ['de', 'en'], b: ['en'] },
      currency: { a: 'USD', b: null },
    });
  });

  it('brand colors by role and fonts; a side without a brand read is null', () => {
    expect(c.brand.colors[0]).toEqual({ role: 'primary', a: '#2F5D46', b: null });
    expect(c.brand.heading).toEqual({ a: 'Fraunces', b: null });
  });

  it('is symmetric: swapping the sides swaps every value', () => {
    const r = compareSites(side('glow', false), side('kova', true));
    expect(r.numbers.map((n) => [n.a, n.b])).toEqual(c.numbers.map((n) => [n.b, n.a]));
    expect(r.tools.flatMap((g) => g.onlyA.map((t) => t.id))).toEqual(
      c.tools.flatMap((g) => g.onlyB.map((t) => t.id)),
    );
  });

  it('a side whose offer was not read counts zero and shows nothing', () => {
    const r = compareSites({ ...side('kova', true), site: null }, side('glow', false));
    expect(r.numbers.find((n) => n.id === 'offers')).toEqual({ id: 'offers', a: 0, b: 1 });
    expect(r.markets.currency).toEqual({ a: null, b: null });
  });
});
