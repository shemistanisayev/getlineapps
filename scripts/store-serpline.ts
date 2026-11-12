/**
 * Chrome Web Store package for Serpline (docs/serpline-SPEC.md Phase 9), written to store/serpline/:
 *   serpline-<version>.zip           production build (wxt zip)
 *   screenshots/1-summary.png ...    5 screenshots, 1280x800, made from the Lumo fixture
 *   promo-small-440x280.png          small promo tile
 *   promo-marquee-1400x560.png       marquee promo tile
 *
 * Run from the repo root (builds everything it needs first):
 *   pnpm --filter @line/serpline-extension zip
 *   pnpm exec tsx scripts/store-serpline.ts
 * The Serpline fixture server is started when it is not running.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from '@playwright/test';
import { Resvg } from '@resvg/resvg-js';
import { Window } from 'happy-dom';
import { BRANDS, logoTileSvg } from '../packages/ui/src/brand.ts';
import { hostResolverArgs, SERPLINE_PORT, serplineUrl } from '../apps/fixture/hosts.ts';
import { analyze, type LinkResult } from '../packages/core/src/serpline/index.ts';
import { buildLineReport } from '../packages/report/src/index.ts';
import { loadReportFontsNode } from '../packages/report/src/fonts-node.ts';
import { translator } from '../apps/serpline/extension/src/i18n/index.ts';
import { serplineReport } from '../apps/serpline/extension/src/report.ts';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'store/serpline');
const shots = join(out, 'screenshots');
const tmp = join(root, 'test-results/store-serpline');
const version = JSON.parse(readFileSync(join(root, 'apps/serpline/extension/package.json'), 'utf8'))
  .version as string;
mkdirSync(shots, { recursive: true });
mkdirSync(tmp, { recursive: true });

// 1. The zip
copyFileSync(
  join(root, `apps/serpline/extension/.output/serpline-${version}.zip`),
  join(out, `serpline-${version}.zip`),
);

// Fixture server
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
await ensure(`http://localhost:${SERPLINE_PORT}/robots.txt`, [
  'pnpm',
  '--filter',
  '@line/fixture',
  'start:serpline',
]);

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
    .glow1{position:absolute;width:640px;height:640px;right:-160px;top:-260px;border-radius:50%;background:rgba(37,99,235,.55);filter:blur(80px)}
    .glow2{position:absolute;width:420px;height:420px;left:-140px;bottom:-200px;border-radius:50%;background:rgba(198,243,107,.18);filter:blur(80px)}
    .cap{position:absolute;left:64px;right:64px;top:44px;display:flex;align-items:center;gap:18px;color:#fff}
    .cap img{width:44px;height:44px}
    .cap h1{margin:0;font-family:'Plus Jakarta Sans';font-weight:800;font-size:38px;letter-spacing:-.03em}
    .ui{position:absolute;left:64px;right:64px;top:128px;bottom:-24px;border-radius:18px;overflow:hidden;background:#EFEDF5;box-shadow:0 40px 80px -30px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.1)}
    .site{position:absolute;left:0;top:0;bottom:0;right:400px;overflow:hidden;background:#FBFAF7}
    .site img{width:752px;display:block}
    .panel{position:absolute;right:0;top:0;bottom:0;width:400px;overflow:hidden;border-left:1px solid #D3DAE5;background:#EFEDF5}
    .panel img{width:400px;display:block}
  </style></head><body><span class="glow1"></span><span class="glow2"></span>
  <div class="cap"><img src="data:image/svg+xml;base64,${Buffer.from(logoTileSvg('serpline', 44, 'dark')).toString('base64')}"><h1>${caption}</h1></div>
  <div class="ui">${body}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(shots, file) });
}

/** The browser view of the store screenshots: the Lumo page left, the side panel right. */
const split = (site: string, panel: string) =>
  `<div class="site"><img src="${png(site)}"></div><div class="panel"><img src="${png(panel)}"></div>`;

const PANEL = 'sidepanel.html';
const PANEL_SIZE = { width: 400, height: 672, scale: 2 };
const ext = await loadExtensionCdp('serpline', {
  args: hostResolverArgs(SERPLINE_PORT),
  port: 9335,
});
try {
  const evalIn = <T = unknown>(expr: string, gesture = false) =>
    ext.evalIn<T>(PANEL, expr, gesture);
  const panelText = () => evalIn<string>("document.body?.innerText ?? ''");
  const until = async (text: string) => {
    for (let i = 0; i < 100; i++) {
      if ((await panelText()).includes(text)) return;
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(`Panel never showed: ${text}`);
  };
  const tab = (name: string) =>
    evalIn(
      `[...document.querySelectorAll('[role=tab]')].find((b) => b.textContent.startsWith(${JSON.stringify(name)})).click()`,
    );

  const page = await ext.context.newPage();
  // Desktop layout of the shop, scaled down into the 752 x 672 page area of the frame.
  await page.setViewportSize({ width: 1100, height: 983 });
  // In front while it loads, so Chrome reports LCP and FCP for the Speed tab.
  await page.bringToFront();
  await page.goto(serplineUrl());
  await page.addStyleTag({ content: 'html{scrollbar-width:none}' });
  await ext.clickAction(page);
  await until('SEO score: needs work');
  // Store shots only: no scrollbars in the panel picture.
  await evalIn(
    `document.head.append(Object.assign(document.createElement('style'), { textContent: 'html,body,*{scrollbar-width:none}' }))`,
  );

  // Links first, so the score includes the link check.
  await tab('Links');
  await until('Check 52 internal links');
  await evalIn(
    `[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Check 52')).click()`,
    true,
  );
  await until('52 internal links checked');
  await page.screenshot({ path: join(tmp, 'site.png') });

  await tab('Summary');
  await until('2 high, 7 medium');
  await ext.screenshot(PANEL, join(tmp, 'summary.png'), PANEL_SIZE);
  await tab('Render');
  await until('91% of the text needs JavaScript');
  await ext.screenshot(PANEL, join(tmp, 'render.png'), PANEL_SIZE);
  await tab('AI');
  await until('PerplexityBot is blocked');
  await ext.screenshot(PANEL, join(tmp, 'ai.png'), PANEL_SIZE);
  // Speed (1.1) with its page highlight: the LCP element and the images with a finding.
  await tab('Speed');
  await until('SERVER RESPONSE');
  await evalIn(`document.querySelector('#sp-hl-speed').click()`, true);
  await page.waitForSelector('[data-serpline-overlay]', { state: 'attached' });
  await page.waitForTimeout(400);
  await ext.screenshot(PANEL, join(tmp, 'speed.png'), PANEL_SIZE);
  await page.screenshot({ path: join(tmp, 'site-highlight.png') });
  await page.close();

  // The audit PDF from the same fixture, shown in the browser's PDF viewer.
  const fx = (n: string) => readFileSync(join(root, 'packages/core/fixtures/serpline', n), 'utf8');
  (globalThis as unknown as { DOMParser: unknown }).DOMParser = new Window({
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
      handleDisabledFileLoadingAsSuccess: true,
    },
  }).DOMParser;
  const audit = analyze({
    url: serplineUrl(),
    renderedHtml: fx('lumo-rendered.html'),
    raw: { status: 200, contentType: 'text/html', text: fx('lumo-raw.html'), xRobotsTag: null },
    robots: { status: 200, text: fx('lumo-robots.txt'), contentType: 'text/plain' },
    llms: { status: 404, text: '', contentType: 'text/plain' },
    linkResults: JSON.parse(fx('lumo-links.json')) as LinkResult[],
  });
  const report = await buildLineReport(
    serplineReport(
      audit,
      translator('en'),
      'en',
      loadReportFontsNode(),
      new Date(2026, 10, 7, 10, 42),
    ),
  );
  const pdfFile = join(tmp, 'audit.pdf');
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
  await frame(
    f,
    '1-summary.png',
    'SEO checks and a score for the page you are on',
    split(join(tmp, 'site.png'), join(tmp, 'summary.png')),
  );
  await frame(
    f,
    '2-render.png',
    'See what only shows up after JavaScript',
    split(join(tmp, 'site.png'), join(tmp, 'render.png')),
  );
  await frame(
    f,
    '3-ai.png',
    'Which AI crawlers can read the site',
    split(join(tmp, 'site.png'), join(tmp, 'ai.png')),
  );
  await frame(
    f,
    '4-speed.png',
    'Core Web Vitals, images and mobile checks',
    split(join(tmp, 'site-highlight.png'), join(tmp, 'speed.png')),
  );
  await frame(
    f,
    '5-audit-pdf.png',
    'Turn the findings into an audit PDF',
    `<div style="height:100%;display:flex;justify-content:center;padding-top:28px;background:linear-gradient(135deg,#EFF6FF,#EFEDF5)">
       <img src="${png(join(tmp, 'report.png'))}" style="width:620px;align-self:flex-start;border-radius:8px;box-shadow:0 30px 60px -24px rgba(30,64,175,.45)"></div>`,
  );
  await f.close();
} finally {
  await ext.close();
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
const b = BRANDS.serpline;
const bg = (w: number, h: number) => `
  <defs>
    <radialGradient id="g1" cx="0.95" cy="0" r="0.7"><stop offset="0" stop-color="#2563EB" stop-opacity=".6"/><stop offset="1" stop-color="#2563EB" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.6"><stop offset="0" stop-color="#C6F36B" stop-opacity=".22"/><stop offset="1" stop-color="#C6F36B" stop-opacity="0"/></radialGradient>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#1E40AF"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#120D24"/><rect width="${w}" height="${h}" fill="url(#g1)"/><rect width="${w}" height="${h}" fill="url(#g2)"/>`;

render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">${bg(440, 280)}
    <g transform="translate(36 40)">${inner(logoTileSvg('serpline', 56, 'dark'))}
      <text x="72" y="40" font-family="Plus Jakarta Sans" font-weight="800" font-size="38" letter-spacing="-1.1" fill="#FFFFFF">Serp<tspan fill="${b.bright}">line</tspan></text></g>
    <text font-family="Plus Jakarta Sans" font-weight="800" font-size="27" letter-spacing="-.8" fill="#FFFFFF">
      <tspan x="36" y="158">See your page the way</tspan>
      <tspan x="36" y="194" fill="#93C5FD">Google and AI</tspan><tspan> do.</tspan></text>
    <text x="36" y="238" font-family="Inter" font-weight="600" font-size="15" fill="#D0CBE6">SEO, JavaScript render and AI crawler checks</text>
    <rect x="0" y="272" width="440" height="8" fill="${b.accent}"/></svg>`,
  440,
  'promo-small-440x280.png',
);

const rows = [
  ['Title', 'Fits', '#ECFDF3', '#067647', 'M5 12.5l4.5 4.5L19 7.5'],
  ['Description', 'Cut off', '#FFFAEB', '#B54708', 'M12 6v8M12 18.5h.01'],
  ['H1', 'JS only', '#FEF3F2', '#B42318', 'M12 6v8M12 18.5h.01'],
  ['GPTBot', 'Allowed', '#ECFDF3', '#067647', 'M5 12.5l4.5 4.5L19 7.5'],
  ['PerplexityBot', 'Blocked', '#FEF3F2', '#B42318', 'M7 7l10 10M17 7L7 17'],
] as const;
const rowSvg = rows
  .map(([label, status, bgc, fg, icon], i) => {
    const y = 270 + i * 46;
    const w = 40 + status.length * 9;
    return `<g transform="translate(820 ${y})">
      ${i ? '<rect x="0" y="-23" width="460" height="1" fill="#EAE8F0"/>' : ''}
      <text x="24" y="7" font-family="Inter" font-weight="600" font-size="18" fill="#101828">${label}</text>
      <rect x="${436 - w}" y="-14" width="${w}" height="28" rx="14" fill="${bgc}"/>
      <path transform="translate(${436 - w + 11} -6) scale(.5)" d="${icon}" fill="none" stroke="${fg}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${436 - w + 30}" y="6" font-family="Inter" font-weight="600" font-size="14" fill="${fg}">${status}</text></g>`;
  })
  .join('');
const c27 = 2 * Math.PI * 27;
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">${bg(1400, 560)}
    <g transform="translate(90 88)">${inner(logoTileSvg('serpline', 72, 'dark'))}
      <text x="94" y="52" font-family="Plus Jakarta Sans" font-weight="800" font-size="50" letter-spacing="-1.5" fill="#FFFFFF">Serp<tspan fill="${b.bright}">line</tspan></text></g>
    <text font-family="Plus Jakarta Sans" font-weight="800" font-size="56" letter-spacing="-2" fill="#FFFFFF">
      <tspan x="90" y="286">See your page the way</tspan>
      <tspan x="90" y="362" fill="#93C5FD">Google and AI</tspan><tspan> do.</tspan></text>
    <text x="90" y="436" font-family="Inter" font-weight="400" font-size="22" fill="#D0CBE6">Free Chrome extension: technical SEO, JavaScript rendering</text>
    <text x="90" y="466" font-family="Inter" font-weight="400" font-size="22" fill="#D0CBE6">and AI crawler access, in one side panel.</text>
    <rect x="796" y="96" width="508" height="400" rx="24" fill="#EFEDF5"/>
    <rect x="812" y="112" width="476" height="104" rx="16" fill="url(#hero)"/>
    <g transform="translate(832 132)">
      <circle cx="32" cy="32" r="27" fill="none" stroke="#FFFFFF" stroke-opacity=".25" stroke-width="7"/>
      <circle cx="32" cy="32" r="27" fill="none" stroke="#C6F36B" stroke-width="7" stroke-linecap="round" stroke-dasharray="${((c27 * 56) / 100).toFixed(1)} ${Math.ceil(c27)}" transform="rotate(-90 32 32)"/>
      <text x="32" y="40" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="22" fill="#FFFFFF">56</text>
    </g>
    <text x="920" y="158" font-family="Plus Jakarta Sans" font-weight="800" font-size="24" fill="#FFFFFF">SEO score: needs work</text>
    <text x="920" y="188" font-family="Inter" font-weight="400" font-size="16" fill="#EEF3FD">2 high, 6 medium, 2 low priority issues</text>
    <rect x="812" y="232" width="476" height="248" rx="14" fill="#FFFFFF"/>
    ${rowSvg}
    <rect x="0" y="550" width="1400" height="10" fill="${b.accent}"/></svg>`,
  1400,
  'promo-marquee-1400x560.png',
);
console.log(`store/serpline ready: serpline-${version}.zip, 5 screenshots, 2 promo tiles`);
