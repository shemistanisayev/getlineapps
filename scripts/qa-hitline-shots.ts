/**
 * Replays the QA sessions (scripts/qa-hitline.ts) in the built Hitline panel and saves screenshots
 * of the Events and GTM tabs plus the audit PDF, so the owner can compare them with the sites.
 *   pnpm --filter @line/hitline-extension build
 *   pnpm exec tsx scripts/qa-hitline-shots.ts <outDir> [site ...]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadExtension } from '../e2e/extension.ts';

const [outDir = 'qa-out', ...only] = process.argv.slice(2);
const sites = only.length ? only : ['irshad', 'umico', 'misli', 'birbank'];
const ext = await loadExtension('hitline');
for (const site of sites) {
  const file = join(outDir, `${site}.session.json`);
  if (!existsSync(file)) continue;
  const session = JSON.parse(readFileSync(file, 'utf8')) as unknown;
  const page = await ext.context.newPage();
  await page.addInitScript((s) => {
    (window as unknown as { __HITLINE_REPLAY__: unknown }).__HITLINE_REPLAY__ = s;
  }, session);
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto(ext.url('devtools-panel.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, `panel-${site}-events.png`) });
  await page.getByRole('tab', { name: /GTM/ }).click();
  await page.screenshot({ path: join(outDir, `panel-${site}-gtm.png`) });
  const events = page.getByRole('tab', { name: /^Events/ }).last();
  if (await events.isVisible().catch(() => false)) {
    await events.click();
    await page.screenshot({ path: join(outDir, `panel-${site}-gtm-events.png`) });
  }
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Audit PDF' }).click(),
  ]);
  const chunks = (await (await download.createReadStream()).toArray()) as Buffer[];
  writeFileSync(join(outDir, `audit-${site}.pdf`), Buffer.concat(chunks));
  await page.close();
  console.log(`${site}: done`);
}
await ext.close();
