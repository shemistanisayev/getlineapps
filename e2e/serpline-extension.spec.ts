/**
 * Serpline extension, loaded through CDP and opened by a real toolbar click
 * (Extensions.triggerAction grants activeTab like a user click). Run `pnpm build` first.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { hostResolverArgs, SERPLINE_PORT, serplineUrl } from '../apps/fixture/hosts.ts';
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
    // The Serpline Lumo scenario (SPEC §10) at the design paths.
    ext = await loadExtensionCdp('serpline', { args: hostResolverArgs(SERPLINE_PORT), port: 9334 });
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
    await page.goto(serplineUrl());
    await ext.clickAction(page);
    expect(await ext.hasPage(PANEL)).toBe(true);
    // Summary (design: Main). 62 before the link check (PLAN decision 4).
    await expect.poll(panelText).toContain('SEO score: needs work');
    const text = await panelText();
    expect(text).toContain('example.com/products/wireless-headphones-pro-x');
    expect(text).toContain('2 high, 5 medium, 1 low priority issues');
    expect(
      await ext.evalIn(PANEL, `document.querySelector('.sl-ring').getAttribute('aria-label')`),
    ).toBe('SEO score 62 of 100');
    const rows = await ext.evalIn<string[]>(
      PANEL,
      `[...document.querySelectorAll('.sl-row')].map((r) => r.innerText.replace(/\\s+/g, ' ').trim())`,
    );
    expect(rows).toEqual([
      'Title 32 characters',
      'Meta description Cut off in Google',
      'Canonical Points to this page',
      'Robots meta index, follow',
      'H1 Only after JavaScript',
      'Image alt text 3 of 9 missing',
      'Structured data Product added by JavaScript',
      'Open Graph og:description missing',
      'hreflang Not used',
    ]);
    expect(text).toContain('Title: 32 characters, 318 of 600 px');
    expect(text).toContain('Description: 191 characters, cut after 107');
    expect(text).toContain(
      'Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once ...',
    );
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-summary.png`);

    const clickTab = (name: string) =>
      ext.evalIn(
        PANEL,
        `[...document.querySelectorAll('[role=tab]')].find((b) => b.textContent.startsWith(${JSON.stringify(name)})).click()`,
      );
    const clickButton = (name: string) =>
      ext.evalIn(
        PANEL,
        `[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith(${JSON.stringify(name)})).click()`,
        true,
      );

    // Headings (design: Headings) and the page overlay (design: SitePage, highlight on).
    await clickTab('Headings');
    await expect.poll(panelText).toContain('OUTLINE');
    const tiles = await ext.evalIn<string[]>(
      PANEL,
      `[...document.querySelectorAll('.sl-tile')].map((x) => x.innerText.replace(/\\s+/g, ' '))`,
    );
    expect(tiles).toEqual(['1 H1', '4 H2', '5 H3', '1 H4']);
    const outline = await panelText();
    expect(outline).toMatch(/Wireless Headphones Pro X\s+JavaScript only/);
    expect(outline).toMatch(/Bluetooth 5\.3\s+Skips H3/);
    expect(outline).toContain('3 of 9 without alt');
    for (const f of ['pro-x-side.jpg', 'pro-x-folded.jpg', 'pro-x-case.jpg'])
      expect(outline).toContain(f);
    await ext.evalIn(PANEL, `document.querySelector('[role=switch]').click()`, true);
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll('[data-serpline-overlay]').length))
      .toBe(1);
    expect(
      await ext.evalIn(
        PANEL,
        `document.querySelector('[role=switch]').getAttribute('aria-checked')`,
      ),
    ).toBe('true');
    if (SHOTS) {
      await ext.screenshot(PANEL, `${SHOTS}/serpline-headings.png`);
      await page.setViewportSize({ width: 1040, height: 820 });
      await page.screenshot({ path: `${SHOTS}/serpline-page-highlight.png` });
    }
    // The overlay is not part of what Serpline reads, and turning it off leaves no trace.
    await ext.evalIn(PANEL, `document.querySelector('[role=switch]').click()`, true);
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll('[data-serpline-overlay]').length))
      .toBe(0);

    // Links (design: Links): the check runs from the page, then the score drops to 56.
    await clickTab('Links');
    await expect.poll(panelText).toContain('Check 52 internal links');
    await clickButton('Check 52 internal links');
    await expect.poll(panelText, { timeout: 20_000 }).toContain('52 internal links checked');
    const links = await panelText();
    expect(links).toContain('49 OK, 2 redirects, 1 broken');
    expect(links).toMatch(/Earbuds Mini\s+\/products\/earbuds-mini-old\s+404/);
    expect(links).toContain('/headphones to /electronics/headphones');
    expect(links).toContain('/returns to /help/returns');
    expect(links).toContain('A link on this page leads to a 404');
    expect(links).toContain('2 links point to redirects');
    expect(await ext.evalIn(PANEL, `document.querySelector('.sp-chip.on').textContent`)).toBe(
      'Issues 3',
    );
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-links.png`);
    await clickTab('Summary');
    await expect.poll(panelText).toContain('2 high, 6 medium, 2 low priority issues');
    expect(
      await ext.evalIn(PANEL, `document.querySelector('.sl-ring').getAttribute('aria-label')`),
    ).toBe('SEO score 56 of 100');
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-summary-56.png`);

    // Audit PDF (design: Report): built in the panel from the extension's own fonts, saved through
    // a blob URL and <a download>. The test records what the page hands to the download.
    await ext.evalIn(
      PANEL,
      `(() => {
        window.__pdf = null;
        const make = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (blob) => { window.__pdfBlob = blob; return make(blob); };
        HTMLAnchorElement.prototype.click = function () {
          const blob = window.__pdfBlob;
          blob.arrayBuffer().then((b) => {
            window.__pdf = { name: this.download, size: b.byteLength, head: new TextDecoder().decode(b.slice(0, 5)) };
          });
        };
      })()`,
    );
    await clickButton('Audit PDF');
    await expect
      .poll(
        () =>
          ext.evalIn<{ name: string; size: number; head: string } | null>(PANEL, 'window.__pdf'),
        {
          timeout: 20_000,
        },
      )
      .toMatchObject({
        head: '%PDF-',
        name: expect.stringMatching(/^serpline-audit-example\.com-\d{4}-\d{2}-\d{2}\.pdf$/),
      });
    expect((await ext.evalIn<{ size: number }>(PANEL, 'window.__pdf')).size).toBeGreaterThan(
      20_000,
    );
    // The Google preview follows the device switch.
    await clickButton('Desktop');
    await expect.poll(panelText).toContain('Description: 191 characters, cut after 147');

    // Shell: page row, 5 tabs, dark footer CTA on Summary, lime CTA on Render and AI.
    const shell = () =>
      ext.evalIn<{
        tabs: string[];
        badges: string[];
        selected: string;
        footer: string;
        lime: string;
      }>(
        PANEL,
        `({
          tabs: [...document.querySelectorAll('[role=tab]')].map((b) => b.textContent),
          badges: [...document.querySelectorAll('[role=tab] [aria-label]')].map((b) => b.getAttribute('aria-label')),
          selected: document.querySelector('[role=tab][aria-selected=true]')?.textContent ?? '',
          footer: document.querySelector('.sl-footer')?.textContent ?? '',
          lime: document.querySelector('.sl-lime')?.textContent ?? '',
        })`,
      );
    // Badges: issues per tab, as in PanelHeader after the link check.
    expect(await shell()).toEqual({
      tabs: ['Summary', 'Headings2', 'Links2', 'Render3', 'AI1'],
      badges: ['2 issues', '2 issues', '3 issues', '1 issue'],
      selected: 'Summary',
      footer: 'Need help fixing these?Get in touch',
      lime: '',
    });
    expect(
      await ext.evalIn(PANEL, `document.querySelector('.sl-footer a').getAttribute('href')`),
    ).toBe(
      'https://shamistanisayev.com/?utm_source=serpline&utm_medium=extension&utm_campaign=panel_cta',
    );
    // Arrow keys move between tabs (Summary -> AI wraps to the end with ArrowLeft).
    await ext.evalIn(
      PANEL,
      `document.querySelector('[role=tab][aria-selected=true]').dispatchEvent(
         new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))`,
    );
    // textContent includes the badge: "AI" + "1".
    await expect.poll(async () => (await shell()).selected).toBe('AI1');
    expect(await shell()).toMatchObject({
      footer: '',
      lime: 'Want your site to show up in AI answers?Get in touch',
    });
    // AI (design: Ai): 13 bots, 10 allowed (PLAN decision 3), 7 shown and "6 more bots".
    const ai = await panelText();
    expect(ai).toContain('10/13');
    expect(ai).toContain('PerplexityBot is blocked');
    expect(ai).toContain(
      "Perplexity can't cite this site. The other answer engines can, but read only 38 of 412 words.",
    );
    expect(ai).toMatch(/User-agent: PerplexityBot\s+Disallow: \//);
    const botRows = () =>
      ext.evalIn<string[]>(
        PANEL,
        `[...document.querySelectorAll('.sl-brow')].map((r) => r.innerText.replace(/\\s+/g, ' ').trim())`,
      );
    // Every blocked bot shows its robots.txt line (SPEC §5); blocked bots are never folded away.
    expect(await botRows()).toEqual([
      'OAI-SearchBotChatGPT search Allowed',
      'Claude-SearchBotClaude search Allowed by *',
      'PerplexityBotPerplexity answers User-agent: PerplexityBot Disallow: / Blocked',
      'GPTBotOpenAI Allowed',
      'ClaudeBotAnthropic Allowed',
      'Google-ExtendedGemini Allowed',
      'CC CCBotCommon Crawl User-agent: CCBot Disallow: / Blocked',
      'BytespiderByteDance User-agent: Bytespider Disallow: / Blocked',
    ]);
    expect(ai).toContain('5 more bots');
    expect(ai).toMatch(/robots\.txt\s+Found, 38 lines/);
    expect(ai).toMatch(/sitemap\.xml\s+Listed in robots\.txt/);
    expect(ai).toMatch(/llms\.txt\s+Not found, optional/);
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-ai.png`);
    await clickButton('5 more bots');
    await expect.poll(async () => (await botRows()).length).toBe(13);

    // Render (design: Render).
    await clickTab('Render');
    await expect.poll(panelText).toContain('91% of the text needs JavaScript');
    const render = await panelText();
    expect(render).toContain('Raw HTML has 38 words. The rendered page has 412.');
    const table = await ext.evalIn<string[]>(
      PANEL,
      `[...document.querySelectorAll('.sp-cmp-row')].map((r) => [...r.children].map((c) => c.innerText.trim()).join(' | '))`,
    );
    expect(table).toEqual([
      'SIGNAL | RAW HTML | RENDERED',
      'Title | Same | Same',
      'Description | Same | Same',
      'Canonical | Same | Same',
      'H1 | None | 1',
      'Words | 38 | 412',
      'Links | 18 | 64',
      'JSON-LD | Breadcrumb | Breadcrumb, Product',
    ]);
    const code = await ext.evalIn<string>(PANEL, `document.querySelector('.sp-code').innerText`);
    expect(code.split('\n')).toEqual([
      '<h1>Wireless Headphones Pro X</h1>',
      '<script type="application/ld+json"> Product',
      '<section id="details"> 211 words',
      '<section id="reviews"> 20 links',
    ]);
    expect(await shell()).toMatchObject({
      footer: '',
      lime: 'Want server-side rendering set up for SEO?Get in touch',
    });
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-render.png`);

    // Same tab, same site: the panel goes Stale; "Check this page" works (activeTab is kept).
    await page.goto(serplineUrl('/electronics/headphones'));
    await expect.poll(panelText).toContain('You opened a new page');
    const stale = await panelText();
    expect(stale).toMatch(/56\s+Previous result\s+\/products\/wireless-headphones-pro-x/);
    expect(stale).toContain('WHAT SERPLINE CHECKS');
    expect(stale).toContain('Want a full technical SEO audit?');
    expect(await ext.evalIn(PANEL, `document.querySelectorAll('[role=tab]').length`)).toBe(0);
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-stale.png`);
    // The previous result card opens the old result again.
    await clickButton('56');
    await expect.poll(panelText).toContain('example.com/products/wireless-headphones-pro-x');
    await page.reload();
    await expect.poll(panelText).toContain('You opened a new page');
    await ext.evalIn(
      PANEL,
      `[...document.querySelectorAll('button')].find((b) => b.textContent === 'Check this page').click()`,
      true,
    );
    await expect.poll(panelText).toContain('example.com/electronics/headphones');
    expect(await panelText()).not.toContain('You opened a new page');
    await page.close();
  });

  test('Settings: preview default, language, links, clear all', async () => {
    const page = await ext.context.newPage();
    await page.goto(serplineUrl());
    await ext.clickAction(page);
    const click = (sel: string) =>
      ext.evalIn(PANEL, `document.querySelector(${JSON.stringify(sel)}).click()`, true);
    // The panel stays open across tests and keeps its tab: go back to Summary.
    await expect.poll(panelText).toContain('example.com/products/wireless-headphones-pro-x');
    await click('#sl-tab-summary');
    await expect.poll(panelText).toContain('SEO score: needs work');

    await click('button[aria-label="Settings"]');
    await expect.poll(panelText).toContain('Google preview opens on');
    const set = await panelText();
    for (const s of [
      'Check internal links on open',
      'Clear all settings',
      'MORE FREE TOOLS',
      'Version 1.0.0',
    ])
      expect(set).toContain(s);
    const hrefs = await ext.evalIn<string[]>(
      PANEL,
      `[...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))`,
    );
    expect(hrefs).toEqual([
      ...['hitline', 'rivaline', 'foldline', 'markline'].map(
        (s) =>
          `https://getlineapps.com/${s}?utm_source=serpline&utm_medium=extension&utm_campaign=more_tools`,
      ),
      'https://getlineapps.com/privacy/serpline',
      'https://shamistanisayev.com/?utm_source=serpline&utm_medium=extension&utm_campaign=settings',
    ]);
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-settings.png`);

    // Default preview device and language are saved in chrome.storage.local.
    await ext.evalIn(
      PANEL,
      `[...document.querySelectorAll('.sp-set button')].find((b) => b.textContent === 'Desktop').click()`,
      true,
    );
    await ext.evalIn(
      PANEL,
      `(() => { const s = document.querySelector('#sp-lang'); s.value = 'az'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`,
      true,
    );
    await expect.poll(panelText).toContain('Google önizləməsi bununla açılır');
    expect(
      await ext.evalIn(
        PANEL,
        `chrome.storage.local.get(null).then((x) => ({ lang: x.lang, previewDevice: x.previewDevice }))`,
      ),
    ).toEqual({ lang: 'az', previewDevice: 'desktop' });
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-settings-az.png`);

    // Every panel text follows the language.
    await click('button[aria-label="Nəticələrə qayıt"]');
    await expect.poll(panelText).toContain('SEO skoru: düzəliş lazımdır');
    const az = await panelText();
    for (const s of [
      'Xülasə',
      'Başlıqlar',
      'SƏHİFƏ YOXLAMALARI',
      'Description: 191 simvol, 147-dən sonra kəsilir',
    ])
      expect(az).toContain(s);
    expect(az).not.toContain('needs work');
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-summary-az.png`);

    // "Clear all settings" brings back English and the mobile preview.
    await click('button[aria-label="Ayarlar"]');
    await expect.poll(panelText).toContain('Bütün ayarları sil');
    await ext.evalIn(
      PANEL,
      `[...document.querySelectorAll('button')].find((b) => b.textContent === 'Bütün ayarları sil').click()`,
      true,
    );
    await expect.poll(panelText).toContain('All settings are cleared.');
    expect(await ext.evalIn(PANEL, `chrome.storage.local.get(null)`)).toEqual({});
    await click('button[aria-label="Back to results"]');
    await expect.poll(panelText).toContain('Description: 191 characters, cut after 107');
    await page.close();
  });

  test('accessibility: every panel view passes axe (WCAG 2.1 A and AA)', async () => {
    // Playwright cannot reach the side panel, so axe-core is injected over CDP and run there.
    const req = createRequire(createRequire(import.meta.url).resolve('@axe-core/playwright'));
    const axeSource = readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8');
    const axe = async (view: string) => {
      // Runtime.evaluate runs the source directly (the panel's CSP forbids eval in page code).
      if (!(await ext.evalIn<boolean>(PANEL, 'Boolean(window.axe)')))
        await ext.evalIn(PANEL, `${axeSource};true`);
      const r = await ext.evalIn<{ passes: number; violations: string[] }>(
        PANEL,
        `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
           .then((r) => ({
             passes: r.passes.length,
             violations: r.violations.map((x) => x.id + ': ' + x.nodes.map((n) => n.target.join(' ')).join(', ')),
           }))`,
      );
      // axe really ran (color contrast, names, roles ... pass) and found nothing.
      expect(r.passes, view).toBeGreaterThan(10);
      expect(r.violations, view).toEqual([]);
    };
    const click = (sel: string) =>
      ext.evalIn(PANEL, `document.querySelector(${JSON.stringify(sel)}).click()`, true);

    const page = await ext.context.newPage();
    await page.goto(serplineUrl());
    await ext.clickAction(page);
    await expect.poll(panelText).toContain('example.com/products/wireless-headphones-pro-x');
    // No transitions while axe measures colors.
    await ext.evalIn(
      PANEL,
      `document.head.append(Object.assign(document.createElement('style'), { textContent: '*{transition:none!important;animation:none!important}' }))`,
    );
    for (const id of ['summary', 'headings', 'links', 'render', 'ai']) {
      await click(`#sl-tab-${id}`);
      await expect
        .poll(() =>
          ext.evalIn(
            PANEL,
            `document.querySelector('#sl-tab-${id}').getAttribute('aria-selected')`,
          ),
        )
        .toBe('true');
      await axe(id);
    }
    await click('#sl-tab-links');
    await ext.evalIn(
      PANEL,
      `[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Check 52')).click()`,
      true,
    );
    await expect.poll(panelText, { timeout: 20_000 }).toContain('52 internal links checked');
    await axe('links after the check');
    await click('button[aria-label="Settings"]');
    await expect.poll(panelText).toContain('Google preview opens on');
    await axe('settings');
    await click('button[aria-label="Back to results"]');
    await page.goto(serplineUrl('/electronics/headphones'));
    await expect.poll(panelText).toContain('You opened a new page');
    await axe('stale');
    await page.close();
  });

  test('restricted pages get the "can\'t read this page" state', async () => {
    const page = await ext.context.newPage();
    await page.goto('chrome://version');
    await ext.clickAction(page);
    await expect.poll(panelText).toContain("Serpline can't read this page");
    // No "Check this page" there: Chrome never allows it.
    expect(await panelText()).not.toContain('Check this page');
    if (SHOTS) await ext.screenshot(PANEL, `${SHOTS}/serpline-panel-restricted.png`);
    await page.close();
  });
});
