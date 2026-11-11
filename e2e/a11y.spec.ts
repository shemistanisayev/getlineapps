/**
 * Accessibility (WCAG 2.1 A and AA, axe-core) on getlineapps.com pages and every Hitline screen.
 * Animations are reduced so contrast is measured on the final state, not mid-fade.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { lumoSession } from '../packages/core/fixtures/hitline/load.ts';
import { LUMO_PLAN_CSV } from '../packages/core/fixtures/hitline/lumo.ts';
import { parsePlanCsv } from '../packages/core/src/hitline/index.ts';
import { loadExtension, requireBuilt, type LoadedExtension } from './extension.ts';

const SITE = 'http://localhost:4321';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function violations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (include) builder = builder.include(include);
  const r = await builder.analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('a11y: getlineapps.com', () => {
  for (const path of [
    '/',
    '/hitline',
    '/az/hitline',
    '/hitline/uninstalled',
    '/serpline',
    '/az/serpline',
    '/serpline/uninstalled',
    '/privacy/hitline',
    '/404',
  ]) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${SITE}${path}`);
      await page.evaluate(() => document.fonts.ready);
      expect(await violations(page)).toEqual([]);
    });
  }

  test('/hitline sample audit dialog has no violations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${SITE}/hitline`);
    await page.getByRole('link', { name: 'See a sample audit' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await violations(page, '#sample-audit')).toEqual([]);
  });
});

test.describe('a11y: Hitline extension', () => {
  test.describe.configure({ mode: 'serial' });
  let ext: LoadedExtension;

  test.beforeAll(async () => {
    requireBuilt('hitline');
    ext = await loadExtension('hitline');
    const parsed = parsePlanCsv(LUMO_PLAN_CSV, 'lumo-tracking-plan.csv');
    if (!parsed.ok) throw new Error('plan');
    await ext.worker.evaluate((plans) => chrome.storage.local.set({ plans }), {
      'example.com': parsed.plan,
    });
  });
  test.afterAll(async () => {
    test.setTimeout(60_000);
    await ext?.close();
  });

  const runs = {
    events: 'Events',
    gtm: 'GTM',
    consent: 'Consent',
    journey: 'Attribution',
    plan: 'Plan',
  };
  for (const [tab, label] of Object.entries(runs)) {
    test(`panel ${label} tab`, async () => {
      const run = tab === 'consent' ? 'consent' : tab === 'journey' ? 'journey' : 'events';
      const page = await ext.context.newPage();
      await page.addInitScript((s) => {
        (window as unknown as { __HITLINE_REPLAY__: unknown }).__HITLINE_REPLAY__ = s;
      }, lumoSession(run));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1440, height: 800 });
      await page.goto(ext.url('devtools-panel.html'));
      await page.getByRole('tab', { name: new RegExp(label) }).click();
      expect(await violations(page)).toEqual([]);
      await page.close();
    });
  }

  test('panel first open and plan setup', async () => {
    const page = await ext.context.newPage();
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto(ext.url('devtools-panel.html'));
    expect(await violations(page)).toEqual([]);
    await page.getByRole('tab', { name: /Plan/ }).click();
    // Without a recorded site the Plan tab opens on the setup screen.
    await expect(page.getByRole('heading', { name: 'Drop your tracking plan here' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.close();
  });

  test('popup main, settings and restricted', async () => {
    const session = lumoSession('events');
    const probe = {
      url: 'https://example.com/products/wireless-headphones-pro-x',
      resources: session.requests.map((r, i) => ({ name: r.url, startTime: i * 10 })),
      dataLayer: [],
      dataLayerLength: 0,
      gtmIds: ['GTM-K7P2QX'],
      cmp: [],
      cookies: {},
      serverContainerUrl: 'https://data.example.com',
    };
    for (const p of [probe, 'restricted'] as const) {
      const page = await ext.context.newPage();
      await page.addInitScript((x) => {
        (window as unknown as { __HITLINE_POPUP__: unknown }).__HITLINE_POPUP__ = x;
      }, p);
      await page.setViewportSize({ width: 372, height: 640 });
      await page.goto(ext.url('popup.html'));
      await expect(page.locator('.popup-head')).toBeVisible();
      expect(await violations(page)).toEqual([]);
      if (p !== 'restricted') {
        await page.getByRole('button', { name: 'Settings' }).click();
        expect(await violations(page)).toEqual([]);
      }
      await page.close();
    }
  });

  test('welcome page', async () => {
    const page = await ext.context.newPage();
    await page.goto(ext.url('welcome.html'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.close();
  });
});
