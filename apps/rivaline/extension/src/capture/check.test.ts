import { describe, expect, it } from 'vitest';
import { classifyError, isRestrictedPage } from './check.ts';

// Error texts as Chrome 157 returns them (scripts/spike-rivaline.ts).
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

describe('isRestrictedPage', () => {
  it('the PDF viewer runs the probe but is not a website', () => {
    expect(
      isRestrictedPage({ url: 'https://example.com/a.pdf', contentType: 'application/pdf' }),
    ).toBe(true);
  });
  it('websites are readable', () => {
    expect(isRestrictedPage({ url: 'https://example.com/', contentType: 'text/html' })).toBe(false);
    expect(isRestrictedPage({ url: 'http://kova.localhost/', contentType: 'text/html' })).toBe(
      false,
    );
  });
  it('non-web documents are restricted', () => {
    expect(isRestrictedPage({ url: 'file:///C:/a.html', contentType: 'text/html' })).toBe(true);
  });
});
