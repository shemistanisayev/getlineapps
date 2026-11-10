/**
 * Rewrites the "Extension" table in docs/hitline/AZ-REVIEW.md from the i18n dictionaries.
 * Run: pnpm exec tsx scripts/az-review-hitline.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { az } from '../apps/hitline/extension/src/i18n/az.ts';
import { en } from '../apps/hitline/extension/src/i18n/en.ts';

const file = 'docs/hitline/AZ-REVIEW.md';
const doc = readFileSync(file, 'utf8');
const start = doc.indexOf('## Extension');
const end = doc.indexOf('## Sayt');
if (start < 0 || end < 0) throw new Error('AZ-REVIEW.md sections not found');
const esc = (s: string) => s.replace(/\|/g, '\\|');
const rows = (Object.keys(en) as (keyof typeof en)[])
  .map((k) => `| \`${k}\` | ${esc(en[k])} | ${esc(az[k])} |`)
  .join('\n');
const block = `## Extension (popup, panel, welcome)

Fayl: \`apps/hitline/extension/src/i18n/az.ts\`. {platform}, {event} kimi yerlər avtomatik dolur.

| Açar | English | Azərbaycanca |
|---|---|---|
${rows}

`;
writeFileSync(file, doc.slice(0, start) + block + doc.slice(end));
console.log(`${Object.keys(en).length} extension strings written`);
