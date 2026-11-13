/**
 * Ad library links (docs/rivaline-SPEC.md §5). Formats checked on Chrome stable 2026-11-13
 * (scripts/spike-rivaline.ts, docs/rivaline/PLAN.md): keep them in this one file so a library
 * change is a one-line fix. The panel, the PDF and the landing's #finder all use these.
 */
import { registrableDomain } from '../shared/domain.ts';
import type { FoundTool, PageSnapshot } from './types.ts';

export type LibraryId = 'meta' | 'google' | 'tiktok' | 'linkedin';
export const LIBRARIES: LibraryId[] = ['meta', 'google', 'tiktok', 'linkedin'];

/** The tag on the site that matches each library (status pill). */
export const LIBRARY_TOOL: Record<LibraryId, string> = {
  meta: 'meta_pixel',
  google: 'google_ads',
  tiktok: 'tiktok_pixel',
  linkedin: 'linkedin_insight',
};

/** What each library searches by. */
export const LIBRARY_QUERY: Record<LibraryId, 'brand' | 'domain'> = {
  meta: 'brand',
  google: 'domain',
  tiktok: 'brand',
  linkedin: 'brand',
};

/**
 * TikTok's library only covers the EU, the EEA, Switzerland and the UK. Another country leaves
 * TikTok's country box empty, so those searches use "all" (PLAN decision 4).
 */
export const TIKTOK_REGIONS = new Set(
  'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO CH GB'.split(
    ' ',
  ),
);

const MAX_BRAND = 40;
const SPLIT = / \| | - | – | : /;

/** Brand name default (SPEC §5): og:site_name, application-name, else the first part of the title. */
export function brandName(snap: Pick<PageSnapshot, 'meta' | 'title'>): string {
  const pick =
    snap.meta['og:site_name']?.trim() ||
    snap.meta['application-name']?.trim() ||
    (snap.title.split(SPLIT)[0] ?? '').trim();
  return pick.slice(0, MAX_BRAND).trim();
}

/** Domain default: the tab's registrable domain. */
export function brandDomain(url: string): string {
  return registrableDomain(url);
}

/** `cc` is an ISO 3166 alpha-2 code, or null / "ALL" for all countries. */
function country(cc: string | null | undefined): string | null {
  const v = (cc ?? '').trim().toUpperCase();
  return v && v !== 'ALL' ? v : null;
}

export function metaLibraryUrl(brand: string, cc?: string | null): string {
  const q = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country: country(cc) ?? 'ALL',
    search_type: 'keyword_unordered',
    q: brand.trim(),
  });
  return `https://www.facebook.com/ads/library/?${q}`;
}

export function googleLibraryUrl(domain: string, cc?: string | null): string {
  const q = new URLSearchParams({ region: country(cc) ?? 'anywhere', domain: domain.trim() });
  return `https://adstransparency.google.com/?${q}`;
}

export function tiktokLibraryUrl(brand: string, cc?: string | null): string {
  const c = country(cc);
  const q = new URLSearchParams({
    region: c && TIKTOK_REGIONS.has(c) ? c : 'all',
    adv_name: brand.trim(),
  });
  return `https://library.tiktok.com/ads?${q}`;
}

export function linkedinLibraryUrl(brand: string): string {
  return `https://www.linkedin.com/ad-library/search?${new URLSearchParams({ accountOwner: brand.trim() })}`;
}

export interface LibraryLink {
  id: LibraryId;
  url: string;
  /** What was searched: the brand or the domain. */
  query: string;
  /** The matching tag is on the site. */
  found: boolean;
}

/** The four links in panel order. `tools` gives the status pills (empty on the landing). */
export function libraryLinks(
  input: { brand: string; domain: string; country?: string | null },
  tools: Pick<FoundTool, 'id'>[] = [],
): LibraryLink[] {
  const { brand, domain, country: cc } = input;
  const url: Record<LibraryId, string> = {
    meta: metaLibraryUrl(brand, cc),
    google: googleLibraryUrl(domain, cc),
    tiktok: tiktokLibraryUrl(brand, cc),
    linkedin: linkedinLibraryUrl(brand),
  };
  return LIBRARIES.map((id) => ({
    id,
    url: url[id],
    query: LIBRARY_QUERY[id] === 'domain' ? domain.trim() : brand.trim(),
    found: tools.some((t) => t.id === LIBRARY_TOOL[id]),
  }));
}

/**
 * The landing's #finder input (design/rivaline/Landing.dc.html): a domain gives the domain and a
 * brand from its first label ("example.com" -> "Example"); anything else is the brand and Google,
 * which searches by domain, has nothing to search yet.
 */
export function parseFinderQuery(input: string): { brand: string; domain: string | null } {
  const raw = input.trim();
  const host = (
    raw
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split(/[/?#]/)[0] ?? ''
  ).toLowerCase();
  const isDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) && !/\s/.test(raw);
  if (!isDomain) return { brand: raw.slice(0, MAX_BRAND).trim(), domain: null };
  const domain = registrableDomain(host);
  const first = domain.split('.')[0] ?? '';
  return { brand: first ? first[0]!.toUpperCase() + first.slice(1) : '', domain };
}
