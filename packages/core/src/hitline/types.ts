/** Hitline data model (docs/hitline-SPEC.md §3.1, §4). Pure data: no DOM, no chrome.*. */

export type Platform = 'ga4' | 'ads' | 'meta' | 'tiktok' | 'hotjar' | 'gtm' | 'datalayer';
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
  | 'NO_TRACKING';

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
