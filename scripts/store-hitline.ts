/**
 * Chrome Web Store package for Hitline (docs/hitline-SPEC.md Phase 9), written to store/hitline/:
 *   hitline-<version>.zip            production build (wxt zip)
 *   screenshots/1-popup.png ...      5 screenshots, 1280x800, made from the Lumo fixture
 *   promo-small-440x280.png          small promo tile
 *   promo-marquee-1400x560.png       marquee promo tile
 *   locales/<code>/...               the same screenshots and tiles with captions in each store
 *                                    language (scripts/store-copy.ts); the UI inside stays English
 *
 * Run from the repo root (builds everything it needs):
 *   pnpm --filter @line/hitline-extension zip
 *   pnpm --filter @line/site build
 *   pnpm exec tsx scripts/store-hitline.ts
 * The fixture server and the site preview are started when they are not running.
 */
import type { Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { BRANDS, logoTileSvg } from '../packages/ui/src/brand.ts';
import { FIXTURE_PORT, hostResolverArgs, routeVendors, shopUrl } from '../apps/fixture/hosts.ts';
import { lumoSession } from '../packages/core/fixtures/hitline/load.ts';
import { LUMO_PLAN_CSV } from '../packages/core/fixtures/hitline/lumo.ts';
import { parsePlanCsv } from '../packages/core/src/hitline/index.ts';
import { popupProbe } from '../apps/hitline/extension/src/popup/probe.ts';
import { loadExtension } from '../e2e/extension.ts';
import {
  esc,
  frameFontCss,
  HITLINE_COPY,
  langDir,
  displayFont,
  makeFit,
  STORE_LANGS,
  type StoreLang,
} from './store-copy.ts';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'store/hitline');
const version = JSON.parse(
  readFileSync(join(root, 'apps/hitline/extension/package.json'), 'utf8'),
).version;
const SITE = 'http://localhost:4321';
for (const lang of STORE_LANGS)
  mkdirSync(join(langDir(out, lang), 'screenshots'), { recursive: true });

// 1. The zip
copyFileSync(
  join(root, `apps/hitline/extension/.output/hitline-${version}.zip`),
  join(out, `hitline-${version}.zip`),
);

// Servers
const children: ChildProcess[] = [];
async function up(url: string): Promise<boolean> {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}
async function ensure(url: string, cmd: string[]) {
  if (await up(url)) return;
  const child = spawn(cmd[0]!, cmd.slice(1), {
    cwd: root,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  children.push(child);
  for (let i = 0; i < 100 && !(await up(url)); i++) await new Promise((r) => setTimeout(r, 200));
}
await ensure(`http://localhost:${FIXTURE_PORT}/__lumo/scenarios.json`, [
  'pnpm',
  '--filter',
  '@line/fixture',
  'start',
]);
await ensure(`${SITE}/hitline`, ['pnpm', '--filter', '@line/site', 'preview']);

const FONT_CSS = frameFontCss((rel) => readFileSync(join(root, rel)).toString('base64'));

const png = (p: string) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

/** A 1280x800 store screenshot: dark brand band with a caption, the real UI below. */
async function frame(page: Page, lang: StoreLang, file: string, caption: string, body: string) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(`<!doctype html><html><head><style>${FONT_CSS}
    *{box-sizing:border-box}body{margin:0;width:1280px;height:800px;overflow:hidden;background:#120D24;font-family:Inter,sans-serif}
    .glow1{position:absolute;width:640px;height:640px;right:-160px;top:-260px;border-radius:50%;background:rgba(127,86,217,.55);filter:blur(80px)}
    .glow2{position:absolute;width:420px;height:420px;left:-140px;bottom:-200px;border-radius:50%;background:rgba(198,243,107,.18);filter:blur(80px)}
    .cap{position:absolute;left:64px;right:64px;top:44px;display:flex;align-items:center;gap:18px;color:#fff}
    .cap img{width:44px;height:44px}
    .cap h1{margin:0;font-family:'Plus Jakarta Sans',Inter;font-weight:800;font-size:38px;letter-spacing:-.03em;white-space:nowrap}
    .ui{position:absolute;left:64px;right:64px;top:128px;bottom:-24px;border-radius:18px;overflow:hidden;background:#EFEDF5;box-shadow:0 40px 80px -30px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.1)}
    .ui>img.full{width:100%;display:block}
  </style></head><body><span class="glow1"></span><span class="glow2"></span>
  <div class="cap"><img src="data:image/svg+xml;base64,${Buffer.from(logoTileSvg('hitline', 44, 'dark')).toString('base64')}"><h1>${esc(caption)}</h1></div>
  <div class="ui">${body}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  // Long translations shrink to one line instead of wrapping into the UI.
  await page.evaluate(() => {
    const h = document.querySelector('.cap h1') as HTMLElement;
    const max = 1152 - 62;
    for (let size = 38; h.scrollWidth > max && size > 24; size--)
      h.style.fontSize = `${size - 1}px`;
  });
  await page.screenshot({ path: join(langDir(out, lang), 'screenshots', file) });
}

const tmp = join(root, 'test-results/store-hitline');
mkdirSync(tmp, { recursive: true });
const ext = await loadExtension('hitline', hostResolverArgs());
try {
  await routeVendors(ext.context);
  const parsed = parsePlanCsv(LUMO_PLAN_CSV, 'lumo-tracking-plan.csv');
  if (!parsed.ok) throw new Error('plan');

  // Panel views from the recorded Lumo runs at 1440 px, scaled to the frame's 1152 px inner width.
  async function panel(run: 'events' | 'consent' | 'journey', tab: string | null, file: string) {
    const p = await ext.context.newPage();
    await p.addInitScript((s) => {
      (window as unknown as { __HITLINE_REPLAY__: unknown }).__HITLINE_REPLAY__ = s;
    }, lumoSession(run));
    await p.setViewportSize({ width: 1440, height: 840 });
    await p.goto(ext.url('devtools-panel.html'));
    if (tab) await p.getByRole('tab', { name: new RegExp(tab) }).click();
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(tmp, file) });
    await p.close();
  }
  // The Lumo plan belongs to the events run; the other runs are shown without a plan.
  await ext.worker.evaluate((plans) => chrome.storage.local.set({ plans }), {
    'example.com': parsed.plan,
  });
  await panel('events', null, 'events.png');
  await ext.worker.evaluate(() => chrome.storage.local.remove('plans'));
  await panel('consent', 'Consent', 'consent.png');
  await panel('journey', 'Attribution', 'attribution.png');

  // Popup over the real Lumo shop.
  const shop = await ext.context.newPage();
  await shop.setViewportSize({ width: 1152, height: 700 });
  await shop.goto(shopUrl('/products/wireless-headphones-pro-x?run=events'));
  await shop.locator('body[data-load=done]').waitFor();
  await shop.getByRole('button', { name: 'Add to cart' }).click();
  await shop.locator('body[data-add=done]').waitFor();
  await shop.waitForTimeout(300);
  // tsx (esbuild keepNames) wraps functions in __name(); give the page a no-op version.
  await shop.evaluate('window.__name = (f) => f');
  const probe = await shop.evaluate(popupProbe);
  await shop.screenshot({ path: join(tmp, 'shop.png') });
  await shop.close();
  const pop = await ext.context.newPage();
  await pop.addInitScript((p) => {
    (window as unknown as { __HITLINE_POPUP__: unknown }).__HITLINE_POPUP__ = p;
  }, probe);
  await pop.setViewportSize({ width: 372, height: 600 });
  await pop.goto(ext.url('popup.html'));
  await pop.evaluate(() => document.fonts.ready);
  await pop.locator('.popup').screenshot({ path: join(tmp, 'popup.png') });
  await pop.close();

  // The audit PDF as the site renders it (same config as the sample PDF).
  const site = await ext.context.newPage();
  await site.setViewportSize({ width: 1280, height: 1400 });
  await site.goto(`${SITE}/hitline`);
  await site.getByRole('link', { name: 'See a sample audit' }).click();
  // Full size, not the modal's 0.6 zoom, so the page stays sharp.
  await site.locator('.sa-paper').evaluate((el) => ((el as HTMLElement).style.zoom = '1'));
  await site.locator('.rp').screenshot({ path: join(tmp, 'report.png') });
  await site.close();

  const page = await ext.context.newPage();
  for (const lang of STORE_LANGS) {
    const cap = HITLINE_COPY[lang].captions;
    await frame(
      page,
      lang,
      '1-popup.png',
      cap[0],
      `<img class="full" src="${png(join(tmp, 'shop.png'))}" style="filter:brightness(.96)">
     <img src="${png(join(tmp, 'popup.png'))}" style="position:absolute;top:24px;right:40px;width:372px;border-radius:16px;box-shadow:0 24px 48px -12px rgba(16,24,40,.35),0 0 0 1px rgba(16,24,40,.08)">`,
    );
    await frame(
      page,
      lang,
      '2-events.png',
      cap[1],
      `<img class="full" src="${png(join(tmp, 'events.png'))}">`,
    );
    await frame(
      page,
      lang,
      '3-consent.png',
      cap[2],
      `<img class="full" src="${png(join(tmp, 'consent.png'))}">`,
    );
    await frame(
      page,
      lang,
      '4-attribution.png',
      cap[3],
      `<img class="full" src="${png(join(tmp, 'attribution.png'))}">`,
    );
    await frame(
      page,
      lang,
      '5-audit-pdf.png',
      cap[4],
      `<div style="height:100%;display:flex;justify-content:center;padding-top:28px;background:linear-gradient(135deg,#F4F1FD,#EFEDF5)">
       <img src="${png(join(tmp, 'report.png'))}" style="width:620px;align-self:flex-start;border-radius:8px;box-shadow:0 30px 60px -24px rgba(52,30,120,.45)"></div>`,
    );
  }
  await page.close();
} finally {
  await ext.close();
  // Stop the whole tree: pnpm starts tsx, which starts node (a plain kill leaves the server running).
  for (const c of children) {
    if (process.platform === 'win32' && c.pid)
      spawn('taskkill', ['/pid', String(c.pid), '/T', '/F'], { stdio: 'ignore' });
    else c.kill();
  }
}

// 2. Promo tiles (SVG -> PNG, brand fonts only)
const fontFiles = [
  join(root, 'packages/report/fonts/PlusJakartaSans_800ExtraBold.ttf'),
  join(root, 'packages/report/fonts/Inter_400Regular.ttf'),
  join(root, 'packages/report/fonts/Inter_600SemiBold.ttf'),
  // Cyrillic fallback for the Plus Jakarta Sans headlines (ru, uk).
  join(root, 'packages/report/fonts/Inter_700Bold.ttf'),
];
const fitSize = makeFit(fontFiles);
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
function render(svg: string, width: number, file: string, dir: string) {
  const bytes = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false, fontFiles, defaultFontFamily: 'Inter' },
  })
    .render()
    .asPng();
  writeFileSync(join(dir, file), bytes);
}
const bg = (w: number, h: number) => `
  <defs>
    <radialGradient id="g1" cx="0.95" cy="0" r="0.7"><stop offset="0" stop-color="#7F56D9" stop-opacity=".6"/><stop offset="1" stop-color="#7F56D9" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.6"><stop offset="0" stop-color="#C6F36B" stop-opacity=".22"/><stop offset="1" stop-color="#C6F36B" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#120D24"/><rect width="${w}" height="${h}" fill="url(#g1)"/><rect width="${w}" height="${h}" fill="url(#g2)"/>`;

for (const lang of STORE_LANGS) {
  const c = HITLINE_COPY[lang];
  const dir = langDir(out, lang);
  const display = displayFont(lang);
  render(
    `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">${bg(440, 280)}
    <g transform="translate(36 40)">${inner(logoTileSvg('hitline', 56, 'dark'))}
      <text x="72" y="40" font-family="Plus Jakarta Sans" font-weight="800" font-size="38" letter-spacing="-1.1" fill="#FFFFFF">Hit<tspan fill="${BRANDS.hitline.bright}">line</tspan></text></g>
    <text font-family="${display}" font-weight="800" font-size="27" letter-spacing="-.8" fill="#FFFFFF">
      <tspan x="36" y="158" font-size="${fitSize(c.line1, 27, 368, display, 800, -0.8)}">${esc(c.line1)}</tspan>
      <tspan x="36" y="194" font-size="${fitSize(c.accent + c.rest, 27, 368, display, 800, -0.8)}"><tspan fill="#C6F36B">${esc(c.accent)}</tspan>${esc(c.rest)}</tspan></text>
    <text x="36" y="238" font-family="Inter" font-weight="600" font-size="15" fill="#D0CBE6">${esc(c.small)}</text>
    <rect x="0" y="272" width="440" height="8" fill="${BRANDS.hitline.accent}"/></svg>`,
    440,
    'promo-small-440x280.png',
    dir,
  );

  const rows = [
    ['page_view', 'GA4', 'sGTM', '#F4F3FF', '#5925DC'],
    ['PageView', 'Meta', c.browser, '#EAE8F0', '#475467'],
    ['add_to_cart', 'GA4', 'sGTM', '#F4F3FF', '#5925DC'],
    ['AddToCart', 'Meta', c.noValue, '#FEF3F2', '#B42318'],
    ['conversion', 'Google Ads', c.browser, '#EAE8F0', '#475467'],
  ];
  const rowSvg = rows
    .map(([ev, p, route, bgc, fg], i) => {
      const y = 176 + i * 62;
      const w = 20 + route.length * 9;
      return `<g transform="translate(820 ${y})">
      <rect x="0" y="-30" width="460" height="62" fill="${route === c.noValue ? '#FFFBFA' : '#FFFFFF'}"/>
      <text x="24" y="7" font-family="Inter" font-weight="600" font-size="18" fill="#667085">${p}</text>
      <text x="150" y="7" font-family="Inter" font-weight="600" font-size="18" fill="#101828">${ev}</text>
      <rect x="${436 - w}" y="-14" width="${w}" height="28" rx="14" fill="${bgc}"/>
      <text x="${436 - w / 2}" y="6" text-anchor="middle" font-family="Inter" font-weight="600" font-size="14" fill="${fg}">${esc(route)}</text></g>`;
    })
    .join('');
  render(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">${bg(1400, 560)}
    <g transform="translate(90 88)">${inner(logoTileSvg('hitline', 72, 'dark'))}
      <text x="94" y="52" font-family="Plus Jakarta Sans" font-weight="800" font-size="50" letter-spacing="-1.5" fill="#FFFFFF">Hit<tspan fill="${BRANDS.hitline.bright}">line</tspan></text></g>
    <text font-family="${display}" font-weight="800" font-size="56" letter-spacing="-2" fill="#FFFFFF">
      <tspan x="90" y="286" font-size="${fitSize(c.line1, 56, 690, display, 800, -2)}">${esc(c.line1)}</tspan>
      <tspan x="90" y="362" font-size="${fitSize(c.accent + c.rest, 56, 690, display, 800, -2)}"><tspan fill="#C6F36B">${esc(c.accent)}</tspan>${esc(c.rest)}</tspan></text>
    <text x="90" y="436" font-family="Inter" font-weight="400" font-size="${fitSize(c.sub1, 22, 690, 'Inter', 400)}" fill="#D0CBE6">${esc(c.sub1)}</text>
    <text x="90" y="466" font-family="Inter" font-weight="400" font-size="${fitSize(c.sub2, 22, 690, 'Inter', 400)}" fill="#D0CBE6">${esc(c.sub2)}</text>
    <rect x="796" y="112" width="508" height="364" rx="24" fill="#FFFFFF"/>
    <rect x="796" y="112" width="508" height="40" rx="24" fill="#F7F6FB"/><rect x="796" y="132" width="508" height="20" fill="#F7F6FB"/>
    <circle cx="824" cy="132" r="6" fill="#FF5F57"/><circle cx="844" cy="132" r="6" fill="#FEBC2E"/><circle cx="864" cy="132" r="6" fill="#28C840"/>
    ${rowSvg}
    <rect x="0" y="550" width="1400" height="10" fill="${BRANDS.hitline.accent}"/></svg>`,
    1400,
    'promo-marquee-1400x560.png',
    dir,
  );
}
console.log(
  `store/hitline ready: hitline-${version}.zip, 5 screenshots and 2 promo tiles in ${STORE_LANGS.length} languages`,
);
