import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REPORT_FONT_FILES } from './fonts.ts';
import type { ReportFonts } from './types.ts';

/** Node (tests, scripts): read the fonts from packages/report/fonts. */
export function loadReportFontsNode(): ReportFonts {
  const out = {} as ReportFonts;
  for (const [k, file] of Object.entries(REPORT_FONT_FILES)) {
    out[k as keyof ReportFonts] = new Uint8Array(
      readFileSync(fileURLToPath(new URL(`../fonts/${file}`, import.meta.url))),
    );
  }
  return out;
}
