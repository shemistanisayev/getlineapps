/**
 * Responsive QA for the Hitline popup and DevTools panel and the Serpline side panel.
 * Renders every screen at narrow to wide sizes, reports horizontal overflow, content that sticks
 * out of its box and text that overlaps other text, and saves a screenshot of each to
 * test-results/qa-responsive/. Run `pnpm build` and the fixture servers (Playwright starts them)
 * first:
 *
 *   pnpm --filter @line/fixture start & pnpm --filter @line/fixture start:serpline &
 *   pnpm exec tsx scripts/qa-responsive.ts [hitline|serpline]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { hostResolverArgs, SERPLINE_PORT, serplineUrl } from '../apps/fixture/hosts.ts';
import { lumoSession } from '../packages/core/fixtures/hitline/load.ts';
import { LUMO_PLAN_CSV } from '../packages/core/fixtures/hitline/lumo.ts';
import { parsePlanCsv } from '../packages/core/src/hitline/index.ts';
import { loadExtension } from '../e2e/extension.ts';
import { loadExtensionCdp } from '../e2e/extension-cdp.ts';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'test-results/qa-responsive');
mkdirSync(out, { recursive: true });
const only = process.argv[2];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Runs in the page: returns a list of layout problems at the current size. */
export const PROBE = `(() => {
  const W = document.documentElement.clientWidth;
  const problems = [];
  const label = (el) => {
    const c = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
    const txt = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    return el.tagName.toLowerCase() + c + (txt ? ' "' + txt + '"' : '');
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const scrollsX = (el) => /(auto|scroll)/.test(getComputedStyle(el).overflowX);
  const clipsX = (el) => /(hidden|clip)/.test(getComputedStyle(el).overflowX);
  const over = document.documentElement.scrollWidth - W;
  if (over > 1) problems.push('page scrolls sideways by ' + over + 'px');
  // Children sticking out of their parent on the right (not inside a horizontal scroller).
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const p = el.parentElement;
    if (!p || p === document.body) continue;
    const s = getComputedStyle(el);
    if (s.position === 'fixed' || s.position === 'absolute') continue;
    const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
    if (r.right > pr.right + 2 && !scrollsX(p)) {
      let a = p, inScroller = false;
      while (a && a !== document.body) { if (scrollsX(a) || clipsX(a)) { inScroller = true; break; } a = a.parentElement; }
      if (!inScroller) problems.push('sticks out ' + Math.round(r.right - pr.right) + 'px: ' + label(el) + ' in ' + label(p));
    }
    // Text cut off by overflow:hidden without an ellipsis.
    if (clipsX(el) && el.scrollWidth > el.clientWidth + 2 && s.textOverflow !== 'ellipsis' && el.children.length === 0)
      problems.push('text clipped: ' + label(el));
  }
  // Text boxes that overlap other text.
  const boxes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim() || !n.parentElement || !visible(n.parentElement)) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    // Clip by every ancestor that hides overflow: rows scrolled out of view do not count.
    let clip = { left: -1e9, top: -1e9, right: 1e9, bottom: 1e9 };
    for (let a = n.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const ar = a.getBoundingClientRect();
        clip = { left: Math.max(clip.left, ar.left), top: Math.max(clip.top, ar.top), right: Math.min(clip.right, ar.right), bottom: Math.min(clip.bottom, ar.bottom) };
      }
    }
    for (const r0 of range.getClientRects()) {
      const r = { left: Math.max(r0.left, clip.left), top: Math.max(r0.top, clip.top), right: Math.min(r0.right, clip.right), bottom: Math.min(r0.bottom, clip.bottom) };
      if (r.right - r.left > 1 && r.bottom - r.top > 1) boxes.push({ r, el: n.parentElement });
    }
  }
  const seen = new Set();
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.el === b.el) continue;
    const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
    const y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (x > 3 && y > 3) {
      const key = label(a.el) + ' / ' + label(b.el);
      if (!seen.has(key)) { seen.add(key); problems.push('text overlaps: ' + key); }
    }
  }
  return problems;
})()`;

const report: string[] = [];
const log = (name: string, problems: string[]) => {
  const line = `${problems.length ? 'FAIL' : 'ok  '} ${name}${problems.length ? '\n    ' + problems.slice(0, 12).join('\n    ') : ''}`;
  report.push(line);
  console.log(line);
};

async function shot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await wait(150);
  log(name, await page.evaluate<string[]>(PROBE));
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
}

async function hitline() {
  const ext = await loadExtension('hitline');
  try {
    const parsed = parsePlanCsv(LUMO_PLAN_CSV, 'lumo-tracking-plan.csv');
    if (!parsed.ok) throw new Error('plan');
    await ext.worker.evaluate((plans) => chrome.storage.local.set({ plans }), {
      'example.com': parsed.plan,
    });
    const page = await ext.context.newPage();
    await page.addInitScript((s) => {
      (window as unknown as { __HITLINE_REPLAY__: unknown }).__HITLINE_REPLAY__ = s;
    }, lumoSession('events'));
    for (const [w, h] of [
      [1440, 660],
      [1440, 380],
      [1024, 500],
      [820, 400],
      [600, 400],
      [420, 700],
      [320, 600],
    ] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(ext.url('devtools-panel.html'));
      await page.waitForSelector('#tab-events');
      for (const tab of ['events', 'gtm', 'consent', 'attribution', 'plan']) {
        await page.click(`#tab-${tab}`);
        await wait(250);
        await shot(page, `hitline-panel-${tab}-${w}x${h}`);
      }
    }
    // Empty and loading states.
    const empty = await ext.context.newPage();
    for (const w of [1024, 600, 320]) {
      await empty.setViewportSize({ width: w, height: 500 });
      await empty.goto(ext.url('devtools-panel.html'));
      await wait(800);
      await shot(empty, `hitline-panel-empty-${w}`);
    }
    // Popup: Chrome draws it at the body width; check the views at its own width and when the
    // browser zoom makes it narrower in CSS px.
    const popup = await ext.context.newPage();
    for (const w of [372]) {
      await popup.setViewportSize({ width: w, height: 600 });
      await popup.goto(ext.url('popup.html'));
      await wait(800);
      await shot(popup, `hitline-popup-${w}`);
    }
  } finally {
    await ext.close();
  }
}

async function serpline() {
  const ext = await loadExtensionCdp('serpline', {
    args: hostResolverArgs(SERPLINE_PORT),
    port: 9337,
  });
  const PANEL = 'sidepanel.html';
  try {
    const page = await ext.context.newPage();
    await page.goto(serplineUrl());
    await ext.clickAction(page);
    for (let i = 0; i < 100; i++) {
      const s = await ext.evalIn<string>(PANEL, "document.body?.innerText ?? ''").catch(() => '');
      if (s.includes('SEO score')) break;
      await wait(300);
    }
    await ext.evalIn(PANEL, `document.querySelector('#sl-tab-links')?.click()`, true);
    await ext.evalIn(
      PANEL,
      `[...document.querySelectorAll('button')].find((b) => /^Check \\d+ internal link/.test(b.textContent))?.click()`,
      true,
    );
    await wait(4000);
    const sizes = [
      [280, 700],
      [320, 700],
      [400, 700],
      [560, 700],
      [800, 700],
    ] as const;
    const run = async (name: string) => {
      for (const [w, h] of sizes) {
        const problems = await ext.evalIn<string[]>(PANEL, PROBE, false, { width: w, height: h });
        const full = await ext.evalIn<number>(
          PANEL,
          'document.documentElement.scrollHeight',
          false,
          { width: w, height: h },
        );
        await ext.screenshot(PANEL, join(out, `serpline-${name}-${w}.png`), {
          width: w,
          height: Math.min(full, 4000),
        });
        log(`serpline-${name}-${w}`, problems);
      }
    };
    for (const tab of ['summary', 'headings', 'links', 'render', 'speed', 'ai']) {
      await ext.evalIn(PANEL, `document.querySelector('#sl-tab-${tab}')?.click()`, true);
      await wait(400);
      await run(tab);
    }
    await ext.evalIn(
      PANEL,
      `[...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Settings' || b.title === 'Settings')?.click()`,
      true,
    );
    await wait(400);
    await run('settings');
  } finally {
    await ext.close();
  }
}

if (!only || only === 'hitline') await hitline();
if (!only || only === 'serpline') await serpline();
writeFileSync(join(out, `report${only ? '-' + only : ''}.txt`), report.join('\n'));
