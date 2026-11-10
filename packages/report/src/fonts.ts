import type { ReportFonts } from './types.ts';

/** Font files in packages/report/fonts. Extensions copy them to their public folder. */
export const REPORT_FONT_FILES: Record<keyof ReportFonts, string> = {
  regular: 'Inter_400Regular.ttf',
  semibold: 'Inter_600SemiBold.ttf',
  bold: 'Inter_700Bold.ttf',
  display: 'PlusJakartaSans_800ExtraBold.ttf',
  mono: 'JetBrainsMono_400Regular.ttf',
};

/** Browser: load the fonts from `baseUrl` (for example chrome.runtime.getURL('fonts/')). */
export async function fetchReportFonts(baseUrl: string): Promise<ReportFonts> {
  const entries = await Promise.all(
    (Object.keys(REPORT_FONT_FILES) as Array<keyof ReportFonts>).map(async (k) => {
      const res = await fetch(new URL(REPORT_FONT_FILES[k], baseUrl));
      if (!res.ok) throw new Error(`Font ${REPORT_FONT_FILES[k]} failed to load`);
      return [k, new Uint8Array(await res.arrayBuffer())] as const;
    }),
  );
  return Object.fromEntries(entries) as unknown as ReportFonts;
}

/** Browser: save the PDF through a blob URL and <a download> (no downloads permission). */
export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
