/**
 * Vendor stubs for the Rivaline fixture (docs/rivaline-SPEC.md §11). Every vendor URL the fixture
 * sites load is answered here through Playwright routes, so no request leaves the machine. Each
 * script stub does what the real tag shows the page: it defines its globals, sets its cookies
 * (names only matter) and sends one request, so Rivaline sees Script, Global, Cookie and Request.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) =>
  readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

/** Sends a request the way pixels do; the route answers with a 1x1 GIF. */
const beacon = (url: string) => `new Image().src = ${JSON.stringify(url)};`;
const cookie = (name: string) => `document.cookie = ${JSON.stringify(`${name}=1; path=/`)};`;

/** Script bodies by URL pattern. Order matters: the first match answers. */
const SCRIPTS: Array<[RegExp, string]> = [
  [
    /^https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/,
    // The container: GA4 config (through gtag.js), the Google Ads remarketing tag.
    `(function () {
      var id = (document.currentScript && document.currentScript.src.match(/id=(GTM-[A-Z0-9]+)/) || [])[1];
      window.google_tag_manager = window.google_tag_manager || {};
      window.google_tag_manager[id] = { dataLayer: { name: 'dataLayer' } };
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'gtm.dom' });
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-8XK2LM4QPZ&l=dataLayer&cx=c';
      document.head.appendChild(s);
      ${cookie('_gcl_au')}
      ${beacon('https://googleads.g.doubleclick.net/pagead/viewthroughconversion/11284956/?random=1&cv=11&fst=1')}
    })();`,
  ],
  [
    /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/,
    `(function () {
      var id = (document.currentScript && document.currentScript.src.match(/id=(G-[A-Z0-9]+)/) || [])[1];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      ${cookie('_ga')}
      document.cookie = '_ga_' + id.slice(2) + '=1; path=/';
      new Image().src = 'https://www.google-analytics.com/g/collect?v=2&tid=' + id + '&en=page_view';
    })();`,
  ],
  [
    /^https:\/\/connect\.facebook\.net\/.*fbevents\.js/,
    `(function () {
      var q = (window.fbq && window.fbq.queue) || [];
      var id = '';
      for (var i = 0; i < q.length; i++) if (q[i][0] === 'init') id = q[i][1];
      ${cookie('_fbp')}
      new Image().src = 'https://www.facebook.com/tr/?id=' + id + '&ev=PageView&noscript=1';
    })();`,
  ],
  [
    /^https:\/\/analytics\.tiktok\.com\/i18n\/pixel\/events\.js/,
    `(function () {
      ${cookie('_ttp')}
      ${beacon('https://analytics.tiktok.com/api/v2/pixel?event=Pageview')}
    })();`,
  ],
  [
    /^https:\/\/s\.pinimg\.com\/ct\/core\.js/,
    `(function () {
      var q = (window.pintrk && window.pintrk.queue) || [];
      var id = '';
      for (var i = 0; i < q.length; i++) if (q[i][0] === 'load') id = q[i][1];
      ${cookie('_pin_unauth')}
      new Image().src = 'https://ct.pinterest.com/v3/?tid=' + id + '&event=init';
    })();`,
  ],
  [
    /^https:\/\/static\.hotjar\.com\/c\/hotjar-(\d+)\.js/,
    `(function () {
      var id = window._hjSettings && window._hjSettings.hjid;
      window.hjSiteSettings = { site_id: id };
      document.cookie = '_hjSessionUser_' + id + '=1; path=/';
      ${beacon('https://vc.hotjar.io/sessions/start')}
    })();`,
  ],
  [/^https:\/\/chimpstatic\.com\/mcjs-connected\//, `/* Mailchimp site connection stub */`],
  [
    /^https:\/\/widget\.intercom\.io\/widget\//,
    `(function () {
      var id = (window.intercomSettings || {}).app_id;
      window.Intercom = function () {};
      document.cookie = 'intercom-id-' + id + '=1; path=/';
      ${beacon('https://api-iam.intercom.io/messenger/web/ping')}
    })();`,
  ],
  [
    /^https:\/\/widget\.trustpilot\.com\//,
    `window.Trustpilot = { loadFromElement: function () {} };`,
  ],
  [
    /^https:\/\/js\.klarna\.com\//,
    `window.Klarna = { OnsiteMessaging: { refresh: function () {} } };`,
  ],
  [
    /^https:\/\/www\.paypal\.com\/sdk\/js/,
    `window.paypal = { Messages: function () { return { render: function () {} }; } };`,
  ],
  [/^https:\/\/cdn\.shopify\.com\//, `${'/* Shopify storefront stub */'}\n${cookie('_shopify_y')}`],
  [
    /^https:\/\/static\.klaviyo\.com\//,
    `window._learnq = window._learnq || []; window.klaviyo = window.klaviyo || [];`,
  ],
  [
    /^https:\/\/consent\.cookiebot\.com\//,
    `window.Cookiebot = { consent: {} }; ${cookie('CookieConsent')}`,
  ],
];

/** Fonts for Kova (Fraunces, DM Sans), as if served by Google Fonts. */
const GOOGLE_CSS = `@font-face { font-family: 'Fraunces'; font-weight: 600; font-display: swap;
  src: url(https://fonts.gstatic.com/s/kova/fraunces-600.woff2) format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 400; font-display: swap;
  src: url(https://fonts.gstatic.com/s/kova/dm-sans-400.woff2) format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 500; font-display: swap;
  src: url(https://fonts.gstatic.com/s/kova/dm-sans-500.woff2) format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 600; font-display: swap;
  src: url(https://fonts.gstatic.com/s/kova/dm-sans-600.woff2) format('woff2'); }
`;
const FONT_FILES: Record<string, () => Buffer> = {
  'fraunces-600.woff2': () => font('fraunces', 'fraunces-latin-600-normal.woff2'),
  'dm-sans-400.woff2': () => font('dm-sans', 'dm-sans-latin-400-normal.woff2'),
  'dm-sans-500.woff2': () => font('dm-sans', 'dm-sans-latin-500-normal.woff2'),
  'dm-sans-600.woff2': () => font('dm-sans', 'dm-sans-latin-600-normal.woff2'),
};

export interface VendorResponse {
  status: number;
  contentType?: string;
  body?: string | Buffer;
  headers?: Record<string, string>;
}

/** The answer for any https URL a fixture site requests. Unknown vendors get an empty 204. */
export function vendorResponse(url: string): VendorResponse {
  const cors = { 'access-control-allow-origin': '*' };
  if (url.startsWith('https://fonts.googleapis.com/'))
    return { status: 200, contentType: 'text/css', body: GOOGLE_CSS, headers: cors };
  if (url.startsWith('https://fonts.gstatic.com/')) {
    const file = FONT_FILES[url.split('/').pop() ?? ''];
    if (file) return { status: 200, contentType: 'font/woff2', body: file(), headers: cors };
  }
  const script = SCRIPTS.find(([p]) => p.test(url));
  if (script) return { status: 200, contentType: 'application/javascript', body: script[1] };
  return { status: 200, contentType: 'image/gif', body: GIF };
}

/** Minimal route API shared by Playwright contexts and scripts. */
export interface RoutableContext {
  route(
    url: RegExp,
    handler: (route: {
      request(): { url(): string };
      fulfill(r: VendorResponse): Promise<void>;
    }) => Promise<void>,
  ): Promise<unknown>;
}

/** Answers every https request locally. The fixture sites themselves are http. */
export async function routeRivalineVendors(context: RoutableContext): Promise<void> {
  await context.route(/^https:\/\//, (route) =>
    route.fulfill(vendorResponse(route.request().url())),
  );
}
