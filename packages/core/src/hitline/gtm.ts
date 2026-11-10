/**
 * GTM container from the gtm.js response body (see docs/hitline/PLAN.md, gap G4).
 * Public gtm.js has tag types, trigger conditions and consent settings, but no names,
 * so readable names are built from what each tag does.
 */
import type { Platform } from './types.ts';

export type TagStatus =
  'fired' | 'missing_value' | 'no_consent_check' | 'waiting_consent' | 'not_fired';

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
  trigger: string;
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

interface RawTag {
  function?: string;
  vtp_eventName?: string;
  vtp_tagId?: string;
  vtp_html?: string;
  vtp_conversionId?: string;
  consent?: unknown;
  paused?: boolean;
}
interface RawPredicate {
  function?: string;
  arg0?: unknown;
  arg1?: unknown;
}
interface RawMacro {
  function?: string;
}
interface Resource {
  tags?: RawTag[];
  macros?: RawMacro[];
  predicates?: RawPredicate[];
  rules?: unknown[][][];
}

function htmlTag(html: string): Pick<GtmTag, 'name' | 'platform' | 'event' | 'base'> {
  const fbTrack = /fbq\(\s*['"]track(?:Custom)?['"]\s*,\s*['"]([^'"]+)['"]/.exec(html);
  if (fbTrack && !/fbq\(\s*['"]init['"]/.test(html)) {
    return { name: `Meta ${fbTrack[1]}`, platform: 'meta', event: fbTrack[1], base: false };
  }
  if (/fbq\(\s*['"]init['"]|connect\.facebook\.net/.test(html)) {
    return { name: 'Meta Pixel Base', platform: 'meta', event: 'PageView', base: true };
  }
  const ttTrack = /ttq\.track\(\s*['"]([^'"]+)['"]/.exec(html);
  if (ttTrack && !/ttq\.load\(/.test(html)) {
    return { name: `TikTok ${ttTrack[1]}`, platform: 'tiktok', event: ttTrack[1], base: false };
  }
  if (/ttq\.load\(|analytics\.tiktok\.com/.test(html)) {
    return { name: 'TikTok Pixel', platform: 'tiktok', base: true };
  }
  if (/hotjar/i.test(html)) return { name: 'Hotjar', platform: 'hotjar', base: true };
  return { name: 'Custom HTML', base: false };
}

function describeTag(t: RawTag): Pick<GtmTag, 'name' | 'type' | 'platform' | 'event' | 'base'> {
  switch (t.function) {
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
    case '__awct':
      return {
        name: 'Google Ads Conversion',
        type: 'Google Ads',
        platform: 'ads',
        event: 'conversion',
        base: false,
      };
    case '__hjtc':
      return { name: 'Hotjar', type: 'Hotjar', platform: 'hotjar', base: true };
    case '__html':
      return { ...htmlTag(t.vtp_html ?? ''), type: 'Custom HTML' };
    default:
      return { name: t.function ?? 'Tag', type: t.function ?? 'Tag', base: false };
  }
}

function consentList(v: unknown): string[] {
  // gtm.js writes ["list", "ad_storage", ...]
  if (!Array.isArray(v)) return [];
  return v
    .filter((x, i) => !(i === 0 && x === 'list'))
    .filter((x): x is string => typeof x === 'string');
}

function triggerLabel(res: Resource, ruleIndexes: number[]): string {
  const macros = res.macros ?? [];
  for (const ri of ruleIndexes) {
    const rule = res.rules?.[ri] ?? [];
    const ifs = rule.find((part) => part[0] === 'if')?.slice(1) ?? [];
    for (const pi of ifs) {
      const p = res.predicates?.[pi as number];
      if (!p || p.function !== '_eq') continue;
      const arg0 = p.arg0 as unknown[];
      const isEventMacro =
        Array.isArray(arg0) && arg0[0] === 'macro' && macros[arg0[1] as number]?.function === '__e';
      if (!isEventMacro || typeof p.arg1 !== 'string') continue;
      if (p.arg1 === 'gtm.js') return 'All Pages';
      if (p.arg1 === 'gtm.dom') return 'DOM Ready';
      if (p.arg1 === 'gtm.load') return 'Window Loaded';
      return `dl ${p.arg1}`;
    }
  }
  return ruleIndexes.length ? 'Custom' : 'None';
}

export function parseGtmContainer(id: string, body: string): GtmContainer | null {
  const res = extractResource(body) as Resource | null;
  if (!res || !Array.isArray(res.tags)) return null;
  const rulesFor = new Map<number, number[]>();
  (res.rules ?? []).forEach((rule, ri) => {
    for (const part of rule) {
      if (part[0] !== 'add') continue;
      for (const ti of part.slice(1)) {
        const list = rulesFor.get(ti as number) ?? [];
        list.push(ri);
        rulesFor.set(ti as number, list);
      }
    }
  });
  const tags = res.tags.map((t, index): GtmTag => ({
    index,
    ...describeTag(t),
    trigger: triggerLabel(res, rulesFor.get(index) ?? []),
    consent: consentList(t.consent),
    paused: t.paused === true,
  }));
  return {
    id,
    tags,
    triggers: (res.rules ?? []).length,
    variables: (res.macros ?? []).length,
    estimated: false,
  };
}
