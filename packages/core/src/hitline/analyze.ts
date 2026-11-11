/** Session -> Audit: everything the panel, popup and PDF show, from one pure function. */
import { buildAttribution, type AttributionResult } from './attribution.ts';
import { classifyRequest, dataLayerHit, pageDataHit, type CustomRule } from './classify.ts';
import {
  buildConsent,
  hitConsentStatus,
  stateAt,
  type ConsentModel,
  type HitConsentStatus,
} from './consent.ts';
import { serverContainerUrlFrom } from './datalayer.ts';
import { hostOf, pathOf, registrableDomain } from './domain.ts';
import {
  mergeModel,
  parseGtmContainer,
  tagFiresOn,
  type GtmContainer,
  type GtmTag,
  type TagStatus,
  type Tri,
} from './gtm.ts';
import {
  attributionIssues,
  consentIssues,
  duplicateIssues,
  multipleGa4Issues,
  piiIssues,
  planIssues,
  purchaseIdIssues,
  sgtmIssues,
  sortIssues,
  valueIssues,
} from './issues.ts';
import { diffPlan, type Plan, type PlanResult } from './plan.ts';
import { isTracked, platformDef, platformName, platformOrder } from './platforms.ts';
import { detectSgtm, type SgtmResult } from './sgtm.ts';
import type { DataLayerEntry, Hit, Issue, IssueTab, Platform, SessionInput } from './types.ts';

export interface Settings {
  /** "Your domains" from Settings. Default: the inspected site's registrable domain. */
  domains?: string[];
  plan?: Plan | null;
  /** Custom platforms from Settings. */
  rules?: CustomRule[];
  /** Report unknown tracking-like requests as "Other" (panel: on, popup: off). */
  other?: boolean;
}

export interface PlatformSummary {
  platform: Platform;
  events: number;
  issues: number;
  /** Account ids seen (GA4 G-..., pixel ids, ...). */
  accounts: string[];
  /** Found by its page global only: loaded, but no request seen. */
  loadedOnly?: boolean;
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
  /** Hits this tag sent (matched by platform and event). */
  hitIds: string[];
}

/** One dataLayer event and what the container did with it. */
export interface GtmEventView {
  hit: Hit;
  /** Tags whose triggers match this event ('maybe' when a condition cannot be read). */
  tags: { index: number; fires: Tri; seen: boolean }[];
}

export interface GtmView {
  container: GtmContainer;
  tags: TagView[];
  /** dataLayer and GTM events on pages where this container ran, oldest first. */
  events: GtmEventView[];
}

export interface Audit {
  site: string;
  host: string;
  /** First page of the session. */
  pageUrl: string;
  /** Last page the session saw (what the inspected tab shows now). */
  currentUrl: string;
  pages: string[];
  /** Registrable domains of the pages, in visit order. */
  sites: string[];
  /** Events tab rows: tracked hits, data layers and Other, oldest first (no GTM events). */
  events: Hit[];
  hits: Hit[];
  /** Network requests that carried tracking (no data layers). */
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

export const byTime = (a: Hit, b: Hit) => a.time - b.time || (a.seq ?? 0) - (b.seq ?? 0);

function estimatedContainer(id: string, hits: Hit[]): GtmContainer {
  const seen = new Map<string, GtmTag>();
  for (const h of hits) {
    if (!isTracked(h.platform) || h.route === 'page' || h.platform === 'gtag') continue;
    if (['script', 'container', '(unknown)'].includes(h.event)) continue;
    const key = `${h.platform}:${h.event}`;
    if (seen.has(key)) continue;
    seen.set(key, {
      index: seen.size,
      name: `${platformName(h.platform)} ${h.event}`,
      type:
        h.platform === 'ga4' ? 'GA4 Event' : h.platform === 'ads' ? 'Google Ads' : 'Custom HTML',
      platform: h.platform,
      event: h.event,
      base: false,
      trigger: '',
      triggerEvents: [],
      blocking: [],
      consent: [],
      paused: false,
    });
  }
  return { id, tags: [...seen.values()], triggers: 0, variables: 0, estimated: true };
}

function tagMatches(tag: GtmTag, h: Hit): boolean {
  if (!tag.platform || h.platform !== tag.platform) return false;
  return tag.base ? !tag.event || h.event === tag.event : h.event === tag.event;
}

function tagHits(tag: GtmTag, hits: Hit[]): Hit[] {
  return hits.filter((h) => h.route !== 'page' && tagMatches(tag, h));
}

/** A hit "answers" an event when it is sent on the same page within this window after it. */
const ANSWER_MS = 3000;

function tagStatus(
  tag: GtmTag,
  fired: Hit[],
  triggered: boolean,
  consent: ConsentModel,
  valueMissing: Set<string>,
  now: number,
): TagStatus {
  if (fired.length) {
    if (fired.some((h) => valueMissing.has(`${h.platform}:${h.event}`))) return 'missing_value';
    if (
      consent.active &&
      tag.platform &&
      platformDef(tag.platform).adPixel &&
      tag.consent.length === 0
    ) {
      return 'no_consent_check';
    }
    return 'fired';
  }
  const state = stateAt(consent, now);
  if (tag.consent.some((s) => state[s] !== 'granted')) return 'waiting_consent';
  return triggered ? 'triggered' : 'not_fired';
}

const paramsKey = (h: Hit) =>
  h.params
    .map((p) => `${p.key}=${p.value}`)
    .sort()
    .join('&');

/**
 * One event sent to two endpoints (Google Ads conversion + 1p-conversion, X analytics.twitter.com
 * + t.co, Floodlight activity + activityi) is one row: same platform, account, event, route and
 * parameters within 1.5 s, on a different host or path.
 */
export function mergeFanOut(hits: Hit[]): Hit[] {
  const out: Hit[] = [];
  for (const h of hits) {
    if (h.route === 'page' || !isTracked(h.platform)) {
      out.push(h);
      continue;
    }
    const twin = out.find(
      (p) =>
        h.time - p.time <= 1500 &&
        p.platform === h.platform &&
        p.account === h.account &&
        p.event === h.event &&
        p.route === h.route &&
        p.requestId !== h.requestId &&
        (p.host !== h.host || pathOf(p.url) !== pathOf(h.url)) &&
        paramsKey(p) === paramsKey(h),
    );
    if (twin) twin.alsoSentTo = [...(twin.alsoSentTo ?? []), `${h.host}${pathOf(h.url)}`];
    else out.push(h);
  }
  return out;
}

const MAX_GTM_EVENTS = 400;

export function analyze(input: SessionInput, settings: Settings = {}): Audit {
  const navs = [...input.navigations].sort((a, b) => a.time - b.time);
  const snapshots = [...input.snapshots].sort((a, b) => a.time - b.time);
  const firstUrl = navs[0]?.url ?? snapshots[0]?.url ?? input.requests[0]?.url ?? '';
  const pages = navs.length ? navs.map((n) => n.url) : [firstUrl];
  const pageOf = pageIndexer(navs.length ? navs.map((n) => n.time) : [-Infinity]);
  const opts = { rules: settings.rules, other: settings.other };

  let seq = 0;
  const raw: Hit[] = [];
  for (const r of [...input.requests].sort((a, b) => a.time - b.time)) {
    for (const h of classifyRequest(r, pageOf(r.time), opts)) raw.push({ ...h, seq: seq++ });
  }

  // dataLayer in push order (snapshot order, then entry order), with GTM's model per page.
  const entries: DataLayerEntry[] = snapshots.flatMap((s) => s.dataLayer ?? []);
  const models = new Map<string, Record<string, unknown>>();
  const modelByPage = new Map<number, Record<string, unknown>>();
  entries.forEach((e, i) => {
    const page = pageOf(e.time);
    const model = modelByPage.get(page) ?? {};
    modelByPage.set(page, model);
    mergeModel(model, e.value);
    const h = dataLayerHit(e, `dl-${i}`, page, pages[page] ?? firstUrl);
    if (!h) return;
    raw.push({ ...h, seq: seq++ });
    if (models.size < MAX_GTM_EVENTS) models.set(h.id, structuredClone(model));
  });
  // Other data layers and object data layers.
  snapshots.forEach((s, si) => {
    for (const layer of s.layers ?? []) {
      layer.entries.forEach((e, i) => {
        const page = pageOf(e.time);
        const h = dataLayerHit(
          e,
          `${layer.platform}-${si}-${i}`,
          page,
          pages[page] ?? firstUrl,
          layer.platform,
        );
        if (h) raw.push({ ...h, seq: seq++ });
      });
    }
    for (const pd of s.pageData ?? []) {
      const page = pageOf(s.time);
      raw.push({
        ...pageDataHit(
          pd.platform,
          pd.value,
          s.time,
          `${pd.platform}-${si}`,
          page,
          pages[page] ?? firstUrl,
        ),
        seq: seq++,
      });
    }
  });
  raw.sort(byTime);
  const hits = mergeFanOut(raw);

  const site = registrableDomain(settings.domains?.[0] ?? hostOf(firstUrl));
  const cmp = [...new Set(snapshots.flatMap((s) => s.cmp ?? []))];
  const globals = [...new Set(snapshots.flatMap((s) => s.globals ?? []))];
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
    return (script && parseGtmContainer(id, script.body)) || estimatedContainer(id, hits);
  });
  const primary = containers[0] ?? null;
  const pushes = hits.filter(
    (h) => h.method === 'PUSH' && (h.platform === 'gtm' || h.platform === 'datalayer'),
  );
  const sent = hits.filter((h) => h.route !== 'page' && isTracked(h.platform));
  const referrerOf = (page: number) =>
    snapshots.find((s) => pageOf(s.time) === page && s.referrer !== undefined)?.referrer;
  const gtm: GtmView[] = containers.map((c) => {
    const live = c.tags.filter((t) => !t.paused);
    const events: GtmEventView[] = c.estimated
      ? []
      : pushes.map((hit) => {
          const ctx = {
            event: hit.event,
            model: models.get(hit.id) ?? {},
            pageUrl: pages[hit.page] ?? firstUrl,
            referrer: referrerOf(hit.page),
            containerId: c.id,
          };
          const tags = live
            .map((t) => {
              const fires = tagFiresOn(c, t, ctx);
              const seen = sent.some(
                (h) =>
                  h.page === hit.page &&
                  h.time >= hit.time - 50 &&
                  h.time - hit.time <= ANSWER_MS &&
                  tagMatches(t, h),
              );
              return { index: t.index, fires, seen };
            })
            .filter((x) => x.fires !== 'no');
          return { hit, tags };
        });
    const triggered = new Set(
      events.flatMap((e) => e.tags.filter((t) => t.fires === 'yes').map((t) => t.index)),
    );
    return {
      container: c,
      events,
      tags: live.map((t) => {
        const fired = tagHits(t, hits);
        return {
          ...t,
          hitIds: fired.map((h) => h.id),
          status: tagStatus(t, fired, triggered.has(t.index), consent, valueMissing, lastTime),
        };
      }),
    };
  });

  const plan = settings.plan ? diffPlan(settings.plan, hits) : null;

  // Consent view: the page where the choice happened.
  const choicePage = consent.choice ? pageOf(consent.choice.time) : 0;
  const timeline: TimelineRow[] = hits
    .filter(
      (h) =>
        h.page === choicePage &&
        isTracked(h.platform) &&
        h.route !== 'page' &&
        h.platform !== 'gtag',
    )
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

  const tracked = hits.filter((h) => isTracked(h.platform) && h.route !== 'page');
  const issues = sortIssues([
    ...consentIssues(consent, hits, primary),
    ...attributionIssues(attribution),
    ...piiIssues(hits),
    ...valueIss,
    ...purchaseIdIssues(hits),
    ...duplicateIssues(hits),
    ...planIssues(plan),
    ...sgtmIssues(sgtm),
    ...multipleGa4Issues(hits),
    ...(tracked.length === 0 && globals.length === 0
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
  // Tag managers (Google Tag, Tealium, Adobe Launch) are listed too; GTM has its own tab.
  const listed = hits.filter(
    (h) =>
      h.route !== 'page' && (isTracked(h.platform) || platformDef(h.platform).group === 'tags'),
  );
  const ids2 = [...new Set([...listed.map((h) => h.platform), ...globals.filter(isTracked)])];
  const platforms: PlatformSummary[] = ids2
    .filter((p) => p !== 'gtm')
    .sort((a, b) => platformOrder(a) - platformOrder(b))
    .map((p) => {
      const own = listed.filter((h) => h.platform === p);
      return {
        platform: p,
        events: own.length,
        issues: issues.filter((i) => i.severity !== 'info' && i.data.platform === p).length,
        accounts: [...new Set(own.map((h) => h.account).filter((a): a is string => Boolean(a)))],
        ...(own.length === 0 ? { loadedOnly: true } : {}),
      };
    });

  const tabIssues = (tab: IssueTab) =>
    issues.filter((i) => i.tab === tab && i.severity !== 'info').length;
  const currentUrl = pages.at(-1) ?? firstUrl;

  return {
    site,
    host: hostOf(firstUrl),
    pageUrl: firstUrl,
    currentUrl,
    pages,
    sites: [...new Set(pages.map((u) => registrableDomain(hostOf(u))).filter(Boolean))],
    events,
    hits,
    trackingRequests: new Set(
      tracked
        .concat(hits.filter((h) => h.platform === 'gtm' && h.route !== 'page'))
        .map((h) => h.requestId),
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
