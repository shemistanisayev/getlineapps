/**
 * Serpline extension, loaded through CDP and opened by a real toolbar click
 * (Extensions.triggerAction grants activeTab like a user click). Run `pnpm build` first.
 */
import { expect, test } from '@playwright/test';
import { hostResolverArgs, routeVendors, shopUrl } from '../apps/fixture/hosts.ts';
import { readManifest, requireBuilt } from './extension.ts';
import { loadExtensionCdp, type CdpExtension } from './extension-cdp.ts';

const SHOTS = process.env.SHOTS_DIR;
const PANEL = 'sidepanel.html';

test.describe('serpline extension', () => {
  test.describe.configure({ mode: 'serial' });
  let ext: CdpExtension;
  const panelText = () => ext.evalIn<string>(PANEL, "document.body?.innerText ?? ''");

  test.beforeAll(async () => {
    requireBuilt('serpline');
    ext = await loadExtensionCdp('serpline', { args: hostResolverArgs(), port: 9334 });
    await routeVendors(ext.context);
  });
  test.afterAll(async () => ext?.close());

  test('manifest has exactly the SPEC permissions and no host access', () => {
    const m = readManifest('serpline');
    expect(m.manifest_version).toBe(3);
    expect(m.name).toBe('Serpline: SEO Checker & AI Crawler Audit for Google, ChatGPT & More');
    expect(String(m.name).length).toBeLessThanOrEqual(75);
    expect(m.short_name).toBe('Serpline');
    expect(String(m.description).length).toBeLessThanOrEqual(132);
    expect(m.permissions).toEqual(['activeTab', 'scripting', 'sidePanel', 'storage']);
    expect(m.optional_host_permissions).toEqual(['https://*/*', 'http://*/*']);
    expect(m.side_panel).toEqual({ default_path: 'sidepanel.html' });
    expect(m.commands).toEqual({
      _execute_action: { suggested_key: { default: 'Alt+Shift+S' } },
    });
    for (const key of ['host_permissions', 'optional_permissions', 'content_scripts']) {
      expect(m[key]).toBeUndefined();
    }
  });

  test('install opens the welcome page', async () => {
    const welcome =
      ext.context.pages().find((p) => p.url().endsWith('/welcome.html')) ??
      (await ext.context.waitForEvent('page', {
        predicate: (p) => p.url().endsWith('/welcome.html'),
      }));
    await expect(welcome.getByRole('heading', { level: 1 })).toHaveText(
      'Serpline is ready.See what Google and AI see.',
    );
    await expect(welcome.getByRole('link', { name: /Get in touch/ })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=serpline&utm_medium=extension&utm_campaign=welcome',
    );
    if (SHOTS) {
      await welcome.setViewportSize({ width: 1440, height: 900 });
      await welcome.evaluate(() => document.fonts.ready);
      await welcome.screenshot({ path: `${SHOTS}/serpline-welcome.png` });
    }
  });

  test('icon click opens the side panel and reads the page, raw HTML and robots.txt', async () => {
    const page = await ext.context.newPage();
    await page.goto(shopUrl());
    await ext.clickAction(page);
    expect(await ext.hasPage(PANEL)).toBe(true);
    await expect.poll(panelText).toContain('Page read'.toUpperCase());
    const text = await panelText();
    expect(text).toContain('example.com/products/wireless-headphones-pro-x');
    expect(text).toMatch(/Raw HTML\s+HTTP 200/);
    expect(text).toMatch(/robots\.txt\s+HTTP 200/);
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-panel-read.png`);

    // Same tab, same site: the panel goes Stale; "Check this page" works (activeTab is kept).
    await page.goto(shopUrl('/electronics/headphones'));
    await expect.poll(panelText).toContain('You opened a new page');
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-panel-stale.png`);
    await ext.evalIn(
      PANEL,
      `[...document.querySelectorAll('button')].find((b) => b.textContent === 'Check this page').click()`,
      true,
    );
    await expect.poll(panelText).toContain('example.com/electronics/headphones');
    expect(await panelText()).not.toContain('You opened a new page');
    await page.close();
  });

  test('restricted pages get the "can\'t read this page" state', async () => {
    const page = await ext.context.newPage();
    await page.goto('chrome://version');
    await ext.clickAction(page);
    await expect.poll(panelText).toContain("Serpline can't read this page");
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-panel-restricted.png`);
    await page.close();
  });
});
