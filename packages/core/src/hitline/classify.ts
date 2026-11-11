/** Request classifiers (docs/hitline-SPEC.md §4.1). One request can carry several hits (GA4 batches). */
import {
  flattenJson,
  ga4Params,
  get,
  mergeParams,
  parseJson,
  parseQuery,
  queryOf,
} from './decode.ts';
import { hostMatches, hostOf, pathOf } from './domain.ts';
import type { Hit, Param, Platform, RawRequest, Route } from './types.ts';
import {
  KNOWN_VENDOR_DOMAINS,
  UNKNOWN_EVENT,
  VENDOR_CLASSIFIERS,
  type HitPart,
} from './vendors.ts';

const VENDOR_HOSTS: Partial<Record<Platform, string[]>> = {
  ga4: ['google-analytics.com', 'analytics.google.com'],
  meta: ['facebook.com', 'facebook.net'],
  tiktok: ['tiktok.com', 'tiktokw.us'],
  gtm: ['googletagmanager.com'],
};

/** `sGTM` when GA4, Meta, TikTok or GTM goes to a host that is not the vendor's (§4.1). */
export function routeFor(platform: Platform, host: string): Route {
  if (platform === 'datalayer') return 'page';
  const vendors = VENDOR_HOSTS[platform];
  if (!vendors) return 'browser';
  return vendors.some((d) => hostMatches(host, d)) ? 'browser' : 'sgtm';
}

type Partial0 = HitPart;

function finish(req: RawRequest, parts: Partial0[], page: number): Hit[] {
  const host = hostOf(req.url);
  return parts.map((p, i) => ({
    ...p,
    id: parts.length > 1 ? `${req.id}#${i}` : req.id,
    requestId: req.id,
    time: req.time,
    method: req.method.toUpperCase(),
    url: req.url,
    host,
    route: routeFor(p.platform, host),
    page,
  }));
}

function ga4(req: RawRequest, url: URL): Partial0[] | null {
  const shared = parseQuery(url.search);
  const tid = get(shared, 'tid') ?? '';
  if (get(shared, 'v') !== '2' || !/^G-[A-Z0-9]+$/i.test(tid)) return null;
  // Server-side containers may use their own path; Google's own hosts only use /g/collect.
  const standard = url.pathname.endsWith('/g/collect');
  if (!standard && (hostMatches(url.hostname, 'google.com') || !get(shared, 'cid'))) return null;
  const lines = (req.body ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.includes('en='));
  const events = lines.length ? lines.map((l) => mergeParams(shared, parseQuery(l))) : [shared];
  // Popup (no body) on a batched request: the event names are only in the body.
  if (!lines.length && !get(shared, 'en') && req.body === undefined) {
    const { context } = ga4Params(shared);
    return [
      {
        platform: 'ga4',
        event: UNKNOWN_EVENT,
        params: [],
        context,
        account: tid,
        gcs: get(shared, 'gcs'),
        gcd: get(shared, 'gcd'),
      },
    ];
  }
  return events
    .filter((fields) => get(fields, 'en'))
    .map((fields) => {
      const { params, context } = ga4Params(fields);
      return {
        platform: 'ga4' as const,
        event: get(fields, 'en')!,
        params,
        context,
        account: tid,
        gcs: get(fields, 'gcs'),
        gcd: get(fields, 'gcd'),
      };
    });
}

const ADS_PATHS: [string, RegExp][] = [
  ['googleadservices.com', /^\/pagead\/conversion\/([^/]+)/],
  ['google.com', /^\/pagead\/1p-conversion\/([^/]+)/],
  ['googleads.g.doubleclick.net', /^\/pagead\/viewthroughconversion\/([^/]+)/],
];

function ads(url: URL): Partial0[] | null {
  const host = url.hostname;
  for (const [domain, re] of ADS_PATHS) {
    if (!hostMatches(host, domain)) continue;
    const m = re.exec(url.pathname);
    if (!m || m[1]!.endsWith('.js')) continue;
    const q = parseQuery(url.search);
    const params: Param[] = [];
    for (const [from, to] of [
      ['label', 'label'],
      ['value', 'value'],
      ['currency_code', 'currency'],
      ['oid', 'transaction_id'],
    ] as const) {
      const v = get(q, from);
      if (v !== undefined) params.push({ key: to, value: v });
    }
    const context: Param[] = [];
    const dl = get(q, 'url');
    if (dl) context.push({ key: 'page_location', value: dl });
    // viewthroughconversion without a label is remarketing (a page view), not a conversion.
    const isConversion = domain !== 'googleads.g.doubleclick.net' || Boolean(get(q, 'label'));
    return [
      {
        platform: 'ads',
        event: isConversion ? 'conversion' : 'remarketing',
        params,
        context,
        account: m[1],
        gcs: get(q, 'gcs'),
        gcd: get(q, 'gcd'),
      },
    ];
  }
  return null;
}

function meta(req: RawRequest, url: URL): Partial0[] | null {
  const path = pathOf(url.href);
  if (!path.endsWith('/tr')) return null;
  const isVendor = hostMatches(url.hostname, 'facebook.com');
  const body = req.body && !req.body.trimStart().startsWith('{') ? parseQuery(req.body) : [];
  const fields = mergeParams(parseQuery(url.search), body);
  const id = get(fields, 'id');
  const ev = get(fields, 'ev');
  // First-party CAPI gateways only count when they carry id + ev.
  if (!isVendor && !(id && ev)) return null;
  if (!ev) return null;
  const params: Param[] = [];
  for (const { key, value } of fields) {
    const m = /^cd\[(.+)\]$/.exec(key);
    if (m) params.push({ key: m[1]!, value });
  }
  const context: Param[] = [];
  const dl = get(fields, 'dl');
  const rl = get(fields, 'rl');
  if (dl) context.push({ key: 'page_location', value: dl });
  if (rl) context.push({ key: 'page_referrer', value: rl });
  return [{ platform: 'meta', event: ev, params, context, account: id }];
}

function tiktok(req: RawRequest, url: URL): Partial0[] | null {
  if (!/^\/api\/v2\/pixel(\/act)?\/?$/.test(url.pathname)) return null;
  if (!hostMatches(url.hostname, 'tiktok.com') && !hostMatches(url.hostname, 'tiktokw.us'))
    return null;
  const json = parseJson(req.body) as
    | {
        event?: string;
        properties?: unknown;
        context?: { page?: { url?: string; referrer?: string }; pixel?: { code?: string } };
        pixel_code?: string;
      }
    | undefined;
  const params = json?.properties ? flattenJson(json.properties) : [];
  const context: Param[] = [];
  if (json?.context?.page?.url)
    context.push({ key: 'page_location', value: json.context.page.url });
  if (json?.context?.page?.referrer) {
    context.push({ key: 'page_referrer', value: json.context.page.referrer });
  }
  return [
    {
      platform: 'tiktok',
      // Without the body (popup) the event name is unknown.
      event: json?.event ?? UNKNOWN_EVENT,
      params,
      context,
      account: json?.pixel_code ?? json?.context?.pixel?.code,
    },
  ];
}

function hotjar(url: URL): Partial0[] | null {
  const m = /^\/c\/hotjar-(\d+)\.js$/.exec(url.pathname);
  if (!m || !hostMatches(url.hostname, 'hotjar.com')) return null;
  return [{ platform: 'hotjar', event: 'script', params: [], context: [], account: m[1] }];
}

function gtm(url: URL): Partial0[] | null {
  if (!url.pathname.endsWith('/gtm.js')) return null;
  const id = url.searchParams.get('id') ?? '';
  if (!/^GTM-[A-Z0-9]+$/i.test(id)) return null;
  return [{ platform: 'gtm', event: 'container', params: [], context: [], account: id }];
}

/** A rule from Settings: requests whose URL contains `match` become events of platform `name`. */
export interface CustomRule {
  name: string;
  match: string;
  /** Query, form or JSON (dot path) field that holds the event name. */
  event?: string;
}

export interface ClassifyOptions {
  rules?: CustomRule[];
  /** Report unknown tracking-like requests as platform "other" (panel only). */
  other?: boolean;
}

function bodyFields(req: RawRequest): Param[] {
  const json = parseJson(req.body);
  if (json !== undefined) return flattenJson(json);
  return req.body?.includes('=') ? parseQuery(req.body) : [];
}

function readField(req: RawRequest, url: URL, field: string): string | undefined {
  const q = get(parseQuery(url.search), field);
  if (q) return q;
  const json = parseJson(req.body);
  if (json !== undefined) return get(flattenJson(Array.isArray(json) ? json[0] : json), field);
  return req.body?.includes('=') ? get(parseQuery(req.body), field) : undefined;
}

function lastSegment(url: URL): string {
  const seg = url.pathname.split('/').filter(Boolean).at(-1);
  if (!seg) return 'request';
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

function requestParams(req: RawRequest, url: URL): Param[] {
  return mergeParams(parseQuery(url.search), bodyFields(req)).slice(0, 80);
}

function customHit(req: RawRequest, url: URL, rules: CustomRule[]): Partial0[] | null {
  const href = req.url.toLowerCase();
  const rule = rules.find((r) => r.match.trim() && href.includes(r.match.trim().toLowerCase()));
  if (!rule) return null;
  const name = (rule.event?.trim() && readField(req, url, rule.event.trim())) || lastSegment(url);
  return [
    {
      platform: `custom:${rule.name.trim() || rule.match.trim()}`,
      event: name,
      params: requestParams(req, url),
      context: [],
    },
  ];
}

const OTHER_PATH =
  /(^|\/)(collect|track|tracking|events?|pixel|beacon|hit|tr|analytics|log)(\.(gif|png|php))?\/?$/i;

/** A request that looks like tracking but matches no known platform (shown under "Other" only). */
function otherHit(req: RawRequest, url: URL): Partial0[] | null {
  if (!/^https?:$/.test(url.protocol)) return null;
  if (KNOWN_VENDOR_DOMAINS.some((d) => hostMatches(url.hostname, d))) return null;
  const pixel = /\.(gif|png)$/i.test(url.pathname) && [...url.searchParams.keys()].length >= 3;
  if (!pixel && !OTHER_PATH.test(url.pathname)) return null;
  if (!url.search && !req.body) return null;
  return [
    {
      platform: 'other',
      event: lastSegment(url),
      params: requestParams(req, url),
      context: [],
      account: url.hostname,
    },
  ];
}

/** Classifies one request. Returns [] for anything Hitline does not track. */
export function classifyRequest(req: RawRequest, page = 0, opts: ClassifyOptions = {}): Hit[] {
  let url: URL;
  try {
    url = new URL(req.url);
  } catch {
    return [];
  }
  let parts =
    (opts.rules?.length ? customHit(req, url, opts.rules) : null) ??
    ga4(req, url) ??
    ads(url) ??
    meta(req, url) ??
    tiktok(req, url) ??
    hotjar(url) ??
    gtm(url);
  for (const c of VENDOR_CLASSIFIERS) {
    if (parts) break;
    parts = c(req, url);
  }
  if (!parts && opts.other) parts = otherHit(req, url);
  return parts ? finish(req, parts, page) : [];
}

/**
 * dataLayer object pushes with an `event` key become Page hits. GTM's own events (gtm.js, gtm.click,
 * ...) become GTM hits, shown in the GTM tab. `platform` lets other data layers reuse this.
 */
export function dataLayerHit(
  entry: { time: number; value: unknown; approx?: boolean },
  id: string,
  page: number,
  pageUrl: string,
  platform: Platform = 'datalayer',
): Hit | null {
  const v = entry.value;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const event = (v as { event?: unknown }).event;
  if (typeof event !== 'string' || !event) return null;
  const rest = { ...(v as Record<string, unknown>) };
  delete rest.event;
  delete rest['gtm.uniqueEventId'];
  // gtm.js carries its real start time.
  const start = rest['gtm.start'];
  const exact = event === 'gtm.js' && typeof start === 'number' && start > 0;
  // GA4 ecommerce objects are shown without the "ecommerce." prefix, like the GA4 hit.
  const ecommerce = rest.ecommerce;
  delete rest.ecommerce;
  const params = [...flattenJson(ecommerce ?? {}), ...flattenJson(rest)];
  const isGtm = platform === 'datalayer' && event.startsWith('gtm.');
  return {
    id,
    requestId: id,
    time: exact ? Math.round(start) : entry.time,
    platform: isGtm ? 'gtm' : platform,
    event,
    route: 'page',
    method: 'PUSH',
    url: pageUrl,
    host: hostOf(pageUrl),
    params,
    context: [],
    page,
    ...(entry.approx && !exact ? { approx: true } : {}),
  };
}

/** An object data layer (digitalData, utag_data) as one Page hit with its fields. */
export function pageDataHit(
  platform: Platform,
  value: unknown,
  time: number,
  id: string,
  page: number,
  pageUrl: string,
): Hit {
  return {
    id,
    requestId: id,
    time,
    platform,
    event: platform === 'utagdata' ? 'utag_data' : 'digitalData',
    route: 'page',
    method: 'READ',
    url: pageUrl,
    host: hostOf(pageUrl),
    params: flattenJson(value ?? {}).slice(0, 200),
    context: [],
    page,
  };
}

export { queryOf };
