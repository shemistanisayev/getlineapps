/**
 * Site analytics for getlineapps.com (docs/line-family-analytics.md).
 *
 * One delegated listener turns clicks, inputs and scrolls into GA4-style dataLayer events.
 * GTM (loaded by consent.ts only after "Accept") forwards every event in EVENTS to GA4.
 * Nothing is pushed until consent is granted, no form text or other personal data is ever sent.
 * Extensions never use this.
 */
import { readConsent } from './consent.ts';

/** Every event the site sends. GTM's trigger and the GA4 docs are generated from this list. */
export const EVENTS = {
  install_click: 'Chrome Web Store button (install or reinstall)',
  contact_click: 'Link to shamistanisayev.com (contact, audit, footer)',
  select_content: 'Link to a tool landing or a free web tool on getlineapps.com',
  outbound_click: 'Any other link that leaves getlineapps.com (GitHub, ad libraries)',
  nav_click: 'In-page jump link (header menu, hero buttons)',
  language_switch: 'EN / AZ switch',
  faq_open: 'FAQ question opened',
  feature_tab_view: 'Feature tab picked on a landing',
  role_filter: 'Role filter on the hub tool cards',
  checkpoint_view: 'Check point picked on the hub example page',
  sample_report_open: 'Sample audit opened (Hitline)',
  sample_download: 'Sample PDF downloaded',
  web_tool_use: 'Free web tool used (SERP preview, ad library finder)',
  section_view: 'A page section was at least half on screen (once per page)',
  scroll_depth: 'Page scrolled to 25, 50, 75 or 90 percent (once each)',
  feedback_submit: 'Uninstall feedback sent',
  feedback_error: 'Uninstall feedback failed (validation or network)',
  cookie_settings_open: 'Cookie settings link in the footer',
} as const;
export type LineEvent = keyof typeof EVENTS;

/** Key events (GA4 conversions). */
export const KEY_EVENTS: LineEvent[] = ['install_click', 'contact_click', 'feedback_submit'];

/**
 * Every event parameter. Each push sets all of them (unused ones to undefined) so no value
 * leaks from one event into the next in GTM's data model.
 * `custom`: register as a GA4 custom dimension (the rest are GA4 built-in dimensions).
 */
export const PARAMS = {
  tool_slug: { custom: true, about: 'Tool the click is about (hitline, serpline, ...)' },
  cta_location: {
    custom: true,
    about: 'Where on the page: header, hero, footer, section id, utm_campaign',
  },
  link_url: { custom: false, about: 'Link URL' },
  link_domain: { custom: false, about: 'Link host' },
  link_text: { custom: false, about: 'Visible link text, max 100 characters' },
  content_type: { custom: true, about: 'tool_landing or web_tool' },
  content_id: { custom: true, about: 'Tool slug or web tool id' },
  language_to: { custom: true, about: 'en or az' },
  section_id: { custom: true, about: 'Section id (features, how, faq, ...)' },
  faq_question: { custom: true, about: 'FAQ question text, max 100 characters' },
  faq_index: { custom: true, about: 'FAQ position, 1 based' },
  tab_id: { custom: true, about: 'Feature tab id' },
  role_id: { custom: true, about: 'Hub role filter id' },
  checkpoint_id: { custom: true, about: 'Hub check point (tool slug)' },
  web_tool: { custom: true, about: 'serp_preview or ad_finder' },
  tool_action: {
    custom: true,
    about: 'edit_title, edit_desc, edit_url, device_mobile, search, open_library, ...',
  },
  tool_item: { custom: true, about: 'Ad library (meta, google, tiktok, linkedin)' },
  file_name: { custom: false, about: 'Downloaded file name' },
  file_extension: { custom: false, about: 'Downloaded file extension' },
  percent_scrolled: { custom: false, about: '25, 50, 75 or 90' },
  feedback_reason: {
    custom: true,
    about: 'Reason picked in the uninstall form (never the message)',
  },
  has_message: { custom: true, about: 'yes or no: the uninstall form had a message' },
  error_type: { custom: true, about: 'validation or network' },
} as const;
export type LineParam = keyof typeof PARAMS;
export type Params = Partial<Record<LineParam, string | number>>;

/** Pushed once before GTM loads; GTM sends it with every event, page_view included. */
export const PAGE_PARAMS = {
  page_type: 'hub, landing, privacy, uninstall or not_found',
  page_locale: 'en, az, tr, ru, ro, uk, pt, nl, es or fr',
  page_tool: 'Tool of the page, or none',
} as const;
export type PageContext = Record<keyof typeof PAGE_PARAMS, string>;

/** Custom DOM event other scripts dispatch: `document.dispatchEvent(new CustomEvent(TRACK_EVENT, { detail }))`. */
export const TRACK_EVENT = 'line:track';
export interface TrackDetail {
  event: LineEvent;
  params?: Params;
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };

const TOOLS = ['hitline', 'serpline', 'rivaline', 'foldline', 'markline'];
/** Path prefixes of the site languages; English has none (apps/site/src/lib/site.ts, LOCALES). */
const SITE_LOCALES = ['az', 'tr', 'ru', 'ro', 'uk', 'pt', 'nl', 'es', 'fr'];
const OWNER_HOST = 'shamistanisayev.com';
const STORE_HOST = 'chromewebstore.google.com';

const clip = (s: string | null | undefined, n = 100) =>
  (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/** page_type, page_locale and page_tool from the path. */
export function pageContext(pathname: string, notFound = false): PageContext {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const page_locale = SITE_LOCALES.includes(parts[0] ?? '') ? parts[0]! : 'en';
  if (page_locale !== 'en') parts.shift();
  const [first = '', second = ''] = parts;
  let page_type = 'not_found';
  let page_tool = 'none';
  if (notFound) page_type = 'not_found';
  else if (!first) page_type = 'hub';
  else if (first === 'privacy') {
    page_type = 'privacy';
    if (TOOLS.includes(second)) page_tool = second;
  } else if (TOOLS.includes(first)) {
    page_tool = first;
    page_type = second === 'uninstalled' ? 'uninstall' : second ? 'not_found' : 'landing';
  }
  return { page_type, page_locale, page_tool };
}

function consentGranted(win: Window): boolean {
  try {
    return readConsent(win.localStorage) === 'granted';
  } catch {
    return false;
  }
}

/** Push one event. Does nothing until analytics consent is granted. */
export function track(event: LineEvent, params: Params = {}, win: Window = window): boolean {
  if (!consentGranted(win)) return false;
  const w = win as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];
  const clean: Record<string, unknown> = { event };
  for (const k of Object.keys(PARAMS)) clean[k] = undefined;
  for (const [k, v] of Object.entries(params)) {
    if (k in PARAMS && v !== undefined && v !== '') clean[k] = v;
  }
  w.dataLayer.push(clean);
  return true;
}

/** Where on the page an element sits: data-track-loc, landmark or section id. */
export function ctaLocation(el: Element): string {
  const tagged = el.closest<HTMLElement>('[data-track-loc]');
  if (tagged) return tagged.dataset.trackLoc ?? '';
  if (el.closest('dialog')) return 'dialog';
  if (el.closest('header')) return 'header';
  if (el.closest('footer')) return 'footer';
  if (el.closest('.hero')) return 'hero';
  const sec = el.closest('section');
  if (sec?.id) return sec.id;
  // Sections without an id: the first class, without the "sec-" prefix ("sec-more" -> "more").
  const cls = [...(sec?.classList ?? [])].find((c) => c !== 'sec' && c !== 'night');
  if (cls) return cls.replace(/^sec-/, '').replace(/^priv$/, 'privacy');
  return 'body';
}

/** The tool a link is about: the store map, a [data-tool] card, the link path or the page. */
function toolFor(el: Element, url: URL | null, ctx: PageContext, stores: Record<string, string>) {
  if (url) {
    for (const [storeUrl, slug] of Object.entries(stores)) {
      if (storeUrl && url.href.startsWith(storeUrl)) return slug;
    }
  }
  const card = el.closest<HTMLElement>('[data-tool]');
  if (card?.dataset.tool && TOOLS.includes(card.dataset.tool)) return card.dataset.tool;
  return ctx.page_tool === 'none' ? undefined : ctx.page_tool;
}

export interface Tracked {
  event: LineEvent;
  params: Params;
}

/** What a click means, or null when it is not worth an event. Pure: no side effects. */
export function classifyClick(
  target: Element,
  loc: Location | URL,
  ctx: PageContext,
  stores: Record<string, string> = {},
): Tracked | null {
  const el = target.closest('a, button, summary');
  if (!el) return null;
  const where = ctaLocation(el);

  if (el.matches('[data-cookie-settings]'))
    return { event: 'cookie_settings_open', params: { cta_location: where } };

  if (el.matches('summary')) {
    const d = el.parentElement;
    if (!(d instanceof HTMLDetailsElement)) return null;
    const opening = !d.open || d.classList.contains('closing');
    if (!opening) return null;
    const items = d.parentElement ? [...d.parentElement.querySelectorAll(':scope > details')] : [];
    return {
      event: 'faq_open',
      params: {
        faq_question: clip(el.textContent),
        faq_index: items.indexOf(d) + 1,
        cta_location: where,
      },
    };
  }

  // Feature tabs (radios behind labels) are counted from their change event in initAnalytics.

  if (el instanceof HTMLButtonElement) {
    if (el.dataset.role) return { event: 'role_filter', params: { role_id: el.dataset.role } };
    if (el.dataset.spot)
      return { event: 'checkpoint_view', params: { checkpoint_id: el.dataset.spot } };
    if (el.dataset.device)
      return {
        event: 'web_tool_use',
        params: { web_tool: 'serp_preview', tool_action: `device_${el.dataset.device}` },
      };
    return null;
  }

  if (!(el instanceof HTMLAnchorElement)) return null;
  const raw = el.getAttribute('href') ?? '';
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw, loc.href);
  } catch {
    return null;
  }
  const link_text = clip(el.textContent) || clip(el.getAttribute('aria-label'));
  const tool_slug = toolFor(el, url, ctx, stores);

  if (el.matches('[data-sample]'))
    return { event: 'sample_report_open', params: { tool_slug, cta_location: where } };
  if (el.hasAttribute('download') || /\.pdf$/i.test(url.pathname)) {
    const file_name = url.pathname.split('/').pop() ?? '';
    return {
      event: 'sample_download',
      params: {
        tool_slug,
        file_name,
        file_extension: file_name.split('.').pop(),
        cta_location: where,
      },
    };
  }
  if (el.dataset.lib)
    return {
      event: 'web_tool_use',
      params: {
        web_tool: 'ad_finder',
        tool_action: 'open_library',
        tool_item: el.dataset.lib,
        link_domain: url.hostname,
      },
    };

  const sameSite = url.origin === new URL(loc.href).origin;
  if (url.hostname === STORE_HOST)
    return {
      event: 'install_click',
      params: { tool_slug, cta_location: where, link_url: url.href, link_text },
    };
  if (url.hostname.replace(/^www\./, '') === OWNER_HOST)
    return {
      event: 'contact_click',
      params: {
        tool_slug,
        cta_location: url.searchParams.get('utm_campaign') || where,
        link_url: url.href,
        link_text,
      },
    };
  if (!sameSite)
    return {
      event: 'outbound_click',
      params: { link_url: url.href, link_domain: url.hostname, link_text, cta_location: where },
    };

  if (el.hasAttribute('hreflang'))
    return {
      event: 'language_switch',
      params: { language_to: el.getAttribute('hreflang') ?? '', cta_location: where },
    };

  const here = new URL(loc.href);
  if (url.pathname === here.pathname && url.hash)
    return {
      event: 'nav_click',
      params: { section_id: url.hash.slice(1), link_text, cta_location: where },
    };

  const target_ctx = pageContext(url.pathname);
  if (target_ctx.page_type === 'landing') {
    const web = url.hash ? url.hash.slice(1) : '';
    return {
      event: 'select_content',
      params: {
        content_type: web ? 'web_tool' : 'tool_landing',
        content_id: web ? `${target_ctx.page_tool}_${web}` : target_ctx.page_tool,
        tool_slug: target_ctx.page_tool,
        link_text,
        cta_location: where,
      },
    };
  }
  return null;
}

/** First edit of a web tool field, or null. */
export function classifyInput(target: Element): Tracked | null {
  if (!(target instanceof HTMLElement)) return null;
  const sp = target.dataset.sp;
  if (sp && ['title', 'desc', 'url'].includes(sp))
    return {
      event: 'web_tool_use',
      params: { web_tool: 'serp_preview', tool_action: `edit_${sp}` },
    };
  if (target.hasAttribute('data-finder-input'))
    return { event: 'web_tool_use', params: { web_tool: 'ad_finder', tool_action: 'search' } };
  return null;
}

export const SCROLL_MARKS = [25, 50, 75, 90];

/** Scroll marks reached for a scroll position. */
export function scrollMarks(scrollTop: number, viewport: number, height: number): number[] {
  const max = height - viewport;
  const pct = max <= 0 ? 100 : ((scrollTop + viewport) / height) * 100;
  return SCROLL_MARKS.filter((m) => pct >= m);
}

export interface AnalyticsOptions {
  doc?: Document;
  /** Store URL to tool slug, from tools.json. */
  stores?: Record<string, string>;
  notFound?: boolean;
}

/** Push the page context and start listening. Call once per page, after the consent script. */
export function initAnalytics({
  doc = document,
  stores = {},
  notFound = false,
}: AnalyticsOptions = {}) {
  const win = doc.defaultView as DataLayerWindow | null;
  if (!win) return;
  const flagged = win as DataLayerWindow & { __lineAnalytics?: boolean };
  if (flagged.__lineAnalytics) return; // once per page
  flagged.__lineAnalytics = true;
  const ctx = pageContext(win.location.pathname, notFound);
  win.dataLayer = win.dataLayer ?? [];
  const dl = win.dataLayer;
  dl.push({ ...ctx });
  // The same context as a gtag('set') command, so the Google tag adds it to every hit,
  // page_view included. GTM reads gtag commands only as an Arguments object.
  (function set(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    dl.push(arguments);
  })('set', { ...ctx });

  const send = (t: Tracked | null) => {
    if (t) track(t.event, t.params, win);
  };

  // Clicks: capture phase, so handlers that stop the event (FAQ, sample dialog) do not hide it.
  doc.addEventListener(
    'click',
    (e) => {
      if (e.target instanceof Element) send(classifyClick(e.target, win.location, ctx, stores));
    },
    true,
  );

  // Feature tabs are radios behind labels: keyboard changes count too.
  doc.addEventListener('change', (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.matches('input.tabs-in') && t.checked)
      send({ event: 'feature_tab_view', params: { tab_id: t.id.replace(/^tb-/, '') } });
  });

  // Web tool inputs: once per field per page.
  const edited = new Set<string>();
  doc.addEventListener('input', (e) => {
    if (!(e.target instanceof Element)) return;
    const t = classifyInput(e.target);
    const key = t ? `${t.params.web_tool}:${t.params.tool_action}` : '';
    if (!t || edited.has(key)) return;
    edited.add(key);
    send(t);
  });

  // Other scripts (uninstall form) report through a DOM event.
  doc.addEventListener(TRACK_EVENT, (e) => {
    const d = (e as CustomEvent<TrackDetail>).detail;
    if (d?.event && d.event in EVENTS) track(d.event, d.params ?? {}, win);
  });

  // Section views: once each, when half of the section, or half of the screen for tall sections, is visible.
  if (typeof IntersectionObserver !== 'undefined') {
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const id = (en.target as HTMLElement).id;
          const need = Math.min(en.boundingClientRect.height, win.innerHeight) / 2;
          if (!en.isIntersecting || seen.has(id) || en.intersectionRect.height < need) continue;
          if (!track('section_view', { section_id: id }, win)) continue;
          seen.add(id);
          io.unobserve(en.target);
        }
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
    );
    doc.querySelectorAll('section[id]').forEach((s) => io.observe(s));
  }

  // Scroll depth: 25, 50, 75, 90, once each.
  const reached = new Set<number>();
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const root = doc.documentElement;
    for (const m of scrollMarks(win.scrollY, win.innerHeight, root.scrollHeight)) {
      if (reached.has(m)) continue;
      if (track('scroll_depth', { percent_scrolled: m }, win)) reached.add(m);
    }
  };
  win.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      win.requestAnimationFrame(onScroll);
    },
    { passive: true },
  );
}
