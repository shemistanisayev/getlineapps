/** docs/serpline/STORE-LISTING.md stays in line with the manifest, the store files and the limits. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../../..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');
const listing = read('docs/serpline/STORE-LISTING.md');
const config = read('apps/serpline/extension/wxt.config.ts');
const pkg = JSON.parse(read('apps/serpline/extension/package.json')) as { version: string };
const extDir = join(root, 'apps/serpline/extension');
const en = JSON.parse(read('apps/serpline/extension/public/_locales/en/messages.json')) as Record<
  string,
  { message: string }
>;
const localesDoc = read('docs/serpline/STORE-LISTING-LOCALES.md');

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
    expect(config).toContain("name: '__MSG_extName__'");
    expect(en.extName!.message).toBe(name);
    expect(name.length).toBeLessThanOrEqual(75);
  });

  it('the English short description is the manifest description, within 132 characters', () => {
    const short = block('**Short description** (from the manifest');
    expect(config).toContain("description: '__MSG_extDescription__'");
    expect(en.extDescription!.message).toBe(short);
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
      ...['1-summary', '2-render', '3-ai', '4-speed', '5-audit-pdf'].map(
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
    for (const s of ['1-summary', '2-render', '3-ai', '4-speed', '5-audit-pdf'])
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
        expect(line.split(',').length - 1, line).toBeLessThanOrEqual(4);
    }
  });

  it('follows the copy rules', () => {
    expect(listing).not.toMatch(/—/);
    expect(listing).not.toMatch(/·/);
  });
});

describe('Serpline store listing in other languages', () => {
  const locales = docLocales();
  const codes = readdirSync(join(extDir, 'public/_locales'));

  it('ships the store languages, with no Azerbaijani (Chrome has no az locale)', () => {
    expect(codes.sort()).toEqual([
      'en',
      'es',
      'fr',
      'nl',
      'pt_BR',
      'pt_PT',
      'ro',
      'ru',
      'tr',
      'uk',
    ]);
  });

  it('every _locales title and short description is the one in STORE-LISTING-LOCALES.md', () => {
    for (const code of codes) {
      const lang = code.startsWith('pt') ? 'pt' : code;
      const msg = JSON.parse(
        readFileSync(join(extDir, 'public/_locales', code, 'messages.json'), 'utf8'),
      ) as Record<string, { message: string }>;
      expect(msg.extName!.message, code).toBe(locales.titles[lang]);
      expect(msg.extDescription!.message, code).toBe(locales.shorts[lang]);
      expect(msg.extName!.message.length, code).toBeLessThanOrEqual(75);
      expect(msg.extDescription!.message.length, code).toBeLessThanOrEqual(132);
    }
  });

  it('has a detailed description for every non-English language, with the contact link', () => {
    for (const lang of ['tr', 'ru', 'ro', 'uk', 'pt', 'nl', 'es', 'fr']) {
      const at = localesDoc.indexOf(`(${lang})\n\n\`\`\`\n`);
      expect(at, lang).toBeGreaterThan(-1);
      const body = localesDoc.slice(at, localesDoc.indexOf('\n```\n', at + 10));
      expect(body, lang).toContain('https://shamistanisayev.com');
    }
  });

  it('follows the copy rules', () => {
    expect(localesDoc).not.toMatch(/\u2014/);
    expect(localesDoc).not.toMatch(/\u00b7/);
  });
});

/** The title and short description tables of STORE-LISTING-LOCALES.md, keyed by language. */
function docLocales() {
  const table = (heading: string) => {
    const at = localesDoc.indexOf(heading);
    const rows = localesDoc.slice(at).split('\n## ')[0]!.split('\n');
    return Object.fromEntries(
      rows
        .filter((r) => /^\| [a-z]{2} +\|/.test(r))
        .map((r) => {
          const [, lang, text] = /^\| ([a-z]{2}) +\| (.*?) +\|$/.exec(r)!;
          return [lang!, text!];
        }),
    ) as Record<string, string>;
  };
  return { titles: table('## Titles'), shorts: table('## Short descriptions') };
}
