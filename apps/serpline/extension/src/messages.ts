/** Background -> side panel: the user clicked the icon (or pressed Alt+Shift+S) on this tab. */
export const CHECK_MESSAGE = 'serpline:check';

export interface CheckMessage {
  type: typeof CHECK_MESSAGE;
  tabId: number;
}

export function isCheckMessage(value: unknown): value is CheckMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as CheckMessage).type === CHECK_MESSAGE &&
    typeof (value as CheckMessage).tabId === 'number'
  );
}

/** Page overlay -> side panel: the user pressed "Hide" in the page's highlight pill. */
export const OVERLAY_HIDDEN_MESSAGE = 'serpline:overlay-hidden';

export function isOverlayHiddenMessage(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === OVERLAY_HIDDEN_MESSAGE
  );
}

/**
 * Page -> side panel while a check runs: which part of the page read finished (step), or how many
 * internal links are checked (done of total). Stays inside the extension, nothing leaves the browser.
 */
export const PROGRESS_MESSAGE = 'serpline:progress';

export type ReadStep = 'rendered' | 'raw' | 'files';

export interface ProgressMessage {
  type: typeof PROGRESS_MESSAGE;
  step?: ReadStep;
  done?: number;
  total?: number;
}

export function isProgressMessage(value: unknown): value is ProgressMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === PROGRESS_MESSAGE
  );
}
