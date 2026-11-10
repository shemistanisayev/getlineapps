/** SEO head for getlineapps.com: title, description, canonical, hreflang, Open Graph, Twitter, JSON-LD. */
import { LINE_SITE_URL, OWNER_SITE_URL } from '@line/core/site';

export type SiteLocale = 'en' | 'az';

export interface SeoInput {
  title: string;
  description: string;
  /** Path on getlineapps.com, for example "/" or "/hitline". */
  path: string;
  locale?: SiteLocale;
  /** Absolute or site-relative URL of a 1200x630 image. */
  image?: string;
  imageAlt?: string;
  /** Paths of the same page per language (hreflang). */
  alternates?: Partial<Record<SiteLocale, string>>;
  noindex?: boolean;
  type?: 'website' | 'article';
  jsonLd?: object[];
}

export interface HeadTag {
  tag: 'title' | 'meta' | 'link' | 'script';
  attrs: Record<string, string>;
  content?: string;
}

export const SITE_NAME = 'Line apps';

export const absoluteUrl = (pathOrUrl: string) =>
  /^https?:\/\//.test(pathOrUrl)
    ? pathOrUrl
    : `${LINE_SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`.replace(/\/$/, '') ||
      LINE_SITE_URL;

const canonicalUrl = (path: string) =>
  path === '/' || path === '' ? `${LINE_SITE_URL}/` : absoluteUrl(path);

export function seoTags(input: SeoInput): HeadTag[] {
  const url = canonicalUrl(input.path);
  const tags: HeadTag[] = [
    { tag: 'title', attrs: {}, content: input.title },
    { tag: 'meta', attrs: { name: 'description', content: input.description } },
    { tag: 'link', attrs: { rel: 'canonical', href: url } },
    { tag: 'meta', attrs: { property: 'og:type', content: input.type ?? 'website' } },
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
    { tag: 'meta', attrs: { property: 'og:title', content: input.title } },
    { tag: 'meta', attrs: { property: 'og:description', content: input.description } },
    { tag: 'meta', attrs: { property: 'og:url', content: url } },
    {
      tag: 'meta',
      attrs: { property: 'og:locale', content: input.locale === 'az' ? 'az_AZ' : 'en_US' },
    },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
  ];
  if (input.noindex) tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex' } });
  if (input.image) {
    const img = absoluteUrl(input.image);
    tags.push(
      { tag: 'meta', attrs: { property: 'og:image', content: img } },
      { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
      { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
    );
    if (input.imageAlt)
      tags.push({ tag: 'meta', attrs: { property: 'og:image:alt', content: input.imageAlt } });
  }
  if (input.alternates) {
    for (const [lang, path] of Object.entries(input.alternates)) {
      if (path)
        tags.push({
          tag: 'link',
          attrs: { rel: 'alternate', hreflang: lang, href: canonicalUrl(path) },
        });
    }
    const en = input.alternates.en;
    if (en)
      tags.push({
        tag: 'link',
        attrs: { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl(en) },
      });
  }
  for (const data of input.jsonLd ?? []) {
    tags.push({
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      content: jsonLdString(data),
    });
  }
  return tags;
}

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** JSON for a <script type="application/ld+json">, safe against </script> injection. */
export function jsonLdString(data: object) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/** Render the tags as HTML (Astro: <Fragment set:html={renderSeoHead(...)} />). */
export function renderSeoHead(input: SeoInput): string {
  return seoTags(input)
    .map(({ tag, attrs, content }) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
        .join('');
      if (tag === 'meta' || tag === 'link') return `<${tag}${a}>`;
      const body = tag === 'script' ? (content ?? '') : escapeText(content ?? '');
      return `<${tag}${a}>${body}</${tag}>`;
    })
    .join('\n');
}

const author = {
  '@type': 'Person',
  name: 'Shamistan Isayev',
  url: OWNER_SITE_URL,
};

export function softwareApplicationJsonLd(app: {
  name: string;
  description: string;
  path: string;
  image?: string;
  storeUrl?: string | null;
  category?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    url: absoluteUrl(app.path),
    ...(app.image ? { image: absoluteUrl(app.image) } : {}),
    ...(app.storeUrl ? { downloadUrl: app.storeUrl, installUrl: app.storeUrl } : {}),
    operatingSystem: 'Chrome',
    applicationCategory: app.category ?? 'DeveloperApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author,
    publisher: author,
  };
}

export function faqPageJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function websiteJsonLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${LINE_SITE_URL}/`,
    description,
    publisher: author,
  };
}
