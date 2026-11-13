/** getlineapps.com/rivaline, the #finder tool and /rivaline/uninstalled (Faza 5B), built site. */
import { expect, test } from '@playwright/test';

const SITE = 'http://localhost:4321';

test.describe('rivaline landing', () => {
  test('renders the hero, shows Coming soon while not live, loads nothing remote', async ({
    page,
  }) => {
    const remote: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith(SITE)) remote.push(r.url());
    });
    await page.goto(`${SITE}/rivaline`);
    await expect(page).toHaveTitle('Rivaline: Free Competitor Research for Meta, Google & More');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      "See any rival's stack, ads and brand in one panel",
    );
    // tools.json: Rivaline is "soon" until the Web Store limit is raised (docs/line-family-PLAN.md).
    await expect(page.getByText('Coming soon to Chrome')).toBeVisible();
    await expect(page.locator('a[href^="https://chromewebstore.google.com"]')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(remote).toEqual([]);
  });

  test('SEO: canonical, hreflang, OG image, JSON-LD, sitemap and llms.txt', async ({
    page,
    request,
  }) => {
    await page.goto(`${SITE}/rivaline`);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://getlineapps.com/rivaline',
    );
    await expect(page.locator('link[hreflang=az]')).toHaveAttribute(
      'href',
      'https://getlineapps.com/az/rivaline',
    );
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toBe('https://getlineapps.com/og/rivaline.png');
    expect((await request.get(`${SITE}/og/rivaline.png`)).status()).toBe(200);
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')['@type']));
    expect(types).toEqual(expect.arrayContaining(['SoftwareApplication', 'FAQPage']));
    const sitemap = await (await request.get(`${SITE}/sitemap.xml`)).text();
    expect(sitemap).toContain('<loc>https://getlineapps.com/rivaline</loc>');
    expect(sitemap).toContain('<loc>https://getlineapps.com/az/rivaline</loc>');
    const llms = await (await request.get(`${SITE}/llms.txt`)).text();
    expect(llms).toContain('[Rivaline](https://getlineapps.com/rivaline)');
  });

  test('contact links carry the landing UTM, internal links carry none', async ({ page }) => {
    await page.goto(`${SITE}/rivaline`);
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    const owner = hrefs.filter((h) => h.startsWith('https://shamistanisayev.com'));
    expect(owner.sort()).toEqual(
      ['audit_cta', 'faq', 'footer']
        .map(
          (c) =>
            `https://shamistanisayev.com/?utm_source=rivaline&utm_medium=landing&utm_campaign=${c}`,
        )
        .sort(),
    );
    for (const h of hrefs.filter((x) => x.startsWith('/') || x.includes('getlineapps.com'))) {
      expect(h).not.toContain('utm_');
    }
    expect(hrefs).toEqual(
      expect.arrayContaining(['/privacy/rivaline', '/az/rivaline', '/hitline', '/serpline']),
    );
  });

  test('#finder builds the four searches with the extension builders while typing', async ({
    page,
  }) => {
    await page.goto(`${SITE}/rivaline#finder`);
    const f = page.locator('[data-ad-finder]');
    const link = (id: string) => f.locator(`[data-lib="${id}"]`);
    await expect(f.locator('[data-finder-brand]')).toHaveText('Brand: Example');
    await expect(link('google')).toHaveAttribute(
      'href',
      'https://adstransparency.google.com/?region=anywhere&domain=example.com',
    );
    await page.getByLabel('Brand or domain').fill('https://www.kova.co.uk/shop');
    await expect(f.locator('[data-finder-brand]')).toHaveText('Brand: Kova');
    await expect(link('meta')).toHaveAttribute(
      'href',
      'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=keyword_unordered&q=Kova',
    );
    await expect(link('google')).toHaveAttribute(
      'href',
      'https://adstransparency.google.com/?region=anywhere&domain=kova.co.uk',
    );
    await expect(link('tiktok')).toHaveAttribute(
      'href',
      'https://library.tiktok.com/ads?region=all&adv_name=Kova',
    );
    await expect(link('linkedin')).toHaveAttribute(
      'href',
      'https://www.linkedin.com/ad-library/search?accountOwner=Kova',
    );
    await page.getByLabel('Brand or domain').fill('Glow Bar');
    await expect(link('google').locator('[data-by]')).toHaveText('Needs a domain');
    await expect(link('meta').locator('[data-by]')).toHaveText('Searches "Glow Bar"');
    for (const id of ['meta', 'google', 'tiktok', 'linkedin']) {
      await expect(link(id)).toHaveAttribute('target', '_blank');
      await expect(link(id)).toHaveAttribute('rel', /noopener/);
    }
  });

  test('the four feature tabs work with the keyboard', async ({ page }) => {
    await page.goto(`${SITE}/rivaline`);
    await expect(page.locator('.p-st')).toBeVisible();
    await page.locator('#tb-st').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tb-ad')).toBeChecked();
    await expect(page.locator('.p-ad')).toBeVisible();
    await expect(page.locator('.p-st')).toBeHidden();
    await page.locator('label[for="tb-rp"]').click();
    await expect(page.locator('.p-rp')).toBeVisible();
  });

  test('Azerbaijani page', async ({ page }) => {
    await page.goto(`${SITE}/az/rivaline`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('bir paneldə');
    await expect(page.getByText('Tezliklə Chrome-da')).toBeVisible();
    await page.getByLabel('Brend və ya domen').fill('Kova');
    await expect(page.locator('[data-lib="meta"] [data-by]')).toHaveText('"Kova" axtarılır');
  });

  for (const width of [820, 390]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${SITE}/rivaline`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('rivaline uninstall page', () => {
  test('sends the reason, the text and the extension version to /api/feedback', async ({
    page,
  }) => {
    let body: Record<string, string> | null = null;
    await page.route('**/api/feedback', async (route) => {
      body = route.request().postDataJSON() as Record<string, string>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto(
      `${SITE}/rivaline/uninstalled?utm_source=rivaline&utm_medium=extension&utm_campaign=uninstall&v=0.1.0`,
    );
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Rivaline is removed');
    await page.getByText('It missed tools on a site').click();
    await page.getByLabel(/Anything else/).fill('My site uses Segment');
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(page.getByRole('status')).toHaveText('Thank you. Your feedback was sent.');
    expect(body).toMatchObject({
      tool: 'rivaline',
      reason: 'It missed tools on a site',
      message: 'My site uses Segment',
      v: '0.1.0',
      page: '/rivaline/uninstalled',
    });
    await expect(page.getByRole('link', { name: 'Book an audit' })).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=rivaline&utm_medium=extension&utm_campaign=uninstall',
    );
    // Not in the store yet: reinstalling goes to the landing.
    await expect(page.getByRole('link', { name: 'Reinstall Rivaline' })).toHaveAttribute(
      'href',
      '/rivaline',
    );
  });
});
