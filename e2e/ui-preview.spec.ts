import { expect, test } from '@playwright/test';

const SHOTS = process.env.SHOTS_DIR;

for (const width of [1440, 820, 390]) {
  test(`ui preview renders at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:4310/');
    await expect(page.getByRole('img', { name: 'Hitline' }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'Line apps' }).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // Fonts are self-hosted: no request may leave localhost.
    const fonts = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((r) => r.name)
        .filter((n) => !n.startsWith('http://localhost')),
    );
    expect(fonts).toEqual([]);
    expect(await page.evaluate(() => document.fonts.check('800 20px "Plus Jakarta Sans"'))).toBe(
      true,
    );
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollW).toBeLessThanOrEqual(width);
    expect(errors).toEqual([]);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/ui-preview-${width}.png`, fullPage: true });
  });
}
