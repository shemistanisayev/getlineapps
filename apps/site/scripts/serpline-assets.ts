/**
 * Serpline landing assets (outputs are committed):
 *   public/og/serpline.png   1200x630 share image from the hero (title + side panel mock)
 * Run: pnpm --filter @line/site gen:serpline
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { BRANDS, logoTileSvg } from '@line/ui/brand';

import c from '../src/content/serpline/en.json' with { type: 'json' };

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');
const fonts = resolve(here, '../../../packages/report/fonts');
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

const TONE: Record<string, { bg: string; fg: string }> = {
  ok: { bg: '#ECFDF3', fg: '#067647' },
  warn: { bg: '#FFFAEB', fg: '#B54708' },
  bad: { bg: '#FEF3F2', fg: '#B42318' },
  mute: { bg: '#EEEDF3', fg: '#475467' },
};
const ICON: Record<string, string> = {
  ok: 'M5 12.5l4.5 4.5L19 7.5',
  warn: 'M12 6v8M12 18.5h.01',
  bad: 'M12 6v8M12 18.5h.01',
  mute: 'M6 12h12',
};

function og(): string {
  const W = 1200;
  const H = 630;
  const b = BRANDS.serpline;
  const rows = c.hero.mock.rows.slice(0, 6);
  const list = rows
    .map((r, i) => {
      const y = 262 + i * 40;
      const t = TONE[r.tone]!;
      const pillW = 34 + r.status.length * 7.4;
      return `<g transform="translate(760 ${y})">
        ${i ? '<rect x="0" y="-22" width="368" height="1" fill="#EAE8F0"/>' : ''}
        <text x="16" y="5" font-family="Inter" font-weight="600" font-size="15" fill="#101828">${esc(r.label)}</text>
        <rect x="${352 - pillW}" y="-12" width="${pillW}" height="24" rx="12" fill="${t.bg}"/>
        <path transform="translate(${352 - pillW + 9} -6) scale(0.5)" d="${ICON[r.tone]}" fill="none" stroke="${t.fg}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${352 - pillW + 25}" y="5" font-family="Inter" font-weight="600" font-size="12.5" fill="${t.fg}">${esc(r.status)}</text>
      </g>`;
    })
    .join('');
  const c27 = 2 * Math.PI * 27;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="0.95" cy="0" r="0.6"><stop offset="0" stop-color="#2563EB" stop-opacity=".6"/><stop offset="1" stop-color="#2563EB" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.5"><stop offset="0" stop-color="#C6F36B" stop-opacity=".2"/><stop offset="1" stop-color="#C6F36B" stop-opacity="0"/></radialGradient>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#1E40AF"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#120D24"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <g transform="translate(72 64)">${inner(logoTileSvg('serpline', 64, 'dark'))}
    <text x="82" y="46" font-family="Plus Jakarta Sans" font-weight="800" font-size="44" letter-spacing="-1.3" fill="#FFFFFF">Serp<tspan fill="${b.bright}">line</tspan></text>
  </g>
  <text font-family="Plus Jakarta Sans" font-weight="800" font-size="58" letter-spacing="-2.2" fill="#FFFFFF">
    <tspan x="72" y="258">${esc(c.hero.titleStart)}</tspan>
    <tspan x="72" y="330" fill="#93C5FD">${esc(c.hero.titleHighlight)}</tspan><tspan fill="#FFFFFF"> ${esc(c.hero.titleEnd)}</tspan>
  </text>
  <text x="72" y="408" font-family="Inter" font-weight="400" font-size="24" fill="#D0CBE6">Technical SEO, JavaScript rendering and</text>
  <text x="72" y="444" font-family="Inter" font-weight="400" font-size="24" fill="#D0CBE6">AI crawler access, in one Chrome side panel.</text>
  <rect x="72" y="500" width="${36 + c.hero.pill.length * 11}" height="44" rx="22" fill="#FFFFFF" fill-opacity=".08" stroke="#FFFFFF" stroke-opacity=".2"/>
  <circle cx="96" cy="522" r="6" fill="#12B76A"/>
  <text x="112" y="529" font-family="Inter" font-weight="600" font-size="19" fill="#E9E5F7">${esc(c.hero.pill)}</text>
  <rect x="744" y="110" width="384" height="${rows.length * 40 + 154}" rx="22" fill="#EFEDF5"/>
  <rect x="760" y="126" width="352" height="96" rx="14" fill="url(#hero)"/>
  <g transform="translate(776 142)">
    <circle cx="32" cy="32" r="27" fill="none" stroke="#FFFFFF" stroke-opacity=".25" stroke-width="7"/>
    <circle cx="32" cy="32" r="27" fill="none" stroke="#C6F36B" stroke-width="7" stroke-linecap="round" stroke-dasharray="${((c27 * 56) / 100).toFixed(1)} ${Math.ceil(c27)}" transform="rotate(-90 32 32)"/>
    <text x="32" y="40" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="22" fill="#FFFFFF">56</text>
  </g>
  <text x="862" y="168" font-family="Plus Jakarta Sans" font-weight="800" font-size="20" fill="#FFFFFF">${esc(c.hero.mock.label)}</text>
  <text x="862" y="194" font-family="Inter" font-weight="400" font-size="15" fill="#EEF3FD">${esc(c.hero.mock.issues)}</text>
  <rect x="760" y="236" width="368" height="${rows.length * 40 + 12}" rx="12" fill="#FFFFFF"/>
  ${list}
  <text x="${W - 72}" y="${H - 40}" text-anchor="end" font-family="Inter" font-weight="600" font-size="22" fill="#B9B4D0">getlineapps.com/serpline</text>
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
writeFileSync(`${pub}/og/serpline.png`, png);
console.log('public/og/serpline.png');
