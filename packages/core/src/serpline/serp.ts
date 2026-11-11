/**
 * Google result preview (SPEC §4.3). Widths use Arial advance widths in 1/1000 em, the same table
 * as design/serpline/Landing.dc.html. The landing #preview tool imports these functions too.
 */

/** Arial advance widths for ASCII 32 to 126. Other characters count as 556. */
const ARIAL = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const OTHER = 556;

export const TITLE_SIZE = 20;
export const DESC_SIZE = 14;
export const TITLE_LIMIT = 600;
export const DESC_LIMIT = { desktop: 920, mobile: 680 } as const;
export type Device = keyof typeof DESC_LIMIT;

const ELLIPSIS = ' ...';

/** Width in px of `text` set in Arial at `size` px. */
export function measure(text: string, size: number): number {
  let units = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    units += c >= 32 && c < 127 ? ARIAL[c - 32]! : OTHER;
  }
  return (units * size) / 1000;
}

export interface Fit {
  /** Text as Google would show it (with " ..." when cut). */
  shown: string;
  cut: boolean;
  /** Characters of the original text. */
  length: number;
  /** Rounded width of the full text in px. */
  px: number;
  limit: number;
  /** Where the hidden part starts (characters shown before the cut). Equals `length` when it fits. */
  cutAfter: number;
}

/**
 * Cut to the longest prefix whose width plus " ..." fits, back off to the last space when it is
 * past 60% of the cut, strip trailing punctuation, then append " ...".
 */
export function fit(text: string, size: number, limit: number): Fit {
  const t = text.replace(/\s+/g, ' ').trim();
  const px = Math.round(measure(t, size));
  if (measure(t, size) <= limit) {
    return { shown: t, cut: false, length: t.length, px, limit, cutAfter: t.length };
  }
  let i = t.length;
  while (i > 0 && measure(t.slice(0, i) + ELLIPSIS, size) > limit) i--;
  let part = t.slice(0, i);
  let cutAfter = i;
  const space = part.lastIndexOf(' ');
  if (space > i * 0.6) {
    part = part.slice(0, space);
    // The hidden part starts after that space.
    cutAfter = space + 1;
  }
  part = part.replace(/[\s,.;:]+$/, '');
  return { shown: part + ELLIPSIS, cut: true, length: t.length, px, limit, cutAfter };
}

export const fitTitle = (title: string) => fit(title, TITLE_SIZE, TITLE_LIMIT);
export const fitDescription = (desc: string, device: Device) =>
  fit(desc, DESC_SIZE, DESC_LIMIT[device]);

/** "https://example.com › products › wireless-headphones-pro-x". */
export function urlLine(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname.split('/').filter(Boolean).map(decodeSafe);
    return `${u.protocol}//${u.host}${segs.length ? ' › ' + segs.join(' › ') : ''}`;
  } catch {
    return url;
  }
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** First label of the host, capitalized: www.example.com -> "Example". */
export function siteName(url: string): string {
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    /* host given */
  }
  const bare = host.replace(/^www\./, '').split('.')[0] || 'Site';
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}
