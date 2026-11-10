import { az } from './az.ts';
import { en, type Dictionary, type MessageKey } from './en.ts';

export type Lang = 'en' | 'az';
export type { MessageKey };

const DICTS: Record<Lang, Dictionary> = { en, az };

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'az';
}

/** Returns a translator for one language. Unknown keys are a type error. */
export function translator(lang: Lang): (key: MessageKey) => string {
  const dict = DICTS[lang];
  return (key) => dict[key];
}
