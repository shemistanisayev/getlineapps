/** docs/serpline/STORE-LISTING.md stays in line with the manifest, the store files and the limits. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../../..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
const listing = read('docs/serpline/STORE-LISTING.md');
const config = read('apps/serpline/extension/wxt.config.ts');
const pkg = JSON.parse(read('apps/serpline/extension/package.json')) as { version: string };

/** The first fenced block after a line that contains `label`. */
function block(label: string, from = 0): string {
  const at = listing.indexOf(label, from);
  expect(at, label).toBeGreaterThan(-1);
  const start = listing.indexOf('```\n', at) + 4;
  return listing.slice(start, listing.indexOf('\n```', start));
}

describe('Serpline store listing', () => {
  it('the listing title is the manifest name, within 75 characters', () => {
    const name = block('**Name** (from the manifest');
    expect(config).toContain(`name: '${name}'`);
    expect(name.length).toBeLessThanOrEqual(75);
  });

  it('the English short description is the manifest description, within 132 characters', () => {
    const short = block('**Short description** (from the manifest');
    expect(config).toContain(JSON.stringify(short));
    expect(short.length).toBeLessThanOrEqual(132);
    expect(listing).toContain(`(from the manifest, ${short.length} of 132 characters)`);
  });

  it('the Azerbaijani short description fits too, and its count is right', () => {
    const az = block('**Short description** (Azerbaijani');
    expect(az.length).toBeLessThanOrEqual(132);
    expect(listing).toContain(`(Azerbaijani, ${az.length} of 132 characters)`);
  });

  it('names the current version, the privacy URL and the exact permissions', () => {
    expect(listing).toContain(`serpline-${pkg.version}.zip`);
    expect(listing).toContain('https://getlineapps.com/privacy/serpline');
    expect(config).toContain("permissions: ['activeTab', 'scripting', 'sidePanel', 'storage']");
    expect(config).toContain("optional_host_permissions: ['https://*/*', 'http://*/*']");
    for (const p of ['`activeTab`', '`scripting`', '`sidePanel`', '`storage`', '`https://*/*`'])
      expect(listing).toContain(p);
  });

  it('every store file it names exists', () => {
    for (const f of [
      `store/serpline/serpline-${pkg.version}.zip`,
      'store/serpline/promo-small-440x280.png',
      'store/serpline/promo-marquee-1400x560.png',
      ...['1-summary', '2-render', '3-ai', '4-headings', '5-audit-pdf'].map(
        (s) => `store/serpline/screenshots/${s}.png`,
      ),
    ])
      expect(existsSync(join(root, f)), f).toBe(true);
  });

  it('the images have the sizes the store asks for', () => {
    const size = (f: string) => {
      const b = readFileSync(join(root, f));
      return [b.readUInt32BE(16), b.readUInt32BE(20)];
    };
    for (const s of ['1-summary', '2-render', '3-ai', '4-headings', '5-audit-pdf'])
      expect(size(`store/serpline/screenshots/${s}.png`), s).toEqual([1280, 800]);
    expect(size('store/serpline/promo-small-440x280.png')).toEqual([440, 280]);
    expect(size('store/serpline/promo-marquee-1400x560.png')).toEqual([1400, 560]);
  });

  it('the detailed descriptions have no keyword lists (Web Store rejection "Yellow Argon")', () => {
    // Google rejected 1.0.0 for listing 11 crawler names in a row. Name at most 3 bots, and keep
    // every line of the description a sentence, not a comma list.
    const bots = [
      'GPTBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'ClaudeBot',
      'Claude-SearchBot',
      'Claude-User',
      'PerplexityBot',
      'Perplexity-User',
      'Google-Extended',
      'Applebot-Extended',
      'CCBot',
      'Bytespider',
      'Meta-ExternalAgent',
    ];
    const en = block('**Detailed description**');
    const az = block('**Detailed description**', listing.indexOf('## Store listing (Azerbaijani)'));
    for (const d of [en, az]) {
      expect(bots.filter((b) => d.includes(b)).length).toBeLessThanOrEqual(3);
      for (const line of d.split('\n'))
        expect(line.split(',').length - 1, line).toBeLessThanOrEqual(5);
    }
  });

  it('follows the copy rules', () => {
    expect(listing).not.toMatch(/—/);
    expect(listing).not.toMatch(/·/);
  });
});
