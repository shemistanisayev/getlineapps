import { describe, expect, it } from 'vitest';
import {
  brandName,
  googleLibraryUrl,
  libraryLinks,
  linkedinLibraryUrl,
  metaLibraryUrl,
  parseFinderQuery,
  tiktokLibraryUrl,
} from './ads.ts';
import {
  brandButton,
  brandSlug,
  colorRoles,
  deltaE,
  exportFileNames,
  exportJson,
  fontSource,
  googleFamilies,
  logoCrop,
  mergeColors,
  parseColor,
  splitFamily,
  toHex,
  type BrandKit,
} from './brand.ts';
import { COUNTRY_CODES, isCountry } from './countries.ts';

describe('ad library URLs (formats checked 2026-11-13)', () => {
  it('Meta: keyword search, all countries or one', () => {
    expect(metaLibraryUrl('Kova')).toBe(
      'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=keyword_unordered&q=Kova',
    );
    expect(metaLibraryUrl('Kova Skin', 'us')).toContain(
      'country=US&search_type=keyword_unordered&q=Kova+Skin',
    );
  });

  it('Google: domain search, "anywhere" for all countries', () => {
    expect(googleLibraryUrl('example.com')).toBe(
      'https://adstransparency.google.com/?region=anywhere&domain=example.com',
    );
    expect(googleLibraryUrl('example.com', 'DE')).toBe(
      'https://adstransparency.google.com/?region=DE&domain=example.com',
    );
  });

  it('TikTok: only European countries, else all', () => {
    expect(tiktokLibraryUrl('Kova')).toBe(
      'https://library.tiktok.com/ads?region=all&adv_name=Kova',
    );
    expect(tiktokLibraryUrl('Kova', 'FR')).toBe(
      'https://library.tiktok.com/ads?region=FR&adv_name=Kova',
    );
    expect(tiktokLibraryUrl('Kova', 'US')).toBe(
      'https://library.tiktok.com/ads?region=all&adv_name=Kova',
    );
  });

  it('LinkedIn: advertiser name', () => {
    expect(linkedinLibraryUrl('Kova')).toBe(
      'https://www.linkedin.com/ad-library/search?accountOwner=Kova',
    );
  });

  it('libraryLinks without a stack (landing finder) has no tag found', () => {
    expect(
      libraryLinks({ brand: 'Kova', domain: 'example.com', country: 'ALL' }).every((l) => !l.found),
    ).toBe(true);
  });

  it('brand name: og:site_name, application-name, then the title before the separator, max 40', () => {
    expect(brandName({ meta: { 'og:site_name': ' Kova ' }, title: 'x' })).toBe('Kova');
    expect(brandName({ meta: { 'application-name': 'Glow' }, title: 'x' })).toBe('Glow');
    expect(brandName({ meta: {}, title: 'Mira Studio | Illustration' })).toBe('Mira Studio');
    expect(brandName({ meta: {}, title: 'Acme - Tools : Home' })).toBe('Acme');
    expect(brandName({ meta: {}, title: 'A'.repeat(60) })).toHaveLength(40);
  });

  it('country list', () => {
    expect(COUNTRY_CODES).toHaveLength(249);
    expect(isCountry('AZ')).toBe(true);
    expect(isCountry('ALL')).toBe(false);
  });
});

describe('colors', () => {
  it('parses computed colors', () => {
    expect(parseColor('rgb(47, 93, 70)')).toEqual({ r: 47, g: 93, b: 70, a: 1 });
    expect(parseColor('rgba(0, 0, 0, 0.5)')?.a).toBe(0.5);
    expect(parseColor('rgb(0 0 0 / 40%)')?.a).toBe(0.4);
    expect(parseColor('#EBC56B')).toEqual({ r: 235, g: 197, b: 107, a: 1 });
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('transparent')?.a).toBe(0);
    expect(toHex(parseColor('rgb(246, 241, 234)')!)).toBe('#F6F1EA');
  });

  it('merges colors closer than ΔE 6 into the most used one', () => {
    expect(deltaE(parseColor('#FFFDF9')!, parseColor('#F6F1EA')!)).toBeLessThan(6);
    const m = mergeColors([
      { color: '#F6F1EA', weight: 100 },
      { color: '#FFFDF9', weight: 40 },
      { color: '#2F5D46', weight: 10 },
    ]);
    expect(m.clusters.map((c) => [c.hex, c.weight])).toEqual([
      ['#F6F1EA', 140],
      ['#2F5D46', 10],
    ]);
    expect(m.of('rgb(255, 253, 249)')).toBe('#F6F1EA');
  });

  it('primary falls back to the most used link color without a main button', () => {
    const roles = colorRoles({
      backgrounds: [{ color: '#FFFFFF', area: 1000 }],
      texts: [
        { color: '#111111', bg: '#FFFFFF', weight: 500, link: false },
        { color: '#0E7490', bg: '#FFFFFF', weight: 80, link: true },
      ],
      button: null,
    });
    expect(roles).toEqual([
      { role: 'primary', hex: '#0E7490' },
      { role: 'text', hex: '#111111' },
      { role: 'background', hex: '#FFFFFF' },
    ]);
  });
});

describe('fonts, button, exports', () => {
  it('first family and generic of a computed font-family', () => {
    expect(splitFamily('Fraunces, Georgia, serif')).toEqual({
      family: 'Fraunces',
      generic: 'serif',
    });
    expect(splitFamily('"DM Sans", Arial, sans-serif')).toEqual({
      family: 'DM Sans',
      generic: 'sans-serif',
    });
    expect(splitFamily('Inter')).toEqual({ family: 'Inter', generic: 'sans-serif' });
  });

  it('font source', () => {
    expect(
      googleFamilies(
        'https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=DM+Sans:wght@400',
      ),
    ).toEqual(['Fraunces', 'DM Sans']);
    expect(googleFamilies('https://fonts.googleapis.com/css?family=Roboto|Open+Sans:400')).toEqual([
      'Roboto',
      'Open Sans',
    ]);
    const fonts = {
      google: ['Fraunces'],
      adobe: true,
      faces: ['Fraunces', 'Proxima Nova', 'Brand'],
    };
    expect(fontSource('Fraunces', fonts)).toBe('google');
    expect(fontSource('Proxima Nova', fonts)).toBe('adobe');
    expect(fontSource('Brand', { ...fonts, adobe: false })).toBe('self');
    expect(fontSource('Arial', fonts)).toBe('system');
  });

  it('button label is cut at 24 characters, transparent buttons are ignored', () => {
    const raw = {
      bg: 'rgb(47, 93, 70)',
      color: 'rgb(246, 241, 234)',
      radius: '999px',
      height: 50,
      paddingX: 28,
      family: '"DM Sans", Arial, sans-serif',
      weight: '600',
      size: 15,
      label: 'Shop   the whole routine for your skin',
    };
    expect(brandButton(raw)?.label).toBe('Shop the whole routine…');
    expect(brandButton({ ...raw, bg: 'rgba(0, 0, 0, 0)' })).toBeNull();
  });

  it('slug and file names', () => {
    expect(brandSlug('Kova')).toBe('kova');
    expect(brandSlug('Mira Studio')).toBe('mira-studio');
    expect(brandSlug('Café Ünlü & Co.')).toBe('cafe-unlu-co');
    expect(brandSlug('!!!')).toBe('brand');
    expect(exportFileNames('kova')).toEqual({
      css: 'kova.css',
      json: 'kova-brand.json',
      png: 'kova-palette.png',
    });
  });

  it('JSON export has the same values, nested', () => {
    const kit: BrandKit = {
      colors: [{ role: 'primary', hex: '#2F5D46' }],
      heading: { family: 'Fraunces', generic: 'serif', weight: '600', size: 52, source: 'google' },
      body: null,
      button: null,
      logo: null,
    };
    expect(JSON.parse(exportJson(kit, 'kova'))).toEqual({
      brand: 'kova',
      colors: { primary: '#2F5D46' },
      fonts: { heading: '"Fraunces", serif' },
    });
  });

  it('logo crop in device pixels, only when the logo is in view', () => {
    const logo = { rect: { x: 40, y: 53, width: 92.5, height: 34 }, dpr: 1.5, inView: true };
    expect(logoCrop(logo)).toEqual({ x: 60, y: 79, width: 139, height: 51 });
    expect(logoCrop({ ...logo, inView: false })).toBeNull();
    expect(logoCrop(null)).toBeNull();
  });
});

describe('finder query (landing #finder)', () => {
  it('a domain gives the domain and a brand from its first label', () => {
    expect(parseFinderQuery('example.com')).toEqual({ brand: 'Example', domain: 'example.com' });
    expect(parseFinderQuery('https://www.shop.kova.co.uk/products?x=1')).toEqual({
      brand: 'Kova',
      domain: 'kova.co.uk',
    });
  });
  it('a brand name has no domain', () => {
    expect(parseFinderQuery('  Kova Skin ')).toEqual({ brand: 'Kova Skin', domain: null });
    expect(parseFinderQuery('')).toEqual({ brand: '', domain: null });
  });
});
