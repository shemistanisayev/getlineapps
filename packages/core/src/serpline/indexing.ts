/**
 * "Can Google index this page?" (docs/serpline-SPEC.md §4.7): one verdict from the HTTP status,
 * noindex in the meta tag or header, Googlebot and Bingbot in robots.txt, the canonical and the
 * sitemap. Each input is one check row in the Summary card.
 */
import { decide, ruleText, type Robots } from './robots.ts';
import type { SitemapCheck, UrlStatus } from './live.ts';

export interface SearchBot {
  userAgent: string;
  shownAs: string;
}

/** Search engine crawlers checked against robots.txt (AI bots live in bots.ts). */
export const SEARCH_BOTS: readonly SearchBot[] = [
  { userAgent: 'Googlebot', shownAs: 'Google' },
  { userAgent: 'Bingbot', shownAs: 'Bing' },
];

export interface SearchBotStatus extends SearchBot {
  state: 'allowed' | 'blocked';
  rule?: string;
}

export function searchBotStatuses(robots: Robots | null, path: string): SearchBotStatus[] {
  return SEARCH_BOTS.map((bot) => {
    if (!robots) return { ...bot, state: 'allowed' as const };
    const d = decide(robots, bot.userAgent, path);
    return !d.allowed && d.rule
      ? { ...bot, state: 'blocked' as const, rule: ruleText(robots, bot.userAgent, d.rule) }
      : { ...bot, state: 'allowed' as const };
  });
}

export type IndexCheckId = 'status' | 'meta' | 'header' | 'robotsTxt' | 'canonical' | 'sitemap';
/** ok: fine. bad: keeps the page out. warn: may keep it out. none: not set or not checked. */
export type IndexState = 'ok' | 'bad' | 'warn' | 'none';

export interface IndexCheck {
  id: IndexCheckId;
  state: IndexState;
  /** What the panel shows next to the label: a dictionary key suffix and its values. */
  note: string;
  params: Record<string, string | number>;
}

export type Verdict = 'yes' | 'no' | 'risky';

export interface Indexability {
  verdict: Verdict;
  checks: IndexCheck[];
}

export interface IndexInput {
  status: number;
  noindex: { meta: boolean; header: boolean };
  searchBots: SearchBotStatus[];
  canonical: string | null;
  canonicalOther: boolean;
  canonicalCheck: UrlStatus | null;
  sitemap: SitemapCheck | null;
}

export function indexability(i: IndexInput): Indexability {
  const checks: IndexCheck[] = [];
  const row = (
    id: IndexCheckId,
    state: IndexState,
    note: string,
    params: Record<string, string | number> = {},
  ) => checks.push({ id, state, note, params });

  if (!i.status) row('status', 'none', 'unread');
  else if (i.status >= 400) row('status', 'bad', 'http', { status: i.status });
  else row('status', 'ok', 'http', { status: i.status });

  row('meta', i.noindex.meta ? 'bad' : 'ok', i.noindex.meta ? 'noindex' : 'indexAllowed');
  row('header', i.noindex.header ? 'bad' : 'ok', i.noindex.header ? 'noindex' : 'indexAllowed');

  const google = i.searchBots.find((b) => b.userAgent === 'Googlebot');
  const blocked = i.searchBots.filter((b) => b.state === 'blocked');
  if (google?.state === 'blocked')
    row('robotsTxt', 'bad', 'blocked', { bots: blocked.map((b) => b.userAgent).join(', ') });
  else if (blocked.length)
    row('robotsTxt', 'warn', 'blocked', { bots: blocked.map((b) => b.userAgent).join(', ') });
  else row('robotsTxt', 'ok', 'allowed');

  if (!i.canonical) row('canonical', 'none', 'notSet');
  else if (i.canonicalCheck && i.canonicalOther && i.canonicalCheck.status >= 400)
    row('canonical', 'bad', 'broken', { status: i.canonicalCheck.status });
  else if (i.canonicalOther) row('canonical', 'warn', 'other');
  else row('canonical', 'ok', 'self');

  if (!i.sitemap) row('sitemap', 'none', 'unread');
  else if (i.sitemap.found === null)
    row('sitemap', 'none', i.sitemap.files.some((f) => f.status === 200) ? 'partial' : 'notFound');
  else row('sitemap', i.sitemap.found ? 'ok' : 'warn', i.sitemap.found ? 'listed' : 'notListed');

  // The sitemap helps discovery but never decides indexing on its own.
  const deciding = checks.filter((c) => c.id !== 'sitemap');
  const verdict: Verdict = deciding.some((c) => c.state === 'bad')
    ? 'no'
    : deciding.some((c) => c.state === 'warn')
      ? 'risky'
      : 'yes';
  return { verdict, checks };
}
