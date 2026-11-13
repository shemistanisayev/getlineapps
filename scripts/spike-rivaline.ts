/**
 * Rivaline API spike (docs/rivaline-SPEC.md §3, §5 and Phase 0; results in docs/rivaline/PLAN.md).
 * Writes a scratch MV3 extension (side panel, activeTab, scripting, storage) to a temp folder,
 * loads it in Chrome stable through CDP and clicks its icon for real (Extensions.triggerAction).
 * Kova and Glowbar are served by Playwright routes, so no fixture server is needed.
 *   pnpm tsx scripts/spike-rivaline.ts [screenshot-folder]
 * LINE_EXT_CHANNEL=chromium|msedge picks another browser.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const shots = process.argv[2];
if (shots) mkdirSync(shots, { recursive: true });

// ---- Scratch extension -------------------------------------------------------------------------
const dir = mkdtempSync(join(tmpdir(), 'rivaline-spike-'));
const files: Record<string, string> = {
  'manifest.json': JSON.stringify(
    {
      manifest_version: 3,
      name: 'Rivaline spike',
      version: '0.0.1',
      minimum_chrome_version: '116',
      permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
      background: { service_worker: 'background.js' },
      side_panel: { default_path: 'sidepanel.html' },
      action: { default_title: 'Rivaline spike' },
      commands: { _execute_action: { suggested_key: { default: 'Alt+Shift+R' } } },
    },
    null,
    2,
  ),
  'background.js': `
self.mode = 'window';
self.log = [];
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
chrome.action.onClicked.addListener((tab) => {
  // open() first and synchronously: it must run inside the click (user gesture).
  const opts = self.mode === 'tab' ? { tabId: tab.id } : { windowId: tab.windowId };
  chrome.sidePanel.open(opts).then(
    () => { self.log.push('open ok (' + self.mode + ')'); chrome.runtime.sendMessage({ type: 'scan', tabId: tab.id }).catch(() => {}); },
    (e) => self.log.push('open error (' + self.mode + '): ' + e.message),
  );
});
`,
  'sidepanel.html': `<!doctype html><meta charset="utf-8"><title>spike</title><body>panel<script src="sidepanel.js"></script>`,
  'sidepanel.js': `
self.messages = [];
chrome.runtime.onMessage.addListener((m) => { self.messages.push(m); });
self.activeTab = () => chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => t);
self.probe = async (world) => {
  const t = await activeTab();
  try {
    const r = await chrome.scripting.executeScript({
      target: { tabId: t.id }, world,
      func: () => ({
        origin: location.origin,
        fbq: typeof window.fbq,
        shopifyTheme: window.Shopify?.theme?.name ?? null,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        logo: document.querySelector('header [class*=logo] svg')?.getBoundingClientRect().toJSON() ?? null,
      }),
    });
    return { ok: true, result: r[0].result };
  } catch (e) { return { ok: false, error: e.message }; }
};
self.capture = async () => {
  const t = await activeTab();
  try {
    const url = await chrome.tabs.captureVisibleTab(t.windowId, { format: 'png' });
    const bmp = await createImageBitmap(await (await fetch(url)).blob());
    const c = new OffscreenCanvas(160, 48);
    c.getContext('2d').drawImage(bmp, 24, 16, 160, 48, 0, 0, 160, 48);
    const crop = await c.convertToBlob({ type: 'image/png' });
    return { ok: true, screenshot: bmp.width + 'x' + bmp.height, cropBytes: crop.size };
  } catch (e) { return { ok: false, error: e.message }; }
};
`,
};
for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);

// ---- Fictional sites ---------------------------------------------------------------------------
const site = (name: string, withTools: boolean) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><title>${name} | Shop</title><meta property="og:site_name" content="${name}">
${withTools ? `<script>window.fbq = function () {}; window.Shopify = { theme: { name: 'Dawn' } };</script>` : ''}
<style>body{margin:0;background:#FBF7F1;font-family:Georgia}header{height:64px;display:flex;align-items:center;padding:0 24px}</style>
</head><body><header><a href="/" class="site-logo"><svg width="96" height="28"><rect width="96" height="28" fill="#1F3A2E"/></svg></a></header>
<main><h1>${name}</h1></main></body></html>`;
// Smallest PDF Chrome's viewer opens, for the PDF viewer case.
const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF`;

// ---- Ad library URL formats (SPEC §5, as written) ----------------------------------------------
const brand = 'Nike';
const domain = 'nike.com';
const adUrls = (cc: string | null) => ({
  meta: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${cc ?? 'ALL'}&search_type=keyword_unordered&q=${encodeURIComponent(brand)}`,
  google: `https://adstransparency.google.com/?region=${cc ?? 'anywhere'}&domain=${domain}`,
  tiktok: `https://library.tiktok.com/ads?region=${cc ?? 'all'}&adv_name=${encodeURIComponent(brand)}`,
  linkedin: `https://www.linkedin.com/ad-library/search?accountOwner=${encodeURIComponent(brand)}`,
});

const results: Record<string, unknown> = {};
const log = (name: string, value: unknown) => {
  results[name] = value;
  console.log(
    `\n## ${name}\n${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`,
  );
};
const settle = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

const ext = await loadExtensionCdp('rivaline-spike', {
  dir,
  channel: process.env.LINE_EXT_CHANNEL ?? 'chrome',
});
const sw = ext.context
  .serviceWorkers()
  .find((w) => w.url().startsWith(`chrome-extension://${ext.id}/`))!;
const panel = <T>(expr: string) => ext.evalIn<T>('sidepanel.html', expr);

try {
  log('browser', ext.version);
  await ext.context.route('http://kova.localhost/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: site('Kova', true) }),
  );
  await ext.context.route('http://glow.localhost/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: site('Glowbar', true) }),
  );
  await ext.context.route('http://kova.localhost/file.pdf', (r) =>
    r.fulfill({ contentType: 'application/pdf', body: pdf }),
  );

  // 1. sidePanel.open({ tabId }) from action.onClicked (the SPEC's wording).
  const kova = await ext.context.newPage();
  await kova.goto('http://kova.localhost/');
  await sw.evaluate(() => ((self as unknown as { mode: string }).mode = 'tab'));
  await ext.clickAction(kova);
  log('1 open with tabId: panel exists', await ext.hasPage('sidepanel.html'));
  log('1 background log', await sw.evaluate(() => (self as unknown as { log: string[] }).log));
  await settle();
  log('1 panel got the scan message', await panel('self.messages'));
  await panel('window.close()').catch(() => undefined);
  await settle(800);

  // 1b. sidePanel.open({ windowId }) (one panel per window, survives tab switches).
  await sw.evaluate(() => ((self as unknown as { mode: string }).mode = 'window'));
  await ext.clickAction(kova);
  log('1b open with windowId: panel exists', await ext.hasPage('sidepanel.html'));
  log('1b background log', await sw.evaluate(() => (self as unknown as { log: string[] }).log));

  // 2. Shortcut.
  log(
    '2 commands',
    await panel('chrome.commands.getAll().then((c) => c.map((x) => [x.name, x.shortcut]))'),
  );

  // 3. activeTab grant, then executeScript from the panel in MAIN and ISOLATED.
  log('3 executeScript MAIN (page globals)', await panel("probe('MAIN')"));
  log('3 executeScript ISOLATED (styles)', await panel("probe('ISOLATED')"));

  // 4. captureVisibleTab with activeTab only, then crop with OffscreenCanvas in the panel.
  log('4 captureVisibleTab + crop', await panel('capture()'));

  // 5. Same tab, same origin navigation: is activeTab kept?
  await kova.goto('http://kova.localhost/collections/all');
  await settle();
  log('5 same-origin navigation: executeScript', await panel("probe('MAIN')"));
  log('5 same-origin navigation: capture', await panel('capture()'));

  // 6. Another tab, never clicked: the Access case.
  const glow = await ext.context.newPage();
  await glow.goto('http://glow.localhost/');
  await glow.bringToFront();
  await settle();
  log('6 panel still open after tab switch', await ext.hasPage('sidepanel.html', 500));
  log('6 ungranted tab: executeScript', await panel("probe('ISOLATED')"));
  log('6 ungranted tab: capture', await panel('capture()'));
  await ext.clickAction(glow);
  await settle();
  log('6b after a click on Glowbar: executeScript', await panel("probe('MAIN')"));

  // 7. Same tab, another site: grant gone?
  await glow.goto('http://kova.localhost/');
  await settle();
  log('7 cross-origin navigation: executeScript', await panel("probe('ISOLATED')"));

  // 8. Restricted pages, each after a real icon click.
  for (const url of [
    'chrome://version/',
    'chrome://extensions/',
    'https://chromewebstore.google.com/',
    'http://kova.localhost/file.pdf',
  ]) {
    const p = await ext.context.newPage();
    await p.goto(url).catch(() => undefined);
    await settle(2500);
    await ext.clickAction(p).catch((e: Error) => log(`8 ${url} click`, e.message));
    await settle();
    log(`8 ${url}: executeScript`, await panel("probe('ISOLATED')"));
    log(`8 ${url}: capture`, await panel('capture()'));
    await p.close();
  }

  // 9. Ad library URL formats: open each, record where it lands.
  for (const cc of [null, 'US']) {
    for (const [lib, url] of Object.entries(adUrls(cc))) {
      const p = await ext.context.newPage();
      await p.goto(url, { timeout: 30000 }).catch(() => undefined);
      await settle(6000);
      const landed = { asked: url, final: p.url(), title: await p.title().catch(() => '') };
      log(`9 ${lib} ${cc ?? 'all'}`, landed);
      if (shots) await p.screenshot({ path: join(shots, `${lib}-${cc ?? 'all'}.png`) });
      await p.close();
    }
  }
  if (shots) writeFileSync(join(shots, 'results.json'), JSON.stringify(results, null, 2));
} finally {
  await ext.close();
  rmSync(dir, { recursive: true, force: true });
}
