import { describe, expect, it } from 'vitest';
import { TOOL } from './index.ts';

describe('hitline core', () => {
  it('is wired into the test setup', () => {
    expect(TOOL).toBe('hitline');
  });
});
