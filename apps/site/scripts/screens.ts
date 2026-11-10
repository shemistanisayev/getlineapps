/**
 * Full-page screenshots of the site at 1440, 820 and 390 px for phase reports.
 * Needs a running preview: pnpm --filter @line/site preview
 * Run: pnpm --filter @line/site screens  (writes to test-results/site-screens/)
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://localhost:4321';
const out = resolve(process.cwd(), '../../test-results/site-screens');
const widths = [1440, 820, 390];
const pages = (process.env.PAGES ?? '/,/az,/privacy/hitline,/az/privacy/markline,/404')
  .split(',')
  .filter(Boolean);

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const width of widths) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const name =
      (path === '/' ? 'hub' : path.replace(/^\//, '').replace(/\//g, '-')) + `-${width}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    console.log(`${name}${overflow > 0 ? `  HORIZONTAL OVERFLOW ${overflow}px` : ''}`);
  }
  await ctx.close();
}
await browser.close();
