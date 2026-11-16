/** docs/hitline/STORE-LISTING.md stays in line with the manifest and the store limits. */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const listing = read('../../../../docs/hitline/STORE-LISTING.md');
const config = read('../wxt.config.ts');
const pkg = JSON.parse(read('../package.json')) as { version: string };
const extDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const en = JSON.parse(read('../public/_locales/en/messages.json')) as Record<
  string,
  { message: string }
>;
const localesDoc = read('../../../../docs/hitline/STORE-LISTING-LOCALES.md');

/** The first fenced block after a heading line that contains `label`. */
function block(label: string, from = 0): string {
  const at = listing.indexOf(label, from);
  const start = listing.indexOf('```\n', at) + 4;
  return listing.slice(start, listing.indexOf('\n```', start));
}

describe('Hitline store listing', () => {
  it('the English short description is the manifest description, within 132 characters', () => {
    const short = block('**Short description** (from the manifest');
    expect(config).toContain("description: '__MSG_extDescription__'");
    expect(en.extDescription!.message).toBe(short);
    expect(short.length).toBeLessThanOrEqual(132);
  });

  it('the listing title is the manifest name, within 75 characters', () => {
    const name = block('**Name** (from the manifest');
    expect(config).toContain("name: '__MSG_extName__'");
    expect(en.extName!.message).toBe(name);
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

describe('Hitline store listing in other languages', () => {
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
