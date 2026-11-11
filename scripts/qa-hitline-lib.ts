/**
 * Real-site QA for Hitline (docs/hitline/QA.md): records a browsing session the way the DevTools
 * panel does, by running the panel's own capture code (DevtoolsSource + SessionStore) on top of
 * Chrome DevTools Protocol events instead of chrome.devtools. The result is a SessionInput that
 * the panel can replay (window.__HITLINE_REPLAY__) and that analyze() turns into an audit.
 */
import type { CDPSession, Page } from '@playwright/test';
import type { SessionInput } from '../packages/core/src/hitline/index.ts';
import {
  DevtoolsSource,
  type DevtoolsLike,
  type HarEntryLike,
  type ResourceLike,
} from '../apps/hitline/extension/src/capture/devtools.ts';
import { SessionStore } from '../apps/hitline/extension/src/capture/session.ts';

interface Pending {
  url: string;
  method: string;
  postData?: string;
  wallTime: number;
  headers: { name: string; value: string }[];
  type?: string;
}

export interface Recorder {
  store: SessionStore;
  source: DevtoolsSource;
  session(): SessionInput;
  stop(): Promise<void>;
}

/** Runs DevtoolsSource on a Playwright page through CDP. */
export async function record(page: Page): Promise<Recorder> {
  const cdp: CDPSession = await page.context().newCDPSession(page);
  await cdp.send('Network.enable', { maxPostDataSize: 256 * 1024 });
  const finished = new Set<(e: HarEntryLike) => void>();
  const navigated = new Set<(url: string) => void>();
  const pending = new Map<string, Pending>();
  const scripts = new Map<string, string>();

  cdp.on('Network.requestWillBeSent', (e) => {
    // A redirect reuses the request id: report the first hop as its own entry, like the HAR does.
    const prev = pending.get(e.requestId);
    if (prev && e.redirectResponse) {
      const entry: HarEntryLike = {
        startedDateTime: new Date(prev.wallTime).toISOString(),
        request: {
          method: prev.method,
          url: prev.url,
          postData: prev.postData ? { text: prev.postData } : undefined,
        },
        response: {
          headers: Object.entries(e.redirectResponse.headers).map(([name, value]) => ({
            name,
            value: String(value),
          })),
        },
      };
      for (const fn of finished) fn(entry);
    }
    pending.set(e.requestId, {
      url: e.request.url,
      method: e.request.method,
      postData: e.request.postData,
      wallTime: e.wallTime * 1000,
      headers: [],
      type: e.type,
    });
  });
  cdp.on('Network.responseReceivedExtraInfo', (e) => {
    const p = pending.get(e.requestId);
    if (!p) return;
    for (const [name, value] of Object.entries(e.headers))
      p.headers.push({ name, value: String(value) });
  });
  const done = async (requestId: string) => {
    const p = pending.get(requestId);
    if (!p) return;
    pending.delete(requestId);
    let postData = p.postData;
    if (p.method === 'POST' && postData === undefined) {
      try {
        postData = (await cdp.send('Network.getRequestPostData', { requestId })).postData;
      } catch {
        // no body
      }
    }
    if (p.type === 'Script') scripts.set(p.url, requestId);
    const entry: HarEntryLike = {
      startedDateTime: new Date(p.wallTime).toISOString(),
      request: {
        method: p.method,
        url: p.url,
        postData: postData ? { text: postData } : undefined,
      },
      response: { headers: p.headers },
      getContent: (cb) =>
        void cdp
          .send('Network.getResponseBody', { requestId })
          .then((r) => cb(r.base64Encoded ? null : r.body, ''))
          .catch(() => cb(null, '')),
    };
    for (const fn of finished) fn(entry);
  };
  cdp.on('Network.loadingFinished', (e) => void done(e.requestId));
  cdp.on('Network.loadingFailed', (e) => void done(e.requestId));
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) for (const fn of navigated) fn(f.url());
  });

  const devtools: DevtoolsLike = {
    network: {
      getHAR: (cb) => cb({ entries: [] }),
      onRequestFinished: {
        addListener: (f) => finished.add(f),
        removeListener: (f) => finished.delete(f),
      },
      onNavigated: {
        addListener: (f) => navigated.add(f),
        removeListener: (f) => navigated.delete(f),
      },
    },
    inspectedWindow: {
      eval: (expr, cb) =>
        void page
          .evaluate(expr)
          .then((r) => cb(r))
          .catch((e: unknown) => cb(undefined, e)),
      reload: () => void page.reload(),
      getResources: (cb) =>
        cb(
          [...scripts.keys()].map((url): ResourceLike => ({
            url,
            getContent: (c) =>
              void cdp
                .send('Network.getResponseBody', { requestId: scripts.get(url)! })
                .then((r) => c(r.base64Encoded ? null : r.body, ''))
                .catch(() => c(null, '')),
          })),
        ),
    },
  };
  const store = new SessionStore();
  const source = new DevtoolsSource(store, devtools, { intervalMs: 1000 });
  source.start();
  return {
    store,
    source,
    session: () => JSON.parse(JSON.stringify(store.session)) as SessionInput,
    stop: async () => {
      source.stop();
      await cdp.detach().catch(() => {});
    },
  };
}

/** Clicks the most privacy-preserving choice of a cookie banner, when one is shown. */
export async function declineCookies(page: Page): Promise<string | null> {
  const labels = [
    /^(reject|decline|deny)( all)?$/i,
    /^only (necessary|essential)/i,
    /^(rədd et|imtina|yalnız (zəruri|vacib))/i,
    /^(отклонить|только необходимые)/i,
  ];
  for (const re of labels) {
    const btn = page.getByRole('button', { name: re }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      return re.source;
    }
  }
  return null;
}

export const pause = (page: Page, ms: number) => page.waitForTimeout(ms);
