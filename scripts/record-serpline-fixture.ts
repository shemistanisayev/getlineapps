/**
 * Records the Serpline fixture for the core tests (packages/core/fixtures/serpline): the raw HTML,
 * the rendered HTML after JavaScript and the internal link results, read in a real browser from
 * the Serpline-mode fixture server, the same way the extension reads them.
 *
 *   pnpm --filter @line/fixture start:serpline      (in another terminal)
 *   pnpm tsx scripts/record-serpline-fixture.ts
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { hostResolverArgs, SERPLINE_PORT, serplineUrl } from '../apps/fixture/hosts.ts';
import {
  extractHtml,
  planLinkCheck,
  type LinkResult,
} from '../packages/core/src/serpline/index.ts';
import { Window } from 'happy-dom';

const OUT = fileURLToPath(new URL('../packages/core/fixtures/serpline/', import.meta.url));

async function launch() {
  const args = hostResolverArgs(SERPLINE_PORT);
  try {
    return await chromium.launch({ args });
  } catch {
    // Chromium for Testing does not start on some Windows machines; Edge reads pages the same way.
    return await chromium.launch({ args, channel: 'msedge' });
  }
}

// DOMParser for the planner (Node has none).
const win = new Window();
(globalThis as unknown as { DOMParser: unknown }).DOMParser = win.DOMParser;

const browser = await launch();
const page = await browser.newPage();
const url = serplineUrl();
await page.goto(url);
await page.waitForSelector('h1');
await page.waitForFunction(
  () => document.querySelectorAll('script[type="application/ld+json"]').length > 1,
);

const rendered = await page.evaluate(
  () => '<!doctype html>\n' + document.documentElement.outerHTML,
);
const raw = await page.evaluate(async () =>
  (await fetch(location.href, { cache: 'no-store' })).text(),
);
const urls = planLinkCheck(extractHtml(rendered, url));
const links: LinkResult[] = await page.evaluate(async (list) => {
  const out = [];
  for (const u of list) {
    let r = await fetch(u, { method: 'HEAD', redirect: 'follow', cache: 'no-store' });
    if (r.status === 405)
      r = await fetch(u, { method: 'GET', redirect: 'follow', cache: 'no-store' });
    out.push({ url: u, status: r.status, redirected: r.redirected, finalUrl: r.url });
  }
  return out;
}, urls);
await browser.close();

writeFileSync(OUT + 'lumo-raw.html', raw);
writeFileSync(OUT + 'lumo-rendered.html', rendered + '\n');
writeFileSync(OUT + 'lumo-links.json', JSON.stringify(links, null, 2) + '\n');
console.log(
  `Recorded ${url}: raw ${raw.length} B, rendered ${rendered.length} B, ${links.length} link results`,
);
