/**
 * Rivaline 1.1 competitor research (docs/rivaline/PLAN-1.1.md, step 2): what the site offers,
 * where else the brand is, which markets it serves and how it catches leads. collectSite in the
 * extension reads the page into SiteRaw; these pure functions turn it into SiteInfo.
 * Multilingual patterns: English, Azerbaijani, Russian and Turkish, the languages of the
 * owner's market.
 */
import type { FoundTool, Stack } from './types.ts';

/* What collectSite returns. */

export interface SiteText {
  text: string;
  /** Where the text sits: the top bar, the header, navigation, main content or the footer. */
  where: 'top' | 'header' | 'nav' | 'main' | 'footer';
}

export interface SiteRaw {
  url: string;
  /** `<html lang>`. */
  lang: string;
  title: string;
  description: string;
  /** Open Graph and product meta: `og:title`, `og:price:currency`, `product:price:currency` ... */
  meta: Record<string, string>;
  /** First visible `<h1>`, then the paragraph that follows it. */
  h1: string;
  sub: string;
  /** Labels of visible buttons and button-like links in the first viewport, in page order. */
  ctas: string[];
  /** The announcement bar above or at the top of the header, when there is one. */
  announcement: string;
  /** Visible short texts (max 200 characters each), in page order. */
  texts: SiteText[];
  /** Absolute `href` of every link on the page. */
  links: string[];
  /** `<link rel="alternate" hreflang>`. */
  hreflang: Array<{ lang: string; href: string }>;
  /** Parsed JSON-LD blocks. */
  jsonld: unknown[];
  /** A visible email field (newsletter or sign-up form). */
  emailForm: boolean;
}

/* What the panel shows. */

export type PromoKind =
  'discount' | 'code' | 'shipping' | 'sale' | 'installments' | 'gift' | 'returns';

export interface Promo {
  /** Every kind of offer in the text, new ones only ("Free shipping over $40. 30-day returns."). */
  kinds: PromoKind[];
  /** The sentence it was found in, trimmed to 120 characters. */
  text: string;
  /** Promo code, for `code`. */
  code?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  /** ISO 4217 code ("USD", "AZN"), or null when the page shows no currency. */
  currency: string | null;
  /** How many prices it is based on. */
  count: number;
}

export interface Offer {
  title: string;
  description: string;
  headline: string;
  subline: string;
  ctas: string[];
  announcement: string;
  promos: Promo[];
  prices: PriceRange | null;
}

export const SOCIAL_NETWORKS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'linkedin',
  'x',
  'telegram',
  'pinterest',
  'threads',
  'vk',
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export interface SocialProfile {
  network: SocialNetwork;
  url: string;
  /** "@kova", "kova", "company/kova". */
  handle: string;
}

export interface AppLink {
  store: 'appstore' | 'googleplay';
  url: string;
  /** App Store id ("1234567") or Google Play package ("com.kova.app"). */
  id: string;
}

export interface Channels {
  social: SocialProfile[];
  apps: AppLink[];
  /** WhatsApp numbers ("+994501234567"), or the link when it has no number. */
  whatsapp: string[];
  emails: string[];
  phones: string[];
}

export interface Markets {
  /** `<html lang>`, lower case ("en", "az"). */
  pageLang: string;
  /** Language versions from hreflang ("az", "en", "ru"), without x-default. */
  languages: string[];
  /** Countries named in hreflang ("AZ", "TR"), when the codes have a region. */
  regions: string[];
  currency: string | null;
  currencyFrom: 'structured' | 'meta' | 'prices' | null;
}

export type LeadWay = 'email' | 'sms' | 'push' | 'chat' | 'whatsapp' | 'forms';

export interface LeadCapture {
  way: LeadWay;
  /** Tool names behind it ("Klaviyo"), empty when only the page shows it (an email field). */
  tools: string[];
}

export interface SiteInfo {
  offer: Offer;
  channels: Channels;
  markets: Markets;
  leads: LeadCapture[];
}

/* Helpers */

const clean = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const uniq = <T>(a: T[]) => [...new Set(a)];

function url(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

/** All JSON-LD nodes, flattened through @graph and arrays. */
function ldNodes(blocks: unknown[]): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const walk = (v: unknown, depth: number) => {
    if (depth > 6 || !v) return;
    if (Array.isArray(v)) return v.forEach((x) => walk(x, depth + 1));
    if (typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    out.push(o);
    for (const k of ['@graph', 'offers', 'itemListElement', 'item', 'mainEntity', 'contactPoint'])
      if (o[k]) walk(o[k], depth + 1);
  };
  walk(blocks, 0);
  return out;
}

const ldStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string') : typeof v === 'string' ? [v] : [];

/* Prices and currencies */

const SYMBOLS: Array<[RegExp, string]> = [
  [/^(?:₼|AZN|azn|man\.?|m\.)$/, 'AZN'],
  [/^(?:\$|US\$|USD)$/, 'USD'],
  [/^(?:€|EUR)$/, 'EUR'],
  [/^(?:£|GBP)$/, 'GBP'],
  [/^(?:₽|RUB|руб\.?|р\.)$/, 'RUB'],
  [/^(?:₺|TRY|TL)$/, 'TRY'],
  [/^(?:₾|GEL)$/, 'GEL'],
  [/^(?:AED|د\.إ)$/, 'AED'],
];
const CUR = '₼|AZN|azn|man\\.?|US\\$|\\$|USD|€|EUR|£|GBP|₽|RUB|руб\\.?|₺|TRY|TL|₾|GEL|AED';
const NUM = '\\d{1,3}(?:[  ,.]\\d{3})*(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?';
/** A text that is only a price: "$24", "24 ₼", "1 299,00 AZN", "from €12". */
const PRICE = new RegExp(
  `^(?:from|starting at|başlayaraq|от|başlayan)?\\s*(?:(${CUR})\\s?(${NUM})|(${NUM})\\s?(${CUR}))$`,
  'i',
);

export function currencyCode(symbol: string): string | null {
  const s = symbol.trim();
  for (const [re, code] of SYMBOLS) if (re.test(s)) return code;
  return /^[A-Z]{3}$/.test(s) ? s : null;
}

/** "1 299,00" → 1299, "1,299.50" → 1299.5, "24" → 24. */
export function parseAmount(s: string): number {
  const t = s.replace(/[  ]/g, '');
  const lastDot = t.lastIndexOf('.');
  const lastComma = t.lastIndexOf(',');
  const dec = Math.max(lastDot, lastComma);
  // A separator followed by exactly 1 or 2 digits at the end is the decimal point.
  if (dec > -1 && t.length - dec - 1 <= 2)
    return Number(`${t.slice(0, dec).replace(/[.,]/g, '')}.${t.slice(dec + 1)}`);
  return Number(t.replace(/[.,]/g, ''));
}

export function parsePrice(text: string): { amount: number; currency: string | null } | null {
  const m = PRICE.exec(clean(text));
  if (!m) return null;
  const amount = parseAmount(m[2] ?? m[3]!);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, currency: currencyCode(m[1] ?? m[4]!) };
}

function priceRange(raw: SiteRaw, nodes: Array<Record<string, unknown>>): PriceRange | null {
  const found: Array<{ amount: number; currency: string | null }> = [];
  for (const n of nodes) {
    const cur = typeof n.priceCurrency === 'string' ? n.priceCurrency.toUpperCase() : null;
    for (const k of ['price', 'lowPrice', 'highPrice']) {
      const v = n[k];
      const amount = typeof v === 'number' ? v : typeof v === 'string' ? parseAmount(v) : NaN;
      if (Number.isFinite(amount) && amount > 0) found.push({ amount, currency: cur });
    }
  }
  if (!found.length)
    for (const t of raw.texts) {
      if (t.where === 'nav' || t.where === 'footer') continue;
      const p = parsePrice(t.text);
      if (p) found.push(p);
    }
  if (!found.length) return null;
  const amounts = found.map((f) => f.amount);
  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    currency: mostCommon(found.map((f) => f.currency).filter((c): c is string => !!c)),
    count: found.length,
  };
}

function mostCommon(list: string[]): string | null {
  const count = new Map<string, number>();
  for (const x of list) count.set(x, (count.get(x) ?? 0) + 1);
  let best: string | null = null;
  for (const [k, n] of count) if (!best || n > count.get(best)!) best = k;
  return best;
}

/* Promotions */

const PROMO: Array<[PromoKind, RegExp]> = [
  [
    'shipping',
    /free (shipping|delivery)|pulsuz (çatdırılma|catdirilma)|бесплатн[а-яё]* доставк|ücretsiz kargo/i,
  ],
  [
    'discount',
    /(-\s?\d{1,2}\s?%)|(\d{1,2}\s?%\s?(off|endirim|скидк|indirim|discount))|((up to|save|en çox|qədər|до)\s+\d{1,2}\s?%)|(\d{1,2}\s?%.{0,20}(endirim|скидк|indirim))|(%\s?\d{1,2}\s?indirim)/i,
  ],
  [
    'installments',
    /taksit|faizsiz|hissə-hissə|interest[- ]free|installments?|рассрочк|\bor \d+ payments\b|\d+\s?(ay|aylıq)\b/i,
  ],
  ['returns', /\d+[- ]day (free )?returns|free returns|pulsuz qaytarma|возврат|ücretsiz iade/i],
  ['gift', /free gift|hədiyyə|подар|hediye/i],
  [
    'sale',
    /\b(sale|black friday|cyber monday|clearance|endirim(lər)?|kampaniya|aksiya|kampanya|indirim)\b|распродаж|акци[яи]/i,
  ],
];
const CODE_WORD = /\b(code|promo ?code|coupon|kod|kodu|promokod|kupon)\b|промокод/i;
const CODE_TOKEN = /^[\s:\-–"“'«]*([A-Z0-9][A-Z0-9_-]{3,15})\b/;

function promoCode(text: string): string | undefined {
  const m = CODE_WORD.exec(text);
  if (!m) return undefined;
  const t = CODE_TOKEN.exec(text.slice(m.index + m[0].length));
  // A real code has a letter and is written in capitals ("WELCOME10", "BLACK20").
  return t && /[A-Z]/.test(t[1]!) ? t[1] : undefined;
}

function promos(raw: SiteRaw): Promo[] {
  const out: Promo[] = [];
  const seen = new Set<string>();
  const sources: SiteText[] = [
    ...(raw.announcement ? [{ text: raw.announcement, where: 'top' as const }] : []),
    ...raw.texts.filter((t) => t.where !== 'nav'),
  ];
  for (const s of sources) {
    const text = clean(s.text);
    if (text.length < 4 || seen.has(text)) continue;
    const code = promoCode(text);
    // Footer and header lines only count for codes and discounts (newsletter offers).
    const kinds: PromoKind[] = [];
    if (code) kinds.push('code');
    for (const [kind, re] of PROMO) if (re.test(text)) kinds.push(kind);
    const useful =
      s.where === 'footer' || s.where === 'header'
        ? kinds.filter((k) => k === 'code' || k === 'discount')
        : kinds;
    // Each kind is said once (the first, most visible text), except codes: every code counts.
    const fresh = useful.filter((k) => k === 'code' || !out.some((p) => p.kinds.includes(k)));
    if (!fresh.length) continue;
    seen.add(text);
    out.push({ kinds: fresh, text: cut(text, 120), ...(code ? { code } : {}) });
    if (out.length >= 6) break;
  }
  return out;
}

export function readOffer(raw: SiteRaw, nodes = ldNodes(raw.jsonld)): Offer {
  return {
    title: clean(raw.meta['og:title'] || raw.title),
    description: clean(raw.description || raw.meta['og:description']),
    headline: cut(clean(raw.h1), 140),
    subline: cut(clean(raw.sub), 200),
    ctas: uniq(raw.ctas.map(clean).filter((c) => c.length >= 2 && c.length <= 40)).slice(0, 5),
    announcement: cut(clean(raw.announcement), 160),
    promos: promos(raw),
    prices: priceRange(raw, nodes),
  };
}

/* Channels */

const NOT_PROFILE: Record<SocialNetwork, RegExp> = {
  instagram: /^(p|reel|reels|explore|accounts|stories|tv|direct)$/i,
  facebook:
    /^(sharer|sharer\.php|share|share\.php|dialog|tr|plugins|login|policies|help|events|watch)$/i,
  tiktok: /^(embed|share|tag|music|discover)$/i,
  youtube: /^(watch|embed|shorts|results|playlist|feed|redirect)$/i,
  linkedin: /^(shareArticle|sharing|feed|jobs|login|posts)$/i,
  x: /^(intent|share|home|hashtag|i|search|login|explore)$/i,
  telegram: /^(share|addstickers|iv|s)$/i,
  pinterest: /^(pin|search|_|ideas)$/i,
  threads: /^(intent|search|login)$/i,
  vk: /^(share\.php|away\.php|js|rtrg|login|wall.*|video.*|photo.*)$/i,
};

/** The profile a link points to, or null for shares, posts and plugins. */
export function socialProfile(href: string): SocialProfile | null {
  const u = url(href);
  if (!u || !/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.replace(/^(www|m|mobile|web)\./, '').toLowerCase();
  const parts = u.pathname.split('/').filter(Boolean);
  const first = parts[0] ?? '';
  const make = (network: SocialNetwork, handle: string): SocialProfile | null =>
    handle && !NOT_PROFILE[network].test(handle.replace(/^@/, ''))
      ? { network, url: `${u.origin}${u.pathname}`.replace(/\/$/, ''), handle }
      : null;

  if (host === 'instagram.com') return make('instagram', first);
  if (host === 'facebook.com' || host === 'fb.com') {
    if (first === 'profile.php') {
      const id = u.searchParams.get('id');
      return id
        ? { network: 'facebook', url: `${u.origin}/profile.php?id=${id}`, handle: id }
        : null;
    }
    return make('facebook', first);
  }
  if (host === 'tiktok.com') return first.startsWith('@') ? make('tiktok', first) : null;
  if (host === 'youtube.com') {
    if (first.startsWith('@')) return make('youtube', first);
    if (['channel', 'c', 'user'].includes(first) && parts[1]) return make('youtube', parts[1]);
    return null;
  }
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com'))
    return ['company', 'school', 'in', 'showcase'].includes(first) && parts[1]
      ? make('linkedin', `${first}/${parts[1]}`)
      : null;
  if (host === 'x.com' || host === 'twitter.com') return make('x', first);
  if (host === 't.me' || host === 'telegram.me') return make('telegram', first);
  if (/^pinterest\.[a-z.]+$/.test(host)) return make('pinterest', first);
  if (host === 'threads.net' || host === 'threads.com')
    return first.startsWith('@') ? make('threads', first) : null;
  if (host === 'vk.com') return make('vk', first);
  return null;
}

export function appLink(href: string): AppLink | null {
  const u = url(href);
  if (!u) return null;
  if (u.hostname === 'apps.apple.com' || u.hostname === 'itunes.apple.com') {
    const id = /\/id(\d{5,})/.exec(u.pathname)?.[1];
    return id ? { store: 'appstore', url: `https://apps.apple.com/app/id${id}`, id } : null;
  }
  if (u.hostname === 'play.google.com' && u.pathname.startsWith('/store/apps/details')) {
    const id = u.searchParams.get('id');
    return id
      ? { store: 'googleplay', url: `https://play.google.com/store/apps/details?id=${id}`, id }
      : null;
  }
  return null;
}

/** "+994 50 123 45 67" from wa.me, api.whatsapp.com and whatsapp:// links. */
export function whatsappNumber(href: string): string | null {
  const u = url(href);
  if (!u) return null;
  let found: string;
  if (u.hostname === 'wa.me') {
    found = u.pathname.split('/').filter(Boolean)[0] ?? '';
    // wa.me/message/ABC is a business chat link without a number.
    if (found === 'message') return href;
  } else if (/(^|\.)whatsapp\.com$/.test(u.hostname) || u.protocol === 'whatsapp:') {
    // whatsapp.com/channel/... is a broadcast channel, not a chat (QA: bakuelectronics.az).
    found = u.searchParams.get('phone') ?? '';
  } else return null;
  const digits = found.replace(/\D/g, '');
  return digits.length >= 7 ? `+${digits}` : null;
}

export function readChannels(raw: SiteRaw, nodes = ldNodes(raw.jsonld)): Channels {
  const sameAs = nodes.flatMap((n) => ldStrings(n.sameAs));
  const links = uniq([...sameAs, ...raw.links]);
  const social: SocialProfile[] = [];
  const apps: AppLink[] = [];
  const whatsapp: string[] = [];
  const emails: string[] = [];
  const phones: string[] = [];
  for (const href of links) {
    const p = socialProfile(href);
    if (p) {
      // One profile per network: the first one, which is the site's own (sameAs, then header
      // and footer order).
      if (!social.some((s) => s.network === p.network)) social.push(p);
      continue;
    }
    const app = appLink(href);
    if (app) {
      if (!apps.some((a) => a.store === app.store)) apps.push(app);
      continue;
    }
    const wa = whatsappNumber(href);
    if (wa) {
      whatsapp.push(wa);
      continue;
    }
    if (/^mailto:/i.test(href)) {
      const e = decodeURIComponent(href.slice(7).split('?')[0]!).trim().toLowerCase();
      if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e)) emails.push(e);
    } else if (/^tel:/i.test(href)) {
      const t = decodeURIComponent(href.slice(4)).replace(/[^\d+]/g, '');
      if (t.replace(/\D/g, '').length >= 5) phones.push(t);
    }
  }
  for (const n of nodes) {
    for (const e of ldStrings(n.email)) emails.push(e.replace(/^mailto:/i, '').toLowerCase());
    for (const t of ldStrings(n.telephone)) phones.push(t.replace(/[^\d+]/g, ''));
  }
  for (const [store, meta] of [
    ['appstore', raw.meta['apple-itunes-app']],
    ['googleplay', raw.meta['google-play-app']],
  ] as const) {
    const id = /app-id=([\w.]+)/.exec(meta ?? '')?.[1];
    if (id && !apps.some((a) => a.store === store))
      apps.push(
        store === 'appstore'
          ? { store, id, url: `https://apps.apple.com/app/id${id}` }
          : { store, id, url: `https://play.google.com/store/apps/details?id=${id}` },
      );
  }
  social.sort((a, b) => SOCIAL_NETWORKS.indexOf(a.network) - SOCIAL_NETWORKS.indexOf(b.network));
  return {
    social,
    apps,
    whatsapp: uniq(whatsapp).slice(0, 3),
    emails: uniq(emails).slice(0, 3),
    phones: uniq(phones.filter(Boolean)).slice(0, 3),
  };
}

/* Markets */

export function readMarkets(
  raw: SiteRaw,
  nodes = ldNodes(raw.jsonld),
  prices?: PriceRange | null,
): Markets {
  const codes = raw.hreflang
    .map((h) => h.lang.trim())
    .filter((l) => l && l.toLowerCase() !== 'x-default');
  const languages = uniq(codes.map((c) => c.split(/[-_]/)[0]!.toLowerCase())).sort();
  const regions = uniq(
    codes
      .map((c) => c.split(/[-_]/)[1]?.toUpperCase())
      .filter((r): r is string => !!r && r.length === 2),
  ).sort();
  const structured = mostCommon(
    nodes
      .map((n) => (typeof n.priceCurrency === 'string' ? n.priceCurrency.toUpperCase() : ''))
      .filter(Boolean),
  );
  const meta = clean(
    raw.meta['og:price:currency'] || raw.meta['product:price:currency'],
  ).toUpperCase();
  const fromPrices = (prices ?? priceRange(raw, nodes))?.currency ?? null;
  const [currency, currencyFrom]: [string | null, Markets['currencyFrom']] = structured
    ? [structured, 'structured']
    : meta
      ? [meta, 'meta']
      : fromPrices
        ? [fromPrices, 'prices']
        : [null, null];
  return {
    pageLang: clean(raw.lang).split(/[-_]/)[0]!.toLowerCase(),
    languages,
    regions,
    currency,
    currencyFrom,
  };
}

/* Lead capture */

const SMS = new Set(['attentive', 'postscript']);
/** CRMs whose script on a site means lead forms or a lead widget (not Braze-style messaging). */
const FORM_CRMS = new Set([
  'hubspot',
  'salesforce',
  'zoho',
  'pipedrive',
  'marketo',
  'kommo',
  'bitrix24',
]);

export function leadCapture(
  raw: Pick<SiteRaw, 'emailForm'>,
  tools: FoundTool[],
  channels: Pick<Channels, 'whatsapp'>,
): LeadCapture[] {
  const names = (f: (t: FoundTool) => boolean) => tools.filter(f).map((t) => t.name);
  const out: LeadCapture[] = [];
  const add = (way: LeadWay, list: string[], shown = false) => {
    if (list.length || shown) out.push({ way, tools: list });
  };
  add(
    'email',
    names((t) => t.category === 'email' && t.kind !== 'web push' && !SMS.has(t.id)),
    raw.emailForm,
  );
  add(
    'sms',
    names((t) => SMS.has(t.id)),
  );
  add(
    'push',
    names((t) => t.kind === 'web push'),
  );
  add(
    'chat',
    names((t) => t.category === 'chat' && t.id !== 'whatsapp'),
  );
  add(
    'whatsapp',
    names((t) => t.id === 'whatsapp'),
    channels.whatsapp.length > 0,
  );
  add(
    'forms',
    names((t) => FORM_CRMS.has(t.id)),
  );
  return out;
}

/** Everything the Offer tab shows. `stack` adds the tools behind each way to catch leads. */
export function siteInfo(raw: SiteRaw, stack?: Pick<Stack, 'tools'>): SiteInfo {
  const nodes = ldNodes(raw.jsonld);
  const offer = readOffer(raw, nodes);
  const channels = readChannels(raw, nodes);
  return {
    offer,
    channels,
    markets: readMarkets(raw, nodes, offer.prices),
    leads: leadCapture(raw, stack?.tools ?? [], channels),
  };
}
