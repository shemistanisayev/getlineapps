/** One realistic request per platform added in 1.1 (formats as the vendors' own tags send them). */
import { describe, expect, it } from 'vitest';
import { analyze, mergeFanOut } from './analyze.ts';
import { classifyRequest } from './classify.ts';
import { duplicateIssues, piiIssues, purchaseIdIssues } from './issues.ts';
import { isTracked, PLATFORM_LIST, SUPPORTED_COUNT } from './platforms.ts';
import type { Hit } from './types.ts';

const req = (url: string, body?: string, method = body ? 'POST' : 'GET', time = 1000) => ({
  id: 'r1',
  time,
  method,
  url,
  body,
});
const one = (url: string, body?: string) => {
  const hits = classifyRequest(req(url, body));
  return hits.map((h) => ({
    platform: h.platform,
    event: h.event,
    account: h.account,
    params: Object.fromEntries(h.params.map((p) => [p.key, p.value])),
  }));
};
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64');

describe('platform registry', () => {
  it('knows 50 platforms (no Other, no extra object data layers)', () => {
    expect(SUPPORTED_COUNT).toBe(50);
    expect(new Set(PLATFORM_LIST.map((p) => p.id)).size).toBe(PLATFORM_LIST.length);
  });
});

describe('analytics', () => {
  it('Universal Analytics: event and batch', () => {
    expect(
      one(
        'https://www.google-analytics.com/collect?v=1&tid=UA-1234-1&t=event&ec=cta&ea=click&el=hero&cid=1.2',
      ),
    ).toEqual([
      {
        platform: 'ua',
        event: 'click',
        account: 'UA-1234-1',
        params: { event_category: 'cta', event_action: 'click', event_label: 'hero' },
      },
    ]);
    const batch = one(
      'https://www.google-analytics.com/batch',
      'v=1&tid=UA-1-1&t=pageview&cid=1\nv=1&tid=UA-1-1&t=transaction&ti=T1&tr=10&cid=1',
    );
    expect(batch.map((h) => h.event)).toEqual(['pageview', 'transaction']);
  });

  it('GA4 on a server-side container with its own path, and never twice on google.com', () => {
    expect(
      one('https://sst.shop.com/abc/xyz?v=2&tid=G-AB12&cid=1.2&en=page_view')[0],
    ).toMatchObject({ platform: 'ga4', event: 'page_view' });
    expect(one('https://www.google.com/ccm/collect?v=2&tid=G-AB12&cid=1.2&en=page_view')).toEqual(
      [],
    );
  });

  it('Adobe Analytics: page view with eVars and a link event', () => {
    const [h] = one(
      'https://metrics.shop.com/b/ss/shopprod/1/JS-2.22.0/s123?pageName=home&v1=summer&c2=en&events=event5&g=https%3A%2F%2Fshop.com%2F',
    );
    expect(h).toMatchObject({ platform: 'adobe', event: 'pageview', account: 'shopprod' });
    expect(h!.params).toMatchObject({
      page_name: 'home',
      eVar1: 'summer',
      prop2: 'en',
      events: 'event5',
    });
    expect(
      one('https://x.sc.omtrdc.net/b/ss/rs1/1/JS/s1?pe=lnk_o&pev2=Add%20to%20cart')[0]!.event,
    ).toBe('Add to cart');
  });

  it('Adobe Web SDK: one hit per event', () => {
    const body = JSON.stringify({
      events: [
        {
          xdm: {
            eventType: 'commerce.productViews',
            web: { webPageDetails: { URL: 'https://s.com/p' } },
            commerce: { productViews: { value: 1 } },
          },
        },
      ],
    });
    expect(one('https://edge.adobedc.net/ee/v1/interact?configId=abc-123', body)).toEqual([
      {
        platform: 'aep',
        event: 'commerce.productViews',
        account: 'abc-123',
        params: { 'commerce.productViews.value': '1' },
      },
    ]);
  });

  it('Amplitude HTTP API v2', () => {
    const body = JSON.stringify({
      api_key: 'k1',
      events: [
        { event_type: 'Signed Up', event_properties: { plan: 'pro' } },
        { event_type: 'Viewed Page' },
      ],
    });
    expect(
      one('https://api2.amplitude.com/2/httpapi', body).map((h) => [h.event, h.account, h.params]),
    ).toEqual([
      ['Signed Up', 'k1', { plan: 'pro' }],
      ['Viewed Page', 'k1', {}],
    ]);
  });

  it('Mixpanel: base64 data in a form body, internals dropped', () => {
    const data = b64([
      {
        event: 'Purchase',
        properties: { token: 'tok', $os: 'Mac', amount: 20, distinct_id: 'u1' },
      },
    ]);
    expect(
      one('https://api-js.mixpanel.com/track/?verbose=1', `data=${encodeURIComponent(data)}`),
    ).toEqual([
      { platform: 'mixpanel', event: 'Purchase', account: 'tok', params: { amount: '20' } },
    ]);
  });

  it('Segment track, page and batch; RudderStack with the same format', () => {
    expect(
      one(
        'https://api.segment.io/v1/t',
        JSON.stringify({
          type: 'track',
          event: 'Order Completed',
          properties: { revenue: 9 },
          writeKey: 'wk',
        }),
      ),
    ).toEqual([
      { platform: 'segment', event: 'Order Completed', account: 'wk', params: { revenue: '9' } },
    ]);
    expect(
      one(
        'https://api.segment.io/v1/batch',
        JSON.stringify({ batch: [{ type: 'page', name: 'Home' }, { type: 'identify' }] }),
      ).map((h) => h.event),
    ).toEqual(['page', 'identify']);
    expect(
      one(
        'https://acme.dataplane.rudderstack.com/v1/track',
        JSON.stringify({ type: 'track', event: 'Lead' }),
      )[0],
    ).toMatchObject({ platform: 'rudderstack', event: 'Lead' });
  });

  it('PostHog capture, and no hit for feature flags', () => {
    expect(
      one(
        'https://us.i.posthog.com/e/?ip=1',
        JSON.stringify({
          event: 'signup',
          properties: { token: 'phc', plan: 'free', $browser: 'Chrome' },
        }),
      ),
    ).toEqual([{ platform: 'posthog', event: 'signup', account: 'phc', params: { plan: 'free' } }]);
    expect(one('https://us.i.posthog.com/decide/?v=3', '{}')).toEqual([]);
  });

  it('Heap page view', () => {
    expect(one('https://heapanalytics.com/h?a=123&u=1')[0]).toMatchObject({
      platform: 'heap',
      event: 'pageview',
      account: '123',
    });
  });

  it('Matomo: page view, event, goal, bulk; heartbeats ignored; Piwik PRO', () => {
    expect(
      one(
        'https://stats.shop.com/matomo.php?idsite=3&rec=1&action_name=Home&url=https%3A%2F%2Fshop.com',
      )[0],
    ).toMatchObject({ platform: 'matomo', event: 'pageview', account: '3' });
    expect(
      one('https://stats.shop.com/matomo.php?idsite=3&rec=1&e_c=Video&e_a=Play&e_n=intro')[0],
    ).toMatchObject({
      event: 'Play',
      params: { category: 'Video', action: 'Play', name: 'intro' },
    });
    expect(one('https://stats.shop.com/matomo.php?idsite=3&rec=1&ping=1')).toEqual([]);
    expect(
      one(
        'https://stats.shop.com/matomo.php',
        JSON.stringify({
          requests: ['?idsite=3&rec=1&idgoal=2&revenue=5', '?idsite=3&rec=1&action_name=x'],
        }),
      ).map((h) => h.event),
    ).toEqual(['goal', 'pageview']);
    expect(
      one('https://shop.piwik.pro/ppms.php?idsite=abc&rec=1&action_name=Home')[0],
    ).toMatchObject({ platform: 'piwikpro', event: 'pageview' });
  });

  it('Snowplow: tp2 POST with a self-describing event, page pings skipped', () => {
    const ue = {
      schema: 'iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0',
      data: { schema: 'iglu:com.acme/add_to_basket/jsonschema/1-0-0', data: { sku: 'A1' } },
    };
    const body = JSON.stringify({
      schema: 'iglu:...payload_data',
      data: [
        { e: 'pv', aid: 'shop', url: 'https://s.com' },
        { e: 'pp', aid: 'shop' },
        { e: 'ue', aid: 'shop', ue_pr: JSON.stringify(ue) },
      ],
    });
    expect(
      one('https://c.shop.com/com.snowplowanalytics.snowplow/tp2', body).map((h) => [
        h.event,
        h.params,
      ]),
    ).toEqual([
      ['page_view', {}],
      ['add_to_basket', { sku: 'A1' }],
    ]);
  });

  it('Yandex Metrica page view and goal', () => {
    expect(
      one(
        'https://mc.yandex.ru/watch/9876?page-url=https%3A%2F%2Fs.com%2F&browser-info=pv%3A1%3Aar%3A1',
      )[0],
    ).toMatchObject({ platform: 'yandex', event: 'pageview', account: '9876' });
    expect(
      one('https://mc.yandex.ru/watch/9876?page-url=goal%3A%2F%2Fs.com%2Forder_done')[0],
    ).toMatchObject({ event: 'order_done' });
  });

  it('Plausible custom event (also through a proxy)', () => {
    expect(
      one(
        'https://shop.com/api/event',
        JSON.stringify({ n: 'Signup', u: 'https://shop.com/', d: 'shop.com', p: { plan: 'pro' } }),
      ),
    ).toEqual([
      { platform: 'plausible', event: 'Signup', account: 'shop.com', params: { plan: 'pro' } },
    ]);
  });
});

describe('session recording', () => {
  it('loads and pages, but not the constant uploads', () => {
    expect(one('https://www.clarity.ms/tag/abc123')[0]).toMatchObject({
      platform: 'clarity',
      event: 'script',
      account: 'abc123',
    });
    expect(one('https://k.clarity.ms/collect', 'binary')).toEqual([]);
    expect(one('https://edge.fullstory.com/s/fs.js')[0]!.platform).toBe('fullstory');
    expect(one('https://rs.fullstory.com/rec/bundle', 'x')).toEqual([]);
    expect(one('https://cdn.mouseflow.com/projects/1a2b-3c.js')[0]).toMatchObject({
      platform: 'mouseflow',
      account: '1a2b-3c',
    });
    expect(one('https://t.contentsquare.net/uxa/abcd1234.js')[0]).toMatchObject({
      platform: 'contentsquare',
    });
  });
});

describe('ad pixels', () => {
  it('Google Ads: remarketing is not a conversion', () => {
    expect(
      one('https://googleads.g.doubleclick.net/pagead/viewthroughconversion/123/?random=1')[0]!
        .event,
    ).toBe('remarketing');
    expect(
      one(
        'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/123/?label=abc&value=5',
      )[0]!.event,
    ).toBe('conversion');
  });

  it('Floodlight activity', () => {
    expect(
      one(
        'https://ad.doubleclick.net/activity;src=1234;type=sales;cat=purch0;qty=1;cost=20;ord=99;u1=x?',
      )[0],
    ).toMatchObject({
      platform: 'floodlight',
      event: 'purch0',
      account: '1234',
      params: {
        type: 'sales',
        activity: 'purch0',
        quantity: '1',
        value: '20',
        order_id: '99',
        u1: 'x',
      },
    });
  });

  it('Microsoft UET custom event with revenue', () => {
    expect(
      one('https://bat.bing.com/action/0?ti=5555&evt=custom&ea=purchase&gv=10&gc=USD')[0],
    ).toMatchObject({
      platform: 'bing',
      event: 'purchase',
      account: '5555',
      params: { value: '10', currency: 'USD' },
    });
    expect(one('https://bat.bing.com/action/0?ti=5555&evt=pageLoad')[0]!.event).toBe('pageLoad');
  });

  it('LinkedIn page view and conversion', () => {
    expect(one('https://px.ads.linkedin.com/collect?v=2&fmt=js&pid=111&time=1')[0]).toMatchObject({
      platform: 'linkedin',
      event: 'pageview',
      account: '111',
    });
    expect(
      one('https://px.ads.linkedin.com/collect?pid=111&conversionId=999&fmt=gif')[0],
    ).toMatchObject({ event: 'conversion', params: { conversion_id: '999' } });
  });

  it('X, Pinterest, Snapchat, Reddit, Quora', () => {
    expect(
      one(
        `https://analytics.twitter.com/i/adsct?txn_id=o1&events=${encodeURIComponent('[["pageview",{}]]')}`,
      )[0],
    ).toMatchObject({ platform: 'x', event: 'pageview', account: 'o1' });
    expect(
      one(
        `https://ct.pinterest.com/v3/?event=checkout&tid=262&ed=${encodeURIComponent('{"value":10,"currency":"USD"}')}`,
      )[0],
    ).toMatchObject({
      platform: 'pinterest',
      event: 'checkout',
      account: '262',
      params: { value: '10', currency: 'USD' },
    });
    expect(
      one('https://tr.snapchat.com/p', 'pid=abc&ev=PURCHASE&price=5&currency=EUR&v=1')[0],
    ).toMatchObject({
      platform: 'snapchat',
      event: 'PURCHASE',
      account: 'abc',
      params: { value: '5', currency: 'EUR' },
    });
    expect(
      one(
        'https://alb.reddit.com/rp.gif?ts=1&id=t2_ab&event=Custom&m.customEventName=Quote&m.value=3',
      )[0],
    ).toMatchObject({ platform: 'reddit', event: 'Quote', account: 't2_ab' });
    expect(one('https://q.quora.com/_/ad/abc123/pixel?tag=Purchase&noscript=1')[0]).toMatchObject({
      platform: 'quora',
      event: 'Purchase',
      account: 'abc123',
    });
  });

  it('Criteo, Taboola, Outbrain, Amazon, Awin', () => {
    expect(
      one(
        `https://sslwidget.criteo.com/event?a=4321&v=5&p0=${encodeURIComponent('e=exd&site_type=d')}&p1=${encodeURIComponent('e=vp&p=SKU1')}`,
      )[0],
    ).toMatchObject({
      platform: 'criteo',
      event: 'viewItem',
      account: '4321',
      params: { products: 'SKU1' },
    });
    expect(
      one('https://trc.taboola.com/1234/log/3/unip?en=make_purchase&revenue=9&currency=USD')[0],
    ).toMatchObject({ platform: 'taboola', event: 'make_purchase', account: '1234' });
    expect(
      one('https://tr.outbrain.com/unifiedPixel?marketerId=00ab&name=Purchase&orderValue=9')[0],
    ).toMatchObject({ platform: 'outbrain', event: 'Purchase', account: '00ab' });
    expect(one('https://s.amazon-adsystem.com/iu3?cm3ppd=1&d=dtb-pub&csif=t')).toEqual([]);
    expect(
      one('https://www.awin1.com/sread.js?tt=ns&tv=2&merchant=777&amount=20&cr=GBP&ref=O1')[0],
    ).toMatchObject({
      platform: 'awin',
      event: 'conversion',
      account: '777',
      params: { value: '20', currency: 'GBP', order_ref: 'O1' },
    });
  });
});

describe('CRM and tag managers', () => {
  it('HubSpot, Klaviyo, Marketo, Pardot, Braze, Customer.io', () => {
    expect(
      one('https://track.hubspot.com/__ptq.gif?k=1&a=4455&pu=https%3A%2F%2Fs.com')[0],
    ).toMatchObject({ platform: 'hubspot', event: 'pageview', account: '4455' });
    const kl = {
      data: {
        type: 'event',
        attributes: {
          properties: { ProductID: '1' },
          metric: { data: { type: 'metric', attributes: { name: 'Viewed Product' } } },
        },
      },
    };
    expect(
      one('https://a.klaviyo.com/client/events/?company_id=AbC', JSON.stringify(kl))[0],
    ).toMatchObject({
      platform: 'klaviyo',
      event: 'Viewed Product',
      account: 'AbC',
      params: { ProductID: '1' },
    });
    expect(
      one('https://123-ABC-456.mktoresp.com/webevents/visitWebPage?_mchId=123-ABC-456')[0],
    ).toMatchObject({ platform: 'marketo', event: 'visitWebPage', account: '123-ABC-456' });
    expect(one('https://pi.pardot.com/analytics?piAId=111&piCId=222')[0]).toMatchObject({
      platform: 'pardot',
      event: 'pageview',
      account: '111',
    });
    expect(
      one(
        'https://sdk.iad-01.braze.com/api/v3/data/',
        JSON.stringify({
          api_key: 'k',
          events: [{ name: 'ce', data: { n: 'Trial Started', p: { plan: 'x' } } }, { name: 'ss' }],
        }),
      ).map((h) => h.event),
    ).toEqual(['Trial Started', 'session_start']);
    expect(
      one('https://cdp.customer.io/v1/t', JSON.stringify({ type: 'track', event: 'Lead' }))[0],
    ).toMatchObject({ platform: 'customerio', event: 'Lead' });
  });

  it('Google Tag, Tealium and Adobe Launch loads', () => {
    expect(
      one('https://www.googletagmanager.com/gtag/js?id=G-AB12&l=dataLayer&cx=c')[0],
    ).toMatchObject({ platform: 'gtag', account: 'G-AB12', params: { loaded_by: 'GTM' } });
    expect(one('https://tags.tiqcdn.com/utag/acme/main/prod/utag.js')[0]).toMatchObject({
      platform: 'tealium',
      event: 'container',
      account: 'acme/main',
    });
    expect(one('https://assets.adobedtm.com/abc/def/launch-1a2b3c.min.js')[0]).toMatchObject({
      platform: 'launch',
      account: 'launch-1a2b3c',
    });
    expect(isTracked('gtag')).toBe(false);
  });

  it('Optimizely, VWO and AB Tasty', () => {
    const op = {
      account_id: '42',
      visitors: [
        {
          snapshots: [
            {
              decisions: [{ campaign_id: 'c', experiment_id: 'e', variation_id: 'v' }],
              events: [
                { key: 'campaign_activated' },
                { key: 'add_to_cart', tags: { revenue: 100 } },
              ],
            },
          ],
        },
      ],
    };
    expect(
      one('https://logx.optimizely.com/v1/events', JSON.stringify(op)).map((h) => h.event),
    ).toEqual(['decision', 'add_to_cart']);
    expect(one('https://dev.visualwebsiteoptimizer.com/j.php?a=654&u=x')[0]).toMatchObject({
      platform: 'vwo',
      event: 'script',
      account: '654',
    });
    expect(
      one(
        'https://ariane.abtasty.com/',
        JSON.stringify({ t: 'EVENT', ea: 'click_cta', cid: 'abc' }),
      )[0],
    ).toMatchObject({ platform: 'abtasty', event: 'click_cta' });
  });
});

describe('custom rules and Other', () => {
  it('a Settings rule wins and reads the event from the body', () => {
    const [h] = classifyRequest(
      req('https://collect.acme.io/v2/ingest', JSON.stringify({ action: 'quote_sent', id: 1 })),
      0,
      {
        rules: [{ name: 'Acme', match: 'collect.acme.io', event: 'action' }],
      },
    );
    expect(h).toMatchObject({ platform: 'custom:Acme', event: 'quote_sent' });
  });

  it('Other only when asked, never for known vendors or plain pages', () => {
    const r = req('https://t.tracker.example/collect?site=1&ev=view');
    expect(classifyRequest(r)).toEqual([]);
    expect(classifyRequest(r, 0, { other: true })[0]).toMatchObject({
      platform: 'other',
      event: 'collect',
      account: 't.tracker.example',
    });
    expect(classifyRequest(req('https://k.clarity.ms/collect', 'x'), 0, { other: true })).toEqual(
      [],
    );
    expect(classifyRequest(req('https://shop.com/products/shoe'), 0, { other: true })).toEqual([]);
  });
});

describe('accuracy rules', () => {
  const hit = (over: Partial<Hit>): Hit => ({
    id: 'h',
    requestId: 'r',
    time: 1000,
    platform: 'ga4',
    event: 'purchase',
    route: 'browser',
    method: 'POST',
    url: 'https://www.google-analytics.com/g/collect',
    host: 'www.google-analytics.com',
    params: [],
    context: [],
    page: 0,
    account: 'G-1',
    ...over,
  });

  it('one event fanned out to two Google Ads hosts is one row, not a duplicate', () => {
    const a = hit({
      id: 'a',
      requestId: 'ra',
      platform: 'ads',
      event: 'conversion',
      url: 'https://www.googleadservices.com/pagead/conversion/1/',
      host: 'www.googleadservices.com',
    });
    const b = hit({
      id: 'b',
      requestId: 'rb',
      platform: 'ads',
      event: 'conversion',
      time: 1100,
      url: 'https://www.google.com/pagead/1p-conversion/1/',
      host: 'www.google.com',
    });
    const merged = mergeFanOut([a, b]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.alsoSentTo).toEqual(['www.google.com/pagead/1p-conversion/1']);
    expect(duplicateIssues(merged)).toEqual([]);
  });

  it('the same purchase sent twice within a second is a duplicate', () => {
    const p = [{ key: 'transaction_id', value: 'T1' }];
    const issues = duplicateIssues([
      hit({ id: 'a', requestId: 'ra', params: p }),
      hit({ id: 'b', requestId: 'rb', time: 1400, params: p }),
    ]);
    expect(issues.map((i) => [i.id, i.evidence])).toEqual([['DUPLICATE_EVENT', ['a', 'b']]]);
    expect(
      duplicateIssues([hit({ id: 'a', params: p }), hit({ id: 'b', time: 3000, params: p })]),
    ).toEqual([]);
  });

  it('GA4 purchase without transaction_id', () => {
    expect(purchaseIdIssues([hit({})]).map((i) => i.id)).toEqual(['PURCHASE_NO_ID']);
    expect(purchaseIdIssues([hit({ params: [{ key: 'transaction_id', value: 'T' }] })])).toEqual(
      [],
    );
  });

  it('plain e-mail in a tracking hit, not a hashed one', () => {
    expect(
      piiIssues([
        hit({ context: [{ key: 'page_location', value: 'https://s.com/?email=ann%40mail.com' }] }),
      ])[0],
    ).toMatchObject({ id: 'PII_EMAIL', data: { field: 'page_location' } });
    expect(piiIssues([hit({ params: [{ key: 'em', value: 'a'.repeat(64) }] })])).toEqual([]);
  });

  it('a session over several platforms lists them in registry order with their ids', () => {
    const a = analyze({
      requests: [
        req('https://bat.bing.com/action/0?ti=5555&evt=pageLoad', undefined, 'GET', 1000),
        {
          ...req(
            'https://region1.google-analytics.com/g/collect?v=2&tid=G-AB12&cid=1.2&en=page_view',
            undefined,
            'POST',
            1001,
          ),
          id: 'r2',
          body: '',
        },
      ],
      navigations: [{ time: 0, url: 'https://shop.com/' }],
      snapshots: [{ time: 2000, url: 'https://shop.com/', globals: ['clarity'] }],
    });
    expect(
      a.platforms.map((p) => [p.platform, p.events, p.accounts, p.loadedOnly ?? false]),
    ).toEqual([
      ['ga4', 1, ['G-AB12'], false],
      ['clarity', 0, [], true],
      ['bing', 1, ['5555'], false],
    ]);
  });
});
