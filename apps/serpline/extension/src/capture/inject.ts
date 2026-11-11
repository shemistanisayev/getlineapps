/**
 * The one function Serpline runs in the checked tab (docs/serpline-SPEC.md §3.1).
 * chrome.scripting.executeScript serializes it, so it must be self-contained: no imports, no
 * closures. It only collects raw data; parsing and rules live in @line/core/serpline.
 *
 * Requests from this isolated-world function use the page's origin, so the raw HTML, robots.txt
 * and llms.txt fetches are same-origin and need no host permission.
 */

export const RAW_HTML_CAP = 5 * 1024 * 1024;
export const TEXT_FILE_CAP = 500 * 1024;

export interface FetchedFile {
  /** HTTP status, or 0 when the request failed (network error, blocked). */
  status: number;
  contentType: string;
  /** Body text, cut at the cap. Empty when status is 0. */
  text: string;
  truncated: boolean;
}

export interface RawResponse extends FetchedFile {
  /** X-Robots-Tag header of the raw response (SPEC §4.5 NOINDEX). */
  xRobotsTag: string | null;
  /** Final URL after redirects. */
  url: string;
}

export interface PageRead {
  url: string;
  origin: string;
  title: string;
  /**
   * Rendered DOM as HTML (cap 5 MB). The panel parses it with DOMParser and runs the same
   * @line/core/serpline extractors on it as on the raw HTML, so both sides are read alike.
   */
  html: string;
  htmlTruncated: boolean;
  raw: RawResponse;
  robots: FetchedFile;
  llms: FetchedFile;
}

/** Runs inside the page. Keep every helper inside this function body. */
export async function readPage(rawCap: number, fileCap: number): Promise<PageRead> {
  async function get(url: string, cap: number) {
    try {
      const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
      const full = await res.text();
      return {
        res,
        file: {
          status: res.status,
          contentType: res.headers.get('content-type') ?? '',
          text: full.length > cap ? full.slice(0, cap) : full,
          truncated: full.length > cap,
        },
      };
    } catch {
      return {
        res: null,
        file: { status: 0, contentType: '', text: '', truncated: false },
      };
    }
  }

  // Serpline's own overlay (step 5) lives in one host node; it is not part of the page.
  const root = document.documentElement.cloneNode(true) as Element;
  root.querySelectorAll('[data-serpline-overlay]').forEach((n) => n.remove());
  const rendered = '<!doctype html>\n' + root.outerHTML;

  const [raw, robots, llms] = await Promise.all([
    get(location.href, rawCap),
    get(location.origin + '/robots.txt', fileCap),
    get(location.origin + '/llms.txt', fileCap),
  ]);

  return {
    url: location.href,
    origin: location.origin,
    title: document.title,
    html: rendered.length > rawCap ? rendered.slice(0, rawCap) : rendered,
    htmlTruncated: rendered.length > rawCap,
    raw: {
      ...raw.file,
      xRobotsTag: raw.res?.headers.get('x-robots-tag') ?? null,
      url: raw.res?.url ?? location.href,
    },
    robots: robots.file,
    llms: llms.file,
  };
}
