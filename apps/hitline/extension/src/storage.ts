import type { CustomRule } from '@line/core/hitline';
import { isLang, type Lang } from './i18n/index.ts';

/**
 * Settings in chrome.storage.local (docs/hitline-SPEC.md §7, docs/hitline/PLAN-1.1.md):
 * domains, plans, lang, installedAt and customRules. Nothing else.
 * The popup's "show this event in DevTools" hand-off uses chrome.storage.session (memory only,
 * cleared when the browser closes), key `focus`.
 */
export async function getLang(): Promise<Lang> {
  const { lang } = await browser.storage.local.get('lang');
  return isLang(lang) ? lang : 'en';
}

export async function markInstalled(now = Date.now()): Promise<void> {
  const { installedAt } = await browser.storage.local.get('installedAt');
  if (typeof installedAt !== 'number') await browser.storage.local.set({ installedAt: now });
}

export const MAX_RULES = 20;

/** Valid custom rules from storage (anything malformed is dropped). */
export function readRules(v: unknown): CustomRule[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (r): r is CustomRule =>
        !!r &&
        typeof r === 'object' &&
        typeof (r as CustomRule).name === 'string' &&
        typeof (r as CustomRule).match === 'string' &&
        (r as CustomRule).match.trim().length >= 3,
    )
    .slice(0, MAX_RULES)
    .map((r) => ({
      name: r.name.trim().slice(0, 40),
      match: r.match.trim().slice(0, 200),
      ...(typeof r.event === 'string' && r.event.trim()
        ? { event: r.event.trim().slice(0, 80) }
        : {}),
    }));
}

export async function saveRules(rules: CustomRule[]): Promise<void> {
  await browser.storage.local.set({ customRules: rules.slice(0, MAX_RULES) });
}

/** What the popup asked the panel to show: a tab, and optionally one event. */
export interface Focus {
  tabId: number;
  tab: 'events' | 'gtm' | 'consent' | 'attribution' | 'plan';
  platform?: string;
  event?: string;
  time?: number;
  at: number;
}

type SessionArea = {
  get(k: string): Promise<Record<string, unknown>>;
  set(v: object): Promise<void>;
  remove(k: string): Promise<void>;
};
const sessionArea = (): SessionArea | undefined =>
  (browser.storage as unknown as { session?: SessionArea }).session;

export async function setFocus(f: Omit<Focus, 'at'>): Promise<void> {
  await sessionArea()?.set({ focus: { ...f, at: Date.now() } });
}

/** Reads and removes the hand-off for this tab (only when it is less than 10 minutes old). */
export async function takeFocus(tabId: number | undefined): Promise<Focus | null> {
  const area = sessionArea();
  if (!area || tabId === undefined) return null;
  const { focus } = await area.get('focus');
  const f = focus as Focus | undefined;
  if (!f || f.tabId !== tabId || Date.now() - f.at > 10 * 60_000) return null;
  await area.remove('focus');
  return f;
}
