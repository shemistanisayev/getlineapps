/**
 * What Serpline measures in the live page (docs/serpline-SPEC.md §3.3): Core Web Vitals, page
 * weight, image sizes, mobile layout, the sitemap, the canonical target and the hreflang pages.
 * The extension's injected function fills these plain objects; the rules below only read them.
 */

/** Core Web Vitals and load timings of this visit, in ms (CLS has no unit). null = not measured. */
export interface Vitals {
  lcp: number | null;
  /** CSS path of the LCP element, when it is still in the page. */
  lcpPath: string | null;
  /** Tag of the LCP element ("img", "h1" ...). */
  lcpTag: string | null;
  /** Image URL when the LCP element is an image. */
  lcpUrl: string | null;
  cls: number | null;
  /** CSS paths of the elements that moved the most (largest shifts first, at most 5). */
  clsPaths: string[];
  /** Slowest interaction so far; null when the user has not clicked or typed on the page yet. */
  inp: number | null;
  fcp: number | null;
  ttfb: number | null;
  /** The page was hidden while it loaded (a background tab): LCP is not reported then. */
  hiddenAtLoad: boolean;
}

export type ResourceKind = 'document' | 'script' | 'css' | 'image' | 'font' | 'other';

export interface PageWeight {
  requests: number;
  /** Compressed body bytes of the requests whose size the browser shares. */
  bytes: number;
  byKind: Record<ResourceKind, { requests: number; bytes: number }>;
  /** Cross-origin requests whose size the server does not share (no Timing-Allow-Origin). */
  unknownSize: number;
}

export interface LiveImage {
  /** CSS path, built like @line/core/serpline cssPath. */
  path: string;
  src: string;
  file: string;
  /** Intrinsic size in px (0 until the image loaded). */
  naturalWidth: number;
  naturalHeight: number;
  /** Shown size in CSS px. */
  width: number;
  height: number;
  /** Both width and height attributes are set (or CSS aspect-ratio), so space is kept while it loads. */
  sized: boolean;
  /** `loading` attribute, lower case, or null. */
  loading: string | null;
  /** Top of the image is inside the first screen when the page loads. */
  aboveFold: boolean;
  /** Compressed bytes, null when the browser does not share it. */
  bytes: number | null;
  /** MIME type when known, else from the file extension ("image/jpeg"), else null. */
  type: string | null;
}

export interface MobileFacts {
  /** Window width and device pixel ratio when the page was checked. */
  viewportWidth: number;
  dpr: number;
  /** Page content wider than the window (horizontal scroll), in px; 0 when it fits. */
  overflow: number;
  overflowPaths: string[];
  /** Text blocks with a font smaller than 12 px, and all text blocks counted. */
  smallText: number;
  textBlocks: number;
  smallTextPaths: string[];
  /** Links and buttons smaller than 24 x 24 px (inline links in a sentence are skipped). */
  smallTargets: number;
  targets: number;
  smallTargetPaths: string[];
}

export interface UrlStatus {
  url: string;
  /** HTTP status after redirects, 0 when the request failed. */
  status: number;
  redirected: boolean;
  finalUrl: string;
}

export interface SitemapFile {
  url: string;
  /** HTTP status, 0 when the request failed, -1 when skipped (another site). */
  status: number;
  kind: 'urlset' | 'index' | 'other';
  /** `<loc>` entries in the file. */
  urls: number;
}

export interface SitemapCheck {
  /** Where the sitemap URLs came from: robots.txt `Sitemap:` lines, or /sitemap.xml by default. */
  source: 'robots' | 'default';
  files: SitemapFile[];
  /** This page (or its canonical) is listed. null when no sitemap could be read, or not all of it. */
  found: boolean | null;
  /** Every listed file was read (a big sitemap index is read up to a limit). */
  complete: boolean;
}

export interface HreflangPage extends UrlStatus {
  lang: string;
  /** The alternate page links back to this page with hreflang. null when not checked. */
  linksBack: boolean | null;
}

export interface LiveFacts {
  vitals: Vitals;
  weight: PageWeight;
  images: LiveImage[];
  mobile: MobileFacts;
  sitemap: SitemapCheck;
  /** Status of the canonical target when it is another same-origin URL, else null. */
  canonical: UrlStatus | null;
  /** Same-origin hreflang alternates (at most 10), each fetched once. */
  hreflang: HreflangPage[];
}

/** Response headers of the raw HTML that matter for SEO and speed. */
export interface RawHeaders {
  contentEncoding: string | null;
  cacheControl: string | null;
  hsts: string | null;
}

/** Google's Core Web Vitals thresholds: good up to the first value, poor above the second. */
export const THRESHOLDS = {
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
  fcp: [1800, 3000],
  ttfb: [800, 1800],
} as const;

export type Metric = keyof typeof THRESHOLDS;
export type Rating = 'good' | 'needs_improvement' | 'poor';

export function rate(metric: Metric, value: number): Rating {
  const [good, poor] = THRESHOLDS[metric];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs_improvement';
  return 'poor';
}

/** An image over this many bytes is heavy. */
export const IMG_HEAVY_BYTES = 200 * 1024;
/** Old formats are worth converting only above this size (bytes, or px area when bytes are unknown). */
export const IMG_FORMAT_MIN_BYTES = 30 * 1024;
export const IMG_FORMAT_MIN_AREA = 200 * 200;
/** An image is oversized when its intrinsic width exceeds the shown width x DPR by this factor. */
export const IMG_OVERSIZE_FACTOR = 1.5;
export const IMG_OVERSIZE_MIN_PX = 300;
/** Uncompressed HTML above this size should be gzip or brotli. */
export const COMPRESS_MIN_BYTES = 2 * 1024;
/** Small text and small targets become an issue above these shares. */
export const SMALL_TEXT_SHARE = 0.2;
export const SMALL_TARGET_MIN = 3;

const LEGACY = /^image\/(jpeg|jpg|png|gif|bmp)$/i;

export const isLegacyFormat = (img: LiveImage) => !!img.type && LEGACY.test(img.type);

/** "image/jpeg" from a URL's extension; null when the URL has none we know. */
export function typeFromUrl(url: string): string | null {
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    /* keep */
  }
  const ext = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
  };
  return (ext && map[ext]) || null;
}

export interface ImageFindings {
  lazyTop: LiveImage[];
  heavy: LiveImage[];
  unsized: LiveImage[];
  legacy: LiveImage[];
  oversized: LiveImage[];
}

export function imageFindings(images: LiveImage[], dpr: number): ImageFindings {
  const shown = images.filter((i) => i.width > 0 && i.height > 0 && !i.src.startsWith('data:'));
  const ratio = Math.max(1, dpr || 1);
  return {
    lazyTop: shown.filter((i) => i.aboveFold && i.loading === 'lazy'),
    heavy: shown.filter((i) => (i.bytes ?? 0) > IMG_HEAVY_BYTES),
    unsized: shown.filter((i) => !i.sized),
    legacy: shown.filter(
      (i) =>
        isLegacyFormat(i) &&
        (i.bytes !== null
          ? i.bytes >= IMG_FORMAT_MIN_BYTES
          : i.naturalWidth * i.naturalHeight >= IMG_FORMAT_MIN_AREA),
    ),
    oversized: shown.filter(
      (i) =>
        i.naturalWidth >= IMG_OVERSIZE_MIN_PX &&
        i.naturalWidth > i.width * ratio * IMG_OVERSIZE_FACTOR,
    ),
  };
}

/** "1.2 MB", "340 KB", "900 B". */
export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** "2.4 s" for 2400 ms, "640 ms" under a second; CLS with two decimals. */
export function formatMetric(metric: Metric, value: number): string {
  if (metric === 'cls') return value.toFixed(2);
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
}
