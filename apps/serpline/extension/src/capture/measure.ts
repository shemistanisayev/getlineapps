/**
 * Live measurement (docs/serpline-SPEC.md §3.3), run in the checked tab by executeScript right
 * after readPage. It reads what only the live page knows (Core Web Vitals, request sizes, image
 * and layout sizes) and makes a few same-origin requests: the sitemap, the canonical target and
 * the hreflang alternates. No host permission, nothing leaves the browser.
 *
 * Self-contained: executeScript serializes the function, so every helper lives inside it. The CSS
 * path helper repeats @line/core/serpline cssPath, so paths match the ones the panel uses.
 */
import type { LiveFacts } from '@line/core/serpline';

export interface MeasureArgs {
  /** Sitemap URLs from robots.txt; empty means "try /sitemap.xml". */
  sitemaps: string[];
  canonical: string | null;
  hreflang: { lang: string; href: string }[];
  /** Message type for progress (see messages.ts). */
  progress?: string;
}

export async function measurePage(args: MeasureArgs): Promise<LiveFacts> {
  // At most 8 sitemap files and 10 hreflang alternates per check, 10 s each.
  const TIMEOUT = 10000;
  const SITEMAP_CAP = 20 * 1024 * 1024;
  const HTML_CAP = 3 * 1024 * 1024;
  const MAX_FILES = 8;
  const MAX_ALTERNATES = 10;
  const SIMPLE_ID = /^[A-Za-z][\w-]*$/;
  const w = window as unknown as { __serplineSince?: number };
  // Requests Serpline made itself (raw HTML, robots.txt, link checks) start after this time.
  const since = w.__serplineSince ?? Infinity;

  function cssPath(el: Element): string {
    const steps: string[] = [];
    let node: Element | null = el;
    while (node && node.tagName.toUpperCase() !== 'HTML') {
      const tag = node.tagName.toLowerCase();
      if (node.id && SIMPLE_ID.test(node.id)) {
        steps.unshift(`${tag}#${node.id}`);
        break;
      }
      if (tag === 'body') {
        steps.unshift('body');
        break;
      }
      const parent: Element | null = node.parentElement;
      if (!parent) {
        steps.unshift(tag);
        break;
      }
      const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      steps.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag);
      node = parent;
    }
    return steps.join(' > ');
  }

  function norm(s: string): string {
    try {
      const u = new URL(s, location.href);
      return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`;
    } catch {
      return s;
    }
  }

  function fileOf(src: string): string {
    try {
      return decodeURIComponent(new URL(src).pathname.split('/').filter(Boolean).pop() ?? src);
    } catch {
      return src;
    }
  }

  function typeFromUrl(url: string): string | null {
    let p = url;
    try {
      p = new URL(url).pathname;
    } catch {
      /* keep */
    }
    const ext = /\.([a-z0-9]+)$/i.exec(p)?.[1]?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      avif: 'image/avif',
      svg: 'image/svg+xml',
    };
    return map[ext] ?? null;
  }

  function say(step: string) {
    if (!args.progress) return;
    try {
      const api = (
        globalThis as unknown as {
          chrome?: { runtime?: { sendMessage(m: unknown): Promise<unknown> | void } };
        }
      ).chrome;
      void Promise.resolve(api?.runtime?.sendMessage({ type: args.progress, step })).catch(
        () => {},
      );
    } catch {
      /* panel closed */
    }
  }

  async function request(url: string, method: 'GET' | 'HEAD' = 'GET') {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
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
  }

  /** Buffered performance entries of one type (empty when the browser does not support it). */
  function observe(type: string, extra: Record<string, unknown> = {}): Promise<PerformanceEntry[]> {
    return new Promise((resolve) => {
      const out: PerformanceEntry[] = [];
      try {
        const po = new PerformanceObserver((list) => out.push(...list.getEntries()));
        po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
        setTimeout(() => {
          out.push(...po.takeRecords());
          po.disconnect();
          resolve(out);
        }, 120);
      } catch {
        resolve(out);
      }
    });
  }

  // ---- Core Web Vitals -------------------------------------------------------------------
  async function vitals(): Promise<LiveFacts['vitals']> {
    const nav = performance.getEntriesByType('navigation')[0] as
      (PerformanceNavigationTiming & { activationStart?: number }) | undefined;
    const start = nav?.activationStart ?? 0;
    const [lcpE, clsE, evE, visE] = await Promise.all([
      observe('largest-contentful-paint'),
      observe('layout-shift'),
      observe('event', { durationThreshold: 16 }),
      observe('visibility-state'),
    ]);

    type Lcp = PerformanceEntry & {
      element?: Element | null;
      url?: string;
      renderTime?: number;
      loadTime?: number;
    };
    const last = lcpE.at(-1) as Lcp | undefined;
    const lcpTime = last ? (last.renderTime || last.loadTime || last.startTime) - start : null;
    const el = last?.element && last.element.isConnected ? last.element : null;

    type Shift = PerformanceEntry & {
      value: number;
      hadRecentInput: boolean;
      sources?: { node?: Node | null }[];
    };
    let max = 0;
    let cur = 0;
    let first = 0;
    let prev = 0;
    const movers = new Map<Element, number>();
    for (const e of clsE as Shift[]) {
      if (e.hadRecentInput) continue;
      if (cur && e.startTime - prev < 1000 && e.startTime - first < 5000) cur += e.value;
      else {
        cur = e.value;
        first = e.startTime;
      }
      prev = e.startTime;
      max = Math.max(max, cur);
      for (const s of e.sources ?? []) {
        const n = s.node;
        if (n && n.nodeType === 1 && (n as Element).isConnected)
          movers.set(n as Element, (movers.get(n as Element) ?? 0) + e.value);
      }
    }
    let clsSupported: boolean;
    try {
      clsSupported = PerformanceObserver.supportedEntryTypes.includes('layout-shift');
    } catch {
      clsSupported = false;
    }

    type Ev = PerformanceEntry & { interactionId?: number };
    const byId = new Map<number, number>();
    for (const e of evE as Ev[]) {
      if (!e.interactionId) continue;
      byId.set(e.interactionId, Math.max(byId.get(e.interactionId) ?? 0, e.duration));
    }
    const durations = [...byId.values()].sort((a, b) => b - a);
    const inp = durations.length ? durations[Math.floor(durations.length / 50)]! : null;

    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    const loadEnd = nav?.loadEventEnd || performance.now();
    const hidden =
      document.visibilityState === 'hidden' ||
      visE.some((v) => v.name === 'hidden' && v.startTime < loadEnd);

    return {
      lcp: lcpTime !== null ? Math.max(0, lcpTime) : null,
      lcpPath: el ? cssPath(el) : null,
      lcpTag: el ? el.tagName.toLowerCase() : null,
      lcpUrl: last?.url || null,
      cls: clsSupported ? Math.round(max * 1000) / 1000 : null,
      clsPaths: [...movers.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([e]) => cssPath(e)),
      inp,
      fcp: fcp ? Math.max(0, fcp.startTime - start) : null,
      ttfb: nav ? Math.max(0, nav.responseStart - start) : null,
      // No paint entries at all means Chrome did not paint the page in front (a background tab).
      hiddenAtLoad: !last && (hidden || !fcp),
    };
  }

  // ---- Requests and images ---------------------------------------------------------------
  const resources = (
    performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  ).filter((e) => e.startTime < since);
  const byName = new Map(resources.map((e) => [e.name, e]));

  function weight(): LiveFacts['weight'] {
    const kinds = ['document', 'script', 'css', 'image', 'font', 'other'] as const;
    const byKind = Object.fromEntries(
      kinds.map((k) => [k, { requests: 0, bytes: 0 }]),
    ) as LiveFacts['weight']['byKind'];
    let bytes = 0;
    let unknownSize = 0;
    const nav = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    const all: PerformanceResourceTiming[] = [...(nav ? [nav] : []), ...resources];
    for (const e of all) {
      const n = e.name.split(/[?#]/)[0]!.toLowerCase();
      const kind: (typeof kinds)[number] =
        e.entryType === 'navigation'
          ? 'document'
          : /\.(woff2?|ttf|otf|eot)$/.test(n)
            ? 'font'
            : e.initiatorType === 'img' ||
                e.initiatorType === 'image' ||
                /\.(png|jpe?g|gif|webp|avif|svg|ico)$/.test(n)
              ? 'image'
              : e.initiatorType === 'script' || /\.m?js$/.test(n)
                ? 'script'
                : /\.css$/.test(n) || e.initiatorType === 'css'
                  ? 'css'
                  : 'other';
      const size = e.encodedBodySize || e.transferSize || 0;
      byKind[kind].requests++;
      byKind[kind].bytes += size;
      bytes += size;
      if (!size) {
        try {
          if (new URL(e.name).origin !== location.origin) unknownSize++;
        } catch {
          /* ignore */
        }
      }
    }
    return { requests: all.length, bytes, byKind, unknownSize };
  }

  function images(): LiveFacts['images'] {
    const fold = window.innerHeight;
    return Array.from(document.images)
      .slice(0, 300)
      .filter((img) => !img.closest('[data-serpline-overlay]'))
      .map((img) => {
        const r = img.getBoundingClientRect();
        const src = img.currentSrc || img.src || '';
        const cs = getComputedStyle(img);
        const top = r.top + window.scrollY;
        const entry = byName.get(src) as
          (PerformanceResourceTiming & { contentType?: string }) | undefined;
        const bytes = entry ? entry.encodedBodySize || entry.transferSize || null : null;
        return {
          path: cssPath(img),
          src,
          file: fileOf(src),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: Math.round(r.width),
          height: Math.round(r.height),
          sized:
            (img.hasAttribute('width') && img.hasAttribute('height')) ||
            (!!cs.aspectRatio && cs.aspectRatio !== 'auto'),
          loading: img.getAttribute('loading')?.toLowerCase() ?? null,
          aboveFold: r.width > 0 && top < fold,
          bytes,
          type: entry?.contentType || typeFromUrl(src),
        };
      });
  }

  // ---- Mobile layout ---------------------------------------------------------------------
  function mobile(): LiveFacts['mobile'] {
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const overflow = Math.max(0, document.documentElement.scrollWidth - vw);
    const all = Array.from(document.body?.querySelectorAll('*') ?? []).slice(0, 6000);
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const overflowPaths: string[] = [];
    if (overflow > 4) {
      for (const el of all) {
        if (overflowPaths.length >= 5) break;
        const r = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        if (r.width > 0 && r.right > vw + 4 && (!parent || parent.right <= vw + 4))
          overflowPaths.push(cssPath(el));
      }
    }

    let textBlocks = 0;
    let smallText = 0;
    const smallTextPaths: string[] = [];
    for (const el of all) {
      const tag = el.tagName.toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'SVG') continue;
      const own = Array.from(el.childNodes).some(
        (n) => n.nodeType === 3 && /[\p{L}\p{N}]{2}/u.test(n.nodeValue ?? ''),
      );
      if (!own || !visible(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') continue;
      textBlocks++;
      if (parseFloat(cs.fontSize) < 12) {
        smallText++;
        if (smallTextPaths.length < 8) smallTextPaths.push(cssPath(el));
      }
    }

    // WCAG 2.5.8: a target under 24 x 24 px passes when a 24 px circle on its center touches no
    // other target and no other small target's circle (the spacing exception).
    const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"]';
    const boxes: { el: Element; r: DOMRect; small: boolean }[] = [];
    for (const el of Array.from(document.querySelectorAll(sel)).slice(0, 1500)) {
      if (el.closest('[data-serpline-overlay]')) continue;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      // A link inside a sentence is exempt (WCAG 2.5.8).
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') {
        const parentText = (el.parentElement?.textContent ?? '').trim().length;
        if (parentText > (el.textContent ?? '').trim().length + 1) continue;
      }
      // A target inside another target (an icon in a button) is the same target.
      if (boxes.some((b) => b.el.contains(el))) continue;
      boxes.push({ el, r, small: r.width < 24 || r.height < 24 });
    }
    const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const distToRect = (p: { x: number; y: number }, r: DOMRect) =>
      Math.hypot(
        Math.max(r.left - p.x, 0, p.x - r.right),
        Math.max(r.top - p.y, 0, p.y - r.bottom),
      );
    const targets = boxes.length;
    let smallTargets = 0;
    const smallTargetPaths: string[] = [];
    for (const b of boxes) {
      if (!b.small) continue;
      const c = center(b.r);
      const crowded = boxes.some((o) => {
        if (o === b) return false;
        // Quick skip for targets far away.
        if (Math.abs(o.r.top - b.r.top) > 200 && Math.abs(o.r.bottom - b.r.bottom) > 200)
          return false;
        if (distToRect(c, o.r) < 12) return true;
        if (!o.small) return false;
        const oc = center(o.r);
        return Math.hypot(oc.x - c.x, oc.y - c.y) < 24;
      });
      if (!crowded) continue;
      smallTargets++;
      if (smallTargetPaths.length < 8) smallTargetPaths.push(cssPath(b.el));
    }

    return {
      viewportWidth: vw,
      dpr: window.devicePixelRatio || 1,
      overflow,
      overflowPaths,
      smallText,
      textBlocks,
      smallTextPaths,
      smallTargets,
      targets,
      smallTargetPaths,
    };
  }

  // ---- Same-origin requests: sitemap, canonical, hreflang ------------------------------
  async function readText(res: Response, url: string, cap: number): Promise<string> {
    if (/\.gz($|\?)/i.test(url)) {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf[0] === 0x1f && buf[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
        const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
        return (await new Response(stream).text()).slice(0, cap);
      }
      return new TextDecoder().decode(buf).slice(0, cap);
    }
    return (await res.text()).slice(0, cap);
  }

  async function sitemap(): Promise<LiveFacts['sitemap']> {
    const source = args.sitemaps.length ? ('robots' as const) : ('default' as const);
    const queue = args.sitemaps.length ? [...args.sitemaps] : [location.origin + '/sitemap.xml'];
    const want = new Set([location.href, ...(args.canonical ? [args.canonical] : [])].map(norm));
    const files: LiveFacts['sitemap']['files'] = [];
    const seen = new Set<string>();
    let found: boolean | null = null;
    let fetched = 0;
    while (queue.length && fetched < MAX_FILES && found !== true) {
      let abs: URL;
      try {
        abs = new URL(queue.shift()!, location.href);
      } catch {
        continue;
      }
      if (seen.has(abs.href)) continue;
      seen.add(abs.href);
      if (abs.origin !== location.origin) {
        files.push({ url: abs.href, status: -1, kind: 'other', urls: 0 });
        continue;
      }
      fetched++;
      try {
        const res = await request(abs.href);
        if (res.status !== 200) {
          files.push({ url: abs.href, status: res.status, kind: 'other', urls: 0 });
          continue;
        }
        const text = await readText(res, abs.href, SITEMAP_CAP);
        const kind = /<sitemapindex[\s>]/i.test(text)
          ? ('index' as const)
          : /<urlset[\s>]/i.test(text)
            ? ('urlset' as const)
            : ('other' as const);
        const locs = [
          ...text.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/loc>/gi),
        ].map((m) => m[1]!.replace(/&amp;/g, '&').trim());
        files.push({ url: abs.href, status: 200, kind, urls: locs.length });
        if (kind === 'index') queue.push(...locs);
        else if (kind === 'urlset') {
          if (locs.some((l) => want.has(norm(l)))) found = true;
          else if (found === null) found = false;
        }
      } catch {
        files.push({ url: abs.href, status: 0, kind: 'other', urls: 0 });
      }
    }
    const complete = found === true || queue.length === 0;
    return { source, files, found: complete ? found : found === true ? true : null, complete };
  }

  async function urlStatus(url: string) {
    try {
      let res = await request(url, 'HEAD');
      if (res.status === 405) res = await request(url);
      return { url, status: res.status, redirected: res.redirected, finalUrl: res.url || url };
    } catch {
      return { url, status: 0, redirected: false, finalUrl: url };
    }
  }

  async function canonical(): Promise<LiveFacts['canonical']> {
    const c = args.canonical;
    if (!c) return null;
    try {
      const u = new URL(c, location.href);
      if (u.origin !== location.origin || norm(u.href) === norm(location.href)) return null;
      return await urlStatus(u.href);
    } catch {
      return null;
    }
  }

  async function hreflang(): Promise<LiveFacts['hreflang']> {
    const self = norm(location.href);
    const targets: { lang: string; href: string }[] = [];
    for (const h of args.hreflang) {
      try {
        const u = new URL(h.href, location.href);
        if (u.origin !== location.origin || norm(u.href) === self) continue;
        if (targets.some((t) => norm(t.href) === norm(u.href))) continue;
        targets.push({ lang: h.lang, href: u.href });
      } catch {
        /* invalid URL */
      }
      if (targets.length >= MAX_ALTERNATES) break;
    }
    return Promise.all(
      targets.map(async (t) => {
        try {
          const res = await request(t.href);
          const base = res.url || t.href;
          let linksBack: boolean | null = null;
          if (res.status === 200) {
            const doc = new DOMParser().parseFromString(
              (await res.text()).slice(0, HTML_CAP),
              'text/html',
            );
            linksBack = Array.from(doc.querySelectorAll('link[rel][hreflang][href]')).some((l) => {
              try {
                return norm(new URL(l.getAttribute('href') ?? '', base).href) === self;
              } catch {
                return false;
              }
            });
          }
          return {
            url: t.href,
            lang: t.lang,
            status: res.status,
            redirected: res.redirected,
            finalUrl: base,
            linksBack,
          };
        } catch {
          return {
            url: t.href,
            lang: t.lang,
            status: 0,
            redirected: false,
            finalUrl: t.href,
            linksBack: null,
          };
        }
      }),
    );
  }

  const local = { weight: weight(), images: images(), mobile: mobile() };
  const [v, sm, can, alt] = await Promise.all([vitals(), sitemap(), canonical(), hreflang()]);
  say('live');
  return { vitals: v, ...local, sitemap: sm, canonical: can, hreflang: alt };
}
