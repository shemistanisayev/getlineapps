/**
 * Live capture inside the DevTools panel (docs/hitline-SPEC.md §3.1):
 * - network.onRequestFinished for live requests (POST bodies, response headers, gtm.js body)
 * - network.getHAR() once on open, to backfill what happened before the panel opened
 * - network.onNavigated for page boundaries
 * - inspectedWindow.eval every second for dataLayer, GTM ids, CMP and the listed cookies
 * Everything stays in memory. No request of its own.
 */
import { probeExpression, toSnapshot, DATALAYER_TIMER, type ProbeResult } from './probe.ts';
import type { SessionStore } from './session.ts';

/** The parts of a HAR entry Hitline reads. */
export interface HarEntryLike {
  startedDateTime: string;
  request: { method: string; url: string; postData?: { text?: string } };
  response?: { headers?: { name: string; value: string }[] };
  getContent?: (cb: (content: string | null, encoding: string) => void) => void;
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
    eval(expr: string, cb: (result: unknown, error?: unknown) => void): void;
    reload(opts?: { injectedScript?: string; ignoreCache?: boolean }): void;
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

function gtmIdOf(url: string): string | null {
  const m = /\/gtm\.js\?(?:.*&)?id=(GTM-[A-Z0-9]+)/i.exec(url);
  return m ? m[1]! : null;
}

export class DevtoolsSource {
  private timer: ReturnType<typeof setInterval> | null = null;
  private dlIndex = 0;
  private firstLook = true;
  private pageHref = '';
  private lastFacts = '';

  constructor(
    private store: SessionStore,
    private devtools: DevtoolsLike,
    private intervalMs = 1000,
  ) {}

  private onRequest = (e: HarEntryLike) => {
    const added = this.store.addRequest(harToRequest(e));
    const id = gtmIdOf(e.request.url);
    if (added && id && e.getContent) {
      e.getContent((content) => {
        if (content) this.store.addGtmScript(id, content);
      });
    }
  };

  private onNavigated = (url: string) => {
    this.store.addNavigation({ time: Date.now(), url });
    this.dlIndex = 0;
    this.firstLook = true;
  };

  start() {
    this.devtools.network.getHAR((har) => {
      for (const e of har.entries ?? []) this.onRequest(e);
    });
    this.devtools.network.onRequestFinished.addListener(this.onRequest);
    this.devtools.network.onNavigated.addListener(this.onNavigated);
    this.poll();
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.devtools.network.onRequestFinished.removeListener(this.onRequest);
    this.devtools.network.onNavigated.removeListener(this.onNavigated);
  }

  /** "Reload page": reloads with the dataLayer timer injected before any page script. */
  reload() {
    this.devtools.inspectedWindow.reload({ injectedScript: DATALAYER_TIMER });
  }

  /** "Clear": empties the session but keeps the current page as the first navigation. */
  clear() {
    this.store.clear();
    if (this.pageHref) this.store.addNavigation({ time: Date.now(), url: this.pageHref });
  }

  poll() {
    this.devtools.inspectedWindow.eval(probeExpression(this.dlIndex), (result, error) => {
      if (error || !result || typeof result !== 'object') return;
      const r = result as ProbeResult;
      if (!this.pageHref || this.store.session.navigations.length === 0) {
        // First look at this page: it started at timeOrigin (before the panel opened).
        this.store.addNavigation({ time: Math.round(r.timeOrigin), url: r.href });
      }
      this.pageHref = r.href;
      if (r.restarted) this.firstLook = true;
      const facts = JSON.stringify([r.href, r.cookies, r.gtm, r.cmp]);
      const changed = r.entries.length > 0 || this.firstLook || facts !== this.lastFacts;
      this.lastFacts = facts;
      if (changed) this.store.addSnapshot(toSnapshot(r, this.firstLook));
      this.firstLook = false;
      this.dlIndex = r.length;
    });
  }
}
