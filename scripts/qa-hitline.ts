/**
 * Hitline QA on real sites (docs/hitline/QA.md). Browses each site like a visitor, records the
 * session with the panel's own capture code (scripts/qa-hitline-lib.ts) and the popup's probe,
 * and writes <out>/<site>.session.json, <site>.popup.json and step screenshots.
 * No purchase, no bet, no login: every flow stops before anything is sent.
 *
 *   pnpm exec tsx scripts/qa-hitline.ts <outDir> [site ...]
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { popupProbe, POPUP_GLOBALS } from '../apps/hitline/extension/src/popup/probe.ts';
import { declineCookies, pause, record } from './qa-hitline-lib.ts';

const [outDir = 'qa-out', ...only] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

type Log = (msg: string) => void;
type Flow = (page: Page, shot: (name: string) => Promise<void>, log: Log) => Promise<void>;

async function clickFirst(
  page: Page,
  selectors: string[],
  log: Log,
  what: string,
): Promise<boolean> {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.click({ timeout: 8000 }).catch(async () => {
        // A chat bubble or a sticky bar covers it: click it the way the page's own script would.
        log(`  covered, clicking through the element: ${sel}`);
        await el.evaluate((n) => (n as HTMLElement).click()).catch(() => {});
      });
      log(`  ${what}: ${sel}`);
      return true;
    }
  }
  log(`  ${what}: not found`);
  return false;
}

async function go(page: Page, url: string, log: Log) {
  log(`goto ${url}`);
  await page
    .goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    .catch((e: Error) => log(`  ${e.message.split('\n')[0]}`));
  await pause(page, 4000);
  const banner = await declineCookies(page);
  if (banner) log(`  cookie banner: declined (${banner})`);
}

/** Category -> product -> add to cart -> cart -> checkout button (no order). */
function shop(
  start: string,
  category: string,
  product: string[],
  addToCart: string[],
  cart: string,
  checkout: string[],
  /** A modal to answer first (city picker, ...). */
  prep: string[] = [],
): Flow {
  return async (page, shot, log) => {
    await go(page, start, log);
    await shot('1-home');
    await go(page, category, log);
    await shot('2-category');
    const before = page.url();
    if (await clickFirst(page, product, log, 'product')) {
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await pause(page, 5000);
      if (page.url() === before) {
        // The link sits in a carousel that ignores clicks: open it like a visitor would.
        const href = await page
          .locator(product[0]!)
          .first()
          .getAttribute('href')
          .catch(() => null);
        if (href) await go(page, new URL(href, before).href, log);
      }
      log(`  on ${page.url()}`);
      await shot('3-product');
      await clickFirst(page, addToCart, log, 'add to cart');
      if (prep.length) {
        // The shop asks something first (the city): answer, then add again.
        await pause(page, 2000);
        if (await clickFirst(page, prep, log, 'modal')) {
          await pause(page, 2000);
          await clickFirst(page, addToCart, log, 'add to cart again');
        }
      }
      await pause(page, 4000);
      await shot('4-added');
    }
    await go(page, cart, log);
    await shot('5-cart');
    if (await clickFirst(page, checkout, log, 'checkout')) {
      await pause(page, 6000);
      log(`  on ${page.url()}`);
      await shot('6-checkout');
    }
  };
}

const ADD = [
  ':is(button, a):visible:text-is("Səbətə əlavə et")',
  'button:has-text("Səbətə əlavə et")',
  'a:has-text("Səbətə əlavə et")',
  'button:has-text("Səbətə at")',
  'button:has-text("Səbətə")',
  'button:has-text("Add to cart")',
];
const CHECKOUT = [
  'button:has-text("Sifarişi rəsmiləşdir")',
  'a:has-text("Sifarişi rəsmiləşdir")',
  'button:has-text("Rəsmiləşdir")',
  'a:has-text("Rəsmiləşdir")',
  'button:has-text("Sifariş et")',
  'a:has-text("Sifariş et")',
  'button:has-text("Davam et")',
  'button:has-text("Checkout")',
];

const FLOWS: Record<string, Flow> = {
  irshad: shop(
    'https://irshad.az/az',
    'https://irshad.az/az/telefon-ve-aksesuarlar/mobil-telefonlar/samsung',
    ['a.product__name.product-link'],
    ['a.product__to-cart:visible', 'button.product__to-cart:visible', ...ADD],
    'https://irshad.az/az/sebet',
    CHECKOUT,
  ),
  kontakt: shop(
    'https://kontakt.az/',
    'https://kontakt.az/telefonlar/mobil-telefonlar',
    ['a.product-item-link', 'a[href*="kontakt.az/"][class*="product"]'],
    ['#product-addtocart-button', ...ADD],
    'https://kontakt.az/checkout/cart/',
    ['button[data-role="proceed-to-checkout"]', ...CHECKOUT],
  ),
  umico: shop(
    'https://umico.az/',
    'https://birmarket.az/categories/2-telefonlar-ve-aksessuarlar',
    ['a[href*="/product/"]'],
    ['button.AddToCart:has-text("Səbətə əlavə etmək")', ...ADD],
    'https://birmarket.az/cart',
    CHECKOUT,
    [
      'text="Şəhərinizi seçin" >> xpath=.. >> text="Bakı"',
      'span:text-is("Bakı"):visible >> nth=-1',
    ],
  ),
  misli: async (page, shot, log) => {
    await go(page, 'https://www.misli.az/', log);
    await shot('1-home');
    await go(page, 'https://www.misli.az/idman-novleri/futbol', log);
    await shot('2-football');
    // Pick one odd for the coupon, then stop before placing anything.
    // Pick two odds for the coupon (the smallest elements whose text is an odd), then stop.
    const picked = await page.evaluate(() => {
      const re = /^\d{1,2}\.\d{2}$/;
      const cells = [...document.querySelectorAll('body *')].filter(
        (el) =>
          el.children.length === 0 &&
          re.test((el.textContent ?? '').trim()) &&
          (el as HTMLElement).offsetParent,
      ) as HTMLElement[];
      const out: string[] = [];
      for (const el of [cells[0], cells[6]]) {
        if (!el) continue;
        (el.closest('button, a, [role=button], td, li, div') as HTMLElement | null)?.click();
        out.push(el.textContent ?? '');
      }
      return out;
    });
    log(`  odds clicked: ${picked.join(', ') || 'none'}`);
    await pause(page, 3000);
    await shot('3-coupon');
    await clickFirst(page, ['text=KUPONUM'], log, 'open coupon');
    await pause(page, 3000);
    await shot('4-coupon-open');
  },
  birbank: async (page, shot, log) => {
    for (const [i, url] of [
      'https://birbank.az/',
      'https://birbank.az/cards',
      'https://birbank.az/credits',
      'https://birbank.az/deposits',
    ].entries()) {
      await go(page, url, log);
      await shot(`${i + 1}-page`);
    }
  },
};

const sites = only.length ? only : Object.keys(FLOWS);
const channel = process.env.QA_CHANNEL ?? 'chrome';
// Iframes in the same process, so their requests (Floodlight, ...) reach the page's CDP session.
const args = ['--disable-features=IsolateOrigins,site-per-process'];
const browser = await chromium
  .launch({ channel, args, headless: process.env.QA_HEADLESS === '1' })
  .catch(() => chromium.launch({ channel: 'msedge', args, headless: false }));
for (const site of sites) {
  const lines: string[] = [];
  const log: Log = (m) => {
    lines.push(m);
    console.log(`[${site}] ${m}`);
  };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'az-AZ' });
  // tsx keeps function names with a __name helper; the popup probe is serialized into the page.
  await ctx.addInitScript('window.__name = function (f) { return f; };');
  const page = await ctx.newPage();
  const rec = await record(page);
  const shot = async (name: string) => {
    await page.screenshot({ path: join(outDir, `${site}-${name}.png`) }).catch(() => {});
  };
  try {
    await FLOWS[site]!(page, shot, log);
  } catch (e) {
    log(`flow error: ${(e as Error).message}`);
  }
  await pause(page, 3000);
  const popup = await page.evaluate(popupProbe, POPUP_GLOBALS).catch((e: Error) => {
    log(`popup probe failed: ${e.message}`);
    return null;
  });
  await rec.stop();
  writeFileSync(join(outDir, `${site}.session.json`), JSON.stringify(rec.session()));
  if (popup) writeFileSync(join(outDir, `${site}.popup.json`), JSON.stringify(popup));
  writeFileSync(join(outDir, `${site}.log.txt`), lines.join('\n'));
  await ctx.close();
}
await browser.close();
