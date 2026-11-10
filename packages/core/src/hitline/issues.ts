/** Issue rules (docs/hitline-SPEC.md §4.6): one list shared by popup, panel and PDF. */
import type { AttributionResult } from './attribution.ts';
import { hitConsentStatus, MARKETING, type ConsentModel } from './consent.ts';
import type { GtmContainer } from './gtm.ts';
import type { PlanResult } from './plan.ts';
import type { SgtmResult } from './sgtm.ts';
import type { Hit, Issue, IssueId, IssueTab, Platform, Severity } from './types.ts';

export const ISSUE_META: Record<IssueId, { severity: Severity; tab: IssueTab }> = {
  CONSENT_BEFORE: { severity: 'high', tab: 'consent' },
  CONSENT_AFTER_REJECT: { severity: 'high', tab: 'consent' },
  UNWANTED_REFERRAL: { severity: 'high', tab: 'attribution' },
  XDOMAIN_BREAK: { severity: 'high', tab: 'attribution' },
  VALUE_MISSING: { severity: 'medium', tab: 'events' },
  PLAN_MISSING: { severity: 'medium', tab: 'plan' },
  PLAN_PARAMS: { severity: 'medium', tab: 'plan' },
  BROWSER_ONLY: { severity: 'info', tab: 'gtm' },
  NO_TRACKING: { severity: 'info', tab: 'events' },
};

function issue(id: IssueId, key: string, data: Issue['data'], evidence: string[] = []): Issue {
  return { id, ...ISSUE_META[id], key: `${id}:${key}`, data, evidence };
}

/** Events that need value and currency, per platform (§4.6 VALUE_MISSING). */
export const VALUE_EVENTS: Partial<Record<Platform, string[]>> = {
  meta: ['AddToCart', 'Purchase', 'InitiateCheckout'],
  tiktok: ['AddToCart', 'CompletePayment'],
  ga4: [
    'add_to_cart',
    'remove_from_cart',
    'view_cart',
    'view_item',
    'begin_checkout',
    'add_shipping_info',
    'add_payment_info',
    'purchase',
    'refund',
  ],
};

function hasValue(hit: Hit, key: string): boolean {
  return hit.params.some((p) => p.key === key && p.value.trim() !== '');
}

export function valueIssues(hits: Hit[]): Issue[] {
  const out = new Map<string, Issue>();
  for (const h of hits) {
    if (!VALUE_EVENTS[h.platform]?.includes(h.event)) continue;
    const missing = ['value', 'currency'].filter((k) => !hasValue(h, k));
    if (missing.length === 0) continue;
    const key = `${h.platform}:${h.event}`;
    const prev = out.get(`VALUE_MISSING:${key}`);
    if (prev) prev.evidence.push(h.id);
    else {
      const i = issue('VALUE_MISSING', key, { platform: h.platform, event: h.event, missing }, [
        h.id,
      ]);
      out.set(i.key, i);
    }
  }
  return [...out.values()];
}

/** GTM tags that send this hit: the exact event tag, else the platform's base tag. */
export function tagsFor(container: GtmContainer | null, hit: Hit): string[] {
  if (!container) return [];
  const exact = container.tags.filter(
    (t) => t.platform === hit.platform && t.event === hit.event && !t.base,
  );
  if (exact.length) return exact.map((t) => t.name);
  return container.tags.filter((t) => t.platform === hit.platform && t.base).map((t) => t.name);
}

export function consentIssues(
  consent: ConsentModel,
  hits: Hit[],
  container: GtmContainer | null,
): Issue[] {
  const out = new Map<string, Issue>();
  for (const h of hits) {
    if (![...MARKETING, 'hotjar'].includes(h.platform)) continue;
    const s = hitConsentStatus(consent, h);
    const id: IssueId | null =
      s === 'before_consent'
        ? 'CONSENT_BEFORE'
        : s === 'after_reject'
          ? 'CONSENT_AFTER_REJECT'
          : null;
    if (!id) continue;
    const key = `${id}:${h.platform}`;
    const prev = out.get(key);
    const tags = tagsFor(container, h);
    if (prev) {
      prev.evidence.push(h.id);
      const list = prev.data.tags as string[];
      for (const t of tags) if (!list.includes(t)) list.push(t);
    } else {
      out.set(key, issue(id, h.platform, { platform: h.platform, event: h.event, tags }, [h.id]));
    }
  }
  return [...out.values()];
}

export function attributionIssues(a: AttributionResult): Issue[] {
  if (!a.campaign) return [];
  const out: Issue[] = [];
  const referralDomains = new Set(a.referrals.map((r) => r.domain));
  for (const r of a.referrals) {
    if (out.some((i) => i.data.domain === r.domain)) continue;
    out.push(
      issue('UNWANTED_REFERRAL', r.domain, { host: r.host, domain: r.domain, page: r.page }),
    );
  }
  for (const b of a.breaks) {
    // The referral issue already names cross-domain measurement in its fix.
    if ([...referralDomains].some((d) => b.host === d || b.host.endsWith(`.${d}`))) continue;
    if (out.some((i) => i.id === 'XDOMAIN_BREAK' && i.data.host === b.host)) continue;
    out.push(issue('XDOMAIN_BREAK', b.host, { host: b.host, page: b.page }));
  }
  return out;
}

export function planIssues(plan: PlanResult | null): Issue[] {
  if (!plan) return [];
  const out: Issue[] = [];
  for (const r of plan.rows) {
    const key = `${r.row.platform}:${r.row.event}`;
    const base = { platform: r.row.platform, event: r.row.event };
    if (r.status === 'missing') {
      out.push(issue('PLAN_MISSING', key, { ...base, arrived: r.arrived.kind }));
    } else if (r.status === 'wrong' && r.arrived.kind === 'params') {
      out.push(
        issue(
          'PLAN_PARAMS',
          key,
          {
            ...base,
            missing: r.arrived.missing,
            empty: r.arrived.empty,
            present: r.arrived.present,
          },
          r.hitIds,
        ),
      );
    }
  }
  return out;
}

export function sgtmIssues(s: SgtmResult): Issue[] {
  if (!s.detected || s.browserPlatforms.length === 0) return [];
  return [
    issue('BROWSER_ONLY', 'sgtm', {
      server: s.serverPlatforms,
      browser: s.browserPlatforms,
      host: s.host ?? '',
    }),
  ];
}

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, info: 2 };

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/**
 * Issues for the PDF and the popup's top list (docs/hitline/PLAN.md, decision 3):
 * no info items, PLAN_PARAMS dropped when VALUE_MISSING covers the same event,
 * all PLAN_MISSING merged into one item with `events`.
 */
export function reportIssues(issues: Issue[]): Issue[] {
  const valueKeys = new Set(
    issues.filter((i) => i.id === 'VALUE_MISSING').map((i) => `${i.data.platform}:${i.data.event}`),
  );
  const out: Issue[] = [];
  let missing: Issue | null = null;
  for (const i of sortIssues(issues)) {
    if (i.severity === 'info') continue;
    if (i.id === 'PLAN_PARAMS' && valueKeys.has(`${i.data.platform}:${i.data.event}`)) continue;
    if (i.id === 'PLAN_MISSING') {
      if (missing) (missing.data.events as string[]).push(String(i.data.event));
      else {
        missing = {
          ...i,
          key: 'PLAN_MISSING:all',
          data: { ...i.data, events: [String(i.data.event)] },
        };
        out.push(missing);
      }
      continue;
    }
    out.push(i);
  }
  return out;
}
