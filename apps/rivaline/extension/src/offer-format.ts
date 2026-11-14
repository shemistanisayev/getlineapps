/**
 * Shared wording for the 1.1 research (Offer tab, Compare, report PDF): network and store names,
 * money and language names in the UI language, the price line and lead tools.
 */
import type { AppLink, LeadCapture, PriceRange, SocialNetwork } from '@line/core/rivaline';
import type { Lang, T } from './i18n/index.ts';

/** Brand names: the same in every language. */
export const NETWORK_NAMES: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X',
  telegram: 'Telegram',
  pinterest: 'Pinterest',
  threads: 'Threads',
  vk: 'VK',
};
export const STORE_NAMES: Record<AppLink['store'], string> = {
  appstore: 'App Store',
  googleplay: 'Google Play',
};

export function money(n: number, currency: string | null, lang: Lang): string {
  try {
    if (currency)
      return new Intl.NumberFormat(lang, {
        style: 'currency',
        currency,
        maximumFractionDigits: n % 1 ? 2 : 0,
      }).format(n);
  } catch {
    /* an unknown code: the number alone */
  }
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(n);
}

/** Language or country names in the UI language ("German", "Almaniya"), the code when unknown. */
export function displayNames(lang: Lang, type: 'language' | 'region'): (code: string) => string {
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames([lang, 'en'], { type });
  } catch {
    dn = null;
  }
  return (code: string) => {
    try {
      return dn?.of(code) ?? code;
    } catch {
      return code;
    }
  };
}

export function priceLine(p: PriceRange, lang: Lang, t: T): string {
  const min = money(p.min, p.currency, lang);
  const max = money(p.max, p.currency, lang);
  return p.min === p.max
    ? t('offer.priceOne', { min, n: p.count })
    : t('offer.priceRange', { min, max, n: p.count });
}

export function leadTools(l: LeadCapture, t: T): string {
  return l.tools.length ? l.tools.join(', ') : t('leads.onPage');
}
