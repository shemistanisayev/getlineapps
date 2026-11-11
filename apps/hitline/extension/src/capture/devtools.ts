/**
 * Live capture inside the DevTools panel (docs/hitline-SPEC.md §3.1, docs/hitline/PLAN-1.1.md):
 * - network.onRequestFinished for live requests (POST bodies, response headers, gtm.js body)
 * - network.getHAR() once on open, to backfill what happened before the panel opened
 * - inspectedWindow.getResources() for GTM containers that loaded before the panel opened
 * - network.onNavigated for page boundaries; a navigation to an unrelated site starts a new session
 * - inspectedWindow.eval every second for data layers, GTM ids, CMP, platform globals and cookies
 * Everything stays in memory. No request of its own.
 */
import { registrableDomain } from '@line/core/hitline';
import {
  FRESH_INDEX,
  nextIndex,
  probeExpression,
  toSnapshot,
  DATALAYER_TIMER,
  type ProbeIndex,
  type ProbeResult,
} from './probe.ts';
import type { SessionStore } from './session.ts';

/** The parts of a HAR entry Hitline reads. */
export interface HarEntryLike {
  startedDateTime: string;
  request: { method: string; url: string; postData?: { text?: string } };
  response?: { headers?: { name: string; value: string }[] };
  getContent?: (cb: (content: string | null, encoding: string) => void) => void;
}

export interface ResourceLike {
  url: string;
  type?: string;
  getContent(cb: (content: string | null, encoding: string) => void): void;
}

/** The parts of chrome.devtools Hitline uses (typed loosely so tests can pass a fake). */
export interface DevtoolsLike {
  network: {
    getHAR(cb: (har: { entries: HarEntryLike[] }) => void): void;
    onRequestFinished: {
      addListener(fn: (e: HarEntryLike) => void): void;
      removeListener(fn: (e: HarEntryLike) => void): void;
    };
    onNavigated: {
      addListener(fn: (url: string) => void): void;
      removeListener(fn: (url: string) => void): void;
    };
  };
  inspectedWindow: {
    tabId?: number;
    eval(expr: string, cb: (result: unknown, error?: unknown) => void): void;
    reload(opts?: { injectedScript?: string; ignoreCache?: boolean }): void;
    getResources?(cb: (resources: ResourceLike[]) => void): void;
  };
}

export function harToRequest(e: HarEntryLike) {
  return {
    time: Date.parse(e.startedDateTime),
    method: e.request.method,
    url: e.request.url,
    body: e.request.postData?.text,
    responseHeaders: e.response?.headers ?? [],
  };
}

/** GTM container id of a container script: gtm.js or a first-party loader with id=GTM-... */
export function gtmIdOf(url: string): string | null {
  if (/\/ns\.html\?/.test(url)) return null; // the noscript iframe, not the container
  const m = /[?&]id=(GTM-[A-Z0-9]+)/i.exec(url);
  return m ? m[1]!.toUpperCase() : null;
}

export interface SourceOptions {
  /** Own domains from Settings: navigating between them never starts a new session. */
  ownDomains?: () => string[];
  intervalMs?: number;
}

export class DevtoolsSource {
  private timer: ReturnType<typeof setInterval> | null = null;
  private idx: ProbeIndex = { ...FRESH_INDEX };
  private firstLook = true;
  private pageHref = '';
  private lastFacts = '';
  /** Navigation waiting for the new page's referrer to decide whether this is a new site. */
  private pendingNav: { time: number; url: string } | null = null;
  paused = false;

  constructor(
    private store: SessionStore,
    private devtools: DevtoolsLike,
    private opts: SourceOptions = {},
  ) {}

  private onRequest = (e: HarEntryLike) => {
    if (this.paused) return;
    const added = this.store.addRequest(harToRequest(e));
    const id = gtmIdOf(e.request.url);
    if (added && id && e.getContent) {
      e.getContent((content) => {
        if (content?.includes('resource')) this.store.addGtmScript(id, content);
      });
    }
  };

  private onNavigated = (url: string) => {
    if (this.paused) return;
    const time = Date.now();
    this.pendingNav = { time, url };
    this.store.addNavigation({ time, url });
    this.idx = { ...FRESH_INDEX };
    this.firstLook = true;
  };

  start() {
    this.devtools.network.getHAR((har) => {
      for (const e of har.entries ?? []) this.onRequest(e);
      this.store.setReady('har');
    });
    this.devtools.network.onRequestFinished.addListener(this.onRequest);
    this.devtools.network.onNavigated.addListener(this.onNavigated);
    this.readContainers();
    this.poll();
    this.timer = setInterval(() => this.poll(), this.opts.intervalMs ?? 1000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.devtools.network.onRequestFinished.removeListener(this.onRequest);
    this.devtools.network.onNavigated.removeListener(this.onNavigated);
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.store.setPaused(p);
  }

  /**
   * GTM containers already loaded when the panel opened: DevTools keeps every script the page
   * loaded, so its text is read from there (no request).
   */
  private lastRead = 0;

  readContainers(force = true) {
    const now = Date.now();
    if (!force && now - this.lastRead < 10_000) return;
    this.lastRead = now;
    this.devtools.inspectedWindow.getResources?.((resources) => {
      for (const r of resources ?? []) {
        const id = gtmIdOf(r.url);
        if (!id || this.store.hasGtmScript(id)) continue;
        r.getContent((content) => {
          if (content && content.includes('resource')) this.store.addGtmScript(id, content);
        });
      }
    });
  }

  /** "Reload page": reloads with the dataLayer timer injected before any page script. */
  reload() {
    this.devtools.inspectedWindow.reload({ injectedScript: DATALAYER_TIMER });
    this.store.markReloaded();
  }

  /** "Clear": empties the session but keeps the current page as the first navigation. */
  clear() {
    this.store.clear();
    if (this.pageHref) this.store.addNavigation({ time: Date.now(), url: this.pageHref });
  }

  /**
   * A navigation to another site starts a new session, unless the visit continues there:
   * the site is one of your domains, it was already part of this session, or the new page was
   * opened from a page of this session (its referrer). Typing a new address has no referrer.
   */
  private decideNewSite(r: ProbeResult) {
    const nav = this.pendingNav;
    this.pendingNav = null;
    if (!nav) return;
    const site = registrableDomain(r.href);
    const known = new Set(
      this.store.session.navigations
        .filter((n) => n.time < nav.time)
        .map((n) => registrableDomain(n.url))
        .filter(Boolean),
    );
    if (!site || known.size === 0 || known.has(site)) return;
    const own = (this.opts.ownDomains?.() ?? []).map((d) => registrableDomain(d));
    if (own.includes(site)) return;
    const ref = r.referrer ? registrableDomain(r.referrer) : '';
    if (ref && known.has(ref)) return;
    this.store.dropBefore(nav.time);
  }

  poll() {
    if (this.paused) return;
    this.devtools.inspectedWindow.eval(probeExpression(this.idx), (result, error) => {
      if (error || !result || typeof result !== 'object') return;
      const r = result as ProbeResult;
      this.decideNewSite(r);
      if (!this.pageHref || this.store.session.navigations.length === 0) {
        // First look at this page: it started at timeOrigin (before the panel opened).
        this.store.addNavigation({ time: Math.round(r.timeOrigin), url: r.href });
        this.store.setPanelOpenedAfterLoad(Date.now() - r.timeOrigin > 2000);
      }
      if (r.href !== this.pageHref && this.pageHref) this.readContainers();
      this.pageHref = r.href;
      if (r.restarted) this.firstLook = true;
      const facts = JSON.stringify([r.href, r.cookies, r.gtm, r.cmp, r.globals]);
      const changed =
        r.entries.length > 0 ||
        Boolean(r.adobe?.entries.length) ||
        Boolean(r.pageData?.length) ||
        this.firstLook ||
        facts !== this.lastFacts;
      this.lastFacts = facts;
      if (changed) this.store.addSnapshot(toSnapshot(r, this.firstLook));
      // A container id seen in the page without its script: try the page resources again.
      if (r.gtm.some((id) => !this.store.hasGtmScript(id))) this.readContainers(false);
      this.firstLook = false;
      this.idx = nextIndex(this.idx, r);
      this.store.setReady('poll');
    });
  }
}
