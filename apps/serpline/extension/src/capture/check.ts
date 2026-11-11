import { readPage, RAW_HTML_CAP, TEXT_FILE_CAP, type PageRead } from './inject.ts';

/**
 * Why a check could not run:
 * - restricted: Chrome never lets extensions read the page (chrome://, Web Store, PDF viewer ...).
 * - noAccess: the page is readable, but Serpline has no access to this tab right now. The user
 *   clicks the icon or presses Alt+Shift+S (grants activeTab), or allows the site (SPEC §3.2).
 */
export type CheckFailure = 'restricted' | 'noAccess';

export type CheckResult = { ok: true; page: PageRead } | { ok: false; reason: CheckFailure };

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
export function classifyError(message: string): CheckFailure {
  return RESTRICTED.some((r) => r.test(message)) ? 'restricted' : 'noAccess';
}

/** Runs readPage in the tab's main frame (isolated world). */
export async function checkTab(tabId: number): Promise<CheckResult> {
  try {
    const [frame] = await browser.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: readPage,
      args: [RAW_HTML_CAP, TEXT_FILE_CAP],
    });
    const page = frame?.result as PageRead | undefined;
    if (!page) return { ok: false, reason: 'noAccess' };
    // The PDF viewer and other plugin pages run the script but have no document to read.
    if (/^(chrome|edge|about|chrome-extension):/.test(page.url)) {
      return { ok: false, reason: 'restricted' };
    }
    return { ok: true, page };
  } catch (error) {
    return { ok: false, reason: classifyError(String((error as Error)?.message ?? error)) };
  }
}

/**
 * Asks Chrome for access to one site (its own prompt). Must run inside the user's click.
 * Serpline has no `tabs` permission, so it cannot see the new tab's URL; it can only offer this
 * for the origin of the page it checked before (same-site navigation, the common Stale case).
 */
export async function requestSite(origin: string): Promise<boolean> {
  if (!/^https?:\/\//.test(origin)) return false;
  try {
    return await browser.permissions.request({ origins: [`${origin}/*`] });
  } catch {
    return false;
  }
}

/** The active tab of the panel's window. Without `tabs` the URL is hidden; the id is enough. */
export async function activeTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}
