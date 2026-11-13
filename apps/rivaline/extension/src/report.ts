/**
 * Competitor report PDF (docs/rivaline-SPEC.md §8, design/rivaline/Report.dc.html) for
 * @line/report buildLineReport. Every label comes from the UI dictionaries, so the PDF follows
 * the panel language. File name: rivaline-report-<host>-<yyyy-mm-dd>.pdf.
 */
import {
  CATEGORIES,
  type BrandKit,
  type Gap,
  type LibraryLink,
  type Stack,
} from '@line/core/rivaline';
import { contactUrl } from '@line/core/site';
import type {
  ExtraSection,
  KeyValueRow,
  LineReportConfig,
  ReportFonts,
  Section,
  SeverityItem,
} from '@line/report';
import type { Lang, MessageKey, T } from './i18n/index.ts';

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

const one = (t: T, base: string, n: number) =>
  t(`${base}.${n === 1 ? 'one' : 'other'}` as MessageKey, { n });

/** "Advertising" -> "Meta Pixel (418273650912345), TikTok Pixel (C9H3...), ..." (SPEC §8). */
export function stackRows(stack: Stack, t: T): KeyValueRow[] {
  if (!stack.tools.length) return [{ k: t('rep.stack.noneK'), v: t('rep.stack.noneV') }];
  return CATEGORIES.flatMap((c) => {
    const tools = stack.tools.filter((x) => x.category === c);
    if (!tools.length) return [];
    return [
      {
        k: t(`cat.${c}` as MessageKey),
        v: tools.map((x) => (x.ids.length ? `${x.name} (${x.ids.join(', ')})` : x.name)).join(', '),
      },
    ];
  });
}

function gapItem(g: Gap, stack: Stack, t: T): SeverityItem {
  const lead = t(`rep.gap.${g.id}.lead` as MessageKey);
  let text: string;
  if (g.id === 'GAP_SERVER_SIDE') text = one(t, 'rep.gap.GAP_SERVER_SIDE', g.count ?? 0);
  else if (g.id === 'GAP_CONSENT')
    text = stack.adPixels ? t('rep.gap.GAP_CONSENT.text') : t('rep.gap.GAP_CONSENT.analytics');
  else if (g.id === 'GAP_CRM')
    text = g.emailTool
      ? t('rep.gap.GAP_CRM.email', { email: g.emailTool })
      : t('rep.gap.GAP_CRM.text');
  else text = t('rep.gap.GAP_ANALYTICS.text');
  return { level: g.severity, lead, text };
}

export function gapItems(stack: Stack, t: T): SeverityItem[] {
  if (!stack.gaps.length)
    return [{ level: 'low', lead: t('rep.none.lead'), text: t('rep.none.text') }];
  return stack.gaps.map((g) => gapItem(g, stack, t));
}

/** "Fraunces 600 for headings, DM Sans 400 for body. Main button #2F5D46, fully rounded." */
export function brandNote(kit: BrandKit, t: T): string {
  const parts: string[] = [];
  const font = (f: NonNullable<BrandKit['heading']>) =>
    t('rep.brand.font', { family: f.family, weight: f.weight });
  if (kit.heading && kit.body)
    parts.push(t('rep.brand.fonts', { heading: font(kit.heading), body: font(kit.body) }));
  const b = kit.button;
  if (b) {
    const r = parseFloat(b.radius) || 0;
    const shape =
      r >= b.height / 2
        ? t('rep.shape.round')
        : r === 0
          ? t('rep.shape.square')
          : t('rep.shape.radius', { r: b.radius });
    parts.push(t('rep.brand.button', { hex: b.background, shape }));
  }
  return parts.join(' ');
}

export interface ReportInput {
  url: string;
  stack: Stack;
  brand: BrandKit | null;
  /** The four searches (default brand and domain, the Settings country). */
  links: LibraryLink[];
  /** The brand name those searches use. */
  searchBrand: string;
}

export function rivalineReport(
  input: ReportInput,
  t: T,
  lang: Lang,
  fonts: ReportFonts,
  now: Date,
): LineReportConfig {
  const { stack } = input;
  const url = new URL(input.url);
  const page = url.pathname === '/' ? t('rep.home') : url.pathname;

  const brandSection: Section =
    input.brand && input.brand.colors.length
      ? {
          type: 'swatches',
          title: t('rep.brand'),
          colors: input.brand.colors.map((c) => c.hex),
          note: brandNote(input.brand, t) || undefined,
        }
      : { type: 'text', title: t('rep.brand'), text: t('rep.brand.none') };
  const libsSection: Section = {
    type: 'links',
    title: t('rep.libs'),
    rows: input.links.map((l) => ({
      label: t(`lib.${l.id}` as MessageKey),
      linkText: l.query,
      href: l.url,
    })),
  };
  const extras: ExtraSection[] = [{ type: 'columns', columns: [brandSection, libsSection] }];

  return {
    tool: 'rivaline',
    fonts,
    date: now,
    dateLabel: dateLabel(now, lang),
    fileStem: 'rivaline-report',
    eyebrow: t('rep.eyebrow'),
    host: url.host,
    subline: t('rep.subline', { page, brand: input.searchBrand }),
    tiles: [
      { value: stack.summary.tools, label: one(t, 'rep.tile.tools', stack.summary.tools) },
      { value: stack.summary.categories, label: one(t, 'rep.tile.cats', stack.summary.categories) },
      { value: stack.adPixels, label: one(t, 'rep.tile.pixels', stack.adPixels) },
      {
        value: stack.gaps.length,
        label: one(t, 'rep.tile.gaps', stack.gaps.length),
        tone: stack.gaps.length ? 'warning' : 'ok',
      },
    ],
    keyValue: { type: 'kv', title: t('rep.stack'), rows: stackRows(stack, t) },
    severity: { type: 'severity', title: t('rep.gaps'), items: gapItems(stack, t) },
    extras,
    cta: {
      title: t('rep.cta.title'),
      sub: t('rep.cta.sub'),
      label: 'shamistanisayev.com',
      href: contactUrl({ source: 'rivaline', medium: 'extension', campaign: 'pdf_footer' }),
    },
    footer: t('rep.footer'),
    pageLabel: (i: number, n: number) => t('rep.pageOf', { i, n }),
    severityLabels: { high: t('rep.sev.high'), medium: t('rep.sev.medium'), low: t('rep.sev.low') },
  };
}
