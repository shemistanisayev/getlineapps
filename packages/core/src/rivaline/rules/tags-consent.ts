import type { Rule } from '../types.ts';
import { c, cp, u } from './helpers.ts';

export const TAG_MANAGEMENT: Rule[] = [
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    category: 'tagmanagement',
    mark: 'googletagmanager',
    // Any host: a server-side container serves gtm.js from the site's own subdomain.
    script: [/\/gtm\.js\?(?:.*&)?id=GTM-/i],
    resource: [/\/gtm\.js\?(?:.*&)?id=GTM-/i],
    ids: [
      { from: 'script', pattern: /[?&]id=(GTM-[A-Z0-9]{4,})/ },
      { from: 'value', path: 'google_tag_manager', pattern: /^(GTM-[A-Z0-9]{4,})$/ },
    ],
  },
  {
    id: 'tealium',
    name: 'Tealium',
    category: 'tagmanagement',
    script: [u('tags.tiqcdn.com', 'utag/')],
    global: ['utag'],
    ids: [{ from: 'script', pattern: /utag\/([^/]+\/[^/]+)\// }],
  },
  {
    id: 'adobe_launch',
    name: 'Adobe Launch',
    category: 'tagmanagement',
    script: [u('assets.adobedtm.com', '')],
    global: ['_satellite'],
  },
  {
    id: 'segment',
    name: 'Segment',
    category: 'tagmanagement',
    script: [u('cdn.segment.com', 'analytics\\.js')],
    resource: [u('api.segment.io', '')],
    cookie: [c('ajs_anonymous_id')],
  },
  {
    id: 'rudderstack',
    name: 'RudderStack',
    category: 'tagmanagement',
    script: [u('cdn.rudderlabs.com', '')],
    global: ['rudderanalytics'],
  },
];

const category = 'consent' as const;

/** Names match Hitline's KNOWN_CMPS (rules.test.ts keeps them in line). */
export const CONSENT: Rule[] = [
  {
    id: 'cookiebot',
    name: 'Cookiebot',
    category,
    kind: 'banner',
    script: [u('consent.cookiebot.com', ''), u('consent.cookiebot.eu', '')],
    global: ['Cookiebot'],
    cookie: [c('CookieConsent')],
    ids: [{ from: 'script', pattern: /[?&]cbid=([0-9a-f-]{36})/ }],
  },
  {
    id: 'onetrust',
    name: 'OneTrust',
    category,
    kind: 'banner',
    script: [u('cdn.cookielaw.org', ''), u('optanon.blob.core.windows.net', '')],
    global: ['OneTrust', 'OptanonWrapper'],
    cookie: [c('OptanonConsent')],
  },
  {
    id: 'usercentrics',
    name: 'Usercentrics',
    category,
    kind: 'banner',
    script: [u('usercentrics.eu', '')],
    global: ['UC_UI'],
  },
  {
    id: 'cookieyes',
    name: 'CookieYes',
    category,
    kind: 'banner',
    script: [u('cdn-cookieyes.com', '')],
    cookie: [c('cookieyes-consent')],
  },
  {
    id: 'didomi',
    name: 'Didomi',
    category,
    kind: 'banner',
    script: [u('privacy-center.org', '')],
    global: ['Didomi'],
  },
  {
    id: 'complianz',
    name: 'Complianz',
    category,
    kind: 'banner',
    script: [/\/wp-content\/plugins\/complianz[^/]*\//i],
    cookie: [cp('cmplz_')],
  },
  {
    id: 'iubenda',
    name: 'iubenda',
    category,
    kind: 'banner',
    script: [u('iubenda.com', '')],
    global: ['_iub'],
  },
  {
    id: 'termly',
    name: 'Termly',
    category,
    kind: 'banner',
    script: [u('app.termly.io', '')],
  },
  {
    id: 'osano',
    name: 'Osano',
    category,
    kind: 'banner',
    mark: 'osano',
    script: [u('cmp.osano.com', '')],
    global: ['Osano'],
  },
  {
    id: 'quantcast',
    name: 'Quantcast Choice',
    category,
    kind: 'banner',
    script: [u('cmp.quantcast.com', ''), u('cmp.inmobi.com', '')],
  },
  {
    id: 'trustarc',
    name: 'TrustArc',
    category,
    kind: 'banner',
    script: [u('consent.trustarc.com', '')],
    global: ['truste'],
  },
  {
    id: 'axeptio',
    name: 'Axeptio',
    category,
    kind: 'banner',
    script: [u('static.axept.io', '')],
    global: ['axeptioSettings'],
  },
  {
    id: 'cookiefirst',
    name: 'CookieFirst',
    category,
    kind: 'banner',
    script: [u('consent.cookiefirst.com', '')],
  },
];
