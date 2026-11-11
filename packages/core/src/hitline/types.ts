/** Hitline data model (docs/hitline-SPEC.md §3.1, §4). Pure data: no DOM, no chrome.*. */

/**
 * Platform id from the registry in platforms.ts ('ga4', 'meta', 'linkedin', ...), `custom:<name>` for
 * a rule from Settings, or 'other' for an unknown tracking-like request.
 */
export type Platform = string;
export type Route = 'browser' | 'sgtm' | 'page';
export type ConsentSignal =
  'ad_storage' | 'analytics_storage' | 'ad_user_data' | 'ad_personalization' | (string & {});
export type ConsentValue = 'granted' | 'denied';

export interface Header {
  name: string;
  value: string;
}

/** One network request, as DevTools (HAR) or the popup (URL only) sees it. */
export interface RawRequest {
  id: string;
  /** ms since epoch */
  time: number;
  method: string;
  url: string;
  /** POST body text, when known (panel only). */
  body?: string;
  responseHeaders?: Header[];
}

/** A dataLayer entry. gtag() commands are arrays: ['consent', 'update', {...}]. */
export interface DataLayerEntry {
  time: number;
  value: unknown;
  /** True when the push time was not recorded (read later): the time is an estimate. */
  approx?: boolean;
  /** Position in the page's dataLayer (keeps pushes in order when times are estimates). */
  index?: number;
}

/** One `inspectedWindow.eval` snapshot (§3.1). Only the listed cookie names are read. */
export interface Snapshot {
  time: number;
  url: string;
  /** New dataLayer entries since the last snapshot. */
  dataLayer?: DataLayerEntry[];
  gtmIds?: string[];
  /** From google_tag_data or gtag config. */
  serverContainerUrl?: string;
  /** Known CMP globals found on the page (Cookiebot, OneTrust, ...). */
  cmp?: string[];
  cookies?: Record<string, string>;
  /** Platform ids whose page globals exist (fbq, ttq, clarity, ...): loaded even without a request. */
  globals?: string[];
  /** New entries of other page data layers (adobeDataLayer), keyed by platform id. */
  layers?: { platform: Platform; entries: DataLayerEntry[] }[];
  /** Object data layers (digitalData, utag_data) when they changed, keyed by platform id. */
  pageData?: { platform: Platform; value: unknown }[];
  /** document.referrer of the page (new-site detection). */
  referrer?: string;
}

export interface Navigation {
  time: number;
  url: string;
}

/** Everything one recording session collected. */
export interface SessionInput {
  requests: RawRequest[];
  navigations: Navigation[];
  snapshots: Snapshot[];
  /** gtm.js response bodies (panel reads them with getContent, no extra request). */
  gtmScripts?: { id: string; body: string }[];
}

export interface Param {
  key: string;
  value: string;
}

/** A classified tracking event: one row in the Events table. */
export interface Hit {
  id: string;
  requestId: string;
  time: number;
  platform: Platform;
  /** Event name: GA4 `en`, Meta `ev`, TikTok `event`, `conversion`, `script`, `container`, dataLayer `event`. */
  event: string;
  route: Route;
  method: string;
  url: string;
  host: string;
  /** Event parameters, flattened (`items[0].item_id`). */
  params: Param[];
  /** Page and identity fields (page_location, client_id, ...), not shown as event params. */
  context: Param[];
  /** Account id: GA4 tid, Meta pixel id, Ads conversion id, GTM container id, Hotjar site id. */
  account?: string;
  gcs?: string;
  gcd?: string;
  /** Index of the page (navigation) this hit belongs to. */
  page: number;
  /** The time is an estimate (dataLayer entry read after the push). */
  approx?: boolean;
  /** Capture order, used as a tie-breaker when two hits share a time. */
  seq?: number;
  /** Other endpoints that carried the same event (Google Ads, X and Floodlight send to two hosts). */
  alsoSentTo?: string[];
}

export type Severity = 'high' | 'medium' | 'info';

export type IssueId =
  | 'CONSENT_BEFORE'
  | 'CONSENT_AFTER_REJECT'
  | 'UNWANTED_REFERRAL'
  | 'XDOMAIN_BREAK'
  | 'VALUE_MISSING'
  | 'PLAN_MISSING'
  | 'PLAN_PARAMS'
  | 'BROWSER_ONLY'
  | 'NO_TRACKING'
  | 'DUPLICATE_EVENT'
  | 'PURCHASE_NO_ID'
  | 'PII_EMAIL'
  | 'MULTIPLE_GA4'
  | 'INTERNAL_EVENTS';

export type IssueTab = 'events' | 'gtm' | 'consent' | 'attribution' | 'plan';

/**
 * One issue. UI text is built from `id` + `data` by each surface's dictionary,
 * so EN and AZ stay in the extension's i18n files.
 */
export interface Issue {
  id: IssueId;
  severity: Severity;
  tab: IssueTab;
  /** Stable key for de-duplication, e.g. "VALUE_MISSING:meta:AddToCart". */
  key: string;
  data: Record<string, string | string[] | number>;
  /** Hit ids that prove the issue. */
  evidence: string[];
}
