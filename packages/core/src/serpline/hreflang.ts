/**
 * hreflang checks (docs/serpline-SPEC.md §4.7): valid language codes, a link to the page itself,
 * x-default, and return links from the alternates the page could fetch (same origin only).
 */
import type { PageFacts } from './extract.ts';
import type { HreflangPage } from './live.ts';

export interface HreflangFacts {
  /** Codes that are not "x-default" or a language (plus optional script and region). */
  invalid: string[];
  /** One of the alternates points to this page. */
  self: boolean;
  xDefault: boolean;
  /** Fetched alternates, with their status and return link. */
  pages: HreflangPage[];
  /** Alternates that do not link back or do not answer 200. */
  noReturn: HreflangPage[];
}

const CODE = /^[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?$/i;
/** Common mistakes that match the pattern but are not valid: UK is GB in ISO 3166. */
const WRONG_REGION = /-(uk|eu)$/i;

export function validHreflang(code: string): boolean {
  if (code.toLowerCase() === 'x-default') return true;
  return CODE.test(code) && !WRONG_REGION.test(code);
}

const norm = (s: string) => {
  try {
    const u = new URL(s);
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`;
  } catch {
    return s;
  }
};

export function checkHreflang(
  facts: PageFacts,
  url: string,
  pages: HreflangPage[] | null,
): HreflangFacts {
  const list = facts.hreflang;
  const invalid = [...new Set(list.map((h) => h.lang).filter((c) => !validHreflang(c)))];
  const self = list.some((h) => norm(h.href) === norm(url));
  const xDefault = list.some((h) => h.lang.toLowerCase() === 'x-default');
  const fetched = pages ?? [];
  const noReturn = fetched.filter((p) => p.status !== 200 || p.linksBack === false);
  return { invalid, self, xDefault, pages: fetched, noReturn };
}
