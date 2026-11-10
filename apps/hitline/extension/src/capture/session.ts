/**
 * One recording session in memory (docs/hitline-SPEC.md §3.1). Nothing is persisted:
 * "Clear" empties it, closing DevTools drops it.
 */
import {
  classifyRequest,
  type Navigation,
  type RawRequest,
  type SessionInput,
  type Snapshot,
} from '@line/core/hitline';

/** Keep only what Hitline can use: tracking requests and GTM containers. */
export function isRelevant(req: RawRequest): boolean {
  return /\/gtm\.js\?/.test(req.url) || classifyRequest(req).length > 0;
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
  version = 0;

  get session(): SessionInput {
    return this.input;
  }

  get empty(): boolean {
    return (
      this.input.requests.length === 0 && this.input.snapshots.every((s) => !s.dataLayer?.length)
    );
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  /** Adds a request once (HAR backfill and live events can overlap). Returns false when skipped. */
  addRequest(req: Omit<RawRequest, 'id'>, key = `${req.time}|${req.method}|${req.url}`): boolean {
    if (this.seen.has(key)) return false;
    const full: RawRequest = { ...req, id: `r${++this.n}` };
    if (!isRelevant(full)) return false;
    this.seen.add(key);
    this.input.requests.push(full);
    this.changed();
    return true;
  }

  addGtmScript(id: string, body: string) {
    if (this.input.gtmScripts.some((s) => s.id === id)) return;
    this.input.gtmScripts.push({ id, body });
    this.changed();
  }

  addNavigation(nav: Navigation) {
    const last = this.input.navigations.at(-1);
    if (last && last.url === nav.url && Math.abs(last.time - nav.time) < 1000) return;
    this.input.navigations.push(nav);
    this.changed();
  }

  addSnapshot(s: Snapshot) {
    this.input.snapshots.push(s);
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
    this.changed();
  }

  clear() {
    this.input = { requests: [], navigations: [], snapshots: [], gtmScripts: [] };
    this.seen.clear();
    this.changed();
  }
}
