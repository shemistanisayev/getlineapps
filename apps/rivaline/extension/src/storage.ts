import { isLang, type Lang } from './i18n/index.ts';

/**
 * Settings in chrome.storage.local (docs/rivaline-SPEC.md §3 and §7). These keys and nothing else:
 * lang, country, installedAt. Scan results are never stored.
 */
export async function getLang(): Promise<Lang> {
  const { lang } = await browser.storage.local.get('lang');
  return isLang(lang) ? lang : 'en';
}

export async function markInstalled(now = Date.now()): Promise<void> {
  const { installedAt } = await browser.storage.local.get('installedAt');
  if (typeof installedAt !== 'number') await browser.storage.local.set({ installedAt: now });
}

/** The real shortcut of the action (people can change it), split into keys. Empty when unset. */
export async function actionShortcut(): Promise<string[]> {
  const commands = await browser.commands.getAll();
  const key = commands.find((c) => c.name === '_execute_action')?.shortcut ?? '';
  return key ? key.split('+') : [];
}

/** Default country for the ad library searches (Settings, step 7). "ALL" when not set. */
export async function getCountry(): Promise<string> {
  const { country } = await browser.storage.local.get('country');
  return typeof country === 'string' && country ? country : 'ALL';
}

export async function setCountry(country: string): Promise<void> {
  await browser.storage.local.set({ country });
}

export async function setLang(lang: Lang): Promise<void> {
  await browser.storage.local.set({ lang });
}

/** "Clear all settings": removes every key Rivaline stores (lang, country, installedAt). */
export async function clearSettings(): Promise<void> {
  await browser.storage.local.clear();
}
