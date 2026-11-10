/** getlineapps.com: built site served by `astro preview` (see playwright.config.ts). */
import { expect, test } from '@playwright/test';
import { TOOL_SLUGS } from '../packages/core/src/site.ts';

const SITE = 'http://localhost:4321';

test.describe('site', () => {
  test('hub shows five tools, all coming soon, and links only to landings that exist', async ({
    page,
  }) => {
    await page.goto(`${SITE}/`);
    await expect(page).toHaveTitle(/Line apps/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.tc')).toHaveCount(5);
    await expect(page.locator('.tc .soon')).toHaveCount(5);
    await expect(page.locator('.tc a.add')).toHaveCount(0);
    // Hitline has its landing since Faza 3; the others get one in their own phase.
    await expect(page.locator('a[href="/hitline"]').first()).toBeVisible();
    for (const slug of TOOL_SLUGS.filter((s) => s !== 'hitline')) {
      await expect(page.locator(`a[href="/${slug}"]`)).toHaveCount(0);
    }
  });

  test('role filter dims the cards that do not fit', async ({ page }) => {
    await page.goto(`${SITE}/`);
    await page.getByRole('button', { name: 'SEO specialist' }).click();
    await expect(page.locator('.tc.dim')).toHaveCount(4);
    await expect(page.locator('.tc[data-tool="serpline"]')).not.toHaveClass(/dim/);
    await expect(page.locator('[data-hint-text]')).toHaveText('Serpline is built for you.');
  });

  test('check point pins switch the panel', async ({ page }) => {
    await page.goto(`${SITE}/`);
    await expect(page.locator('[data-panel="serpline"]')).toBeVisible();
    await page
      .getByRole('button', { name: /^5: Foldline/ })
      .first()
      .click();
    await expect(page.locator('[data-panel="foldline"]')).toBeVisible();
    await expect(page.locator('[data-panel="serpline"]')).toBeHidden();
  });

  test('contact links carry the hub UTM, internal links carry none', async ({ page }) => {
    await page.goto(`${SITE}/`);
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    for (const h of hrefs) {
      if (h.startsWith('https://shamistanisayev.com'))
        expect(h).toContain('utm_source=getlineapps&utm_medium=landing');
      else if (h.startsWith('/') || h.startsWith('#')) expect(h).not.toContain('utm_');
      else expect(h).toMatch(/^https:\/\/(github\.com|chromewebstore\.google\.com)\//);
    }
  });

  test('Azerbaijani hub', async ({ page }) => {
    await page.goto(`${SITE}/az`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
      'href',
      'https://getlineapps.com/',
    );
    await expect(page.getByRole('link', { name: 'In English' })).toHaveAttribute('href', '/');
  });

  for (const slug of TOOL_SLUGS) {
    test(`privacy page for ${slug}`, async ({ page }) => {
      await page.goto(`${SITE}/privacy/${slug}`);
      await expect(page.locator('.tb[aria-current="page"]')).toHaveAttribute(
        'href',
        `/privacy/${slug}`,
      );
      await expect(page.locator('.tabs a')).toHaveCount(5);
      await expect(page.locator('.perm code').first()).toHaveText('activeTab');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://getlineapps.com/privacy/${slug}`,
      );
    });
  }

  test('/privacy goes to /privacy/hitline', async ({ page }) => {
    await page.goto(`${SITE}/privacy`);
    await page.waitForURL(/\/privacy\/hitline$/);
  });

  test('404 page', async ({ page }) => {
    await page.goto(`${SITE}/404`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('sitemap and robots', async ({ request }) => {
    const sm = await (await request.get(`${SITE}/sitemap.xml`)).text();
    expect(sm).toContain('<loc>https://getlineapps.com/</loc>');
    expect(sm).toContain('<loc>https://getlineapps.com/az/privacy/markline</loc>');
    const robots = await (await request.get(`${SITE}/robots.txt`)).text();
    expect(robots).toContain('Sitemap: https://getlineapps.com/sitemap.xml');
  });

  for (const width of [1440, 820, 390]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/', '/az', '/privacy/serpline', '/404']) {
        await page.goto(SITE + path);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(over, path).toBe(0);
      }
    });
  }
});
