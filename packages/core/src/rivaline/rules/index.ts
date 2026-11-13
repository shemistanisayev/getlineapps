/** Every Rivaline rule (docs/rivaline-SPEC.md §4.2), one list per category. */
import type { Rule } from '../types.ts';
import { ADVERTISING } from './advertising.ts';
import { ANALYTICS } from './analytics.ts';
import { AB_TESTING, AFFILIATE, ECOMMERCE, PAYMENTS, REVIEWS } from './commerce.ts';
import { CHAT, CRM, EMAIL } from './crm-email-chat.ts';
import { CONSENT, TAG_MANAGEMENT } from './tags-consent.ts';

export { AD_CHANNELS } from './advertising.ts';
export { GOOGLE_COLLECT_HOSTS } from './analytics.ts';

export const RULES: Rule[] = [
  ...ADVERTISING,
  ...ANALYTICS,
  ...TAG_MANAGEMENT,
  ...CONSENT,
  ...CRM,
  ...EMAIL,
  ...CHAT,
  ...AB_TESTING,
  ...ECOMMERCE,
  ...REVIEWS,
  ...PAYMENTS,
  ...AFFILIATE,
];

/** Global paths collectSnapshot checks (`Shopify`, `$crisp` ...). */
export const GLOBAL_PATHS: string[] = [...new Set(RULES.flatMap((r) => r.global ?? []))];

/** DOM selectors collectSnapshot checks. */
export const SELECTORS: string[] = [...new Set(RULES.flatMap((r) => r.selector ?? []))];

/**
 * Values collectSnapshot reads (SPEC §4.1). `keys:` returns the object's keys, else the value as a
 * string. Whitelisted: only these, never anything else from the page.
 */
export const VALUE_PATHS: string[] = [
  ...new Set(
    RULES.flatMap((r) => (r.ids ?? []).filter((e) => e.from === 'value').map((e) => e.path!)),
  ),
];

/** Of VALUE_PATHS, the ones read as a list of object keys. */
export const KEY_VALUE_PATHS = new Set(['google_tag_manager', 'ttq._i']);
