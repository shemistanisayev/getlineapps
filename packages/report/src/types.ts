import type { ToolSlug } from '@line/core/site';

/** TTF bytes for the embedded fonts (subset on embed, text stays selectable). */
export interface ReportFonts {
  regular: Uint8Array; // Inter 400
  semibold: Uint8Array; // Inter 600
  bold: Uint8Array; // Inter 700
  display: Uint8Array; // Plus Jakarta Sans 800
  mono: Uint8Array; // JetBrains Mono 400
}

export type TileTone = 'neutral' | 'high' | 'medium' | 'warning' | 'ok';
export type Severity = 'high' | 'medium' | 'low';

export interface Tile {
  value: string | number;
  label: string;
  /** high = Problem colors, medium = Warning colors, warning = Warning colors with a warning icon. */
  tone?: TileTone;
}

export interface KeyValueRow {
  k: string;
  v: string;
}

export interface SeverityItem {
  level: Severity;
  /** Bold first sentence. */
  lead: string;
  /** The fix. */
  text: string;
}

export interface KeyValueSection {
  type: 'kv';
  title: string;
  rows: KeyValueRow[];
}
export interface SeveritySection {
  type: 'severity';
  title: string;
  items: SeverityItem[];
}
export interface TextSection {
  type: 'text';
  title: string;
  text: string;
}
export interface SwatchSection {
  type: 'swatches';
  title: string;
  colors: string[];
  note?: string;
}
export interface LinksSection {
  type: 'links';
  title: string;
  rows: Array<{ label: string; linkText: string; href: string }>;
}
export type Section =
  KeyValueSection | SeveritySection | TextSection | SwatchSection | LinksSection;
/** Two sections side by side (for example Brand kit and Ad libraries). */
export interface ColumnsSection {
  type: 'columns';
  columns: [Section, Section];
}
export type ExtraSection = Section | ColumnsSection;

export interface LineReportConfig {
  tool: ToolSlug;
  /** Shown top right, already formatted for the UI language. */
  dateLabel: string;
  /** Used for the file name and PDF metadata. */
  date: Date;
  eyebrow: string;
  host: string;
  subline: string;
  tiles: [Tile, Tile, Tile, Tile];
  keyValue: KeyValueSection;
  severity: SeveritySection;
  extras?: ExtraSection[];
  cta: { title: string; sub: string; label: string; href: string };
  /** Defaults to "Made with <Tool>. No data left the browser." */
  footer?: string;
  /** Defaults to "Page {i} of {n}". */
  pageLabel?: (page: number, total: number) => string;
  severityLabels?: Record<Severity, string>;
  /** File name stem, for example "hitline-audit" -> hitline-audit-<host>-<yyyy-mm-dd>.pdf */
  fileStem: string;
  fonts: ReportFonts;
}

/** One drawn text run, in design pixels (A4 = 794 x 1123, top-left origin). Used for snapshot tests. */
export interface LayoutText {
  page: number;
  x: number;
  y: number;
  size: number;
  font: keyof ReportFonts;
  text: string;
}

export interface LineReport {
  bytes: Uint8Array;
  fileName: string;
  pages: number;
  layout: LayoutText[];
}
