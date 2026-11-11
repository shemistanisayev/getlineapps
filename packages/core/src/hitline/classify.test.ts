import { describe, expect, it } from 'vitest';
import { classifyRequest, dataLayerHit, routeFor } from './classify.ts';
import { decodeGa4Item, ga4Params, parseQuery } from './decode.ts';
import { isSubdomainOf, registrableDomain } from './domain.ts';
import type { RawRequest } from './types.ts';

const req = (url: string, extra: Partial<RawRequest> = {}): RawRequest => ({
  id: 'r1',
  time: 1000,
  method: 'GET',
  url,
  ...extra,
});

describe('domain', () => {
  it('finds the registrable domain', () => {
    expect(registrableDomain('data.example.com')).toBe('example.com');
    expect(registrableDomain('shop.example.co.uk')).toBe('example.co.uk');
    expect(registrableDomain('www.lumo.com.az')).toBe('lumo.com.az');
    expect(registrableDomain('https://pay.example.net/checkout')).toBe('example.net');
    expect(registrableDomain('data.shop.localhost')).toBe('shop.localhost');
    expect(isSubdomainOf('data.example.com', 'example.com')).toBe(true);
    expect(isSubdomainOf('example.com', 'example.com')).toBe(false);
  });
});

describe('decoders', () => {
  it('decodes query strings with + and percent escapes', () => {
    expect(parseQuery('?a=1&b=two+words&c=%5B1%5D&d')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: 'two words' },
      { key: 'c', value: '[1]' },
      { key: 'd', value: '' },
    ]);
  });

  it('decodes GA4 items and splits params from context', () => {
    expect(decodeGa4Item(0, 'idX~nmName~pr9.5~qt2~zzignored')).toEqual([
      { key: 'items[0].item_id', value: 'X' },
      { key: 'items[0].item_name', value: 'Name' },
      { key: 'items[0].price', value: '9.5' },
      { key: 'items[0].quantity', value: '2' },
    ]);
    const { params, context } = ga4Params(
      parseQuery('cu=USD&epn.value=1&ep.method=email&dl=https%3A%2F%2Fa.com%2F&cid=1.2&tid=G-X'),
    );
    expect(params).toEqual([
      { key: 'currency', value: 'USD' },
      { key: 'value', value: '1' },
      { key: 'method', value: 'email' },
    ]);
    expect(context).toEqual([
      { key: 'page_location', value: 'https://a.com/' },
      { key: 'client_id', value: '1.2' },
    ]);
  });
});

describe('classifiers', () => {
  it('GA4 on any host, routed sGTM when not Google', () => {
    const [hit] = classifyRequest(
      req('https://data.example.com/g/collect?v=2&tid=G-4LMX82PQ1S&en=add_to_cart&gcs=G111&cu=USD'),
    );
    expect(hit).toMatchObject({
      platform: 'ga4',
      event: 'add_to_cart',
      route: 'sgtm',
      account: 'G-4LMX82PQ1S',
      gcs: 'G111',
      host: 'data.example.com',
    });
    const [vendor] = classifyRequest(
      req('https://region1.google-analytics.com/g/collect?v=2&tid=G-1&en=page_view'),
    );
    expect(vendor!.route).toBe('browser');
  });

  it('GA4 rejects UA, missing tid and v=1', () => {
    expect(
      classifyRequest(req('https://www.google-analytics.com/g/collect?v=1&tid=G-1&en=x')),
    ).toEqual([]);
    expect(
      classifyRequest(req('https://www.google-analytics.com/g/collect?v=2&tid=UA-1&en=x')),
    ).toEqual([]);
  });

  it('GA4 batched POST gives one hit per body line', () => {
    const hits = classifyRequest(
      req('https://www.google-analytics.com/g/collect?v=2&tid=G-1&cid=9.9&gcs=G100', {
        method: 'POST',
        body: 'en=page_view&dl=https%3A%2F%2Fa.com\r\nen=scroll&epn.percent_scrolled=90',
      }),
    );
    expect(hits.map((h) => h.event)).toEqual(['page_view', 'scroll']);
    expect(hits.map((h) => h.id)).toEqual(['r1#0', 'r1#1']);
    expect(hits[1]!.params).toEqual([{ key: 'percent_scrolled', value: '90' }]);
    expect(hits[0]!.gcs).toBe('G100');
  });

  it('Google Ads conversions on all three endpoints', () => {
    for (const url of [
      'https://www.googleadservices.com/pagead/conversion/987/?label=L1&value=1&currency_code=USD',
      'https://www.google.com/pagead/1p-conversion/987/?label=L1',
      'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/987/?label=L1',
    ]) {
      expect(classifyRequest(req(url))[0]).toMatchObject({
        platform: 'ads',
        event: 'conversion',
        account: '987',
      });
    }
    const [hit] = classifyRequest(
      req(
        'https://www.googleadservices.com/pagead/conversion/987/?label=L1&value=1&currency_code=USD',
      ),
    );
    expect(hit!.params).toEqual([
      { key: 'label', value: 'L1' },
      { key: 'value', value: '1' },
      { key: 'currency', value: 'USD' },
    ]);
    expect(
      classifyRequest(req('https://www.googleadservices.com/pagead/conversion_async.js')),
    ).toEqual([]);
  });

  it('Meta Pixel GET, POST and first-party gateways', () => {
    const [get] = classifyRequest(
      req(
        'https://www.facebook.com/tr/?id=123&ev=AddToCart&cd[content_ids]=%5B%22A%22%5D&cd[value]=9',
      ),
    );
    expect(get).toMatchObject({
      platform: 'meta',
      event: 'AddToCart',
      route: 'browser',
      account: '123',
    });
    expect(get!.params).toEqual([
      { key: 'content_ids', value: '["A"]' },
      { key: 'value', value: '9' },
    ]);
    const [post] = classifyRequest(
      req('https://www.facebook.com/tr', {
        method: 'POST',
        body: 'id=123&ev=Purchase&cd%5Bvalue%5D=5',
      }),
    );
    expect(post).toMatchObject({ event: 'Purchase', params: [{ key: 'value', value: '5' }] });
    const [gw] = classifyRequest(req('https://capi.example.com/tr?id=123&ev=Lead'));
    expect(gw).toMatchObject({ platform: 'meta', route: 'sgtm' });
    expect(classifyRequest(req('https://example.com/tr?foo=1'))).toEqual([]);
  });

  it('TikTok Pixel reads the JSON body; without it the event is unknown', () => {
    const [hit] = classifyRequest(
      req('https://analytics.tiktok.com/api/v2/pixel', {
        method: 'POST',
        body: JSON.stringify({
          event: 'AddToCart',
          pixel_code: 'C1',
          properties: { value: 1, currency: 'USD', contents: [{ content_id: 'A' }] },
          context: { page: { url: 'https://a.com/' } },
        }),
      }),
    );
    expect(hit).toMatchObject({ platform: 'tiktok', event: 'AddToCart', account: 'C1' });
    expect(hit!.params).toContainEqual({ key: 'contents[0].content_id', value: 'A' });
    expect(classifyRequest(req('https://analytics.tiktok.com/api/v2/pixel'))[0]!.event).toBe(
      '(unknown)',
    );
  });

  it('Hotjar script and GTM containers (vendor and first-party)', () => {
    expect(
      classifyRequest(req('https://static.hotjar.com/c/hotjar-3712345.js?sv=6'))[0],
    ).toMatchObject({
      platform: 'hotjar',
      event: 'script',
      account: '3712345',
    });
    expect(
      classifyRequest(req('https://www.googletagmanager.com/gtm.js?id=GTM-K7P2QX'))[0],
    ).toMatchObject({
      platform: 'gtm',
      account: 'GTM-K7P2QX',
      route: 'browser',
    });
    expect(classifyRequest(req('https://data.example.com/gtm.js?id=GTM-K7P2QX'))[0]!.route).toBe(
      'sgtm',
    );
    expect(classifyRequest(req('https://example.com/app.js'))).toEqual([]);
    expect(classifyRequest(req('not a url'))).toEqual([]);
  });

  it('dataLayer pushes with an event become Page hits; gtm.* become GTM hits, commands do not', () => {
    const hit = dataLayerHit(
      {
        time: 5,
        value: { event: 'add_to_cart', ecommerce: { value: 1, items: [{ item_id: 'A' }] } },
      },
      'dl-1',
      0,
      'https://example.com/',
    );
    expect(hit).toMatchObject({ platform: 'datalayer', route: 'page', event: 'add_to_cart' });
    expect(hit!.params).toEqual([
      { key: 'value', value: '1' },
      { key: 'items[0].item_id', value: 'A' },
    ]);
    expect(
      dataLayerHit({ time: 5, value: { event: 'gtm.js', 'gtm.start': 7 } }, 'x', 0, ''),
    ).toMatchObject({ platform: 'gtm', event: 'gtm.js', time: 7 });
    expect(dataLayerHit({ time: 5, value: ['consent', 'default', {}] }, 'x', 0, '')).toBeNull();
    expect(routeFor('datalayer', '')).toBe('page');
  });
});
