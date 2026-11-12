/**
 * Serpline QA on real public sites (docs/serpline-SPEC.md Phase 10): loads the built extension,
 * opens each URL in front, clicks the toolbar icon, runs the link check and saves the text of every
 * tab plus a Speed screenshot to test-results/qa-serpline/. Read the files to find false positives.
 *
 *   pnpm --filter @line/serpline-extension build
 *   pnpm exec tsx scripts/qa-serpline.ts https://example.com/ https://another.example/page
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'test-results/qa-serpline');
mkdirSync(out, { recursive: true });
const urls = process.argv.slice(2);
if (!urls.length) throw new Error('Pass one or more URLs');

const PANEL = 'sidepanel.html';
const TABS = ['summary', 'headings', 'links', 'render', 'speed', 'ai'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ext = await loadExtensionCdp('serpline', { port: 9336 });
const text = () => ext.evalIn<string>(PANEL, "document.body?.innerText ?? ''");
async function until(test: (s: string) => boolean, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const s = await text().catch(() => '');
    if (test(s)) return s;
    await wait(300);
  }
  return text();
}

try {
  for (const url of urls) {
    const name =
      new URL(url).host.replace(/^www\./, '') + new URL(url).pathname.replace(/\W+/g, '-');
    const page = await ext.context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.bringToFront();
    const report: string[] = [`URL: ${url}`];
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45_000 });
      await wait(3000);
      await ext.clickAction(page);
      await until(
        (s) => /SEO score|can't read|couldn't read/i.test(s) && !s.includes('Reading this page'),
      );
      await ext.evalIn(PANEL, `document.querySelector('#sl-tab-links')?.click()`, true);
      await ext.evalIn(
        PANEL,
        `[...document.querySelectorAll('button')].find((b) => /^Check \\d+ internal link/.test(b.textContent))?.click()`,
        true,
      );
      await until((s) => /internal links? checked|No internal links|could not run/.test(s), 90_000);
      for (const id of TABS) {
        await ext.evalIn(PANEL, `document.querySelector('#sl-tab-${id}')?.click()`, true);
        await wait(400);
        report.push(`\n===== ${id.toUpperCase()} =====\n${await text()}`);
        if (id === 'speed') await ext.screenshot(PANEL, join(out, `${name}-speed.png`));
      }
    } catch (e) {
      report.push(`ERROR: ${String((e as Error)?.message ?? e)}`);
    }
    writeFileSync(join(out, `${name}.txt`), report.join('\n'));
    console.log(`done ${url}`);
    await page.close();
  }
} finally {
  await ext.close();
}
