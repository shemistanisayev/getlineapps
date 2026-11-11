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
): Promise<LinkResult[]> {
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
      out[i] = await one(urls[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return out;
}
