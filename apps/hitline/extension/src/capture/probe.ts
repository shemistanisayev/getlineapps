/**
 * Code the panel runs in the inspected page with chrome.devtools.inspectedWindow.eval
 * (docs/hitline-SPEC.md §3.1, docs/hitline/PLAN-1.1.md). It reads dataLayer and other page data
 * layers, GTM container ids, known CMP and platform globals and the listed cookie names. The only
 * thing it changes is a timer around dataLayer.push (and adobeDataLayer.push) so new pushes keep
 * their real time. Nothing is sent anywhere.
 */
import { PLATFORM_LIST, type DataLayerEntry, type Snapshot } from '@line/core/hitline';

/** Cookie names Hitline may read (§3.1). */
export const COOKIE_NAMES = /^(_ga|_ga_[A-Z0-9]+|_gcl_[a-z]+|_fbp|_fbc|_ttp|FPID)$/;

/** Records the time of every push to a page queue (dataLayer, adobeDataLayer). */
const TIMER_FN = `function hitlineTime(name) {
  var key = '__hitlineTimes_' + name;
  var dl = window[name];
  if (name === 'dataLayer') dl = window.dataLayer = window.dataLayer || [];
  if (!Array.isArray(dl) || dl[key]) return;
  var times = [];
  Object.defineProperty(dl, key, { value: times });
  if (name === 'dataLayer' && !window.__hitlineTimes) Object.defineProperty(window, '__hitlineTimes', { value: times });
  var push = dl.push;
  dl.push = function () {
    var at = dl.length;
    for (var i = 0; i < arguments.length; i++) times[at + i] = Date.now();
    return push.apply(dl, arguments);
  };
}`;

/**
 * Runs before the page's own scripts when the panel reloads the page
 * (inspectedWindow.reload({ injectedScript })): every push keeps its real time from the start.
 */
export const DATALAYER_TIMER = `(function () {
  ${TIMER_FN}
  hitlineTime('dataLayer');
})();`;

const GLOBALS = PLATFORM_LIST.filter((p) => p.globals?.length).map((p) => [p.id, p.globals!]);

export interface ProbeIndex {
  dataLayer: number;
  adobeDataLayer: number;
  /** Fingerprints of digitalData and utag_data, so unchanged objects are not sent again. */
  digitalData: string;
  utagData: string;
}

export const FRESH_INDEX: ProbeIndex = {
  dataLayer: 0,
  adobeDataLayer: 0,
  digitalData: '',
  utagData: '',
};

/** Returns new entries since `idx` plus page facts. Values are made JSON-safe. */
export function probeExpression(idx: ProbeIndex): string {
  return `(function (idx) {
  ${TIMER_FN}
  function elementInfo(el) {
    var text = (el.innerText || el.textContent || el.value || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
    return {
      tag: el.tagName ? el.tagName.toLowerCase() : '',
      id: el.id || '',
      classes: typeof el.className === 'string' ? el.className : '',
      text: text,
      href: el.href ? String(el.href) : ''
    };
  }
  function safe(v, depth) {
    if (depth > 6) return null;
    if (v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'undefined' || typeof v === 'function' || typeof v === 'symbol') return null;
    if (typeof Element !== 'undefined' && v instanceof Element) return elementInfo(v);
    if (typeof Node !== 'undefined' && v instanceof Node) return '[node]';
    if (typeof Window !== 'undefined' && v instanceof Window) return '[window]';
    if (Array.isArray(v) || Object.prototype.toString.call(v) === '[object Arguments]') {
      return Array.prototype.slice.call(v, 0, 200).map(function (x) { return safe(x, depth + 1); });
    }
    var out = {};
    var keys;
    try { keys = Object.keys(v).slice(0, 200); } catch (e) { return null; }
    for (var i = 0; i < keys.length; i++) {
      try { out[keys[i]] = safe(v[keys[i]], depth + 1); } catch (e) { out[keys[i]] = null; }
    }
    return out;
  }
  function read(name, from) {
    var dl = Array.isArray(window[name]) ? window[name] : [];
    var times = dl['__hitlineTimes_' + name] || (name === 'dataLayer' ? window.__hitlineTimes : null) || [];
    var start = from > dl.length ? 0 : from;
    var entries = [];
    for (var i = start; i < dl.length && entries.length < 500; i++) {
      entries.push({ i: i, t: times[i] || 0, v: safe(dl[i], 0) });
    }
    hitlineTime(name);
    return { length: dl.length, restarted: from > dl.length, entries: entries, timed: !!dl['__hitlineTimes_' + name] };
  }
  function fingerprint(v) {
    try { var s = JSON.stringify(safe(v, 0)); return s ? s.length + ':' + s.slice(0, 400) : ''; } catch (e) { return ''; }
  }
  var dl = read('dataLayer', idx.dataLayer);
  var adl = Array.isArray(window.adobeDataLayer) ? read('adobeDataLayer', idx.adobeDataLayer) : null;
  var cmp = [];
  if (window.Cookiebot || window.CookieConsent && window.CookieConsent.consent) cmp.push('Cookiebot');
  if (window.OneTrust || window.OptanonActiveGroups !== undefined) cmp.push('OneTrust');
  if (window.UC_UI || window.usercentrics) cmp.push('Usercentrics');
  if (window.getCkyConsent || window.cookieyes) cmp.push('CookieYes');
  if (window.Didomi) cmp.push('Didomi');
  if (window.cmplz_set_cookie || window.complianz) cmp.push('Complianz');
  if (window._iub && window._iub.cs) cmp.push('iubenda');
  if (window.Termly) cmp.push('Termly');
  if (window.Osano) cmp.push('Osano');
  if (window.__qc || window.__tcfapi && window.quantserve) cmp.push('Quantcast Choice');
  if (window.truste) cmp.push('TrustArc');
  if (window.axeptioSDK || window._axcb) cmp.push('Axeptio');
  var globals = [];
  var known = ${JSON.stringify(GLOBALS)};
  for (var g = 0; g < known.length; g++) {
    for (var k = 0; k < known[g][1].length; k++) {
      if (typeof window[known[g][1][k]] !== 'undefined') { globals.push(known[g][0]); break; }
    }
  }
  var names = ${COOKIE_NAMES.toString()};
  var cookies = {};
  document.cookie.split('; ').forEach(function (c) {
    var eq = c.indexOf('=');
    var k = eq < 0 ? c : c.slice(0, eq);
    if (names.test(k)) cookies[k] = c.slice(eq + 1);
  });
  var gtm = window.google_tag_manager ? Object.keys(window.google_tag_manager).filter(function (k) { return /^GTM-/.test(k); }) : [];
  var pageData = [];
  var dd = window.digitalData && typeof window.digitalData === 'object' ? fingerprint(window.digitalData) : '';
  if (dd && dd !== idx.digitalData) pageData.push({ platform: 'digitaldata', value: safe(window.digitalData, 0), fp: dd });
  var ud = window.utag_data && typeof window.utag_data === 'object' ? fingerprint(window.utag_data) : '';
  if (ud && ud !== idx.utagData) pageData.push({ platform: 'utagdata', value: safe(window.utag_data, 0), fp: ud });
  return {
    href: location.href,
    referrer: document.referrer,
    timeOrigin: performance.timeOrigin,
    readyState: document.readyState,
    loadedAt: Math.round((performance.getEntriesByType('navigation')[0] || {}).loadEventEnd || 0),
    now: Date.now(),
    length: dl.length,
    timed: dl.timed,
    restarted: dl.restarted,
    entries: dl.entries,
    adobe: adl,
    gtm: gtm,
    cmp: cmp,
    globals: globals,
    cookies: cookies,
    pageData: pageData
  };
})(${JSON.stringify(idx)})`;
}

interface RawEntry {
  i: number;
  t: number;
  v: unknown;
}

export interface ProbeResult {
  href: string;
  referrer?: string;
  timeOrigin: number;
  /** document.readyState and loadEventEnd (ms after timeOrigin, 0 while loading). */
  readyState?: string;
  loadedAt?: number;
  now: number;
  length: number;
  timed: boolean;
  restarted: boolean;
  entries: RawEntry[];
  adobe?: { length: number; restarted: boolean; entries: RawEntry[] } | null;
  gtm: string[];
  cmp: string[];
  globals?: string[];
  cookies: Record<string, string>;
  pageData?: { platform: string; value: unknown; fp: string }[];
}

/** Next index after this result. */
export function nextIndex(prev: ProbeIndex, r: ProbeResult): ProbeIndex {
  const fp = (id: string, old: string) => r.pageData?.find((p) => p.platform === id)?.fp ?? old;
  return {
    dataLayer: r.length,
    adobeDataLayer: r.adobe?.length ?? 0,
    digitalData: fp('digitaldata', prev.digitalData),
    utagData: fp('utagdata', prev.utagData),
  };
}

function entriesOf(list: RawEntry[], r: ProbeResult, firstLook: boolean): DataLayerEntry[] {
  return list.map((e) =>
    e.t
      ? { time: e.t, value: e.v, index: e.i }
      : // No recorded time: the page start when it was already there at the first look
        // (consent defaults run first), else the time Hitline read it. Both are estimates.
        {
          time: firstLook ? Math.round(r.timeOrigin) : r.now,
          value: e.v,
          index: e.i,
          approx: true,
        },
  );
}

/** Turns one probe result into a Snapshot. */
export function toSnapshot(r: ProbeResult, firstLook: boolean): Snapshot {
  return {
    time: r.now,
    url: r.href,
    dataLayer: entriesOf(r.entries, r, firstLook),
    gtmIds: r.gtm,
    cmp: r.cmp,
    cookies: r.cookies,
    globals: r.globals ?? [],
    referrer: r.referrer,
    ...(r.adobe?.entries.length
      ? { layers: [{ platform: 'adobedl', entries: entriesOf(r.adobe.entries, r, firstLook) }] }
      : {}),
    ...(r.pageData?.length
      ? { pageData: r.pageData.map((p) => ({ platform: p.platform, value: p.value })) }
      : {}),
  };
}
