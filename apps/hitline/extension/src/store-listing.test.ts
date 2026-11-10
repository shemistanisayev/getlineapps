/** docs/hitline/STORE-LISTING.md stays in line with the manifest and the store limits. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const listing = read('../../../../docs/hitline/STORE-LISTING.md');
const config = read('../wxt.config.ts');
const pkg = JSON.parse(read('../package.json')) as { version: string };

/** The first fenced block after a heading line that contains `label`. */
function block(label: string, from = 0): string {
  const at = listing.indexOf(label, from);
  const start = listing.indexOf('```\n', at) + 4;
  return listing.slice(start, listing.indexOf('\n```', start));
}

describe('Hitline store listing', () => {
  it('the English short description is the manifest description, within 132 characters', () => {
    const short = block('**Short description** (from the manifest');
    expect(config).toContain(short);
    expect(short.length).toBeLessThanOrEqual(132);
  });

  it('the listing title is the manifest name, within 75 characters', () => {
    const name = block('**Name** (from the manifest');
    expect(config).toContain(`name: '${name}'`);
    expect(name.length).toBeLessThanOrEqual(75);
  });

  it('the Azerbaijani short description fits too', () => {
    const az = block('**Short description** (Azerbaijani');
    expect(az.length).toBeLessThanOrEqual(132);
  });

  it('names the current version, the privacy URL and the exact permissions', () => {
    expect(listing).toContain(`hitline-${pkg.version}.zip`);
    expect(listing).toContain('https://getlineapps.com/privacy/hitline');
    expect(config).toContain("permissions: ['activeTab', 'scripting', 'storage']");
    for (const p of ['`activeTab`', '`scripting`', '`storage`', '`devtools_page`']) {
      expect(listing).toContain(p);
    }
  });

  it('follows the copy rules', () => {
    expect(listing).not.toMatch(/—/);
    expect(listing).not.toMatch(/·/);
  });
});
