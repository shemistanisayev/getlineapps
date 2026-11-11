/**
 * Serpline QA on real public sites (docs/serpline-SPEC.md Phase 10). Loads the built extension,
 * opens each page, clicks the icon (real activeTab), runs the link check, and records what the
 * panel shows: score, issues per tab, render numbers, bots, files. Read-only: the only requests are
 * the ones Serpline itself makes (the page, robots.txt, llms.txt, at most 100 same-site link checks).
 *
 *   pnpm --filter @line/serpline-extension build
 *   pnpm exec tsx scripts/qa-serpline.ts [url ...]
 * Writes test-results/qa-serpline/<host>.png (panel tabs) and results.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'test-results/qa-serpline');
mkdirSync(out, { recursive: true });

const urls = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      'https://shamistanisayev.com/',
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1',
      'https://todomvc.com/examples/react/dist/',
    ];

const PANEL = 'sidepanel.html';
const ext = await loadExtensionCdp('serpline', { port: 9336 });
const results: Record<string, unknown>[] = [];
try {
  const evalIn = <T = unknown>(expr: string, gesture = false) =>
    ext.evalIn<T>(PANEL, expr, gesture);
  const text = () => evalIn<string>("document.body?.innerText ?? ''");
  async function until(pred: (t: string) => boolean, ms = 30_000): Promise<string> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const t = await text().catch(() => '');
      if (pred(t)) return t;
      await new Promise((r) => setTimeout(r, 250));
    }
    return text();
  }
  const tab = (name: string) =>
    evalIn(
      `[...document.querySelectorAll('[role=tab]')].find((b) => b.textContent.startsWith(${JSON.stringify(name)}))?.click()`,
    );

  for (const url of urls) {
    const host = new URL(url).host;
    const page = await ext.context.newPage();
    const started = Date.now();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
    await ext.clickAction(page);
    await until((t) => t.includes('SEO score') || t.includes("can't read"));
    const readMs = Date.now() - started;
    await tab('Summary');
    const summary = await until((t) => t.includes('SEO score'));
    await ext.screenshot(PANEL, join(out, `${host}-summary.png`), {
      width: 400,
      height: 900,
      scale: 1,
    });

    // Link check (same site, at most 100 URLs).
    await tab('Links');
    const before = await until((t) => /Check \d+ internal link|No internal links/.test(t), 10_000);
    let links = before;
    const t0 = Date.now();
    if (/Check \d+ internal link/.test(before)) {
      await evalIn(
        `[...document.querySelectorAll('button')].find((b) => /^Check \\d+ internal link/.test(b.textContent))?.click()`,
        true,
      );
      links = await until((t) => /internal links? checked|could not run/.test(t), 120_000);
    }
    const linkMs = Date.now() - t0;
    await ext.screenshot(PANEL, join(out, `${host}-links.png`), {
      width: 400,
      height: 900,
      scale: 1,
    });

    const tabs: Record<string, string> = {};
    for (const name of ['Summary', 'Headings', 'Render', 'AI']) {
      await tab(name);
      await new Promise((r) => setTimeout(r, 400));
      tabs[name] = await text();
      if (name !== 'Summary')
        await ext.screenshot(PANEL, join(out, `${host}-${name.toLowerCase()}.png`), {
          width: 400,
          height: 900,
          scale: 1,
        });
    }
    const badges = await evalIn<string[]>(
      `[...document.querySelectorAll('[role=tab]')].map((b) => b.textContent)`,
    );
    results.push({ url, readMs, linkMs, badges, summary, links, tabs });
    console.log(`${host}: read ${readMs} ms, links ${linkMs} ms, tabs ${badges.join(' | ')}`);
    await page.close();
  }
} finally {
  await ext.close();
}
writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2));
console.log(`Wrote ${join(out, 'results.json')}`);
