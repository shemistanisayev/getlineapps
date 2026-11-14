/**
 * Rivaline panel behaviour check: records every state the side panel shows (with its time) in
 * real scenarios that users hit, on a local test server:
 *   A. first click on a loaded page (panel closed)
 *   B. a click while the page is still loading
 *   C. a new page in the same tab while the panel is open
 *   D. a single-page app changes the URL without a reload
 *   E. Read the page again
 *   F. the tab is closed while it is being read
 *   G. the page has an alert open, so it cannot answer (the panel gives up after 45 s)
 *
 *   pnpm --filter @line/rivaline-extension build
 *   pnpm exec tsx scripts/ux-rivaline.ts
 */
import { createServer } from 'node:http';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const PANEL = 'sidepanel.html';
const PORT = 4471;
const base = `http://127.0.0.1:${PORT}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const page = (title: string, extra = '') => `<!doctype html><html><head><title>${title}</title>
<script>window.dataLayer=[];function gtag(){dataLayer.push(arguments)};window.google_tag_manager={'GTM-ABC1234':{}};</script>
<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-ABC1234"></script>
</head><body style="font-family:sans-serif;background:#fff;color:#111">
<header><a href="/"><svg width="80" height="30"><rect width="80" height="30" fill="#c00"/></svg></a></header>
<h1>${title}</h1><p>Text</p><a href="#" style="display:inline-block;padding:12px 24px;background:#c00;color:#fff">Buy now</a>
${extra}</body></html>`;

const server = createServer((req, res) => {
  const url = req.url ?? '/';
  if (url.startsWith('/slow.js')) {
    setTimeout(() => {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end('window.slowDone = true;');
    }, 5000);
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html' });
  if (url.startsWith('/slow')) res.end(page('Slow page', '<script src="/slow.js"></script>'));
  else if (url.startsWith('/alert'))
    res.end(page('Alert', '<script>setTimeout(() => alert("Hello"), 300)</script>'));
  else if (url.startsWith('/spa'))
    res.end(
      page(
        'SPA',
        `<button id="go" onclick="history.pushState({}, '', '/spa/other'); document.querySelector('h1').textContent='Other view'">Go</button>`,
      ),
    );
  else res.end(page(url === '/' ? 'Home' : url));
});
await new Promise<void>((r) => server.listen(PORT, '127.0.0.1', () => r()));

const ext = await loadExtensionCdp('rivaline', { port: 9339, realWindow: true });
// Vendor scripts never load in this check: answer them empty.
await ext.context.route(/googletagmanager\.com/, (r) => r.fulfill({ body: '' }));

/** Puts a recorder in the panel: every change of what it shows, with ms since `t0`. */
const RECORDER = `(() => {
  if (window.__rec) return true;
  window.__rec = []; window.__t0 = performance.now();
  const state = () => {
    const scan = document.querySelector('.rp-scan');
    if (scan) return 'reading ' + document.querySelectorAll('.rp-step.is-done').length + '/5';
    const h1 = document.querySelector('.rp-call h1, .rp-empty h1');
    if (h1) return 'view: ' + h1.textContent;
    const hero = document.querySelector('.rv-hero, [class*=hero]');
    const page = (document.body.innerText.match(/127\\.0\\.0\\.1:\\d+[^\\n]*/) || [''])[0];
    if (hero) return 'result: ' + (document.body.innerText.match(/\\d+ tools? in \\d+ categor\\w+/) || ['?'])[0] + ' | ' + page;
    return 'other: ' + document.body.innerText.slice(0, 60).replace(/\\n/g, ' ');
  };
  let last = '';
  const tick = () => { const s = state(); if (s !== last) { last = s; window.__rec.push([Math.round(performance.now() - window.__t0), s]); } };
  new MutationObserver(tick).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  tick();
  return true;
})()`;
const mark = () =>
  ext.evalIn(PANEL, `window.__rec = []; window.__t0 = performance.now(); window.__last = ''; true`);
const dump = async (label: string) => {
  const rec = await ext.evalIn<Array<[number, string]>>(PANEL, 'window.__rec');
  console.log(`\n=== ${label}`);
  for (const [ms, s] of rec) console.log(`${String(ms).padStart(6)} ms  ${s}`);
};

try {
  // A. First click, panel closed. Inject as early as the panel exists.
  const tab = await ext.context.newPage();
  await tab.goto(`${base}/`);
  await ext.clickAction(tab);
  for (let i = 0; i < 100 && !(await ext.hasPage(PANEL, 20)); i++);
  await ext.evalIn(PANEL, RECORDER).catch(() => ext.evalIn(PANEL, RECORDER));
  if (process.env.DEBUG) {
    for (let i = 0; i < 5; i++) {
      console.log(
        await ext.evalIn(
          PANEL,
          `JSON.stringify({ rec: window.__rec, url: location.href, text: document.body.innerText.slice(0, 80) })`,
        ),
      );
      await wait(500);
    }
    process.exit(0);
  }
  await wait(7000);
  await dump('A. first click on a loaded page (panel was closed)');

  // B. Click while the page is still loading (slow.js holds `load` for 5 s).
  const slow = await ext.context.newPage();
  await mark();
  void slow.goto(`${base}/slow`, { waitUntil: 'commit' });
  await wait(600);
  await ext.clickAction(slow);
  await wait(11000);
  await dump('B. click while the page is still loading (load after 5 s)');

  // C. New page in the same tab, panel open (same site keeps activeTab).
  await mark();
  await slow.goto(`${base}/page-two`);
  await wait(7000);
  await dump('C. new page in the same tab');

  // D. SPA: the URL changes without a reload.
  await slow.goto(`${base}/spa`);
  await wait(6000);
  await mark();
  await slow.click('#go');
  await wait(5000);
  await dump(`D. SPA pushState to ${slow.url()}`);

  // E. Read the page again.
  await mark();
  await ext.evalIn(
    PANEL,
    `document.querySelector('[aria-label="Read the page again"]').click()`,
    true,
  );
  await wait(6000);
  await dump('E. Read the page again');

  // F. The tab is closed while it is read.
  const gone = await ext.context.newPage();
  await gone.goto(`${base}/slow`, { waitUntil: 'commit' });
  await wait(300);
  await ext.clickAction(gone);
  await wait(800);
  await mark();
  await gone.close();
  await wait(6000);
  await dump('F. tab closed while it is read');

  // G. An alert blocks the page: scripts cannot run until it is closed.
  const blocked = await ext.context.newPage();
  blocked.on('dialog', () => undefined); // leave it open
  await blocked.goto(`${base}/alert`);
  await wait(800);
  await mark();
  await ext.clickAction(blocked);
  await wait(48000);
  await dump('G. alert open on the page');
  await ext.screenshot(PANEL, 'test-results/ux-rivaline-G.png').catch(() => undefined);
} finally {
  await ext.close();
  server.close();
}
