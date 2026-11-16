/** Small helpers shared by every page of getlineapps.com. */
import { getCollection, getEntry } from 'astro:content';
import { TOOL_SLUGS, contactUrl, type ToolSlug } from '@line/core/site';

/** Every site language. English lives at the root, the others under /<code>. */
export const LOCALES = ['en', 'az', 'tr', 'ru', 'ro', 'uk', 'pt', 'nl', 'es', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const SOURCE_URL = 'https://github.com/shemistanisayev/getlineapps';

/** The first two languages: their routes are files under pages/ and pages/az/. The 404 shows both. */
export const BASE_LOCALES: readonly Locale[] = ['en', 'az'];
/** The other languages (the Chrome Web Store ones): their routes are pages/[lang]/. */
export const EXTRA_LOCALES = LOCALES.filter((l) => !BASE_LOCALES.includes(l));

/** Each language's own name, for the language menu (the same in every UI language). */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  az: 'Azərbaycan',
  tr: 'Türkçe',
  ru: 'Русский',
  ro: 'Română',
  uk: 'Українська',
  pt: 'Português',
  nl: 'Nederlands',
  es: 'Español',
  fr: 'Français',
};

/** The languages a page exists in: every page has all of them. */
export function pageLocales(_path: string): readonly Locale[] {
  return LOCALES;
}

/** A site path in the given language: English at the root, the others under /<code>. */
export function localePath(locale: Locale, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'en') return p;
  return p === '/' ? `/${locale}` : `/${locale}${p}`;
}

/** hreflang alternates of a page: every language it exists in. */
export function alternatesFor(path: string): Partial<Record<Locale, string>> {
  return Object.fromEntries(pageLocales(path).map((l) => [l, localePath(l, path)]));
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

export async function getSerpline(locale: Locale) {
  return (await must(getEntry('serpline', locale), `serpline/${locale}.json`)).data;
}

export async function getRivaline(locale: Locale) {
  return (await must(getEntry('rivaline', locale), `rivaline/${locale}.json`)).data;
}

/** Store button state from tools.json: a live tool links to its listing, a soon tool says so. */
export async function getTool(slug: ToolSlug) {
  const tool = (await getTools()).find((t) => t.slug === slug);
  if (!tool) throw new Error(`tools.json has no entry for ${slug}`);
  return tool;
}
