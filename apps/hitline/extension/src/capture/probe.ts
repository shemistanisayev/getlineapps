/**
 * Code the panel runs in the inspected page with chrome.devtools.inspectedWindow.eval
 * (docs/hitline-SPEC.md §3.1). It only reads: dataLayer entries, GTM container ids, known CMP
 * globals and the listed cookie names. Nothing is sent anywhere.
 */
import type { DataLayerEntry, Snapshot } from '@line/core/hitline';

/** Cookie names Hitline may read (§3.1). */
export const COOKIE_NAMES = /^(_ga|_ga_[A-Z0-9]+|_gcl_[a-z]+|_fbp|_fbc|_ttp|FPID)$/;

/**
 * Runs before the page's own scripts when the panel reloads the page
 * (inspectedWindow.reload({ injectedScript })): records the time of every dataLayer push,
 * so consent updates and hits keep their real order.
 */
export const DATALAYER_TIMER = `(function () {
  if (window.__hitlineTimes) return;
  var times = [];
  Object.defineProperty(window, '__hitlineTimes', { value: times });
  var dl = (window.dataLayer = window.dataLayer || []);
  var push = dl.push;
  dl.push = function () {
    var at = dl.length;
    for (var i = 0; i < arguments.length; i++) times[at + i] = Date.now();
    return push.apply(dl, arguments);
  };
})();`;

/** Returns entries from index `from` plus page facts. Values are made JSON-safe. */
export function probeExpression(from: number): string {
  return `(function (from) {
  function safe(v, depth) {
    if (depth > 6) return null;
    if (v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'undefined' || typeof v === 'function' || typeof v === 'symbol') return null;
    if (typeof Element !== 'undefined' && v instanceof Element) return '[element]';
    if (Array.isArray(v) || Object.prototype.toString.call(v) === '[object Arguments]') {
      return Array.prototype.slice.call(v, 0, 200).map(function (x) { return safe(x, depth + 1); });
    }
    var out = {};
    var keys = Object.keys(v).slice(0, 200);
    for (var i = 0; i < keys.length; i++) out[keys[i]] = safe(v[keys[i]], depth + 1);
    return out;
  }
  var dl = Array.isArray(window.dataLayer) ? window.dataLayer : [];
  var times = window.__hitlineTimes || [];
  var start = from > dl.length ? 0 : from;
  var entries = [];
  for (var i = start; i < dl.length && entries.length < 500; i++) {
    entries.push({ i: i, t: times[i] || 0, v: safe(dl[i], 0) });
  }
  var cmp = [];
  if (window.Cookiebot || window.CookieConsent && window.CookieConsent.consent) cmp.push('Cookiebot');
  if (window.OneTrust || window.OptanonActiveGroups !== undefined) cmp.push('OneTrust');
  if (window.UC_UI || window.usercentrics) cmp.push('Usercentrics');
  if (window.getCkyConsent || window.cookieyes) cmp.push('CookieYes');
  if (window.Didomi) cmp.push('Didomi');
  if (window.cmplz_set_cookie || window.complianz) cmp.push('Complianz');
  if (window._iub && window._iub.cs) cmp.push('iubenda');
  var names = ${COOKIE_NAMES.toString()};
  var cookies = {};
  document.cookie.split('; ').forEach(function (c) {
    var eq = c.indexOf('=');
    var k = eq < 0 ? c : c.slice(0, eq);
    if (names.test(k)) cookies[k] = c.slice(eq + 1);
  });
  var gtm = window.google_tag_manager ? Object.keys(window.google_tag_manager).filter(function (k) { return /^GTM-/.test(k); }) : [];
  return {
    href: location.href,
    timeOrigin: performance.timeOrigin,
    now: Date.now(),
    length: dl.length,
    timed: !!window.__hitlineTimes,
    restarted: from > dl.length,
    entries: entries,
    gtm: gtm,
    cmp: cmp,
    cookies: cookies
  };
})(${Number(from) || 0})`;
}

export interface ProbeResult {
  href: string;
  timeOrigin: number;
  now: number;
  length: number;
  timed: boolean;
  restarted: boolean;
  entries: { i: number; t: number; v: unknown }[];
  gtm: string[];
  cmp: string[];
  cookies: Record<string, string>;
}

/**
 * Turns one probe result into a Snapshot. Entries without a recorded push time get the page start
 * when they were already there at the first look (consent defaults run first), else the probe time.
 */
export function toSnapshot(r: ProbeResult, firstLook: boolean): Snapshot {
  const dataLayer: DataLayerEntry[] = r.entries.map((e) => ({
    time: e.t || (firstLook ? Math.round(r.timeOrigin) : r.now),
    value: e.v,
  }));
  return {
    time: r.now,
    url: r.href,
    dataLayer,
    gtmIds: r.gtm,
    cmp: r.cmp,
    cookies: r.cookies,
  };
}
