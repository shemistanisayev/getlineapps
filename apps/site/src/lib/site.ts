/** Small helpers shared by every page of getlineapps.com. */
import { getCollection, getEntry } from 'astro:content';
import { TOOL_SLUGS, contactUrl, type ToolSlug } from '@line/core/site';

export type Locale = 'en' | 'az';
export const LOCALES: Locale[] = ['en', 'az'];

export const SOURCE_URL = 'https://github.com/shemistanisayev/getlineapps';

/** A site path in the given language: English at the root, Azerbaijani under /az. */
export function localePath(locale: Locale, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'en') return p;
  return p === '/' ? '/az' : `/az${p}`;
}

/** Replace {name} style holes. */
export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

/** Contact CTA on the hub and privacy pages (docs/line-family-domains.md, Links and UTM). */
export type ContactCampaign = 'hub_nav' | 'hub_cta' | 'faq' | 'privacy' | 'footer';
export const contact = (campaign: ContactCampaign) =>
  contactUrl({ source: 'getlineapps', medium: 'landing', campaign });

/**
 * A tool landing exists once its content files are added (Faza 3 to 7).
 * Until then the site shows no link to it, so nothing points at a 404.
 */
const landingFiles = import.meta.glob('/src/content/*/en.json');
export const hasLanding = (slug: ToolSlug) => `/src/content/${slug}/en.json` in landingFiles;

export async function getTools() {
  const entries = await getCollection('tools');
  const bySlug = new Map(entries.map((e) => [e.id, e.data]));
  return TOOL_SLUGS.map((slug) => {
    const t = bySlug.get(slug);
    if (!t) throw new Error(`tools.json has no entry for ${slug}`);
    return { ...t, landing: hasLanding(slug) };
  });
}
export type SiteTool = Awaited<ReturnType<typeof getTools>>[number];

async function must<T>(p: Promise<T> | T, what: string): Promise<NonNullable<T>> {
  const v = await p;
  if (!v) throw new Error(`Missing content: ${what}`);
  return v;
}

export async function getShared(locale: Locale) {
  return (await must(getEntry('shared', locale), `shared/${locale}.json`)).data;
}
export async function getHub(locale: Locale) {
  return (await must(getEntry('hub', locale), `hub/${locale}.json`)).data;
}
export async function getPrivacyPage(locale: Locale) {
  return (await must(getEntry('privacyPage', `page.${locale}`), `privacy/page.${locale}.json`))
    .data;
}
export async function getPrivacy(slug: ToolSlug, locale: Locale) {
  return (await must(getEntry('privacy', `${slug}.${locale}`), `privacy/${slug}.${locale}.json`))
    .data;
}
export async function getHitline(locale: Locale) {
  return (await must(getEntry('hitline', locale), `hitline/${locale}.json`)).data;
}

/** Store button state from tools.json: a live tool links to its listing, a soon tool says so. */
export async function getTool(slug: ToolSlug) {
  const tool = (await getTools()).find((t) => t.slug === slug);
  if (!tool) throw new Error(`tools.json has no entry for ${slug}`);
  return tool;
}
