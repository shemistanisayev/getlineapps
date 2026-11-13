/**
 * collectSnapshot (docs/rivaline-SPEC.md §4.1). Runs in the page's MAIN world through
 * chrome.scripting.executeScript, so page globals are visible. Self-contained: no imports at run
 * time, plain data out, read only. The rule lists come in as `args` from @line/core/rivaline.
 */
import type { PageSnapshot } from '@line/core/rivaline';

export interface SnapshotArgs {
  globals: string[];
  values: string[];
  /** Of `values`, the ones returned as a list of object keys. */
  keyValues: string[];
  selectors: string[];
}

export function collectSnapshot(args: SnapshotArgs): PageSnapshot {
  const MAX_INLINE = 50;
  const INLINE_HEAD = 300;
  const MAX_RESOURCES = 400;
  // Calls that carry IDs often sit after the first 300 characters of a vendor snippet: keep short
  // excerpts around them too (never whole scripts).
  const ID_CALLS =
    /(fbq\(|ttq\.load\(|pintrk\(|snaptr\(|twq\(|rdt\(|gtag\(|_linkedin_partner_id|\bym\(|setSiteId|posthog\.init\()/g;

  const get = (path: string): unknown => {
    let o: unknown = window;
    for (const key of path.split('.')) {
      if (o === null || o === undefined) return undefined;
      try {
        o = (o as Record<string, unknown>)[key];
      } catch {
        return undefined;
      }
    }
    return o;
  };

  const all = Array.from(document.scripts);
  const scripts = all.map((s) => s.src).filter(Boolean);
  const inline = all
    .filter((s) => !s.src && s.textContent)
    .slice(0, MAX_INLINE)
    .map((s) => {
      const text = s.textContent ?? '';
      const parts = [text.slice(0, INLINE_HEAD)];
      for (const m of text.matchAll(ID_CALLS)) {
        if ((m.index ?? 0) < INLINE_HEAD - 80 || parts.length > 6) continue;
        parts.push(text.slice(m.index, (m.index ?? 0) + 80));
      }
      return parts.join(' … ');
    });

  const entries = performance.getEntriesByType('resource');
  const resources = entries.slice(0, MAX_RESOURCES).map((e) => e.name);

  const globals = args.globals.filter((g) => get(g) !== undefined);

  const values: Record<string, string | string[]> = {};
  for (const path of args.values) {
    const v = get(path);
    if (v === undefined || v === null) continue;
    if (args.keyValues.includes(path)) {
      if (typeof v === 'object') values[path] = Object.keys(v as object).slice(0, 20);
    } else if (['string', 'number'].includes(typeof v)) {
      values[path] = String(v).slice(0, 80);
    }
  }

  const cookies = document.cookie
    .split(';')
    .map((c) => c.split('=')[0]!.trim())
    .filter(Boolean);

  const meta: Record<string, string> = {};
  const metaOf = (sel: string) =>
    (document.querySelector(sel) as HTMLMetaElement | null)?.content?.trim().slice(0, 120);
  const generator = metaOf('meta[name="generator" i]');
  const siteName = metaOf('meta[property="og:site_name"]');
  const appName = metaOf('meta[name="application-name" i]');
  if (generator) meta.generator = generator;
  if (siteName) meta['og:site_name'] = siteName;
  if (appName) meta['application-name'] = appName;

  const links = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel~="preconnect"], link[rel~="dns-prefetch"]',
    ),
  )
    .map((l) => {
      try {
        return new URL(l.href).host;
      } catch {
        return '';
      }
    })
    .filter(Boolean);

  const selectors = args.selectors.filter((s) => {
    try {
      return document.querySelector(s) !== null;
    } catch {
      return false;
    }
  });

  const dl = get('dataLayer');
  const consentCommand =
    Array.isArray(dl) &&
    dl.some((e) => e && typeof e === 'object' && (e as Record<string, unknown>)[0] === 'consent');

  const emailForm =
    document.querySelector('form input[type="email"], form input[name*="email" i]') !== null;

  return {
    url: location.href,
    origin: location.origin,
    title: document.title.slice(0, 200),
    lang: document.documentElement.lang,
    scripts,
    inline,
    resources,
    resourcesFull: entries.length >= 250,
    globals,
    values,
    cookies,
    meta,
    links: [...new Set(links)],
    selectors,
    consentCommand,
    emailForm,
    readyState: document.readyState,
  };
}
