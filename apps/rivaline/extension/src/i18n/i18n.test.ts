import { describe, expect, it } from 'vitest';
import { az } from './az.ts';
import { en } from './en.ts';

describe('rivaline i18n', () => {
  it('AZ has exactly the EN keys', () => {
    expect(Object.keys(az).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps the same {holes} in both languages and follows the copy rules', () => {
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [k, v] of Object.entries(en)) {
      const a = (az as Record<string, string>)[k]!;
      expect(holes(a), k).toEqual(holes(v));
      for (const s of [v, a]) expect(s, k).not.toMatch(/[—·]/);
    }
  });
});
