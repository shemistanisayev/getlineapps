/**
 * Records the Rivaline fixture for the core tests (packages/core/fixtures/rivaline): the page
 * snapshot and the brand data of Kova, Glowbar and Mira Studio, read in a real browser with the
 * extension's own collectSnapshot and collectBrand. Vendor URLs are answered locally.
 *
 *   pnpm tsx scripts/record-rivaline-fixture.ts  (Kova also gets its site read for the 1.1 Offer tab)
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  GLOBAL_PATHS,
  KEY_VALUE_PATHS,
  SELECTORS,
  VALUE_PATHS,
} from '../packages/core/src/rivaline/index.ts';
import { collectBrand } from '../apps/rivaline/extension/src/capture/brand.ts';
import { collectSite } from '../apps/rivaline/extension/src/capture/site.ts';
import { collectSnapshot } from '../apps/rivaline/extension/src/capture/snapshot.ts';
import {
  RIVALINE_PORT,
  glowUrl,
  kovaUrl,
  miraUrl,
  rivalineHostArgs,
} from '../apps/rivaline/fixture/hosts.ts';
import { createFixtureServer } from '../apps/rivaline/fixture/server.ts';
import { routeRivalineVendors } from '../apps/rivaline/fixture/vendors.ts';

const OUT = fileURLToPath(new URL('../packages/core/fixtures/rivaline/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const ARGS = {
  globals: GLOBAL_PATHS,
  values: VALUE_PATHS,
  keyValues: [...KEY_VALUE_PATHS],
  selectors: SELECTORS,
};

/** tsx keeps function names with a `__name` helper the page does not have: give it one. */
const inPage = (fn: (...a: never[]) => unknown, arg?: unknown) =>
  `(() => { var __name = (f) => f; return (${fn.toString()})(${arg === undefined ? '' : JSON.stringify(arg)}); })()`;

async function launch() {
  const args = rivalineHostArgs();
  try {
    return await chromium.launch({ args });
  } catch {
    // Chromium for Testing does not start on some Windows machines; Edge reads pages the same way.
    return await chromium.launch({ args, channel: 'msedge' });
  }
}

const server = createFixtureServer();
await new Promise<void>((ok) => server.listen(RIVALINE_PORT, ok));
const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1016, height: 808 } });
await routeRivalineVendors(context);

for (const [name, url, brand] of [
  ['kova', kovaUrl(), true],
  ['glow', glowUrl(), false],
  ['mira', miraUrl(), false],
] as const) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  const snap = await page.evaluate(inPage(collectSnapshot, ARGS));
  writeFileSync(`${OUT}${name}-snapshot.json`, `${JSON.stringify(snap, null, 2)}\n`);
  if (brand) {
    const raw = await page.evaluate(inPage(collectBrand));
    writeFileSync(`${OUT}${name}-brand.json`, `${JSON.stringify(raw, null, 2)}\n`);
    const site = await page.evaluate(inPage(collectSite));
    writeFileSync(`${OUT}${name}-site.json`, `${JSON.stringify(site, null, 2)}\n`);
  }
  console.log(`${name}: recorded`);
  await page.close();
}

await browser.close();
server.close();
