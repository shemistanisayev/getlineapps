/**
 * Rivaline 1.1 Compare (docs/rivaline/PLAN-1.1.md, step 4): two sites the panel has read, side
 * by side. Pure function over results already in memory; nothing is fetched or stored.
 */
import type { BrandColor, BrandKit } from './brand.ts';
import type { LeadWay, PromoKind, SiteInfo, SocialNetwork } from './research.ts';
import { SOCIAL_NETWORKS } from './research.ts';
import { AD_CHANNELS } from './rules/index.ts';
import { CATEGORIES, type Category, type FoundTool, type GapId, type Stack } from './types.ts';

export interface CompareSide {
  stack: Stack;
  site: SiteInfo | null;
  brand: BrandKit | null;
}

/** A row with a value per side; `null` when that side does not have it. */
export interface Pair<T> {
  a: T | null;
  b: T | null;
}

export type CompareNumber = 'tools' | 'adPixels' | 'offers' | 'profiles' | 'apps' | 'languages';

export interface Comparison {
  numbers: Array<{ id: CompareNumber; a: number; b: number }>;
  /** Tools by category: only on A, only on B, on both. */
  tools: Array<{ category: Category; onlyA: FoundTool[]; onlyB: FoundTool[]; both: FoundTool[] }>;
  /** Ad channels either side runs, in the summary order ("Meta", "TikTok" ...). */
  adChannels: Array<{ channel: string; a: boolean; b: boolean }>;
  gaps: { a: GapId[]; b: GapId[] };
  /** Offer kinds either side shows. */
  promos: Array<{ kind: PromoKind; a: boolean; b: boolean }>;
  /** Social networks either side links to, with the handle. */
  social: Array<{ network: SocialNetwork } & Pair<string>>;
  apps: { a: string[]; b: string[] };
  leads: Array<{ way: LeadWay } & Pair<string[]>>;
  markets: {
    languages: Pair<string[]>;
    currency: Pair<string>;
  };
  brand: {
    colors: Array<{ role: BrandColor['role'] } & Pair<string>>;
    heading: Pair<string>;
    body: Pair<string>;
  };
}

const PROMO_ORDER: PromoKind[] = [
  'discount',
  'code',
  'shipping',
  'sale',
  'installments',
  'gift',
  'returns',
];
const LEAD_ORDER: LeadWay[] = ['email', 'sms', 'push', 'chat', 'whatsapp', 'forms'];
const ROLES: Array<BrandColor['role']> = ['primary', 'accent', 'text', 'background', 'surface'];

export function compareSites(a: CompareSide, b: CompareSide): Comparison {
  const idsA = new Set(a.stack.tools.map((t) => t.id));
  const idsB = new Set(b.stack.tools.map((t) => t.id));
  const tools = CATEGORIES.map((category) => {
    const inA = a.stack.tools.filter((t) => t.category === category);
    const inB = b.stack.tools.filter((t) => t.category === category);
    return {
      category,
      onlyA: inA.filter((t) => !idsB.has(t.id)),
      onlyB: inB.filter((t) => !idsA.has(t.id)),
      both: inA.filter((t) => idsB.has(t.id)),
    };
  }).filter((g) => g.onlyA.length + g.onlyB.length + g.both.length > 0);

  const adChannels = AD_CHANNELS.filter(([id]) => idsA.has(id) || idsB.has(id)).map(
    ([id, channel]) => ({ channel, a: idsA.has(id), b: idsB.has(id) }),
  );

  const kinds = (s: SiteInfo | null) => new Set(s?.offer.promos.flatMap((p) => p.kinds) ?? []);
  const kA = kinds(a.site);
  const kB = kinds(b.site);
  const promos = PROMO_ORDER.filter((k) => kA.has(k) || kB.has(k)).map((kind) => ({
    kind,
    a: kA.has(kind),
    b: kB.has(kind),
  }));

  const handle = (s: SiteInfo | null, n: SocialNetwork) =>
    s?.channels.social.find((p) => p.network === n)?.handle ?? null;
  const social = SOCIAL_NETWORKS.map((network) => ({
    network,
    a: handle(a.site, network),
    b: handle(b.site, network),
  })).filter((r) => r.a !== null || r.b !== null);

  const lead = (s: SiteInfo | null, w: LeadWay) => s?.leads.find((l) => l.way === w)?.tools ?? null;
  const leads = LEAD_ORDER.map((way) => ({
    way,
    a: lead(a.site, way),
    b: lead(b.site, way),
  })).filter((r) => r.a !== null || r.b !== null);

  const color = (k: BrandKit | null, role: BrandColor['role']) =>
    k?.colors.find((c) => c.role === role)?.hex ?? null;
  const colors = ROLES.map((role) => ({
    role,
    a: color(a.brand, role),
    b: color(b.brand, role),
  })).filter((r) => r.a !== null || r.b !== null);

  const count = (s: SiteInfo | null, f: (s: SiteInfo) => number) => (s ? f(s) : 0);
  return {
    numbers: [
      { id: 'tools', a: a.stack.tools.length, b: b.stack.tools.length },
      { id: 'adPixels', a: a.stack.adPixels, b: b.stack.adPixels },
      {
        id: 'offers',
        a: count(a.site, (s) => s.offer.promos.length),
        b: count(b.site, (s) => s.offer.promos.length),
      },
      {
        id: 'profiles',
        a: count(a.site, (s) => s.channels.social.length),
        b: count(b.site, (s) => s.channels.social.length),
      },
      {
        id: 'apps',
        a: count(a.site, (s) => s.channels.apps.length),
        b: count(b.site, (s) => s.channels.apps.length),
      },
      {
        id: 'languages',
        a: count(a.site, (s) => Math.max(1, s.markets.languages.length)),
        b: count(b.site, (s) => Math.max(1, s.markets.languages.length)),
      },
    ],
    tools,
    adChannels,
    gaps: { a: a.stack.gaps.map((g) => g.id), b: b.stack.gaps.map((g) => g.id) },
    promos,
    social,
    apps: {
      a: a.site?.channels.apps.map((x) => x.store) ?? [],
      b: b.site?.channels.apps.map((x) => x.store) ?? [],
    },
    leads,
    markets: {
      languages: {
        a: a.site ? langs(a.site) : null,
        b: b.site ? langs(b.site) : null,
      },
      currency: { a: a.site?.markets.currency ?? null, b: b.site?.markets.currency ?? null },
    },
    brand: {
      colors,
      heading: { a: a.brand?.heading?.family ?? null, b: b.brand?.heading?.family ?? null },
      body: { a: a.brand?.body?.family ?? null, b: b.brand?.body?.family ?? null },
    },
  };
}

/** Language versions, or the page language when the site has no hreflang. */
function langs(s: SiteInfo): string[] {
  return s.markets.languages.length
    ? s.markets.languages
    : s.markets.pageLang
      ? [s.markets.pageLang]
      : [];
}
