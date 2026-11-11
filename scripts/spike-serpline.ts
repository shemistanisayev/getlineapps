/**
 * Serpline permission spike (docs/serpline/PLAN.md, step 2; SPEC §3.1 and §3.2).
 * Runs on Chrome stable by default (LINE_EXT_CHANNEL=chromium|msedge to change it). Needs the Lumo fixture
 * (`pnpm --filter @line/fixture start`) and a built extension (`pnpm build`).
 *   pnpm tsx scripts/spike-serpline.ts [real-site-url]
 */
import { hostResolverArgs } from '../apps/fixture/hosts.ts';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const realSite = process.argv[2] ?? 'https://example.org/';
const ext = await loadExtensionCdp('serpline', {
  args: hostResolverArgs(),
  channel: process.env.LINE_EXT_CHANNEL ?? 'chrome',
});
const panelText = () => ext.evalIn<string>('sidepanel.html', "document.body?.innerText ?? ''");
const settle = () => new Promise((r) => setTimeout(r, 2500));
const log = (name: string, value: unknown) =>
  console.log(
    `\n## ${name}\n${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`,
  );

try {
  log('browser', ext.version);
  const page = await ext.context.newPage();

  // 1. Icon click on the fixture: side panel opens, activeTab lets the panel read the tab.
  await page.goto('http://example.com/products/wireless-headphones-pro-x');
  await ext.clickAction(page);
  log('1 panel opened by the icon', await ext.hasPage('sidepanel.html'));
  await settle();
  log('1 fixture read', await panelText());

  // 2. Shortcut registered (the key itself is pressed by a person; CDP cannot press browser keys).
  log(
    '2 commands',
    await ext.evalIn(
      'sidepanel.html',
      'chrome.commands.getAll().then((c) => c.map((x) => [x.name, x.shortcut]))',
    ),
  );

  // 3. Same-tab, same-origin navigation: the panel goes Stale. Does activeTab survive?
  await page.goto('http://example.com/electronics/headphones');
  await settle();
  log('3 stale after navigation', await panelText());
  const sameOrigin = await ext.evalIn(
    'sidepanel.html',
    `chrome.tabs.query({active: true, currentWindow: true}).then(([t]) =>
       chrome.scripting.executeScript({target: {tabId: t.id}, func: () => location.href})
         .then((r) => 'executeScript ok: ' + r[0].result, (e) => 'executeScript failed: ' + e.message))`,
  );
  log('3 activeTab after same-origin navigation', sameOrigin);

  // 4. permissions.request needs the user's click; with it Chrome shows its prompt (stays pending).
  const noGesture = await ext.evalIn(
    'sidepanel.html',
    `chrome.permissions.request({origins: ['http://example.com/*']}).then((g) => 'answered ' + g, (e) => 'error: ' + e.message)`,
  );
  log('4 permissions.request without a user gesture', noGesture);
  const request = await ext.evalIn(
    'sidepanel.html',
    `Promise.race([
       chrome.permissions.request({origins: ['http://example.com/*']}).then((g) => 'answered ' + g, (e) => 'error: ' + e.message),
       new Promise((r) => setTimeout(() => r('pending: Chrome prompt is open'), 1500)),
     ])`,
    true,
  );
  log('4 permissions.request with a user gesture', request);

  // 5. Another tab: the panel (opened per window) stays open and goes Stale.
  const other = await ext.context.newPage();
  await other.goto(realSite);
  await other.bringToFront();
  await settle();
  log('5 panel still open after switching tabs', await ext.hasPage('sidepanel.html', 500));
  log('5 panel text', await panelText());

  // 6. Real public site: icon click, same-origin fetches of raw HTML, robots.txt and llms.txt.
  await ext.clickAction(other);
  await settle();
  log(`6 real site ${realSite}`, await panelText());

  // 6b. Same tab, another site: activeTab is gone, so the panel needs a new click.
  await other.goto('http://example.com/products/wireless-headphones-pro-x');
  await settle();
  log(
    '6b activeTab after cross-origin navigation',
    await ext.evalIn(
      'sidepanel.html',
      `chrome.tabs.query({active: true, currentWindow: true}).then(([t]) =>
         chrome.scripting.executeScript({target: {tabId: t.id}, func: () => location.href})
           .then((r) => 'executeScript ok: ' + r[0].result, (e) => 'executeScript failed: ' + e.message))`,
    ),
  );

  // 7. Restricted page.
  const chromePage = await ext.context.newPage();
  await chromePage.goto('chrome://version');
  await ext.clickAction(chromePage);
  await settle();
  log('7 chrome://version', await panelText());
} finally {
  await ext.close();
}
