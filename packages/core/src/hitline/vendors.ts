/**
 * Request classifiers for the platforms added in 1.1 (docs/hitline/PLAN-1.1.md). Each returns
 * null when the request is not its platform, else one part per event the request carries.
 * The popup has no bodies: POST-only platforms then show the event as '(unknown)'.
 */
import { flattenJson, get, mergeParams, parseJson, parseQuery } from './decode.ts';
import { hostMatches } from './domain.ts';
import type { Hit, Param, RawRequest } from './types.ts';

export type HitPart = Omit<
  Hit,
  'id' | 'requestId' | 'time' | 'method' | 'url' | 'host' | 'route' | 'page'
>;
export type Classifier = (req: RawRequest, url: URL) => HitPart[] | null;

export const UNKNOWN_EVENT = '(unknown)';

const part = (
  platform: string,
  event: string,
  params: Param[] = [],
  context: Param[] = [],
  account?: string,
): HitPart => ({ platform, event, params, context, ...(account ? { account } : {}) });

const onHost = (url: URL, ...domains: string[]) =>
  domains.some((d) => hostMatches(url.hostname, d));

/** Base64 (also URL-safe) to text; undefined when it is not base64 JSON. */
export function fromBase64(s: string | undefined): unknown {
  if (!s) return undefined;
  try {
    const b = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return undefined;
  }
}

/** JSON body, or a form body whose `data` field is JSON or base64 JSON. */
function bodyJson(req: RawRequest, url?: URL): unknown {
  const direct = parseJson(req.body);
  if (direct !== undefined) return direct;
  const form = req.body && !req.body.trimStart().startsWith('{') ? parseQuery(req.body) : [];
  const data = get(form, 'data') ?? (url ? (url.searchParams.get('data') ?? undefined) : undefined);
  if (!data) return undefined;
  return parseJson(data) ?? fromBase64(data);
}

function formFields(req: RawRequest, url: URL): Param[] {
  const body =
    req.body && !/^\s*[[{]/.test(req.body) && req.body.includes('=') ? parseQuery(req.body) : [];
  return mergeParams(parseQuery(url.search), body);
}

const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v ? v : typeof v === 'number' ? String(v) : undefined;

/** Keeps only properties a person set (drops `$lib`-style internals and ids). */
function userProps(v: unknown, drop: (k: string) => boolean): Param[] {
  const o = asObj(v);
  const kept: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(o)) if (!drop(k)) kept[k] = val;
  return flattenJson(kept);
}

const pick = (fields: Param[], map: Record<string, string>): Param[] => {
  const out: Param[] = [];
  for (const [from, to] of Object.entries(map)) {
    const v = get(fields, from);
    if (v !== undefined && v !== '') out.push({ key: to, value: v });
  }
  return out;
};

const pageContext = (url?: string, referrer?: string): Param[] => [
  ...(url ? [{ key: 'page_location', value: url }] : []),
  ...(referrer ? [{ key: 'page_referrer', value: referrer }] : []),
];

/* Analytics */

const UA_PARAMS = {
  ec: 'event_category',
  ea: 'event_action',
  el: 'event_label',
  ev: 'value',
  ti: 'transaction_id',
  tr: 'revenue',
  cu: 'currency',
};

export const universal: Classifier = (req, url) => {
  if (!/\/(r\/|j\/)?collect$|\/batch$/.test(url.pathname) || /\/g\/collect$/.test(url.pathname))
    return null;
  const shared = parseQuery(url.search);
  const lines = (req.body ?? '').split(/\r?\n/).filter((l) => l.includes('tid='));
  const all = lines.length ? lines.map((l) => mergeParams(shared, parseQuery(l))) : [shared];
  const out = all
    .filter((f) => get(f, 'v') === '1' && /^UA-\d+-\d+$/.test(get(f, 'tid') ?? ''))
    .map((f) => {
      const t = get(f, 't') ?? 'hit';
      return part(
        'ua',
        t === 'event' ? (get(f, 'ea') ?? 'event') : t,
        pick(f, UA_PARAMS),
        [
          ...pageContext(get(f, 'dl'), get(f, 'dr')),
          ...pick(f, { cid: 'client_id', uid: 'user_id' }),
        ],
        get(f, 'tid'),
      );
    });
  return out.length ? out : null;
};

export const adobe: Classifier = (req, url) => {
  const m = /\/b\/ss\/([^/]+)\/\d+/.exec(url.pathname);
  if (!m) return null;
  const f = formFields(req, url);
  const link = /^lnk_[ode]$/.test(get(f, 'pe') ?? '');
  const params: Param[] = pick(f, {
    pageName: 'page_name',
    events: 'events',
    products: 'products',
    ch: 'channel',
    purchaseID: 'purchase_id',
    cc: 'currency',
  });
  for (const { key, value } of f) {
    const v = /^v(\d+)$/.exec(key);
    const c = /^c(\d+)$/.exec(key);
    if (v && value) params.push({ key: `eVar${v[1]}`, value });
    else if (c && value) params.push({ key: `prop${c[1]}`, value });
  }
  const event = link ? (get(f, 'pev2') ?? 'link') : 'pageview';
  return [
    part('adobe', event, params, pageContext(get(f, 'g'), get(f, 'r')), decodeURIComponent(m[1]!)),
  ];
};

export const aep: Classifier = (req, url) => {
  if (!/\/ee\/(?:[^/]+\/)?v\d+\/(interact|collect)/.test(url.pathname)) return null;
  const configId = url.searchParams.get('configId') ?? undefined;
  if (!configId) return null;
  const events = asArr(asObj(bodyJson(req)).events);
  if (!events.length) return [part('aep', UNKNOWN_EVENT, [], [], configId)];
  return events.map((e) => {
    const xdm = { ...asObj(asObj(e).xdm) };
    const web = asObj(asObj(xdm.web).webPageDetails);
    const type = str(xdm.eventType) ?? 'event';
    for (const k of [
      'web',
      'device',
      'environment',
      'implementationDetails',
      'timestamp',
      'identityMap',
      'eventType',
      '_id',
    ])
      delete xdm[k];
    return part(
      'aep',
      type,
      [...flattenJson(xdm), ...flattenJson(asObj(e).data ?? {})],
      pageContext(str(web.URL)),
      configId,
    );
  });
};

export const amplitude: Classifier = (req, url) => {
  if (!onHost(url, 'amplitude.com')) return null;
  if (!/^\/(2\/httpapi|batch)?\/?$/.test(url.pathname)) return null;
  const json = bodyJson(req);
  const form = req.body && !req.body.trimStart().startsWith('{') ? parseQuery(req.body) : [];
  const events = asArr(asObj(json).events ?? parseJson(get(form, 'e')));
  const key = str(asObj(json).api_key) ?? get(form, 'client');
  if (!events.length) return [part('amplitude', UNKNOWN_EVENT, [], [], key)];
  return events.map((e) => {
    const o = asObj(e);
    return part(
      'amplitude',
      str(o.event_type) ?? 'event',
      flattenJson(o.event_properties ?? {}),
      [],
      key,
    );
  });
};

const mpDrop = (k: string) =>
  k.startsWith('$') || k.startsWith('mp_') || ['token', 'distinct_id', 'time'].includes(k);

export const mixpanel: Classifier = (req, url) => {
  if (!onHost(url, 'mixpanel.com') || !/^\/track\/?$/.test(url.pathname)) return null;
  const json = bodyJson(req, url);
  const list = Array.isArray(json) ? json : json ? [json] : [];
  if (!list.length) return [part('mixpanel', UNKNOWN_EVENT)];
  return list.map((e) => {
    const props = asObj(asObj(e).properties);
    return part(
      'mixpanel',
      str(asObj(e).event) ?? 'event',
      userProps(props, mpDrop),
      pageContext(str(props.$current_url)),
      str(props.token),
    );
  });
};

/** Segment-style messages (Segment, RudderStack, Customer.io Data Pipelines). */
function segmentLike(platform: string, req: RawRequest): HitPart[] {
  const json = asObj(bodyJson(req));
  const msgs = Array.isArray(json.batch) ? json.batch : Object.keys(json).length ? [json] : [];
  if (!msgs.length) return [part(platform, UNKNOWN_EVENT)];
  return msgs.map((m) => {
    const o = asObj(m);
    const type = str(o.type) ?? 'track';
    const event =
      type === 'track'
        ? (str(o.event) ?? 'track')
        : type === 'page' || type === 'screen'
          ? type
          : type;
    const params = flattenJson(o.properties ?? o.traits ?? {});
    if (type === 'page' && str(o.name)) params.unshift({ key: 'name', value: str(o.name)! });
    const page = asObj(asObj(o.context).page);
    return part(
      platform,
      event,
      params,
      pageContext(str(page.url), str(page.referrer)),
      str(o.writeKey),
    );
  });
}

const SEGMENT_PATH = /^\/v1\/(t|p|i|g|a|s|m|b|batch|track|page|identify|group|alias|screen)\/?$/;

export const segment: Classifier = (req, url) => {
  if (onHost(url, 'cdn.segment.com') && /analytics(\.min)?\.js$/.test(url.pathname)) {
    return [
      part(
        'segment',
        'script',
        [],
        [],
        /\/v1\/projects\/([^/]+)|analytics\.js\/v1\/([^/]+)/
          .exec(url.pathname)
          ?.slice(1)
          .find(Boolean),
      ),
    ];
  }
  if (
    !onHost(url, 'segment.io', 'segment.com', 'segmentapis.com') ||
    !SEGMENT_PATH.test(url.pathname)
  )
    return null;
  return segmentLike('segment', req);
};

export const rudderstack: Classifier = (req, url) => {
  if (!onHost(url, 'rudderstack.com', 'rudderlabs.com') || !SEGMENT_PATH.test(url.pathname))
    return null;
  return segmentLike('rudderstack', req);
};

export const posthog: Classifier = (req, url) => {
  if (!onHost(url, 'posthog.com')) return null;
  if (!/^\/(e|i\/v0\/e|batch|capture|track)\/?$/.test(url.pathname)) return null;
  const json = bodyJson(req, url);
  const obj = asObj(json);
  const list = Array.isArray(json)
    ? json
    : Array.isArray(obj.batch)
      ? obj.batch
      : json
        ? [json]
        : [];
  if (!list.length) return [part('posthog', UNKNOWN_EVENT)];
  return list.map((e) => {
    const o = asObj(e);
    const props = asObj(o.properties);
    return part(
      'posthog',
      str(o.event) ?? 'event',
      userProps(props, (k) => k.startsWith('$') || k === 'token' || k === 'distinct_id'),
      pageContext(str(props.$current_url)),
      str(props.token) ?? str(o.api_key),
    );
  });
};

export const heap: Classifier = (req, url) => {
  if (onHost(url, 'cdn.heapanalytics.com')) {
    const m = /heap-(\d+)\.js$/.exec(url.pathname);
    return m ? [part('heap', 'script', [], [], m[1])] : null;
  }
  if (!onHost(url, 'heapanalytics.com', 'heap-api.com')) return null;
  if (url.pathname === '/h')
    return [part('heap', 'pageview', [], [], url.searchParams.get('a') ?? undefined)];
  if (!/^\/api\/track\/?$/.test(url.pathname)) return null;
  const o = asObj(bodyJson(req));
  return [
    part('heap', str(o.event) ?? UNKNOWN_EVENT, flattenJson(o.properties ?? {}), [], str(o.app_id)),
  ];
};

/** Matomo tracking request fields (one request, or one line of a bulk request). */
function matomoHit(platform: string, f: Param[]): HitPart | null {
  if (!get(f, 'idsite') || get(f, 'ping') === '1') return null;
  let event = 'hit';
  const params: Param[] = [];
  if (get(f, 'e_a') !== undefined) {
    event = get(f, 'e_a')!;
    params.push(...pick(f, { e_c: 'category', e_a: 'action', e_n: 'name', e_v: 'value' }));
  } else if (get(f, 'idgoal') !== undefined) {
    event = get(f, 'ec_id') ? 'ecommerce_order' : 'goal';
    params.push(...pick(f, { idgoal: 'goal_id', revenue: 'revenue', ec_id: 'order_id' }));
  } else if (get(f, 'search') !== undefined) {
    event = 'site_search';
    params.push(...pick(f, { search: 'keyword', search_cat: 'category' }));
  } else if (get(f, 'link')) event = 'outlink';
  else if (get(f, 'download')) event = 'download';
  else if (get(f, 'action_name') !== undefined || get(f, 'pv_id')) {
    event = 'pageview';
    params.push(...pick(f, { action_name: 'page_title' }));
  }
  return part(
    platform,
    event,
    params,
    pageContext(get(f, 'url'), get(f, 'urlref')),
    get(f, 'idsite'),
  );
}

function matomoLike(platform: string, req: RawRequest, url: URL): HitPart[] | null {
  const json = asObj(parseJson(req.body));
  if (Array.isArray(json.requests)) {
    const out = json.requests
      .map((r) =>
        typeof r === 'string' ? matomoHit(platform, parseQuery(r.replace(/^[^?]*\?/, ''))) : null,
      )
      .filter((h): h is HitPart => h !== null);
    return out.length ? out : null;
  }
  const h = matomoHit(platform, formFields(req, url));
  return h ? [h] : null;
}

export const matomo: Classifier = (req, url) =>
  /\/(matomo|piwik)\.php$/.test(url.pathname) ? matomoLike('matomo', req, url) : null;

export const piwikpro: Classifier = (req, url) =>
  /\/ppms\.php$/.test(url.pathname) ? matomoLike('piwikpro', req, url) : null;

const SNOWPLOW_EVENTS: Record<string, string> = {
  pv: 'page_view',
  se: 'structured',
  tr: 'transaction',
  ti: 'transaction_item',
};

function snowplowHit(f: Param[]): HitPart | null {
  const e = get(f, 'e');
  if (!e || e === 'pp') return null; // page pings every few seconds: noise
  let event = SNOWPLOW_EVENTS[e] ?? e;
  const params: Param[] = [];
  if (e === 'se') {
    event = get(f, 'se_ac') ?? 'structured';
    params.push(
      ...pick(f, {
        se_ca: 'category',
        se_ac: 'action',
        se_la: 'label',
        se_pr: 'property',
        se_va: 'value',
      }),
    );
  }
  if (e === 'ue') {
    const ue = asObj(parseJson(get(f, 'ue_pr')) ?? fromBase64(get(f, 'ue_px')));
    const inner = asObj(ue.data);
    const schema = str(inner.schema) ?? '';
    event = /\/([^/]+)\/jsonschema\//.exec(schema)?.[1] ?? 'self_describing';
    params.push(...flattenJson(inner.data ?? {}));
  }
  return part('snowplow', event, params, pageContext(get(f, 'url'), get(f, 'refr')), get(f, 'aid'));
}

export const snowplow: Classifier = (req, url) => {
  if (/\/com\.snowplowanalytics\.snowplow\/tp2$/.test(url.pathname)) {
    const data = asArr(asObj(parseJson(req.body)).data);
    const out = data
      .map((d) =>
        snowplowHit(Object.entries(asObj(d)).map(([key, v]) => ({ key, value: String(v ?? '') }))),
      )
      .filter((h): h is HitPart => h !== null);
    return out.length ? out : null;
  }
  if (url.pathname.endsWith('/i') && /^(js|sp)-/.test(url.searchParams.get('tv') ?? '')) {
    const h = snowplowHit(parseQuery(url.search));
    return h ? [h] : null;
  }
  return null;
};

export const yandex: Classifier = (_req, url) => {
  if (!/^mc\.yandex\.[a-z.]+$/.test(url.hostname)) return null;
  const m = /^\/watch\/(\d+)/.exec(url.pathname);
  if (!m) return null;
  const q = parseQuery(url.search);
  const pageUrl = get(q, 'page-url') ?? '';
  const goal = /^goal:\/\/[^/]+\/(.+)$/.exec(pageUrl);
  const info = get(q, 'browser-info') ?? '';
  const event = goal ? goal[1]! : /(^|:)pv:1(:|$)/.test(info) ? 'pageview' : 'hit';
  const params = goal ? [{ key: 'goal', value: goal[1]! }] : [];
  const site = parseJson(get(q, 'site-info'));
  if (site) params.push(...flattenJson(site));
  return [
    part(
      'yandex',
      event,
      params,
      goal ? [] : pageContext(pageUrl || undefined, get(q, 'page-ref')),
      m[1],
    ),
  ];
};

export const plausible: Classifier = (req, url) => {
  if (!url.pathname.endsWith('/api/event')) return null;
  const o = asObj(parseJson(req.body));
  if (str(o.n) && str(o.d)) {
    return [
      part(
        'plausible',
        str(o.n)!,
        flattenJson(o.p ?? o.props ?? {}),
        pageContext(str(o.u) ?? str(o.url)),
        str(o.d),
      ),
    ];
  }
  return onHost(url, 'plausible.io') ? [part('plausible', UNKNOWN_EVENT)] : null;
};

/* Session recording */

export const clarity: Classifier = (_req, url) => {
  if (!onHost(url, 'clarity.ms')) return null;
  const m = /^\/tag\/([a-z0-9]+)/i.exec(url.pathname);
  return m ? [part('clarity', 'script', [], [], m[1])] : null;
};

export const fullstory: Classifier = (_req, url) => {
  if (onHost(url, 'fullstory.com') && /\/s\/fs\.js$/.test(url.pathname))
    return [part('fullstory', 'script')];
  if (onHost(url, 'fullstory.com') && /^\/rec\/page$/.test(url.pathname))
    return [part('fullstory', 'page')];
  return null;
};

export const mouseflow: Classifier = (_req, url) => {
  const m = /^\/projects\/([a-z0-9-]+)\.js$/i.exec(url.pathname);
  return m && onHost(url, 'mouseflow.com') ? [part('mouseflow', 'script', [], [], m[1])] : null;
};

export const contentsquare: Classifier = (_req, url) => {
  if (!onHost(url, 'contentsquare.net')) return null;
  const m = /^\/uxa\/([a-z0-9]+)\.js$/i.exec(url.pathname);
  if (m) return [part('contentsquare', 'script', [], [], m[1])];
  return /^\/pageview\/?$/.test(url.pathname) ? [part('contentsquare', 'pageview')] : null;
};

/* Ad pixels */

export const floodlight: Classifier = (_req, url) => {
  if (!onHost(url, 'ad.doubleclick.net', 'fls.doubleclick.net')) return null;
  const m = /^\/activity[ij]?;(.*)$/.exec(url.pathname);
  if (!m) return null;
  const f = m[1]!
    .split(';')
    .filter(Boolean)
    .map((kv) => {
      const eq = kv.indexOf('=');
      return { key: kv.slice(0, eq), value: decodeURIComponent(kv.slice(eq + 1)) };
    });
  const params = pick(f, {
    type: 'type',
    cat: 'activity',
    qty: 'quantity',
    cost: 'value',
    ord: 'order_id',
  });
  for (const p of f) if (/^u\d+$/.test(p.key)) params.push(p);
  return [part('floodlight', get(f, 'cat') ?? 'activity', params, [], get(f, 'src'))];
};

export const bing: Classifier = (_req, url) => {
  if (!onHost(url, 'bat.bing.com', 'bat.bing.net') || !/^\/action\/0/.test(url.pathname))
    return null;
  const q = parseQuery(url.search);
  const evt = get(q, 'evt') ?? 'pageLoad';
  const event = evt === 'custom' ? (get(q, 'ea') ?? 'custom') : evt;
  const params = pick(q, {
    ec: 'event_category',
    ea: 'event_action',
    el: 'event_label',
    ev: 'event_value',
    gv: 'value',
    gc: 'currency',
    asc: 'consent',
  });
  return [part('bing', event, params, pageContext(get(q, 'p'), get(q, 'r')), get(q, 'ti'))];
};

export const linkedin: Classifier = (req, url) => {
  if (!onHost(url, 'ads.linkedin.com')) return null;
  if (/^\/collect\/?$/.test(url.pathname)) {
    const q = parseQuery(url.search);
    const conv = get(q, 'conversionId');
    return [
      part(
        'linkedin',
        conv ? 'conversion' : 'pageview',
        conv ? [{ key: 'conversion_id', value: conv }] : [],
        pageContext(get(q, 'url')),
        get(q, 'pid'),
      ),
    ];
  }
  if (/^\/wa\/?$/.test(url.pathname)) {
    const o = asObj(parseJson(req.body));
    const conv = str(o.conversionId);
    const pids = asArr(o.pids).map(String).join(',');
    return [
      part(
        'linkedin',
        conv ? 'conversion' : req.body ? 'pageview' : UNKNOWN_EVENT,
        conv ? [{ key: 'conversion_id', value: conv }] : [],
        pageContext(str(o.url)),
        pids || undefined,
      ),
    ];
  }
  return null;
};

export const x: Classifier = (_req, url) => {
  if (!onHost(url, 'analytics.twitter.com', 't.co', 'ads-twitter.com', 'ads-api.x.com'))
    return null;
  if (!/\/i\/adsct$/.test(url.pathname)) return null;
  const q = parseQuery(url.search);
  const events = asArr(parseJson(get(q, 'events')));
  const first = asArr(events[0]);
  const event = str(first[0]) ?? get(q, 'event') ?? 'pageview';
  const params = flattenJson(first[1] ?? {});
  params.push(...pick(q, { tw_sale_amount: 'value', tw_order_quantity: 'quantity' }));
  return [part('x', event, params, [], get(q, 'txn_id'))];
};

export const pinterest: Classifier = (_req, url) => {
  if (!onHost(url, 'ct.pinterest.com') || !/^\/(v3|user)\/?$/.test(url.pathname)) return null;
  const q = parseQuery(url.search);
  const params = flattenJson(parseJson(get(q, 'ed')) ?? {});
  return [part('pinterest', get(q, 'event') ?? 'pagevisit', params, [], get(q, 'tid'))];
};

const SNAP_PARAMS = {
  price: 'value',
  currency: 'currency',
  transaction_id: 'transaction_id',
  item_ids: 'item_ids',
  item_category: 'item_category',
  number_items: 'number_items',
  search_string: 'search_string',
  sign_up_method: 'sign_up_method',
};

export const snapchat: Classifier = (req, url) => {
  if (!onHost(url, 'tr.snapchat.com', 'tr-shadow.snapchat.com')) return null;
  if (!/^\/(gateway\/)?p\/?$/.test(url.pathname)) return null;
  const f = formFields(req, url);
  const ev = get(f, 'ev');
  return [
    part(
      'snapchat',
      ev ?? UNKNOWN_EVENT,
      pick(f, SNAP_PARAMS),
      pageContext(get(f, 'pl'), get(f, 'rf')),
      get(f, 'pid'),
    ),
  ];
};

export const reddit: Classifier = (_req, url) => {
  if (!onHost(url, 'alb.reddit.com') || url.pathname !== '/rp.gif') return null;
  const q = parseQuery(url.search);
  const ev = get(q, 'event') ?? 'PageVisit';
  const params: Param[] = [];
  for (const p of q)
    if (p.key.startsWith('m.') && p.value) params.push({ key: p.key.slice(2), value: p.value });
  const event = ev === 'Custom' ? (get(q, 'm.customEventName') ?? 'Custom') : ev;
  return [part('reddit', event, params, [], get(q, 'id'))];
};

export const quora: Classifier = (_req, url) => {
  const m = /^\/_\/ad\/([a-z0-9]+)\/pixel/i.exec(url.pathname);
  if (!m || !onHost(url, 'q.quora.com')) return null;
  return [part('quora', url.searchParams.get('tag') ?? 'ViewContent', [], [], m[1])];
};

const CRITEO_EVENTS: Record<string, string> = {
  vh: 'viewHome',
  vl: 'viewList',
  vp: 'viewItem',
  vb: 'viewBasket',
  vs: 'trackTransaction',
};

export const criteo: Classifier = (_req, url) => {
  if (!onHost(url, 'criteo.com') || !/^\/event\/?$/.test(url.pathname)) return null;
  const q = parseQuery(url.search);
  const names: string[] = [];
  const params: Param[] = [];
  for (const p of q) {
    if (!/^p\d+$/.test(p.key)) continue;
    const inner = parseQuery(p.value);
    const name = CRITEO_EVENTS[get(inner, 'e') ?? ''];
    if (!name) continue;
    names.push(name);
    for (const ip of inner)
      if (ip.key !== 'e')
        params.push({ key: ip.key === 'p' ? 'products' : ip.key, value: ip.value });
  }
  return [part('criteo', names.join(', ') || 'event', params, [], get(q, 'a'))];
};

export const taboola: Classifier = (_req, url) => {
  if (!onHost(url, 'taboola.com')) return null;
  const m = /^\/([^/]+)\/log\/3\/unip/.exec(url.pathname);
  if (!m) return null;
  const q = parseQuery(url.search);
  return [
    part(
      'taboola',
      get(q, 'en') ?? 'event',
      pick(q, {
        revenue: 'value',
        currency: 'currency',
        orderid: 'order_id',
        quantity: 'quantity',
      }),
      [],
      get(q, 'id') ?? m[1],
    ),
  ];
};

export const outbrain: Classifier = (_req, url) => {
  if (!onHost(url, 'tr.outbrain.com') || !/^\/(unifiedPixel|pixel)\/?$/.test(url.pathname))
    return null;
  const q = parseQuery(url.search);
  return [
    part(
      'outbrain',
      get(q, 'name') ?? 'PAGE_VIEW',
      pick(q, { orderValue: 'value', currency: 'currency', orderId: 'order_id' }),
      [],
      get(q, 'marketerId'),
    ),
  ];
};

export const amazon: Classifier = (_req, url) => {
  if (onHost(url, 'c.amazon-adsystem.com') && /\/aat\/amzn\.js$/.test(url.pathname))
    return [part('amazon', 'script')];
  if (!onHost(url, 's.amazon-adsystem.com') || !/^\/iui?3$/.test(url.pathname)) return null;
  const q = parseQuery(url.search);
  // iu3 is also the publisher cookie sync: only the Ads tag carries pid and event.
  if (!get(q, 'pid') || !get(q, 'event')) return null;
  return [part('amazon', get(q, 'event')!, [], [], get(q, 'pid'))];
};

export const awin: Classifier = (_req, url) => {
  if (onHost(url, 'dwin1.com')) {
    const m = /^\/(\d+)\.js$/.exec(url.pathname);
    return m ? [part('awin', 'mastertag', [], [], m[1])] : null;
  }
  if (!onHost(url, 'awin1.com') || !/^\/sread\.(js|php|img)$/.test(url.pathname)) return null;
  const q = parseQuery(url.search);
  return [
    part(
      'awin',
      'conversion',
      pick(q, {
        amount: 'value',
        cr: 'currency',
        ref: 'order_ref',
        ch: 'channel',
        parts: 'commission_groups',
      }),
      [],
      get(q, 'merchant') ?? get(q, 'a'),
    ),
  ];
};

/* CRM and marketing automation */

export const hubspot: Classifier = (_req, url) => {
  if (onHost(url, 'js.hs-scripts.com')) {
    const m = /^\/(\d+)\.js$/.exec(url.pathname);
    return m ? [part('hubspot', 'script', [], [], m[1])] : null;
  }
  if (onHost(url, 'track.hubspot.com') && url.pathname === '/__ptq.gif') {
    const q = parseQuery(url.search);
    return [
      part(
        'hubspot',
        get(q, 'n') ?? 'pageview',
        [],
        pageContext(get(q, 'pu'), get(q, 'r')),
        get(q, 'a'),
      ),
    ];
  }
  if (
    (onHost(url, 'hscollectedforms.net') && url.pathname.includes('/collected-forms/submit')) ||
    (onHost(url, 'forms.hubspot.com', 'api.hsforms.com') && url.pathname.includes('/submissions'))
  ) {
    return [part('hubspot', 'form_submit')];
  }
  return null;
};

export const klaviyo: Classifier = (req, url) => {
  if (onHost(url, 'static.klaviyo.com') && /klaviyo\.js$/.test(url.pathname)) {
    return [part('klaviyo', 'script', [], [], url.searchParams.get('company_id') ?? undefined)];
  }
  if (!onHost(url, 'a.klaviyo.com')) return null;
  const company = url.searchParams.get('company_id') ?? undefined;
  if (/^\/api\/track\/?$/.test(url.pathname)) {
    const o = asObj(bodyJson(req, url));
    return [
      part(
        'klaviyo',
        str(o.event) ?? UNKNOWN_EVENT,
        flattenJson(o.properties ?? {}),
        [],
        str(o.token) ?? company,
      ),
    ];
  }
  if (/^\/client\/events\/?$/.test(url.pathname)) {
    const attrs = asObj(asObj(asObj(parseJson(req.body)).data).attributes);
    const metric = asObj(attrs.metric);
    const name = str(asObj(asObj(metric.data).attributes).name) ?? str(metric.name);
    return [
      part('klaviyo', name ?? UNKNOWN_EVENT, flattenJson(attrs.properties ?? {}), [], company),
    ];
  }
  if (/^\/(api\/identify|client\/profiles)\/?$/.test(url.pathname))
    return [part('klaviyo', 'identify', [], [], company)];
  if (/^\/client\/subscriptions\/?$/.test(url.pathname))
    return [part('klaviyo', 'subscribe', [], [], company)];
  return null;
};

export const marketo: Classifier = (_req, url) => {
  if (onHost(url, 'munchkin.marketo.net') && /munchkin(-beta)?\.js$/.test(url.pathname))
    return [part('marketo', 'script')];
  const host = /^(\d{3}-[a-z]{3}-\d{3})\.mktoresp\.com$/i.exec(url.hostname);
  const m = /^\/webevents\/(visitWebPage|clickLink)$/.exec(url.pathname);
  return host && m ? [part('marketo', m[1]!, [], [], host[1]!.toUpperCase())] : null;
};

export const pardot: Classifier = (_req, url) => {
  if (!onHost(url, 'pardot.com')) return null;
  if (url.pathname === '/pd.js') return [part('pardot', 'script')];
  if (url.pathname !== '/analytics') return null;
  const q = parseQuery(url.search);
  return [part('pardot', 'pageview', [], pageContext(get(q, 'url')), get(q, 'piAId'))];
};

const BRAZE_EVENTS: Record<string, string> = {
  ss: 'session_start',
  se: 'session_end',
  p: 'purchase',
  lr: 'location',
};

export const braze: Classifier = (req, url) => {
  if (!/\.(braze\.com|braze\.eu|appboy\.com|appboy\.eu)$/.test(url.hostname)) return null;
  if (!/^\/api\/v3\/data\/?$/.test(url.pathname)) return null;
  const o = asObj(parseJson(req.body));
  const key = str(o.api_key);
  const events = asArr(o.events);
  if (!events.length) return req.body ? null : [part('braze', UNKNOWN_EVENT, [], [], key)];
  return events.map((e) => {
    const ev = asObj(e);
    const data = asObj(ev.data);
    const name = str(ev.name) ?? 'event';
    const event = name === 'ce' ? (str(data.n) ?? 'custom') : (BRAZE_EVENTS[name] ?? name);
    return part('braze', event, flattenJson(name === 'ce' ? (data.p ?? {}) : data), [], key);
  });
};

export const customerio: Classifier = (req, url) => {
  if (onHost(url, 'assets.customer.io') && /track\.js$/.test(url.pathname))
    return [part('customerio', 'script')];
  if (onHost(url, 'cdp.customer.io', 'cdp-eu.customer.io') && SEGMENT_PATH.test(url.pathname))
    return segmentLike('customerio', req);
  if (onHost(url, 'track.customer.io', 'track-eu.customer.io')) {
    const o = asObj(parseJson(req.body));
    return [
      part(
        'customerio',
        str(o.name) ?? url.searchParams.get('name') ?? 'track',
        flattenJson(o.data ?? {}),
      ),
    ];
  }
  return null;
};

/* Tag managers */

export const gtag: Classifier = (_req, url) => {
  if (!url.pathname.endsWith('/gtag/js')) return null;
  const id = url.searchParams.get('id') ?? '';
  if (!/^(G|AW|DC|GT|UA)-[A-Z0-9-]+$/i.test(id)) return null;
  const params = url.searchParams.get('cx') === 'c' ? [{ key: 'loaded_by', value: 'GTM' }] : [];
  return [part('gtag', 'script', params, [], id)];
};

export const tealium: Classifier = (req, url) => {
  if (onHost(url, 'tags.tiqcdn.com')) {
    const m = /^\/utag\/([^/]+)\/([^/]+)\/([^/]+)\/utag\.js$/.exec(url.pathname);
    return m
      ? [
          part(
            'tealium',
            'container',
            [{ key: 'environment', value: m[3]! }],
            [],
            `${m[1]}/${m[2]}`,
          ),
        ]
      : null;
  }
  if (onHost(url, 'collect.tealiumiq.com') && /^\/event\/?$/.test(url.pathname)) {
    const o = asObj(parseJson(req.body));
    const data = asObj(o.data ?? o);
    return [
      part('tealium', str(data.tealium_event) ?? UNKNOWN_EVENT, [], [], str(data.tealium_account)),
    ];
  }
  return null;
};

export const launch: Classifier = (_req, url) => {
  if (!onHost(url, 'assets.adobedtm.com')) return null;
  const m = /\/(launch-[a-z0-9]+)(-development|-staging)?(\.min)?\.js$/i.exec(url.pathname);
  if (m)
    return [
      part(
        'launch',
        'container',
        m[2] ? [{ key: 'environment', value: m[2].slice(1) }] : [],
        [],
        m[1],
      ),
    ];
  return /satelliteLib-[a-z0-9]+\.js$/i.test(url.pathname) ? [part('launch', 'container')] : null;
};

/* A/B testing */

export const optimizely: Classifier = (req, url) => {
  if (onHost(url, 'cdn.optimizely.com')) {
    const m = /^\/js\/(\d+)\.js$/.exec(url.pathname);
    return m ? [part('optimizely', 'script', [], [], m[1])] : null;
  }
  if (!onHost(url, 'logx.optimizely.com') || !/^\/v1\/events\/?$/.test(url.pathname)) return null;
  const o = asObj(parseJson(req.body));
  const account = str(o.account_id);
  const out: HitPart[] = [];
  for (const v of asArr(o.visitors)) {
    for (const s of asArr(asObj(v).snapshots)) {
      for (const d of asArr(asObj(s).decisions)) {
        const dd = asObj(d);
        out.push(
          part(
            'optimizely',
            'decision',
            pick(
              Object.entries(dd).map(([key, val]) => ({ key, value: String(val ?? '') })),
              {
                campaign_id: 'campaign_id',
                experiment_id: 'experiment_id',
                variation_id: 'variation_id',
              },
            ),
            [],
            account,
          ),
        );
      }
      for (const e of asArr(asObj(s).events)) {
        const ev = asObj(e);
        if (str(ev.key) === 'campaign_activated') continue;
        out.push(
          part(
            'optimizely',
            str(ev.key) ?? str(ev.type) ?? 'event',
            flattenJson(ev.tags ?? {}),
            [],
            account,
          ),
        );
      }
    }
  }
  return out.length ? out : [part('optimizely', UNKNOWN_EVENT, [], [], account)];
};

export const vwo: Classifier = (_req, url) => {
  if (!onHost(url, 'visualwebsiteoptimizer.com')) return null;
  const q = parseQuery(url.search);
  if (url.pathname === '/j.php') return [part('vwo', 'script', [], [], get(q, 'a'))];
  if (/^\/events\/t\/?$/.test(url.pathname))
    return [part('vwo', get(q, 'en') ?? 'event', [], [], get(q, 'a'))];
  return null;
};

export const abtasty: Classifier = (req, url) => {
  if (onHost(url, 'try.abtasty.com')) {
    const m = /^\/([a-f0-9]+)\.js$/i.exec(url.pathname);
    return m ? [part('abtasty', 'script', [], [], m[1])] : null;
  }
  if (!onHost(url, 'ariane.abtasty.com')) return null;
  const json = parseJson(req.body);
  const list = Array.isArray(json) ? json : json ? [json] : [];
  if (!list.length) return [part('abtasty', UNKNOWN_EVENT)];
  return list.map((m) => {
    const o = asObj(m);
    const t = str(o.t) ?? 'event';
    return part(
      'abtasty',
      t === 'EVENT' ? (str(o.ea) ?? 'event') : t.toLowerCase(),
      pick(
        Object.entries(o).map(([key, v]) => ({ key, value: String(v ?? '') })),
        { ec: 'category', ea: 'action', el: 'label', cid: 'campaign_id', vid: 'variation_id' },
      ),
      [],
      str(o.cid),
    );
  });
};

/** In the order they are tried (after GA4, Google Ads, Meta, TikTok, Hotjar and GTM). */
export const VENDOR_CLASSIFIERS: Classifier[] = [
  universal,
  adobe,
  aep,
  amplitude,
  mixpanel,
  segment,
  rudderstack,
  posthog,
  heap,
  matomo,
  piwikpro,
  snowplow,
  yandex,
  plausible,
  clarity,
  fullstory,
  mouseflow,
  contentsquare,
  floodlight,
  bing,
  linkedin,
  x,
  pinterest,
  snapchat,
  reddit,
  quora,
  criteo,
  taboola,
  outbrain,
  amazon,
  awin,
  hubspot,
  klaviyo,
  marketo,
  pardot,
  braze,
  customerio,
  gtag,
  tealium,
  launch,
  optimizely,
  vwo,
  abtasty,
];

/** Hosts of known vendors: never reported as "Other" even when no classifier matched (Clarity uploads, ...). */
export const KNOWN_VENDOR_DOMAINS = [
  'google-analytics.com',
  'analytics.google.com',
  'googletagmanager.com',
  'googleadservices.com',
  'doubleclick.net',
  'google.com',
  'facebook.com',
  'facebook.net',
  'tiktok.com',
  'tiktokw.us',
  'hotjar.com',
  'hotjar.io',
  'clarity.ms',
  'fullstory.com',
  'mouseflow.com',
  'contentsquare.net',
  'amplitude.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'segmentapis.com',
  'rudderstack.com',
  'posthog.com',
  'heapanalytics.com',
  'heap-api.com',
  'yandex.ru',
  'yandex.com',
  'plausible.io',
  'bing.com',
  'bing.net',
  'linkedin.com',
  'twitter.com',
  'ads-twitter.com',
  't.co',
  'pinterest.com',
  'snapchat.com',
  'reddit.com',
  'quora.com',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'amazon-adsystem.com',
  'awin1.com',
  'dwin1.com',
  'hubspot.com',
  'hs-scripts.com',
  'hs-analytics.net',
  'hscollectedforms.net',
  'klaviyo.com',
  'marketo.net',
  'mktoresp.com',
  'pardot.com',
  'braze.com',
  'braze.eu',
  'customer.io',
  'tiqcdn.com',
  'tealiumiq.com',
  'adobedtm.com',
  'omtrdc.net',
  'adobedc.net',
  'optimizely.com',
  'visualwebsiteoptimizer.com',
  'abtasty.com',
];
