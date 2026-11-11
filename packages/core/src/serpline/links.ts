/**
 * Internal link check (SPEC §3.1, §5 Links). The page runs the requests; this module plans them
 * and merges the results. Counts are per link on the page; requests are per unique URL.
 */
import type { PageFacts, PageLink } from './extract.ts';

export const LINK_CHECK_MAX = 100;
export const LINK_CHECK_CONCURRENCY = 4;
export const LINK_CHECK_TIMEOUT_MS = 8000;

export interface LinkResult {
  /** The requested URL (no hash). */
  url: string;
  /** HTTP status of the final response, 0 when the request failed or timed out. */
  status: number;
  redirected: boolean;
  /** Final URL after redirects. */
  finalUrl: string;
}

export type LinkState = 'ok' | 'redirect' | 'broken' | 'failed' | 'unchecked';

export interface CheckedLink extends PageLink {
  state: LinkState;
  status: number | null;
  /** Redirect target (path when same origin). */
  target: string | null;
}

export interface LinkCounts {
  total: number;
  internal: number;
  external: number;
  nofollow: number;
}

export interface LinkCheck {
  /** Internal links with a result. */
  checked: number;
  ok: number;
  redirects: number;
  broken: number;
  failed: number;
  links: CheckedLink[];
}

const noHash = (href: string) => href.replace(/#.*$/, '');

export function linkCounts(facts: PageFacts): LinkCounts {
  return {
    total: facts.links.length,
    internal: facts.links.filter((l) => l.kind === 'internal').length,
    external: facts.links.filter((l) => l.kind === 'external').length,
    nofollow: facts.links.filter((l) => l.nofollow).length,
  };
}

/**
 * Unique same-origin URLs to request, in page order, at most `max`. Same-origin only: the requests
 * run in the page and need no host permission.
 */
export function planLinkCheck(facts: PageFacts, max = LINK_CHECK_MAX): string[] {
  let origin: string;
  try {
    origin = new URL(facts.url).origin;
  } catch {
    return [];
  }
  const urls: string[] = [];
  for (const l of facts.links) {
    if (l.kind !== 'internal') continue;
    const u = noHash(l.href);
    try {
      if (new URL(u).origin !== origin) continue;
    } catch {
      continue;
    }
    if (!urls.includes(u)) urls.push(u);
    if (urls.length >= max) break;
  }
  return urls;
}

function shortUrl(url: string, base: string): string {
  try {
    const u = new URL(url);
    return u.origin === new URL(base).origin ? u.pathname + u.search : url;
  } catch {
    return url;
  }
}

export function stateOf(r: LinkResult | undefined): LinkState {
  if (!r) return 'unchecked';
  if (r.status === 0) return 'failed';
  if (r.status >= 400) return 'broken';
  if (r.redirected || (r.status >= 300 && r.status < 400)) return 'redirect';
  return 'ok';
}

export function mergeLinkCheck(facts: PageFacts, results: LinkResult[]): LinkCheck {
  const byUrl = new Map(results.map((r) => [noHash(r.url), r]));
  const links: CheckedLink[] = facts.links.map((l) => {
    const r = l.kind === 'internal' ? byUrl.get(noHash(l.href)) : undefined;
    const state = stateOf(r);
    return {
      ...l,
      state,
      status: r ? r.status : null,
      target: state === 'redirect' && r ? shortUrl(r.finalUrl, facts.url) : null,
    };
  });
  const internal = links.filter((l) => l.kind === 'internal' && l.state !== 'unchecked');
  const count = (s: LinkState) => internal.filter((l) => l.state === s).length;
  return {
    checked: internal.length,
    ok: count('ok'),
    redirects: count('redirect'),
    broken: count('broken'),
    failed: count('failed'),
    links,
  };
}
