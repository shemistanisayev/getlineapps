/**
 * Audit PDF config (docs/serpline-SPEC.md §6, design/serpline/Report.dc.html) for @line/report
 * buildLineReport. Every label comes from the UI dictionaries, so the PDF follows the language.
 * The issue fixes are the Report artboard's own short lines (PLAN decision 9).
 */
import {
  formatBytes,
  formatMetric,
  type Audit,
  type BotOwner,
  type Issue,
} from '@line/core/serpline';
import { contactUrl } from '@line/core/site';
import type { LineReportConfig, ReportFonts, SeverityItem } from '@line/report';
import { joinList, type Lang, type MessageKey, type T } from './i18n/index.ts';
import { en } from './i18n/en.ts';
import { issueFix, issueTitle } from './issues.ts';

const ENGINE: Partial<Record<BotOwner, string>> = {
  openai: 'ChatGPT',
  anthropic: 'Claude',
  perplexity: 'Perplexity',
};

export function dateLabel(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'az' ? 'az-Latn-AZ' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

const has = (k: string): k is MessageKey => k in en;

/** Panel title as a sentence, unless the Report artboard words it differently. */
function lead(i: Issue, t: T): string {
  const many = i.id === 'BROKEN_LINK' && Number(i.params.count) > 1;
  const k = `rep.lead.${i.id}${many ? '.many' : ''}`;
  if (has(k)) return t(k, i.params);
  return `${issueTitle(t, i)}.`;
}

function fix(i: Issue, audit: Audit, t: T): string {
  const p: Record<string, string | number> = { ...i.params };
  if (i.id === 'REDIRECT_LINKS') p.targets = joinList(String(p.targets).split(', '), t);
  if (i.id === 'AI_SEARCH_BLOCKED') {
    const bot = audit.bots.find((b) => b.userAgent === i.params.bot);
    p.engine = (bot && ENGINE[bot.owner]) ?? String(i.params.bot);
  }
  const k = `rep.fix.${i.id}`;
  if (has(k)) return t(k, p);
  // Rules added in 1.1 use the panel's own fix line, as a sentence.
  const line = issueFix(t, i);
  return line.charAt(0).toUpperCase() + line.slice(1);
}

export function issueItems(audit: Audit, t: T): SeverityItem[] {
  if (!audit.issues.length) {
    return [{ level: 'low', lead: t('rep.none.lead'), text: t('rep.none.text') }];
  }
  return audit.issues.map((i) => ({ level: i.severity, lead: lead(i, t), text: fix(i, audit, t) }));
}

/** The "Page" table: title, description, canonical and robots, render, links, AI bots. */
export function pageRows(audit: Audit, t: T) {
  const r = audit.rendered;
  const mobile = audit.serp.description?.mobile;
  const canonical = !r.canonical
    ? t('st.notSet')
    : audit.issues.some((i) => i.id === 'CANONICAL_OTHER')
      ? t('st.canonOther')
      : t('st.canonSelf');
  const robots =
    audit.noindex.meta || audit.noindex.header
      ? 'noindex'
      : (r.robots ?? audit.raw?.robots ?? t('rep.v.noRobots'));

  let render = t('rep.v.noRaw');
  if (audit.diff) {
    const items: string[] = [];
    if (audit.issues.some((i) => i.id === 'RAW_H1')) items.push(t('rep.v.h1'));
    for (const a of audit.diff.addedAll)
      if (a.kind === 'schema') items.push(t('rep.v.schema', { type: a.type }));
    render = `${t('rep.v.words', { raw: audit.diff.rawWords, rendered: audit.diff.renderedWords })}, ${
      items.length ? t('rep.v.addedJs', { items: joinList(items, t) }) : t('rep.v.nothingJs')
    }`;
  }

  const lc = audit.linkCheck;
  const links = lc
    ? t('rep.v.linksChecked', {
        total: audit.links.total,
        internal: lc.checked,
        broken: lc.broken,
        redirects: lc.redirects,
      })
    : t('rep.v.linksUnchecked', { total: audit.links.total, internal: audit.links.internal });

  const blocked = audit.bots.filter((b) => b.state === 'blocked').map((b) => b.userAgent);
  const ai = [
    t('rep.v.bots', { n: audit.botsAllowed, total: audit.bots.length }),
    ...(blocked.length ? [t('rep.v.blocked', { bots: joinList(blocked, t) })] : []),
    audit.llms === 'found' ? t('rep.v.llmsFound') : t('rep.v.llmsMissing'),
  ].join(' ');

  const ix = audit.indexability;
  const notes = ix.checks
    .filter((c) => c.state === 'bad' || c.state === 'warn')
    .map(
      (c) =>
        `${t(`ix.row.${c.id}` as MessageKey)}: ${t(`ix.note.${c.note}` as MessageKey, c.params)}`,
    );
  const index = t('rep.v.index', {
    verdict: t(`ix.verdict.${ix.verdict}`),
    notes: notes.length ? notes.join(', ') : t('ix.note.allowed'),
  });

  const v = audit.live?.vitals;
  const metric = (m: 'lcp' | 'cls' | 'inp', x: number | null | undefined) =>
    x === null || x === undefined ? t('rep.v.notMeasured') : formatMetric(m, x);
  const speed = audit.live
    ? `${t('rep.v.vitals', { lcp: metric('lcp', v?.lcp), cls: metric('cls', v?.cls), inp: metric('inp', v?.inp) })}, ${t('rep.v.weight', { size: formatBytes(audit.live.weight.bytes), n: audit.live.weight.requests })}`
    : t('rep.v.notMeasured');

  const schema = audit.schema.length
    ? t('rep.v.schemaOk', {
        items: audit.schema
          .map((x) =>
            !x.result
              ? x.type
              : x.missing.length
                ? `${x.type} (${t('sc.notEligible').toLowerCase()})`
                : `${x.type} (${t('sc.eligible', { result: x.result })})`,
          )
          .join(', '),
      })
    : t('rep.v.schemaNone');

  return [
    { k: t('rep.k.index'), v: index },
    {
      k: t('rep.k.title'),
      v: r.title ? t('rep.v.title', { title: r.title, n: r.title.length }) : t('rep.v.missing'),
    },
    {
      k: t('rep.k.desc'),
      v: !r.description
        ? t('rep.v.missing')
        : mobile?.cut
          ? t('rep.v.descCut', { n: mobile.length, cut: mobile.cutAfter })
          : t('rep.v.descFits', { n: r.description.length }),
    },
    { k: t('rep.k.canon'), v: `${canonical}, ${robots}` },
    { k: t('rep.k.schema'), v: schema },
    { k: t('rep.k.render'), v: render },
    ...(audit.live ? [{ k: t('rep.k.speed'), v: speed }] : []),
    { k: t('rep.k.links'), v: links },
    { k: t('rep.k.ai'), v: ai },
  ];
}

export function serplineReport(
  audit: Audit,
  t: T,
  lang: Lang,
  fonts: ReportFonts,
  now: Date,
): LineReportConfig {
  const { counts } = audit;
  return {
    tool: 'serpline',
    fonts,
    date: now,
    dateLabel: dateLabel(now, lang),
    fileStem: 'serpline-audit',
    eyebrow: t('rep.eyebrow'),
    host: audit.host,
    subline: t('rep.page', { path: audit.path }),
    tiles: [
      { value: audit.score, suffix: '/100', label: t('rep.tile.score'), tone: 'brand' },
      { value: counts.high, label: t('rep.tile.high'), tone: 'high' },
      { value: counts.medium, label: t('rep.tile.medium'), tone: 'medium' },
      { value: counts.low, label: t('rep.tile.low') },
    ],
    keyValue: { type: 'kv', title: t('rep.pageTitle'), rows: pageRows(audit, t) },
    severity: { type: 'severity', title: t('rep.issues'), items: issueItems(audit, t) },
    cta: {
      title: t('rep.cta.title'),
      sub: t('rep.cta.sub'),
      label: 'shamistanisayev.com',
      href: contactUrl({ source: 'serpline', medium: 'extension', campaign: 'pdf_footer' }),
    },
    footer: t('rep.footer'),
    pageLabel: (i: number, n: number) => t('rep.pageOf', { i, n }),
    severityLabels: { high: t('rep.sev.high'), medium: t('rep.sev.medium'), low: t('rep.sev.low') },
  };
}
