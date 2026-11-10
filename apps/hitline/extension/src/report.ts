/**
 * Audit PDF config (docs/hitline-SPEC.md §6) for @line/report buildLineReport:
 * full from the panel (Audit), summary from the popup (PopupSummary). Every label comes from
 * the UI dictionaries, so the PDF follows the language setting.
 */
import {
  reportIssues,
  type Audit,
  type Issue,
  type Platform,
  type PopupSummary,
} from '@line/core/hitline';
import { contactUrl } from '@line/core/site';
import type { LineReportConfig, ReportFonts, SeverityItem } from '@line/report';
import { joinList, type Lang, type T } from './i18n/index.ts';
import { PLATFORM_NAME } from './ui.tsx';

const PIXEL: Partial<Record<Platform, string>> = { meta: 'Meta Pixel', tiktok: 'TikTok Pixel' };
const pixel = (p: Platform) => PIXEL[p] ?? PLATFORM_NAME[p];

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

/** One PDF line per issue (the list is already de-duplicated by reportIssues). */
export function issueItem(i: Issue, t: T, all: Issue[]): SeverityItem {
  const p = i.data.platform as Platform;
  const level = i.severity === 'high' ? 'high' : i.severity === 'medium' ? 'medium' : 'low';
  const item = (lead: string, text: string): SeverityItem => ({ level, lead, text });
  switch (i.id) {
    case 'CONSENT_BEFORE':
      return item(t('report.i.before.lead', { platform: pixel(p) }), t('report.i.before.text'));
    case 'CONSENT_AFTER_REJECT':
      return item(
        t('report.i.after.lead', { platform: pixel(p) }),
        all.some((x) => x.id === 'CONSENT_BEFORE')
          ? t('report.i.after.same', { platform: PLATFORM_NAME[p] })
          : t('report.i.before.text'),
      );
    case 'UNWANTED_REFERRAL':
      return item(
        t('report.i.referral.lead'),
        t('report.i.referral.text', { host: String(i.data.host) }),
      );
    case 'XDOMAIN_BREAK':
      return item(
        t('report.i.break.lead', { host: String(i.data.host) }),
        t('report.i.break.text'),
      );
    case 'VALUE_MISSING': {
      const missing = i.data.missing as string[];
      const key =
        missing.length > 1
          ? 'report.i.value.both'
          : missing[0] === 'currency'
            ? 'report.i.value.currency'
            : 'report.i.value.value';
      return item(
        t(key, { platform: PLATFORM_NAME[p], event: String(i.data.event) }),
        t('report.i.value.text'),
      );
    }
    case 'PLAN_MISSING': {
      const events = (i.data.events as string[] | undefined) ?? [String(i.data.event)];
      return item(
        t(events.length > 1 ? 'report.i.missing.many' : 'report.i.missing.one', {
          events: joinList(events, t),
        }),
        t('report.i.missing.text'),
      );
    }
    case 'PLAN_PARAMS': {
      const empty = i.data.empty as string[];
      const missing = i.data.missing as string[];
      const event = String(i.data.event);
      return empty.length && !missing.length
        ? item(
            t('report.i.empty.lead', { event, params: joinList(empty, t) }),
            t('report.i.empty.text', { params: joinList(empty, t) }),
          )
        : item(
            t('report.i.params.lead', { event, params: joinList(missing, t) }),
            t('report.i.params.text', { params: joinList(missing, t) }),
          );
    }
    default:
      return item(t('report.i.none.lead'), '');
  }
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

function severity(issues: Issue[], t: T) {
  const items = issues.map((i) => issueItem(i, t, issues));
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

/** Full audit from the DevTools panel. */
export function hitlineReport(
  audit: Audit,
  t: T,
  lang: Lang,
  fonts: ReportFonts,
  now = new Date(),
): LineReportConfig {
  const issues = reportIssues(audit.issues);
  const c = counts(issues);
  const kinds = [...new Set(audit.attribution.steps.map((s) => t(`report.kind.${s.page.kind}`)))];
  const s = audit.sgtm;
  const gtm = audit.gtm.length
    ? audit.gtm
        .map((g) => t('report.setup.gtm', { id: g.container.id, n: g.tags.length }))
        .join('; ')
    : t('report.setup.none');
  const server = !s.detected
    ? t('report.setup.noSgtm')
    : s.browserPlatforms.length
      ? t('report.setup.sgtmSplit', {
          server: joinList(
            s.serverPlatforms.map((p) => PLATFORM_NAME[p]),
            t,
          ),
          host: s.host ?? '',
          browser: joinList(
            s.browserPlatforms.map((p) => PLATFORM_NAME[p]),
            t,
          ),
        })
      : t('report.setup.sgtm', {
          server: joinList(
            s.serverPlatforms.map((p) => PLATFORM_NAME[p]),
            t,
          ),
          host: s.host ?? '',
        });
  const consentIssues = audit.issues.filter((i) => i.tab === 'consent');
  const leaky = joinList(
    [...new Set(consentIssues.map((i) => PLATFORM_NAME[i.data.platform as Platform]))],
    t,
  );
  const m = audit.consent.model;
  const consent = !m.active
    ? t('report.setup.none')
    : audit.consent.google === 'mismatch'
      ? t('report.setup.consentGoogleBad')
      : consentIssues.length
        ? t('report.setup.consentSplit', { platforms: leaky })
        : t('report.setup.consentOk');
  const plan = audit.plan
    ? t('report.setup.plan', { match: audit.plan.counts.match, total: audit.plan.rows.length })
    : t('report.setup.noPlan');
  return {
    ...common(t, lang, fonts, now),
    host: audit.host,
    subline: t('report.pages', { pages: joinList(kinds, t) }),
    tiles: [
      { value: audit.platforms.length, label: t('report.tile.platforms') },
      { value: audit.counts.events, label: t('report.tile.events') },
      { value: c.high, label: t('report.tile.high'), tone: 'high' },
      { value: c.medium, label: t('report.tile.medium'), tone: 'medium' },
    ],
    keyValue: {
      type: 'kv',
      title: t('report.setup'),
      rows: [
        { k: 'GTM', v: gtm },
        { k: t('report.setup.server'), v: server },
        { k: 'Consent Mode v2', v: consent },
        { k: t('report.setup.planKey'), v: plan },
      ],
    },
    severity: severity(issues, t),
  };
}

/** Summary from the popup: URLs only, so the PDF says so and points to DevTools. */
export function hitlineSummaryReport(
  s: PopupSummary,
  t: T,
  lang: Lang,
  fonts: ReportFonts,
  now = new Date(),
): LineReportConfig {
  const c = counts(s.issues);
  const events = s.platforms.reduce((n, p) => n + p.events, 0);
  return {
    ...common(t, lang, fonts, now),
    host: s.host,
    subline: t('report.summary'),
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
          k: t('report.setup.platformsKey'),
          v: s.platforms.map((p) => pixel(p.platform)).join(', ') || t('report.setup.none'),
        },
        {
          k: t('report.setup.server'),
          v: s.sgtm.detected
            ? t('report.setup.sgtmVia', { host: s.sgtm.host ?? '' })
            : t('report.setup.noSgtm'),
        },
        { k: t('report.setup.fullKey'), v: t('report.setup.full') },
      ],
    },
    severity: severity(s.issues, t),
  };
}
