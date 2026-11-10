// Lighthouse (mobile) on the built site, using Playwright's Chromium.
// Needs a running preview: pnpm --filter @line/site preview. Run: pnpm lighthouse [paths...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const base = process.env.SITE_URL ?? 'http://localhost:4321';
const args = process.argv.slice(2);
const paths = args.length ? args : ['/', '/az', '/privacy/hitline', '/404'];
const port = 9223;
mkdirSync('test-results/lh', { recursive: true });
const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
let fail = false;
for (const p of paths) {
  const res = await lighthouse(base + p, { port, output: 'html', logLevel: 'error' }, undefined);
  if (!res) throw new Error(`No Lighthouse result for ${p}`);
  const r = res.lhr;
  writeFileSync(`test-results/lh/${p.replace(/\W+/g, '_') || 'root'}.html`, res.report);
  const cats = Object.values(r.categories);
  if (cats.some((c) => (c.score ?? 0) < 0.95)) fail = true;
  const a = r.audits;
  console.log(
    `${p}: ${cats.map((c) => `${c.id} ${Math.round((c.score ?? 0) * 100)}`).join(', ')} | LCP ${a['largest-contentful-paint'].displayValue}, TBT ${a['total-blocking-time'].displayValue}, CLS ${a['cumulative-layout-shift'].displayValue}`,
  );
  for (const [id, x] of Object.entries(a))
    if (x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary')
      console.log(`   fails: ${id}`);
}
await browser.close();
process.exit(fail ? 1 : 0);
