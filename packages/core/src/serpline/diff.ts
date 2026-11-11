/** Render diff: raw HTML vs the rendered page (SPEC §4.2, PLAN decision 8). */
import type { PageFacts, Section } from './extract.ts';

export type SignalId =
  'title' | 'description' | 'canonical' | 'robots' | 'h1' | 'words' | 'links' | 'jsonld';
export type SignalState = 'same' | 'raw_missing' | 'changed';

export interface Signal {
  id: SignalId;
  raw: string | number | string[] | null;
  rendered: string | number | string[] | null;
  state: SignalState;
}

export type AddedByJs =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'schema'; type: string }
  | { kind: 'sectionWords'; key: string; tag: string; id: string | null; words: number }
  | { kind: 'sectionLinks'; key: string; tag: string; id: string | null; links: number };

export interface RenderDiff {
  signals: Signal[];
  /** Share of the rendered text missing from the raw HTML, 0 to 1. */
  needsJs: number;
  rawWords: number;
  renderedWords: number;
  /** Elements that exist only after JavaScript, most telling first, at most `MAX_ADDED`. */
  added: AddedByJs[];
  /** Same list without the cap. */
  addedAll: AddedByJs[];
}

export const MAX_ADDED = 4;
/** A JS-only section is listed by its words when it has more than this many. */
export const SECTION_WORDS_MIN = 50;
/** ... or by its links when it adds at least this many (a link list rather than text). */
export const SECTION_LINKS_MIN = 10;

const h1Texts = (f: PageFacts) => f.headings.filter((h) => h.level === 1).map((h) => h.text);

function compare<T extends string | number | string[] | null>(
  id: SignalId,
  raw: T,
  rendered: T,
): Signal {
  const empty = (v: T) => v === null || v === '' || v === 0 || (Array.isArray(v) && !v.length);
  const eq =
    Array.isArray(raw) && Array.isArray(rendered)
      ? raw.join('\n') === rendered.join('\n')
      : raw === rendered;
  const state: SignalState = eq
    ? 'same'
    : empty(raw) && !empty(rendered)
      ? 'raw_missing'
      : 'changed';
  return { id, raw, rendered, state };
}

/** The outermost rendered sections whose key does not exist in the raw HTML. */
function jsOnlySections(raw: PageFacts, rendered: PageFacts): Section[] {
  const rawKeys = new Set(raw.sections.map((s) => s.key));
  const fresh = rendered.sections.filter((s) => !rawKeys.has(s.key));
  // Drop sections nested inside another fresh one (its path starts with the parent's path or id).
  return fresh.filter(
    (s) =>
      !fresh.some(
        (p) =>
          p !== s &&
          (s.path.startsWith(p.path + ' > ') || (p.id !== null && s.path.includes(`#${p.id} > `))),
      ),
  );
}

export function renderDiff(raw: PageFacts, rendered: PageFacts): RenderDiff {
  const signals: Signal[] = [
    compare('title', raw.title, rendered.title),
    compare('description', raw.description, rendered.description),
    compare('canonical', raw.canonical, rendered.canonical),
    compare('robots', raw.robots, rendered.robots),
    compare('h1', h1Texts(raw).length, h1Texts(rendered).length),
    compare('words', raw.words, rendered.words),
    compare('links', raw.links.length, rendered.links.length),
    compare('jsonld', raw.jsonLd.types, rendered.jsonLd.types),
  ];
  // H1 count can match while the text differs.
  const h1 = signals.find((s) => s.id === 'h1')!;
  if (h1.state === 'same' && h1Texts(raw).join('\n') !== h1Texts(rendered).join('\n'))
    h1.state = 'changed';

  const needsJs = rendered.words > 0 ? Math.max(0, 1 - raw.words / rendered.words) : 0;

  const addedAll: AddedByJs[] = [];
  const rawHeadings = new Set(raw.headings.map((h) => `${h.level}:${h.text}`));
  for (const h of rendered.headings) {
    if (h.level === 1 && !rawHeadings.has(`${h.level}:${h.text}`))
      addedAll.push({ kind: 'heading', level: h.level, text: h.text });
  }
  for (const type of rendered.jsonLd.types) {
    if (!raw.jsonLd.types.includes(type)) addedAll.push({ kind: 'schema', type });
  }
  for (const s of jsOnlySections(raw, rendered)) {
    const base = { key: s.key, tag: s.tag, id: s.id };
    if (s.links >= SECTION_LINKS_MIN)
      addedAll.push({ kind: 'sectionLinks', ...base, links: s.links });
    else if (s.words > SECTION_WORDS_MIN)
      addedAll.push({ kind: 'sectionWords', ...base, words: s.words });
  }
  // H2 and H3 come after the sections: they usually live inside them.
  for (const h of rendered.headings) {
    if (h.level > 1 && h.level <= 3 && !rawHeadings.has(`${h.level}:${h.text}`))
      addedAll.push({ kind: 'heading', level: h.level, text: h.text });
  }

  return {
    signals,
    needsJs,
    rawWords: raw.words,
    renderedWords: rendered.words,
    added: addedAll.slice(0, MAX_ADDED),
    addedAll,
  };
}

/** Rounded needs-JavaScript share in percent (91). */
export const needsJsPercent = (d: RenderDiff) => Math.round(d.needsJs * 100);
