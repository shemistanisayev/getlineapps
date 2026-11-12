/**
 * Internal link check (docs/serpline-SPEC.md §3.1), run in the checked tab by executeScript.
 * Same-origin requests only, so no host permission: HEAD (GET when HEAD returns 405),
 * redirects followed, 4 at a time, 8 s timeout each, at most 100 URLs (planned by
 * @line/core/serpline planLinkCheck). Self-contained: executeScript serializes the function.
 */
import type { LinkResult } from '@line/core/serpline';

export async function checkLinksInPage(
  urls: string[],
  concurrency: number,
  timeoutMs: number,
  progress?: string,
): Promise<LinkResult[]> {
  let done = 0;
  /** Tells the side panel how many links are checked. */
  function say() {
    if (!progress) return;
    try {
      const api = (
        globalThis as unknown as {
          chrome?: { runtime?: { sendMessage(m: unknown): Promise<unknown> | void } };
        }
      ).chrome;
      void Promise.resolve(
        api?.runtime?.sendMessage({ type: progress, done, total: urls.length }),
      ).catch(() => {});
    } catch {
      /* panel closed */
    }
  }
  let pauseUntil = 0;
  async function waitPause() {
    while (Date.now() < pauseUntil)
      await new Promise((r) => setTimeout(r, pauseUntil - Date.now()));
  }
  async function one(url: string): Promise<LinkResult> {
    const attempt = async (method: 'HEAD' | 'GET') => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        return await fetch(url, {
          method,
          redirect: 'follow',
          cache: 'no-store',
          credentials: 'include',
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };
    try {
      if (new URL(url).origin !== location.origin) throw new Error('not same origin');
      let res = await attempt('HEAD');
      if (res.status === 405) res = await attempt('GET');
      // Rate limited: every worker waits (Retry-After, 2 s by default, at most 10 s), then this URL
      // is asked again, twice at most. A 429 that stays is "not reached", never broken.
      for (let tries = 0; res.status === 429 && tries < 2; tries++) {
        const after = Number(res.headers.get('retry-after'));
        pauseUntil = Date.now() + Math.min(10_000, after > 0 ? after * 1000 : 2000);
        await waitPause();
        res = await attempt('GET');
      }
      return { url, status: res.status, redirected: res.redirected, finalUrl: res.url || url };
    } catch {
      return { url, status: 0, redirected: false, finalUrl: url };
    }
  }

  const out: LinkResult[] = new Array(urls.length);
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      await waitPause();
      out[i] = await one(urls[i]!);
      done++;
      say();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return out;
}
