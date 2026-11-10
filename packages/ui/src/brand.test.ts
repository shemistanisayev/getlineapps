import { describe, expect, it } from 'vitest';
import { TOOL_SLUGS } from '@line/core/site';
import {
  BRANDS,
  LIME,
  LIME_INK,
  STATUS,
  hubLogoColors,
  logoColors,
  logoMetrics,
  logoTileSvg,
} from './brand.ts';
import { contrast } from './contrast.ts';

describe('brand colors', () => {
  it('match docs/line-family-colors.md', () => {
    expect(BRANDS.hitline.accent).toBe('#7F56D9');
    expect(BRANDS.serpline.accent).toBe('#2563EB');
    expect(BRANDS.rivaline.accent).toBe('#0E7490');
    expect(BRANDS.foldline.accent).toBe('#C11574');
    expect(BRANDS.markline.accent).toBe('#FACC15');
    expect(Object.keys(BRANDS)).toEqual([...TOOL_SLUGS]);
  });

  it('text on the accent passes WCAG AA', () => {
    for (const b of Object.values(BRANDS)) {
      expect(contrast(b.accent, b.onAccent), b.slug).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('tint ink on tint and on white passes AA', () => {
    for (const b of Object.values(BRANDS)) {
      expect(contrast(b.tint, b.tintInk), b.slug).toBeGreaterThanOrEqual(4.5);
      expect(contrast('#FFFFFF', b.tintInk), b.slug).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('status text passes AA on its background', () => {
    for (const s of Object.values(STATUS)) {
      expect(contrast(s.bg, s.text)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('lime CTA text passes AA', () => {
    expect(contrast(LIME, LIME_INK)).toBeGreaterThanOrEqual(4.5);
  });

  it('Markline yellow is never text on white', () => {
    expect(contrast('#FFFFFF', BRANDS.markline.accent)).toBeLessThan(3);
    expect(logoColors('markline', 'light').wordAccent).toBe('#101828');
    expect(logoColors('markline', 'light').glyph).toBe('#101828');
    expect(logoColors('markline', 'light').lineHighlight).toContain('#FACC15 42%');
    expect(logoColors('markline', 'dark').lineHighlight).toBeNull();
  });
});

describe('logo', () => {
  it('uses the family proportions', () => {
    expect(logoMetrics(100)).toEqual({ size: 100, radius: 26, gap: 26, glyph: 64, wordSize: 66 });
  });

  it('dark theme uses the bright color', () => {
    expect(logoColors('serpline', 'dark').tileBg).toBe('#93C5FD');
    expect(hubLogoColors('light').lines).toEqual([
      '#B692F6',
      '#93C5FD',
      '#67E8F9',
      '#FAA7E0',
      '#FDE68A',
    ]);
  });

  it('renders a standalone tile SVG', () => {
    const svg = logoTileSvg('foldline', 128);
    expect(svg).toContain('fill="#C11574"');
    expect(svg).toContain('stroke-dasharray="2 6"');
  });
});
