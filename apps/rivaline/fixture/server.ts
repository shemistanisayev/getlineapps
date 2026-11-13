/**
 * Rivaline fixture server (no dependencies). Routes by Host header (hosts.ts):
 * Kova, Glowbar and Mira Studio from design/rivaline/SitePage.dc.html, plus a small PDF for the
 * Restricted test. Vendor scripts are answered by Playwright (vendors.ts), not by this server.
 */
import { readFileSync } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RIVALINE_PORT, siteForHost } from './hosts.ts';

const PUBLIC = fileURLToPath(new URL('./public/', import.meta.url));
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

function send(res: ServerResponse, status: number, body: string | Buffer, type = 'text/plain') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

function file(res: ServerResponse, name: string) {
  try {
    send(res, 200, readFileSync(join(PUBLIC, name)), TYPES[extname(name)] ?? 'text/plain');
  } catch {
    send(res, 404, 'Not found');
  }
}

export const createFixtureServer = () =>
  createServer((req, res) => {
    const host = (req.headers.host ?? '').split(':')[0]!.toLowerCase();
    const { pathname } = new URL(req.url ?? '/', `http://${host}`);
    const site = siteForHost(host);
    if (!site) return send(res, 404, 'Unknown host');
    if (pathname === '/favicon.ico') return send(res, 204, '');
    if (pathname === '/__rivaline') return send(res, 200, 'ok');
    if (pathname === '/catalog.pdf') return file(res, 'catalog.pdf');
    if (pathname.endsWith('.css')) return file(res, pathname.slice(1));
    // Every page path of a site serves its one page (collections, products ...).
    return file(res, `${site}.html`);
  });

// `pnpm start` runs this file; scripts import createFixtureServer and listen themselves.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createFixtureServer().listen(RIVALINE_PORT, () => {
    console.log(`Rivaline fixture on http://localhost:${RIVALINE_PORT}`);
  });
}
