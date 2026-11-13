import { useEffect, useState } from 'react';
import { translator, type Lang } from './i18n/index.ts';
import { getLang } from './storage.ts';

/** Current UI language from settings, live-updated when Settings changes it. */
export function useT() {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    let alive = true;
    void getLang().then((l) => alive && setLang(l));
    const onChange = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area === 'local' && 'lang' in changes) void getLang().then((l) => alive && setLang(l));
    };
    browser.storage.onChanged.addListener(onChange);
    return () => {
      alive = false;
      browser.storage.onChanged.removeListener(onChange);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return { lang, t: translator(lang) };
}
