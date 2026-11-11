import { describe, expect, it } from 'vitest';
import { classifyError } from './check.ts';

// Error texts as Chrome 157 returns them (scripts/spike-serpline.ts).
describe('classifyError', () => {
  it('restricted pages', () => {
    expect(classifyError('Cannot access a chrome:// URL')).toBe('restricted');
    expect(classifyError('The extensions gallery cannot be scripted.')).toBe('restricted');
    expect(classifyError('Cannot access a chrome-extension:// URL of different extension')).toBe(
      'restricted',
    );
  });
  it('missing access', () => {
    expect(
      classifyError(
        'Cannot access contents of the page. Extension manifest must request permission to access the respective host.',
      ),
    ).toBe('noAccess');
    expect(classifyError('No tab with id: 5.')).toBe('noAccess');
  });
});
