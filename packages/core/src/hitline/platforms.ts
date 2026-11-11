/**
 * Every platform Hitline knows (docs/hitline/PLAN-1.1.md). One registry for the panel, popup and PDF:
 * id, display name, group, and whether it is an ad pixel that must wait for ad_storage.
 * Custom rules from Settings get ids `custom:<name>`; unknown tracking-like requests are `other`.
 */
import type { Platform } from './types.ts';

export type PlatformGroup =
  'analytics' | 'session' | 'ads' | 'crm' | 'tags' | 'testing' | 'datalayer' | 'custom' | 'other';

export interface PlatformDef {
  id: string;
  name: string;
  group: PlatformGroup;
  /** Ad pixel: sending while ad_storage is denied is a consent leak (not Google: Consent Mode handles it). */
  adPixel?: boolean;
  /** Page global that proves the platform is loaded even when no request was seen. */
  globals?: string[];
}

const P = (
  id: string,
  name: string,
  group: PlatformGroup,
  extra: Partial<PlatformDef> = {},
): PlatformDef => ({ id, name, group, ...extra });

/** Order = display order inside a group. */
export const PLATFORM_LIST: PlatformDef[] = [
  // Analytics
  P('ga4', 'GA4', 'analytics', { globals: ['gtag'] }),
  P('ua', 'Universal Analytics', 'analytics', { globals: ['ga'] }),
  P('adobe', 'Adobe Analytics', 'analytics', { globals: ['s_gi'] }),
  P('aep', 'Adobe Web SDK', 'analytics', { globals: ['alloy'] }),
  P('amplitude', 'Amplitude', 'analytics', { globals: ['amplitude'] }),
  P('mixpanel', 'Mixpanel', 'analytics', { globals: ['mixpanel'] }),
  P('segment', 'Segment', 'analytics'),
  P('rudderstack', 'RudderStack', 'analytics', { globals: ['rudderanalytics'] }),
  P('posthog', 'PostHog', 'analytics', { globals: ['posthog'] }),
  P('heap', 'Heap', 'analytics', { globals: ['heap'] }),
  P('matomo', 'Matomo', 'analytics', { globals: ['Matomo', 'Piwik'] }),
  P('piwikpro', 'Piwik PRO', 'analytics', { globals: ['ppms'] }),
  P('snowplow', 'Snowplow', 'analytics', { globals: ['snowplow'] }),
  P('yandex', 'Yandex Metrica', 'analytics', { globals: ['ym'] }),
  P('plausible', 'Plausible', 'analytics', { globals: ['plausible'] }),
  // Session recording and heatmaps
  P('hotjar', 'Hotjar', 'session', { globals: ['hj'] }),
  P('clarity', 'Microsoft Clarity', 'session', { globals: ['clarity'] }),
  P('fullstory', 'FullStory', 'session', { globals: ['FS'] }),
  P('mouseflow', 'Mouseflow', 'session', { globals: ['mouseflow'] }),
  P('contentsquare', 'Contentsquare', 'session', { globals: ['CS_CONF'] }),
  // Ad pixels
  P('ads', 'Google Ads', 'ads'),
  P('floodlight', 'Floodlight', 'ads'),
  P('meta', 'Meta', 'ads', { adPixel: true, globals: ['fbq'] }),
  P('tiktok', 'TikTok', 'ads', { adPixel: true, globals: ['ttq'] }),
  P('bing', 'Microsoft Ads', 'ads', { adPixel: true, globals: ['uetq'] }),
  P('linkedin', 'LinkedIn', 'ads', { adPixel: true, globals: ['lintrk'] }),
  P('x', 'X (Twitter)', 'ads', { adPixel: true, globals: ['twq'] }),
  P('pinterest', 'Pinterest', 'ads', { adPixel: true, globals: ['pintrk'] }),
  P('snapchat', 'Snapchat', 'ads', { adPixel: true, globals: ['snaptr'] }),
  P('reddit', 'Reddit', 'ads', { adPixel: true, globals: ['rdt'] }),
  P('quora', 'Quora', 'ads', { adPixel: true, globals: ['qp'] }),
  P('criteo', 'Criteo', 'ads', { adPixel: true, globals: ['criteo_q'] }),
  P('taboola', 'Taboola', 'ads', { adPixel: true, globals: ['_tfa'] }),
  P('outbrain', 'Outbrain', 'ads', { adPixel: true, globals: ['obApi'] }),
  P('amazon', 'Amazon Ads', 'ads', { adPixel: true, globals: ['amzn'] }),
  P('awin', 'Awin', 'ads', { adPixel: true, globals: ['AWIN'] }),
  // CRM and marketing automation
  P('hubspot', 'HubSpot', 'crm', { globals: ['_hsq'] }),
  P('klaviyo', 'Klaviyo', 'crm', { globals: ['klaviyo', '_learnq'] }),
  P('marketo', 'Marketo', 'crm', { globals: ['Munchkin'] }),
  P('pardot', 'Pardot', 'crm', { globals: ['piAId'] }),
  P('braze', 'Braze', 'crm', { globals: ['braze', 'appboy'] }),
  P('customerio', 'Customer.io', 'crm', { globals: ['_cio'] }),
  // Tag managers
  P('gtm', 'GTM', 'tags'),
  P('gtag', 'Google Tag', 'tags'),
  P('tealium', 'Tealium', 'tags', { globals: ['utag'] }),
  P('launch', 'Adobe Launch', 'tags', { globals: ['_satellite'] }),
  // A/B testing
  P('optimizely', 'Optimizely', 'testing', { globals: ['optimizely'] }),
  P('vwo', 'VWO', 'testing', { globals: ['VWO', '_vwo_code'] }),
  P('abtasty', 'AB Tasty', 'testing', { globals: ['ABTasty'] }),
  // Page data layers
  P('datalayer', 'dataLayer', 'datalayer'),
  P('adobedl', 'Adobe Data Layer', 'datalayer'),
  P('digitaldata', 'digitalData', 'datalayer'),
  P('utagdata', 'utag_data', 'datalayer'),
  P('other', 'Other', 'other'),
];

export const PLATFORMS: Record<string, PlatformDef> = Object.fromEntries(
  PLATFORM_LIST.map((p) => [p.id, p]),
);

const ORDER = new Map(PLATFORM_LIST.map((p, i) => [p.id, i]));

export function isCustom(id: Platform): boolean {
  return id.startsWith('custom:');
}

export function platformDef(id: Platform): PlatformDef {
  return (
    PLATFORMS[id] ??
    (isCustom(id)
      ? { id, name: id.slice(7) || 'Custom', group: 'custom' }
      : { id, name: id, group: 'other' })
  );
}

export function platformName(id: Platform): string {
  return platformDef(id).name;
}

/** Sort key: registry order, custom rules after the known platforms, Other last. */
export function platformOrder(id: Platform): number {
  if (id === 'other') return 10_000;
  return ORDER.get(id) ?? 5_000;
}

/** Platforms whose hits count as tracking (not page data layers, tag manager loads or Other). */
export function isTracked(id: Platform): boolean {
  const g = platformDef(id).group;
  return g !== 'datalayer' && g !== 'other' && g !== 'tags';
}

export function isAdPixel(id: Platform): boolean {
  return platformDef(id).adPixel === true;
}

/** Platforms the Empty state and the store listing count as supported (no data layers, no Other). */
export const SUPPORTED_COUNT = PLATFORM_LIST.filter(
  (p) => p.group !== 'other' && !['adobedl', 'digitaldata', 'utagdata'].includes(p.id),
).length;
