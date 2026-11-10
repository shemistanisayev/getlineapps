/**
 * Hitline core logic (pure TypeScript, no DOM, no chrome.*).
 * docs/hitline-SPEC.md §4, docs/hitline/PLAN.md.
 */
export const TOOL = 'hitline' as const;

export * from './types.ts';
export * from './domain.ts';
export * from './decode.ts';
export * from './classify.ts';
export * from './datalayer.ts';
export * from './consent.ts';
export * from './sgtm.ts';
export * from './attribution.ts';
export * from './plan.ts';
export * from './gtm.ts';
export * from './issues.ts';
export * from './analyze.ts';
export * from './popup.ts';
