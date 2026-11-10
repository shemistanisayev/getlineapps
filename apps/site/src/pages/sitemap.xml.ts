import type { APIRoute } from 'astro';
import { LINE_SITE_URL, TOOL_SLUGS } from '@line/core/site';
import { hasLanding, localePath, LOCALES } from '../lib/site.ts';

/** Every indexable page, with its language versions (hreflang). */
export function sitemapPaths(): string[] {
  const paths = ['/', ...TOOL_SLUGS.map((s) => `/privacy/${s}`)];
  for (const s of TOOL_SLUGS) if (hasLanding(s)) paths.push(`/${s}`);
  return paths;
}

const abs = (p: string) => (p === '/' ? `${LINE_SITE_URL}/` : `${LINE_SITE_URL}${p}`);

export const GET: APIRoute = () => {
  const urls = sitemapPaths().flatMap((path) =>
    LOCALES.map((locale) => {
      const alts = LOCALES.map(
        (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(localePath(l, path))}"/>`,
      ).join('');
      const xd = `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(path)}"/>`;
      return `<url><loc>${abs(localePath(locale, path))}</loc>${alts}${xd}</url>`;
    }),
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
