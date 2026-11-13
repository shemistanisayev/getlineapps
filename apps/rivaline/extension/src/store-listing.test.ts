/** docs/rivaline/STORE-LISTING.md stays in line with the manifest, the store files and the limits. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES } from '@line/core/rivaline';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../../..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
// Windows checkouts can have CRLF (core.autocrlf): compare on LF.
const listing = read('docs/rivaline/STORE-LISTING.md').replace(/\r\n/g, '\n');
const config = read('apps/rivaline/extension/wxt.config.ts');
const pkg = JSON.parse(read('apps/rivaline/extension/package.json')) as { version: string };
const SHOTS = ['1-stack', '2-ads', '3-brand', '4-export', '5-report'];

/** The first fenced block after a line that contains `label`. */
function block(label: string, from = 0): string {
  const at = listing.indexOf(label, from);
  expect(at, label).toBeGreaterThan(-1);
  const start = listing.indexOf('```\n', at) + 4;
  return listing.slice(start, listing.indexOf('\n```', start));
}

describe('Rivaline store listing', () => {
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

  it('names the current version, the privacy URL, the shortcut and the exact permissions', () => {
    expect(listing).toContain(`rivaline-${pkg.version}.zip`);
    expect(listing).toContain('https://getlineapps.com/privacy/rivaline');
    expect(config).toContain("permissions: ['activeTab', 'scripting', 'storage', 'sidePanel']");
    expect(config).toContain("default: 'Alt+Shift+V'");
    expect(listing).toContain('Alt+Shift+V');
    for (const p of ['`activeTab`', '`scripting`', '`storage`', '`sidePanel`'])
      expect(listing).toContain(p);
    expect(listing).toContain('| Host permissions | None requested. |');
  });

  it('every store file it names exists, with the sizes the store asks for', () => {
    const size = (f: string) => {
      const b = readFileSync(join(root, f));
      return [b.readUInt32BE(16), b.readUInt32BE(20)];
    };
    expect(existsSync(join(root, `store/rivaline/rivaline-${pkg.version}.zip`))).toBe(true);
    for (const s of SHOTS)
      expect(size(`store/rivaline/screenshots/${s}.png`), s).toEqual([1280, 800]);
    expect(size('store/rivaline/promo-small-440x280.png')).toEqual([440, 280]);
    expect(size('store/rivaline/promo-marquee-1400x560.png')).toEqual([1400, 560]);
  });

  it('the detailed descriptions have no keyword lists (Web Store rejection "Yellow Argon")', () => {
    // Google rejected Serpline 1.0.0 for a list of crawler names. Name only a few tools, and keep
    // every line a sentence, not a comma list.
    const tools = RULES.map((r) => r.name);
    const en = block('**Detailed description**');
    const az = block('**Detailed description**', listing.indexOf('## Store listing (Azerbaijani)'));
    for (const d of [en, az]) {
      const named = tools.filter((n) =>
        new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(d),
      );
      expect(named.length, named.join(', ')).toBeLessThanOrEqual(4);
      for (const line of d.split('\n'))
        expect(line.split(',').length - 1, line).toBeLessThanOrEqual(4);
    }
  });

  it('follows the copy rules', () => {
    expect(listing).not.toMatch(/—/);
    expect(listing).not.toMatch(/·/);
  });
});
