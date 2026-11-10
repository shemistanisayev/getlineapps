/** Session -> Audit: everything the panel, popup and PDF show, from one pure function. */
import { buildAttribution, type AttributionResult } from './attribution.ts';
import { classifyRequest, dataLayerHit } from './classify.ts';
import {
  buildConsent,
  hitConsentStatus,
  stateAt,
  type ConsentModel,
  type HitConsentStatus,
} from './consent.ts';
import { serverContainerUrlFrom } from './datalayer.ts';
import { hostOf, registrableDomain } from './domain.ts';
import { parseGtmContainer, type GtmContainer, type GtmTag, type TagStatus } from './gtm.ts';
import {
  attributionIssues,
  consentIssues,
  planIssues,
  sgtmIssues,
  sortIssues,
  valueIssues,
} from './issues.ts';
import { diffPlan, type Plan, type PlanResult } from './plan.ts';
import { detectSgtm, type SgtmResult } from './sgtm.ts';
import type { DataLayerEntry, Hit, Issue, IssueTab, Platform, SessionInput } from './types.ts';

export interface Settings {
  /** "Your domains" from Settings. Default: the inspected site's registrable domain. */
  domains?: string[];
  plan?: Plan | null;
}

export const TRACKED_PLATFORMS: Platform[] = ['ga4', 'ads', 'meta', 'tiktok', 'hotjar'];

export interface PlatformSummary {
  platform: Platform;
  events: number;
  issues: number;
}

export interface TimelineRow {
  hit: Hit | null;
  platform: Platform;
  event: string;
  time: number | null;
  phase: 'before' | 'after';
  status: HitConsentStatus;
}

export interface ConsentView {
  model: ConsentModel;
  /** Page where the visitor made the choice (or the first page). */
  page: number;
  timeline: TimelineRow[];
  /** Google tags read the signals correctly ('none' when no Google hit). */
  google: 'ok' | 'mismatch' | 'none';
  notLoaded: Platform[];
}

export interface TagView extends GtmTag {
  status: TagStatus;
}

export interface GtmView {
  container: GtmContainer;
  tags: TagView[];
}

export interface Audit {
  site: string;
  host: string;
  pageUrl: string;
  pages: string[];
  /** Events tab rows: every tracked hit plus dataLayer events, in time order (no GTM container loads). */
  events: Hit[];
  hits: Hit[];
  /** Network requests that carried tracking (no dataLayer). */
  trackingRequests: number;
  platforms: PlatformSummary[];
  gtm: GtmView[];
  sgtm: SgtmResult;
  consent: ConsentView;
  attribution: AttributionResult;
  plan: PlanResult | null;
  issues: Issue[];
  counts: Record<IssueTab, number>;
}

function pageIndexer(navTimes: number[]): (t: number) => number {
  return (t) => {
    let idx = 0;
    navTimes.forEach((nt, i) => {
      if (nt <= t) idx = i;
    });
    return idx;
  };
}

function estimatedContainer(id: string, hits: Hit[], valueMissing: Set<string>): GtmContainer {
  const seen = new Map<string, GtmTag>();
  for (const h of hits) {
    if (!['ga4', 'ads', 'meta', 'tiktok', 'hotjar'].includes(h.platform)) continue;
    const key = `${h.platform}:${h.event}`;
    if (seen.has(key)) continue;
    const label: Record<string, string> = {
      ga4: 'GA4',
      ads: 'Google Ads',
      meta: 'Meta',
      tiktok: 'TikTok',
      hotjar: 'Hotjar',
    };
    seen.set(key, {
      index: seen.size,
      name: h.platform === 'hotjar' ? 'Hotjar' : `${label[h.platform]} ${h.event}`,
      type:
        h.platform === 'ga4' ? 'GA4 Event' : h.platform === 'ads' ? 'Google Ads' : 'Custom HTML',
      platform: h.platform,
      event: h.event,
      base: false,
      trigger: '',
      consent: [],
      paused: false,
    });
  }
  void valueMissing;
  return { id, tags: [...seen.values()], triggers: 0, variables: 0, estimated: true };
}

function tagHits(tag: GtmTag, hits: Hit[]): Hit[] {
  if (!tag.platform) return [];
  return hits.filter(
    (h) =>
      h.platform === tag.platform &&
      (tag.base ? !tag.event || h.event === tag.event : h.event === tag.event),
  );
}

function tagStatus(
  tag: GtmTag,
  hits: Hit[],
  consent: ConsentModel,
  valueMissing: Set<string>,
  now: number,
): TagStatus {
  const fired = tagHits(tag, hits);
  if (fired.length) {
    if (fired.some((h) => valueMissing.has(`${h.platform}:${h.event}`))) return 'missing_value';
    if (
      consent.active &&
      (tag.platform === 'meta' || tag.platform === 'tiktok') &&
      tag.consent.length === 0
    ) {
      return 'no_consent_check';
    }
    return 'fired';
  }
  const state = stateAt(consent, now);
  if (tag.consent.some((s) => state[s] !== 'granted')) return 'waiting_consent';
  return 'not_fired';
}

export function analyze(input: SessionInput, settings: Settings = {}): Audit {
  const navs = [...input.navigations].sort((a, b) => a.time - b.time);
  const snapshots = [...input.snapshots].sort((a, b) => a.time - b.time);
  const firstUrl = navs[0]?.url ?? snapshots[0]?.url ?? input.requests[0]?.url ?? '';
  const pages = navs.length ? navs.map((n) => n.url) : [firstUrl];
  const pageOf = pageIndexer(navs.length ? navs.map((n) => n.time) : [-Infinity]);

  const entries: DataLayerEntry[] = snapshots.flatMap((s) => s.dataLayer ?? []);
  const hits: Hit[] = [];
  for (const r of [...input.requests].sort((a, b) => a.time - b.time)) {
    hits.push(...classifyRequest(r, pageOf(r.time)));
  }
  entries.forEach((e, i) => {
    const page = pageOf(e.time);
    const h = dataLayerHit(e, `dl-${i}`, page, pages[page] ?? firstUrl);
    if (h) hits.push(h);
  });
  hits.sort((a, b) => a.time - b.time);

  const site = registrableDomain(settings.domains?.[0] ?? hostOf(firstUrl));
  const cmp = [...new Set(snapshots.flatMap((s) => s.cmp ?? []))];
  const consent = buildConsent(entries, cmp);
  const serverContainerUrl =
    snapshots.map((s) => s.serverContainerUrl).find(Boolean) ?? serverContainerUrlFrom(entries);
  const lastTime = Math.max(0, ...hits.map((h) => h.time), ...snapshots.map((s) => s.time));
  const sgtm = detectSgtm(site, hits, input.requests, serverContainerUrl, lastTime);

  const attribution = buildAttribution(
    pages.map((url, i) => ({
      url,
      cookies: Object.assign(
        {},
        ...snapshots.filter((s) => pageOf(s.time) === i).map((s) => s.cookies ?? {}),
      ),
      hits: hits.filter((h) => h.page === i),
    })),
  );

  // GTM containers: parsed from gtm.js when available, else estimated from hits.
  const valueIss = valueIssues(hits);
  const valueMissing = new Set(valueIss.map((i) => `${i.data.platform}:${i.data.event}`));
  const ids = [
    ...new Set([
      ...hits.filter((h) => h.platform === 'gtm' && h.account).map((h) => h.account!),
      ...snapshots.flatMap((s) => s.gtmIds ?? []),
    ]),
  ];
  const containers: GtmContainer[] = ids.map((id) => {
    const script = input.gtmScripts?.find((s) => s.id === id);
    return (
      (script && parseGtmContainer(id, script.body)) || estimatedContainer(id, hits, valueMissing)
    );
  });
  const primary = containers[0] ?? null;
  const gtm: GtmView[] = containers.map((c) => ({
    container: c,
    tags: c.tags
      .filter((t) => !t.paused)
      .map((t) => ({ ...t, status: tagStatus(t, hits, consent, valueMissing, lastTime) })),
  }));

  const plan = settings.plan ? diffPlan(settings.plan, hits) : null;

  // Consent view: the page where the choice happened.
  const choicePage = consent.choice ? pageOf(consent.choice.time) : 0;
  const timeline: TimelineRow[] = hits
    .filter((h) => h.page === choicePage && TRACKED_PLATFORMS.includes(h.platform))
    .map((h) => ({
      hit: h,
      platform: h.platform,
      event: h.event,
      time: h.time,
      phase: consent.choice && h.time >= consent.choice.time ? 'after' : 'before',
      status: hitConsentStatus(consent, h),
    }));
  const notLoaded: Platform[] = [];
  const hotjarTag = containers.some((c) => c.tags.some((t) => t.platform === 'hotjar'));
  if (
    hotjarTag &&
    consent.afterChoice.analytics_storage === 'denied' &&
    !hits.some((h) => h.platform === 'hotjar')
  ) {
    notLoaded.push('hotjar');
    timeline.push({
      hit: null,
      platform: 'hotjar',
      event: 'script',
      time: null,
      phase: consent.choice ? 'after' : 'before',
      status: 'not_loaded',
    });
  }
  const googleRows = timeline.filter((r) => r.platform === 'ga4' || r.platform === 'ads');
  const google: ConsentView['google'] =
    !consent.active || googleRows.length === 0
      ? 'none'
      : googleRows.some((r) => r.status === 'mismatch' || r.status === 'no_signal')
        ? 'mismatch'
        : 'ok';

  const tracked = hits.filter((h) => TRACKED_PLATFORMS.includes(h.platform));
  const issues = sortIssues([
    ...consentIssues(consent, hits, primary),
    ...attributionIssues(attribution),
    ...valueIss,
    ...planIssues(plan),
    ...sgtmIssues(sgtm),
    ...(tracked.length === 0
      ? [
          {
            id: 'NO_TRACKING' as const,
            severity: 'info' as const,
            tab: 'events' as const,
            key: 'NO_TRACKING',
            data: { host: hostOf(firstUrl) },
            evidence: [],
          },
        ]
      : []),
  ]);

  const events = hits.filter((h) => h.platform !== 'gtm');
  const platforms: PlatformSummary[] = TRACKED_PLATFORMS.map((p) => ({
    platform: p,
    events: hits.filter((h) => h.platform === p).length,
    issues: issues.filter((i) => i.severity !== 'info' && i.data.platform === p).length,
  })).filter((s) => s.events > 0);

  const tabIssues = (tab: IssueTab) =>
    issues.filter((i) => i.tab === tab && i.severity !== 'info').length;

  return {
    site,
    host: hostOf(firstUrl),
    pageUrl: firstUrl,
    pages,
    events,
    hits,
    trackingRequests: new Set(
      tracked.concat(hits.filter((h) => h.platform === 'gtm')).map((h) => h.requestId),
    ).size,
    platforms,
    gtm,
    sgtm,
    consent: { model: consent, page: choicePage, timeline, google, notLoaded },
    attribution,
    plan,
    issues,
    counts: {
      events: events.length,
      gtm: gtm.reduce((n, g) => n + g.tags.length, 0),
      consent: tabIssues('consent'),
      attribution: tabIssues('attribution'),
      plan: tabIssues('plan'),
    },
  };
}
