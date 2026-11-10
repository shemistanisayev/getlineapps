// Writes the sample reports to a folder: pnpm --filter @line/report sample [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildLineReport } from '../src/build.ts';
import { loadReportFontsNode } from '../src/fonts-node.ts';
import { hitlineSample, rivalineSample } from '../src/samples.ts';

const out = resolve(process.argv[2] ?? 'dist');
mkdirSync(out, { recursive: true });
const fonts = loadReportFontsNode();
for (const cfg of [hitlineSample(fonts), rivalineSample(fonts)]) {
  const r = await buildLineReport(cfg);
  writeFileSync(join(out, r.fileName), r.bytes);
  console.log(`${r.fileName} (${r.pages} page, ${Math.round(r.bytes.length / 1024)} KB)`);
}
