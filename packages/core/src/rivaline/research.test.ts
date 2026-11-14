/**
 * Rivaline 1.1 competitor research (docs/rivaline/PLAN-1.1.md, step 2): Kova as recorded by the
 * extension's own collectSite, plus the patterns seen in QA on real sites (allbirds, gymshark,
 * kontakt.az, umico.az, irshad.az, bakuelectronics.az, hubspot.com), written as small cases.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeStack } from './match.ts';
import {
  appLink,
  leadCapture,
  parseAmount,
  parsePrice,
  readChannels,
  readMarkets,
  readOffer,
  siteInfo,
  socialProfile,
  whatsappNumber,
  type SiteRaw,
} from './research.ts';
import type { FoundTool, PageSnapshot } from './types.ts';

const fixture = <T>(name: string): T =>
  JSON.parse(
    readFileSync(new URL(`../../fixtures/rivaline/${name}.json`, import.meta.url), 'utf8'),
  ) as T;

/** An empty page plus whatever the case sets. */
function raw(p: Partial<SiteRaw> = {}): SiteRaw {
  return {
    url: 'https://shop.example.com/',
    lang: 'en',
    title: '',
    description: '',
    meta: {},
    h1: '',
    sub: '',
    ctas: [],
    announcement: '',
    texts: [],
    links: [],
    hreflang: [],
    jsonld: [],
    emailForm: false,
    ...p,
  };
}

const tool = (id: string, name: string, category: FoundTool['category'], kind?: string) =>
  ({
    id,
    name,
    category,
    ids: [],
    label: kind ?? '',
    evidence: [],
    ...(kind ? { kind } : {}),
  }) as FoundTool;

describe('Kova (recorded with collectSite)', () => {
  const info = siteInfo(
    fixture<SiteRaw>('kova-site'),
    analyzeStack(fixture<PageSnapshot>('kova-snapshot')),
  );

  it('offer: headline, subline, the main button, the top bar, three offers, the price range', () => {
    expect(info.offer).toMatchObject({
      title: 'Kova | Skincare that keeps it simple',
      headline: 'Skincare that keeps it simple.',
      subline: 'Three steps, gentle formulas, made in small batches.',
      ctas: ['Shop the routine'],
      announcement: 'Free shipping over $40. Easy 30-day returns.',
      prices: { min: 24, max: 42, currency: 'USD', count: 3 },
    });
    expect(info.offer.promos).toEqual([
      { kinds: ['shipping', 'returns'], text: 'Free shipping over $40. Easy 30-day returns.' },
      { kinds: ['installments'], text: 'or 3 payments with Klarna' },
      {
        kinds: ['code', 'discount'],
        text: 'Get 10% off your first order with code WELCOME10',
        code: 'WELCOME10',
      },
    ]);
  });

  it('channels: profiles from sameAs and the footer, apps, email; a share link is not a profile', () => {
    expect(info.channels.social.map((s) => [s.network, s.handle])).toEqual([
      ['instagram', 'kova.skin'],
      ['tiktok', '@kova.skin'],
      ['youtube', '@kovaskin'],
      ['pinterest', 'kovaskin'],
    ]);
    expect(info.channels.apps.map((a) => [a.store, a.id])).toEqual([
      ['appstore', '1234567890'],
      ['googleplay', 'com.example.kova'],
    ]);
    expect(info.channels.emails).toEqual(['hello@example.com']);
  });

  it('markets and lead capture', () => {
    expect(info.markets).toEqual({
      pageLang: 'en',
      languages: ['de', 'en'],
      regions: ['DE', 'GB', 'US'],
      currency: 'USD',
      currencyFrom: 'prices',
    });
    expect(info.leads).toEqual([
      { way: 'email', tools: ['Mailchimp'] },
      { way: 'chat', tools: ['Intercom'] },
    ]);
  });
});

describe('offers in English, Azerbaijani, Russian and Turkish', () => {
  const kinds = (text: string, where: 'main' | 'footer' | 'nav' = 'main') =>
    readOffer(raw({ texts: [{ text, where }] })).promos.flatMap((p) => p.kinds);

  it('discounts need a word for it: "-20%" and "20% endirim", not "100% natural"', () => {
    expect(kinds('Up to 70% off select styles')).toEqual(['discount']);
    expect(kinds('80%-dək böyük endirimlər vaxtıdır!')).toEqual(['discount', 'sale']);
    expect(kinds('Скидка до -30% на всё')).toEqual(['discount']);
    // Turkish writes the sign first.
    expect(kinds('%20 indirim')).toEqual(['discount', 'sale']);
    expect(kinds('100% natural ingredients')).toEqual([]);
  });

  it('shipping, installments, returns, gifts, sales', () => {
    expect(kinds('Pulsuz çatdırılma')).toEqual(['shipping']);
    expect(kinds('24 ayadək sərfəli kredit və taksit imkanları')).toEqual(['installments']);
    expect(kinds('Бесплатная доставка от 3000 ₽')).toEqual(['shipping']);
    expect(kinds('Free returns within 60 days')).toEqual(['returns']);
    expect(kinds('Hədiyyə sertifikatları')).toEqual(['gift']);
    // A month count alone is not an installment offer (QA: shamistanisayev.com).
    expect(kinds('12 aylıq yol xəritəsi, büdcə bölgüsü')).toEqual([]);
    expect(kinds('GET PREPPED FOR THE BLACK FRIDAY SALE')).toEqual(['sale']);
  });

  it('codes are capital words after code, kod or промокод', () => {
    const code = (t: string) =>
      readOffer(raw({ texts: [{ text: t, where: 'main' }] })).promos[0]?.code;
    expect(code('Use code SAVE15 at checkout')).toBe('SAVE15');
    expect(code('Promo kodu: YAY2026')).toBe('YAY2026');
    expect(code('Промокод «ZIMA20» на всё')).toBe('ZIMA20');
    expect(code('Enter the code at checkout')).toBeUndefined();
    expect(code('Your code 123456')).toBeUndefined();
  });

  it('navigation never counts; footer and header only for codes and discounts', () => {
    expect(kinds('Sale', 'nav')).toEqual([]);
    expect(kinds('Free shipping on all orders', 'footer')).toEqual([]);
    expect(kinds('Get 15% off when you sign up for emails', 'footer')).toEqual(['discount']);
  });

  it('each kind once, the first text wins', () => {
    const o = readOffer(
      raw({
        announcement: 'Free shipping over $100',
        texts: [
          { text: 'Spend $20 more to earn free shipping!', where: 'main' },
          { text: 'Mega sale', where: 'main' },
          { text: 'Winter sale', where: 'main' },
        ],
      }),
    );
    expect(o.promos.map((p) => p.text)).toEqual(['Free shipping over $100', 'Mega sale']);
  });
});

describe('prices and currencies', () => {
  it('reads the amount in each format', () => {
    expect(parseAmount('1 299,00')).toBe(1299);
    expect(parseAmount('1,299.50')).toBe(1299.5);
    expect(parseAmount('4.099,99')).toBe(4099.99);
    expect(parseAmount('24')).toBe(24);
  });

  it('a text that is only a price, with the currency before or after', () => {
    expect(parsePrice('$24')).toEqual({ amount: 24, currency: 'USD' });
    expect(parsePrice('1 299,00 ₼')).toEqual({ amount: 1299, currency: 'AZN' });
    expect(parsePrice('4099.99 AZN')).toEqual({ amount: 4099.99, currency: 'AZN' });
    expect(parsePrice('from €12')).toEqual({ amount: 12, currency: 'EUR' });
    expect(parsePrice('3000 ₽')).toEqual({ amount: 3000, currency: 'RUB' });
    expect(parsePrice('Save $24 today')).toBeNull();
    expect(parsePrice('2026')).toBeNull();
  });

  it('structured data wins over page texts, and its currency over meta and prices', () => {
    const r = raw({
      texts: [{ text: '$5', where: 'main' }],
      meta: { 'og:price:currency': 'EUR' },
      jsonld: [
        {
          '@type': 'Product',
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: '19.90',
            highPrice: 59,
            priceCurrency: 'azn',
          },
        },
      ],
    });
    expect(readOffer(r).prices).toEqual({ min: 19.9, max: 59, currency: 'AZN', count: 2 });
    expect(readMarkets(r)).toMatchObject({ currency: 'AZN', currencyFrom: 'structured' });
    expect(readMarkets(raw({ meta: { 'og:price:currency': 'eur' } }))).toMatchObject({
      currency: 'EUR',
      currencyFrom: 'meta',
    });
    expect(readMarkets(raw())).toMatchObject({ currency: null, currencyFrom: null });
  });

  it('languages and regions from hreflang, without x-default', () => {
    const m = readMarkets(
      raw({
        lang: 'az-AZ',
        hreflang: [
          { lang: 'az', href: '' },
          { lang: 'ru-AZ', href: '' },
          { lang: 'en_GB', href: '' },
          { lang: 'x-default', href: '' },
        ],
      }),
    );
    expect(m).toMatchObject({
      pageLang: 'az',
      languages: ['az', 'en', 'ru'],
      regions: ['AZ', 'GB'],
    });
  });
});

describe('channels', () => {
  it('profiles, not shares, posts or plugins', () => {
    const p = (href: string) => socialProfile(href)?.handle ?? null;
    expect(p('https://www.instagram.com/kontakt_home/')).toBe('kontakt_home');
    expect(p('https://www.instagram.com/p/C1abc/')).toBeNull();
    expect(p('https://www.facebook.com/sharer/sharer.php?u=x')).toBeNull();
    expect(p('https://www.facebook.com/profile.php?id=100064')).toBe('100064');
    expect(p('https://www.tiktok.com/@irshad')).toBe('@irshad');
    expect(p('https://www.tiktok.com/tag/sale')).toBeNull();
    expect(p('https://www.youtube.com/c/KontaktHome-TV')).toBe('KontaktHome-TV');
    expect(p('https://www.youtube.com/watch?v=abc')).toBeNull();
    expect(p('https://uk.linkedin.com/company/gymshark')).toBe('company/gymshark');
    expect(p('https://www.linkedin.com/shareArticle?url=x')).toBeNull();
    expect(p('https://twitter.com/intent/tweet?text=x')).toBeNull();
    expect(p('https://x.com/HubSpot')).toBe('HubSpot');
    expect(p('https://t.me/kontakt_az')).toBe('kontakt_az');
    expect(p('https://t.me/share/url?url=x')).toBeNull();
    expect(p('https://www.pinterest.co.uk/gymshark/')).toBe('gymshark');
    expect(p('https://vk.com/share.php?url=x')).toBeNull();
  });

  it('apps from store links and smart banner meta', () => {
    expect(appLink('https://apps.apple.com/az/app/irshad/id1645503622')).toEqual({
      store: 'appstore',
      url: 'https://apps.apple.com/app/id1645503622',
      id: '1645503622',
    });
    expect(
      appLink('https://play.google.com/store/apps/details?id=az.irshad.irshad&hl=az')?.id,
    ).toBe('az.irshad.irshad');
    const c = readChannels(
      raw({
        meta: {
          'apple-itunes-app': 'app-id=111222333, app-argument=x',
          'google-play-app': 'app-id=com.shop.app',
        },
      }),
    );
    expect(c.apps.map((a) => a.id)).toEqual(['111222333', 'com.shop.app']);
  });

  it('WhatsApp numbers; a WhatsApp channel is not a chat (QA: bakuelectronics.az)', () => {
    expect(whatsappNumber('https://wa.me/994508286060?text=Salam')).toBe('+994508286060');
    expect(whatsappNumber('https://api.whatsapp.com/send?phone=994777770171')).toBe(
      '+994777770171',
    );
    expect(whatsappNumber('https://wa.me/message/ABCDEF')).toBe('https://wa.me/message/ABCDEF');
    expect(whatsappNumber('https://whatsapp.com/channel/0029Vb4c8tl0lwgz')).toBeNull();
    expect(whatsappNumber('https://example.com/whatsapp')).toBeNull();
  });

  it('one profile per network, the first; emails and phones cleaned, at most 3', () => {
    const c = readChannels(
      raw({
        links: [
          'https://www.instagram.com/brand',
          'https://www.instagram.com/brand.kids',
          'mailto:Sales@Brand.az?subject=Hi',
          'tel:+994 (12) 404-04-04',
          'tel:123',
        ],
        jsonld: [{ '@type': 'Organization', telephone: '+994 12 555 55 55' }],
      }),
    );
    expect(c.social.map((s) => s.handle)).toEqual(['brand']);
    expect(c.emails).toEqual(['sales@brand.az']);
    expect(c.phones).toEqual(['+994124040404', '+994125555555']);
  });
});

describe('lead capture', () => {
  it('ways with the tools behind them; Braze is not a lead form (QA: gymshark)', () => {
    const tools = [
      tool('klaviyo', 'Klaviyo', 'email'),
      tool('attentive', 'Attentive', 'email'),
      tool('onesignal', 'OneSignal', 'email', 'web push'),
      tool('jivo', 'Jivo', 'chat', 'chat'),
      tool('whatsapp', 'WhatsApp chat', 'chat', 'click to chat'),
      tool('kommo', 'Kommo (amoCRM)', 'crm', 'forms'),
      tool('braze', 'Braze', 'crm'),
    ];
    expect(leadCapture({ emailForm: false }, tools, { whatsapp: [] })).toEqual([
      { way: 'email', tools: ['Klaviyo'] },
      { way: 'sms', tools: ['Attentive'] },
      { way: 'push', tools: ['OneSignal'] },
      { way: 'chat', tools: ['Jivo'] },
      { way: 'whatsapp', tools: ['WhatsApp chat'] },
      { way: 'forms', tools: ['Kommo (amoCRM)'] },
    ]);
  });

  it('an email field or a WhatsApp number counts without a tool', () => {
    expect(leadCapture({ emailForm: true }, [], { whatsapp: ['+994501112233'] })).toEqual([
      { way: 'email', tools: [] },
      { way: 'whatsapp', tools: [] },
    ]);
    expect(leadCapture({ emailForm: false }, [], { whatsapp: [] })).toEqual([]);
  });
});
