/**
 * Content files of getlineapps.com: schemas, EN/AZ parity, copy rules, link rules,
 * and the privacy permission lists against each SPEC (and the built manifest once it exists).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TOOL_SLUGS, type ToolSlug } from '@line/core/site';
import {
  hitlineSchema,
  hubSchema,
  serplineSchema,
  rivalineSchema,
  privacyPageSchema,
  privacyToolSchema,
  sharedSchema,
  toolsSchema,
} from './schemas.ts';

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, '../../../..');
const read = (p: string) => JSON.parse(readFileSync(join(dir, p), 'utf8')) as unknown;

/** Same shape: same keys and same array lengths. Values may differ. */
function shape(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === 'object')
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]));
  return typeof v;
}

function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) =>
  f.endsWith('.json'),
);

describe('site content', () => {
  it('tools.json lists every tool once', () => {
    const tools = toolsSchema.parse(read('tools.json'));
    expect(tools.map((t) => t.slug)).toEqual([...TOOL_SLUGS]);
  });

  it('every file passes its schema', () => {
    for (const l of ['en', 'az']) {
      sharedSchema.parse(read(`shared/${l}.json`));
      hubSchema.parse(read(`hub/${l}.json`));
      privacyPageSchema.parse(read(`privacy/page.${l}.json`));
      for (const s of TOOL_SLUGS) privacyToolSchema.parse(read(`privacy/${s}.${l}.json`));
      hitlineSchema.parse(read(`hitline/${l}.json`));
      serplineSchema.parse(read(`serpline/${l}.json`));
      rivalineSchema.parse(read(`rivaline/${l}.json`));
    }
  });

  it('Azerbaijani files have the same shape as English', () => {
    const pairs = files.filter((f) => /(^|[\\/.])en\.json$/.test(f));
    expect(pairs.length).toBeGreaterThanOrEqual(8);
    for (const en of pairs) {
      const az = en.replace(/en\.json$/, 'az.json');
      expect(files, `${az} is missing`).toContain(az);
      const a = read(en) as Record<string, unknown>;
      const b = read(az) as Record<string, unknown>;
      delete a.lang;
      delete b.lang;
      expect(shape(b), az).toEqual(shape(a));
    }
  });

  it('follows the copy rules: no em dashes, no middle dots', () => {
    for (const f of files) {
      for (const s of allStrings(read(f))) {
        expect(s, f).not.toMatch(/—/);
        expect(s, f).not.toMatch(/·/);
      }
    }
  });

  it('hub roles and spots name real tools, and the first role shows all five', () => {
    for (const l of ['en', 'az']) {
      const h = hubSchema.parse(read(`hub/${l}.json`));
      expect(h.tools.roles[0]!.tools).toEqual([...TOOL_SLUGS]);
      expect(Object.keys(h.tools.cards).sort()).toEqual([...TOOL_SLUGS].sort());
      expect(new Set(h.together.spots.map((s) => s.slug)).size).toBe(5);
    }
  });
});

/** Permissions from each SPEC (§3 manifest). "key:" rows are manifest keys, not permissions. */
const SPEC_MANIFEST: Record<ToolSlug, string[]> = {
  hitline: [
    'permission:activeTab',
    'permission:scripting',
    'permission:storage',
    'key:devtools_page',
  ],
  serpline: [
    'permission:activeTab',
    'permission:scripting',
    'permission:sidePanel',
    'permission:storage',
    'optional_host:https://*/*',
  ],
  rivaline: [
    'permission:activeTab',
    'permission:scripting',
    'permission:sidePanel',
    'permission:storage',
  ],
  foldline: [
    'permission:activeTab',
    'permission:scripting',
    'permission:sidePanel',
    'permission:storage',
  ],
  markline: ['permission:activeTab', 'permission:scripting', 'permission:storage'],
};

function manifestEntries(m: {
  permissions?: string[];
  optional_host_permissions?: string[];
  devtools_page?: string;
}) {
  return [
    ...(m.permissions ?? []).map((p) => `permission:${p}`),
    ...(m.devtools_page ? ['key:devtools_page'] : []),
    ...(m.optional_host_permissions ?? [])
      .filter((p) => p.startsWith('https'))
      .map((p) => `optional_host:${p}`),
  ].sort();
}

describe('hitline landing content', () => {
  it('has no links or UTM in the copy, and the plan bars add up to the plan count', () => {
    for (const l of ['en', 'az']) {
      const h = hitlineSchema.parse(read(`hitline/${l}.json`));
      for (const s of allStrings(h)) expect(s).not.toMatch(/https?:|utm_/);
      const total = h.features.plan.demo.bars.reduce((n, b) => n + b.n, 0);
      expect(h.features.plan.demo.count).toMatch(new RegExp(`^${total} `));
      expect(h.hero.rows.some((r) => r.route === 'bad')).toBe(true);
    }
  });
});

describe('serpline landing content', () => {
  it('has no links or UTM in the copy (the preview URL is demo data)', () => {
    for (const l of ['en', 'az']) {
      const c = serplineSchema.parse(read(`serpline/${l}.json`));
      const copy = { ...c, preview: { ...c.preview, urlDefault: '' } };
      for (const s of allStrings(copy)) expect(s).not.toMatch(/https?:|utm_/);
      expect(c.preview.urlDefault).toBe('https://example.com/products/wireless-headphones-pro-x');
    }
  });

  it('follows the naming rule for the landing title (60 characters at most)', () => {
    const en = serplineSchema.parse(read('serpline/en.json'));
    const az = serplineSchema.parse(read('serpline/az.json'));
    expect(en.meta.title).toBe('Serpline: Free SEO Checker for Google, ChatGPT & More');
    expect(az.meta.title).toMatch(/^Serpline: .* və s\. üçün /);
    for (const t of [en.meta.title, az.meta.title]) expect(t.length).toBeLessThanOrEqual(60);
  });

  it('the preview demo is the same text the extension measures (cut after 107 on mobile)', () => {
    const c = serplineSchema.parse(read('serpline/en.json'));
    expect(c.preview.descDefault).toHaveLength(191);
    expect(c.hero.serp.note).toContain('107');
  });
});

describe('rivaline landing content', () => {
  it('has no links or UTM in the copy', () => {
    for (const l of ['en', 'az']) {
      for (const s of allStrings(rivalineSchema.parse(read(`rivaline/${l}.json`))))
        expect(s).not.toMatch(/https?:|utm_/);
    }
  });

  it('follows the naming rule for the landing title (60 characters at most)', () => {
    const en = rivalineSchema.parse(read('rivaline/en.json'));
    const az = rivalineSchema.parse(read('rivaline/az.json'));
    expect(en.meta.title).toBe('Rivaline: Free Competitor Research for Meta, Google & More');
    expect(az.meta.title).toMatch(/^Rivaline: .* və s\. üçün /);
    for (const t of [en.meta.title, az.meta.title]) expect(t.length).toBeLessThanOrEqual(60);
  });

  it('the shortcut is the one the extension registers (Alt+Shift+V)', () => {
    for (const l of ['en', 'az']) {
      const c = rivalineSchema.parse(read(`rivaline/${l}.json`));
      expect(c.how.steps[1]!.keys).toEqual(['Alt', 'Shift', 'V']);
    }
  });
});

describe('privacy permissions', () => {
  for (const slug of TOOL_SLUGS) {
    it(`${slug}: the page lists exactly the SPEC permissions, in both languages`, () => {
      for (const l of ['en', 'az']) {
        const p = privacyToolSchema.parse(read(`privacy/${slug}.${l}.json`));
        expect(p.perms.map((x) => x.manifest).sort()).toEqual([...SPEC_MANIFEST[slug]].sort());
      }
    });

    const built = join(root, `apps/${slug}/extension/.output/chrome-mv3/manifest.json`);
    it.runIf(existsSync(built))(`${slug}: the page matches the built manifest`, () => {
      const m = JSON.parse(readFileSync(built, 'utf8'));
      const p = privacyToolSchema.parse(read(`privacy/${slug}.en.json`));
      expect(p.perms.map((x) => x.manifest).sort()).toEqual(manifestEntries(m));
    });
  }
});
