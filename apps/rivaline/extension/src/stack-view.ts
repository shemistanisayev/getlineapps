/** Panel-side helpers that turn core results into what the Stack tab shows (copy from i18n). */
import type { Category, FoundTool, Gap, Stack } from '@line/core/rivaline';
import type { LibraryId } from '@line/core/rivaline';
import { MARKS } from '@line/ui/marks';
import type { ToolIcon } from '@line/ui/rivaline';
import { joinList, type MessageKey, type T } from './i18n/index.ts';

/** Platforms that sell: the summary says "store"; site builders and CMSs say "site". */
const STORES = new Set([
  'shopify',
  'woocommerce',
  'adobe_commerce',
  'bigcommerce',
  'salesforce_commerce',
  'prestashop',
  'ecwid',
]);

/** Advertising tools that have an ad library (Open in ...). */
export const TOOL_LIBRARY: Record<string, LibraryId> = {
  meta_pixel: 'meta',
  google_ads: 'google',
  tiktok_pixel: 'tiktok',
  linkedin_insight: 'linkedin',
};

export function plural(t: T, base: 'n.tool' | 'n.cat' | 'gaps', n: number): string {
  return t(`${base}.${n === 1 ? 'one' : 'other'}` as MessageKey, { n });
}

export function toolIcon(tool: Pick<FoundTool, 'id' | 'mark' | 'category'>): ToolIcon {
  if (tool.mark && tool.mark in MARKS) return { mark: tool.mark as keyof typeof MARKS };
  return { glyph: tool.id === 'sgtm' ? 'server' : tool.category };
}

export const categoryLabel = (t: T, c: Category) => t(`cat.${c}` as MessageKey);

/** "13 tools in 8 categories" */
export function stackTitle(t: T, stack: Stack): string {
  return t('stack.title', {
    tools: plural(t, 'n.tool', stack.summary.tools),
    cats: plural(t, 'n.cat', stack.summary.categories),
  });
}

/** "Shopify store running Meta, TikTok, Google and Pinterest ads" (SPEC §4.3). */
export function stackSubline(t: T, stack: Stack): string | undefined {
  const { platform, adChannels } = stack.summary;
  const platformTool = stack.tools.find((x) => x.category === 'ecommerce');
  const store = platformTool ? STORES.has(platformTool.id) : false;
  const channels = joinList(adChannels, t);
  if (platform && adChannels.length)
    return t(store ? 'stack.storeAds' : 'stack.siteAds', { platform, channels });
  if (platform) return t(store ? 'stack.store' : 'stack.site', { platform });
  if (adChannels.length) return t('stack.ads', { channels });
  return undefined;
}

/** "Home page" for "/", else the path. */
export function pageLabel(t: T, url: string): string {
  try {
    const path = new URL(url).pathname;
    return path === '/' ? t('stack.home') : path;
  } catch {
    return url;
  }
}

export function gapLine(t: T, g: Gap): string {
  if (g.id === 'GAP_SERVER_SIDE') {
    const n = g.count ?? 0;
    return t(n === 1 ? 'gap.GAP_SERVER_SIDE.one' : 'gap.GAP_SERVER_SIDE.other', { n });
  }
  return t(`gap.${g.id}.text` as MessageKey);
}

export const gapTitle = (t: T, g: Gap) => t(`gap.${g.id}.title` as MessageKey);
export const gapShort = (t: T, g: Gap) => t(`gap.${g.id}.short` as MessageKey);
