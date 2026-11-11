/**
 * Serpline core logic (SPEC §4): pure TypeScript. The only DOM use is DOMParser in `parseHtml`,
 * available in the side panel and in tests (happy-dom).
 */
export const TOOL = 'serpline' as const;

export * from './serp.ts';
export * from './robots.ts';
export * from './bots.ts';
export * from './extract.ts';
export * from './diff.ts';
export * from './links.ts';
export * from './issues.ts';
export * from './analyze.ts';
