/** One audit from what the page returned (SPEC §4). Pure: no DOM except through `parseHtml`. */
import { botStatuses, robotsFor, type BotStatus, type RobotsFile } from './bots.ts';
import { checkHreflang, type HreflangFacts } from './hreflang.ts';
import {
  indexability,
  searchBotStatuses,
  type Indexability,
  type SearchBotStatus,
} from './indexing.ts';
import {
  COMPRESS_MIN_BYTES,
  SMALL_TARGET_MIN,
  SMALL_TEXT_SHARE,
  imageFindings,
  rate,
  type ImageFindings,
  type LiveFacts,
  type RawHeaders,
} from './live.ts';
import { checkSchema, type SchemaItem } from './schema.ts';
import { renderDiff, needsJsPercent, type RenderDiff } from './diff.ts';
import { extractHtml, type PageFacts } from './extract.ts';
import {
  countsByTab,
  makeIssue,
  score as scoreOf,
  scoreLabel,
  severityCounts,
  sortIssues,
  type Issue,
  type IssueTab,
  type ScoreLabel,
  type SeverityCounts,
} from './issues.ts';
import {
  linkCounts,
  mergeLinkCheck,
  type LinkCheck,
  type LinkCounts,
  type LinkResult,
} from './links.ts';
import { fitDescription, fitTitle, urlLine, siteName, type Fit } from './serp.ts';

/** Half the rendered text missing from the raw HTML makes RAW_TEXT. */
export const RAW_TEXT_MIN = 0.5;

export interface FileInput extends RobotsFile {
  contentType?: string;
}

export interface AnalyzeInput {
  url: string;
  /** Rendered DOM (document.documentElement.outerHTML) as read in the page. */
  renderedHtml: string;
  /** The raw response; null when it could not be fetched. */
  raw: {
    status: number;
    contentType: string;
    text: string;
    xRobotsTag: string | null;
    /** The request for the page URL was redirected (to `finalUrl`). */
    redirected?: boolean;
    finalUrl?: string;
    headers?: RawHeaders;
  } | null;
  robots: FileInput | null;
  llms: FileInput | null;
  /** Internal link results; undefined until the user ran the link check. */
  linkResults?: LinkResult[];
  /** What the page measured live (vitals, images, mobile, sitemap ...); null in tests and old reads. */
  live?: LiveFacts | null;
}

export interface ServerFacts {
  /** HTTP status of the raw request, 0 when it failed. */
  status: number;
  redirected: boolean;
  finalUrl: string;
  https: boolean;
  /** Size of the raw HTML in characters (close enough to bytes for the size check). */
  htmlBytes: number;
  headers: RawHeaders | null;
}

export interface Audit {
  url: string;
  host: string;
  path: string;
  rendered: PageFacts;
  /** null when the raw HTML was not available (failed fetch, not HTML). */
  raw: PageFacts | null;
  diff: RenderDiff | null;
  serp: {
    siteName: string;
    urlLine: string;
    title: Fit | null;
    description: { desktop: Fit; mobile: Fit } | null;
  };
  links: LinkCounts;
  linkCheck: LinkCheck | null;
  bots: BotStatus[];
  /** Bots allowed (also by `*`) and total, for "10/13 allowed". */
  botsAllowed: number;
  robots: { status: number; found: boolean; lineCount: number; sitemaps: string[] };
  llms: 'found' | 'not_found';
  noindex: { meta: boolean; header: boolean };
  /** Googlebot and Bingbot against robots.txt for this path. */
  searchBots: SearchBotStatus[];
  indexability: Indexability;
  /** Every JSON-LD object of the rendered page, checked against Google's rich result rules. */
  schema: SchemaItem[];
  hreflang: HreflangFacts;
  server: ServerFacts;
  live: LiveFacts | null;
  /** Image findings from the live measurement; null without it. */
  images: ImageFindings | null;
  issues: Issue[];
  counts: SeverityCounts;
  byTab: Record<IssueTab, number>;
  score: number;
  label: ScoreLabel;
}

/** "noindex" or "none" as a directive ("noindex, follow", "googlebot: noindex"). */
const hasNoindex = (v: string | null | undefined) =>
  !!v &&
  v
    .toLowerCase()
    .split(/[\s,:]+/)
    .some((t) => t === 'noindex' || t === 'none');

function isHtml(contentType: string): boolean {
  return !contentType || /html|xml/i.test(contentType);
}

/** A URL without hash and trailing slash, host in lower case. */
export function normUrl(s: string): string {
  try {
    const u = new URL(s);
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`;
  } catch {
    return s;
  }
}

/** Compare URLs without hash and trailing slash. */
export const sameUrl = (a: string, b: string) => normUrl(a) === normUrl(b);

/** Anchor texts that say nothing about the target (EN, AZ, RU, TR). */
const WEAK = new Set([
  'click here',
  'here',
  'click',
  'read more',
  'more',
  'learn more',
  'see more',
  'this',
  'link',
  'this link',
  'go',
  'details',
  'more info',
  'continue',
  'continue reading',
  'view more',
  'buraya',
  'bura',
  'buraya klikləyin',
  'klikləyin',
  'ətraflı',
  'daha ətraflı',
  'daha çox',
  'keçid',
  'bax',
  'davamı',
  'davamını oxu',
  'oxu',
  'здесь',
  'тут',
  'подробнее',
  'читать далее',
  'далее',
  'ссылка',
  'buraya tıklayın',
  'tıklayın',
  'devamı',
  'devamını oku',
  'daha fazla',
]);

export function isWeakAnchor(text: string): boolean {
  const t = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    .trim();
  return !!t && WEAK.has(t);
}

/** Pages on the developer's own machine are not expected to use HTTPS. */
function isLocalHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.localhost') ||
    host.endsWith('.test')
  );
}

/** user-scalable=no, or a maximum-scale under 2, stops people from zooming in. */
export function zoomBlocked(viewport: string): boolean {
  const v = viewport.toLowerCase();
  if (/user-scalable\s*=\s*(no|0)\b/.test(v)) return true;
  const max = /maximum-scale\s*=\s*([\d.]+)/.exec(v);
  return !!max && Number(max[1]) < 2;
}

export function analyze(input: AnalyzeInput): Audit {
  const { url } = input;
  const u = new URL(url);
  const rendered = extractHtml(input.renderedHtml, url);
  const rawOk =
    !!input.raw &&
    input.raw.status >= 200 &&
    input.raw.status < 300 &&
    isHtml(input.raw.contentType);
  const raw = rawOk ? extractHtml(input.raw!.text, url) : null;
  const diff = raw ? renderDiff(raw, rendered) : null;

  const robots = robotsFor(input.robots);
  const bots = botStatuses(robots, u.pathname + u.search);
  const llmsFound =
    !!input.llms &&
    input.llms.status === 200 &&
    /text\/plain|markdown/i.test(input.llms.contentType ?? 'text/plain');

  const linkCheck = input.linkResults ? mergeLinkCheck(rendered, input.linkResults) : null;
  const titleFit = rendered.title ? fitTitle(rendered.title) : null;
  const descFit = rendered.description
    ? {
        desktop: fitDescription(rendered.description, 'desktop'),
        mobile: fitDescription(rendered.description, 'mobile'),
      }
    : null;

  const noindex = {
    meta:
      hasNoindex(rendered.robots) ||
      hasNoindex(rendered.googlebot) ||
      hasNoindex(raw?.robots) ||
      hasNoindex(raw?.googlebot),
    header: hasNoindex(input.raw?.xRobotsTag),
  };

  const issues: Issue[] = [];
  const add = (...a: Parameters<typeof makeIssue>) => issues.push(makeIssue(...a));

  // Render
  if (raw && diff) {
    const renderedH1 = rendered.headings.filter((h) => h.level === 1);
    const rawH1 = raw.headings.filter((h) => h.level === 1);
    if (renderedH1.length > 0 && rawH1.length === 0) {
      add(
        'RAW_H1',
        { text: renderedH1[0]!.text },
        renderedH1.map((h) => h.path),
      );
    }
    if (diff.needsJs >= RAW_TEXT_MIN) {
      add('RAW_TEXT', {
        percent: needsJsPercent(diff),
        raw: diff.rawWords,
        rendered: diff.renderedWords,
      });
    }
    const jsTypes = rendered.jsonLd.types.filter((t) => !raw.jsonLd.types.includes(t));
    if (jsTypes.length) {
      add('SCHEMA_JS', { type: jsTypes[0]!, count: jsTypes.length, types: jsTypes.join(', ') });
    }
  }

  // Summary
  if (!rendered.title) add('NO_TITLE');
  if (noindex.meta || noindex.header) {
    add('NOINDEX', { source: noindex.header ? 'header' : 'meta' }, [
      ...(noindex.meta
        ? [`<meta name="robots" content="${rendered.robots ?? raw?.robots ?? ''}">`]
        : []),
      ...(noindex.header ? [`X-Robots-Tag: ${input.raw?.xRobotsTag}`] : []),
    ]);
  }
  if (rendered.canonical && !sameUrl(rendered.canonical, url)) {
    add('CANONICAL_OTHER', { canonical: rendered.canonical }, [rendered.canonical]);
  }
  if (descFit?.desktop.cut) {
    add('DESC_LONG', {
      length: descFit.desktop.length,
      desktop: descFit.desktop.cutAfter,
      mobile: descFit.mobile.cutAfter,
    });
  }
  if (!rendered.description) add('DESC_MISSING');

  // Headings
  const noAlt = rendered.images.filter((i) => i.alt === 'missing');
  if (noAlt.length) {
    add(
      'IMG_ALT',
      {
        count: noAlt.length,
        total: rendered.images.length,
        files: noAlt.map((i) => i.file).join(', '),
      },
      noAlt.map((i) => i.path),
    );
  }
  if (!rendered.og.description) add('OG_DESC');

  // Links (only after the check)
  if (linkCheck) {
    const broken = linkCheck.links.filter((l) => l.kind === 'internal' && l.state === 'broken');
    if (broken.length) {
      add(
        'BROKEN_LINK',
        {
          count: broken.length,
          text: broken[0]!.text,
          href: shortPath(broken[0]!.href, url),
          status: broken[0]!.status ?? 0,
        },
        broken.map((l) => l.href),
      );
    }
  }

  // AI
  const blockedSearch = bots.filter((b) => b.group === 'search' && b.state === 'blocked');
  if (blockedSearch.length) {
    add(
      'AI_SEARCH_BLOCKED',
      {
        bot: blockedSearch[0]!.userAgent,
        count: blockedSearch.length,
        more: blockedSearch.length - 1,
      },
      blockedSearch.map((b) => b.rule ?? b.userAgent),
    );
  }

  // Headings, low
  const h1s = rendered.headings.filter((h) => h.level === 1);
  if (h1s.length > 1)
    add(
      'H1_MULTI',
      { count: h1s.length },
      h1s.map((h) => h.path),
    );
  const skips = rendered.headings.filter(
    (h, i) => i > 0 && h.level - rendered.headings[i - 1]!.level > 1,
  );
  if (skips.length) {
    const first = skips[0]!;
    const prev = rendered.headings[rendered.headings.indexOf(first) - 1]!;
    add(
      'HEADING_SKIP',
      {
        from: prev.level,
        to: first.level,
        text: first.text,
        fix: prev.level + 1,
        count: skips.length,
      },
      skips.map((h) => h.path),
    );
  }

  if (linkCheck) {
    const redirects = linkCheck.links.filter(
      (l) => l.kind === 'internal' && l.state === 'redirect',
    );
    if (redirects.length) {
      const targets = [...new Set(redirects.map((l) => l.target ?? l.href))];
      add(
        'REDIRECT_LINKS',
        { count: redirects.length, targets: targets.join(', ') },
        redirects.map((l) => l.href),
      );
    }
  }
  if (titleFit?.cut) add('TITLE_LONG', { length: titleFit.length, px: titleFit.px });

  // 1.1: indexing, canonical, schema, hreflang, sitemap (Summary)
  const live = input.live ?? null;
  const rawStatus = input.raw?.status ?? 0;
  if (rawStatus >= 400) add('HTTP_ERROR', { status: rawStatus });
  const searchBots = searchBotStatuses(robots, u.pathname + u.search);
  const blockedEngines = searchBots.filter((b) => b.state === 'blocked');
  if (blockedEngines.length) {
    add(
      'ROBOTS_BLOCKED',
      {
        bot: blockedEngines[0]!.userAgent,
        bots: blockedEngines.map((b) => b.userAgent).join(', '),
        count: blockedEngines.length,
      },
      blockedEngines.map((b) => b.rule ?? b.userAgent),
    );
  }
  const canonicalOther = !!rendered.canonical && !sameUrl(rendered.canonical, url);
  if (live?.canonical && canonicalOther) {
    const c = live.canonical;
    if (c.status >= 400)
      add('CANONICAL_BROKEN', { canonical: rendered.canonical!, status: c.status }, [c.url]);
    else if (c.redirected && !sameUrl(c.finalUrl, c.url))
      add('CANONICAL_REDIRECT', { canonical: rendered.canonical!, target: c.finalUrl }, [
        c.url,
        c.finalUrl,
      ]);
  }
  const distinctCanonicals = [...new Set(rendered.canonicals.map(normUrl))];
  if (distinctCanonicals.length > 1)
    add('CANONICAL_MULTI', { count: distinctCanonicals.length }, rendered.canonicals);
  if (rendered.jsonLd.errors) add('SCHEMA_PARSE', { count: rendered.jsonLd.errors });
  const schema = checkSchema(rendered.jsonLd.nodes);
  const incomplete = schema.filter((x) => x.result && x.missing.length);
  if (incomplete.length) {
    add(
      'SCHEMA_REQUIRED',
      {
        type: incomplete[0]!.type,
        field: incomplete[0]!.missing[0]!,
        fields: incomplete[0]!.missing.join(', '),
        count: incomplete.length,
      },
      incomplete.map((x) => `${x.type}: ${x.missing.join(', ')}`),
    );
  }
  const hreflang = checkHreflang(rendered, url, live?.hreflang ?? null);
  if (hreflang.invalid.length)
    add(
      'HREFLANG_INVALID',
      { code: hreflang.invalid[0]!, count: hreflang.invalid.length },
      hreflang.invalid,
    );
  if (hreflang.noReturn.length)
    add(
      'HREFLANG_NO_RETURN',
      { lang: hreflang.noReturn[0]!.lang, count: hreflang.noReturn.length },
      hreflang.noReturn.map((p) => p.url),
    );
  if (rendered.hreflang.length && !hreflang.self) add('HREFLANG_NO_SELF');
  const indexable = !(noindex.meta || noindex.header) && !blockedEngines.length && rawStatus < 400;
  if (live && live.sitemap.found === false && indexable && !canonicalOther)
    add('NOT_IN_SITEMAP', {
      sitemap: live.sitemap.files.find((f) => f.status === 200)?.url ?? '',
    });

  // 1.1: links
  const pageLinks = rendered.links.filter((l) => l.kind !== 'other');
  const noText = pageLinks.filter((l) => l.emptyText);
  if (noText.length)
    add(
      'LINK_NO_TEXT',
      { count: noText.length },
      noText.map((l) => l.path),
    );
  const weak = pageLinks.filter((l) => isWeakAnchor(l.text));
  if (weak.length)
    add(
      'WEAK_ANCHOR',
      { count: weak.length, text: weak[0]!.text },
      weak.map((l) => `"${l.text}" ${l.href}`),
    );
  const internalNofollow = rendered.links.filter((l) => l.kind === 'internal' && l.nofollow);
  if (internalNofollow.length)
    add(
      'INTERNAL_NOFOLLOW',
      { count: internalNofollow.length },
      internalNofollow.map((l) => l.href),
    );
  const https = u.protocol === 'https:';
  const httpLinks = https
    ? rendered.links.filter((l) => l.kind === 'internal' && /^http:\/\//i.test(l.href))
    : [];
  if (httpLinks.length)
    add(
      'HTTP_LINKS',
      { count: httpLinks.length },
      httpLinks.map((l) => l.href),
    );

  // 1.1: speed, server and mobile (Speed tab)
  if (u.protocol === 'http:' && !isLocalHost(u.hostname)) add('NO_HTTPS');
  if (https && rendered.insecure.length)
    add('MIXED_CONTENT', { count: rendered.insecure.length }, rendered.insecure);
  const v = live?.vitals;
  if (v?.lcp != null && rate('lcp', v.lcp) !== 'good')
    add('LCP_SLOW', { ms: Math.round(v.lcp), tag: v.lcpTag ?? '' }, v.lcpPath ? [v.lcpPath] : []);
  if (v?.cls != null && rate('cls', v.cls) !== 'good')
    add('CLS_HIGH', { cls: v.cls.toFixed(2) }, v.clsPaths);
  if (v?.inp != null && rate('inp', v.inp) !== 'good') add('INP_SLOW', { ms: Math.round(v.inp) });
  if (v?.ttfb != null && rate('ttfb', v.ttfb) !== 'good')
    add('TTFB_SLOW', { ms: Math.round(v.ttfb) });
  const images = live ? imageFindings(live.images, live.mobile.dpr) : null;
  if (images) {
    const files = (list: { file: string }[]) => list.map((i) => i.file).join(', ');
    if (images.lazyTop.length)
      add(
        'IMG_LAZY_TOP',
        { count: images.lazyTop.length, files: files(images.lazyTop) },
        images.lazyTop.map((i) => i.path),
      );
    if (images.heavy.length)
      add(
        'IMG_HEAVY',
        {
          count: images.heavy.length,
          file: images.heavy[0]!.file,
          kb: Math.round((images.heavy[0]!.bytes ?? 0) / 1024),
        },
        images.heavy.map((i) => i.path),
      );
    if (images.unsized.length)
      add(
        'IMG_NO_SIZE',
        { count: images.unsized.length, files: files(images.unsized) },
        images.unsized.map((i) => i.path),
      );
    if (images.legacy.length)
      add(
        'IMG_FORMAT',
        { count: images.legacy.length, files: files(images.legacy) },
        images.legacy.map((i) => i.path),
      );
    if (images.oversized.length)
      add(
        'IMG_OVERSIZED',
        {
          count: images.oversized.length,
          file: images.oversized[0]!.file,
          natural: images.oversized[0]!.naturalWidth,
          shown: Math.round(images.oversized[0]!.width),
        },
        images.oversized.map((i) => i.path),
      );
  }
  const htmlBytes = input.raw?.text.length ?? 0;
  const encoding = input.raw?.headers?.contentEncoding ?? null;
  if (input.raw?.headers && rawOk && htmlBytes >= COMPRESS_MIN_BYTES && !encoding)
    add('NO_COMPRESSION', { kb: Math.round(htmlBytes / 1024) });
  const viewport = rendered.viewport;
  if (!viewport || !/width\s*=\s*device-width/i.test(viewport))
    add('VIEWPORT_MISSING', {}, viewport ? [`<meta name="viewport" content="${viewport}">`] : []);
  else if (zoomBlocked(viewport))
    add('VIEWPORT_ZOOM', {}, [`<meta name="viewport" content="${viewport}">`]);
  const m = live?.mobile;
  if (m && m.overflow > 4)
    add('H_SCROLL', { px: Math.round(m.overflow), width: m.viewportWidth }, m.overflowPaths);
  if (m && m.textBlocks && m.smallText >= 5 && m.smallText / m.textBlocks > SMALL_TEXT_SHARE)
    add(
      'SMALL_TEXT',
      { count: m.smallText, percent: Math.round((m.smallText / m.textBlocks) * 100) },
      m.smallTextPaths,
    );
  if (m && m.smallTargets >= SMALL_TARGET_MIN)
    add('TAP_SMALL', { count: m.smallTargets }, m.smallTargetPaths);

  const sorted = sortIssues(issues);
  const value = scoreOf(sorted);
  return {
    url,
    host: u.host,
    path: u.pathname + u.search,
    rendered,
    raw,
    diff,
    serp: {
      siteName: rendered.og.siteName || siteName(url),
      urlLine: urlLine(url),
      title: titleFit,
      description: descFit,
    },
    links: linkCounts(rendered),
    linkCheck,
    bots,
    botsAllowed: bots.filter((b) => b.state !== 'blocked').length,
    robots: {
      status: input.robots?.status ?? 0,
      found: !!robots,
      lineCount: robots?.lineCount ?? 0,
      sitemaps: robots?.sitemaps ?? [],
    },
    llms: llmsFound ? 'found' : 'not_found',
    noindex,
    searchBots,
    indexability: indexability({
      status: rawStatus,
      noindex,
      searchBots,
      canonical: rendered.canonical,
      canonicalOther,
      canonicalCheck: live?.canonical ?? null,
      sitemap: live?.sitemap ?? null,
    }),
    schema,
    hreflang,
    server: {
      status: rawStatus,
      redirected: !!input.raw?.redirected,
      finalUrl: input.raw?.finalUrl ?? url,
      https,
      htmlBytes,
      headers: input.raw?.headers ?? null,
    },
    live,
    images,
    issues: sorted,
    counts: severityCounts(sorted),
    byTab: countsByTab(sorted),
    score: value,
    label: scoreLabel(value),
  };
}

function shortPath(href: string, base: string): string {
  try {
    const h = new URL(href);
    return h.origin === new URL(base).origin ? h.pathname + h.search : href;
  } catch {
    return href;
  }
}
