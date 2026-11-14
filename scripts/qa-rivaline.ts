/**
 * Rivaline QA on real public sites (docs/rivaline-SPEC.md Phase 10): loads the built extension in
 * a real window, opens each URL in front, clicks the toolbar icon and saves, per site, to
 * test-results/qa-rivaline/:
 *   <site>.txt          the text of the Stack, Ads and Brand tabs
 *   <site>.json         the stack with every match's evidence, and the brand kit (same functions
 *                       the panel runs), to check each finding for false positives
 *   <site>-stack.png, <site>-brand.png
 *
 *   pnpm --filter @line/rivaline-extension build
 *   pnpm exec tsx scripts/qa-rivaline.ts https://example.com/ https://another.example/
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  GLOBAL_PATHS,
  KEY_VALUE_PATHS,
  SELECTORS,
  VALUE_PATHS,
  analyzeStack,
  brandKit,
  siteInfo,
  type BrandRaw,
  type SiteRaw,
  type PageSnapshot,
} from '../packages/core/src/rivaline/index.ts';
import { collectBrand } from '../apps/rivaline/extension/src/capture/brand.ts';
import { collectSite } from '../apps/rivaline/extension/src/capture/site.ts';
import { collectSnapshot } from '../apps/rivaline/extension/src/capture/snapshot.ts';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'test-results/qa-rivaline');
mkdirSync(out, { recursive: true });
const urls = process.argv.slice(2);
if (!urls.length) throw new Error('Pass one or more URLs');

const PANEL = 'sidepanel.html';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** tsx keeps function names with a `__name` helper the page does not have: give it one. */
const inPage = (fn: (...a: never[]) => unknown, arg?: unknown) =>
  `(() => { var __name = (f) => f; return (${fn.toString()})(${arg === undefined ? '' : JSON.stringify(arg)}); })()`;

const ext = await loadExtensionCdp('rivaline', { port: 9337, realWindow: true });
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
    const name = new URL(url).host.replace(/^www\./, '');
    const page = await ext.context.newPage();
    await page.bringToFront();
    const report: string[] = [`URL: ${url}`];
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45_000 });
      await wait(3000);
      await ext.clickAction(page);
      await until(
        (s) =>
          /tools? in \d+ categor|No marketing tools found|can't read|Read this tab/.test(s) &&
          !s.includes('Reading this page'),
      );
      await ext.evalIn(PANEL, `document.querySelector('#rv-tab-stack')?.click()`, true);
      await wait(300);
      report.push(`\n===== STACK =====\n${await text()}`);
      await ext.screenshot(PANEL, join(out, `${name}-stack.png`));
      await ext.evalIn(PANEL, `document.querySelector('#rv-tab-ads')?.click()`, true);
      await wait(300);
      report.push(`\n===== ADS =====\n${await text()}`);
      await ext.evalIn(PANEL, `document.querySelector('#rv-tab-brand')?.click()`, true);
      await wait(600);
      report.push(`\n===== BRAND =====\n${await text()}`);
      await ext.screenshot(PANEL, join(out, `${name}-brand.png`));

      // The same reads the panel did, kept with their evidence for review.
      const snap = (await page.evaluate(
        inPage(collectSnapshot, {
          globals: GLOBAL_PATHS,
          values: VALUE_PATHS,
          keyValues: [...KEY_VALUE_PATHS],
          selectors: SELECTORS,
        }),
      )) as PageSnapshot;
      const raw = (await page.evaluate(inPage(collectBrand))) as BrandRaw;
      const stack = analyzeStack(snap);
      const siteRaw = (await page.evaluate(inPage(collectSite))) as SiteRaw;
      writeFileSync(
        join(out, `${name}.json`),
        JSON.stringify(
          {
            url: snap.url,
            resources: snap.resources.length,
            resourcesFull: snap.resourcesFull,
            tools: stack.tools.map((t) => ({
              id: t.id,
              category: t.category,
              label: t.label,
              evidence: t.evidence.map((e) => `${e.kind}: ${e.value}`),
            })),
            gaps: stack.gaps,
            summary: { ...stack.summary, marks: stack.summary.marks.map((m) => m.id) },
            brand: brandKit(raw),
            site: siteInfo(siteRaw, stack),
          },
          null,
          2,
        ),
      );
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
