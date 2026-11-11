import { RULES } from '@line/core/serpline';
import { describe, expect, it } from 'vitest';
import { az } from './az.ts';
import { en } from './en.ts';

describe('serpline i18n', () => {
  it('AZ has exactly the EN keys', () => {
    expect(Object.keys(az).sort()).toEqual(Object.keys(en).sort());
  });

  it('every issue rule has a title, an explanation and a fix in both languages', () => {
    for (const { id } of RULES) {
      for (const part of ['title', 'text', 'fix']) {
        const key = `issue.${id}.${part}`;
        expect(en, key).toHaveProperty([key]);
        expect(az, key).toHaveProperty([key]);
      }
    }
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
