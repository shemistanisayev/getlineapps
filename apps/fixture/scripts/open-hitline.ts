/**
 * Opens the Lumo shop with the built Hitline extension, in a browser where example.com,
 * data.example.com and pay.example.net point to the local fixture and every vendor URL is
 * answered locally (no real tracking leaves the machine).
 *
 *   pnpm --filter @line/hitline-extension build
 *   pnpm --filter @line/fixture open:hitline            (run "events")
 *   pnpm --filter @line/fixture open:hitline consent    (or "journey")
 *
 * Press F12 in the shop tab and open the Hitline tab, then reload.
 */
import { chromium, type BrowserContext } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURE_PORT, hostResolverArgs, routeVendors, shopUrl } from '../hosts.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const ext = join(root, 'apps/hitline/extension/.output/chrome-mv3');
const run = process.argv[2] ?? 'events';

if (!existsSync(join(ext, 'manifest.json'))) {
  console.error('Build the extension first: pnpm --filter @line/hitline-extension build');
  process.exit(1);
}

async function serverUp(): Promise<boolean> {
  try {
    return (await fetch(`http://localhost:${FIXTURE_PORT}/__lumo/scenarios.json`)).ok;
  } catch {
    return false;
  }
}

if (!(await serverUp())) {
  const server = spawn(
    process.execPath,
    ['--import', 'tsx', join(root, 'apps/fixture/server.ts')],
    {
      stdio: 'inherit',
    },
  );
  process.on('exit', () => server.kill());
  for (let i = 0; i < 50 && !(await serverUp()); i++) await new Promise((r) => setTimeout(r, 100));
}

const args = [
  `--disable-extensions-except=${ext}`,
  `--load-extension=${ext}`,
  ...hostResolverArgs(),
];
const profile = mkdtempSync(join(tmpdir(), 'lumo-hitline-'));
let context: BrowserContext;
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: false,
    args,
  });
} catch {
  // Some Windows builds cannot start Chromium for Testing; Edge is Chromium too.
  context = await chromium.launchPersistentContext(profile, {
    channel: 'msedge',
    headless: false,
    args,
  });
}
await routeVendors(context);
const page = await context.newPage();
const path =
  run === 'journey'
    ? '/campaign/fall-sale?utm_source=google&utm_medium=cpc&utm_campaign=fall_sale&gclid=Cj0KCQiA2KitBhCIARIsAPPMEhJ'
    : `/products/wireless-headphones-pro-x?run=${run}`;
await page.goto(shopUrl(path));
console.log(`Lumo "${run}" run is open. Close the browser window to stop.`);
await new Promise<void>((resolve) => context.on('close', () => resolve()));
process.exit(0);
