/**
 * Hitline popup (Faza 3, step 6). The popup's own probe function runs in the real Lumo shop
 * (as executeScript would), and its result is handed to the popup page (window.__HITLINE_POPUP__),
 * because Playwright cannot click the toolbar icon that grants activeTab.
 */
import { expect, test, type Page } from '@playwright/test';
import { hostResolverArgs, routeVendors, shopUrl } from '../apps/fixture/hosts.ts';
import { popupProbe } from '../apps/hitline/extension/src/popup/probe.ts';
import type { PopupProbe } from '../packages/core/src/hitline/index.ts';
import { loadExtension, requireBuilt, type LoadedExtension } from './extension.ts';

const SHOTS = process.env.SHOTS_DIR;

test.describe('hitline popup', () => {
  test.describe.configure({ mode: 'serial' });
  let ext: LoadedExtension;

  test.beforeAll(async () => {
    requireBuilt('hitline');
    ext = await loadExtension('hitline', hostResolverArgs());
    await routeVendors(ext.context);
    await ext.worker.evaluate(() => chrome.storage.local.clear());
  });
  test.afterAll(async () => {
    test.setTimeout(60_000);
    await ext?.close();
  });

  async function shopProbe(run: 'events' | 'consent'): Promise<PopupProbe> {
    const shop = await ext.context.newPage();
    await shop.goto(shopUrl(`/products/wireless-headphones-pro-x?run=${run}`));
    await expect(shop.locator('body')).toHaveAttribute('data-load', 'done');
    if (run === 'events') {
      await shop.getByRole('button', { name: 'Add to cart' }).click();
      await expect(shop.locator('body')).toHaveAttribute('data-add', 'done');
    } else {
      await shop.getByRole('button', { name: 'Reject all' }).click();
      await expect(shop.locator('body')).toHaveAttribute('data-reject', 'done');
    }
    await shop.waitForTimeout(300);
    const probe = await shop.evaluate(popupProbe);
    await shop.close();
    return probe;
  }

  async function openPopup(probe: PopupProbe | 'restricted'): Promise<Page> {
    const page = await ext.context.newPage();
    await page.addInitScript((p) => {
      (window as unknown as { __HITLINE_POPUP__: unknown }).__HITLINE_POPUP__ = p;
    }, probe);
    await page.setViewportSize({ width: 372, height: 640 });
    await page.goto(ext.url('popup.html'));
    return page;
  }

  test('main view on the "events" run: sGTM, tiles, the value issue, contact link', async () => {
    const probe = await shopProbe('events');
    expect(probe.url).toBe('http://example.com/products/wireless-headphones-pro-x?run=events');
    const page = await openPopup(probe);
    await expect(page.locator('.site-bar')).toContainText('example.com');
    const hero = page.locator('.hero');
    await expect(hero).toContainText('Server-side GTM detected');
    await expect(hero).toContainText('GA4 goes through data.example.com');
    await expect(page.locator('.tile')).toHaveText([
      /GA4\s*3 events/,
      /Google Ads\s*1 event/,
      /Meta Pixel\s*1 issue/,
      /TikTok Pixel\s*2 events/,
    ]);
    await expect(page.locator('.issues')).toContainText('1 issue found');
    await expect(page.locator('.issues li')).toHaveText([
      '1Meta AddToCart is sent without a value',
    ]);
    // Latest events, newest first; one opens its details and the DevTools how-to.
    const event = page.locator('.pev').filter({ hasText: 'AddToCart' }).first();
    await event.getByRole('button').click();
    await event.getByRole('button', { name: 'Show in DevTools' }).click();
    await expect(page.getByRole('dialog')).toContainText('Choose the Hitline tab');
    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(page.getByRole('button', { name: 'Open in DevTools' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get in touch' })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=panel_cta',
    );
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-popup-main.png`, fullPage: true });
    await page.close();
  });

  test('"consent" run: proves TikTok fires after rejection from the URL order', async () => {
    const page = await openPopup(await shopProbe('consent'));
    await expect(page.locator('.issues li')).toHaveText([
      /TikTok Pixel still fires after cookies are rejected/,
    ]);
    await expect(page.locator('.tile.is-bad')).toHaveText([/TikTok Pixel\s*1 issue/]);
    await page.close();
  });

  test('no tracking, and a page Chrome does not let extensions read', async () => {
    const empty = await openPopup({
      url: 'https://example.org/',
      resources: [{ name: 'https://example.org/app.js', startTime: 10 }],
      dataLayer: [],
      dataLayerLength: 0,
      gtmIds: [],
      cmp: [],
      cookies: {},
    });
    await expect(empty.getByText('No tracking on this page')).toBeVisible();
    await expect(empty.getByText(/found none on example\.org\./)).toBeVisible();
    await expect(empty.locator('.chips .pill')).toHaveCount(7);
    await empty.evaluate(() => document.fonts.ready);
    if (SHOTS) await empty.screenshot({ path: `${SHOTS}/hitline-popup-empty.png`, fullPage: true });
    await empty.close();

    const locked = await openPopup('restricted');
    await expect(locked.getByText('Hitline can’t read this page')).toBeVisible();
    await locked.close();
  });

  test('popup summary PDF downloads', async () => {
    const page = await openPopup(await shopProbe('events'));
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download audit PDF' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^hitline-audit-example\.com-\d{4}-\d{2}-\d{2}\.pdf$/,
    );
    await page.close();
  });

  test('settings: domains, plan, language, links, clear', async () => {
    const page = await openPopup({
      url: 'https://example.com/',
      resources: [],
      dataLayer: [],
      dataLayerLength: 0,
      gtmIds: [],
      cmp: [],
      cookies: {},
    });
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.locator('.dom')).toHaveText([/example\.com/]);

    await page.getByRole('button', { name: '+ Add domain' }).click();
    await page.getByRole('textbox', { name: 'Domain to add' }).fill('not a domain');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(/Enter a domain like example\.com\./);
    await page
      .getByRole('textbox', { name: 'Domain to add' })
      .fill('https://pay.example.net/checkout');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('.dom')).toHaveText([/example\.com/, /pay\.example\.net/]);
    expect(
      await ext.worker.evaluate(async () => (await chrome.storage.local.get('domains')).domains),
    ).toEqual(['example.com', 'pay.example.net']);

    await page.locator('input[type=file]').setInputFiles({
      name: 'lumo-tracking-plan.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('event,platform,parameters\npage_view,GA4,"page_location"\n'),
    });
    await expect(page.locator('.plan-name')).toHaveText(/lumo-tracking-plan\.csv\s*1 event$/);

    const tools = page.locator('a.tool');
    await expect(tools).toHaveCount(4);
    await expect(tools.first()).toHaveAttribute(
      'href',
      'https://getlineapps.com/serpline?utm_source=hitline&utm_medium=extension&utm_campaign=more_tools',
    );
    await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      'https://getlineapps.com/privacy/hitline',
    );
    await expect(page.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=settings',
    );
    // Custom platform: a name and a URL text, saved as customRules.
    await page.getByRole('button', { name: '+ Add custom platform' }).click();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Acme');
    await page.getByRole('textbox', { name: 'URL contains' }).fill('ab');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(/at least 3 characters/);
    await page.getByRole('textbox', { name: 'URL contains' }).fill('collect.acme.io');
    await page.getByRole('textbox', { name: 'Event name field (optional)' }).fill('action');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('.rule')).toContainText('collect.acme.io');
    expect(
      await ext.worker.evaluate(
        async () => (await chrome.storage.local.get('customRules')).customRules,
      ),
    ).toEqual([{ name: 'Acme', match: 'collect.acme.io', event: 'action' }]);
    await page.getByRole('button', { name: 'Remove Acme' }).click();
    await expect(page.locator('.rule')).toHaveCount(0);

    await expect(page.locator('.set-foot')).toContainText('Version 1.2.0');
    await page.evaluate(() => document.fonts.ready);
    if (SHOTS)
      await page.screenshot({ path: `${SHOTS}/hitline-popup-settings.png`, fullPage: true });

    await page.getByRole('combobox', { name: 'Language' }).selectOption('az');
    await expect(page.getByRole('heading', { name: 'Ayarlar' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
    await page.getByRole('button', { name: 'Bütün ayarları təmizlə' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(/All settings are cleared\./);
    expect(await ext.worker.evaluate(() => chrome.storage.local.get(null))).toEqual({});
    await page.close();
  });
});
