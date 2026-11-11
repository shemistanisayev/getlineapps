/** Google preview measurement and truncation (SPEC §4.3, PLAN gap G5). */
import { describe, expect, it } from 'vitest';
import { fit, fitDescription, fitTitle, measure, siteName, urlLine } from './serp.ts';

const DESC =
  'Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once. Free next-day delivery and free returns within 14 days on all Lumo Audio headphones.';

describe('serp preview', () => {
  it('measures with the Arial table (title 318 of 600 px)', () => {
    expect(fitTitle('Wireless Headphones Pro X | Lumo')).toMatchObject({
      cut: false,
      length: 32,
      px: 318,
      shown: 'Wireless Headphones Pro X | Lumo',
    });
    expect(measure('é', 20)).toBeCloseTo(11.12);
    // Azerbaijani letters use their base letter's width (QA: shamistanisayev.com/az).
    expect(measure('şçöüğİı', 10)).toBeCloseTo(measure('scougIi', 10));
    expect(measure('ə', 10)).toBeCloseTo(measure('e', 10));
  });

  it('cuts the 191-character description after 107 on mobile and 147 on desktop', () => {
    const m = fitDescription(DESC, 'mobile');
    expect(m).toMatchObject({ cut: true, length: 191, cutAfter: 107, limit: 680 });
    expect(m.shown).toBe(
      'Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once ...',
    );
    const d = fitDescription(DESC, 'desktop');
    expect(d).toMatchObject({ cut: true, cutAfter: 147, limit: 920 });
    expect(d.shown.endsWith('free returns ...')).toBe(true);
  });

  it('keeps the hard cut when the last space is early, and strips trailing punctuation', () => {
    const long = 'Short ' + 'x'.repeat(200);
    const r = fit(long, 20, 600);
    expect(r.shown.startsWith('Short xxx')).toBe(true);
    expect(measure(r.shown, 20)).toBeLessThanOrEqual(600);
    expect(fit('Hello, world, again and again and again', 20, 200).shown).not.toMatch(
      /[,.] \.\.\.$/,
    );
  });

  it('builds the URL line and the site name', () => {
    expect(urlLine('https://example.com/products/wireless-headphones-pro-x')).toBe(
      'https://example.com › products › wireless-headphones-pro-x',
    );
    expect(urlLine('https://example.com/')).toBe('https://example.com');
    expect(siteName('https://www.lumo-shop.co.uk/a')).toBe('Lumo-shop');
  });
});
