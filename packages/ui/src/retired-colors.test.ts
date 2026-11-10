import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** Retired colors from docs/line-family-colors.md. They must not appear anywhere in the code. */
const RETIRED_COLORS = [
  '#15803D',
  '#86EFAC',
  '#C2410C',
  '#FDBA74',
  '#A16207',
  '#FDE047',
  '#A21CAF',
  '#F0ABFC',
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// docs/ and design/ document the old colors on purpose; build output is not source.
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'docs',
  'design',
  'dist',
  '.output',
  '.wxt',
  '.astro',
  'test-results',
  'playwright-report',
  'coverage',
]);
const TEXT = /\.(ts|tsx|js|mjs|cjs|jsx|css|scss|html|astro|json|md|svg|yml|yaml|txt)$/i;
const SELF = fileURLToPath(import.meta.url);

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (TEXT.test(name) && full !== SELF) yield full;
  }
}

describe('retired colors', () => {
  it('appear nowhere in the repo outside docs/ and design/', () => {
    const pattern = new RegExp(
      '#(' + RETIRED_COLORS.map((c) => c.slice(1)).join('|') + ')(?![0-9a-f])',
      'i',
    );
    const hits: string[] = [];
    for (const file of walk(ROOT)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const m = line.match(pattern);
          if (m) hits.push(relative(ROOT, file) + ':' + (i + 1) + ' ' + m[0]);
        });
    }
    expect(hits).toEqual([]);
  });

  it('the check itself catches a retired color', () => {
    const pattern = new RegExp('#(' + RETIRED_COLORS.map((c) => c.slice(1)).join('|') + ')', 'i');
    expect(pattern.test('color: #15803d;')).toBe(true);
    expect(pattern.test('color: #7F56D9;')).toBe(false);
  });
});
