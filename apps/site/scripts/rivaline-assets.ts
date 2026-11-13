/**
 * Rivaline landing assets (outputs are committed):
 *   public/og/rivaline.png   1200x630 share image from the hero (title + Stack panel mock)
 * Run: pnpm --filter @line/site gen:rivaline
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { BRANDS, logoTileSvg } from '@line/ui/brand';
import { MARKS } from '@line/ui/marks';

import c from '../src/content/rivaline/en.json' with { type: 'json' };

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');
const fonts = resolve(here, '../../../packages/report/fonts');
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

/** A brand mark tile, as Mark.astro draws it. */
function mark(name: keyof typeof MARKS, x: number, y: number, size: number): string {
  const m = MARKS[name];
  const g = size * 0.62;
  const paint = m.fill
    ? `fill="${m.fill}"`
    : `fill="none" stroke="${m.stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.27)}" fill="${m.tint}"/>
  <g transform="translate(${x + (size - g) / 2} ${y + (size - g) / 2}) scale(${g / 24})" ${paint}>${m.svg}</g>`;
}

function og(): string {
  const W = 1200;
  const H = 630;
  const b = BRANDS.rivaline;
  const rows = c.hero.mock.rows;
  const list = rows
    .map((r, i) => {
      const y = 262 + i * 40;
      return `<g transform="translate(760 ${y})">
        ${i ? '<rect x="0" y="-22" width="368" height="1" fill="#EAE8F0"/>' : ''}
        ${mark(r.mark as keyof typeof MARKS, 14, -13, 26)}
        <text x="52" y="5" font-family="Inter" font-weight="600" font-size="15" fill="#101828">${esc(r.name)}</text>
        <text x="352" y="5" text-anchor="end" font-family="Inter" font-weight="400" font-size="12.5" fill="#667085">${esc(r.id)}</text>
      </g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="0.95" cy="0" r="0.6"><stop offset="0" stop-color="#0E7490" stop-opacity=".65"/><stop offset="1" stop-color="#0E7490" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.5"><stop offset="0" stop-color="#C6F36B" stop-opacity=".2"/><stop offset="1" stop-color="#C6F36B" stop-opacity="0"/></radialGradient>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0E7490"/><stop offset="1" stop-color="#155E75"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#120D24"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <g transform="translate(72 64)">${inner(logoTileSvg('rivaline', 64, 'dark'))}
    <text x="82" y="46" font-family="Plus Jakarta Sans" font-weight="800" font-size="44" letter-spacing="-1.3" fill="#FFFFFF">Riva<tspan fill="${b.bright}">line</tspan></text>
  </g>
  <text font-family="Plus Jakarta Sans" font-weight="800" font-size="54" letter-spacing="-2" fill="#FFFFFF">
    <tspan x="72" y="250">See any rival's stack,</tspan>
    <tspan x="72" y="316">ads and brand in</tspan>
    <tspan x="72" y="382" fill="${b.bright}">${esc(c.hero.titleHighlight)}</tspan>
  </text>
  <rect x="72" y="394" width="240" height="7" rx="4" fill="#C6F36B"/>
  <text x="72" y="452" font-family="Inter" font-weight="400" font-size="23" fill="#D0CBE6">Martech stack, four ad libraries and</text>
  <text x="72" y="486" font-family="Inter" font-weight="400" font-size="23" fill="#D0CBE6">the brand kit, in one Chrome side panel.</text>
  <rect x="72" y="526" width="${36 + c.hero.pill.length * 11}" height="44" rx="22" fill="#FFFFFF" fill-opacity=".08" stroke="#FFFFFF" stroke-opacity=".2"/>
  <circle cx="96" cy="548" r="6" fill="#12B76A"/>
  <text x="112" y="555" font-family="Inter" font-weight="600" font-size="19" fill="#E9E5F7">${esc(c.hero.pill)}</text>
  <rect x="744" y="110" width="384" height="${rows.length * 40 + 154}" rx="22" fill="#EFEDF5"/>
  <rect x="760" y="126" width="352" height="96" rx="14" fill="url(#hero)"/>
  <text x="782" y="164" font-family="Inter" font-weight="600" font-size="15" fill="#FFFFFF">${esc(c.hero.mock.host)}</text>
  <text x="782" y="198" font-family="Plus Jakarta Sans" font-weight="800" font-size="24" fill="#FFFFFF">${esc(c.hero.mock.title)}</text>
  <rect x="760" y="236" width="368" height="${rows.length * 40 + 12}" rx="12" fill="#FFFFFF"/>
  ${list}
  <text x="${W - 72}" y="${H - 40}" text-anchor="end" font-family="Inter" font-weight="600" font-size="22" fill="#B9B4D0">getlineapps.com/rivaline</text>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="${b.accent}"/>
</svg>`;
}

const png = new Resvg(og(), {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    loadSystemFonts: false,
    fontFiles: [
      `${fonts}/PlusJakartaSans_800ExtraBold.ttf`,
      `${fonts}/Inter_400Regular.ttf`,
      `${fonts}/Inter_600SemiBold.ttf`,
    ],
    defaultFontFamily: 'Inter',
  },
})
  .render()
  .asPng();
mkdirSync(`${pub}/og`, { recursive: true });
writeFileSync(`${pub}/og/rivaline.png`, png);
console.log('public/og/rivaline.png');
