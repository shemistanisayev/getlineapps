import { probePage, type PageProbe } from './probe.ts';

/**
 * Why a tab could not be read (docs/rivaline-SPEC.md §3.1, error texts from scripts/spike-rivaline.ts):
 * - restricted: Chrome never lets extensions read the page (chrome://, Web Store, other
 *   extensions, the PDF viewer). Shown as Restricted.
 * - noAccess: the page is readable, but this tab was not granted. Shown as Access.
 */
export type ReadFailure = 'restricted' | 'noAccess';

export type ReadResult = { ok: true; page: PageProbe } | { ok: false; reason: ReadFailure };

const RESTRICTED = [
  /chrome:\/\//i,
  /chrome-extension:\/\//i,
  /edge:\/\//i,
  /about:/i,
  /extensions gallery/i,
  /cannot be scripted/i,
  /webstore/i,
  /error page/i,
];

/** Sorts Chrome's executeScript error into restricted vs missing access. */
export function classifyError(message: string): ReadFailure {
  return RESTRICTED.some((r) => r.test(message)) ? 'restricted' : 'noAccess';
}

/** A page that ran the probe but is not a website (PDF viewer, browser pages). */
export function isRestrictedPage(page: Pick<PageProbe, 'url' | 'contentType'>): boolean {
  return (
    page.contentType === 'application/pdf' ||
    !/^https?:\/\//.test(page.url) ||
    /^https:\/\/chromewebstore\.google\.com\//.test(page.url)
  );
}

/** Reads the tab's main frame in the MAIN world (page globals are only visible there). */
export async function readTab(tabId: number): Promise<ReadResult> {
  try {
    const [frame] = await browser.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: probePage,
    });
    const page = frame?.result as PageProbe | undefined;
    if (!page) return { ok: false, reason: 'noAccess' };
    if (isRestrictedPage(page)) return { ok: false, reason: 'restricted' };
    return { ok: true, page };
  } catch (error) {
    return { ok: false, reason: classifyError(String((error as Error)?.message ?? error)) };
  }
}

/** The active tab of the panel's window. Without `tabs` the URL is hidden; the id is enough. */
export async function activeTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}
