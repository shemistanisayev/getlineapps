/**
 * Audit PDF config (docs/hitline-SPEC.md §6, docs/hitline/PLAN-1.1.md) for @line/report:
 * full from the panel (Audit), summary from the popup (PopupSummary). Every label comes from
 * the UI dictionaries, so the PDF follows the language setting. Sections that have nothing to say
 * on this site are left out.
 */
import {
  hostOf,
  reportIssues,
  type Audit,
  type Hit,
  type Issue,
  type PopupSummary,
} from '@line/core/hitline';
import { contactUrl } from '@line/core/site';
import type {
  ExtraSection,
  LineReportConfig,
  ReportFonts,
  SeverityItem,
  TableSection,
} from '@line/report';
import { issueText } from './issue-text.ts';
import { joinList, type Lang, type T } from './i18n/index.ts';
import { fmtTime, platformName } from './ui.tsx';

const MAX_ROWS = 40;

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

/** "shop.com/cart" */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname === '/' ? '/' : u.pathname.replace(/\/$/, '')}`;
  } catch {
    return url;
  }
}

/** Where the issue was seen: first evidence time and page. */
function seenAt(i: Issue, hits: Hit[] | undefined, t: T): string {
  if (!hits) return '';
  const h = hits.find((x) => i.evidence.includes(x.id));
  if (!h) return '';
  const n = i.evidence.length;
  return t(n > 1 ? 'report.seenMany' : 'report.seen', { time: fmtTime(h.time, true), n });
}

/** One PDF line per issue (the list is already de-duplicated by reportIssues). */
export function issueItem(i: Issue, t: T, all: Issue[], hits?: Hit[]): SeverityItem {
  const level = i.severity === 'high' ? 'high' : i.severity === 'medium' ? 'medium' : 'low';
  const x = issueText(i, t, all);
  const seen = seenAt(i, hits, t);
  return { level, lead: x.title, text: [x.why, x.fix, seen].filter(Boolean).join(' ') };
}

function common(t: T, lang: Lang, fonts: ReportFonts, now: Date) {
  return {
    tool: 'hitline' as const,
    fonts,
    date: now,
    dateLabel: dateLabel(now, lang),
    fileStem: 'hitline-audit',
    eyebrow: t('report.eyebrow'),
    cta: {
      title: t('report.cta.title'),
      sub: t('report.cta.sub'),
      label: 'shamistanisayev.com',
      href: contactUrl({ source: 'hitline', medium: 'extension', campaign: 'pdf_footer' }),
    },
    footer: t('report.footer'),
    pageLabel: (i: number, n: number) => t('report.page', { i, n }),
    severityLabels: {
      high: t('report.sev.high'),
      medium: t('report.sev.medium'),
      low: t('report.sev.low'),
    },
  };
}

function severity(issues: Issue[], t: T, hits?: Hit[]) {
  const items = issues.map((i) => issueItem(i, t, issues, hits));
  return {
    type: 'severity' as const,
    title: t('report.issues'),
    items: items.length
      ? items
      : [{ level: 'low' as const, lead: t('report.i.none.lead'), text: t('report.i.none.text') }],
  };
}

function counts(issues: Issue[]) {
  return {
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
  };
}

function table(
  title: string,
  columns: TableSection['columns'],
  rows: string[][],
  t: T,
): TableSection | null {
  if (!rows.length) return null;
  return {
    type: 'table',
    title,
    columns,
    rows: rows.slice(0, MAX_ROWS),
    ...(rows.length > MAX_ROWS
      ? { note: t('report.moreRows', { n: rows.length - MAX_ROWS }) }
      : {}),
  };
}

/** Platform | Account ids | Events | How it sends */
function platformsTable(
  platforms: { platform: string; events: number; accounts: string[]; loadedOnly?: boolean }[],
  hits: Hit[],
  t: T,
): TableSection | null {
  return table(
    t('report.platforms'),
    [
      { label: t('report.th.platform'), width: 0.26 },
      { label: t('report.th.ids'), width: 0.38, mono: true },
      { label: t('report.th.events'), width: 0.14 },
      { label: t('report.th.route'), width: 0.22 },
    ],
    platforms.map((p) => {
      const own = hits.filter((h) => h.platform === p.platform && h.route !== 'page');
      const routes = [
        ...new Set(own.map((h) => (h.route === 'sgtm' ? t('route.sgtm') : t('route.browser')))),
      ];
      return [
        platformName(p.platform),
        p.accounts.join(', ') || '-',
        p.loadedOnly ? t('report.loadedOnly') : String(p.events),
        routes.join(', ') || '-',
      ];
    }),
    t,
  );
}

/** Platform | Event | Count | Parameters seen */
function eventsTable(hits: Hit[], t: T): TableSection | null {
  const groups = new Map<
    string,
    { platform: string; event: string; n: number; keys: Set<string> }
  >();
  for (const h of hits) {
    if (h.platform === 'gtm' || h.platform === 'other') continue;
    const k = `${h.platform}|${h.event}`;
    const g = groups.get(k) ?? {
      platform: h.platform,
      event: h.event,
      n: 0,
      keys: new Set<string>(),
    };
    g.n++;
    for (const p of h.params)
      if (!/\[\d+\]\./.test(p.key) || p.key.startsWith('items[0].')) g.keys.add(p.key);
    groups.set(k, g);
  }
  return table(
    t('report.events'),
    [
      { label: t('report.th.platform'), width: 0.2 },
      { label: t('report.th.event'), width: 0.26, mono: true },
      { label: t('report.th.count'), width: 0.1 },
      { label: t('report.th.params'), width: 0.44, mono: true },
    ],
    [...groups.values()].map((g) => {
      const keys = [...g.keys];
      return [
        platformName(g.platform),
        g.event,
        String(g.n),
        keys.length
          ? keys.slice(0, 8).join(', ') + (keys.length > 8 ? ` +${keys.length - 8}` : '')
          : '-',
      ];
    }),
    t,
  );
}

export function hitlineReport(
  audit: Audit,
  t: T,
  lang: Lang,
  fonts: ReportFonts,
  now = new Date(),
): LineReportConfig {
  const issues = reportIssues(audit.issues);
  const c = counts(issues);
  const s = audit.sgtm;
  const names = (ps: string[]) => joinList(ps.map(platformName), t);
  const pages = [...new Set(audit.pages.map(shortUrl))];
  const subline = t(pages.length === 1 ? 'report.pageOne' : 'report.pagesN', {
    n: pages.length,
    pages: pages.slice(0, 4).join(', ') + (pages.length > 4 ? ` +${pages.length - 4}` : ''),
  });

  const rows: { k: string; v: string }[] = [];
  rows.push({
    k: 'GTM',
    v: audit.gtm.length
      ? audit.gtm
          .map((g) => t('report.setup.gtm', { id: g.container.id, n: g.tags.length }))
          .join('; ')
      : t('report.setup.none'),
  });
  const ga4 = audit.platforms.find((p) => p.platform === 'ga4');
  if (ga4?.accounts.length) rows.push({ k: t('report.setup.ga4Key'), v: ga4.accounts.join(', ') });
  rows.push({
    k: t('report.setup.server'),
    v: !s.detected
      ? t('report.setup.noSgtm')
      : s.browserPlatforms.length
        ? t('report.setup.sgtmSplit', {
            server: names(s.serverPlatforms),
            host: s.host ?? '',
            browser: names(s.browserPlatforms),
          })
        : t('report.setup.sgtm', { server: names(s.serverPlatforms), host: s.host ?? '' }),
  });
  const consentIssues = audit.issues.filter((i) => i.tab === 'consent');
  const m = audit.consent.model;
  rows.push({
    k: 'Consent Mode v2',
    v: !m.active
      ? t('report.setup.noConsent')
      : audit.consent.google === 'mismatch'
        ? t('report.setup.consentGoogleBad')
        : consentIssues.length
          ? t('report.setup.consentSplit', {
              platforms: names([...new Set(consentIssues.map((i) => String(i.data.platform)))]),
            })
          : t('report.setup.consentOk'),
  });
  if (m.cmp.length) rows.push({ k: t('report.setup.cmpKey'), v: m.cmp.join(', ') });
  if (audit.plan) {
    rows.push({
      k: t('report.setup.planKey'),
      v: t('report.setup.plan', { match: audit.plan.counts.match, total: audit.plan.rows.length }),
    });
  }

  const extras: (ExtraSection | null)[] = [
    platformsTable(audit.platforms, audit.hits, t),
    eventsTable(audit.events, t),
  ];
  const gtm = audit.gtm.find((g) => !g.container.estimated);
  if (gtm) {
    extras.push(
      table(
        t('report.gtmTags', { id: gtm.container.id }),
        [
          { label: t('gtm.th.tag'), width: 0.3 },
          { label: t('gtm.th.type'), width: 0.18 },
          { label: t('gtm.th.trigger'), width: 0.32, mono: true },
          { label: t('gtm.th.status'), width: 0.2 },
        ],
        gtm.tags.map((tag) => [
          tag.name,
          tag.type,
          tag.trigger || '-',
          t(`gtm.status.${tag.status}`),
        ]),
        t,
      ),
    );
  }
  if (m.active && audit.consent.timeline.length) {
    const status: Record<string, Parameters<T>[0]> = {
      granted: 'ct.status.granted',
      cookieless: 'ct.status.cookieless',
      before_consent: 'consent.before',
      after_reject: 'consent.after',
      mismatch: 'consent.mismatch',
      no_signal: 'consent.noSignal',
      not_loaded: 'ct.status.notLoaded',
      unknown: 'consent.unknown',
    };
    extras.push(
      table(
        t('report.consentTimeline'),
        [
          { label: t('report.th.time'), width: 0.18, mono: true },
          { label: t('report.th.platform'), width: 0.22 },
          { label: t('report.th.event'), width: 0.26, mono: true },
          { label: t('report.th.status'), width: 0.34 },
        ],
        audit.consent.timeline.map((r) => [
          r.time ? fmtTime(r.time, true) : '-',
          platformName(r.platform),
          r.event,
          t(status[r.status] ?? 'consent.unknown'),
        ]),
        t,
      ),
    );
  }
  if (audit.attribution.steps.length > 1) {
    extras.push(
      table(
        t('report.path'),
        [
          { label: '#', width: 0.06 },
          { label: t('report.th.page'), width: 0.52, mono: true },
          { label: t('report.th.finding'), width: 0.42 },
        ],
        audit.attribution.steps.map((st, i) => {
          const b = st.badge;
          const finding =
            b.kind === 'gl_missing'
              ? t('at.badge.glMissing')
              : b.kind === 'referral'
                ? t('at.badge.referral', { domain: b.value })
                : b.kind === 'utm_click'
                  ? t('report.path.campaign')
                  : b.kind === 'gcl_saved'
                    ? t('at.badge.gclSaved')
                    : b.kind === 'source_medium'
                      ? b.value
                      : t('report.path.ok');
          return [String(i + 1), shortUrl(st.page.url), finding];
        }),
        t,
      ),
    );
  }

  return {
    ...common(t, lang, fonts, now),
    host: hostOf(audit.currentUrl) || audit.host,
    subline,
    tiles: [
      { value: audit.platforms.length, label: t('report.tile.platforms') },
      { value: audit.counts.events, label: t('report.tile.events') },
      { value: c.high, label: t('report.tile.high'), tone: 'high' },
      { value: c.medium, label: t('report.tile.medium'), tone: 'medium' },
    ],
    keyValue: { type: 'kv', title: t('report.setup'), rows },
    severity: severity(issues, t, audit.hits),
    extras: extras.filter((x): x is ExtraSection => x !== null),
  };
}

/** Summary from the popup: URLs only, so the PDF says so. */
export function hitlineSummaryReport(
  s: PopupSummary,
  t: T,
  lang: Lang,
  fonts: ReportFonts,
  now = new Date(),
): LineReportConfig {
  const c = counts(s.issues);
  const events = s.platforms.reduce((n, p) => n + p.events, 0);
  const extras: (ExtraSection | null)[] = [
    platformsTable(s.platforms, s.events, t),
    eventsTable(s.events, t),
  ];
  return {
    ...common(t, lang, fonts, now),
    host: s.host,
    subline: t('report.summary', { page: shortUrl(s.url) }),
    tiles: [
      { value: s.platforms.length, label: t('report.tile.platforms') },
      { value: events, label: t('report.tile.requests') },
      { value: c.high, label: t('report.tile.high'), tone: 'high' },
      { value: c.medium, label: t('report.tile.medium'), tone: 'medium' },
    ],
    keyValue: {
      type: 'kv',
      title: t('report.setup'),
      rows: [
        {
          k: t('report.setup.server'),
          v: s.sgtm.detected
            ? t('report.setup.sgtmVia', { host: s.sgtm.host ?? '' })
            : t('report.setup.noSgtm'),
        },
        ...(s.bufferFull ? [{ k: t('report.setup.limitKey'), v: t('popup.bufferFull') }] : []),
      ],
    },
    severity: severity(s.issues, t),
    extras: extras.filter((x): x is ExtraSection => x !== null),
  };
}
