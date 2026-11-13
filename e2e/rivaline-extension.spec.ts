/**
 * Rivaline extension, loaded through CDP and opened by a real toolbar click
 * (Extensions.triggerAction grants activeTab like a user click). Run `pnpm build` first.
 */
import { expect, test } from '@playwright/test';
import { glowUrl, kovaUrl, miraUrl, rivalineHostArgs } from '../apps/rivaline/fixture/hosts.ts';
import { routeRivalineVendors } from '../apps/rivaline/fixture/vendors.ts';
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
    // Kova and Glowbar load real vendor URLs: answer them all locally.
    await routeRivalineVendors(ext.context);
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

  const poll = (text: string) =>
    expect.poll(panelText, { timeout: 20_000, intervals: [250] }).toContain(text);
  const click = (selector: string) =>
    ext.evalIn(PANEL, `document.querySelector(${JSON.stringify(selector)}).click()`, true);
  const clickText = (tag: string, text: string) =>
    ext.evalIn(
      PANEL,
      `[...document.querySelectorAll(${JSON.stringify(tag)})].find((e) => e.textContent.includes(${JSON.stringify(text)})).click()`,
      true,
    );

  test('icon click reads Kova: the Stack tab as in the design (Main, StackDetail)', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    expect(await ext.hasPage(PANEL)).toBe(true);
    // Reading steps first, then the result.
    await poll('13 tools in 8 categories');
    const text = await panelText();
    expect(text).toContain('Shopify store running Meta, TikTok, Google and Pinterest ads');
    expect(text).toContain('Home page');
    expect(text).toMatch(/3 gaps\s*: server-side tracking, consent banner, CRM/);
    for (const id of [
      '418273650912345',
      'C9H3KQ7RC77U2M0V5PLG',
      'AW-11284956',
      '2612345678901',
      'G-8XK2LM4QPZ',
      'site 3918274',
      'GTM-N4KV8R',
    ])
      expect(text).toContain(id);
    expect(text).toContain('NOT FOUND ON THIS PAGE');
    expect(text).toContain('All 4 ad pixels send straight from the browser.');
    // Header: Stack is current with its counts; Report PDF waits for step 8.
    expect(
      await ext.evalIn<string[]>(
        PANEL,
        `[...document.querySelectorAll('[role=tab]')].map((t) => t.textContent)`,
      ),
    ).toEqual(['Stack13', 'Ads4', 'Brand5']);
    expect(
      await ext.evalIn<string[]>(
        PANEL,
        `[...document.querySelectorAll('.rv-chip')].slice(0, 5).map((c) => c.textContent)`,
      ),
    ).toEqual(['All 13', 'Advertising 4', 'Analytics 2', 'Payments 2', 'Tag management 1']);
    await shot('panel-stack');

    // StackDetail: the Advertising chip filters, Meta Pixel opens with its evidence.
    await clickText('.rv-chip', 'Advertising');
    await clickText('.rv-trow', 'Meta Pixel');
    await poll('How Rivaline found it');
    const detail = await panelText();
    expect(detail).toMatch(/Script\s+connect\.facebook\.net\/en_US\/fbevents\.js/);
    expect(detail).toMatch(/Global\s+window\.fbq/);
    expect(detail).toMatch(/Cookie\s+_fbp/);
    expect(detail).toMatch(/Request\s+www\.facebook\.com\/tr/);
    expect(detail).not.toContain('Google Analytics 4');
    await shot('panel-stack-detail');
    // "Open in Meta Ad Library" goes to the Ads tab.
    await clickText('button', 'Open in Meta Ad Library');
    await expect
      .poll(() =>
        ext.evalIn<string>(
          PANEL,
          `document.querySelector('[role=tab][aria-selected=true]').textContent`,
        ),
      )
      .toBe('Ads4');
    await click('#rv-tab-stack');

    // Narrow side panel: nothing scrolls sideways at 280 px.
    expect(
      await ext.evalIn<number>(PANEL, 'document.documentElement.scrollWidth', false, {
        width: 280,
        height: 700,
      }),
    ).toBeLessThanOrEqual(280);
    if (SHOTS)
      await ext.screenshot(PANEL, `${SHOTS}/rivaline-panel-stack-280.png`, {
        width: 280,
        height: 700,
      });
    await kova.close();
  });

  test('tab switches: Access, a click, cache by tab, Empty on Mira Studio', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    await poll('13 tools in 8 categories');

    // Same tab, same site: activeTab is kept, the new page is read without a click.
    await kova.goto(kovaUrl('/collections/all'));
    await poll('/collections/all');

    // Another tab, not clicked: Access with the real shortcut, no current tab, no counts.
    const glow = await ext.context.newPage();
    await glow.goto(glowUrl());
    await glow.bringToFront();
    await poll('Read this tab?');
    expect(await panelText()).toMatch(/Alt\s*Shift\s*V/);
    expect(
      await ext.evalIn<number>(PANEL, `document.querySelectorAll('[aria-selected=true]').length`),
    ).toBe(0);
    expect(await ext.evalIn<boolean>(PANEL, `document.querySelector('.rv-pdf').disabled`)).toBe(
      true,
    );
    await shot('panel-access');

    // A click reads Glowbar: Cookiebot and Consent Mode, so no consent gap.
    await ext.clickAction(glow);
    await poll('5 tools in 5 categories');
    expect(await panelText()).toMatch(/2 gaps\s*: server-side tracking, CRM/);

    // Back to Kova: the cached result shows at once.
    await kova.bringToFront();
    await poll('13 tools in 8 categories');

    // Same tab, another site: the grant is gone (Access); a click reads Mira Studio: Empty.
    await glow.bringToFront();
    await glow.goto(miraUrl());
    await poll('Read this tab?');
    await ext.clickAction(glow);
    await poll('No marketing tools found');
    const empty = await panelText();
    expect(empty).toContain('No analytics, ad pixels, CRM or chat on example.org.');
    expect(empty).toMatch(/Read \d+ s after the page finished loading\./);
    expect(
      await ext.evalIn<string[]>(
        PANEL,
        `[...document.querySelectorAll('[role=tab]')].map((t) => t.textContent)`,
      ),
    ).toEqual(['Stack0', 'Ads4', expect.stringMatching(/^Brand\d$/)]);
    await shot('panel-empty');
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
