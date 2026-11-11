/**
 * Lumo, Serpline scenario (docs/serpline-SPEC.md §10, docs/serpline/PLAN.md decision 1).
 * - `serpline` mode (port 4401): the design paths, /products/wireless-headphones-pro-x etc.
 * - shop mode (port 4400, Hitline): the same pages under /seo/... (the SPEC paths); internal links
 *   keep the /seo prefix there.
 * robots.txt and llms.txt are site-wide, so both modes answer them the Serpline way.
 */
import type { ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('./public/serpline/', import.meta.url));
export const SERPLINE_ROBOTS = readFileSync(
  fileURLToPath(new URL('../../packages/core/fixtures/serpline/lumo-robots.txt', import.meta.url)),
  'utf8',
);

const HTML = 'text/html; charset=utf-8';

type Send = (
  res: ServerResponse,
  status: number,
  body: string,
  type?: string,
  headers?: Record<string, string>,
) => void;

/** Simple product picture: an SVG served for every /img/*.jpg (the type header wins over the extension). */
function picture(name: string): string {
  const colors = ['#EFEBE1', '#E9E4D8', '#E4DFD2'];
  const bg = colors[name.length % colors.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/><path d="M40 120V95a60 60 0 0 1 120 0v25" fill="none" stroke="#1D2420" stroke-width="12" stroke-linecap="round"/><rect x="26" y="108" width="36" height="62" rx="16" fill="#1D2420"/><rect x="138" y="108" width="36" height="62" rx="16" fill="#1D2420"/></svg>`;
}

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://example.com/products/wireless-headphones-pro-x</loc></url>
  <url><loc>http://example.com/electronics/headphones</loc></url>
</urlset>
`;

/** A plain page for every other internal link, so the link check sees 200. */
function plainPage(path: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Lumo</title><link rel="stylesheet" href="/lumo.css"></head><body><main class="main"><p>Lumo test page: ${path.replace(/[<>&"]/g, '')}</p></main></body></html>`;
}

/**
 * Site-wide files: robots.txt, llms.txt (none), sitemap.xml. Returns true when it answered.
 */
export function serveSiteFiles(path: string, res: ServerResponse, send: Send): boolean {
  if (path === '/robots.txt') {
    send(res, 200, SERPLINE_ROBOTS, 'text/plain; charset=utf-8');
    return true;
  }
  if (path === '/llms.txt') {
    send(res, 404, 'Not found');
    return true;
  }
  if (path === '/sitemap.xml') {
    send(res, 200, SITEMAP, 'application/xml');
    return true;
  }
  return false;
}

/**
 * Serpline pages. `prefix` is '' in serpline mode and '/seo' on the shop server; `path` has the
 * prefix removed. Always answers.
 */
export function serveSerpline(path: string, prefix: string, res: ServerResponse, send: Send): void {
  const page = (file: string) => {
    let body = readFileSync(join(PUBLIC, file), 'utf8');
    if (prefix) body = body.replace(/(href|src|content)="\/(?!\/)/g, `$1="${prefix}/`);
    send(res, 200, body, HTML);
  };
  const redirect = (to: string) => send(res, 301, '', 'text/plain', { location: prefix + to });

  if (serveSiteFiles(path, res, send)) return;
  if (path === '/lumo.css')
    return send(
      res,
      200,
      readFileSync(join(PUBLIC, '../lumo.css'), 'utf8'),
      'text/css; charset=utf-8',
    );
  if (path.startsWith('/serpline/')) {
    const name = path.slice('/serpline/'.length);
    if (!/^[\w.-]+$/.test(name)) return send(res, 404, 'Not found');
    const type = name.endsWith('.js')
      ? 'text/javascript; charset=utf-8'
      : name.endsWith('.css')
        ? 'text/css; charset=utf-8'
        : HTML;
    try {
      return send(res, 200, readFileSync(join(PUBLIC, name), 'utf8'), type);
    } catch {
      return send(res, 404, 'Not found');
    }
  }
  if (path.startsWith('/img/')) return send(res, 200, picture(path), 'image/svg+xml');
  if (path === '/products/wireless-headphones-pro-x') return page('product.html');
  if (path === '/electronics/headphones') return page('category.html');
  if (path === '/products/earbuds-mini-old') return send(res, 404, plainPage('Not found'), HTML);
  if (path === '/headphones') return redirect('/electronics/headphones');
  if (path === '/returns') return redirect('/help/returns');
  send(res, 200, plainPage(path), HTML);
}
