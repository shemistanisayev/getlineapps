/**
 * Page snapshot + rules -> the stack (docs/rivaline-SPEC.md §4.2 to §4.4). Pure: no DOM, no network.
 */
import { AD_CHANNELS, GOOGLE_COLLECT_HOSTS, RULES } from './rules/index.ts';
import {
  CATEGORIES,
  type Category,
  type Evidence,
  type FoundTool,
  type Gap,
  type PageSnapshot,
  type Rule,
  type Stack,
  type StackSummary,
} from './types.ts';

/** "https://connect.facebook.net/en_US/fbevents.js?v=2" -> "connect.facebook.net/en_US/fbevents.js" */
export function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, '');
    return u.host + path;
  } catch {
    return url;
  }
}

const KIND_ORDER: Evidence['kind'][] = ['Script', 'Global', 'Cookie', 'Request', 'Meta', 'Element'];

function valueList(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function extractIds(
  rule: Rule,
  snap: PageSnapshot,
  scripts: string[],
  requests: string[],
): string[] {
  const out: string[] = [];
  const add = (id: string | undefined, format?: (id: string) => string) => {
    if (!id) return;
    const v = format ? format(id) : id;
    if (!out.includes(v)) out.push(v);
  };
  for (const ex of rule.ids ?? []) {
    const pattern = ex.pattern;
    const sources =
      ex.from === 'script'
        ? scripts
        : ex.from === 'resource'
          ? requests
          : ex.from === 'inline'
            ? snap.inline
            : ex.from === 'cookie'
              ? snap.cookies
              : valueList(snap.values[ex.path ?? '']);
    for (const s of sources) {
      if (!pattern) {
        add(s, ex.format);
        continue;
      }
      // Inline scripts can hold several IDs (two GA4 properties).
      const g = new RegExp(
        pattern.source,
        pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g',
      );
      for (const m of s.matchAll(g)) add(m[1], ex.format);
    }
  }
  return out;
}

/** Runs one rule. Returns null when nothing matched. */
export function matchRule(rule: Rule, snap: PageSnapshot): FoundTool | null {
  const ev: Evidence[] = [];
  const push = (kind: Evidence['kind'], value: string) => {
    if (!ev.some((e) => e.kind === kind && e.value === value)) ev.push({ kind, value });
  };
  const scriptHits = snap.scripts.filter((s) => rule.script?.some((r) => r.test(s)));
  for (const s of scriptHits) push('Script', shortUrl(s));
  // A script pattern can also match a request (the script itself, loaded by another script).
  const requestHits = snap.resources.filter(
    (r) =>
      !snap.scripts.includes(r) &&
      (rule.resource?.some((p) => p.test(r)) || rule.script?.some((p) => p.test(r))),
  );
  for (const r of requestHits) push('Request', shortUrl(r));
  for (const g of rule.global ?? []) if (snap.globals.includes(g)) push('Global', `window.${g}`);
  for (const name of snap.cookies) if (rule.cookie?.some((r) => r.test(name))) push('Cookie', name);
  for (const m of rule.meta ?? []) {
    const v = snap.meta[m.name];
    if (v && m.pattern.test(v)) push('Meta', `${m.name}: ${v}`);
  }
  for (const s of rule.selector ?? []) if (snap.selectors.includes(s)) push('Element', s);
  if (!ev.length) return null;
  ev.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  const ids = extractIds(rule, snap, [...scriptHits, ...requestHits], snap.resources);
  return {
    id: rule.id,
    name: rule.name,
    category: rule.category,
    mark: rule.mark,
    ids,
    ...(rule.kind ? { kind: rule.kind } : {}),
    label: ids.length ? ids.join(', ') : (rule.kind ?? ''),
    evidence: ev,
  };
}

/**
 * Server-side signal (SPEC §4.2): a GA4 `/g/collect` request on a host that is not Google's means
 * a server-side container is in use. Shown as "Server-side GTM" in Tag management.
 */
export function serverSide(snap: PageSnapshot): FoundTool | null {
  const hits = snap.resources.filter((r) => {
    try {
      const u = new URL(r);
      return u.pathname.endsWith('/g/collect') && !GOOGLE_COLLECT_HOSTS.test(u.hostname);
    } catch {
      return false;
    }
  });
  if (!hits.length) return null;
  const hosts = [...new Set(hits.map((h) => new URL(h).hostname))];
  return {
    id: 'sgtm',
    name: 'Server-side GTM',
    category: 'tagmanagement',
    ids: [],
    label: hosts.join(', '),
    evidence: hits.map((h): Evidence => ({ kind: 'Request', value: shortUrl(h) })).slice(0, 4),
  };
}

const byCategory = (c: Category) => CATEGORIES.indexOf(c);

/** All tools found on the page, in category order, then rule order. */
export function findTools(snap: PageSnapshot): FoundTool[] {
  const found = RULES.map((r) => matchRule(r, snap)).filter((t): t is FoundTool => t !== null);
  const sgtm = serverSide(snap);
  if (sgtm) {
    const lastTag = found.map((t) => t.category).lastIndexOf('tagmanagement');
    found.splice(lastTag >= 0 ? lastTag + 1 : found.length, 0, sgtm);
  }
  return found.sort((a, b) => byCategory(a.category) - byCategory(b.category));
}

/** Gaps, in the SPEC §4.4 order. */
export function findGaps(tools: FoundTool[], snap: PageSnapshot): Gap[] {
  const has = (c: Category) => tools.some((t) => t.category === c);
  const ads = tools.filter((t) => t.category === 'advertising').length;
  const gaps: Gap[] = [];
  if (ads > 0 && !tools.some((t) => t.id === 'sgtm'))
    gaps.push({ id: 'GAP_SERVER_SIDE', severity: 'high', count: ads });
  if ((ads > 0 || has('analytics')) && !has('consent') && !snap.consentCommand)
    gaps.push({ id: 'GAP_CONSENT', severity: 'high' });
  if ((has('email') || has('chat') || snap.emailForm) && !has('crm'))
    gaps.push({
      id: 'GAP_CRM',
      severity: 'medium',
      emailTool: tools.find((t) => t.category === 'email')?.name,
    });
  if (!has('analytics')) gaps.push({ id: 'GAP_ANALYTICS', severity: 'high' });
  return gaps;
}

/**
 * Hero card numbers and marks (SPEC §4.3). Marks row: the platform, tag managers, the main
 * analytics tool, advertising, then the rest, up to 7 (design: Main).
 */
export function summarize(tools: FoundTool[]): StackSummary {
  const platform = tools.find((t) => t.category === 'ecommerce');
  const adChannels = AD_CHANNELS.filter(([id]) => tools.some((t) => t.id === id)).map(
    ([, name]) => name,
  );
  const analytics = tools.filter((t) => t.category === 'analytics');
  const ordered = [
    ...(platform ? [platform] : []),
    ...tools.filter((t) => t.category === 'tagmanagement'),
    ...analytics.slice(0, 1),
    ...tools.filter((t) => t.category === 'advertising'),
  ];
  for (const t of tools) if (!ordered.includes(t)) ordered.push(t);
  const marks = ordered.slice(0, 7);
  return {
    tools: tools.length,
    categories: new Set(tools.map((t) => t.category)).size,
    platform: platform?.name,
    adChannels,
    marks,
    more: tools.length - marks.length,
  };
}

/** The whole Stack tab from one snapshot. */
export function analyzeStack(snap: PageSnapshot): Stack {
  const tools = findTools(snap);
  const groups = CATEGORIES.map((category) => ({
    category,
    tools: tools.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);
  const chips = [...groups]
    .sort(
      (a, b) => b.tools.length - a.tools.length || byCategory(a.category) - byCategory(b.category),
    )
    .map((g) => ({ category: g.category, count: g.tools.length }));
  return {
    tools,
    groups,
    chips,
    gaps: findGaps(tools, snap),
    summary: summarize(tools),
    adPixels: tools.filter((t) => t.category === 'advertising').length,
  };
}
