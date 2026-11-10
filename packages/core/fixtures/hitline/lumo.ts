/**
 * Lumo shop scenarios: the one source of truth for the Hitline fixture.
 * - Core tests turn them into a SessionInput with the design's timestamps (sessionFromScenario).
 * - apps/fixture serves them to the shop page, which fires the same requests in a real browser.
 * Lumo, example.com, pay.example.net and every id below are fictional.
 *
 * Runs (docs/hitline/PLAN.md, decision 1):
 * - events:  returning visitor who accepted; Events, GTM, Plan and the popup artboards
 * - consent: first visit, "Reject all"; the Consent artboard
 * - journey: campaign link to order confirmation over 5 pages; the Attribution artboard
 * - clean:   the same shop set up correctly; QA proof that Hitline raises no false alarms
 */
import type { SessionInput } from '../../src/hitline/types.ts';

export type Trigger = 'load' | 'add' | 'cart' | 'checkout' | 'signup' | 'reject' | 'accept';
export type RunId = 'events' | 'consent' | 'journey' | 'clean';

export interface RequestStep {
  t: string;
  on: Trigger;
  req: { method: 'GET' | 'POST'; url: string; body?: string; setCookie?: string };
}
export interface DataLayerStep {
  t: string;
  on: Trigger;
  dl: unknown;
}
export type Step = RequestStep | DataLayerStep;

export interface ScenarioPage {
  /** Navigation time, hh:mm:ss.mmm on DATE. */
  at: string;
  url: string;
  title: string;
  cookies: Record<string, string>;
  steps: Step[];
}

export interface Scenario {
  id: RunId;
  pages: ScenarioPage[];
}

export const LUMO_DATE = '2026-11-06';
export const GA4_ID = 'G-4LMX82PQ1S';
export const GTM_ID = 'GTM-K7P2QX';
export const META_ID = '1234567890123456';
export const TIKTOK_ID = 'CTLUMO12345';
export const ADS_ID = '987654321';
export const SGTM = 'https://data.example.com';
export const PRODUCT_URL = 'https://example.com/products/wireless-headphones-pro-x';
export const CID = '1873049951.1731404538';
export const PAY_CID = '2093847561.1731404601';
export const FPID_COOKIE =
  'FPID=FPID2.2.kq7Zk1lYp0mB3x.1731404538; Max-Age=34560000; Path=/; Domain=example.com; Secure; HttpOnly; SameSite=Lax';

/** Wall-clock time of a step in UTC ms. */
export function at(time: string): number {
  return Date.parse(`${LUMO_DATE}T${time}Z`);
}

const ITEM = {
  item_id: 'LUMO-PRO-X',
  item_name: 'Wireless Headphones Pro X',
  price: 89.9,
  quantity: 1,
};
const GA4_ITEM = 'idLUMO-PRO-X~nmWireless Headphones Pro X~pr89.90~qt1';

function qs(params: [string, string][]): string {
  return params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

const DENIED = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
};
const GRANTED = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
};

interface Ga4Opts {
  host?: string;
  page: string;
  title?: string;
  referrer?: string;
  cid?: string;
  granted: boolean;
  updated: boolean;
  params?: [string, string][];
  ecommerce?: boolean;
}

function ga4(t: string, on: Trigger, en: string, o: Ga4Opts): RequestStep {
  const gcs = o.granted ? 'G111' : 'G100';
  const letter = o.granted ? (o.updated ? 'r' : 't') : o.updated ? 'q' : 'p';
  const params: [string, string][] = [
    ['v', '2'],
    ['tid', GA4_ID],
    ['en', en],
    ['gcs', gcs],
    ...(o.ecommerce
      ? ([
          ['cu', 'USD'],
          ['epn.value', '89.90'],
          ['pr1', GA4_ITEM],
        ] as [string, string][])
      : []),
    ...(o.params ?? []),
    ['gcd', `13${letter}3${letter}3${letter}3${letter}5l1`],
    ['cid', o.cid ?? CID],
    ['sid', '1731404538'],
    ['dl', o.page],
    ...(o.referrer ? ([['dr', o.referrer]] as [string, string][]) : []),
    ['dt', o.title ?? 'Wireless Headphones Pro X | Lumo'],
  ];
  return {
    t,
    on,
    req: {
      method: 'POST',
      url: `${o.host ?? SGTM}/g/collect?${qs(params)}`,
      // Like a real server container: FPID only for hits with analytics consent.
      ...((o.host ?? SGTM) === SGTM && o.granted ? { setCookie: FPID_COOKIE } : {}),
    },
  };
}

function meta(
  t: string,
  on: Trigger,
  ev: string,
  page: string,
  cd: [string, string][] = [],
): RequestStep {
  const params: [string, string][] = [
    ['id', META_ID],
    ['ev', ev],
    ['dl', page],
    ...cd.map(([k, v]) => [`cd[${k}]`, v] as [string, string]),
  ];
  return { t, on, req: { method: 'GET', url: `https://www.facebook.com/tr/?${qs(params)}` } };
}

function tiktok(
  t: string,
  on: Trigger,
  event: string,
  page: string,
  properties: object = {},
): RequestStep {
  return {
    t,
    on,
    req: {
      method: 'POST',
      url: 'https://analytics.tiktok.com/api/v2/pixel',
      body: JSON.stringify({
        event,
        event_id: `${event}-${t}`,
        pixel_code: TIKTOK_ID,
        context: { page: { url: page } },
        properties,
      }),
    },
  };
}

const gtmLoad = (t: string): RequestStep => ({
  t,
  on: 'load',
  req: { method: 'GET', url: `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}` },
});
const dl = (t: string, on: Trigger, value: unknown): DataLayerStep => ({ t, on, dl: value });
const ecommerce = (event: string) => ({
  event,
  ecommerce: { currency: 'USD', value: 89.9, items: [ITEM] },
});
const config = (t: string): DataLayerStep =>
  dl(t, 'load', ['config', GA4_ID, { server_container_url: SGTM }]);

const SHOP_COOKIES = {
  _ga: `GA1.1.${CID}`,
  _ga_4LMX82PQ1S: 'GS1.1.1731404538.1.1.1731404551.0.0.0',
  _fbp: 'fb.1.1731404538.582917364',
  _ttp: '2kQ9bL7xTn3vR8cYp1MdZw0sFgH',
};

const events: Scenario = {
  id: 'events',
  pages: [
    {
      at: '10:42:17.900',
      url: PRODUCT_URL,
      title: 'Wireless Headphones Pro X | Lumo',
      cookies: SHOP_COOKIES,
      steps: [
        dl('10:42:18.000', 'load', ['consent', 'default', { ...DENIED, wait_for_update: 500 }]),
        dl('10:42:18.010', 'load', ['consent', 'update', GRANTED]),
        config('10:42:18.020'),
        gtmLoad('10:42:18.100'),
        ga4('10:42:18.204', 'load', 'page_view', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
        }),
        meta('10:42:18.310', 'load', 'PageView', PRODUCT_URL),
        tiktok('10:42:18.355', 'load', 'Pageview', PRODUCT_URL),
        dl('10:42:19.020', 'load', ecommerce('view_item')),
        ga4('10:42:19.102', 'load', 'view_item', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
          ecommerce: true,
        }),
        meta('10:42:19.140', 'load', 'ViewContent', PRODUCT_URL, [
          ['content_ids', '["LUMO-PRO-X"]'],
          ['value', '89.90'],
          ['currency', 'USD'],
        ]),
        dl('10:42:31.876', 'add', ecommerce('add_to_cart')),
        ga4('10:42:31.950', 'add', 'add_to_cart', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
          ecommerce: true,
        }),
        // The bug the design shows: Meta AddToCart without value and currency.
        meta('10:42:32.004', 'add', 'AddToCart', PRODUCT_URL, [
          ['content_ids', '["LUMO-PRO-X"]'],
          ['content_type', 'product'],
        ]),
        {
          t: '10:42:32.050',
          on: 'add',
          req: {
            method: 'GET',
            url: `https://www.googleadservices.com/pagead/conversion/${ADS_ID}/?${qs([
              ['label', 'Lm3nOpQrStU'],
              ['value', '89.90'],
              ['currency_code', 'USD'],
              ['gcs', 'G111'],
              ['gcd', '13r3r3r3r5l1'],
              ['url', PRODUCT_URL],
            ])}`,
          },
        },
        tiktok('10:42:32.091', 'add', 'AddToCart', PRODUCT_URL, {
          value: 89.9,
          currency: 'USD',
          contents: [{ content_id: 'LUMO-PRO-X', quantity: 1 }],
          content_type: 'product',
        }),
        ga4('10:42:35.410', 'cart', 'view_cart', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
          ecommerce: true,
        }),
        // The checkout button pushes to the dataLayer, but no GA4 tag listens.
        dl('10:42:38.220', 'checkout', ecommerce('begin_checkout')),
        // Newsletter sign-up sends an empty method.
        ga4('10:42:44.730', 'signup', 'sign_up', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
          params: [['ep.method', '']],
        }),
      ],
    },
  ],
};

const consent: Scenario = {
  id: 'consent',
  pages: [
    {
      at: '10:41:01.800',
      url: PRODUCT_URL,
      title: 'Wireless Headphones Pro X | Lumo',
      cookies: {},
      steps: [
        dl('10:41:01.900', 'load', ['consent', 'default', { ...DENIED, wait_for_update: 500 }]),
        config('10:41:01.950'),
        gtmLoad('10:41:02.000'),
        ga4('10:41:02.118', 'load', 'page_view', {
          page: PRODUCT_URL,
          granted: false,
          updated: false,
          cid: '',
        }),
        meta('10:41:02.240', 'load', 'PageView', PRODUCT_URL),
        dl('10:41:09.480', 'reject', ['consent', 'update', DENIED]),
        dl('10:41:09.495', 'reject', ecommerce('view_item')),
        ga4('10:41:09.513', 'reject', 'view_item', {
          page: PRODUCT_URL,
          granted: false,
          updated: true,
          ecommerce: true,
          cid: '',
        }),
        tiktok('10:41:09.602', 'reject', 'ViewContent', PRODUCT_URL, {
          value: 89.9,
          currency: 'USD',
          contents: [{ content_id: 'LUMO-PRO-X' }],
        }),
      ],
    },
  ],
};

const CAMPAIGN_URL =
  'https://example.com/campaign/fall-sale?utm_source=google&utm_medium=cpc&utm_campaign=fall_sale&gclid=Cj0KCQiA2KitBhCIARIsAPPMEhJ';
const GCL_AW = 'GCL.1731404580.Cj0KCQiA2KitBhCIARIsAPPMEhJ';

function journeyPage(
  atTime: string,
  url: string,
  title: string,
  cookies: Record<string, string>,
  referrer: string | undefined,
  extra: Step[] = [],
  host?: string,
  cid?: string,
): ScenarioPage {
  const [h, m, s] = atTime.split(':') as [string, string, string];
  const plus = (ms: number) => {
    const total = Number(s) * 1000 + ms;
    return `${h}:${m}:${String(Math.floor(total / 1000)).padStart(2, '0')}.${String(total % 1000).padStart(3, '0')}`;
  };
  return {
    at: atTime,
    url,
    title,
    cookies,
    steps: [
      dl(plus(100), 'load', ['consent', 'default', { ...DENIED, wait_for_update: 500 }]),
      dl(plus(110), 'load', ['consent', 'update', GRANTED]),
      ...(host ? [] : [config(plus(120)), gtmLoad(plus(150))]),
      ga4(plus(260), 'load', 'page_view', {
        host,
        page: url,
        title,
        referrer,
        cid,
        granted: true,
        updated: true,
      }),
      ...extra,
    ],
  };
}

const journey: Scenario = {
  id: 'journey',
  pages: [
    journeyPage(
      '10:43:00.000',
      CAMPAIGN_URL,
      'Fall sale | Lumo',
      { _ga: `GA1.1.${CID}` },
      undefined,
    ),
    journeyPage(
      '10:43:12.000',
      PRODUCT_URL,
      'Wireless Headphones Pro X | Lumo',
      { _ga: `GA1.1.${CID}`, _gcl_aw: GCL_AW },
      CAMPAIGN_URL,
    ),
    journeyPage(
      '10:43:25.000',
      'https://example.com/cart',
      'Cart | Lumo',
      { _ga: `GA1.1.${CID}`, _gcl_aw: GCL_AW },
      PRODUCT_URL,
    ),
    // The payment page lives on another domain and the link does not carry _gl.
    journeyPage(
      '10:43:40.000',
      'https://pay.example.net/checkout',
      'Payment | Lumo Pay',
      { _ga: `GA1.1.${PAY_CID}` },
      'https://example.com/cart',
      [],
      'https://region1.google-analytics.com',
      PAY_CID,
    ),
    journeyPage(
      '10:44:05.000',
      'https://example.com/order/confirmation',
      'Order confirmed | Lumo',
      { _ga: `GA1.1.${CID}`, _gcl_aw: GCL_AW },
      'https://pay.example.net/',
      [
        ga4('10:44:05.400', 'load', 'purchase', {
          page: 'https://example.com/order/confirmation',
          title: 'Order confirmed | Lumo',
          referrer: 'https://pay.example.net/',
          granted: true,
          updated: true,
          ecommerce: true,
          params: [['ep.transaction_id', 'LUMO-10482']],
        }),
      ],
    ),
  ],
};

/** Correct setup: consent respected, every ecommerce event with value and currency. */
const clean: Scenario = {
  id: 'clean',
  pages: [
    {
      at: '10:45:00.000',
      url: PRODUCT_URL,
      title: 'Wireless Headphones Pro X | Lumo',
      cookies: SHOP_COOKIES,
      steps: [
        dl('10:45:00.100', 'load', ['consent', 'default', { ...DENIED, wait_for_update: 500 }]),
        dl('10:45:00.110', 'load', ['consent', 'update', GRANTED]),
        config('10:45:00.120'),
        gtmLoad('10:45:00.150'),
        ga4('10:45:00.300', 'load', 'page_view', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
        }),
        meta('10:45:00.400', 'load', 'PageView', PRODUCT_URL),
        tiktok('10:45:00.450', 'load', 'Pageview', PRODUCT_URL),
        dl('10:45:01.000', 'load', ecommerce('view_item')),
        ga4('10:45:01.100', 'load', 'view_item', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
          ecommerce: true,
        }),
        meta('10:45:01.150', 'load', 'ViewContent', PRODUCT_URL, [
          ['content_ids', '["LUMO-PRO-X"]'],
          ['value', '89.90'],
          ['currency', 'USD'],
        ]),
        dl('10:45:05.000', 'add', ecommerce('add_to_cart')),
        ga4('10:45:05.080', 'add', 'add_to_cart', {
          page: PRODUCT_URL,
          granted: true,
          updated: true,
          ecommerce: true,
        }),
        meta('10:45:05.120', 'add', 'AddToCart', PRODUCT_URL, [
          ['content_ids', '["LUMO-PRO-X"]'],
          ['value', '89.90'],
          ['currency', 'USD'],
        ]),
        tiktok('10:45:05.160', 'add', 'AddToCart', PRODUCT_URL, {
          value: 89.9,
          currency: 'USD',
          contents: [{ content_id: 'LUMO-PRO-X', quantity: 1 }],
        }),
      ],
    },
  ],
};

export const LUMO_SCENARIOS: Record<RunId, Scenario> = { events, consent, journey, clean };

/** The 8-event plan from design/hitline/Plan.dc.html. */
export const LUMO_PLAN_CSV = `event,platform,parameters
generate_lead,GA4,"form_id"
begin_checkout,GA4,"currency,value,items"
AddToCart,Meta,"value,currency,content_ids"
sign_up,GA4,"method"
page_view,GA4,"page_location"
view_item,GA4,"currency,value,items"
add_to_cart,GA4,"currency,value,items"
ViewContent,Meta,"content_ids,value"
`;

/**
 * A scenario as DevTools would record it. `gtmBody` is the fake container
 * (fixtures/hitline/gtm-K7P2QX.js), passed in so this file stays free of fs.
 */
export function sessionFromScenario(s: Scenario, gtmBody?: string): SessionInput {
  const session: SessionInput = { requests: [], navigations: [], snapshots: [], gtmScripts: [] };
  let n = 0;
  for (const page of s.pages) {
    session.navigations.push({ time: at(page.at), url: page.url });
    session.snapshots.push({ time: at(page.at) + 1, url: page.url, cookies: page.cookies });
    for (const step of page.steps) {
      const time = at(step.t);
      if ('dl' in step) {
        session.snapshots.push({
          time,
          url: page.url,
          dataLayer: [{ time, value: step.dl }],
          cookies: page.cookies,
          gtmIds: [GTM_ID],
        });
      } else {
        session.requests.push({
          id: `req-${++n}`,
          time,
          method: step.req.method,
          url: step.req.url,
          body: step.req.body,
          responseHeaders: step.req.setCookie
            ? [{ name: 'set-cookie', value: step.req.setCookie }]
            : [],
        });
      }
    }
  }
  if (gtmBody) session.gtmScripts!.push({ id: GTM_ID, body: gtmBody });
  return session;
}
