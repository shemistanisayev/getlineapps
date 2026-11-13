/**
 * Rivaline data shapes (docs/rivaline-SPEC.md §4 to §6). The extension's injected functions
 * return PageSnapshot and BrandRaw; everything else is computed here from plain data.
 */

/** Stack categories in display order (SPEC §4.2). */
export const CATEGORIES = [
  'advertising',
  'analytics',
  'tagmanagement',
  'consent',
  'crm',
  'email',
  'chat',
  'abtesting',
  'ecommerce',
  'reviews',
  'payments',
  'affiliate',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** What collectSnapshot returns (SPEC §4.1). Plain data only, read in the page's MAIN world. */
export interface PageSnapshot {
  url: string;
  origin: string;
  title: string;
  lang: string;
  /** `src` of every `<script>`, absolute. */
  scripts: string[];
  /** First 300 characters of up to 50 inline scripts. */
  inline: string[];
  /** performance resource names, max 400. */
  resources: string[];
  /** Chrome keeps 250 resources per page by default: when full, late requests are missing. */
  resourcesFull?: boolean;
  /** Global paths from GLOBAL_PATHS that are defined on the page. */
  globals: string[];
  /** Whitelisted values that carry IDs (VALUE_PATHS). Strings or lists of keys. */
  values: Record<string, string | string[]>;
  /** Cookie names only, never values. */
  cookies: string[];
  /** generator, og:site_name, application-name. */
  meta: Record<string, string>;
  /** Hosts of `<link rel=preconnect|dns-prefetch>`. */
  links: string[];
  /** Selectors from SELECTORS that match an element. */
  selectors: string[];
  /** A `consent` command was pushed to dataLayer (Consent Mode). */
  consentCommand?: boolean;
  /** The page has a form with an email field. */
  emailForm?: boolean;
  readyState?: string;
}

export type EvidenceKind = 'Script' | 'Request' | 'Global' | 'Cookie' | 'Meta' | 'Element';

export interface Evidence {
  kind: EvidenceKind;
  value: string;
}

/** Turns a match into an ID ("AW-11284956", "site 3918274"). */
export interface Extractor {
  from: 'script' | 'resource' | 'inline' | 'value' | 'cookie';
  /** For `value`: the VALUE_PATHS key. */
  path?: string;
  /** First group is the ID. For `value` lists, applied to each key. */
  pattern?: RegExp;
  format?: (id: string) => string;
}

export interface Rule {
  id: string;
  name: string;
  category: Category;
  /** Mark name in @line/ui; tools without one show their category glyph. */
  mark?: string;
  /** Short label when the page exposes no ID ("chat", "widget"). */
  kind?: string;
  script?: RegExp[];
  resource?: RegExp[];
  global?: string[];
  cookie?: RegExp[];
  meta?: Array<{ name: string; pattern: RegExp }>;
  selector?: string[];
  ids?: Extractor[];
}

export interface FoundTool {
  id: string;
  name: string;
  category: Category;
  mark?: string;
  ids: string[];
  /** What the tool is when the page shows no ID ("chat", "web push"), from the rule. */
  kind?: string;
  /** IDs joined, else the kind label, else empty. */
  label: string;
  evidence: Evidence[];
}

export type GapId = 'GAP_SERVER_SIDE' | 'GAP_CONSENT' | 'GAP_CRM' | 'GAP_ANALYTICS';

export interface Gap {
  id: GapId;
  severity: 'high' | 'medium';
  /** Ad pixels for GAP_SERVER_SIDE. */
  count?: number;
  /** The email tool named in the PDF line of GAP_CRM. */
  emailTool?: string;
}

export interface StackSummary {
  tools: number;
  categories: number;
  /** E-commerce platform or site builder, when one is found. */
  platform?: string;
  /** "Meta", "TikTok", "Google" ... in SPEC order. */
  adChannels: string[];
  /** Up to 7 tools for the marks row: platform, tag managers, analytics, advertising, rest. */
  marks: FoundTool[];
  /** Tools not in the marks row ("+6"). */
  more: number;
}

export interface Stack {
  tools: FoundTool[];
  groups: Array<{ category: Category; tools: FoundTool[] }>;
  /** Category chips: sorted by count, then category order (design: Main). */
  chips: Array<{ category: Category; count: number }>;
  gaps: Gap[];
  summary: StackSummary;
  /** Advertising tools on the page. */
  adPixels: number;
}
