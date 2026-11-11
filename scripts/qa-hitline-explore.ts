/** Helper for writing QA flows: prints the links and buttons of a page. Usage: tsx scripts/qa-hitline-explore.ts <url> [filter] */
import { chromium } from '@playwright/test';

const [url, filter = ''] = process.argv.slice(2);
const browser = await chromium
  .launch({ channel: process.env.QA_CHANNEL ?? 'chromium' })
  .catch(() => chromium.launch({ channel: 'msedge' }));
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'az-AZ' });
await page.goto(url!, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForTimeout(4000);
const items = await page.evaluate(() =>
  [...document.querySelectorAll('a, button, [role=button]')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
        href: (el as HTMLAnchorElement).href ?? '',
        cls: (el.getAttribute('class') ?? '').slice(0, 60),
        visible: r.width > 0 && r.height > 0,
      };
    })
    .filter((x) => x.visible && (x.text || x.href)),
);
const re = new RegExp(filter, 'i');
for (const x of items.filter((i) => re.test(`${i.text} ${i.href} ${i.cls}`)).slice(0, 120)) {
  console.log(`${x.tag}\t${x.text}\t${x.href}\t${x.cls}`);
}
console.log('URL', page.url(), 'TITLE', await page.title());
await browser.close();
