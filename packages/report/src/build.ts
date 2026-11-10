import fontkit from '@pdf-lib/fontkit';
import {
  LineCapStyle,
  PDFDocument,
  PDFName,
  PDFString,
  rgb,
  setCharacterSpacing,
  type PDFFont,
  type PDFPage,
  type RGB,
} from 'pdf-lib';
import {
  BRANDS,
  LIME,
  LIME_INK,
  LOGO_GLYPHS,
  STATUS,
  logoColors,
  logoMetrics,
} from '@line/ui/brand';
import type {
  ExtraSection,
  LayoutText,
  LineReport,
  LineReportConfig,
  ReportFonts,
  Section,
  Severity,
  SeveritySection,
  KeyValueSection,
  TileTone,
} from './types.ts';

/* Page geometry in design pixels (the Report artboards are 794 x 1123 at 96 dpi). */
export const PAGE_W = 794;
export const PAGE_H = 1123;
const PX = 0.75; // px -> pt
const PAD_X = 52;
const PAD_Y = 48;
const CONTENT_W = PAGE_W - PAD_X * 2;
const GAP = 22;
const FOOTER_H = 12;

const C = {
  ink: '#0B0B14',
  text2: '#4A4A5C',
  muted: '#6B6B80',
  rule: '#E6E3F0',
  rowRule: '#EEECF4',
  tile: '#F7F7FB',
  ctaBg: '#0B0B14',
  ctaTitle: '#F7F7FB',
  ctaSub: '#C9C9D9',
};

function hex(h: string): RGB {
  const n = h.replace('#', '');
  return rgb(
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255,
  );
}

function roundRect(w: number, h: number, r: number) {
  return `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
}

/** Baseline offset from the top of a CSS line box (Inter metrics, close enough for Jakarta). */
const baseline = (size: number, lineHeight = 1.21) => ((lineHeight - 1.21) / 2 + 0.969) * size;

interface Run {
  text: string;
  font: keyof ReportFonts;
}

const SEVERITY_TONE: Record<Severity, { text: string; bg: string; border: string }> = {
  high: STATUS.problem,
  medium: STATUS.warning,
  low: STATUS.neutral,
};

const TILE_TONE: Record<TileTone, { bg: string; value: string; label: string }> = {
  neutral: { bg: C.tile, value: C.ink, label: C.text2 },
  ok: { bg: STATUS.ok.bg, value: STATUS.ok.text, label: STATUS.ok.text },
  high: { bg: STATUS.problem.bg, value: STATUS.problem.text, label: STATUS.problem.text },
  medium: { bg: STATUS.warning.bg, value: STATUS.warning.text, label: STATUS.warning.text },
  warning: { bg: STATUS.warning.bg, value: STATUS.warning.text, label: STATUS.warning.text },
};

class Writer {
  pages: PDFPage[] = [];
  layout: LayoutText[] = [];
  y = PAD_Y;
  /** Index of the page being drawn on. */
  cur = 0;
  bottom: number;

  constructor(
    readonly doc: PDFDocument,
    readonly f: Record<keyof ReportFonts, PDFFont>,
  ) {
    this.bottom = PAGE_H - PAD_Y - FOOTER_H - GAP;
    this.newPage();
  }

  get page(): PDFPage {
    return this.pages[this.cur]!;
  }

  newPage() {
    this.pages.push(this.doc.addPage([PAGE_W * PX, PAGE_H * PX]));
    this.cur = this.pages.length - 1;
    this.y = PAD_Y;
  }

  /** Start a new page when `h` pixels do not fit. */
  ensure(h: number) {
    if (this.y + h > this.bottom && this.y > PAD_Y) this.newPage();
  }

  width(text: string, font: keyof ReportFonts, size: number, spacing = 0) {
    return (
      this.f[font].widthOfTextAtSize(text, size * PX) / PX + spacing * Math.max(0, text.length - 1)
    );
  }

  /** Draw text with its CSS line box top at `top`. */
  text(
    text: string,
    x: number,
    top: number,
    size: number,
    font: keyof ReportFonts,
    color: string,
    opts: { lineHeight?: number; spacing?: number; draw?: boolean } = {},
  ) {
    if (opts.draw === false || !text) return;
    const y = top + baseline(size, opts.lineHeight);
    const page = this.page;
    if (opts.spacing) page.pushOperators(setCharacterSpacing(opts.spacing * PX));
    page.drawText(text, {
      x: x * PX,
      y: (PAGE_H - y) * PX,
      size: size * PX,
      font: this.f[font],
      color: hex(color),
    });
    if (opts.spacing) page.pushOperators(setCharacterSpacing(0));
    this.layout.push({
      page: this.cur + 1,
      x: round(x),
      y: round(y),
      size,
      font,
      text,
    });
  }

  rect(x: number, top: number, w: number, h: number, r: number, fill: string, border?: string) {
    if (r === 0) {
      this.page.drawRectangle({
        x: x * PX,
        y: (PAGE_H - top - h) * PX,
        width: w * PX,
        height: h * PX,
        color: hex(fill),
      });
      return;
    }
    this.page.drawSvgPath(roundRect(w * PX, h * PX, r * PX), {
      x: x * PX,
      y: (PAGE_H - top) * PX,
      color: hex(fill),
      ...(border ? { borderColor: hex(border), borderWidth: PX } : {}),
    });
  }

  line(x1: number, top: number, x2: number, color: string) {
    this.page.drawLine({
      start: { x: x1 * PX, y: (PAGE_H - top) * PX },
      end: { x: x2 * PX, y: (PAGE_H - top) * PX },
      thickness: PX,
      color: hex(color),
    });
  }

  link(x: number, top: number, w: number, h: number, url: string) {
    const ctx = this.doc.context;
    const annot = ctx.register(
      ctx.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [x * PX, (PAGE_H - top - h) * PX, (x + w) * PX, (PAGE_H - top) * PX],
        Border: [0, 0, 0],
        A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
      }),
    );
    this.page.node.addAnnot(annot);
  }

  /** Wrap runs into lines no wider than `maxW`. */
  wrap(runs: Run[], size: number, maxW: number): Run[][] {
    const words: Run[] = [];
    for (const r of runs) {
      for (const [i, w] of r.text.split(' ').entries()) {
        if (i > 0) words.push({ text: ' ', font: r.font });
        if (w) words.push({ text: w, font: r.font });
      }
    }
    const lines: Run[][] = [];
    let line: Run[] = [];
    let lineW = 0;
    for (const w of words) {
      const ww = this.width(w.text, w.font, size);
      if (w.text === ' ') {
        if (line.length) {
          line.push(w);
          lineW += ww;
        }
        continue;
      }
      if (lineW + ww > maxW && line.length) {
        while (line.length && line[line.length - 1]!.text === ' ') line.pop();
        lines.push(line);
        line = [];
        lineW = 0;
      }
      line.push(w);
      lineW += ww;
    }
    while (line.length && line[line.length - 1]!.text === ' ') line.pop();
    if (line.length) lines.push(line);
    return lines.map(merge);
  }

  /** Draw wrapped runs; returns the height used. */
  paragraph(
    runs: Run[],
    x: number,
    top: number,
    maxW: number,
    size: number,
    color: string,
    lineHeight: number,
    draw = true,
  ) {
    const lines = this.wrap(runs, size, maxW);
    const lh = size * lineHeight;
    if (draw) {
      lines.forEach((l, i) => {
        let cx = x;
        for (const r of l) {
          this.text(r.text, cx, top + i * lh, size, r.font, color, { lineHeight });
          cx += this.width(r.text, r.font, size);
        }
      });
    }
    return Math.max(1, lines.length) * lh;
  }
}

function merge(line: Run[]): Run[] {
  const out: Run[] = [];
  for (const r of line) {
    const last = out[out.length - 1];
    if (last && last.font === r.font) last.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

/* Sections */

const H2 = 14;
const H2_LH = 1.21 * H2;

function drawH2(w: Writer, title: string, x: number, draw: boolean) {
  w.text(title, x, w.y, H2, 'display', C.ink, { draw });
}

function kvRowHeight(w: Writer, v: string, width: number) {
  return (
    14 + w.paragraph([{ text: v, font: 'regular' }], 0, 0, width - 150, 11.5, C.ink, 1.5, false)
  );
}

function drawKv(w: Writer, s: KeyValueSection, x: number, width: number, draw: boolean) {
  const start = w.y;
  const first = s.rows[0];
  if (draw) w.ensure(H2_LH + 8 + (first ? kvRowHeight(w, first.v, width) : 0));
  drawH2(w, s.title, x, draw);
  w.y += H2_LH + 8;
  if (draw) w.line(x, w.y, x + width, C.rowRule);
  for (const row of s.rows) {
    const h = kvRowHeight(w, row.v, width);
    if (draw) {
      const before = w.pages.length;
      w.ensure(h);
      if (w.pages.length !== before) w.line(x, w.y, x + width, C.rowRule);
      w.text(row.k, x, w.y + 7, 11.5, 'regular', C.muted, { lineHeight: 1.5 });
      w.paragraph(
        [{ text: row.v, font: 'regular' }],
        x + 150,
        w.y + 7,
        width - 150,
        11.5,
        C.ink,
        1.5,
      );
      w.line(x, w.y + h, x + width, C.rowRule);
    }
    w.y += h;
  }
  return w.y - start;
}

function severityRowHeight(w: Writer, it: { lead: string; text: string }, width: number) {
  return w.paragraph(
    [
      { text: it.lead + ' ', font: 'bold' },
      { text: it.text, font: 'regular' },
    ],
    0,
    0,
    width - 82,
    11.5,
    C.ink,
    1.5,
    false,
  );
}

function drawSeverity(
  w: Writer,
  s: SeveritySection,
  x: number,
  width: number,
  labels: Record<Severity, string>,
  draw: boolean,
) {
  const start = w.y;
  const first = s.items[0];
  if (draw) w.ensure(H2_LH + 10 + (first ? severityRowHeight(w, first, width) : 0));
  drawH2(w, s.title, x, draw);
  w.y += H2_LH + 10;
  s.items.forEach((it, i) => {
    const h = severityRowHeight(w, it, width);
    if (draw) {
      w.ensure(h);
      const tone = SEVERITY_TONE[it.level];
      const label = labels[it.level];
      const pw = w.width(label, 'bold', 11) + 18 + 2;
      w.rect(x, w.y + 1.5, pw, 15.5, 7.75, tone.bg, tone.border);
      w.text(label, x + 10, w.y + 2.5, 11, 'bold', tone.text);
      w.paragraph(
        [
          { text: it.lead + ' ', font: 'bold' },
          { text: it.text, font: 'regular' },
        ],
        x + 82,
        w.y,
        width - 82,
        11.5,
        C.ink,
        1.5,
      );
    }
    w.y += h + (i < s.items.length - 1 ? 4 : 0);
  });
  return w.y - start;
}

function drawSection(
  w: Writer,
  s: Section,
  x: number,
  width: number,
  labels: Record<Severity, string>,
  draw: boolean,
): number {
  switch (s.type) {
    case 'kv':
      return drawKv(w, s, x, width, draw);
    case 'severity':
      return drawSeverity(w, s, x, width, labels, draw);
    case 'text': {
      const start = w.y;
      drawH2(w, s.title, x, draw);
      w.y += H2_LH + 8;
      w.y += w.paragraph(
        [{ text: s.text, font: 'regular' }],
        x,
        w.y,
        width,
        11.5,
        C.ink,
        1.5,
        draw,
      );
      return w.y - start;
    }
    case 'swatches': {
      const start = w.y;
      drawH2(w, s.title, x, draw);
      w.y += H2_LH + 10;
      const n = 5;
      const sw = (width - 6 * (n - 1)) / n;
      s.colors.slice(0, n).forEach((c, i) => {
        const sx = x + i * (sw + 6);
        if (draw) {
          w.rect(sx, w.y, sw, 34, 7, c, '#E4E5EA');
          w.text(c.toUpperCase(), sx, w.y + 38, 9.5, 'mono', C.text2);
        }
      });
      w.y += 38 + 9.5 * 1.21;
      if (s.note) {
        w.y += 10;
        w.y += w.paragraph(
          [{ text: s.note, font: 'regular' }],
          x,
          w.y,
          width,
          11.5,
          C.ink,
          1.5,
          draw,
        );
      }
      return w.y - start;
    }
    case 'links': {
      const start = w.y;
      drawH2(w, s.title, x, draw);
      w.y += H2_LH + 8;
      if (draw) w.line(x, w.y, x + width, C.rowRule);
      for (const r of s.rows) {
        const h = 12 + 11.5 * 1.5;
        if (draw) {
          w.text(r.label, x, w.y + 6, 11.5, 'regular', C.ink, { lineHeight: 1.5 });
          const lw = w.width(r.linkText, 'semibold', 11.5);
          w.text(r.linkText, x + width - lw, w.y + 6, 11.5, 'semibold', '#155E75', {
            lineHeight: 1.5,
          });
          w.link(x + width - lw, w.y + 6, lw, 11.5 * 1.5, r.href);
          w.line(x, w.y + h, x + width, C.rowRule);
        }
        w.y += h;
      }
      return w.y - start;
    }
  }
}

function drawExtra(w: Writer, s: ExtraSection, labels: Record<Severity, string>) {
  if (s.type !== 'columns') {
    w.y += GAP;
    if (s.type !== 'kv' && s.type !== 'severity') {
      const y0 = w.y;
      const h = drawSection(w, s, PAD_X, CONTENT_W, labels, false);
      w.y = y0;
      w.ensure(h);
    }
    drawSection(w, s, PAD_X, CONTENT_W, labels, true);
    return;
  }
  const colW = (CONTENT_W - 24) / 2;
  w.y += GAP;
  const y0 = w.y;
  const heights = s.columns.map((c) => {
    w.y = y0;
    return drawSection(w, c, 0, colW, labels, false);
  });
  w.y = y0;
  w.ensure(Math.max(...heights));
  const top = w.y;
  s.columns.forEach((c, i) => {
    w.y = top;
    drawSection(w, c, PAD_X + i * (colW + 24), colW, labels, true);
  });
  w.y = top + Math.max(...heights);
}

/* Header, tiles, CTA, footer */

function drawLogo(w: Writer, cfg: LineReportConfig) {
  const m = logoMetrics(30);
  const c = logoColors(cfg.tool, 'light');
  const b = BRANDS[cfg.tool];
  w.rect(PAD_X, w.y, m.size, m.size, m.radius, c.tileBg);
  const scale = (m.glyph * PX) / 48;
  const gx = (PAD_X + (m.size - m.glyph) / 2) * PX;
  const gy = (PAGE_H - w.y - (m.size - m.glyph) / 2) * PX;
  for (const p of LOGO_GLYPHS[cfg.tool]) {
    w.page.drawSvgPath(p.d, {
      x: gx,
      y: gy,
      scale,
      ...(p.fill
        ? { color: hex(c.glyph) }
        : {
            borderColor: hex(c.glyph),
            borderWidth: 4,
            borderLineCap: LineCapStyle.Round,
            ...(p.dash ? { borderDashArray: p.dash } : {}),
            ...(p.opacity !== undefined ? { borderOpacity: p.opacity } : {}),
          }),
    });
  }
  const wx = PAD_X + m.size + m.gap;
  const wordTop = w.y + (m.size - m.wordSize * 1.21) / 2;
  const sp = -0.03 * m.wordSize;
  w.text(b.first, wx, wordTop, m.wordSize, 'display', c.wordInk, { spacing: sp });
  const fw = w.width(b.first, 'display', m.wordSize, sp) + sp;
  if (c.lineHighlight) {
    const lw = w.width('line', 'display', m.wordSize, sp);
    const lineTop = wordTop + m.wordSize * 1.21 * 0.42;
    w.rect(wx + fw, lineTop, lw, m.wordSize * 1.21 * 0.32, 0, '#FACC15');
  }
  w.text('line', wx + fw, wordTop, m.wordSize, 'display', c.wordAccent, { spacing: sp });
}

function drawWarningIcon(w: Writer, x: number, top: number, color: string) {
  const s = (11 / 24) * PX;
  for (const d of ['M12 3.5l9.5 16.5h-19z', 'M12 10v4', 'M12 17.2h.01']) {
    w.page.drawSvgPath(d, {
      x: x * PX,
      y: (PAGE_H - top) * PX,
      scale: s,
      borderColor: hex(color),
      borderWidth: 2.4,
      borderLineCap: LineCapStyle.Round,
    });
  }
}

function drawHeader(w: Writer, cfg: LineReportConfig) {
  drawLogo(w, cfg);
  const dw = w.width(cfg.dateLabel, 'regular', 11);
  w.text(cfg.dateLabel, PAD_X + CONTENT_W - dw, w.y + (30 - 11 * 1.21) / 2, 11, 'regular', C.muted);
  w.y += 30 + GAP;

  const accentText = BRANDS[cfg.tool].tintInk;
  w.text(cfg.eyebrow.toUpperCase(), PAD_X, w.y, 10, 'semibold', accentText, { spacing: 1.2 });
  w.y += 10 * 1.21 + 6;
  w.text(cfg.host, PAD_X, w.y, 28, 'display', C.ink, { spacing: -0.56 });
  w.y += 28 * 1.21 + 6;
  w.y += w.paragraph(
    [{ text: cfg.subline, font: 'regular' }],
    PAD_X,
    w.y,
    CONTENT_W,
    12,
    C.text2,
    1.21,
  );
  w.y += 18;
  w.line(PAD_X, w.y, PAD_X + CONTENT_W, C.rule);
  w.y += 1 + GAP;

  const tw = (CONTENT_W - 30) / 4;
  const th = 12 + 22 * 1.21 + 11 * 1.21 + 12;
  cfg.tiles.forEach((t, i) => {
    const tone = TILE_TONE[t.tone ?? 'neutral'];
    const x = PAD_X + i * (tw + 10);
    w.rect(x, w.y, tw, th, 10, tone.bg);
    w.text(String(t.value), x + 12, w.y + 12, 22, 'display', tone.value);
    let lx = x + 12;
    if (t.tone === 'warning') {
      drawWarningIcon(w, lx, w.y + 12 + 22 * 1.21 + 1.5, tone.label);
      lx += 15;
    }
    w.text(t.label, lx, w.y + 12 + 22 * 1.21, 11, 'regular', tone.label);
  });
  w.y += th;
}

const CTA_H = 20 * 2 + 15 * 1.21 + 4 + 11.5 * 1.21;

function drawCta(w: Writer, cfg: LineReportConfig) {
  const top = PAGE_H - PAD_Y - FOOTER_H - GAP - CTA_H;
  w.rect(PAD_X, top, CONTENT_W, CTA_H, 14, C.ctaBg);
  w.text(cfg.cta.title, PAD_X + 22, top + 20, 15, 'display', C.ctaTitle);
  w.text(cfg.cta.sub, PAD_X + 22, top + 20 + 15 * 1.21 + 4, 11.5, 'regular', C.ctaSub);
  const bw = w.width(cfg.cta.label, 'semibold', 12) + 28;
  const bh = 9 * 2 + 12 * 1.21;
  const bx = PAD_X + CONTENT_W - 22 - bw;
  const by = top + (CTA_H - bh) / 2;
  w.rect(bx, by, bw, bh, 8, LIME);
  w.text(cfg.cta.label, bx + 14, by + 9, 12, 'semibold', LIME_INK);
  w.link(bx, by, bw, bh, cfg.cta.href);
}

function drawFooters(w: Writer, cfg: LineReportConfig) {
  const footer = cfg.footer ?? `Made with ${BRANDS[cfg.tool].name}. No data left the browser.`;
  const label = cfg.pageLabel ?? ((i: number, n: number) => `Page ${i} of ${n}`);
  const n = w.pages.length;
  const top = PAGE_H - PAD_Y - FOOTER_H;
  w.pages.forEach((_, i) => {
    w.cur = i;
    w.text(footer, PAD_X, top, 10, 'regular', C.muted);
    const pl = label(i + 1, n);
    w.text(pl, PAD_X + CONTENT_W - w.width(pl, 'regular', 10), top, 10, 'regular', C.muted);
  });
}

/** yyyy-mm-dd in local time. */
export function isoDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function reportFileName(stem: string, host: string, date: Date) {
  const safeHost = host.replace(/[^a-z0-9.-]+/gi, '-').replace(/^-+|-+$/g, '') || 'page';
  return `${stem}-${safeHost}-${isoDate(date)}.pdf`;
}

/**
 * The shared Line report layout (Rivaline SPEC §8): logo and date, eyebrow, host, subline,
 * 4 stat tiles, one key/value section, one severity list, optional extra sections, the dark CTA box,
 * and the footer with page numbers. A4, embedded fonts, selectable text. Multi-page when needed.
 */
export async function buildLineReport(cfg: LineReportConfig): Promise<LineReport> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  // Inter loses glyphs when pdf-lib subsets it, so fonts are embedded whole (text stays selectable).
  const embed = (b: Uint8Array) => doc.embedFont(b, { subset: false });
  const f = {
    regular: await embed(cfg.fonts.regular),
    semibold: await embed(cfg.fonts.semibold),
    bold: await embed(cfg.fonts.bold),
    display: await embed(cfg.fonts.display),
    mono: await embed(cfg.fonts.mono),
  };
  const name = BRANDS[cfg.tool].name;
  doc.setTitle(`${name}: ${cfg.eyebrow}, ${cfg.host}`);
  doc.setAuthor(name);
  doc.setCreator(`${name} (getlineapps.com)`);
  doc.setProducer('Line apps report');
  doc.setCreationDate(cfg.date);
  doc.setModificationDate(cfg.date);
  doc.setLanguage('en');

  const labels = cfg.severityLabels ?? { high: 'High', medium: 'Medium', low: 'Low' };
  const w = new Writer(doc, f);
  drawHeader(w, cfg);
  w.y += GAP;
  drawKv(w, cfg.keyValue, PAD_X, CONTENT_W, true);
  w.y += GAP;
  drawSeverity(w, cfg.severity, PAD_X, CONTENT_W, labels, true);
  for (const s of cfg.extras ?? []) drawExtra(w, s, labels);

  // The CTA sits at the bottom of the last page; start a new page if the content reaches it.
  if (w.y + GAP > PAGE_H - PAD_Y - FOOTER_H - GAP - CTA_H) w.newPage();
  drawCta(w, cfg);
  drawFooters(w, cfg);

  // Open as one scrolling column in PDF viewers.
  doc.catalog.set(PDFName.of('PageLayout'), PDFName.of('OneColumn'));
  const bytes = await doc.save();
  return {
    bytes,
    fileName: reportFileName(cfg.fileStem, cfg.host, cfg.date),
    pages: w.pages.length,
    layout: w.layout,
  };
}
