import { RULES } from '@line/core/rivaline';
import { MARKS } from '@line/ui/marks';
import { describe, expect, it } from 'vitest';

describe('rule marks', () => {
  it('every mark a rule names exists in @line/ui (else the category glyph is shown)', () => {
    for (const r of RULES) if (r.mark) expect(MARKS, r.id).toHaveProperty(r.mark);
  });
});
