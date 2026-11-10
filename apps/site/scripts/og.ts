/**
 * Makes the site's share image and favicons from the brand data (no hand-drawn assets):
 *   public/og/line-apps.png (1200x630), public/favicon.svg, favicon-32.png, apple-touch-icon.png
 * Run: pnpm --filter @line/site gen:og  (outputs are committed)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import {
  BRANDS,
  HUB_LOGO_PATHS,
  HUB_LOGO_STROKE,
  HUB_ORDER,
  hubLogoColors,
  hubLogoTileSvg,
  logoTileSvg,
} from '@line/ui/brand';

import hub from '../src/content/hub/en.json' with { type: 'json' };

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');
const fonts = resolve(here, '../../../packages/report/fonts');

function png(svg: string, width: number) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
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
}

const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

function og(): string {
  const W = 1200;
  const H = 630;
  const c = hubLogoColors('dark');
  const tile = 96;
  const glyph = Math.round(tile * 0.64);
  const off = (tile - glyph) / 2;
  const hubPaths = HUB_LOGO_PATHS.map((d, i) => `<path d="${d}" stroke="${c.lines[i]}"/>`).join('');
  const tiles = HUB_ORDER.map(
    (s, i) =>
      `<g transform="translate(${80 + i * 92} 470)">${inner(logoTileSvg(s, 72, 'dark'))}</g>`,
  ).join('');
  const lanes = HUB_ORDER.map(
    (s, i) =>
      `<rect x="${760 + i * 84}" y="0" width="2" height="${H}" fill="${BRANDS[s].bright}" opacity=".28"/><circle cx="${761 + i * 84}" cy="${120 + ((i * 97) % 380)}" r="6" fill="${BRANDS[s].bright}"/>`,
  ).join('');
  const stripe = HUB_ORDER.map(
    (s, i) =>
      `<rect x="${i * (W / 5)}" y="${H - 12}" width="${W / 5}" height="12" fill="${BRANDS[s].accent}"/>`,
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="0.1" cy="0.95" r="0.5"><stop offset="0" stop-color="#C6F36B" stop-opacity=".22"/><stop offset="1" stop-color="#C6F36B" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0.95" cy="0.05" r="0.5"><stop offset="0" stop-color="#67E8F9" stop-opacity=".2"/><stop offset="1" stop-color="#67E8F9" stop-opacity="0"/></radialGradient>
    <linearGradient id="hl" x1="0" x2="1"><stop offset="0" stop-color="#B692F6"/><stop offset=".25" stop-color="#93C5FD"/><stop offset=".5" stop-color="#67E8F9"/><stop offset=".75" stop-color="#FAA7E0"/><stop offset="1" stop-color="#FDE68A"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#120D24"/>
  ${lanes}
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <g transform="translate(80 72)">
    <rect width="${tile}" height="${tile}" rx="${Math.round(tile * 0.26)}" fill="${c.tileBg}"/>
    <g transform="translate(${off} ${off}) scale(${glyph / 48})" fill="none" stroke-width="${HUB_LOGO_STROKE}" stroke-linecap="round" stroke-linejoin="round">${hubPaths}</g>
    <text x="${tile + 26}" y="${tile / 2 + 22}" font-family="Plus Jakarta Sans" font-weight="800" font-size="62" letter-spacing="-1.8" fill="#F7F7FB">Line<tspan fill="#B9B4D0" font-family="Inter" font-weight="600">apps</tspan></text>
  </g>
  <text font-family="Plus Jakarta Sans" font-weight="800" font-size="68" letter-spacing="-2.6" fill="#FFFFFF">
    <tspan x="80" y="282">${esc(hub.hero.titleStart)}</tspan>
    <tspan x="80" y="362">${esc(hub.hero.titleHighlight)}</tspan>
  </text>
  <rect x="80" y="378" width="590" height="8" rx="4" fill="url(#hl)"/>
  <text x="80" y="436" font-family="Inter" font-weight="400" font-size="26" fill="#D0CBE6">${esc(hub.hero.pill)}. ${esc(hub.hero.trust[0] ?? '')}.</text>
  ${tiles}
  <text x="${W - 80}" y="${H - 44}" text-anchor="end" font-family="Inter" font-weight="600" font-size="24" fill="#B9B4D0">getlineapps.com</text>
  ${stripe}
</svg>`;
}

mkdirSync(`${pub}/og`, { recursive: true });
writeFileSync(`${pub}/og/line-apps.png`, png(og(), 1200));
writeFileSync(`${pub}/favicon.svg`, hubLogoTileSvg(48, 'light'));
writeFileSync(`${pub}/favicon-32.png`, png(hubLogoTileSvg(32, 'light'), 32));
writeFileSync(`${pub}/apple-touch-icon.png`, png(hubLogoTileSvg(180, 'light'), 180));
console.log('og image and favicons written to public/');
