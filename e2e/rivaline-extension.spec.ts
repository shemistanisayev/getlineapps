/**
 * Rivaline extension, loaded through CDP and opened by a real toolbar click
 * (Extensions.triggerAction grants activeTab like a user click). Run `pnpm build` first.
 */
import { expect, test } from '@playwright/test';
import { glowUrl, kovaUrl, miraUrl, rivalineHostArgs } from '../apps/rivaline/fixture/hosts.ts';
import { readManifest, requireBuilt } from './extension.ts';
import { loadExtensionCdp, type CdpExtension } from './extension-cdp.ts';

const SHOTS = process.env.SHOTS_DIR;
const PANEL = 'sidepanel.html';

test.describe('rivaline extension', () => {
  test.describe.configure({ mode: 'serial' });
  let ext: CdpExtension;
  const panelText = () => ext.evalIn<string>(PANEL, "document.body?.innerText ?? ''");
  const shot = async (name: string) => {
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/rivaline-${name}.png`);
  };

  test.beforeAll(async () => {
    requireBuilt('rivaline');
    ext = await loadExtensionCdp('rivaline', { args: rivalineHostArgs(), port: 9335 });
  });
  test.afterAll(async () => ext?.close());

  test('manifest has exactly the SPEC permissions and no host access', () => {
    const m = readManifest('rivaline');
    expect(m.manifest_version).toBe(3);
    expect(m.name).toBe('Rivaline: Competitor Research for Meta, Google, TikTok Ads & More');
    expect(String(m.name).length).toBeLessThanOrEqual(75);
    expect(m.short_name).toBe('Rivaline');
    expect(String(m.description).length).toBeLessThanOrEqual(132);
    expect(m.minimum_chrome_version).toBe('116');
    expect(m.permissions).toEqual(['activeTab', 'scripting', 'storage', 'sidePanel']);
    expect(m.side_panel).toEqual({ default_path: 'sidepanel.html' });
    expect(m.commands).toEqual({
      _execute_action: { suggested_key: { default: 'Alt+Shift+V' } },
    });
    for (const key of [
      'host_permissions',
      'optional_host_permissions',
      'optional_permissions',
      'content_scripts',
    ]) {
      expect(m[key]).toBeUndefined();
    }
  });

  test('install opens the welcome page with the real shortcut', async () => {
    const welcome =
      ext.context.pages().find((p) => p.url().endsWith('/welcome.html')) ??
      (await ext.context.waitForEvent('page', {
        predicate: (p) => p.url().endsWith('/welcome.html'),
      }));
    await expect(welcome.getByRole('heading', { level: 1 })).toHaveText(
      'Rivaline is ready.Any site, one click.',
    );
    await expect(welcome.getByRole('link', { name: /Get in touch/ })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=rivaline&utm_medium=extension&utm_campaign=welcome',
    );
    await expect(welcome.locator('.steps kbd')).toHaveText(['Alt', 'Shift', 'V']);
    if (SHOTS) {
      await welcome.setViewportSize({ width: 1440, height: 900 });
      await welcome.evaluate(() => document.fonts.ready);
      await welcome.screenshot({ path: `${SHOTS}/rivaline-welcome.png` });
    }
  });

  test('icon click opens the side panel and reads the page in the MAIN world', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    expect(await ext.hasPage(PANEL)).toBe(true);
    await expect.poll(panelText).toContain('PAGE READ');
    expect(await panelText()).toContain('Kova | Skincare that keeps it simple');
    expect(await panelText()).toContain('example.com');
    await shot('panel-read');

    // Same tab, same site: activeTab is kept, the new page is read without a click.
    await kova.goto(kovaUrl('/collections/all'));
    await expect.poll(panelText).toContain('/collections/all');

    // Another tab, not clicked: Access with the real shortcut.
    const glow = await ext.context.newPage();
    await glow.goto(glowUrl());
    await glow.bringToFront();
    await expect.poll(panelText).toContain('Read this tab?');
    expect(await panelText()).toMatch(/Alt\s*Shift\s*V/);
    await shot('panel-access');

    // A click on that tab reads it.
    await ext.clickAction(glow);
    await expect.poll(panelText).toContain('Glowbar | Clean beauty');

    // Same tab, another site: the grant is gone, Access again.
    await glow.goto(miraUrl());
    await expect.poll(panelText).toContain('Read this tab?');
    await ext.clickAction(glow);
    await expect.poll(panelText).toContain('Mira Studio | Illustration');
    await kova.close();
    await glow.close();
  });

  test('Chrome pages and the PDF viewer get the Restricted state', async () => {
    const page = await ext.context.newPage();
    await page.goto('chrome://version');
    await ext.clickAction(page);
    await expect.poll(panelText).toContain("Rivaline can't read this page");
    await shot('panel-restricted');

    // Chrome's PDF viewer can be scripted, the probe's contentType catches it.
    await page.goto(kovaUrl('/catalog.pdf'));
    await page.waitForTimeout(1000);
    await ext.clickAction(page);
    await expect.poll(panelText).toContain("Rivaline can't read this page");
    await page.close();
  });
});
