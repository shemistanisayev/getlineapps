/**
 * Rivaline 1.1 (docs/rivaline/PLAN-1.1.md, step 1): tools common on Azerbaijani, regional and
 * global sites that 1.0 did not know. Script hosts and globals as the vendors document them.
 */
import type { Rule } from '../types.ts';
import { c, cp, u } from './helpers.ts';

export const MORE: Rule[] = [
  /* Advertising: networks and publisher ads */
  {
    id: 'vk_ads',
    name: 'VK Ads',
    category: 'advertising',
    script: [u('top-fwz1.mail.ru', 'js/code\\.js'), u('vk.com', 'js/api/openapi\\.js')],
    resource: [u('top-fwz1.mail.ru', 'tracker'), u('vk.com', 'rtrg')],
    global: ['_tmr'],
    ids: [{ from: 'inline', pattern: /_tmr\.push\(\{\s*id:\s*["'](\d+)["']/ }],
  },
  {
    id: 'adsense',
    name: 'Google AdSense',
    category: 'advertising',
    kind: 'sells ads',
    script: [u('pagead2.googlesyndication.com', 'pagead/js/adsbygoogle\\.js')],
    selector: ['ins.adsbygoogle'],
    ids: [{ from: 'script', pattern: /[?&]client=(ca-pub-\d+)/ }],
  },
  {
    // Ad server common on Azerbaijani and regional sites (QA: tap.az sells banners through it).
    id: 'adriver',
    name: 'AdRiver',
    category: 'advertising',
    kind: 'sells ads',
    script: [u('adriver.ru', '')],
    resource: [u('adriver.ru', '')],
  },
  {
    id: 'google_ad_manager',
    name: 'Google Ad Manager',
    category: 'advertising',
    kind: 'sells ads',
    script: [u('securepubads.g.doubleclick.net', 'tag/js/gpt\\.js')],
  },

  /* Analytics: mobile attribution, session replay, privacy analytics, call tracking */
  {
    id: 'appsflyer',
    name: 'AppsFlyer',
    category: 'analytics',
    kind: 'app links',
    script: [u('websdk.appsflyer.com', '')],
    global: ['AF_SMART_SCRIPT'],
  },
  {
    id: 'branch',
    name: 'Branch',
    category: 'analytics',
    kind: 'app links',
    script: [u('cdn.branch.io', '')],
  },
  {
    id: 'smartlook',
    name: 'Smartlook',
    category: 'analytics',
    script: [u('web-sdk.smartlook.com', ''), u('rec.smartlook.com', '')],
    global: ['smartlook'],
  },
  {
    id: 'logrocket',
    name: 'LogRocket',
    category: 'analytics',
    script: [u('cdn.logrocket.io', ''), u('cdn.lr-ingest.io', ''), u('cdn.lr-in-prod.com', '')],
    global: ['LogRocket'],
  },
  {
    id: 'lucky_orange',
    name: 'Lucky Orange',
    category: 'analytics',
    script: [u('tools.luckyorange.com', ''), u('luckyorange.com', '')],
    global: ['__lo_site_id'],
  },
  {
    // QA: tap.az.
    id: 'cloudflare_analytics',
    name: 'Cloudflare Web Analytics',
    category: 'analytics',
    script: [u('static.cloudflareinsights.com', 'beacon')],
  },
  {
    id: 'fathom',
    name: 'Fathom Analytics',
    category: 'analytics',
    script: [u('cdn.usefathom.com', '')],
  },
  {
    id: 'simple_analytics',
    name: 'Simple Analytics',
    category: 'analytics',
    script: [u('scripts.simpleanalyticscdn.com', '')],
  },
  {
    id: 'liveinternet',
    name: 'LiveInternet',
    category: 'analytics',
    resource: [u('counter.yadro.ru', 'hit')],
    selector: ['a[href*="liveinternet.ru/click"]'],
  },
  {
    id: 'callrail',
    name: 'CallRail',
    category: 'analytics',
    kind: 'call tracking',
    script: [u('cdn.callrail.com', '')],
  },
  {
    id: 'ringostat',
    name: 'Ringostat',
    category: 'analytics',
    kind: 'call tracking',
    script: [u('script.ringostat.com', '')],
    global: ['ringostatAnalytics'],
  },
  {
    id: 'calltouch',
    name: 'Calltouch',
    category: 'analytics',
    kind: 'call tracking',
    script: [u('mod.calltouch.ru', '')],
    cookie: [cp('_ct_session_id')],
  },

  /* CRM */
  {
    id: 'kommo',
    name: 'Kommo (amoCRM)',
    category: 'crm',
    kind: 'forms',
    script: [u('amocrm.ru', ''), u('amocrm.com', ''), u('kommo.com', '')],
    global: ['amoSocialButton', 'amo_forms_params'],
  },
  {
    id: 'bitrix24',
    name: 'Bitrix24',
    category: 'crm',
    kind: 'widget',
    script: [/\/crm\/(site_button|form)\/loader_/i, u('bitrix24.com', ''), u('bitrix24.ru', '')],
    global: ['b24form'],
  },
  {
    id: 'carrot_quest',
    name: 'Carrot quest',
    category: 'crm',
    script: [u('cdn.carrotquest.app', ''), u('cdn.carrotquest.io', '')],
    global: ['carrotquest'],
  },

  /* Email and push */
  {
    id: 'sendpulse',
    name: 'SendPulse',
    category: 'email',
    script: [u('sendpulse.com', ''), u('cdn.sendpulse.com', '')],
    global: ['oSpP'],
  },
  {
    id: 'onesignal',
    name: 'OneSignal',
    category: 'email',
    kind: 'web push',
    script: [u('cdn.onesignal.com', '')],
    global: ['OneSignal', 'OneSignalDeferred'],
  },
  {
    id: 'pushowl',
    name: 'PushOwl',
    category: 'email',
    kind: 'web push',
    script: [u('cdn.pushowl.com', '')],
  },
  {
    id: 'pushengage',
    name: 'PushEngage',
    category: 'email',
    kind: 'web push',
    script: [u('clientcdn.pushengage.com', '')],
  },

  /* Chat */
  {
    id: 'jivo',
    name: 'Jivo',
    category: 'chat',
    kind: 'chat',
    script: [u('code.jivosite.com', ''), u('code.jivo.ru', ''), u('code-eu1.jivosite.com', '')],
    global: ['jivo_api'],
  },
  {
    id: 'chatra',
    name: 'Chatra',
    category: 'chat',
    kind: 'chat',
    script: [u('call.chatra.io', '')],
    global: ['Chatra'],
  },
  {
    id: 'smartsupp',
    name: 'Smartsupp',
    category: 'chat',
    kind: 'chat',
    script: [u('smartsuppchat.com', '')],
    global: ['smartsupp'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp chat',
    category: 'chat',
    kind: 'click to chat',
    selector: ['a[href*="wa.me/"]', 'a[href*="api.whatsapp.com/send"]'],
  },

  /* E-commerce platforms and site builders */
  {
    id: 'opencart',
    name: 'OpenCart',
    category: 'ecommerce',
    script: [/\/catalog\/view\/javascript\//i],
    cookie: [c('OCSESSID')],
  },
  {
    id: 'bitrix_cms',
    name: '1C-Bitrix',
    category: 'ecommerce',
    script: [/\/bitrix\/(js|templates|cache)\//i],
    cookie: [cp('BITRIX_SM_')],
  },
  {
    id: 'drupal',
    name: 'Drupal',
    category: 'ecommerce',
    global: ['drupalSettings'],
    meta: [{ name: 'generator', pattern: /^Drupal/i }],
  },
  {
    id: 'joomla',
    name: 'Joomla',
    category: 'ecommerce',
    meta: [{ name: 'generator', pattern: /Joomla/i }],
  },
  {
    id: 'framer',
    name: 'Framer',
    category: 'ecommerce',
    script: [u('framerusercontent.com', '')],
    meta: [{ name: 'generator', pattern: /^Framer/i }],
  },

  /* Payments: pay later in the region */
  {
    id: 'tabby',
    name: 'Tabby',
    category: 'payments',
    script: [u('checkout.tabby.ai', '')],
    selector: ['#tabbyPromo', 'tabby-promo'],
  },
  {
    id: 'tamara',
    name: 'Tamara',
    category: 'payments',
    script: [u('cdn.tamara.co', '')],
    selector: ['tamara-widget', '.tamara-product-widget'],
  },

  /* Affiliate */
  {
    id: 'admitad',
    name: 'Admitad',
    category: 'affiliate',
    script: [u('artfut.com', ''), u('admitad.com', '')],
    resource: [u('ad.admitad.com', '')],
  },
];
