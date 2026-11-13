/**
 * Why a tab could not be read (docs/rivaline-SPEC.md §3.1, error texts from scripts/spike-rivaline.ts):
 * - restricted: Chrome never lets extensions read the page (chrome://, Web Store, other
 *   extensions, the PDF viewer). Shown as Restricted.
 * - noAccess: the page is readable, but this tab was not granted. Shown as Access.
 */
export type ReadFailure = 'restricted' | 'noAccess';

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
export function isRestrictedPage(page: { url: string; contentType: string }): boolean {
  return (
    page.contentType === 'application/pdf' ||
    !/^https?:\/\//.test(page.url) ||
    /^https:\/\/chromewebstore\.google\.com\//.test(page.url)
  );
}

/** The active tab of the panel's window. Without `tabs` the URL is hidden; the id is enough. */
export async function activeTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}
