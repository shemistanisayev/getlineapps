/**
 * The recorded fixture sites (scripts/record-rivaline-fixture.ts) give exactly what the design
 * shows: design/rivaline Main, StackDetail, Ads, Brand, BrandExport, Report.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { brandDomain, brandName, libraryLinks } from './ads.ts';
import { brandKit, brandSlug, exportCss, logoCrop } from './brand.ts';
import { analyzeStack } from './match.ts';
import type { PageSnapshot } from './types.ts';
import type { BrandRaw } from './brand.ts';

const load = <T>(name: string): T =>
  JSON.parse(
    readFileSync(new URL(`../../fixtures/rivaline/${name}.json`, import.meta.url), 'utf8'),
  ) as T;

const kova = load<PageSnapshot>('kova-snapshot');
const stack = analyzeStack(kova);

describe('Kova stack (Main, StackDetail, Report)', () => {
  it('13 tools in 8 categories, grouped as the Report table', () => {
    expect(stack.summary.tools).toBe(13);
    expect(stack.summary.categories).toBe(8);
    expect(stack.groups.map((g) => [g.category, g.tools.map((t) => t.name)])).toEqual([
      ['advertising', ['Meta Pixel', 'TikTok Pixel', 'Google Ads', 'Pinterest Tag']],
      ['analytics', ['Google Analytics 4', 'Hotjar']],
      ['tagmanagement', ['Google Tag Manager']],
      ['email', ['Mailchimp']],
      ['chat', ['Intercom']],
      ['ecommerce', ['Shopify']],
      ['reviews', ['Trustpilot']],
      ['payments', ['Klarna', 'PayPal']],
    ]);
  });

  it('the IDs from the design', () => {
    const label = (id: string) => stack.tools.find((t) => t.id === id)?.label;
    expect(label('meta_pixel')).toBe('418273650912345');
    expect(label('tiktok_pixel')).toBe('C9H3KQ7RC77U2M0V5PLG');
    expect(label('google_ads')).toBe('AW-11284956');
    expect(label('pinterest_tag')).toBe('2612345678901');
    expect(label('ga4')).toBe('G-8XK2LM4QPZ');
    expect(label('hotjar')).toBe('site 3918274');
    expect(label('gtm')).toBe('GTM-N4KV8R');
    expect(label('shopify')).toBe('Dawn');
    expect(label('intercom')).toBe('chat');
  });

  it("Meta's evidence as StackDetail shows it", () => {
    expect(stack.tools[0]!.evidence).toEqual([
      { kind: 'Script', value: 'connect.facebook.net/en_US/fbevents.js' },
      { kind: 'Global', value: 'window.fbq' },
      { kind: 'Cookie', value: '_fbp' },
      { kind: 'Request', value: 'www.facebook.com/tr' },
    ]);
  });

  it('hero: Shopify store running Meta, TikTok, Google and Pinterest ads; 7 marks and +6', () => {
    expect(stack.summary.platform).toBe('Shopify');
    expect(stack.summary.adChannels).toEqual(['Meta', 'TikTok', 'Google', 'Pinterest']);
    expect(stack.summary.marks.map((t) => t.mark)).toEqual([
      'shopify',
      'googletagmanager',
      'googleanalytics',
      'meta',
      'tiktok',
      'googleads',
      'pinterest',
    ]);
    expect(stack.summary.more).toBe(6);
  });

  it('chips by count, ties in category order (Main)', () => {
    expect(stack.chips.slice(0, 4)).toEqual([
      { category: 'advertising', count: 4 },
      { category: 'analytics', count: 2 },
      { category: 'payments', count: 2 },
      { category: 'tagmanagement', count: 1 },
    ]);
  });

  it('3 gaps: server-side (4 pixels), consent, CRM (Mailchimp)', () => {
    expect(stack.gaps).toEqual([
      { id: 'GAP_SERVER_SIDE', severity: 'high', count: 4 },
      { id: 'GAP_CONSENT', severity: 'high' },
      { id: 'GAP_CRM', severity: 'medium', emailTool: 'Mailchimp' },
    ]);
  });
});

describe('Kova ads and brand (Ads, Brand, BrandExport)', () => {
  it('brand name, domain and the four libraries with their status', () => {
    expect(brandName(kova)).toBe('Kova');
    expect(brandDomain(kova.url)).toBe('example.com');
    const links = libraryLinks({ brand: 'Kova', domain: 'example.com' }, stack.tools);
    expect(links.map((l) => [l.id, l.query, l.found])).toEqual([
      ['meta', 'Kova', true],
      ['google', 'example.com', true],
      ['tiktok', 'Kova', true],
      ['linkedin', 'Kova', false],
    ]);
  });

  const kit = brandKit(load<BrandRaw>('kova-brand'));

  it('the 5 Kova colors with their roles', () => {
    expect(kit.colors).toEqual([
      { role: 'primary', hex: '#2F5D46' },
      { role: 'text', hex: '#1E2B24' },
      { role: 'background', hex: '#F6F1EA' },
      { role: 'accent', hex: '#EBC56B' },
      { role: 'surface', hex: '#DCE5D8' },
    ]);
  });

  it('Fraunces and DM Sans from Google Fonts, the main button', () => {
    expect(kit.heading).toMatchObject({
      family: 'Fraunces',
      weight: '600',
      size: 52,
      source: 'google',
    });
    expect(kit.body).toMatchObject({
      family: 'DM Sans',
      weight: '400',
      size: 16,
      source: 'google',
    });
    expect(kit.button).toEqual({
      background: '#2F5D46',
      text: '#F6F1EA',
      radius: '999px',
      height: 50,
      paddingX: 28,
      family: 'DM Sans',
      weight: '600',
      size: 15,
      label: 'Shop the routine',
    });
    expect(logoCrop(kit.logo)).not.toBeNull();
  });

  it('CSS variables export is the BrandExport code', () => {
    expect(exportCss(kit, brandSlug('Kova'))).toBe(`:root {
  --kova-primary: #2F5D46;
  --kova-text: #1E2B24;
  --kova-background: #F6F1EA;
  --kova-accent: #EBC56B;
  --kova-surface: #DCE5D8;
  --kova-font-heading: "Fraunces", serif;
  --kova-font-body: "DM Sans", sans-serif;
  --kova-button-radius: 999px;
}
`);
  });
});

describe('Glowbar and Mira Studio', () => {
  it('Glowbar: consent through Cookiebot and Consent Mode, only the server-side and CRM gaps', () => {
    const glow = analyzeStack(load<PageSnapshot>('glow-snapshot'));
    expect(glow.tools.map((t) => t.id)).toEqual([
      'meta_pixel',
      'ga4',
      'cookiebot',
      'klaviyo',
      'shopify',
    ]);
    expect(glow.gaps.map((g) => g.id)).toEqual(['GAP_SERVER_SIDE', 'GAP_CRM']);
  });

  it('Mira Studio: no marketing tools (Empty)', () => {
    const mira = analyzeStack(load<PageSnapshot>('mira-snapshot'));
    expect(mira.tools).toEqual([]);
    expect(mira.summary.tools).toBe(0);
  });
});
