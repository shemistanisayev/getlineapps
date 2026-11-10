/**
 * Popup summary (docs/hitline-SPEC.md §3.1): URLs only, no bodies, no HAR.
 * Consent issues are reported only when the URL order proves them (docs/hitline/PLAN.md, decision 4).
 */
import { classifyRequest } from './classify.ts';
import { decodeGcd, MARKETING } from './consent.ts';
import { consentCommands } from './datalayer.ts';
import { hostOf, isSubdomainOf, registrableDomain } from './domain.ts';
import { reportIssues, valueIssues } from './issues.ts';
import type { PlatformSummary } from './analyze.ts';
import { TRACKED_PLATFORMS } from './analyze.ts';
import type { Hit, Issue, RawRequest } from './types.ts';

/** What the popup's executeScript returns from the active tab. */
export interface PopupProbe {
  url: string;
  /** performance.getEntriesByType('resource'): name and startTime (ms after timeOrigin). */
  resources: { name: string; startTime: number }[];
  /** Consent commands and other gtag() calls found in window.dataLayer (no timestamps). */
  dataLayer: unknown[];
  dataLayerLength: number;
  gtmIds: string[];
  cmp: string[];
  cookies: Record<string, string>;
  serverContainerUrl?: string;
}

export interface PopupSummary {
  host: string;
  /** Network requests that carried tracking. */
  requests: number;
  sgtm: { detected: boolean; host?: string; signals: number };
  platforms: PlatformSummary[];
  issues: Issue[];
  noTracking: boolean;
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
  const requests: RawRequest[] = probe.resources.map((r, i) => ({
    id: `r${i}`,
    time: r.startTime,
    method: 'GET',
    url: r.name,
  }));
  const hits = requests.flatMap((r) => classifyRequest(r));
  const tracked = hits.filter((h) => TRACKED_PLATFORMS.includes(h.platform));

  const ga4Server = hits.filter((h) => h.platform === 'ga4' && h.route === 'sgtm');
  const own = ga4Server.find((h) => isSubdomainOf(h.host, site));
  const signals = [Boolean(own), ga4Server.length > 0, Boolean(probe.serverContainerUrl)].filter(
    Boolean,
  ).length;

  const issues = reportIssues([...consentIssuesFromUrls(probe, hits), ...valueIssues(hits)]);
  const platforms = TRACKED_PLATFORMS.map((p) => ({
    platform: p,
    events: tracked.filter((h) => h.platform === p).length,
    issues: issues.filter((i) => i.data.platform === p).length,
  })).filter((s) => s.events > 0);

  return {
    host,
    requests: new Set(hits.filter((h) => h.platform !== 'datalayer').map((h) => h.requestId)).size,
    sgtm: { detected: signals >= 2, host: (own ?? ga4Server[0])?.host, signals },
    platforms,
    issues,
    noTracking: tracked.length === 0,
  };
}
