import { isLang, type Lang } from './i18n/index.ts';

/**
 * Settings in chrome.storage.local (docs/serpline-SPEC.md §7). These keys and nothing else:
 * lang, previewDevice, autoCheckLinks, installedAt. The panel reads previewDevice and
 * autoCheckLinks; Settings (step 7) writes them. Check results are never stored.
 */
export async function getLang(): Promise<Lang> {
  const { lang } = await browser.storage.local.get('lang');
  return isLang(lang) ? lang : 'en';
}

export async function markInstalled(now = Date.now()): Promise<void> {
  const { installedAt } = await browser.storage.local.get('installedAt');
  if (typeof installedAt !== 'number') await browser.storage.local.set({ installedAt: now });
}

export type PreviewDevice = 'mobile' | 'desktop';

/** Google preview default device (Settings). Default: mobile. */
export async function getPreviewDevice(): Promise<PreviewDevice> {
  const { previewDevice } = await browser.storage.local.get('previewDevice');
  return previewDevice === 'desktop' ? 'desktop' : 'mobile';
}

/** "Check internal links on open" (Settings). Default: off. */
export async function getAutoCheckLinks(): Promise<boolean> {
  const { autoCheckLinks } = await browser.storage.local.get('autoCheckLinks');
  return autoCheckLinks === true;
}
