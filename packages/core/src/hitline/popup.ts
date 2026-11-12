/**
 * Popup summary (docs/hitline-SPEC.md §3.1): URLs only, no bodies, no HAR.
 * Consent issues are reported only when the URL order proves them (docs/hitline/PLAN.md, decision 4).
 */
import { classifyRequest } from './classify.ts';
import { decodeGcd, MARKETING } from './consent.ts';
import { consentCommands } from './datalayer.ts';
import { hostOf, isSubdomainOf, registrableDomain } from './domain.ts';
import { reportIssues, valueIssues } from './issues.ts';
import { byTime, mergeFanOut, type PlatformSummary } from './analyze.ts';
import { isTracked, platformDef, platformOrder } from './platforms.ts';
import type { Hit, Issue, RawRequest } from './types.ts';

/** What the popup's executeScript returns from the active tab. */
export interface PopupProbe {
  url: string;
  /** performance.timeOrigin: resource start times are relative to it. */
  timeOrigin?: number;
  /** performance.getEntriesByType('resource'): name and startTime (ms after timeOrigin). */
  resources: { name: string; startTime: number }[];
  /** Consent commands and other gtag() calls found in window.dataLayer (no timestamps). */
  dataLayer: unknown[];
  dataLayerLength: number;
  gtmIds: string[];
  cmp: string[];
  cookies: Record<string, string>;
  serverContainerUrl?: string;
  /** Platform ids whose page globals exist (fbq, ttq, clarity, ...). */
  globals?: string[];
  /** The browser keeps a limited list of requests (250 by default); later ones are not listed. */
  bufferFull?: boolean;
  /** document.readyState when read. Missing in old probes and fixtures: treated as loaded. */
  readyState?: string;
  /** performance loadEventEnd (ms after timeOrigin), 0 while the page is still loading. */
  loadedAt?: number;
}

export interface PopupSummary {
  host: string;
  /** Network requests that carried tracking. */
  requests: number;
  sgtm: { detected: boolean; host?: string; signals: number };
  platforms: PlatformSummary[];
  issues: Issue[];
  noTracking: boolean;
  url: string;
  /** Tracked hits read from the request URLs, newest first. */
  events: Hit[];
  bufferFull: boolean;
}

function consentIssuesFromUrls(probe: PopupProbe, hits: Hit[]): Issue[] {
  const commands = consentCommands(probe.dataLayer.map((value) => ({ time: 0, value })));
  const defaults = commands.filter((c) => c.kind === 'default');
  if (!defaults.some((c) => c.values.ad_storage === 'denied')) return [];
  const google = hits.filter((h) => (h.platform === 'ga4' || h.platform === 'ads') && h.gcd);
  const withGcd = google.map((h) => ({ h, gcd: decodeGcd(h.gcd) })).filter((x) => x.gcd);
  // Last Google hit that still shows no update: anything before it was sent before the choice.
  const lastBefore = withGcd.filter((x) => !x.gcd!.ad_storage!.updated).at(-1)?.h.time ?? -Infinity;
  // First Google hit after an update that denied ad_storage: anything after it ignored the rejection.
  const rejected = withGcd.find(
    (x) => x.gcd!.ad_storage!.updated && x.gcd!.ad_storage!.value === 'denied',
  );
  const out = new Map<string, Issue>();
  for (const h of hits) {
    if (!MARKETING.includes(h.platform)) continue;
    let id: 'CONSENT_BEFORE' | 'CONSENT_AFTER_REJECT' | null = null;
    if (h.time < lastBefore) id = 'CONSENT_BEFORE';
    else if (rejected && h.time > rejected.h.time) id = 'CONSENT_AFTER_REJECT';
    if (!id) continue;
    const key = `${id}:${h.platform}`;
    if (out.has(key)) out.get(key)!.evidence.push(h.id);
    else {
      out.set(key, {
        id,
        severity: 'high',
        tab: 'consent',
        key,
        data: { platform: h.platform, event: h.event, tags: [] },
        evidence: [h.id],
      });
    }
  }
  return [...out.values()];
}

export function analyzePopup(probe: PopupProbe): PopupSummary {
  const host = hostOf(probe.url);
  const site = registrableDomain(host);
  // Resource times are relative to the page start: make them clock times for display.
  const origin = probe.timeOrigin ?? 0;
  const requests: RawRequest[] = probe.resources.map((r, i) => ({
    id: `r${i}`,
    time: Math.round(origin + r.startTime),
    method: 'GET',
    url: r.name,
  }));
  const hits = mergeFanOut(
    requests.flatMap((r, i) => classifyRequest(r).map((h) => ({ ...h, seq: i }))).sort(byTime),
  );
  const listed = hits.filter(
    (h) =>
      isTracked(h.platform) || (platformDef(h.platform).group === 'tags' && h.platform !== 'gtm'),
  );
  const tracked = hits.filter((h) => isTracked(h.platform));

  const ga4Server = hits.filter((h) => h.platform === 'ga4' && h.route === 'sgtm');
  const own = ga4Server.find((h) => isSubdomainOf(h.host, site));
  const signals = [Boolean(own), ga4Server.length > 0, Boolean(probe.serverContainerUrl)].filter(
    Boolean,
  ).length;

  const issues = reportIssues([...consentIssuesFromUrls(probe, hits), ...valueIssues(hits)]);
  const globals = (probe.globals ?? []).filter(isTracked);
  const ids = [...new Set([...listed.map((h) => h.platform), ...globals])].sort(
    (a, b) => platformOrder(a) - platformOrder(b),
  );
  const platforms: PlatformSummary[] = ids.map((p) => {
    const mine = listed.filter((h) => h.platform === p);
    return {
      platform: p,
      events: mine.length,
      issues: issues.filter((i) => i.data.platform === p).length,
      accounts: [...new Set(mine.map((h) => h.account).filter((a): a is string => Boolean(a)))],
      ...(mine.length === 0 ? { loadedOnly: true } : {}),
    };
  });

  return {
    host,
    url: probe.url,
    requests: new Set(hits.filter((h) => h.platform !== 'datalayer').map((h) => h.requestId)).size,
    sgtm: { detected: signals >= 2, host: (own ?? ga4Server[0])?.host, signals },
    platforms,
    issues,
    noTracking: tracked.length === 0 && globals.length === 0,
    events: [...listed].reverse(),
    bufferFull: probe.bufferFull === true,
  };
}
