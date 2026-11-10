import { describe, expect, it } from 'vitest';
import {
  LINE_SITE_URL,
  TOOL_SLUGS,
  contactUrl,
  isToolSlug,
  privacyUrl,
  toolUrl,
  uninstallUrl,
  type ToolSlug,
} from './site.ts';

describe('LINE_SITE_URL', () => {
  it('is the one family domain', () => {
    expect(LINE_SITE_URL).toBe('https://getlineapps.com');
  });
});

describe('toolUrl', () => {
  it('builds the landing URL for every slug', () => {
    for (const slug of TOOL_SLUGS) {
      expect(toolUrl(slug)).toBe(`https://getlineapps.com/${slug}`);
    }
  });

  it('keeps fragments for the free web tools', () => {
    expect(toolUrl('rivaline', '#finder')).toBe('https://getlineapps.com/rivaline#finder');
    expect(toolUrl('foldline', '#calculator')).toBe('https://getlineapps.com/foldline#calculator');
  });

  it('adds paths with or without a leading slash', () => {
    expect(toolUrl('hitline', 'uninstalled')).toBe('https://getlineapps.com/hitline/uninstalled');
    expect(toolUrl('hitline', '/uninstalled')).toBe('https://getlineapps.com/hitline/uninstalled');
  });

  it('adds UTM before the fragment', () => {
    expect(
      toolUrl('foldline', '#calculator', {
        source: 'foldline',
        medium: 'extension',
        campaign: 'share',
      }),
    ).toBe(
      'https://getlineapps.com/foldline?utm_source=foldline&utm_medium=extension&utm_campaign=share#calculator',
    );
  });

  it('rejects unknown slugs', () => {
    expect(() => toolUrl('nope' as ToolSlug)).toThrow();
    expect(isToolSlug('nope')).toBe(false);
    expect(isToolSlug('markline')).toBe(true);
  });
});

describe('privacyUrl and uninstallUrl', () => {
  it('privacy has no UTM', () => {
    expect(privacyUrl('serpline')).toBe('https://getlineapps.com/privacy/serpline');
  });

  it('uninstall URL matches docs/line-family-domains.md', () => {
    expect(uninstallUrl('hitline', '1.2.0')).toBe(
      'https://getlineapps.com/hitline/uninstalled?utm_source=hitline&utm_medium=extension&utm_campaign=uninstall&v=1.2.0',
    );
  });
});

describe('contactUrl', () => {
  it('goes to the owner site with UTM', () => {
    expect(contactUrl({ source: 'getlineapps', medium: 'landing', campaign: 'hub_cta' })).toBe(
      'https://shamistanisayev.com/?utm_source=getlineapps&utm_medium=landing&utm_campaign=hub_cta',
    );
  });
});
