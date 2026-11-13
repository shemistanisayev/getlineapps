import { describe, expect, it } from 'vitest';
import { KNOWN_CMPS } from '../hitline/consent.ts';
import { analyzeStack, findTools, matchRule } from './match.ts';
import { RULES } from './rules/index.ts';
import { CATEGORIES, type PageSnapshot } from './types.ts';

/** An empty page plus whatever the case sets. */
export function snap(p: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: 'https://shop.example.com/',
    origin: 'https://shop.example.com',
    title: 'Shop',
    lang: 'en',
    scripts: [],
    inline: [],
    resources: [],
    globals: [],
    values: {},
    cookies: [],
    meta: {},
    links: [],
    selectors: [],
    ...p,
  };
}

const ids = (s: PageSnapshot) => findTools(s).map((t) => t.id);
const tool = (s: PageSnapshot, id: string) => findTools(s).find((t) => t.id === id);

describe('rule list', () => {
  it('has about 120 tools, unique ids, each in a known category with at least one signal', () => {
    expect(RULES.length).toBeGreaterThanOrEqual(120);
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
    for (const r of RULES) {
      expect(CATEGORIES, r.id).toContain(r.category);
      const signals =
        (r.script?.length ?? 0) +
        (r.resource?.length ?? 0) +
        (r.global?.length ?? 0) +
        (r.cookie?.length ?? 0) +
        (r.meta?.length ?? 0) +
        (r.selector?.length ?? 0);
      expect(signals, r.id).toBeGreaterThan(0);
    }
    for (const c of CATEGORIES)
      expect(
        RULES.some((r) => r.category === c),
        c,
      ).toBe(true);
  });

  it('covers the SPEC v1 minimum list', () => {
    const names = RULES.map((r) => r.name);
    for (const n of [
      'Meta Pixel',
      'TikTok Pixel',
      'Google Ads',
      'Microsoft Advertising',
      'LinkedIn Insight Tag',
      'Pinterest Tag',
      'Snap Pixel',
      'X Pixel',
      'Reddit Pixel',
      'Criteo',
      'Taboola',
      'Outbrain',
      'Floodlight',
      'Google Analytics 4',
      'Adobe Analytics',
      'Mixpanel',
      'Amplitude',
      'Heap',
      'Hotjar',
      'Microsoft Clarity',
      'Matomo',
      'Plausible',
      'PostHog',
      'FullStory',
      'Contentsquare',
      'Yandex Metrica',
      'Google Tag Manager',
      'Tealium',
      'Adobe Launch',
      'Segment',
      'RudderStack',
      'HubSpot',
      'Salesforce',
      'Zoho',
      'Pipedrive',
      'ActiveCampaign',
      'Marketo',
      'Brevo',
      'Klaviyo',
      'Mailchimp',
      'Omnisend',
      'Attentive',
      'Privy',
      'Intercom',
      'Zendesk',
      'Drift',
      'Crisp',
      'Tawk.to',
      'LiveChat',
      'Tidio',
      'Gorgias',
      'Optimizely',
      'VWO',
      'AB Tasty',
      'Convert',
      'Kameleoon',
      'Shopify',
      'WooCommerce',
      'WordPress',
      'Adobe Commerce',
      'BigCommerce',
      'Wix',
      'Squarespace',
      'Webflow',
      'Tilda',
      'Trustpilot',
      'Yotpo',
      'Judge.me',
      'Okendo',
      'Reviews.io',
      'Bazaarvoice',
      'Stripe',
      'PayPal',
      'Klarna',
      'Afterpay',
      'Shop Pay',
      'Impact',
      'Awin',
      'Rakuten Advertising',
      'PartnerStack',
    ])
      expect(names, n).toContain(n);
  });

  it("reuses Hitline's consent platform list", () => {
    const consent = RULES.filter((r) => r.category === 'consent').map((r) => r.name);
    for (const cmp of KNOWN_CMPS) expect(consent, cmp).toContain(cmp);
  });
});

describe('advertising', () => {
  it('pixels by script, with IDs from inline snippets and requests', () => {
    const s = snap({
      scripts: [
        'https://bat.bing.com/bat.js',
        'https://snap.licdn.com/li.lms-analytics/insight.min.js',
        'https://static.ads-twitter.com/uwt.js',
        'https://www.redditstatic.com/ads/pixel.js',
        'https://sc-static.net/scevent.min.js',
      ],
      inline: [
        'window.uetq = window.uetq || []; var o = { ti: "187654321" };',
        '_linkedin_partner_id = "4455667";',
        "twq('config','o8x1z');",
        "rdt('init','t2_abc123');",
        "snaptr('init', '0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b');",
      ],
    });
    expect(tool(s, 'microsoft_ads')?.label).toBe('187654321');
    expect(tool(s, 'linkedin_insight')?.label).toBe('4455667');
    expect(tool(s, 'x_pixel')?.label).toBe('o8x1z');
    expect(tool(s, 'reddit_pixel')?.label).toBe('t2_abc123');
    expect(tool(s, 'snap_pixel')?.label).toBe('0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b');
  });

  it('Google Ads from a conversion request, Floodlight from its request', () => {
    const s = snap({
      resources: [
        'https://www.googleadservices.com/pagead/conversion/998877665/?label=x',
        'https://123.fls.doubleclick.net/activityi;src=4455667;type=sales',
      ],
    });
    expect(tool(s, 'google_ads')?.label).toBe('AW-998877665');
    expect(tool(s, 'floodlight')?.label).toBe('DC-4455667');
  });

  it('a share link or a GA4 tag is not an ad pixel', () => {
    const s = snap({
      resources: ['https://www.facebook.com/sharer/sharer.php?u=x'],
      scripts: ['https://www.googletagmanager.com/gtag/js?id=G-ABCDEF1'],
    });
    expect(ids(s)).toEqual(['ga4']);
  });
});

describe('analytics', () => {
  it('finds tools by script, global and cookie, with IDs', () => {
    const s = snap({
      scripts: [
        'https://www.clarity.ms/tag/k3n9x2p1q',
        'https://cdn.example.com/matomo.js',
        'https://plausible.io/js/script.js',
        'https://mc.yandex.ru/metrika/tag.js',
      ],
      inline: ["_paq.push(['setSiteId', '7']);", 'ym(90123456, "init", {});'],
      globals: ['posthog'],
      cookies: ['ph_phc_x_posthog'],
    });
    expect(tool(s, 'clarity')?.label).toBe('k3n9x2p1q');
    expect(tool(s, 'matomo')?.label).toBe('site 7');
    expect(tool(s, 'plausible')).toBeDefined();
    expect(tool(s, 'yandex_metrica')?.label).toBe('90123456');
    expect(tool(s, 'posthog')?.evidence.map((e) => e.kind)).toEqual(['Global', 'Cookie']);
  });

  it('a lone _ga cookie is not GA4, a _ga_<id> cookie is', () => {
    expect(ids(snap({ cookies: ['_ga'] }))).toEqual([]);
    expect(tool(snap({ cookies: ['_ga', '_ga_ZZ99YY88'] }), 'ga4')?.label).toBe('G-ZZ99YY88');
  });
});

describe('tag management and server-side', () => {
  it('GTM served from the site itself (server-side container) is still GTM', () => {
    const s = snap({ scripts: ['https://data.shop.example.com/gtm.js?id=GTM-AB12CD'] });
    expect(tool(s, 'gtm')?.label).toBe('GTM-AB12CD');
  });

  it('GA4 collect on a non-Google host is server-side and closes that gap', () => {
    const s = snap({
      scripts: ['https://connect.facebook.net/en_US/fbevents.js'],
      resources: ['https://data.shop.example.com/g/collect?v=2&tid=G-ABCDEF1'],
    });
    const sgtm = tool(s, 'sgtm');
    expect(sgtm?.category).toBe('tagmanagement');
    expect(sgtm?.evidence[0]).toEqual({
      kind: 'Request',
      value: 'data.shop.example.com/g/collect',
    });
    expect(analyzeStack(s).gaps.map((g) => g.id)).not.toContain('GAP_SERVER_SIDE');
  });

  it("GA4's Google Signals copy on stats.g.doubleclick.net is not server-side (QA)", () => {
    const s = snap({
      scripts: ['https://www.googletagmanager.com/gtag/js?id=G-ABCDEF1'],
      resources: ['https://stats.g.doubleclick.net/g/collect?v=2&tid=G-ABCDEF1'],
    });
    expect(tool(s, 'sgtm')).toBeUndefined();
  });

  it('Tealium and Segment', () => {
    const s = snap({
      scripts: [
        'https://tags.tiqcdn.com/utag/acme/main/prod/utag.js',
        'https://cdn.segment.com/analytics.js/v1/abc/analytics.min.js',
      ],
    });
    expect(tool(s, 'tealium')?.label).toBe('acme/main');
    expect(tool(s, 'segment')).toBeDefined();
  });
});

describe('consent', () => {
  it.each([
    ['https://consent.cookiebot.com/uc.js', 'cookiebot'],
    ['https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', 'onetrust'],
    ['https://web.cmp.usercentrics.eu/ui/loader.js', 'usercentrics'],
    ['https://cdn-cookieyes.com/client_data/abc/script.js', 'cookieyes'],
    ['https://sdk.privacy-center.org/loader.js', 'didomi'],
    ['https://cdn.iubenda.com/cs/iubenda_cs.js', 'iubenda'],
    ['https://cmp.osano.com/abc/osano.js', 'osano'],
  ])('%s is %s', (url, id) => {
    expect(ids(snap({ scripts: [url] }))).toEqual([id]);
  });

  it('Sourcepoint from its own subdomain, the HubSpot cookie banner (QA)', () => {
    expect(
      ids(
        snap({
          scripts: [
            'https://sourcepoint.theguardian.com/unified/4.41.0/gdpr-tcf.e7290277.bundle.js',
          ],
          cookies: ['consentUUID'],
        }),
      ),
    ).toEqual(['sourcepoint']);
    expect(ids(snap({ scripts: ['https://js.hs-banner.com/v2/123/banner.js'] }))).toEqual([
      'hubspot_banner',
    ]);
  });

  it('a plain /static/frontend/ path is not Adobe Commerce (QA: theguardian.com)', () => {
    expect(
      ids(
        snap({ resources: ['https://assets.guim.co.uk/static/frontend/fonts/guardian/x.woff2'] }),
      ),
    ).toEqual([]);
    expect(
      ids(
        snap({
          scripts: [
            'https://shop.example/static/version1712/frontend/Magento/luma/en_US/requirejs/require.js',
          ],
        }),
      ),
    ).toEqual(['adobe_commerce']);
  });

  it('a Consent Mode command counts as consent', () => {
    const base = { scripts: ['https://www.googletagmanager.com/gtag/js?id=G-ABCDEF1'] };
    expect(analyzeStack(snap(base)).gaps.map((g) => g.id)).toContain('GAP_CONSENT');
    expect(
      analyzeStack(snap({ ...base, consentCommand: true })).gaps.map((g) => g.id),
    ).not.toContain('GAP_CONSENT');
  });
});

describe('CRM, email and chat', () => {
  it('HubSpot portal, Klaviyo company, chat kinds', () => {
    const s = snap({
      scripts: [
        'https://js.hs-scripts.com/5566778.js',
        'https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=AbC123',
      ],
      globals: ['$crisp', 'Tawk_API'],
    });
    expect(tool(s, 'hubspot')?.label).toBe('portal 5566778');
    expect(tool(s, 'klaviyo')?.label).toBe('AbC123');
    expect(tool(s, 'crisp')?.label).toBe('chat');
    expect(tool(s, 'tawk')?.label).toBe('chat');
  });

  it('a chat or email form without a CRM is a gap; with HubSpot it is not', () => {
    const chat = snap({ globals: ['Intercom'] });
    expect(analyzeStack(chat).gaps.map((g) => g.id)).toEqual(['GAP_CRM', 'GAP_ANALYTICS']);
    expect(analyzeStack(snap({ emailForm: true })).gaps.map((g) => g.id)).toContain('GAP_CRM');
    const withCrm = snap({ globals: ['Intercom', '_hsq'] });
    expect(analyzeStack(withCrm).gaps.map((g) => g.id)).not.toContain('GAP_CRM');
  });
});

describe('A/B testing, platforms, reviews, payments, affiliate', () => {
  it('Optimizely project id, VWO global', () => {
    const s = snap({
      scripts: ['https://cdn.optimizely.com/js/24681357.js'],
      globals: ['_vwo_code'],
    });
    expect(tool(s, 'optimizely')?.label).toBe('24681357');
    expect(tool(s, 'vwo')).toBeDefined();
  });

  it('WordPress by its generator; WooCommerce is the platform of a WooCommerce site', () => {
    const wp = snap({
      meta: { generator: 'WordPress 6.6' },
      scripts: [
        'https://shop.example.com/wp-content/plugins/woocommerce/assets/js/frontend/cart.js',
      ],
    });
    const stack = analyzeStack(wp);
    expect(ids(wp)).toEqual(['woocommerce', 'wordpress']);
    expect(stack.summary.platform).toBe('WooCommerce');
    expect(tool(wp, 'wordpress')?.evidence).toContainEqual({
      kind: 'Meta',
      value: 'generator: WordPress 6.6',
    });
  });

  it('elements, payments and affiliate scripts', () => {
    const s = snap({
      selectors: ['.trustpilot-widget', 'afterpay-placement', 'shop-pay-button'],
      scripts: [
        'https://js.stripe.com/v3/',
        'https://www.dwin1.com/12345.js',
        'https://utt.impactcdn.com/A1-B2.js',
      ],
    });
    expect(ids(s)).toEqual(['trustpilot', 'stripe', 'afterpay', 'shop_pay', 'impact', 'awin']);
    expect(tool(s, 'trustpilot')?.evidence).toEqual([
      { kind: 'Element', value: '.trustpilot-widget' },
    ]);
  });
});

describe('matchRule', () => {
  it('shortens evidence URLs and lists Script, Global, Cookie, Request in that order', () => {
    const rule = RULES.find((r) => r.id === 'meta_pixel')!;
    const t = matchRule(
      rule,
      snap({
        resources: ['https://www.facebook.com/tr/?id=1234567&ev=PageView'],
        cookies: ['_fbp'],
        globals: ['fbq'],
        scripts: ['https://connect.facebook.net/en_US/fbevents.js?v=next'],
      }),
    );
    expect(t?.evidence).toEqual([
      { kind: 'Script', value: 'connect.facebook.net/en_US/fbevents.js' },
      { kind: 'Global', value: 'window.fbq' },
      { kind: 'Cookie', value: '_fbp' },
      { kind: 'Request', value: 'www.facebook.com/tr' },
    ]);
    expect(t?.label).toBe('1234567');
  });
});
