import { describe, expect, it } from 'vitest';
import { az } from './az.ts';
import { en } from './en.ts';
import { translator } from './index.ts';

describe('hitline i18n', () => {
  it('az has exactly the en keys, none empty', () => {
    expect(Object.keys(az).sort()).toEqual(Object.keys(en).sort());
    for (const v of [...Object.values(en), ...Object.values(az)]) expect(v.trim()).not.toBe('');
  });

  it('copy rules: no em dash, no middle dot', () => {
    for (const v of [...Object.values(en), ...Object.values(az)]) {
      expect(v).not.toMatch(/[—·]/);
    }
  });

  it('translates by language', () => {
    expect(translator('en')('panel.clear')).toBe('Clear');
    expect(translator('az')('panel.clear')).toBe('Təmizlə');
  });
});
