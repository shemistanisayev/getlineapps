/** getlineapps.com/serpline, the #preview tool and /serpline/uninstalled (Faza 4B), built site. */
import { expect, test } from '@playwright/test';

const SITE = 'http://localhost:4321';

test.describe('serpline landing', () => {
  test('renders the hero, says "coming soon" until the store listing exists, loads nothing remote', async ({
    page,
  }) => {
    const remote: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith(SITE)) remote.push(r.url());
    });
    await page.goto(`${SITE}/serpline`);
    await expect(page).toHaveTitle('Serpline: Free SEO Checker for Google, ChatGPT & More');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'See your page the way Google and AI do.',
    );
    await expect(page.locator('a[href*="chromewebstore"]')).toHaveCount(0);
    await expect(page.getByText('Coming soon to Chrome').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(remote).toEqual([]);
  });

  test('SEO: canonical, hreflang, OG image, JSON-LD, sitemap and llms.txt', async ({
    page,
    request,
  }) => {
    await page.goto(`${SITE}/serpline`);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://getlineapps.com/serpline',
    );
    await expect(page.locator('link[hreflang=az]')).toHaveAttribute(
      'href',
      'https://getlineapps.com/az/serpline',
    );
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toBe('https://getlineapps.com/og/serpline.png');
    expect((await request.get(`${SITE}/og/serpline.png`)).status()).toBe(200);
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')['@type']));
    expect(types).toEqual(expect.arrayContaining(['SoftwareApplication', 'FAQPage']));
    const sitemap = await (await request.get(`${SITE}/sitemap.xml`)).text();
    expect(sitemap).toContain('<loc>https://getlineapps.com/serpline</loc>');
    expect(sitemap).toContain('<loc>https://getlineapps.com/az/serpline</loc>');
    expect(sitemap).not.toContain('uninstalled');
    const llms = await request.get(`${SITE}/llms.txt`);
    expect(llms.headers()['content-type']).toContain('text/plain');
    const text = await llms.text();
    expect(text).toMatch(/^# Line apps\n\n> /);
    expect(text).toContain('[Serpline](https://getlineapps.com/serpline)');
    expect(text).toContain('[Hitline](https://getlineapps.com/hitline)');
    expect(text).not.toContain('(https://getlineapps.com/rivaline)');
  });

  test('contact links carry the landing UTM, internal links carry none', async ({ page }) => {
    await page.goto(`${SITE}/serpline`);
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    const owner = hrefs.filter((h) => h.startsWith('https://shamistanisayev.com'));
    expect(owner.sort()).toEqual(
      ['audit_cta', 'faq', 'footer']
        .map(
          (c) =>
            `https://shamistanisayev.com/?utm_source=serpline&utm_medium=landing&utm_campaign=${c}`,
        )
        .sort(),
    );
    for (const h of hrefs.filter((x) => x.startsWith('/') || x.includes('getlineapps.com'))) {
      expect(h).not.toContain('utm_');
    }
    expect(hrefs).toEqual(
      expect.arrayContaining(['/privacy/serpline', '/az/serpline', '/hitline']),
    );
  });

  test('#preview measures like the extension and reacts to typing and the device switch', async ({
    page,
  }) => {
    await page.goto(`${SITE}/serpline#preview`);
    const tool = page.locator('[data-serp-preview]');
    await expect(tool.locator('[data-sp="t-measure"]')).toHaveText('32 characters, 318 of 600 px');
    await expect(tool.locator('[data-sp="t-status"]')).toHaveText('Fits');
    await expect(tool.locator('[data-sp="d-status"]')).toHaveText('Cut after 147 characters');
    await tool.getByRole('button', { name: 'Mobile' }).click();
    await expect(tool.getByRole('button', { name: 'Mobile' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(tool.locator('[data-sp="d-status"]')).toHaveText('Cut after 107 characters');
    await expect(tool.locator('[data-sp="d-measure"]')).toHaveText(
      '191 characters, 1191 of 680 px',
    );
    await expect(tool.locator('[data-sp="d-shown"]')).toHaveText(
      'Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once ...',
    );
    await expect(tool.locator('[data-sp="result"]')).toHaveClass(/gres--mobile/);

    await page.getByLabel('Page title').fill('A'.repeat(60));
    await expect(tool.locator('[data-sp="t-status"]')).toHaveText(/^Cut after \d+ characters$/);
    await page.getByLabel('Meta description').fill('');
    await expect(tool.locator('[data-sp="d-status"]')).toHaveText('Add a description');
    await expect(tool.locator('[data-sp="d-shown"]')).toHaveText(
      'Google will pick text from the page.',
    );
    await page.getByLabel('URL').fill('www.lumo-shop.co.uk/a/b');
    await expect(tool.locator('[data-sp="site"]')).toHaveText('Lumo-shop');
    await expect(tool.locator('[data-sp="crumb"]')).toHaveText(
      'https://www.lumo-shop.co.uk › a › b',
    );
  });

  test('the five feature tabs work with the keyboard', async ({ page }) => {
    await page.goto(`${SITE}/serpline`);
    await expect(page.locator('.p-su')).toBeVisible();
    await page.locator('#tb-su').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tb-he')).toBeChecked();
    await expect(page.locator('.p-he')).toBeVisible();
    await expect(page.locator('.p-su')).toBeHidden();
    await page.locator('label[for="tb-ai"]').click();
    await expect(page.locator('.p-ai')).toBeVisible();
    await expect(page.locator('.p-ai').getByText('PerplexityBot', { exact: true })).toBeVisible();
  });

  test('Azerbaijani page', async ({ page }) => {
    await page.goto(`${SITE}/az/serpline`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Google və AI');
    await expect(page.getByText('Tezliklə Chrome-da').first()).toBeVisible();
    await page.getByRole('button', { name: 'Mobil' }).click();
    await expect(page.locator('[data-sp="d-status"]')).toHaveText('107 simvoldan sonra kəsilir');
  });

  for (const width of [820, 390]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${SITE}/serpline`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('serpline uninstall page', () => {
  test('sends the reason, the text and the extension version to /api/feedback', async ({
    page,
  }) => {
    let body: Record<string, string> | null = null;
    await page.route('**/api/feedback', async (route) => {
      body = route.request().postDataJSON() as Record<string, string>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto(
      `${SITE}/serpline/uninstalled?utm_source=serpline&utm_medium=extension&utm_campaign=uninstall&v=0.1.0`,
    );
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Serpline is removed.');
    await page.getByText('It missed problems on my site').click();
    await page.getByLabel(/Anything else/).fill('My SPA was not read');
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(page.getByRole('status')).toHaveText('Thank you. Your feedback was sent.');
    expect(body).toMatchObject({
      tool: 'serpline',
      reason: 'It missed problems on my site',
      message: 'My SPA was not read',
      v: '0.1.0',
      page: '/serpline/uninstalled',
    });
    await expect(page.getByRole('link', { name: 'Book an SEO audit' })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=serpline&utm_medium=extension&utm_campaign=uninstall',
    );
    await expect(page.getByRole('link', { name: 'Reinstall Serpline' })).toHaveAttribute(
      'href',
      '/serpline',
    );
  });
});
