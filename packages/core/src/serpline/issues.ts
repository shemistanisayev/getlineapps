/**
 * Issue rules (SPEC §4.5): one list for the panel, the PDF and the score. Rules return ids,
 * numbers and evidence only; every sentence lives in the extension's EN and AZ dictionaries.
 */

export type Severity = 'high' | 'medium' | 'low';
export type IssueTab = 'summary' | 'headings' | 'links' | 'render' | 'speed' | 'ai';

export type IssueId =
  | 'RAW_H1'
  | 'RAW_TEXT'
  | 'NO_TITLE'
  | 'NOINDEX'
  | 'CANONICAL_OTHER'
  | 'SCHEMA_JS'
  | 'DESC_LONG'
  | 'DESC_MISSING'
  | 'IMG_ALT'
  | 'OG_DESC'
  | 'BROKEN_LINK'
  | 'AI_SEARCH_BLOCKED'
  | 'H1_MULTI'
  | 'HEADING_SKIP'
  | 'REDIRECT_LINKS'
  | 'TITLE_LONG'
  // Added in 1.1 (docs/serpline-SPEC.md §4.7)
  | 'HTTP_ERROR'
  | 'ROBOTS_BLOCKED'
  | 'CANONICAL_BROKEN'
  | 'CANONICAL_REDIRECT'
  | 'CANONICAL_MULTI'
  | 'SCHEMA_PARSE'
  | 'SCHEMA_REQUIRED'
  | 'HREFLANG_INVALID'
  | 'HREFLANG_NO_RETURN'
  | 'HREFLANG_NO_SELF'
  | 'NO_HTTPS'
  | 'NOT_IN_SITEMAP'
  | 'LINK_NO_TEXT'
  | 'WEAK_ANCHOR'
  | 'INTERNAL_NOFOLLOW'
  | 'HTTP_LINKS'
  | 'LCP_SLOW'
  | 'CLS_HIGH'
  | 'INP_SLOW'
  | 'TTFB_SLOW'
  | 'IMG_LAZY_TOP'
  | 'IMG_HEAVY'
  | 'MIXED_CONTENT'
  | 'VIEWPORT_MISSING'
  | 'H_SCROLL'
  | 'IMG_NO_SIZE'
  | 'IMG_FORMAT'
  | 'IMG_OVERSIZED'
  | 'NO_COMPRESSION'
  | 'VIEWPORT_ZOOM'
  | 'SMALL_TEXT'
  | 'TAP_SMALL';

/** Rule order = display order inside one severity (the SPEC table order). */
export const RULES: readonly { id: IssueId; severity: Severity; tab: IssueTab }[] = [
  { id: 'RAW_H1', severity: 'high', tab: 'render' },
  { id: 'RAW_TEXT', severity: 'high', tab: 'render' },
  { id: 'NO_TITLE', severity: 'high', tab: 'summary' },
  { id: 'NOINDEX', severity: 'high', tab: 'summary' },
  { id: 'CANONICAL_OTHER', severity: 'medium', tab: 'summary' },
  { id: 'SCHEMA_JS', severity: 'medium', tab: 'render' },
  { id: 'DESC_LONG', severity: 'medium', tab: 'summary' },
  { id: 'DESC_MISSING', severity: 'medium', tab: 'summary' },
  { id: 'IMG_ALT', severity: 'medium', tab: 'headings' },
  { id: 'OG_DESC', severity: 'medium', tab: 'summary' },
  { id: 'BROKEN_LINK', severity: 'medium', tab: 'links' },
  { id: 'AI_SEARCH_BLOCKED', severity: 'medium', tab: 'ai' },
  { id: 'H1_MULTI', severity: 'low', tab: 'headings' },
  { id: 'HEADING_SKIP', severity: 'low', tab: 'headings' },
  { id: 'REDIRECT_LINKS', severity: 'low', tab: 'links' },
  { id: 'TITLE_LONG', severity: 'low', tab: 'summary' },
  // Added in 1.1. Display order inside one severity follows this list.
  { id: 'HTTP_ERROR', severity: 'high', tab: 'summary' },
  { id: 'ROBOTS_BLOCKED', severity: 'high', tab: 'summary' },
  { id: 'CANONICAL_BROKEN', severity: 'high', tab: 'summary' },
  { id: 'CANONICAL_REDIRECT', severity: 'medium', tab: 'summary' },
  { id: 'CANONICAL_MULTI', severity: 'medium', tab: 'summary' },
  { id: 'SCHEMA_PARSE', severity: 'medium', tab: 'summary' },
  { id: 'SCHEMA_REQUIRED', severity: 'medium', tab: 'summary' },
  { id: 'HREFLANG_INVALID', severity: 'medium', tab: 'summary' },
  { id: 'HREFLANG_NO_RETURN', severity: 'medium', tab: 'summary' },
  { id: 'NO_HTTPS', severity: 'medium', tab: 'speed' },
  { id: 'LCP_SLOW', severity: 'medium', tab: 'speed' },
  { id: 'CLS_HIGH', severity: 'medium', tab: 'speed' },
  { id: 'INP_SLOW', severity: 'medium', tab: 'speed' },
  { id: 'IMG_LAZY_TOP', severity: 'medium', tab: 'speed' },
  { id: 'IMG_HEAVY', severity: 'medium', tab: 'speed' },
  { id: 'MIXED_CONTENT', severity: 'medium', tab: 'speed' },
  { id: 'VIEWPORT_MISSING', severity: 'medium', tab: 'speed' },
  { id: 'H_SCROLL', severity: 'medium', tab: 'speed' },
  { id: 'HREFLANG_NO_SELF', severity: 'low', tab: 'summary' },
  { id: 'NOT_IN_SITEMAP', severity: 'low', tab: 'summary' },
  { id: 'LINK_NO_TEXT', severity: 'low', tab: 'links' },
  { id: 'WEAK_ANCHOR', severity: 'low', tab: 'links' },
  { id: 'INTERNAL_NOFOLLOW', severity: 'low', tab: 'links' },
  { id: 'HTTP_LINKS', severity: 'low', tab: 'links' },
  { id: 'TTFB_SLOW', severity: 'low', tab: 'speed' },
  { id: 'IMG_NO_SIZE', severity: 'low', tab: 'speed' },
  { id: 'IMG_FORMAT', severity: 'low', tab: 'speed' },
  { id: 'IMG_OVERSIZED', severity: 'low', tab: 'speed' },
  { id: 'NO_COMPRESSION', severity: 'low', tab: 'speed' },
  { id: 'VIEWPORT_ZOOM', severity: 'low', tab: 'speed' },
  { id: 'SMALL_TEXT', severity: 'low', tab: 'speed' },
  { id: 'TAP_SMALL', severity: 'low', tab: 'speed' },
];

/** Link issues count only after the link check ran (SPEC §4.5). */
export const LINK_RULES: readonly IssueId[] = ['BROKEN_LINK', 'REDIRECT_LINKS'];

export type IssueParams = Record<string, string | number>;

export interface Issue {
  id: IssueId;
  severity: Severity;
  tab: IssueTab;
  /** Numbers and names for the title, explanation and fix templates. */
  params: IssueParams;
  /** Element paths, robots lines or URLs. */
  evidence: string[];
}

export const PENALTY: Record<Severity, number> = { high: 8, medium: 4, low: 2 };

export type ScoreLabel = 'good' | 'needs_work' | 'poor';

export interface SeverityCounts {
  high: number;
  medium: number;
  low: number;
}

export function severityCounts(issues: Issue[]): SeverityCounts {
  const c: SeverityCounts = { high: 0, medium: 0, low: 0 };
  for (const i of issues) c[i.severity]++;
  return c;
}

/** `100 - 8 x High - 4 x Medium - 2 x Low`, minimum 0. */
export function score(issues: Issue[]): number {
  return Math.max(0, 100 - issues.reduce((s, i) => s + PENALTY[i.severity], 0));
}

export function scoreLabel(value: number): ScoreLabel {
  if (value >= 90) return 'good';
  if (value >= 50) return 'needs_work';
  return 'poor';
}

/** Issue count per tab (tab badges). Summary has no badge but its count is still returned. */
export function countsByTab(issues: Issue[]): Record<IssueTab, number> {
  const out: Record<IssueTab, number> = {
    summary: 0,
    headings: 0,
    links: 0,
    render: 0,
    speed: 0,
    ai: 0,
  };
  for (const i of issues) out[i.tab]++;
  return out;
}

export function makeIssue(id: IssueId, params: IssueParams = {}, evidence: string[] = []): Issue {
  const rule = RULES.find((r) => r.id === id)!;
  return { id, severity: rule.severity, tab: rule.tab, params, evidence };
}

/** Sort by severity, then rule order. */
export function sortIssues(issues: Issue[]): Issue[] {
  const sev: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  const order = (id: IssueId) => RULES.findIndex((r) => r.id === id);
  return [...issues].sort((a, b) => sev[a.severity] - sev[b.severity] || order(a.id) - order(b.id));
}
