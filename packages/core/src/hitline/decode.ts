/** Decoders: query strings, form bodies, JSON bodies and GA4 item strings into flat parameters. */
import type { Param } from './types.ts';

export function parseQuery(query: string): Param[] {
  const out: Param[] = [];
  const q = query.startsWith('?') ? query.slice(1) : query;
  if (!q) return out;
  for (const part of q.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const rawKey = eq >= 0 ? part.slice(0, eq) : part;
    const rawValue = eq >= 0 ? part.slice(eq + 1) : '';
    out.push({ key: safeDecode(rawKey), value: safeDecode(rawValue) });
  }
  return out;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

export function queryOf(url: string): Param[] {
  try {
    return parseQuery(new URL(url).search);
  } catch {
    return [];
  }
}

export function get(params: Param[], key: string): string | undefined {
  return params.find((p) => p.key === key)?.value;
}

/** Flattens JSON into `a.b`, `list[0].c` keys. */
export function flattenJson(value: unknown, prefix = '', out: Param[] = []): Param[] {
  if (Array.isArray(value)) {
    value.forEach((v, i) => flattenJson(v, `${prefix}[${i}]`, out));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      flattenJson(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else if (prefix) {
    out.push({ key: prefix, value: value === null || value === undefined ? '' : String(value) });
  }
  return out;
}

export function parseJson(text: string | undefined): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** GA4 item keys inside `pr1=id...~nm...` (Measurement Protocol shorthand). */
const GA4_ITEM_KEYS: Record<string, string> = {
  id: 'item_id',
  nm: 'item_name',
  pr: 'price',
  qt: 'quantity',
  br: 'item_brand',
  ca: 'item_category',
  c2: 'item_category2',
  c3: 'item_category3',
  c4: 'item_category4',
  c5: 'item_category5',
  va: 'item_variant',
  af: 'affiliation',
  cp: 'coupon',
  ds: 'discount',
  ln: 'item_list_name',
  li: 'item_list_id',
  lp: 'index',
  lo: 'location_id',
};

export function decodeGa4Item(index: number, raw: string): Param[] {
  const out: Param[] = [];
  for (const part of raw.split('~')) {
    if (part.length < 2) continue;
    const code = part.slice(0, 2);
    const value = part.slice(2);
    const key = GA4_ITEM_KEYS[code];
    if (key) out.push({ key: `items[${index}].${key}`, value });
  }
  return out;
}

/** GA4 page and identity fields, kept apart from event parameters. */
export const GA4_CONTEXT_KEYS: Record<string, string> = {
  dl: 'page_location',
  dr: 'page_referrer',
  dt: 'page_title',
  cid: 'client_id',
  sid: 'session_id',
  uid: 'user_id',
  ul: 'language',
};

/** Splits GA4 fields into event params (currency, value, items, custom) and context. */
export function ga4Params(fields: Param[]): { params: Param[]; context: Param[] } {
  const params: Param[] = [];
  const context: Param[] = [];
  const items: Param[] = [];
  for (const { key, value } of fields) {
    if (key === 'cu') params.push({ key: 'currency', value });
    else if (key.startsWith('ep.')) params.push({ key: key.slice(3), value });
    else if (key.startsWith('epn.')) params.push({ key: key.slice(4), value });
    else if (/^pr\d+$/.test(key)) items.push(...decodeGa4Item(Number(key.slice(2)) - 1, value));
    else if (key in GA4_CONTEXT_KEYS) context.push({ key: GA4_CONTEXT_KEYS[key]!, value });
  }
  return { params: [...params, ...items], context };
}

/** Merges parameter lists; later lists win on the same key. */
export function mergeParams(...lists: Param[][]): Param[] {
  const map = new Map<string, string>();
  for (const list of lists) for (const p of list) map.set(p.key, p.value);
  return [...map].map(([key, value]) => ({ key, value }));
}
