import type { APIRoute } from 'astro';
import { LINE_SITE_URL } from '@line/core/site';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${LINE_SITE_URL}/sitemap.xml\n`,
    {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    },
  );
