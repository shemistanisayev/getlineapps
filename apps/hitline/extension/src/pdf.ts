/**
 * Builds and downloads an audit PDF in the extension page. pdf-lib is loaded on first use only.
 * Fonts come from the extension's own fonts/ folder (copied at build time). No network.
 */
import type { LineReportConfig, ReportFonts } from '@line/report';

export async function downloadReport(
  build: (fonts: ReportFonts) => LineReportConfig,
): Promise<string> {
  const { buildLineReport, downloadPdf, fetchReportFonts } = await import('@line/report');
  // Extension pages are served from chrome-extension://<id>/, the fonts from its fonts/ folder.
  const fonts = await fetchReportFonts(new URL('/fonts/', location.origin).href);
  const report = await buildLineReport(build(fonts));
  downloadPdf(report.bytes, report.fileName);
  return report.fileName;
}
