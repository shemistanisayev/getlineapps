/**
 * Lumo fixture server (no dependencies). Routes by Host header:
 * - example.com (and localhost): the shop
 * - data.example.com: a fake server-side GTM endpoint (204 + FPID cookie)
 * - pay.example.net: the payment page on another domain
 * - /seo/..., /robots.txt, /llms.txt, /sitemap.xml: the Serpline scenario (serpline.ts)
 *
 * `tsx server.ts --serpline` starts the Serpline mode on port 4401 instead: the same Serpline pages
 * at the design paths (docs/serpline/PLAN.md decision 1).
 */
import { createServer, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FPID_COOKIE,
  LUMO_DATE,
  LUMO_PLAN_CSV,
  LUMO_SCENARIOS,
} from '../../packages/core/fixtures/hitline/lumo.ts';
import { FIXTURE_PORT, SERPLINE_PORT } from './hosts.ts';
import { serveSerpline, serveSiteFiles } from './serpline.ts';

const SERPLINE_MODE = process.argv.includes('--serpline');

const PUBLIC = fileURLToPath(new URL('./public/', import.meta.url));
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function send(
  res: ServerResponse,
  status: number,
  body: string,
  type = 'text/plain',
  headers: Record<string, string> = {},
) {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', ...headers });
  res.end(body);
}

function file(res: ServerResponse, name: string) {
  try {
    send(res, 200, readFileSync(join(PUBLIC, name), 'utf8'), TYPES[extname(name)] ?? 'text/plain');
  } catch {
    send(res, 404, 'Not found');
  }
}

const server = createServer((req, res) => {
  const host = (req.headers.host ?? '').split(':')[0]!.toLowerCase();
  const url = new URL(req.url ?? '/', `http://${host}`);

  if (url.pathname === '/lumo.css') return file(res, 'lumo.css');
  if (url.pathname === '/favicon.ico') return send(res, 204, '');
  if (SERPLINE_MODE) return serveSerpline(url.pathname, '', res, send);
  if (url.pathname === '/seo' || url.pathname.startsWith('/seo/'))
    return serveSerpline(url.pathname.slice(4) || '/', '/seo', res, send);
  if (serveSiteFiles(url.pathname, res, send)) return;

  if (url.pathname === '/__lumo/scenarios.json') {
    return send(
      res,
      200,
      JSON.stringify({ date: LUMO_DATE, runs: LUMO_SCENARIOS }),
      TYPES['.json'],
    );
  }
  if (url.pathname === '/lumo-tracking-plan.csv')
    return send(res, 200, LUMO_PLAN_CSV, TYPES['.csv']);
  if (url.pathname === '/lumo.js' || url.pathname === '/lumo.css')
    return file(res, url.pathname.slice(1));
  if (url.pathname === '/favicon.ico') return send(res, 204, '');

  if (host.startsWith('data.')) {
    // Fake sGTM: accept GA4 hits and set the HttpOnly FPID cookie, like a real server container.
    if (url.pathname.endsWith('/g/collect')) {
      const granted = url.searchParams.get('gcs') === 'G111';
      return send(res, 204, '', 'text/plain', {
        ...(granted ? { 'set-cookie': FPID_COOKIE } : {}),
        'access-control-allow-origin': req.headers.origin ?? '*',
        'access-control-allow-credentials': 'true',
      });
    }
    return send(res, 404, 'Not found');
  }
  if (host.startsWith('pay.')) return file(res, 'pay.html');
  return file(res, 'shop.html');
});

const port = SERPLINE_MODE ? SERPLINE_PORT : FIXTURE_PORT;
server.listen(port, () => {
  console.log(
    `Lumo fixture${SERPLINE_MODE ? ' (Serpline)' : ''} on http://localhost:${port} (example.com via host rules)`,
  );
});
