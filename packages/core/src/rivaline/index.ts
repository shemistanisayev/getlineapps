/**
 * Rivaline core logic (pure TypeScript, no DOM, no chrome.*): stack rules and matcher, gaps,
 * summary, ad library links, brand kit (docs/rivaline-SPEC.md §4 to §6), and the 1.1 competitor
 * research: offer, channels, markets, lead capture (docs/rivaline/PLAN-1.1.md).
 */
export const TOOL = 'rivaline' as const;

export * from './types.ts';
export * from './match.ts';
export * from './ads.ts';
export * from './brand.ts';
export * from './research.ts';
export * from './compare.ts';
export * from './countries.ts';
export {
  RULES,
  GLOBAL_PATHS,
  SELECTORS,
  VALUE_PATHS,
  KEY_VALUE_PATHS,
  AD_CHANNELS,
} from './rules/index.ts';
