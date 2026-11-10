/**
 * Hitline landing assets (outputs are committed):
 *   public/hitline/sample-audit.pdf  the "Sample audit" PDF, from @line/report hitlineSample
 *   public/og/hitline.png            1200x630 share image from the hero
 * Run: pnpm --filter @line/site gen:hitline
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { buildLineReport, hitlineSample } from '@line/report';
import { loadReportFontsNode } from '@line/report/node';
import { BRANDS, logoTileSvg } from '@line/ui/brand';
import { MARKS } from '@line/ui/marks';

import c from '../src/content/hitline/en.json' with { type: 'json' };

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');
const fonts = resolve(here, '../../../packages/report/fonts');
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

// 1. Sample audit PDF
mkdirSync(`${pub}/hitline`, { recursive: true });
const report = await buildLineReport(hitlineSample(loadReportFontsNode()));
writeFileSync(`${pub}/hitline/sample-audit.pdf`, report.bytes);

// 2. Share image
function og(): string {
  const W = 1200;
  const H = 630;
  const b = BRANDS.hitline;
  const rows = c.hero.rows.slice(0, 5);
  const markFor: Record<string, keyof typeof MARKS> = {
    ga: 'googleanalytics',
    ads: 'googleads',
    meta: 'meta',
    tt: 'tiktok',
    dl: 'googletagmanager',
  };
  const card = rows
    .map((r, i) => {
      const y = 196 + i * 62;
      const m = MARKS[markFor[r.platform] ?? 'googleanalytics'];
      const bad = r.route === 'bad';
      const pill = c.hero.routes[r.route as keyof typeof c.hero.routes];
      const pillW = 18 + pill.length * 8.6;
      return `<g transform="translate(760 ${y})">
        <rect x="-24" y="-30" width="408" height="62" fill="${bad ? '#FFFBFA' : '#FFFFFF'}"/>
        <rect x="0" y="-15" width="30" height="30" rx="8" fill="${m.tint}"/>
        <g transform="translate(5 -10) scale(0.84)" fill="${m.fill ?? 'none'}">${m.svg}</g>
        <text x="44" y="6" font-family="Inter" font-weight="600" font-size="17" fill="#101828">${esc(r.event)}</text>
        <rect x="${360 - pillW}" y="-13" width="${pillW}" height="26" rx="13" fill="${bad ? '#FEF3F2' : r.route === 'sgtm' ? '#F4F3FF' : '#EAE8F0'}"/>
        <text x="${360 - pillW / 2}" y="5" text-anchor="middle" font-family="Inter" font-weight="600" font-size="13" fill="${bad ? '#B42318' : r.route === 'sgtm' ? '#5925DC' : '#475467'}">${esc(pill)}</text>
      </g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="0.95" cy="0" r="0.6"><stop offset="0" stop-color="#7F56D9" stop-opacity=".55"/><stop offset="1" stop-color="#7F56D9" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.5"><stop offset="0" stop-color="#C6F36B" stop-opacity=".2"/><stop offset="1" stop-color="#C6F36B" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#120D24"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <g transform="translate(72 64)">${inner(logoTileSvg('hitline', 64, 'dark'))}
    <text x="82" y="46" font-family="Plus Jakarta Sans" font-weight="800" font-size="44" letter-spacing="-1.3" fill="#FFFFFF">Hit<tspan fill="${b.bright}">line</tspan></text>
  </g>
  <text font-family="Plus Jakarta Sans" font-weight="800" font-size="58" letter-spacing="-2.2" fill="#FFFFFF">
    <tspan x="72" y="258">${esc(c.hero.titleStart)}</tspan>
    <tspan x="72" y="330" fill="#C6F36B">${esc(c.hero.titleHighlight)}</tspan><tspan fill="#FFFFFF"> ${esc(c.hero.titleEnd)}</tspan>
  </text>
  <text x="72" y="408" font-family="Inter" font-weight="400" font-size="24" fill="#D0CBE6">GA4, Google Ads, Meta, TikTok, server-side GTM</text>
  <text x="72" y="444" font-family="Inter" font-weight="400" font-size="24" fill="#D0CBE6">and Consent Mode, inside Chrome DevTools.</text>
  <rect x="72" y="500" width="${36 + c.hero.pill.length * 11}" height="44" rx="22" fill="#FFFFFF" fill-opacity=".08" stroke="#FFFFFF" stroke-opacity=".2"/>
  <circle cx="96" cy="522" r="6" fill="#12B76A"/>
  <text x="112" y="529" font-family="Inter" font-weight="600" font-size="19" fill="#E9E5F7">${esc(c.hero.pill)}</text>
  <rect x="736" y="120" width="408" height="380" rx="22" fill="#FFFFFF"/>
  <rect x="736" y="120" width="408" height="46" rx="22" fill="#F7F6FB"/>
  <rect x="736" y="144" width="408" height="22" fill="#F7F6FB"/>
  <circle cx="762" cy="143" r="6" fill="#FF5F57"/><circle cx="782" cy="143" r="6" fill="#FEBC2E"/><circle cx="802" cy="143" r="6" fill="#28C840"/>
  <text x="1124" y="148" text-anchor="end" font-family="Inter" font-weight="600" font-size="13" fill="#667085">${esc(c.hero.mockLabel)}</text>
  ${card}
  <text x="${W - 72}" y="${H - 40}" text-anchor="end" font-family="Inter" font-weight="600" font-size="22" fill="#B9B4D0">getlineapps.com/hitline</text>
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
writeFileSync(`${pub}/og/hitline.png`, png);
console.log(
  `public/hitline/sample-audit.pdf (${Math.round(report.bytes.length / 1024)} KB), public/og/hitline.png`,
);
