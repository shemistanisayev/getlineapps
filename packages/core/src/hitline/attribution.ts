/** Attribution path (docs/hitline-SPEC.md §4.4): campaign parameters page by page. */
import { get, queryOf } from './decode.ts';
import { hostOf, pathOf, registrableDomain } from './domain.ts';
import type { Hit, Param } from './types.ts';

export const CLICK_IDS = ['gclid', 'fbclid', 'ttclid'] as const;

export interface PageFacts {
  index: number;
  url: string;
  host: string;
  site: string;
  /** Landing, Product, Cart, Payment, Confirmation or Page. */
  kind: 'landing' | 'product' | 'cart' | 'payment' | 'confirmation' | 'page';
  utm: Param[];
  clickIds: Param[];
  hasGl: boolean;
  /** GA4 client id ("111.222") from _ga or GA4 hits on this page. */
  clientId?: string;
  gclAw: boolean;
  /** GA4 page_referrer on this page. */
  referrer?: string;
}

export type SourceCell = 'present' | 'in_session' | 'lost' | 'referral' | 'none';
export type ClickCell = 'present' | 'in_cookie' | 'lost' | 'none';
export type ClientIdCell = 'created' | 'same' | 'new' | 'none';

export type StepBadge =
  | { kind: 'utm_click'; ok: true }
  | { kind: 'gcl_saved'; ok: true }
  | { kind: 'source_medium'; ok: true; value: string }
  | { kind: 'gl_missing'; ok: false }
  | { kind: 'referral'; ok: false; value: string }
  | { kind: 'none'; ok: true };

export interface AttributionStep {
  page: PageFacts;
  source: SourceCell;
  gclid: ClickCell;
  clientId: ClientIdCell;
  badge: StepBadge;
}

export interface AttributionResult {
  /** True when the visit started from a campaign link (UTM or click id). */
  campaign: boolean;
  landing?: PageFacts;
  steps: AttributionStep[];
  /** Pages where GA4 credits another domain as referral. */
  referrals: { page: number; host: string; domain: string }[];
  /** Pages on another own domain reached without _gl. */
  breaks: { page: number; host: string }[];
}

export interface PageInput {
  url: string;
  cookies: Record<string, string>;
  hits: Hit[];
}

function kindOf(url: string, index: number, isLanding: boolean): PageFacts['kind'] {
  if (isLanding || index === 0) return 'landing';
  const p = pathOf(url).toLowerCase();
  if (/confirm|thank|success|order-received|\/order\//.test(p)) return 'confirmation';
  if (/checkout|payment|\/pay\b/.test(p) || hostOf(url).startsWith('pay.')) return 'payment';
  if (/\/cart|\/basket|\/bag\b/.test(p)) return 'cart';
  if (/\/product|\/products\/|\/p\/|\/item/.test(p)) return 'product';
  return 'page';
}

/** "GA1.1.111.222" -> "111.222" */
export function clientIdFromGa(cookie: string | undefined): string | undefined {
  const m = /^GA\d\.\d\.(.+)$/.exec(cookie ?? '');
  return m?.[1];
}

export function pageFacts(input: PageInput, index: number): PageFacts {
  const q = queryOf(input.url);
  const utm = q.filter((p) => p.key.startsWith('utm_'));
  const clickIds = q.filter((p) => (CLICK_IDS as readonly string[]).includes(p.key));
  const ga4 = input.hits.filter((h) => h.platform === 'ga4');
  const clientId =
    clientIdFromGa(input.cookies._ga) ?? ga4.map((h) => get(h.context, 'client_id')).find(Boolean);
  const referrer = ga4.map((h) => get(h.context, 'page_referrer')).find(Boolean);
  const host = hostOf(input.url);
  return {
    index,
    url: input.url,
    host,
    site: registrableDomain(host),
    kind: 'page',
    utm,
    clickIds,
    hasGl: q.some((p) => p.key === '_gl'),
    clientId,
    gclAw: Object.keys(input.cookies).some((k) => k.startsWith('_gcl_aw')),
    referrer,
  };
}

export function buildAttribution(pages: PageInput[]): AttributionResult {
  const facts = pages.map(pageFacts);
  const landingIndex = facts.findIndex((f) => f.utm.length > 0 || f.clickIds.length > 0);
  const campaign = landingIndex >= 0;
  const landing = campaign ? facts[landingIndex] : undefined;
  facts.forEach((f, i) => (f.kind = kindOf(f.url, i, i === landingIndex)));

  const steps: AttributionStep[] = [];
  const referrals: AttributionResult['referrals'] = [];
  const breaks: AttributionResult['breaks'] = [];
  const firstCid = facts.find((f) => f.clientId)?.clientId;
  const firstCidPage = facts.findIndex((f) => f.clientId);
  let gclidSeen = false;
  let gclSavedShown = false;

  facts.forEach((f, i) => {
    const afterLanding = campaign && i > landingIndex;
    const otherSite = Boolean(landing) && f.site !== landing!.site;
    const refSite = f.referrer ? registrableDomain(hostOf(f.referrer)) : '';
    const isReferral = Boolean(refSite) && refSite !== f.site;

    let source: SourceCell = 'none';
    if (f.utm.some((p) => p.key === 'utm_source')) source = 'present';
    else if (afterLanding && otherSite && !f.hasGl) source = 'lost';
    else if (afterLanding && isReferral) source = 'referral';
    else if (afterLanding) source = 'in_session';

    let gclid: ClickCell = 'none';
    if (f.clickIds.some((p) => p.key === 'gclid')) {
      gclid = 'present';
      gclidSeen = true;
    } else if (gclidSeen) gclid = f.gclAw ? 'in_cookie' : 'lost';

    let clientId: ClientIdCell = 'none';
    if (f.clientId)
      clientId = i === firstCidPage ? 'created' : f.clientId === firstCid ? 'same' : 'new';

    let badge: StepBadge = { kind: 'none', ok: true };
    if (i === landingIndex) badge = { kind: 'utm_click', ok: true };
    else if (source === 'lost') badge = { kind: 'gl_missing', ok: false };
    else if (source === 'referral') badge = { kind: 'referral', ok: false, value: refSite };
    else if (gclid === 'in_cookie' && !gclSavedShown) {
      badge = { kind: 'gcl_saved', ok: true };
      gclSavedShown = true;
    } else if (source === 'in_session' && landing) {
      const s = get(landing.utm, 'utm_source') ?? '';
      const m = get(landing.utm, 'utm_medium') ?? '';
      badge = { kind: 'source_medium', ok: true, value: [s, m].filter(Boolean).join(' / ') };
    }

    if (source === 'referral') {
      referrals.push({ page: i, host: hostOf(f.referrer!), domain: refSite });
    }
    if (source === 'lost') breaks.push({ page: i, host: f.host });
    steps.push({ page: f, source, gclid, clientId, badge });
  });

  return { campaign, landing, steps, referrals, breaks };
}
