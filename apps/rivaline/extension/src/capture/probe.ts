/**
 * Step 2 read of the page (docs/rivaline/PLAN.md). Runs in the page's MAIN world through
 * chrome.scripting.executeScript, so it must be self-contained and return plain data only.
 * Read only: it never changes the page. The full snapshot (SPEC §4.1) replaces it in step 5.
 */
export interface PageProbe {
  url: string;
  origin: string;
  title: string;
  /** `document.contentType`: Chrome's PDF viewer can be scripted, so PDFs are caught by this. */
  contentType: string;
  readyState: DocumentReadyState;
  scripts: number;
  resources: number;
}

export function probePage(): PageProbe {
  return {
    url: location.href,
    origin: location.origin,
    title: document.title,
    contentType: document.contentType,
    readyState: document.readyState,
    scripts: document.scripts.length,
    resources: performance.getEntriesByType('resource').length,
  };
}
