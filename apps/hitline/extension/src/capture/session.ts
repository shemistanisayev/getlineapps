/**
 * One recording session in memory (docs/hitline-SPEC.md §3.1). Nothing is persisted:
 * "Clear" empties it, closing DevTools drops it.
 */
import {
  classifyRequest,
  type ClassifyOptions,
  type Navigation,
  type RawRequest,
  type SessionInput,
  type Snapshot,
} from '@line/core/hitline';

/** GTM container loads (gtm.js or a first-party loader with id=GTM-...). */
const CONTAINER = /[?&]id=GTM-[A-Z0-9]+/i;

/** Keep only what Hitline can use: tracking requests and GTM containers. */
export function isRelevant(req: RawRequest, opts: ClassifyOptions = {}): boolean {
  return CONTAINER.test(req.url) || classifyRequest(req, 0, opts).length > 0;
}

export interface CaptureStatus {
  /** HAR backfill done and the page was read once: "no events" now really means none. */
  ready: boolean;
  paused: boolean;
  /** DevTools opened after the page loaded: requests sent before that are not in the session. */
  openedAfterLoad: boolean;
  /** The page was reloaded from the panel since then. */
  reloaded: boolean;
  /** Time of the last new hit (for the "new events" indicators). */
  lastAdded: number;
}

export class SessionStore {
  private input: Required<SessionInput> = {
    requests: [],
    navigations: [],
    snapshots: [],
    gtmScripts: [],
  };
  private seen = new Set<string>();
  private listeners = new Set<() => void>();
  private n = 0;
  private readyParts = new Set<string>();
  version = 0;
  status: CaptureStatus = {
    ready: false,
    paused: false,
    openedAfterLoad: false,
    reloaded: false,
    lastAdded: 0,
  };
  /** Custom rules and "Other" from Settings: decide what is kept. */
  options: ClassifyOptions = { other: true };

  get session(): SessionInput {
    return this.input;
  }

  get empty(): boolean {
    return (
      this.input.requests.length === 0 &&
      this.input.snapshots.every(
        (s) => !s.dataLayer?.length && !s.layers?.length && !s.pageData?.length,
      )
    );
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(added = false) {
    this.version++;
    if (added) this.status = { ...this.status, lastAdded: Date.now() };
    for (const fn of this.listeners) fn();
  }

  private setStatus(next: Partial<CaptureStatus>) {
    const s = { ...this.status, ...next };
    if (JSON.stringify(s) === JSON.stringify(this.status)) return;
    this.status = s;
    this.changed();
  }

  /** Ready once the HAR backfill and the first page read are both done. */
  setReady(part: 'har' | 'poll') {
    this.readyParts.add(part);
    if (this.readyParts.size >= 2 && !this.status.ready) this.setStatus({ ready: true });
  }

  setPaused(paused: boolean) {
    this.setStatus({ paused });
  }

  setPanelOpenedAfterLoad(v: boolean) {
    if (!this.status.reloaded) this.setStatus({ openedAfterLoad: v });
  }

  markReloaded() {
    this.setStatus({ reloaded: true, openedAfterLoad: false });
  }

  /** Adds a request once (HAR backfill and live events can overlap). Returns false when skipped. */
  addRequest(req: Omit<RawRequest, 'id'>, key = `${req.time}|${req.method}|${req.url}`): boolean {
    if (this.seen.has(key)) return false;
    const full: RawRequest = { ...req, id: `r${++this.n}` };
    if (!isRelevant(full, this.options)) return false;
    this.seen.add(key);
    this.input.requests.push(full);
    this.changed(true);
    return true;
  }

  hasGtmScript(id: string): boolean {
    return this.input.gtmScripts.some((s) => s.id === id);
  }

  addGtmScript(id: string, body: string) {
    if (this.hasGtmScript(id)) return;
    this.input.gtmScripts.push({ id, body });
    this.changed();
  }

  addNavigation(nav: Navigation) {
    // The first page read (page start time) and DevTools' own navigation event (commit time) can
    // both report the same load a few seconds apart: one page, not two.
    const last = this.input.navigations.at(-1);
    if (last && last.url === nav.url && Math.abs(last.time - nav.time) < 10_000) return;
    this.input.navigations.push(nav);
    this.changed();
  }

  addSnapshot(s: Snapshot) {
    this.input.snapshots.push(s);
    const added =
      Boolean(s.dataLayer?.length) || Boolean(s.layers?.length) || Boolean(s.pageData?.length);
    this.changed(added);
  }

  /** New site: keep only what happened from `time` on (GTM container texts stay, they are by id). */
  dropBefore(time: number) {
    this.input = {
      requests: this.input.requests.filter((r) => r.time >= time),
      navigations: this.input.navigations.filter((n) => n.time >= time),
      snapshots: this.input.snapshots.filter((s) => s.time >= time),
      gtmScripts: this.input.gtmScripts,
    };
    this.seen = new Set(this.input.requests.map((r) => `${r.time}|${r.method}|${r.url}`));
    this.status = { ...this.status, openedAfterLoad: false };
    this.changed();
  }

  /** Replaces everything (replay, tests). */
  load(input: SessionInput) {
    this.input = {
      requests: [...input.requests],
      navigations: [...input.navigations],
      snapshots: [...input.snapshots],
      gtmScripts: [...(input.gtmScripts ?? [])],
    };
    this.seen = new Set(input.requests.map((r) => `${r.time}|${r.method}|${r.url}`));
    this.status = { ...this.status, ready: true };
    this.changed();
  }

  clear() {
    this.input = { requests: [], navigations: [], snapshots: [], gtmScripts: [] };
    this.seen.clear();
    this.status = { ...this.status, openedAfterLoad: false };
    this.changed();
  }
}
