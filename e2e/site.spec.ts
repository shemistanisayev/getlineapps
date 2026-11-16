/** getlineapps.com: built site served by `astro preview` (see playwright.config.ts). */
import { expect, test } from '@playwright/test';
import { TOOL_SLUGS } from '../packages/core/src/site.ts';

const SITE = 'http://localhost:4321';

test.describe('site', () => {
  test('hub shows five tools, Hitline and Serpline live, the rest coming soon, links only to landings that exist', async ({
    page,
  }) => {
    await page.goto(`${SITE}/`);
    await expect(page).toHaveTitle(/Line apps/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.tc')).toHaveCount(5);
    // tools.json: Hitline (2026-11-11) and Serpline (2026-11-12) are live, the others are still soon.
    await expect(page.locator('.tc .soon')).toHaveCount(3);
    await expect(page.locator('.tc a.add')).toHaveCount(2);
    await expect(page.locator('.tc[data-tool="hitline"] a.add')).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/hitline-tracking-debugger/aemdmmghojdopdjjhggajgdedmejkoaf',
    );
    await expect(page.locator('.tc[data-tool="serpline"] a.add')).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/phenmbccpeaclhpnclildfndbchgpnmn',
    );
    // Hitline (Faza 3), Serpline (Faza 4) and Rivaline (Faza 5B, published early as "soon") have
    // landings; the others get one in their own phase.
    const withLanding = ['hitline', 'serpline', 'rivaline'];
    for (const slug of withLanding) {
      await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
    }
    for (const slug of TOOL_SLUGS.filter((s) => !withLanding.includes(s))) {
      await expect(page.locator(`a[href="/${slug}"]`)).toHaveCount(0);
    }
  });

  test('role filter dims the cards that do not fit', async ({ page }) => {
    await page.goto(`${SITE}/`);
    await page.getByRole('button', { name: 'SEO specialist' }).click();
    await expect(page.locator('.tc.dim')).toHaveCount(4);
    await expect(page.locator('.tc[data-tool="serpline"]')).not.toHaveClass(/dim/);
    await expect(page.locator('[data-hint-text]')).toHaveText('Serpline is built for you');
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
    await page.locator('[data-lang-menu] summary').click();
    await expect(page.getByRole('link', { name: /^English/ })).toHaveAttribute('href', '/');
  });

  test('language menu: 10 languages, keyboard and Escape, on every kind of page', async ({
    page,
  }) => {
    const LANGS = ['en', 'az', 'tr', 'ru', 'ro', 'uk', 'pt', 'nl', 'es', 'fr'];
    for (const path of ['/', '/hitline', '/serpline', '/rivaline', '/privacy/hitline']) {
      for (const l of LANGS) {
        const url = l === 'en' ? path : path === '/' ? `/${l}` : `/${l}${path}`;
        const res = await page.goto(`${SITE}${url}`);
        expect(res?.status(), url).toBe(200);
        await expect(page.locator('html'), url).toHaveAttribute('lang', l);
        await expect(page.locator('link[rel=alternate][hreflang]'), url).toHaveCount(11);
      }
    }
    await page.goto(`${SITE}/tr/hitline`);
    const menu = page.locator('[data-lang-menu]');
    await menu.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(menu.locator('.lm-item')).toHaveCount(10);
    await expect(menu.locator('[aria-current=page]')).toHaveAttribute('href', '/tr/hitline');
    await expect(menu.getByRole('link', { name: /^Français/ })).toHaveAttribute(
      'href',
      '/fr/hitline',
    );
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(menu.locator('summary')).toBeFocused();
  });

  test('no heading runs out of its box and no sideways scroll, in any language', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const LANGS = ['', 'az/', 'tr/', 'ru/', 'ro/', 'uk/', 'pt/', 'nl/', 'es/', 'fr/'];
    const bad: string[] = [];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['', 'hitline', 'serpline', 'rivaline', 'privacy/serpline']) {
        for (const l of LANGS) {
          await page.goto(`${SITE}/${l}${path}`);
          await page.evaluate(() => document.fonts.ready);
          const found = await page.evaluate(() => {
            const out: string[] = [];
            for (const h of document.querySelectorAll('h1,h2,h3')) {
              const r = h.getBoundingClientRect();
              if (r.width <= 2) continue;
              const range = document.createRange();
              range.selectNodeContents(h);
              const over = range.getBoundingClientRect().right - r.right;
              if (over > 2) out.push(`${h.tagName} +${Math.round(over)}px`);
            }
            const side = document.documentElement.scrollWidth - innerWidth;
            if (side > 0) out.push(`page +${side}px`);
            return out;
          });
          for (const f of found) bad.push(`${width} /${l}${path}: ${f}`);
        }
      }
    }
    expect(bad).toEqual([]);
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
