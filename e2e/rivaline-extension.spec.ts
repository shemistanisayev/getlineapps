/**
 * Rivaline extension, loaded through CDP and opened by a real toolbar click
 * (Extensions.triggerAction grants activeTab like a user click). Run `pnpm build` first.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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
    ).toEqual(['Stack13', 'Offer3', 'Ads4', 'Brand5']);
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

  test('Ads and Brand on Kova, and the brand kit exports (Ads, Brand, BrandExport)', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    await poll('13 tools in 8 categories');

    // Ads: the four searches are the core builders' output, the status pills follow the stack.
    await click('#rv-tab-ads');
    await poll('SEARCH FOR');
    const hrefs = await ext.evalIn<string[]>(
      PANEL,
      `[...document.querySelectorAll('.rv-lib a')].map((a) => a.href)`,
    );
    expect(hrefs).toEqual([
      'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=keyword_unordered&q=Kova',
      'https://adstransparency.google.com/?region=anywhere&domain=example.com',
      'https://library.tiktok.com/ads?region=all&adv_name=Kova',
      'https://www.linkedin.com/ad-library/search?accountOwner=Kova',
    ]);
    const ads = await panelText();
    for (const s of [
      'Meta Pixel on site',
      'Google Ads tag on site',
      'TikTok Pixel on site',
      'No LinkedIn Insight Tag',
    ])
      expect(ads).toContain(s);
    // Editing the brand and the country updates the links (nothing is saved).
    await ext.evalIn(
      PANEL,
      `(() => {
        const set = (el, v) => {
          const proto = Object.getPrototypeOf(el);
          Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
          el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
        };
        set(document.querySelector('.rv-field input'), 'Kova Skin');
        set(document.querySelector('.rv-field select'), 'DE');
      })()`,
      true,
    );
    await expect
      .poll(() => ext.evalIn<string>(PANEL, `document.querySelector('.rv-lib a').href`))
      .toContain('country=DE&search_type=keyword_unordered&q=Kova+Skin');
    expect(await ext.evalIn<string>(PANEL, `document.querySelectorAll('.rv-lib a')[2].href`)).toBe(
      'https://library.tiktok.com/ads?region=DE&adv_name=Kova+Skin',
    );
    await shot('panel-ads');

    // Brand: the 5 Kova colors, Fraunces and DM Sans from Google Fonts, the main button, the logo.
    await click('#rv-tab-brand');
    await poll('Click a color to copy');
    const brand = await panelText();
    for (const hex of ['#2F5D46', '#1E2B24', '#F6F1EA', '#EBC56B', '#DCE5D8'])
      expect(brand).toContain(hex);
    expect(brand).toMatch(/Primary\s+#2F5D46/);
    expect(brand).toMatch(/Accent\s+#EBC56B/);
    expect(brand).toMatch(/Headings\s+Fraunces\s+600, 52 px\s+Google Fonts/);
    expect(brand).toMatch(/Body\s+DM Sans\s+400, 16 px\s+Google Fonts/);
    expect(brand).toContain('Shop the routine');
    expect(brand).toContain('radius 999px, height 50px');
    expect(brand).toContain('DM Sans 600, 15px');
    // The logo is cropped from the visible tab.
    const logo = await ext.evalIn<{ w: number; h: number }>(
      PANEL,
      `(async () => { const img = document.querySelector('.rv-logobox img'); await img.decode(); return { w: img.naturalWidth, h: img.naturalHeight }; })()`,
    );
    expect(logo.w).toBeGreaterThan(40);
    expect(logo.h).toBeGreaterThan(15);
    // ...and it really shows the logo: Kova's dark wordmark, not an empty piece of the header.
    const dark = await ext.evalIn<number>(
      PANEL,
      `(() => {
        const img = document.querySelector('.rv-logobox img');
        const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 300) n++;
        return n / (d.length / 4);
      })()`,
    );
    expect(dark).toBeGreaterThan(0.05);
    await shot('panel-brand');

    // Export: catch what the Download buttons save, then check each file.
    await ext.evalIn(
      PANEL,
      `(() => {
        window.__saved = [];
        const make = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (b) => { window.__saved.push(b); return make(b); };
        HTMLAnchorElement.prototype.click = function () { window.__names = [...(window.__names || []), this.download]; };
      })()`,
    );
    await clickText('.rp-export button', 'CSS variables');
    await poll('Export brand kit');
    await new Promise((r) => setTimeout(r, 500));
    await shot('panel-export');
    await clickText('.rv-sheet button', 'Download kova.css');
    await clickText('.rv-seg button', 'JSON');
    await clickText('.rv-sheet button', 'Download kova-brand.json');
    await clickText('.rv-seg button', 'PNG palette');
    await expect
      .poll(() => ext.evalIn<boolean>(PANEL, `Boolean(document.querySelector('.rp-palette'))`))
      .toBe(true);
    await clickText('.rv-sheet button', 'Download kova-palette.png');
    const saved = await ext.evalIn<{
      names: string[];
      css: string;
      json: Record<string, unknown>;
      png: { type: string; w: number; h: number };
    }>(
      PANEL,
      `(async () => {
        const blobs = window.__saved.filter((b) => ['text/css', 'application/json', 'image/png'].includes(b.type));
        const find = (t) => blobs.filter((b) => b.type === t).pop();
        const png = find('image/png');
        const bmp = await createImageBitmap(png);
        return {
          names: window.__names,
          css: await find('text/css').text(),
          json: JSON.parse(await find('application/json').text()),
          png: { type: png.type, w: bmp.width, h: bmp.height },
        };
      })()`,
    );
    expect(saved.names).toEqual(['kova.css', 'kova-brand.json', 'kova-palette.png']);
    expect(saved.css).toContain('--kova-primary: #2F5D46;');
    expect(saved.css).toContain('--kova-font-heading: "Fraunces", serif;');
    expect(saved.css).toContain('--kova-button-radius: 999px;');
    expect(saved.json).toMatchObject({
      brand: 'kova',
      colors: { primary: '#2F5D46', accent: '#EBC56B' },
      fonts: { body: '"DM Sans", sans-serif' },
    });
    expect(saved.png).toEqual({ type: 'image/png', w: 1200, h: 400 });
    await kova.close();
  });

  test('Report PDF: rivaline-report-<host>-<date>.pdf with the Kova stack (design: Report)', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    await click('#rv-tab-stack');
    await poll('13 tools in 8 categories');
    await ext.evalIn(
      PANEL,
      `(() => {
        window.__pdf = [];
        const make = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (b) => { if (b.type === 'application/pdf') window.__pdf.push(b); return make(b); };
        HTMLAnchorElement.prototype.click = function () { window.__pdfName = this.download; };
      })()`,
    );
    expect(await ext.evalIn<boolean>(PANEL, `document.querySelector('.rv-pdf').disabled`)).toBe(
      false,
    );
    await click('.rv-pdf');
    await poll('PDF saved: rivaline-report-example.com-');
    const pdf = await ext.evalIn<{ name: string; head: string; size: number }>(
      PANEL,
      `(async () => {
        const b = window.__pdf[0];
        return { name: window.__pdfName, head: await b.slice(0, 5).text(), size: b.size };
      })()`,
    );
    expect(pdf.name).toMatch(/^rivaline-report-example\.com-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(pdf.head).toBe('%PDF-');
    expect(pdf.size).toBeGreaterThan(20_000);
    await kova.close();
  });

  test('Offer tab on Kova: what they say, offers, channels, markets, leads (1.1)', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    await expect
      .poll(() => ext.evalIn<boolean>(PANEL, `Boolean(document.querySelector('#rv-tab-offer'))`))
      .toBe(true);
    await click('#rv-tab-stack');
    await poll('13 tools in 8 categories');
    await click('#rv-tab-offer');
    await poll('Page language');
    const text = await panelText();
    for (const s of [
      'Free shipping over $40. Easy 30-day returns.',
      'Skincare that keeps it simple.',
      'Three steps, gentle formulas, made in small batches.',
      'Shop the routine',
      'Kova | Skincare that keeps it simple',
      'or 3 payments with Klarna',
      'Get 10% off your first order with code WELCOME10',
      '$24 to $42, 3 prices',
      'kova.skin',
      '@kova.skin',
      '@kovaskin',
      'com.example.kova',
      'hello@example.com',
      'English',
      'German',
      'Germany, United Kingdom, United States',
      'USD',
      'Mailchimp',
      'Intercom',
    ])
      expect(text, s).toContain(s);
    expect(text).toMatch(/Free delivery\s*Returns/);
    // A share link is not a profile; links open the profile in a new tab.
    const links = await ext.evalIn<Array<[string, string]>>(
      PANEL,
      `[...document.querySelectorAll('.rp-link a')].map((a) => [a.getAttribute('aria-label'), a.href])`,
    );
    expect(links).toEqual([
      ['Open Instagram', 'https://www.instagram.com/kova.skin'],
      ['Open TikTok', 'https://www.tiktok.com/@kova.skin'],
      ['Open YouTube', 'https://www.youtube.com/@kovaskin'],
      ['Open Pinterest', 'https://www.pinterest.com/kovaskin'],
      ['Open App Store', 'https://apps.apple.com/app/id1234567890'],
      ['Open Google Play', 'https://play.google.com/store/apps/details?id=com.example.kova'],
    ]);
    expect(
      await ext.evalIn<string[]>(
        PANEL,
        `[...document.querySelectorAll('.rp-link a')].map((a) => a.target + ' ' + a.rel)`,
      ),
    ).toEqual(Array(6).fill('_blank noopener noreferrer'));
    // Copy the promo code.
    await ext.evalIn(
      PANEL,
      `navigator.clipboard.writeText = (v) => { window.__copied = v; return Promise.resolve(); }; true`,
    );
    await click('[aria-label="Copy code WELCOME10"]');
    await poll('Code copied');
    expect(await ext.evalIn<string>(PANEL, 'window.__copied')).toBe('WELCOME10');
    // Narrow side panel: nothing scrolls sideways at 280 px.
    expect(
      await ext.evalIn<number>(PANEL, 'document.documentElement.scrollWidth', false, {
        width: 280,
        height: 700,
      }),
    ).toBeLessThanOrEqual(280);
    await shot('panel-offer');
    if (SHOTS)
      await ext.screenshot(PANEL, `${SHOTS}/rivaline-panel-offer-full.png`, {
        width: 380,
        height: 2000,
      });
    await kova.close();
  });

  test('tab switches: Access, a click, cache by tab, Empty on Mira Studio', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    // The panel keeps the tab the user picked (Brand, from the test before): go back to Stack.
    await click('#rv-tab-stack');
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
    ).toEqual(['Stack0', 'Offer0', 'Ads4', expect.stringMatching(/^Brand\d$/)]);
    await shot('panel-empty');
    await kova.close();
    await glow.close();
  });

  test('Settings: country default, shortcut, language switch, clear (design: Settings)', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    await click('#rv-tab-stack');
    await poll('13 tools in 8 categories');

    await click('[aria-label="Settings"]');
    await poll('Default country');
    const text = await panelText();
    expect(text).toMatch(/Keyboard shortcut\s*Alt\s*Shift\s*V/);
    expect(text).toContain('Only these settings are saved, and only on this computer.');
    const links = await ext.evalIn<string[]>(
      PANEL,
      `[...document.querySelectorAll('a')].map((a) => a.href)`,
    );
    expect(links).toEqual([
      'https://getlineapps.com/hitline?utm_source=rivaline&utm_medium=extension&utm_campaign=more_tools',
      'https://getlineapps.com/serpline?utm_source=rivaline&utm_medium=extension&utm_campaign=more_tools',
      'https://getlineapps.com/foldline?utm_source=rivaline&utm_medium=extension&utm_campaign=more_tools',
      'https://getlineapps.com/markline?utm_source=rivaline&utm_medium=extension&utm_campaign=more_tools',
      'https://getlineapps.com/privacy/rivaline',
      'https://shamistanisayev.com/?utm_source=rivaline&utm_medium=extension&utm_campaign=settings',
    ]);
    await shot('panel-settings');

    // Default country: saved, and the Ads tab starts from it.
    const pick = (id: string, value: string) =>
      ext.evalIn(
        PANEL,
        `(() => { const el = document.getElementById(${JSON.stringify(id)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('change', { bubbles: true })); })()`,
        true,
      );
    await pick('rp-country', 'FR');
    await expect
      .poll(() =>
        ext.evalIn<unknown>(PANEL, `chrome.storage.local.get('country').then((r) => r.country)`),
      )
      .toBe('FR');
    await click('[aria-label="Back to results"]');
    await click('#rv-tab-ads');
    await expect
      .poll(() => ext.evalIn<string>(PANEL, `document.querySelector('.rv-lib a')?.href ?? ''`))
      .toContain('country=FR');
    expect(await ext.evalIn<string>(PANEL, `document.querySelectorAll('.rv-lib a')[2].href`)).toBe(
      'https://library.tiktok.com/ads?region=FR&adv_name=Kova',
    );

    // Language: every panel string changes to Azerbaijani.
    await click('#rv-tab-stack');
    await click('[aria-label="Settings"]');
    await pick('rp-lang', 'az');
    await poll('Ayarlar');
    await click('[aria-label="Nəticələrə qayıt"]');
    await poll('8 kateqoriyada 13 alət');
    const az = await panelText();
    expect(az).toContain('Shopify mağazası'.split(' ')[0]);
    expect(az).toContain('3 boşluq');
    expect(az).toContain('BU SƏHİFƏDƏ TAPILMADI');
    expect(az).toContain('Ana səhifə');
    for (const en of ['tools in', 'Not found', 'Home page', 'gaps', 'Get in touch', 'Advertising'])
      expect(az, en).not.toContain(en);
    expect(
      await ext.evalIn<number>(PANEL, 'document.documentElement.scrollWidth', false, {
        width: 280,
        height: 700,
      }),
    ).toBeLessThanOrEqual(280);
    await shot('panel-stack-az');
    await click('#rv-tab-offer');
    await poll('Səhifənin dili');
    const azOffer = await panelText();
    expect(azOffer).toContain('Pulsuz çatdırılma');
    // Azerbaijani number format: "US$ 24" with a no-break space.
    expect(azOffer).toMatch(/US\$\s24 ilə US\$\s42 arası, 3 qiymət/);
    for (const en of [
      'What they say',
      'Offers',
      'Channels',
      'Markets',
      'Free delivery',
      'Page language',
    ])
      expect(azOffer.toLowerCase(), en).not.toContain(en.toLowerCase());
    expect(
      await ext.evalIn<number>(PANEL, 'document.documentElement.scrollWidth', false, {
        width: 280,
        height: 700,
      }),
    ).toBeLessThanOrEqual(280);
    await shot('panel-offer-az');
    await click('#rv-tab-brand');
    await poll('Kopyalamaq üçün rəngə bas');
    const azBrand = await panelText();
    for (const en of ['Click a color', 'Headings', 'Main button', 'Copy PNG'])
      expect(azBrand, en).not.toContain(en);

    // Clear all settings: back to English and all countries.
    await click('[aria-label="Ayarlar"]');
    await clickText('button', 'Bütün ayarları sil');
    await poll('All settings are cleared.');
    expect(
      await ext.evalIn<Record<string, unknown>>(PANEL, `chrome.storage.local.get(null)`),
    ).toEqual({});
    await click('[aria-label="Back to results"]');
    await click('#rv-tab-stack');
    await poll('13 tools in 8 categories');
    await kova.close();
  });

  test('accessibility: every panel view passes axe (WCAG 2.1 A and AA)', async () => {
    // Playwright cannot reach the side panel, so axe-core is injected over CDP and run there.
    const req = createRequire(createRequire(import.meta.url).resolve('@axe-core/playwright'));
    const axeSource = readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8');
    const axe = async (view: string) => {
      // Runtime.evaluate runs the source directly (the panel's CSP forbids eval in page code).
      if (!(await ext.evalIn<boolean>(PANEL, 'Boolean(window.axe)')))
        await ext.evalIn(PANEL, `${axeSource};true`);
      // No transitions while axe measures colors.
      await ext.evalIn(
        PANEL,
        `document.getElementById('no-motion') || document.head.append(Object.assign(document.createElement('style'), { id: 'no-motion', textContent: '*{transition:none!important;animation:none!important}' }))`,
      );
      const r = await ext.evalIn<{ passes: number; violations: string[] }>(
        PANEL,
        `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
           .then((r) => ({
             passes: r.passes.length,
             violations: r.violations.map((x) => x.id + ': ' + x.nodes.map((n) => n.target.join(' ') + ' [' + (n.any[0]?.message ?? '') + '] ' + n.html.slice(0, 120)).join(', ')),
           }))`,
      );
      // axe really ran (color contrast, names, roles ... pass) and found nothing.
      expect(r.passes, view).toBeGreaterThan(10);
      expect(r.violations, view).toEqual([]);
    };

    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    await ext.clickAction(kova);
    await expect
      .poll(() => ext.evalIn<boolean>(PANEL, `Boolean(document.querySelector('#rv-tab-stack'))`))
      .toBe(true);
    await click('#rv-tab-stack');
    await poll('13 tools in 8 categories');
    await axe('stack');
    await clickText('.rv-trow', 'Meta Pixel');
    await poll('How Rivaline found it');
    await axe('stack detail');
    await click('#rv-tab-offer');
    await poll('Page language');
    await axe('offer');
    await click('#rv-tab-ads');
    await poll('Meta Ad Library');
    await axe('ads');
    await click('#rv-tab-brand');
    await poll('From the page header');
    await axe('brand');
    await clickText('.rp-export button', 'CSS variables');
    await poll('Export brand kit');
    await axe('export');
    await click('.rv-sheet [aria-label="Close"]');
    await click('[aria-label="Settings"]');
    await poll('Default country');
    await axe('settings');
    await click('[aria-label="Back to results"]');

    const mira = await ext.context.newPage();
    await mira.goto(miraUrl());
    await mira.bringToFront();
    await poll('Read this tab?');
    await axe('access');
    await ext.clickAction(mira);
    await click('#rv-tab-stack');
    await poll('No marketing tools found');
    await axe('empty');
    await mira.goto('chrome://version');
    await ext.clickAction(mira);
    await poll("Rivaline can't read this page");
    await axe('restricted');
    await kova.close();
    await mira.close();
  });

  test('a pop-up over the logo: no screenshot of the pop-up, the SVG logo instead (QA)', async () => {
    const kova = await ext.context.newPage();
    await kova.goto(kovaUrl());
    // A cookie banner drawn over the header, like HubSpot's in QA.
    const cover = () =>
      kova.evaluate(() => {
        const d = document.createElement('div');
        d.style.cssText =
          'position:fixed;top:0;left:0;right:0;height:120px;background:#222;z-index:99';
        document.body.append(d);
      });
    await cover();
    await ext.clickAction(kova);
    await expect
      .poll(() => ext.evalIn<boolean>(PANEL, `Boolean(document.querySelector('#rv-tab-brand'))`))
      .toBe(true);
    await click('#rv-tab-brand');
    await poll('A pop-up covers the logo. Close it on the page and press Read the page again');
    expect(
      await ext.evalIn<number>(PANEL, `document.querySelectorAll('.rp-logo img').length`),
    ).toBe(0);

    // The same banner over an inline SVG logo (umico.az in QA): the panel draws the SVG itself.
    await kova.reload();
    await kova.evaluate(() => {
      const a = document.querySelector('header a[href="/"]')!;
      a.innerHTML =
        '<svg viewBox="0 0 90 30" width="90" height="30" fill="currentColor" style="color:#2f5d46"><rect width="90" height="30" rx="6"/></svg>';
    });
    await cover();
    await ext.clickAction(kova);
    await poll('Copy SVG');
    const px = await ext.evalIn<{ w: number; h: number; green: boolean }>(
      PANEL,
      `(async () => {
        const img = document.querySelector('.rp-logo img');
        await img.decode();
        const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
        const x = c.getContext('2d');
        x.drawImage(img, 0, 0);
        const [r, g, b, a] = x.getImageData(img.naturalWidth / 2, img.naturalHeight / 2, 1, 1).data;
        return { w: img.naturalWidth, h: img.naturalHeight, green: a > 200 && g > r && g > b };
      })()`,
    );
    // Twice the logo's size, in its own color (currentColor), not the dark banner.
    expect(px).toEqual({ w: 180, h: 60, green: true });
    await kova.close();
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
