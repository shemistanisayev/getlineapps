/** Background -> side panel: the user clicked the icon (or pressed Alt+Shift+V) on this tab. */
export const SCAN_MESSAGE = 'rivaline:scan';

export interface ScanMessage {
  type: typeof SCAN_MESSAGE;
  tabId: number;
}

export function isScanMessage(value: unknown): value is ScanMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as ScanMessage).type === SCAN_MESSAGE &&
    typeof (value as ScanMessage).tabId === 'number'
  );
}
