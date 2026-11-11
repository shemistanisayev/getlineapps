import { az } from './az.ts';
import { en, type Dictionary, type MessageKey } from './en.ts';

export type Lang = 'en' | 'az';
export type { MessageKey };
export type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

const DICTS: Record<Lang, Dictionary> = { en, az };

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'az';
}

/** Replaces {name} holes. Unknown holes stay visible so a missing value is easy to spot. */
export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Returns a translator for one language. Unknown keys are a type error. */
export function translator(lang: Lang): T {
  const dict = DICTS[lang];
  return (key, vars) => fill(dict[key], vars);
}

/** "a, b and c" in the UI language. */
export function joinList(items: string[], t: T): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${t('list.and')} ${items.at(-1)}`;
}
