/**
 * GTM container from the gtm.js response body (see docs/hitline/PLAN.md, gap G4, and PLAN-1.1.md).
 * Public gtm.js has tag types, trigger rules and consent settings, but no names, so readable names
 * are built from what each tag and condition does. Triggers are evaluated against the dataLayer
 * model at each event: 'yes', 'no', or 'maybe' when a condition needs a value Hitline cannot read
 * (Custom JavaScript, cookies, CSS selectors).
 */
import type { Platform } from './types.ts';

export type TagStatus =
  'fired' | 'triggered' | 'missing_value' | 'no_consent_check' | 'waiting_consent' | 'not_fired';

export type Tri = 'yes' | 'no' | 'maybe';

export interface GtmTag {
  index: number;
  name: string;
  /** Google Tag, GA4 Event, Google Ads, Custom HTML, Hotjar, or the raw template id. */
  type: string;
  platform?: Platform;
  /** Event the tag sends (GA4 event name, Meta/TikTok event); undefined for base tags. */
  event?: string;
  /** Base tags (Google Tag, Meta Pixel Base, TikTok Pixel) match any hit of their platform. */
  base: boolean;
  /** Works inside the page without a request Hitline can see (Conversion Linker, Custom HTML). */
  silent?: boolean;
  /** Readable firing triggers, e.g. "Just Links: Click URL contains /checkout". */
  trigger: string;
  /** Event names the firing triggers listen to ('gtm.js', 'add_to_cart', ...). */
  triggerEvents: string[];
  /** Readable exception (blocking) triggers. */
  blocking: string[];
  /** Consent signals the tag waits for ("Additional consent checks"). */
  consent: string[];
  paused: boolean;
}

export interface GtmContainer {
  id: string;
  tags: GtmTag[];
  triggers: number;
  variables: number;
  /** True when built from hits because the container JSON was not available. */
  estimated: boolean;
  /** The raw container, kept for trigger evaluation. */
  resource?: Resource;
}

/** Extracts the JSON object that follows `"resource":` (string-aware brace matching). */
export function extractResource(body: string): unknown {
  const at = body.search(/["']?resource["']?\s*:\s*\{/);
  if (at < 0) return null;
  const start = body.indexOf('{', at);
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < body.length; i++) {
    const c = body[i]!;
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try {
        return JSON.parse(body.slice(start, i + 1)) as unknown;
      } catch {
        return null;
      }
    }
  }
  return null;
}

type RawTag = Record<string, unknown> & {
  function?: string;
  vtp_eventName?: string;
  vtp_html?: string;
  consent?: unknown;
  paused?: boolean;
};
interface RawPredicate {
  function?: string;
  arg0?: unknown;
  arg1?: unknown;
  ignore_case?: boolean;
  any_of?: boolean;
}
type RawMacro = Record<string, unknown> & { function?: string };
export interface Resource {
  tags?: RawTag[];
  macros?: RawMacro[];
  predicates?: RawPredicate[];
  rules?: unknown[][][];
}

/** GTM's built-in listeners and Google tag internals: not tags a person created. */
const INTERNAL =
  /^__(lcl|cl|fsl|hl|sdl|tl|ytl|evl|jel|tg|gct|rep|zone|set_product_settings|ccd_.*|ogt_.*|dlm|sp_mrkt.*)$/;

type Described = Pick<GtmTag, 'name' | 'platform' | 'event' | 'base' | 'silent'>;

/** Snippet patterns in Custom HTML: [regex for an event call, platform, display name, base regex]. */
const HTML_PIXELS: [RegExp | null, Platform, string, RegExp][] = [
  [
    /fbq\(\s*['"]track(?:Custom)?['"]\s*,\s*['"]([^'"]+)['"]/,
    'meta',
    'Meta',
    /fbq\(\s*['"]init['"]|connect\.facebook\.net/,
  ],
  [/ttq\.track\(\s*['"]([^'"]+)['"]/, 'tiktok', 'TikTok', /ttq\.load\(|analytics\.tiktok\.com/],
  [
    /pintrk\(\s*['"]track['"]\s*,\s*['"]([^'"]+)['"]/,
    'pinterest',
    'Pinterest',
    /pintrk\(\s*['"]load['"]|s\.pinimg\.com\/ct/,
  ],
  [
    /snaptr\(\s*['"]track['"]\s*,\s*['"]([^'"]+)['"]/,
    'snapchat',
    'Snapchat',
    /snaptr\(\s*['"]init['"]|sc-static\.net/,
  ],
  [
    /rdt\(\s*['"]track['"]\s*,\s*['"]([^'"]+)['"]/,
    'reddit',
    'Reddit',
    /rdt\(\s*['"]init['"]|redditstatic\.com/,
  ],
  [
    /twq\(\s*['"]event['"]\s*,\s*['"]([^'"]+)['"]/,
    'x',
    'X',
    /twq\(\s*['"](init|config)['"]|static\.ads-twitter\.com/,
  ],
  [
    /uetq\.push\(\s*['"]event['"]\s*,\s*['"]([^'"]+)['"]/,
    'bing',
    'Microsoft Ads',
    /bat\.bing\.com|uetq/,
  ],
  [/lintrk\(\s*['"]track['"]/, 'linkedin', 'LinkedIn', /_linkedin_partner_id|snap\.licdn\.com/],
  [/qp\(\s*['"]track['"]\s*,\s*['"]([^'"]+)['"]/, 'quora', 'Quora', /qp\(\s*['"]init['"]/],
  [null, 'criteo', 'Criteo', /criteo_q|static\.criteo\.net/],
  [null, 'taboola', 'Taboola', /_tfa\.push|cdn\.taboola\.com/],
  [null, 'outbrain', 'Outbrain', /obApi\(|amplify\.outbrain\.com/],
  [
    /ym\(\s*\d+\s*,\s*['"]reachGoal['"]\s*,\s*['"]([^'"]+)['"]/,
    'yandex',
    'Yandex Metrica',
    /mc\.yandex\.|ym\(\s*\d+\s*,\s*['"]init['"]/,
  ],
  [
    /_paq\.push\(\s*\[\s*['"]trackEvent['"]\s*,\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]/,
    'matomo',
    'Matomo',
    /_paq\.push|matomo\.js|piwik\.js/,
  ],
  [/mixpanel\.track\(\s*['"]([^'"]+)['"]/, 'mixpanel', 'Mixpanel', /mixpanel\.init/],
  [
    /amplitude\.(?:track|logEvent)\(\s*['"]([^'"]+)['"]/,
    'amplitude',
    'Amplitude',
    /amplitude\.(init|getInstance)/,
  ],
  [
    /analytics\.track\(\s*['"]([^'"]+)['"]/,
    'segment',
    'Segment',
    /cdn\.segment\.com|analytics\.load\(/,
  ],
  [/posthog\.capture\(\s*['"]([^'"]+)['"]/, 'posthog', 'PostHog', /posthog\.init/],
  [
    /klaviyo\.track\(\s*['"]([^'"]+)['"]|_learnq\.push\(\s*\[\s*['"]track['"]\s*,\s*['"]([^'"]+)['"]/,
    'klaviyo',
    'Klaviyo',
    /static\.klaviyo\.com|_learnq/,
  ],
  [null, 'hubspot', 'HubSpot', /js\.hs-scripts\.com|_hsq\.push/],
  [null, 'clarity', 'Microsoft Clarity', /clarity\.ms|\bclarity\(/],
  [null, 'hotjar', 'Hotjar', /hotjar/i],
  [
    /gtag\(\s*['"]event['"]\s*,\s*['"]([^'"]+)['"]/,
    'ga4',
    'GA4',
    /gtag\(\s*['"]config['"]\s*,\s*['"]G-/,
  ],
];

function htmlTag(html: string): Described {
  for (const [track, platform, name, base] of HTML_PIXELS) {
    const m = track?.exec(html);
    const event = m ? (m[1] ?? m[2]) : undefined;
    if (m && !base.test(html)) {
      return { name: event ? `${name} ${event}` : name, platform, event, base: false };
    }
    if (base.test(html)) {
      return platform === 'meta'
        ? { name: 'Meta Pixel Base', platform, event: 'PageView', base: true }
        : { name: platform === 'tiktok' ? 'TikTok Pixel' : name, platform, base: true };
    }
  }
  return { name: 'Custom HTML', base: false, silent: true };
}

/** Custom template tags (__cvt_...): recognised by the ids in their fields. */
function templateTag(t: RawTag): Described {
  const values = Object.entries(t).filter(([k]) => k.startsWith('vtp_'));
  const text = (re: RegExp) => values.find(([k]) => re.test(k))?.[1];
  const event = text(/event_?name|standard_?event|event$/i);
  const ev = typeof event === 'string' && event && !event.includes('{{') ? event : undefined;
  if (values.some(([k, v]) => /pixel/i.test(k) && typeof v === 'string' && /^\d{15,16}$/.test(v)))
    return { name: ev ? `Meta ${ev}` : 'Meta Pixel', platform: 'meta', event: ev, base: !ev };
  if (values.some(([, v]) => typeof v === 'string' && /^C[A-Z0-9]{19}$/.test(v)))
    return { name: ev ? `TikTok ${ev}` : 'TikTok Pixel', platform: 'tiktok', event: ev, base: !ev };
  return { name: 'Custom Template', base: false, silent: true };
}

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

function describeTag(t: RawTag): Described & { type: string } {
  const f = t.function ?? '';
  switch (f) {
    case '__googtag':
    case '__gaawc':
      return { name: 'GA4 Config', type: 'Google Tag', platform: 'ga4', base: true };
    case '__gaawe':
      return {
        name: `GA4 ${t.vtp_eventName ?? 'event'}`,
        type: 'GA4 Event',
        platform: 'ga4',
        event: t.vtp_eventName,
        base: false,
      };
    case '__ua':
      return {
        name: 'Universal Analytics',
        type: 'Universal Analytics',
        platform: 'ua',
        base: true,
      };
    case '__awct':
      return {
        name: 'Google Ads Conversion',
        type: 'Google Ads',
        platform: 'ads',
        event: 'conversion',
        base: false,
      };
    case '__sp':
      return {
        name: 'Google Ads Remarketing',
        type: 'Google Ads',
        platform: 'ads',
        event: 'remarketing',
        base: false,
      };
    case '__gclidw':
      return { name: 'Conversion Linker', type: 'Conversion Linker', base: false, silent: true };
    case '__awud':
    case '__awec':
      return { name: 'Google Ads User Data', type: 'Google Ads', base: false, silent: true };
    case '__flc':
    case '__fls':
      return {
        name: `Floodlight ${str(t.vtp_activityTag) ?? (f === '__fls' ? 'Sales' : 'Counter')}`,
        type: 'Floodlight',
        platform: 'floodlight',
        event: str(t.vtp_activityTag),
        base: !t.vtp_activityTag,
      };
    case '__baut':
      return { name: 'Microsoft Ads UET', type: 'Microsoft Ads', platform: 'bing', base: true };
    case '__bzi':
      return { name: 'LinkedIn Insight', type: 'LinkedIn', platform: 'linkedin', base: true };
    case '__twitter_website_tag':
      return { name: 'X Pixel', type: 'X', platform: 'x', base: true };
    case '__hjtc':
      return { name: 'Hotjar', type: 'Hotjar', platform: 'hotjar', base: true };
    case '__img':
      return { name: 'Custom Image', type: 'Custom Image', base: false, silent: true };
    case '__html':
      return { ...htmlTag(t.vtp_html ?? ''), type: 'Custom HTML' };
    default:
      if (f.startsWith('__cvt_')) return { ...templateTag(t), type: 'Custom Template' };
      return { name: f.replace(/^__/, '') || 'Tag', type: f || 'Tag', base: false, silent: true };
  }
}

function consentList(v: unknown): string[] {
  // gtm.js writes ["list", "ad_storage", ...]
  if (!Array.isArray(v)) return [];
  return v
    .filter((x, i) => !(i === 0 && x === 'list'))
    .filter((x): x is string => typeof x === 'string');
}

/* Trigger names */

const EVENT_TRIGGER: Record<string, string> = {
  'gtm.init_consent': 'Consent Initialization',
  'gtm.init': 'Initialization',
  'gtm.js': 'All Pages',
  'gtm.dom': 'DOM Ready',
  'gtm.load': 'Window Loaded',
  'gtm.click': 'All Elements',
  'gtm.linkClick': 'Just Links',
  'gtm.formSubmit': 'Form Submission',
  'gtm.historyChange': 'History Change',
  'gtm.historyChange-v2': 'History Change',
  'gtm.scrollDepth': 'Scroll Depth',
  'gtm.timer': 'Timer',
  'gtm.video': 'YouTube Video',
  'gtm.elementVisibility': 'Element Visibility',
  'gtm.triggerGroup': 'Trigger Group',
};

export function triggerName(event: string): string {
  return EVENT_TRIGGER[event] ?? `dl ${event}`;
}

const AEV: Record<string, string> = {
  URL: 'Click URL',
  TEXT: 'Click Text',
  ID: 'Click ID',
  CLASSES: 'Click Classes',
  TARGET: 'Click Target',
  ELEMENT: 'Click Element',
};
const URL_PART: Record<string, string> = {
  URL: 'Page URL',
  HOST: 'Page Hostname',
  PATH: 'Page Path',
  QUERY: 'Query',
  FRAGMENT: 'Fragment',
  PROTOCOL: 'Protocol',
  PORT: 'Port',
};

function macroLabel(m: RawMacro | undefined): string {
  if (!m) return 'Variable';
  switch (m.function) {
    case '__e':
      return 'Event';
    case '__u': {
      const comp = str(m.vtp_component) ?? 'URL';
      return comp === 'QUERY' && str(m.vtp_queryKey)
        ? `Query ${m.vtp_queryKey}`
        : (URL_PART[comp] ?? 'Page URL');
    }
    case '__v':
      return str(m.vtp_name) ?? 'Data Layer Variable';
    case '__aev':
      return AEV[str(m.vtp_varType) ?? ''] ?? 'Auto-Event Variable';
    case '__f':
      return 'Referrer';
    case '__jsm':
      return 'Custom JavaScript';
    case '__j':
      return `JS ${str(m.vtp_name) ?? 'variable'}`;
    case '__k':
      return `Cookie ${str(m.vtp_name) ?? ''}`.trim();
    case '__c':
      return JSON.stringify(m.vtp_value ?? '');
    case '__smm':
      return 'Lookup Table';
    case '__remm':
      return 'RegEx Table';
    case '__d':
      return 'DOM Element';
    case '__cid':
      return 'Container ID';
    default:
      return (m.function ?? 'Variable').replace(/^__/, '');
  }
}

const OP: Record<string, string> = {
  _eq: 'equals',
  _cn: 'contains',
  _sw: 'starts with',
  _ew: 'ends with',
  _re: 'matches',
  _css: 'matches CSS',
  _lt: '<',
  _gt: '>',
  _le: '<=',
  _ge: '>=',
};

function argText(res: Resource, a: unknown): string {
  if (typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') return String(a);
  if (Array.isArray(a)) {
    if (a[0] === 'macro') return `{{${macroLabel(res.macros?.[a[1] as number])}}}`;
    if (a[0] === 'escape') return argText(res, a[1]);
    if (a[0] === 'template')
      return a
        .slice(1)
        .map((x) => argText(res, x))
        .join('');
  }
  return '?';
}

function isEventMacro(res: Resource, a: unknown): boolean {
  return Array.isArray(a) && a[0] === 'macro' && res.macros?.[a[1] as number]?.function === '__e';
}

/** gtm.triggers filters are GTM plumbing for listener triggers: not shown. */
function isPlumbing(res: Resource, p: RawPredicate): boolean {
  if (!Array.isArray(p.arg0) || p.arg0[0] !== 'macro') return false;
  const m = res.macros?.[p.arg0[1] as number];
  return m?.function === '__v' && m.vtp_name === 'gtm.triggers';
}

function ruleParts(res: Resource, ri: number) {
  const rule = res.rules?.[ri] ?? [];
  const list = (kind: string) =>
    rule.filter((part) => part[0] === kind).flatMap((part) => part.slice(1) as number[]);
  return { ifs: list('if'), unless: list('unless') };
}

function ruleLabel(res: Resource, ri: number): { label: string; events: string[] } {
  const { ifs, unless } = ruleParts(res, ri);
  const events: string[] = [];
  const conds: string[] = [];
  const add = (pi: number, neg: boolean) => {
    const p = res.predicates?.[pi];
    if (!p || isPlumbing(res, p)) return;
    if (!neg && p.function === '_eq' && isEventMacro(res, p.arg0) && typeof p.arg1 === 'string') {
      events.push(p.arg1);
      return;
    }
    const op = OP[p.function ?? ''] ?? p.function ?? '?';
    conds.push(
      `${argText(res, p.arg0)} ${neg ? `does not ${op.replace(/s$/, '')}` : op} ${argText(res, p.arg1)}`,
    );
  };
  ifs.forEach((pi) => add(pi, false));
  unless.forEach((pi) => add(pi, true));
  const head = events.length ? events.map(triggerName).join(', ') : 'Custom';
  return { label: conds.length ? `${head}: ${conds.join(', ')}` : head, events };
}

function rulesFor(res: Resource, kind: 'add' | 'block'): Map<number, number[]> {
  const out = new Map<number, number[]>();
  (res.rules ?? []).forEach((rule, ri) => {
    for (const part of rule) {
      if (part[0] !== kind) continue;
      for (const ti of part.slice(1) as number[]) out.set(ti, [...(out.get(ti) ?? []), ri]);
    }
  });
  return out;
}

export function parseGtmContainer(id: string, body: string): GtmContainer | null {
  const res = extractResource(body) as Resource | null;
  if (!res || !Array.isArray(res.tags)) return null;
  const firing = rulesFor(res, 'add');
  const blocking = rulesFor(res, 'block');
  const tags: GtmTag[] = [];
  res.tags.forEach((t, index) => {
    if (INTERNAL.test(t.function ?? '')) return;
    const fire = (firing.get(index) ?? []).map((ri) => ruleLabel(res, ri));
    tags.push({
      index,
      ...describeTag(t),
      trigger: fire.length ? fire.map((r) => r.label).join(' or ') : 'None',
      triggerEvents: [...new Set(fire.flatMap((r) => r.events))],
      blocking: (blocking.get(index) ?? []).map((ri) => ruleLabel(res, ri).label),
      consent: consentList(t.consent),
      paused: t.paused === true,
    });
  });
  return {
    id,
    tags,
    triggers: (res.rules ?? []).length,
    variables: (res.macros ?? []).length,
    estimated: false,
    resource: res,
  };
}

/* Trigger evaluation */

export interface EventContext {
  /** dataLayer event name. */
  event: string;
  /** GTM data model at that moment (all pushes on the page merged). */
  model: Record<string, unknown>;
  pageUrl: string;
  referrer?: string;
  containerId: string;
}

const UNKNOWN = Symbol('unknown');
type Val = unknown | typeof UNKNOWN;

function lookup(model: Record<string, unknown>, name: string, v2: boolean): Val {
  if (!v2) return name in model ? model[name] : undefined;
  if (name in model) return model[name];
  let cur: unknown = model;
  for (const k of name.split('.')) {
    if (!cur || typeof cur !== 'object' || !(k in (cur as object))) return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

function urlPart(href: string, m: RawMacro): Val {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return UNKNOWN;
  }
  switch (str(m.vtp_component) ?? 'URL') {
    case 'HOST':
      return m.vtp_stripWww ? u.hostname.replace(/^www\./, '') : u.hostname;
    case 'PATH':
      return u.pathname;
    case 'QUERY':
      return str(m.vtp_queryKey)
        ? (u.searchParams.get(str(m.vtp_queryKey)!) ?? undefined)
        : u.search.slice(1);
    case 'FRAGMENT':
      return u.hash.slice(1);
    case 'PROTOCOL':
      return u.protocol.replace(':', '');
    case 'PORT':
      return u.port;
    case 'URL':
      return u.href;
    default:
      return UNKNOWN;
  }
}

function elementField(model: Record<string, unknown>, field: string): Val {
  const el = model['gtm.element'];
  if (el && typeof el === 'object' && field in (el as object))
    return (el as Record<string, unknown>)[field];
  return UNKNOWN;
}

function macroValue(res: Resource, i: number, ctx: EventContext, depth: number): Val {
  const m = res.macros?.[i];
  if (!m || depth > 8) return UNKNOWN;
  switch (m.function) {
    case '__e':
      return ctx.event;
    case '__u': {
      const src = m.vtp_customUrlSource;
      const href = src ? resolve(res, src, ctx, depth + 1) : ctx.pageUrl;
      return typeof href === 'string' ? urlPart(href, m) : UNKNOWN;
    }
    case '__v': {
      const v = lookup(ctx.model, str(m.vtp_name) ?? '', m.vtp_dataLayerVersion !== 1);
      return v === undefined && m.vtp_setDefaultValue ? m.vtp_defaultValue : v;
    }
    case '__aev': {
      const type = str(m.vtp_varType) ?? '';
      const key: Record<string, string> = {
        URL: 'gtm.elementUrl',
        ID: 'gtm.elementId',
        CLASSES: 'gtm.elementClasses',
        TARGET: 'gtm.elementTarget',
      };
      if (key[type]) return ctx.model[key[type]!] ?? '';
      if (type === 'TEXT') return elementField(ctx.model, 'text');
      return UNKNOWN;
    }
    case '__c':
      return m.vtp_value;
    case '__cid':
      return ctx.containerId;
    case '__dbg':
      return false;
    case '__f':
      return ctx.referrer ?? UNKNOWN;
    case '__smm': {
      const input = resolve(res, m.vtp_input, ctx, depth + 1);
      if (input === UNKNOWN) return UNKNOWN;
      const rows = Array.isArray(m.vtp_map) ? m.vtp_map.slice(1) : [];
      for (const row of rows) {
        const r = resolve(res, row, ctx, depth + 1) as Record<string, unknown> | typeof UNKNOWN;
        if (r === UNKNOWN || !r) continue;
        if (String(r.key) === String(input)) return r.value;
      }
      return m.vtp_setDefaultValue ? resolve(res, m.vtp_defaultValue, ctx, depth + 1) : undefined;
    }
    default:
      return UNKNOWN;
  }
}

function resolve(res: Resource, a: unknown, ctx: EventContext, depth = 0): Val {
  if (a === null || typeof a !== 'object') return a;
  if (!Array.isArray(a)) return UNKNOWN;
  switch (a[0]) {
    case 'macro':
      return macroValue(res, a[1] as number, ctx, depth);
    case 'escape':
      return resolve(res, a[1], ctx, depth);
    case 'template': {
      const parts = a.slice(1).map((x) => resolve(res, x, ctx, depth));
      return parts.includes(UNKNOWN) ? UNKNOWN : parts.map((p) => String(p ?? '')).join('');
    }
    case 'list':
      return a.slice(1).map((x) => resolve(res, x, ctx, depth));
    case 'map': {
      const o: Record<string, unknown> = {};
      for (let k = 1; k + 1 < a.length; k += 2)
        o[String(a[k])] = resolve(res, a[k + 1], ctx, depth);
      return o;
    }
    default:
      return UNKNOWN;
  }
}

function predicate(res: Resource, pi: number, ctx: EventContext): Tri {
  const p = res.predicates?.[pi];
  if (!p) return 'maybe';
  const a = resolve(res, p.arg0, ctx);
  const b = resolve(res, p.arg1, ctx);
  if (a === UNKNOWN || b === UNKNOWN) return 'maybe';
  let l = String(a ?? 'undefined');
  let r = String(b ?? 'undefined');
  if (p.ignore_case) {
    l = l.toLowerCase();
    r = r.toLowerCase();
  }
  const yes = (v: boolean): Tri => (v ? 'yes' : 'no');
  switch (p.function) {
    case '_eq':
      return yes(l === r);
    case '_cn':
      return yes(l.includes(r));
    case '_sw':
      return yes(l.startsWith(r));
    case '_ew':
      return yes(l.endsWith(r));
    case '_re':
      try {
        return yes(new RegExp(r, p.ignore_case ? 'i' : '').test(l));
      } catch {
        return 'maybe';
      }
    case '_lt':
      return yes(Number(l) < Number(r));
    case '_gt':
      return yes(Number(l) > Number(r));
    case '_le':
      return yes(Number(l) <= Number(r));
    case '_ge':
      return yes(Number(l) >= Number(r));
    default:
      return 'maybe';
  }
}

const and = (vals: Tri[]): Tri =>
  vals.includes('no') ? 'no' : vals.includes('maybe') ? 'maybe' : 'yes';
const not = (v: Tri): Tri => (v === 'yes' ? 'no' : v === 'no' ? 'yes' : 'maybe');

function rule(res: Resource, ri: number, ctx: EventContext): Tri {
  const { ifs, unless } = ruleParts(res, ri);
  return and([
    ...ifs.map((pi) => predicate(res, pi, ctx)),
    ...unless.map((pi) => not(predicate(res, pi, ctx))),
  ]);
}

/** Would this tag fire on this event? Firing triggers OR-ed, exception triggers win. */
export function tagFiresOn(c: GtmContainer, tag: GtmTag, ctx: EventContext): Tri {
  const res = c.resource;
  if (!res || tag.paused) return 'no';
  const fire = rulesFor(res, 'add').get(tag.index) ?? [];
  const block = rulesFor(res, 'block').get(tag.index) ?? [];
  const f = fire.map((ri) => rule(res, ri, ctx));
  const fired: Tri = f.includes('yes') ? 'yes' : f.includes('maybe') ? 'maybe' : 'no';
  if (fired === 'no') return 'no';
  const b = block.map((ri) => rule(res, ri, ctx));
  if (b.includes('yes')) return 'no';
  return b.includes('maybe') ? 'maybe' : fired;
}

/** GTM merges each object push into its data model (objects deeply, everything else replaced). */
export function mergeModel(model: Record<string, unknown>, push: unknown): void {
  if (!push || typeof push !== 'object' || Array.isArray(push)) return;
  for (const [k, v] of Object.entries(push as Record<string, unknown>)) {
    const cur = model[k];
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      cur &&
      typeof cur === 'object' &&
      !Array.isArray(cur)
    ) {
      const next = { ...(cur as Record<string, unknown>) };
      mergeModel(next, v);
      model[k] = next;
    } else {
      model[k] = v;
    }
  }
}
