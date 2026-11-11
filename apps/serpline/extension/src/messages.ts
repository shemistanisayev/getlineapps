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
