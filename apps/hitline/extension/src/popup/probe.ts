/**
 * Popup summary input (docs/hitline-SPEC.md §3.1): one chrome.scripting.executeScript on the active
 * tab, allowed by activeTab. It reads resource URLs with their start times, dataLayer consent and
 * config commands, GTM ids, CMP globals and the listed cookie names. Nothing is sent anywhere.
 */
import { PLATFORM_LIST, type PopupProbe } from '@line/core/hitline';

/** [platform id, page globals] pairs, passed into the page as an argument. */
export const POPUP_GLOBALS: [string, string[]][] = PLATFORM_LIST.filter(
  (p) => p.globals?.length,
).map((p) => [p.id, p.globals!]);

/** Runs inside the page. Must stay self-contained: executeScript serializes the function. */
export function popupProbe(known: [string, string[]][] = []): PopupProbe {
  const toArray = (v: unknown): unknown[] | null => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object' && Object.prototype.toString.call(v) === '[object Arguments]') {
      return Array.prototype.slice.call(v);
    }
    return null;
  };
  const plain = (v: unknown, depth = 0): unknown => {
    if (depth > 4 || v === null || typeof v !== 'object') {
      return typeof v === 'function' || typeof v === 'symbol' ? null : v;
    }
    const arr = toArray(v);
    if (arr) return arr.slice(0, 50).map((x) => plain(x, depth + 1));
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).slice(0, 50)) {
      out[k] = plain((v as Record<string, unknown>)[k], depth + 1);
    }
    return out;
  };
  const w = window as unknown as Record<string, unknown>;
  const dl = Array.isArray(w.dataLayer) ? (w.dataLayer as unknown[]) : [];
  // Only gtag commands matter here (consent, config); event pushes are not needed for the summary.
  const commands = dl
    .map((e) => toArray(e))
    .filter((c): c is unknown[] => !!c && (c[0] === 'consent' || c[0] === 'config'))
    .slice(0, 100)
    .map((c) => plain(c));
  let serverContainerUrl: string | undefined;
  for (const c of commands as unknown[][]) {
    const opts = c[2] as { server_container_url?: unknown } | undefined;
    if (c[0] === 'config' && opts && typeof opts.server_container_url === 'string') {
      serverContainerUrl = opts.server_container_url;
    }
  }
  const cmp: string[] = [];
  if (w.Cookiebot) cmp.push('Cookiebot');
  if (w.OneTrust || w.OptanonActiveGroups !== undefined) cmp.push('OneTrust');
  if (w.UC_UI || w.usercentrics) cmp.push('Usercentrics');
  if (w.getCkyConsent || w.cookieyes) cmp.push('CookieYes');
  if (w.Didomi) cmp.push('Didomi');
  if (w.cmplz_set_cookie || w.complianz) cmp.push('Complianz');
  if (w._iub) cmp.push('iubenda');
  const names = /^(_ga|_ga_[A-Z0-9]+|_gcl_[a-z]+|_fbp|_fbc|_ttp|FPID)$/;
  const cookies: Record<string, string> = {};
  for (const c of document.cookie.split('; ')) {
    const eq = c.indexOf('=');
    const k = eq < 0 ? c : c.slice(0, eq);
    if (names.test(k)) cookies[k] = c.slice(eq + 1);
  }
  const gtm = w.google_tag_manager ? Object.keys(w.google_tag_manager as object) : [];
  const globals = known
    .filter(([, names]) => names.some((n) => typeof w[n] !== 'undefined'))
    .map(([id]) => id);
  const entries = performance.getEntriesByType('resource');
  return {
    url: location.href,
    timeOrigin: performance.timeOrigin,
    globals,
    // Chrome keeps 250 resource entries unless the page asks for more: later requests are not listed.
    bufferFull: entries.length >= 250,
    resources: entries.map((r) => ({ name: r.name, startTime: Math.round(r.startTime) })),
    dataLayer: commands,
    dataLayerLength: dl.length,
    gtmIds: gtm.filter((k) => /^GTM-/.test(k)),
    cmp,
    cookies,
    serverContainerUrl,
  };
}

/** Pages Chrome does not let extensions read (§3.1 "can't read this page"). */
export function isRestricted(url: string | undefined): boolean {
  if (!url) return true;
  return (
    /^(chrome|edge|brave|opera|vivaldi|about|devtools|view-source|chrome-extension|chrome-search):/i.test(
      url,
    ) ||
    /^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)/i.test(url) ||
    /^https:\/\/microsoftedge\.microsoft\.com\/addons/i.test(url)
  );
}

export type ProbeState =
  | { kind: 'loading'; url?: string }
  | { kind: 'restricted'; url?: string }
  | { kind: 'ready'; probe: PopupProbe; tabId?: number };

declare global {
  interface Window {
    /** Tests and store screenshots: a probe (or "restricted") instead of the active tab. */
    __HITLINE_POPUP__?: PopupProbe | 'restricted';
  }
}

/** URL of the active tab (shown while the page is read). */
export async function activeUrl(): Promise<string | undefined> {
  if (window.__HITLINE_POPUP__) {
    return window.__HITLINE_POPUP__ === 'restricted' ? undefined : window.__HITLINE_POPUP__.url;
  }
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.url;
}

export async function loadProbe(): Promise<ProbeState> {
  if (window.__HITLINE_POPUP__) {
    return window.__HITLINE_POPUP__ === 'restricted'
      ? { kind: 'restricted' }
      : { kind: 'ready', probe: window.__HITLINE_POPUP__, tabId: 1 };
  }
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || isRestricted(tab.url)) return { kind: 'restricted', url: tab?.url };
  try {
    const [res] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: popupProbe,
      args: [POPUP_GLOBALS],
    });
    const probe = res?.result as PopupProbe | undefined;
    return probe ? { kind: 'ready', probe, tabId: tab.id } : { kind: 'restricted', url: tab.url };
  } catch {
    // file:// without access, error pages, PDF viewer and similar.
    return { kind: 'restricted', url: tab.url };
  }
}
