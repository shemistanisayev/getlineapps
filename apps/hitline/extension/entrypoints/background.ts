import { uninstallUrl } from '@line/core/site';
import { markInstalled } from '../src/storage.ts';

// docs/hitline-SPEC.md §3: welcome on install, uninstall URL. No other logic, no network.
export default defineBackground(() => {
  void browser.runtime.setUninstallURL(
    uninstallUrl('hitline', browser.runtime.getManifest().version),
  );

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason !== 'install') return;
    void markInstalled();
    void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
  });
});
