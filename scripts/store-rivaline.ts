/**
 * Chrome Web Store package for Rivaline (docs/rivaline-SPEC.md Phase 9), written to store/rivaline/:
 *   rivaline-<version>.zip           production build (wxt zip)
 *   screenshots/1-stack.png ...      5 screenshots, 1280x800, from the real side panel on Kova:
 *                                    Stack, Offer, Compare (Kova and Glowbar), Ads, Report PDF
 *   promo-small-440x280.png          small promo tile
 *   promo-marquee-1400x560.png       marquee promo tile
 *
 * Run from the repo root: pnpm store:rivaline (zips, then runs this file). The Kova fixture is
 * served in-process and every vendor URL is answered locally (apps/rivaline/fixture/vendors.ts).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from '@playwright/test';
import { Resvg } from '@resvg/resvg-js';
import { BRANDS, logoTileSvg } from '../packages/ui/src/brand.ts';
import { MARKS } from '../packages/ui/src/marks.ts';
import {
  analyzeStack,
  brandDomain,
  brandKit,
  brandName,
  libraryLinks,
  siteInfo,
  type BrandRaw,
  type PageSnapshot,
  type SiteRaw,
} from '../packages/core/src/rivaline/index.ts';
import { buildLineReport } from '../packages/report/src/index.ts';
import { loadReportFontsNode } from '../packages/report/src/fonts-node.ts';
import { translator } from '../apps/rivaline/extension/src/i18n/index.ts';
import { rivalineReport } from '../apps/rivaline/extension/src/report.ts';
import {
  RIVALINE_PORT,
  glowUrl,
  kovaUrl,
  rivalineHostArgs,
} from '../apps/rivaline/fixture/hosts.ts';
import { createFixtureServer } from '../apps/rivaline/fixture/server.ts';
import { routeRivalineVendors } from '../apps/rivaline/fixture/vendors.ts';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'store/rivaline');
const shots = join(out, 'screenshots');
const tmp = join(root, 'test-results/store-rivaline');
const version = JSON.parse(readFileSync(join(root, 'apps/rivaline/extension/package.json'), 'utf8'))
  .version as string;
mkdirSync(shots, { recursive: true });
mkdirSync(tmp, { recursive: true });

// 1. The zip
copyFileSync(
  join(root, `apps/rivaline/extension/.output/rivaline-${version}.zip`),
  join(out, `rivaline-${version}.zip`),
);
for (const s of [16, 32, 48, 128])
  copyFileSync(join(root, `packages/ui/icons/rivaline/icon-${s}.png`), join(out, `icon-${s}.png`));

// The Kova fixture, in-process (stopped at the end).
const server = createFixtureServer();
await new Promise<void>((ok, fail) => {
  server.once('error', fail);
  server.listen(RIVALINE_PORT, ok);
}).catch(() => undefined); // already running (Playwright webServer): use that one

const font = (f: string) => readFileSync(join(root, 'packages/ui/fonts', f)).toString('base64');
const FONT_CSS = `
@font-face{font-family:'Plus Jakarta Sans';font-weight:200 800;src:url(data:font/woff2;base64,${font('plus-jakarta-sans-latin-wght-normal.woff2')}) format('woff2')}
@font-face{font-family:'Inter';font-weight:100 900;src:url(data:font/woff2;base64,${font('inter-latin-wght-normal.woff2')}) format('woff2')}`;
const png = (p: string) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

/** A 1280x800 store screenshot: dark brand band with a caption, the real UI below. */
async function frame(page: Page, file: string, caption: string, body: string) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(`<!doctype html><html><head><style>${FONT_CSS}
    *{box-sizing:border-box}body{margin:0;width:1280px;height:800px;overflow:hidden;background:#120D24;font-family:Inter,sans-serif}
    .glow1{position:absolute;width:640px;height:640px;right:-160px;top:-260px;border-radius:50%;background:rgba(14,116,144,.6);filter:blur(80px)}
    .glow2{position:absolute;width:420px;height:420px;left:-140px;bottom:-200px;border-radius:50%;background:rgba(198,243,107,.18);filter:blur(80px)}
    .cap{position:absolute;left:64px;right:64px;top:44px;display:flex;align-items:center;gap:18px;color:#fff}
    .cap img{width:44px;height:44px}
    .cap h1{margin:0;font-family:'Plus Jakarta Sans';font-weight:800;font-size:38px;letter-spacing:-.03em}
    .ui{position:absolute;left:64px;right:64px;top:128px;bottom:-24px;border-radius:18px;overflow:hidden;background:#EFEDF5;box-shadow:0 40px 80px -30px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.1)}
    .site{position:absolute;left:0;top:0;bottom:0;right:400px;overflow:hidden;background:#FFFDF9}
    .site img{width:752px;display:block}
    .panel{position:absolute;right:0;top:0;bottom:0;width:400px;overflow:hidden;border-left:1px solid #DCD9E6;background:#EFEDF5}
    .panel img{width:400px;display:block}
  </style></head><body><span class="glow1"></span><span class="glow2"></span>
  <div class="cap"><img src="data:image/svg+xml;base64,${Buffer.from(logoTileSvg('rivaline', 44, 'dark')).toString('base64')}"><h1>${caption}</h1></div>
  <div class="ui">${body}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(shots, file) });
}

/** The browser view: the Kova page left, the side panel right. */
const split = (site: string, panel: string) =>
  `<div class="site"><img src="${png(site)}"></div><div class="panel"><img src="${png(panel)}"></div>`;

const PANEL = 'sidepanel.html';
const PANEL_SIZE = { width: 400, height: 672, scale: 2 };
const ext = await loadExtensionCdp('rivaline', {
  args: rivalineHostArgs(),
  port: 9336,
  realWindow: true,
});
try {
  await routeRivalineVendors(ext.context);
  const evalIn = <T = unknown>(expr: string, gesture = false) =>
    ext.evalIn<T>(PANEL, expr, gesture);
  const panelText = () => evalIn<string>("document.body?.innerText ?? ''");
  const until = async (text: string) => {
    for (let i = 0; i < 150; i++) {
      if ((await panelText()).includes(text)) return;
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(`Panel never showed: ${text}`);
  };
  const click = (selector: string) =>
    evalIn(`document.querySelector(${JSON.stringify(selector)}).click()`, true);

  // The page Rivaline reads keeps the window's own size: the logo is cropped from a real
  // screenshot of the tab, which an emulated viewport would not match.
  const page = await ext.context.newPage();
  await page.bringToFront();
  await page.goto(kovaUrl());
  await ext.clickAction(page);
  await until('13 tools in 8 categories');
  // Store shots only: no scrollbars in the panel picture.
  await evalIn(
    `document.head.append(Object.assign(document.createElement('style'), { textContent: 'html,body,*{scrollbar-width:none}' }))`,
  );

  // The picture of the site: desktop layout of Kova, scaled into the 752 x 672 page area.
  const view = await ext.context.newPage();
  await view.setViewportSize({ width: 1100, height: 983 });
  await view.goto(kovaUrl());
  await view.addStyleTag({ content: 'html{scrollbar-width:none}' });
  await view.evaluate(() => document.fonts.ready);
  await view.screenshot({ path: join(tmp, 'site.png') });
  await view.close();
  await page.bringToFront();

  await ext.screenshot(PANEL, join(tmp, 'stack.png'), PANEL_SIZE);
  await click('#rv-tab-offer');
  await until('Page language');
  await ext.screenshot(PANEL, join(tmp, 'offer.png'), PANEL_SIZE);
  await click('#rv-tab-ads');
  await until('SEARCH FOR');
  await ext.screenshot(PANEL, join(tmp, 'ads.png'), PANEL_SIZE);

  // Compare: read Glowbar in a second tab, come back to Kova, open Compare.
  await click('#rv-tab-stack');
  const glow = await ext.context.newPage();
  await glow.bringToFront();
  await glow.goto(glowUrl());
  await ext.clickAction(glow);
  await until('5 tools in 5 categories');
  await page.bringToFront();
  await until('13 tools in 8 categories');
  await click('[aria-label="Compare two sites"]');
  await until('Marketing tools');
  await new Promise((r) => setTimeout(r, 400));
  await ext.screenshot(PANEL, join(tmp, 'compare.png'), PANEL_SIZE);
  await click('[aria-label="Back to results"]');
  await glow.close();
  await page.close();

  // The report PDF from the same fixture, shown in the browser's PDF viewer.
  const fx = <T>(n: string) =>
    JSON.parse(
      readFileSync(join(root, 'packages/core/fixtures/rivaline', `${n}.json`), 'utf8'),
    ) as T;
  const snap = fx<PageSnapshot>('kova-snapshot');
  const stack = analyzeStack(snap);
  const report = await buildLineReport(
    rivalineReport(
      {
        url: snap.url,
        stack,
        brand: brandKit(fx<BrandRaw>('kova-brand')),
        site: siteInfo(fx<SiteRaw>('kova-site'), stack),
        searchBrand: brandName(snap),
        links: libraryLinks({ brand: brandName(snap), domain: brandDomain(snap.url) }, stack.tools),
      },
      translator('en'),
      'en',
      loadReportFontsNode(),
      new Date(2026, 10, 7, 11, 52),
    ),
  );
  const pdfFile = join(tmp, 'report.pdf');
  writeFileSync(pdfFile, report.bytes);
  const viewer = await chromium.launch({
    channel: 'msedge',
    headless: false,
    args: ['--window-position=-2400,0'],
  });
  try {
    const v = await viewer.newPage({ viewport: { width: 900, height: 1250 } });
    await v.goto(`${pathToFileURL(pdfFile).href}#toolbar=0&view=FitH`);
    await v.waitForTimeout(3000);
    // The viewer draws the A4 page at 584 x 826 px from the top-left corner.
    await v.screenshot({
      path: join(tmp, 'report.png'),
      clip: { x: 8, y: 2, width: 584, height: 826 },
    });
  } finally {
    await viewer.close();
  }

  const f = await ext.context.newPage();
  const site = join(tmp, 'site.png');
  await frame(
    f,
    '1-stack.png',
    'Every marketing tool a site runs, with its IDs',
    split(site, join(tmp, 'stack.png')),
  );
  await frame(
    f,
    '2-offer.png',
    'Their offers, social channels and markets',
    split(site, join(tmp, 'offer.png')),
  );
  await frame(f, '3-compare.png', 'Two rivals side by side', split(site, join(tmp, 'compare.png')));
  await frame(
    f,
    '4-ads.png',
    'Its ads in four ad libraries, one click away',
    split(site, join(tmp, 'ads.png')),
  );
  await frame(
    f,
    '5-report.png',
    'Turn it all into a competitor report PDF',
    `<div style="height:100%;display:flex;justify-content:center;padding-top:28px;background:linear-gradient(135deg,#ECFEFF,#EFEDF5)">
       <img src="${png(join(tmp, 'report.png'))}" style="width:620px;align-self:flex-start;border-radius:8px;box-shadow:0 30px 60px -24px rgba(21,94,117,.45)"></div>`,
  );
  await f.close();
} finally {
  await ext.close();
  server.close();
}

// 2. Promo tiles (SVG -> PNG, brand fonts only)
const fontFiles = [
  join(root, 'packages/report/fonts/PlusJakartaSans_800ExtraBold.ttf'),
  join(root, 'packages/report/fonts/Inter_400Regular.ttf'),
  join(root, 'packages/report/fonts/Inter_600SemiBold.ttf'),
];
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
function render(svg: string, width: number, file: string) {
  const bytes = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false, fontFiles, defaultFontFamily: 'Inter' },
  })
    .render()
    .asPng();
  writeFileSync(join(out, file), bytes);
}
function mark(name: keyof typeof MARKS, x: number, y: number, size: number): string {
  const m = MARKS[name];
  const g = size * 0.62;
  const paint = m.fill
    ? `fill="${m.fill}"`
    : `fill="none" stroke="${m.stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.27)}" fill="${m.tint}"/>
  <g transform="translate(${x + (size - g) / 2} ${y + (size - g) / 2}) scale(${g / 24})" ${paint}>${m.svg}</g>`;
}
const b = BRANDS.rivaline;
const bg = (w: number, h: number) => `
  <defs>
    <radialGradient id="g1" cx="0.95" cy="0" r="0.7"><stop offset="0" stop-color="#0E7490" stop-opacity=".65"/><stop offset="1" stop-color="#0E7490" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.6"><stop offset="0" stop-color="#C6F36B" stop-opacity=".22"/><stop offset="1" stop-color="#C6F36B" stop-opacity="0"/></radialGradient>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0E7490"/><stop offset="1" stop-color="#155E75"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#120D24"/><rect width="${w}" height="${h}" fill="url(#g1)"/><rect width="${w}" height="${h}" fill="url(#g2)"/>`;

render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">${bg(440, 280)}
    <g transform="translate(36 40)">${inner(logoTileSvg('rivaline', 56, 'dark'))}
      <text x="72" y="40" font-family="Plus Jakarta Sans" font-weight="800" font-size="38" letter-spacing="-1.1" fill="#FFFFFF">Riva<tspan fill="${b.bright}">line</tspan></text></g>
    <text font-family="Plus Jakarta Sans" font-weight="800" font-size="26" letter-spacing="-.8" fill="#FFFFFF">
      <tspan x="36" y="156">Any rival's stack, ads</tspan>
      <tspan x="36" y="190">and brand in <tspan fill="${b.bright}">one panel</tspan></tspan></text>
    <text x="36" y="238" font-family="Inter" font-weight="600" font-size="15" fill="#D0CBE6">Martech stack, ad libraries and brand kit</text>
    <rect x="0" y="272" width="440" height="8" fill="${b.accent}"/></svg>`,
  440,
  'promo-small-440x280.png',
);

const rows = [
  ['meta', 'Meta Pixel', '418273650912345'],
  ['tiktok', 'TikTok Pixel', 'C9H3KQ7RC77U2M0V5PLG'],
  ['googleads', 'Google Ads', 'AW-11284956'],
  ['googleanalytics', 'Google Analytics 4', 'G-8XK2LM4QPZ'],
  ['googletagmanager', 'Google Tag Manager', 'GTM-N4KV8R'],
] as const;
const rowSvg = rows
  .map(([m, label, id], i) => {
    const y = 270 + i * 46;
    return `<g transform="translate(820 ${y})">
      ${i ? '<rect x="0" y="-23" width="460" height="1" fill="#EAE8F0"/>' : ''}
      ${mark(m, 20, -15, 30)}
      <text x="64" y="7" font-family="Inter" font-weight="600" font-size="18" fill="#101828">${label}</text>
      <text x="440" y="6" text-anchor="end" font-family="Inter" font-weight="400" font-size="13" fill="#667085">${id}</text></g>`;
  })
  .join('');
const KOVA = ['#2F5D46', '#1E2B24', '#F6F1EA', '#EBC56B', '#DCE5D8'];
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">${bg(1400, 560)}
    <g transform="translate(90 88)">${inner(logoTileSvg('rivaline', 72, 'dark'))}
      <text x="94" y="52" font-family="Plus Jakarta Sans" font-weight="800" font-size="50" letter-spacing="-1.5" fill="#FFFFFF">Riva<tspan fill="${b.bright}">line</tspan></text></g>
    <text font-family="Plus Jakarta Sans" font-weight="800" font-size="54" letter-spacing="-2" fill="#FFFFFF">
      <tspan x="90" y="280">See any rival's stack, ads</tspan>
      <tspan x="90" y="350">and brand in <tspan fill="${b.bright}">one panel</tspan></tspan></text>
    <rect x="398" y="364" width="240" height="7" rx="4" fill="#C6F36B"/>
    <text x="90" y="430" font-family="Inter" font-weight="400" font-size="22" fill="#D0CBE6">Free Chrome extension: martech stack, four ad libraries</text>
    <text x="90" y="460" font-family="Inter" font-weight="400" font-size="22" fill="#D0CBE6">and the brand kit, with a competitor report PDF.</text>
    <rect x="796" y="96" width="508" height="400" rx="24" fill="#EFEDF5"/>
    <rect x="812" y="112" width="476" height="104" rx="16" fill="url(#hero)"/>
    <text x="836" y="150" font-family="Inter" font-weight="600" font-size="16" fill="#FFFFFF">example.com</text>
    <text x="836" y="188" font-family="Plus Jakarta Sans" font-weight="800" font-size="26" fill="#FFFFFF">13 tools in 8 categories</text>
    ${KOVA.map((c, i) => `<rect x="${1176 + i * 20}" y="${136 + (i % 2) * 0}" width="16" height="16" rx="5" fill="${c}" stroke="#FFFFFF" stroke-opacity=".35"/>`).join('')}
    <rect x="812" y="232" width="476" height="248" rx="14" fill="#FFFFFF"/>
    ${rowSvg}
    <rect x="0" y="550" width="1400" height="10" fill="${b.accent}"/></svg>`,
  1400,
  'promo-marquee-1400x560.png',
);
console.log(`store/rivaline ready: rivaline-${version}.zip, 5 screenshots, 2 promo tiles`);
