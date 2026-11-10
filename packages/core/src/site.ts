/**
 * The one shared site config for the Line family (docs/line-family-domains.md).
 * Every link to getlineapps.com is built here. No other domain is allowed.
 */
export const LINE_SITE_URL = 'https://getlineapps.com';

/** Contact CTAs go here, always with a UTM. */
export const OWNER_SITE_URL = 'https://shamistanisayev.com/';

export const TOOL_SLUGS = ['hitline', 'serpline', 'rivaline', 'foldline', 'markline'] as const;
export type ToolSlug = (typeof TOOL_SLUGS)[number];

export function isToolSlug(value: unknown): value is ToolSlug {
  return typeof value === 'string' && (TOOL_SLUGS as readonly string[]).includes(value);
}

export interface Utm {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
}

function withUtm(url: URL, utm?: Utm): string {
  if (utm) {
    url.searchParams.set('utm_source', utm.source);
    url.searchParams.set('utm_medium', utm.medium);
    if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign);
    if (utm.content) url.searchParams.set('utm_content', utm.content);
  }
  return url.toString();
}

/**
 * A tool page on getlineapps.com.
 * toolUrl('foldline') -> https://getlineapps.com/foldline
 * toolUrl('rivaline', '#finder') -> https://getlineapps.com/rivaline#finder
 * toolUrl('hitline', '/uninstalled', { source: 'hitline', medium: 'extension', campaign: 'uninstall' })
 *
 * Links between getlineapps.com pages carry no UTM: pass `utm` only from an extension or an export.
 */
export function toolUrl(slug: ToolSlug, path = '', utm?: Utm): string {
  if (!isToolSlug(slug)) throw new Error(`Unknown tool slug: ${String(slug)}`);
  let hash = '';
  let rest = path;
  const hashAt = rest.indexOf('#');
  if (hashAt >= 0) {
    hash = rest.slice(hashAt);
    rest = rest.slice(0, hashAt);
  }
  if (rest && !rest.startsWith('/') && !rest.startsWith('?')) rest = `/${rest}`;
  const url = new URL(`${LINE_SITE_URL}/${slug}${rest}`);
  const out = withUtm(url, utm);
  return hash ? out + hash : out;
}

/** The Web Store privacy URL. Never has a UTM. */
export function privacyUrl(slug: ToolSlug): string {
  if (!isToolSlug(slug)) throw new Error(`Unknown tool slug: ${String(slug)}`);
  return `${LINE_SITE_URL}/privacy/${slug}`;
}

/** The URL passed to chrome.runtime.setUninstallURL. */
export function uninstallUrl(slug: ToolSlug, version: string): string {
  const url = new URL(
    toolUrl(slug, '/uninstalled', {
      source: slug,
      medium: 'extension',
      campaign: 'uninstall',
    }),
  );
  url.searchParams.set('v', version);
  return url.toString();
}

/** Contact CTA to the owner's site. */
export function contactUrl(utm: Utm): string {
  return withUtm(new URL(OWNER_SITE_URL), utm);
}
