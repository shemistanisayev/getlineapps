/** getlineapps.com/hitline and /hitline/uninstalled (Faza 3B), built site from `astro preview`. */
import { expect, test } from '@playwright/test';

const SITE = 'http://localhost:4321';

test.describe('hitline landing', () => {
  test('renders the hero, links "Add to Chrome" to the store listing, loads nothing remote', async ({
    page,
  }) => {
    const remote: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith(SITE)) remote.push(r.url());
    });
    await page.goto(`${SITE}/hitline`);
    await expect(page).toHaveTitle(/^Hitline/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Is your tracking working? Prove it in one panel.',
    );
    // tools.json: Hitline is live, so the nav and the hero link to the listing.
    const store = page.locator(
      'a[href="https://chromewebstore.google.com/detail/hitline-tracking-debugger/aemdmmghojdopdjjhggajgdedmejkoaf"]',
    );
    await expect(store).toHaveCount(2);
    await expect(page.getByRole('link', { name: /Add to Chrome, it's free/ })).toBeVisible();
    await expect(page.getByText('Coming soon to Chrome')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(remote).toEqual([]);
  });

  test('SEO: canonical, hreflang, OG image, SoftwareApplication and FAQPage JSON-LD', async ({
    page,
    request,
  }) => {
    await page.goto(`${SITE}/hitline`);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://getlineapps.com/hitline',
    );
    await expect(page.locator('link[hreflang=az]')).toHaveAttribute(
      'href',
      'https://getlineapps.com/az/hitline',
    );
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toBe('https://getlineapps.com/og/hitline.png');
    expect((await request.get(`${SITE}/og/hitline.png`)).status()).toBe(200);
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')['@type']));
    expect(types).toEqual(expect.arrayContaining(['SoftwareApplication', 'FAQPage']));
    const sitemap = await (await request.get(`${SITE}/sitemap.xml`)).text();
    expect(sitemap).toContain('<loc>https://getlineapps.com/hitline</loc>');
    expect(sitemap).toContain('<loc>https://getlineapps.com/az/hitline</loc>');
    expect(sitemap).not.toContain('uninstalled');
  });

  test('contact links carry the landing UTM, internal links carry none', async ({ page }) => {
    await page.goto(`${SITE}/hitline`);
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    const owner = hrefs.filter((h) => h.startsWith('https://shamistanisayev.com'));
    expect(owner.sort()).toEqual(
      ['audit_cta', 'faq', 'footer']
        .map(
          (c) =>
            `https://shamistanisayev.com/?utm_source=hitline&utm_medium=landing&utm_campaign=${c}`,
        )
        .sort(),
    );
    for (const h of hrefs.filter((x) => x.startsWith('/') || x.includes('getlineapps.com'))) {
      expect(h).not.toContain('utm_');
    }
    expect(hrefs).toContain('/privacy/hitline');
    expect(hrefs).toContain('/az/hitline');
  });

  test('"See a sample audit" opens the modal, Esc closes it, the PDF is served', async ({
    page,
    request,
  }) => {
    await page.goto(`${SITE}/hitline`);
    await page.getByRole('link', { name: 'See a sample audit' }).click();
    const dialog = page.getByRole('dialog', { name: /example\.com, made with Hitline/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Sales are credited to the payment site.')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    const pdf = await request.get(`${SITE}/hitline/sample-audit.pdf`);
    expect(pdf.status()).toBe(200);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('the six feature tabs work with the keyboard', async ({ page }) => {
    await page.goto(`${SITE}/hitline`);
    await expect(page.locator('.p-ev')).toBeVisible();
    await page.locator('#tb-ev').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tb-gt')).toBeChecked();
    await expect(page.locator('.p-gt')).toBeVisible();
    await expect(page.locator('.p-ev')).toBeHidden();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tb-dq')).toBeChecked();
    await expect(page.locator('.p-dq')).toContainText('The same purchase or lead sent twice');
    await page.locator('label[for="tb-pl"]').click();
    await expect(page.locator('.p-pl')).toBeVisible();
    await expect(page.locator('.tbar label')).toHaveCount(6);
  });

  test('the marquee names 26 platforms with their marks or a neutral tile', async ({ page }) => {
    await page.goto(`${SITE}/hitline`);
    const tags = page.locator('.marq .tag:not([aria-hidden])');
    await expect(tags).toHaveCount(26);
    await expect(tags.filter({ hasText: 'LinkedIn Insight' }).locator('.pf-mono')).toHaveText('LI');
    await expect(tags.filter({ hasText: 'Reddit Pixel' }).locator('svg')).toHaveCount(1);
  });

  test('Azerbaijani page', async ({ page }) => {
    await page.goto(`${SITE}/az/hitline`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tracking-in işləyir?');
    await expect(page.getByRole('link', { name: /Chrome-a əlavə et, pulsuzdur/ })).toHaveAttribute(
      'href',
      /^https:\/\/chromewebstore\.google\.com\/detail\/hitline-tracking-debugger\//,
    );
    await expect(page.getByText('Tezliklə Chrome-da')).toHaveCount(0);
  });

  for (const width of [820, 390]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${SITE}/hitline`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('hitline uninstall page', () => {
  test('sends the reason, the text and the extension version to /api/feedback', async ({
    page,
  }) => {
    let body: Record<string, string> | null = null;
    await page.route('**/api/feedback', async (route) => {
      body = route.request().postDataJSON() as Record<string, string>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto(
      `${SITE}/hitline/uninstalled?utm_source=hitline&utm_medium=extension&utm_campaign=uninstall&v=1.0.0`,
    );
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hitline is removed.');

    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(page.getByRole('status')).toHaveText('Pick a reason or write a few words.');
    expect(body).toBeNull();

    await page.getByText("It didn't detect my setup").click();
    await page.getByLabel(/Anything else/).fill('Missed my sGTM on a custom path');
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(page.getByRole('status')).toHaveText('Thank you. Your feedback was sent.');
    expect(body).toMatchObject({
      tool: 'hitline',
      reason: "It didn't detect my setup",
      message: 'Missed my sGTM on a custom path',
      v: '1.0.0',
      website: '',
    });
    const audit = page.getByRole('link', { name: 'Book a tracking audit' });
    await expect(audit).toHaveAttribute(
      'href',
      'https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=uninstall',
    );
  });

  test('shows an error when sending fails', async ({ page }) => {
    await page.route('**/api/feedback', (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.goto(`${SITE}/az/hitline/uninstalled?v=1.0.0`);
    await page.getByText('Cəmi bir dəfə lazım idi').click();
    await page.getByRole('button', { name: 'Rəyi göndər' }).click();
    await expect(page.getByRole('status')).toHaveText(
      'Göndərmək alınmadı. Bir dəqiqədən sonra yenə yoxla.',
    );
  });
});
