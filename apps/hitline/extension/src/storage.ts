import { isLang, type Lang } from './i18n/index.ts';

/**
 * Settings in chrome.storage.local (docs/hitline-SPEC.md §7). These keys and nothing else:
 * domains, plans, lang, installedAt. Domains and plans are added in later steps.
 */
export async function getLang(): Promise<Lang> {
  const { lang } = await browser.storage.local.get('lang');
  return isLang(lang) ? lang : 'en';
}

export async function markInstalled(now = Date.now()): Promise<void> {
  const { installedAt } = await browser.storage.local.get('installedAt');
  if (typeof installedAt !== 'number') await browser.storage.local.set({ installedAt: now });
}
