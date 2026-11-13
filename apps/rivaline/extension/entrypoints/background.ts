import { uninstallUrl } from '@line/core/site';
import { SCAN_MESSAGE, type ScanMessage } from '../src/messages.ts';
import { markInstalled } from '../src/storage.ts';

// docs/rivaline-SPEC.md §3: open the side panel from the icon or Alt+Shift+V, then tell the panel
// which tab to read. Welcome on install, uninstall URL. No other logic, no network.
export default defineBackground(() => {
  void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

  browser.action.onClicked.addListener((tab) => {
    if (tab.id === undefined) return;
    // open() must run inside the click handler (user gesture), before any await.
    // windowId, not tabId: one panel per window, so it stays open when the user switches tabs
    // and can show the Access state (docs/rivaline/PLAN.md decision 1).
    const opened = browser.sidePanel.open({ windowId: tab.windowId });
    const message: ScanMessage = { type: SCAN_MESSAGE, tabId: tab.id };
    // A panel that is already open scans now. A panel that is just opening scans the active tab
    // itself on load (the API check showed the first message is lost), so a lost message is fine.
    void opened.then(() => browser.runtime.sendMessage(message)).catch(() => undefined);
  });

  void browser.runtime.setUninstallURL(
    uninstallUrl('rivaline', browser.runtime.getManifest().version),
  );

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason !== 'install') return;
    void markInstalled();
    void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
  });
});
