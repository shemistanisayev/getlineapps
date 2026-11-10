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

type Partial0 = Omit<
  Hit,
  'id' | 'requestId' | 'time' | 'method' | 'url' | 'host' | 'route' | 'page'
>;

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
  if (!url.pathname.endsWith('/g/collect')) return null;
  const shared = parseQuery(url.search);
  const tid = get(shared, 'tid') ?? '';
  if (get(shared, 'v') !== '2' || !/^G-[A-Z0-9]+$/i.test(tid)) return null;
  const lines = (req.body ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.includes('en='));
  const events = lines.length ? lines.map((l) => mergeParams(shared, parseQuery(l))) : [shared];
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
    return [
      {
        platform: 'ads',
        event: 'conversion',
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
  if (!url.pathname.startsWith('/api/v2/pixel')) return null;
  if (!hostMatches(url.hostname, 'tiktok.com')) return null;
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
      event: json?.event ?? '(unknown)',
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

/** Classifies one request. Returns [] for anything Hitline does not track. */
export function classifyRequest(req: RawRequest, page = 0): Hit[] {
  let url: URL;
  try {
    url = new URL(req.url);
  } catch {
    return [];
  }
  const parts =
    ga4(req, url) ?? ads(url) ?? meta(req, url) ?? tiktok(req, url) ?? hotjar(url) ?? gtm(url);
  return parts ? finish(req, parts, page) : [];
}

/** dataLayer object pushes with an `event` key become Page hits (gtm.* internals are skipped). */
export function dataLayerHit(
  entry: { time: number; value: unknown },
  id: string,
  page: number,
  pageUrl: string,
): Hit | null {
  const v = entry.value;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const event = (v as { event?: unknown }).event;
  if (typeof event !== 'string' || event.startsWith('gtm.')) return null;
  const rest = { ...(v as Record<string, unknown>) };
  delete rest.event;
  delete rest['gtm.uniqueEventId'];
  // GA4 ecommerce objects are shown without the "ecommerce." prefix, like the GA4 hit.
  const ecommerce = rest.ecommerce;
  delete rest.ecommerce;
  const params = [...flattenJson(ecommerce ?? {}), ...flattenJson(rest)];
  return {
    id,
    requestId: id,
    time: entry.time,
    platform: 'datalayer',
    event,
    route: 'page',
    method: 'PUSH',
    url: pageUrl,
    host: hostOf(pageUrl),
    params,
    context: [],
    page,
  };
}

export { queryOf };
