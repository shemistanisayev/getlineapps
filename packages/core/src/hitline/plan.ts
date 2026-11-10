/** Tracking plan (docs/hitline-SPEC.md §4.5): parse, validate, diff, draft export. */
import type { Hit, Param, Platform } from './types.ts';

export type PlanPlatform = 'ga4' | 'meta' | 'tiktok' | 'ads';

export interface PlanRow {
  event: string;
  platform: PlanPlatform;
  parameters: string[];
}

export interface Plan {
  name: string;
  rows: PlanRow[];
}

export type PlanError =
  | { code: 'empty' }
  | { code: 'too_big' }
  | { code: 'too_many_rows' }
  | { code: 'header' }
  | { code: 'json' }
  | { code: 'row'; line: number; reason: 'columns' | 'event' | 'platform' };

export type PlanParse = { ok: true; plan: Plan } | { ok: false; error: PlanError };

export const PLAN_MAX_BYTES = 256 * 1024;
export const PLAN_MAX_ROWS = 500;

const PLATFORM_ALIASES: Record<string, PlanPlatform> = {
  ga4: 'ga4',
  'google analytics': 'ga4',
  'google analytics 4': 'ga4',
  meta: 'meta',
  'meta pixel': 'meta',
  facebook: 'meta',
  tiktok: 'tiktok',
  'tiktok pixel': 'tiktok',
  'google ads': 'ads',
  ads: 'ads',
};

export const PLAN_PLATFORM_LABEL: Record<PlanPlatform, string> = {
  ga4: 'GA4',
  meta: 'Meta',
  tiktok: 'TikTok',
  ads: 'Google Ads',
};

export function planPlatform(value: string): PlanPlatform | null {
  return PLATFORM_ALIASES[value.trim().toLowerCase()] ?? null;
}

/** RFC 4180-style CSV line splitter (quotes, doubled quotes). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',' || c === ';') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function paramList(value: string | string[]): string[] {
  const list = Array.isArray(value) ? value : value.split(',');
  return list.map((p) => String(p).trim()).filter(Boolean);
}

export function parsePlanCsv(text: string, name = 'tracking-plan.csv'): PlanParse {
  if (text.length > PLAN_MAX_BYTES) return { ok: false, error: { code: 'too_big' } };
  const lines = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).split(/\r?\n/);
  const nonEmpty = lines.map((l, i) => ({ l, line: i + 1 })).filter((x) => x.l.trim());
  if (nonEmpty.length === 0) return { ok: false, error: { code: 'empty' } };
  const header = splitCsvLine(nonEmpty[0]!.l).map((h) => h.toLowerCase());
  if (header[0] !== 'event' || header[1] !== 'platform' || header[2] !== 'parameters') {
    return { ok: false, error: { code: 'header' } };
  }
  const body = nonEmpty.slice(1);
  if (body.length > PLAN_MAX_ROWS) return { ok: false, error: { code: 'too_many_rows' } };
  const rows: PlanRow[] = [];
  for (const { l, line } of body) {
    const cells = splitCsvLine(l);
    if (cells.length < 2 || cells.length > 3) {
      return { ok: false, error: { code: 'row', line, reason: 'columns' } };
    }
    const [event, platform, params = ''] = cells as [string, string, string?];
    if (!event) return { ok: false, error: { code: 'row', line, reason: 'event' } };
    const p = planPlatform(platform);
    if (!p) return { ok: false, error: { code: 'row', line, reason: 'platform' } };
    rows.push({ event, platform: p, parameters: paramList(params) });
  }
  if (rows.length === 0) return { ok: false, error: { code: 'empty' } };
  return { ok: true, plan: { name, rows } };
}

export function parsePlanJson(text: string, name = 'tracking-plan.json'): PlanParse {
  if (text.length > PLAN_MAX_BYTES) return { ok: false, error: { code: 'too_big' } };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: { code: 'json' } };
  }
  if (!Array.isArray(data)) return { ok: false, error: { code: 'json' } };
  if (data.length === 0) return { ok: false, error: { code: 'empty' } };
  if (data.length > PLAN_MAX_ROWS) return { ok: false, error: { code: 'too_many_rows' } };
  const rows: PlanRow[] = [];
  for (const [i, item] of data.entries()) {
    const line = i + 1;
    const o = item as { event?: unknown; platform?: unknown; parameters?: unknown };
    if (!o || typeof o !== 'object')
      return { ok: false, error: { code: 'row', line, reason: 'columns' } };
    if (typeof o.event !== 'string' || !o.event.trim()) {
      return { ok: false, error: { code: 'row', line, reason: 'event' } };
    }
    const p = typeof o.platform === 'string' ? planPlatform(o.platform) : null;
    if (!p) return { ok: false, error: { code: 'row', line, reason: 'platform' } };
    const params =
      Array.isArray(o.parameters) || typeof o.parameters === 'string'
        ? paramList(o.parameters)
        : [];
    rows.push({ event: o.event.trim(), platform: p, parameters: params });
  }
  return { ok: true, plan: { name, rows } };
}

/** Picks the parser by file name or content. */
export function parsePlan(text: string, name: string): PlanParse {
  const trimmed = text.trimStart();
  return name.toLowerCase().endsWith('.json') || trimmed.startsWith('[')
    ? parsePlanJson(text, name)
    : parsePlanCsv(text, name);
}

export type PlanStatus = 'match' | 'missing' | 'wrong';

export type Arrived =
  | { kind: 'same' }
  | { kind: 'never' }
  | { kind: 'datalayer_only' }
  | { kind: 'params'; present: string[]; missing: string[]; empty: string[] };

export interface PlanRowResult {
  row: PlanRow;
  status: PlanStatus;
  arrived: Arrived;
  hitIds: string[];
}

export interface PlanResult {
  plan: Plan;
  rows: PlanRowResult[];
  counts: Record<PlanStatus, number>;
}

/** Value of a plan parameter in a hit: exact key, or any nested key (`items` -> `items[0].item_id`). */
function paramValue(all: Param[], name: string): string | undefined {
  const exact = all.find((p) => p.key === name);
  if (exact) return exact.value;
  const nested = all.filter((p) => p.key.startsWith(`${name}[`) || p.key.startsWith(`${name}.`));
  if (nested.length === 0) return undefined;
  return nested.some((p) => p.value.trim()) ? 'nested' : '';
}

function sameEvent(hit: Hit, row: PlanRow): boolean {
  return hit.platform === row.platform && hit.event.toLowerCase() === row.event.toLowerCase();
}

export function diffPlan(plan: Plan, hits: Hit[]): PlanResult {
  const rows = plan.rows.map((row): PlanRowResult => {
    const matching = hits.filter((h) => sameEvent(h, row));
    if (matching.length === 0) {
      const inDataLayer = hits.some(
        (h) => h.platform === 'datalayer' && h.event.toLowerCase() === row.event.toLowerCase(),
      );
      return {
        row,
        status: 'missing',
        arrived: { kind: inDataLayer ? 'datalayer_only' : 'never' },
        hitIds: [],
      };
    }
    let best: { hit: Hit; present: string[]; missing: string[]; empty: string[] } | null = null;
    for (const hit of matching) {
      const all = [...hit.params, ...hit.context];
      const present: string[] = [];
      const missing: string[] = [];
      const empty: string[] = [];
      for (const name of row.parameters) {
        const v = paramValue(all, name);
        if (v === undefined) missing.push(name);
        else if (!v.trim()) empty.push(name);
        else present.push(name);
      }
      if (!best || present.length >= best.present.length) best = { hit, present, missing, empty };
      if (missing.length === 0 && empty.length === 0) {
        return { row, status: 'match', arrived: { kind: 'same' }, hitIds: [hit.id] };
      }
    }
    const b = best!;
    return {
      row,
      status: 'wrong',
      arrived: { kind: 'params', present: b.present, missing: b.missing, empty: b.empty },
      hitIds: matching.map((h) => h.id),
    };
  });
  const counts = { match: 0, missing: 0, wrong: 0 };
  for (const r of rows) counts[r.status]++;
  return { plan, rows, counts };
}

function csvCell(s: string): string {
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function planToCsv(rows: PlanRow[]): string {
  const lines = ['event,platform,parameters'];
  for (const r of rows) {
    lines.push(
      [csvCell(r.event), PLAN_PLATFORM_LABEL[r.platform], `"${r.parameters.join(',')}"`].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

/** The sample from design/hitline/PlanSetup.dc.html. */
export const SAMPLE_PLAN_CSV = planToCsv([
  { event: 'add_to_cart', platform: 'ga4', parameters: ['currency', 'value', 'items'] },
  { event: 'AddToCart', platform: 'meta', parameters: ['value', 'currency', 'content_ids'] },
  { event: 'generate_lead', platform: 'ga4', parameters: ['form_id'] },
]);

const PLAN_PLATFORMS: Platform[] = ['ga4', 'meta', 'tiktok', 'ads'];

/** "Create plan from this session": every event seen, with its top-level parameter names. */
export function draftPlan(hits: Hit[]): PlanRow[] {
  const byKey = new Map<string, PlanRow>();
  for (const h of hits) {
    if (!PLAN_PLATFORMS.includes(h.platform) || h.event === '(unknown)') continue;
    const key = `${h.platform}:${h.event}`;
    const row = byKey.get(key) ?? {
      event: h.event,
      platform: h.platform as PlanPlatform,
      parameters: [],
    };
    for (const p of h.params) {
      const top = p.key.split(/[[.]/)[0]!;
      if (top && !row.parameters.includes(top)) row.parameters.push(top);
    }
    byKey.set(key, row);
  }
  return [...byKey.values()];
}
