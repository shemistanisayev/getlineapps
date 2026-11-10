import { describe, expect, it } from 'vitest';
import { TOOL } from './index.ts';

describe('markline core', () => {
  it('is wired into the test setup', () => {
    expect(TOOL).toBe('markline');
  });
});
