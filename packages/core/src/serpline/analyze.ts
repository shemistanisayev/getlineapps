/** One audit from what the page returned (SPEC §4). Pure: no DOM except through `parseHtml`. */
import { botStatuses, robotsFor, type BotStatus, type RobotsFile } from './bots.ts';
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
  raw: { status: number; contentType: string; text: string; xRobotsTag: string | null } | null;
  robots: FileInput | null;
  llms: FileInput | null;
  /** Internal link results; undefined until the user ran the link check. */
  linkResults?: LinkResult[];
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

/** Compare URLs without hash and trailing slash. */
function sameUrl(a: string, b: string): boolean {
  const norm = (s: string) => {
    try {
      const u = new URL(s);
      return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`;
    } catch {
      return s;
    }
  };
  return norm(a) === norm(b);
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
