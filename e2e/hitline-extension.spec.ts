/** Hitline extension, loaded unpacked from apps/hitline/extension/.output (run `pnpm build` first). */
import { expect, test } from '@playwright/test';
import { loadExtension, readManifest, requireBuilt, type LoadedExtension } from './extension.ts';

const SHOTS = process.env.SHOTS_DIR;

test.describe('hitline extension', () => {
  test.describe.configure({ mode: 'serial' });
  let ext: LoadedExtension;

  test.beforeAll(async () => {
    requireBuilt('hitline');
    ext = await loadExtension('hitline');
  });
  test.afterAll(async () => ext?.close());

  test('manifest has exactly the SPEC permissions and no host access', () => {
    const m = readManifest('hitline');
    expect(m.manifest_version).toBe(3);
    expect(m.name).toBe('Hitline');
    expect(m.permissions).toEqual(['activeTab', 'scripting', 'storage']);
    expect(m.devtools_page).toBe('devtools.html');
    for (const key of [
      'host_permissions',
      'optional_permissions',
      'optional_host_permissions',
      'content_scripts',
    ]) {
      expect(m[key]).toBeUndefined();
    }
    expect(String(m.description).length).toBeLessThanOrEqual(132);
  });

  test('install opens the welcome page', async () => {
    const welcome =
      ext.context.pages().find((p) => p.url().endsWith('/welcome.html')) ??
      (await ext.context.waitForEvent('page', {
        predicate: (p) => p.url().endsWith('/welcome.html'),
      }));
    await expect(welcome.getByRole('heading', { level: 1 })).toHaveText(
      'Hitline is ready.Every hit, in plain sight.',
    );
    await expect(welcome.getByRole('heading', { level: 2 })).toHaveText([
      'Pin Hitline to the toolbar',
      'Open any site, click the icon',
      'Press F12 and choose the Hitline tab',
    ]);
    await expect(welcome.getByRole('link', { name: /Get in touch/ })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=welcome',
    );
    await welcome.setViewportSize({ width: 1440, height: 900 });
    await welcome.evaluate(() => document.fonts.ready);
    if (SHOTS) await welcome.screenshot({ path: `${SHOTS}/hitline-welcome.png` });
    const installedAt = await ext.worker.evaluate(async () => {
      const { installedAt } = await chrome.storage.local.get('installedAt');
      return installedAt;
    });
    expect(typeof installedAt).toBe('number');
  });

  test('devtools page creates the "Hitline" panel', async () => {
    const page = await ext.context.newPage();
    // DevTools UI cannot be driven by Playwright: stub chrome.devtools and check the call.
    await page.addInitScript(() => {
      const calls: unknown[][] = [];
      (window as unknown as { __panels: unknown[][] }).__panels = calls;
      const devtools = { panels: { create: (...args: unknown[]) => calls.push(args) } };
      // WXT's `browser` is globalThis.browser when it has runtime.id, else chrome.
      (window as unknown as { browser: unknown }).browser = {
        runtime: { id: chrome.runtime.id },
        devtools,
      };
    });
    await page.goto(ext.url('devtools.html'));
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __panels: unknown[][] }).__panels))
      .toEqual([['Hitline', '/icon-32.png', '/devtools-panel.html']]);
    await page.close();
  });

  test('panel renders header, 5 tabs and the first-open state', async () => {
    const page = await ext.context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 560 });
    await page.goto(ext.url('devtools-panel.html'));
    await expect(page.getByRole('img', { name: 'Hitline' })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveText([
      /Events/,
      /GTM/,
      /Consent/,
      /Attribution/,
      /Plan/,
    ]);
    await expect(page.getByRole('tab', { name: /Events/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('tab', { name: /GTM/ }).click();
    await expect(page.getByRole('tab', { name: /GTM/ })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: /Events/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Reload the page to start recording' }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('800 20px "Plus Jakarta Sans"'))).toBe(
      true,
    );
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-panel.png` });
    expect(errors).toEqual([]);
    await page.close();
  });

  test('popup renders and follows the language setting', async () => {
    const page = await ext.context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 372, height: 200 });
    await page.goto(ext.url('popup.html'));
    await expect(page.getByRole('img', { name: 'Hitline' })).toBeVisible();
    await expect(page.getByText('press F12, open the Hitline tab')).toBeVisible();
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-popup.png` });

    await page.evaluate(() => chrome.storage.local.set({ lang: 'az' }));
    await expect(page.getByText('F12 bas, Hitline tabını aç')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/hitline-popup-az.png` });
    await page.evaluate(() => chrome.storage.local.remove('lang'));

    // No request leaves the extension: fonts and icons are bundled.
    const external = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((r) => r.name)
        .filter((n) => !n.startsWith('chrome-extension://')),
    );
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
    await page.close();
  });
});
