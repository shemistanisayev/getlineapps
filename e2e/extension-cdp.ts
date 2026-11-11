/**
 * Load a built Line extension through CDP and click its toolbar icon for real.
 *
 * Playwright launches Chrome (persistent profile, so the extension runs in the context we drive)
 * with --enable-unsafe-extension-debugging and a debugging port. A raw browser-level CDP socket
 * then calls Extensions.loadUnpacked and Extensions.triggerAction, which runs the action on a tab
 * exactly like a user click (activeTab is granted). This also works on branded Chrome stable,
 * where --load-extension is gone. Side panels are not Playwright pages, so `evalIn` talks to them
 * over their own CDP socket.
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extensionDir } from './extension.ts';

export interface CdpExtension {
  context: BrowserContext;
  id: string;
  version: string;
  /** Clicks the extension's toolbar icon on this page's tab. */
  clickAction(page: Page): Promise<void>;
  /** Evaluates an expression in the extension page whose URL contains `path` (side panel ...). */
  evalIn<T = unknown>(path: string, expression: string, userGesture?: boolean): Promise<T>;
  /**
   * PNG of an extension page that Playwright cannot see (the side panel). `size` emulates a
   * viewport (CSS px) and pixel ratio first, for crisp store screenshots.
   */
  screenshot(
    path: string,
    file: string,
    size?: { width: number; height: number; scale?: number },
  ): Promise<void>;
  /** Waits until an extension page with `path` exists, returns whether it did. */
  hasPage(path: string, timeoutMs?: number): Promise<boolean>;
  close(): Promise<void>;
}

type TargetInfo = { type: string; url: string; targetId: string };
type JsonTarget = { url: string; webSocketDebuggerUrl?: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Minimal CDP client over one WebSocket. */
async function cdpSocket(url: string) {
  const ws = new WebSocket(url);
  await new Promise((ok, fail) => {
    ws.onopen = ok;
    ws.onerror = fail;
  });
  let next = 0;
  const pending = new Map<number, { ok: (v: unknown) => void; fail: (e: Error) => void }>();
  ws.onmessage = (e) => {
    const msg = JSON.parse(String(e.data)) as {
      id?: number;
      result?: unknown;
      error?: { message: string };
    };
    const p = msg.id === undefined ? undefined : pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id!);
    if (msg.error) p.fail(new Error(msg.error.message));
    else p.ok(msg.result);
  };
  return {
    send<T>(method: string, params: object = {}): Promise<T> {
      const id = ++next;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise<T>((ok, fail) =>
        pending.set(id, { ok: ok as (v: unknown) => void, fail }),
      );
    },
    close: () => ws.close(),
  };
}

/**
 * LINE_EXT_CHANNEL picks the browser: `chrome` (Chrome stable, the default for the spike),
 * `chromium` (Playwright's build, CI) or `msedge`.
 */
export async function loadExtensionCdp(
  slug: string,
  { args = [], port = 9333, channel }: { args?: string[]; port?: number; channel?: string } = {},
): Promise<CdpExtension> {
  const profile = mkdtempSync(join(tmpdir(), `line-${slug}-cdp-`));
  const launch = (ch: string) =>
    chromium.launchPersistentContext(profile, {
      channel: ch,
      headless: false,
      timezoneId: 'UTC',
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--enable-unsafe-extension-debugging',
        `--remote-debugging-port=${port}`,
        ...(process.env.CI ? ['--headless=new'] : []),
        ...args,
      ],
    });
  // Playwright Chromium first (CI). On some Windows builds Chromium for Testing fails to start
  // (spawn UNKNOWN); then Edge (also Chromium) is used, as in extension.ts.
  const forced = channel ?? process.env.LINE_EXT_CHANNEL;
  let context: BrowserContext;
  try {
    context = await launch(forced ?? 'chromium');
  } catch (error) {
    if (forced || process.platform !== 'win32') throw error;
    console.warn('Playwright Chromium did not start, loading the extension in Edge instead.');
    context = await launch('msedge');
  }
  const base = `http://127.0.0.1:${port}`;
  const { webSocketDebuggerUrl, Browser: version } = (await (
    await fetch(`${base}/json/version`)
  ).json()) as { webSocketDebuggerUrl: string; Browser: string };
  const browserCdp = await cdpSocket(webSocketDebuggerUrl);
  const { id } = await browserCdp.send<{ id: string }>('Extensions.loadUnpacked', {
    path: extensionDir(slug),
  });
  // A click before the service worker has registered its listeners is lost.
  const isOurs = (w: { url(): string }) => w.url().startsWith(`chrome-extension://${id}/`);
  if (!context.serviceWorkers().some(isOurs))
    await context.waitForEvent('serviceworker', { predicate: isOurs });

  const jsonTarget = async (path: string): Promise<JsonTarget | undefined> => {
    const list = (await (await fetch(`${base}/json/list`)).json()) as JsonTarget[];
    return list.find((t) => t.url.startsWith(`chrome-extension://${id}/`) && t.url.includes(path));
  };

  return {
    context,
    id,
    version,
    async clickAction(page) {
      await page.bringToFront();
      const { targetInfos } = await browserCdp.send<{ targetInfos: TargetInfo[] }>(
        'Target.getTargets',
        { filter: [{ type: 'tab' }] },
      );
      const tab = targetInfos.find((t) => t.url === page.url());
      if (!tab) throw new Error(`No tab target for ${page.url()}`);
      await browserCdp.send('Extensions.triggerAction', { id, targetId: tab.targetId });
    },
    async hasPage(path, timeoutMs = 5000) {
      for (let t = 0; t < timeoutMs; t += 100) {
        if (await jsonTarget(path)) return true;
        await wait(100);
      }
      return false;
    },
    async screenshot(path, file, size) {
      const target = await jsonTarget(path);
      if (!target?.webSocketDebuggerUrl) throw new Error(`No extension page ${path}`);
      const page = await cdpSocket(target.webSocketDebuggerUrl);
      try {
        if (size) {
          await page.send('Emulation.setDeviceMetricsOverride', {
            width: size.width,
            height: size.height,
            deviceScaleFactor: size.scale ?? 1,
            mobile: false,
          });
          await wait(300);
        }
        await page.send('Runtime.evaluate', {
          expression: 'document.fonts.ready.then(() => true)',
          awaitPromise: true,
        });
        const { data } = await page.send<{ data: string }>('Page.captureScreenshot', {
          format: 'png',
        });
        writeFileSync(file, Buffer.from(data, 'base64'));
        if (size) await page.send('Emulation.clearDeviceMetricsOverride', {});
      } finally {
        page.close();
      }
    },
    async evalIn<T>(path: string, expression: string, userGesture = false): Promise<T> {
      const target = await jsonTarget(path);
      if (!target?.webSocketDebuggerUrl) throw new Error(`No extension page ${path}`);
      const page = await cdpSocket(target.webSocketDebuggerUrl);
      try {
        const r = await page.send<{
          result: { value: T };
          exceptionDetails?: { text: string; exception?: { description?: string } };
        }>('Runtime.evaluate', {
          expression,
          awaitPromise: true,
          returnByValue: true,
          userGesture,
        });
        if (r.exceptionDetails)
          throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
        return r.result.value;
      } finally {
        page.close();
      }
    },
    async close() {
      browserCdp.close();
      await context.close().catch(() => undefined);
      // Chrome's child processes let go of the profile a moment after the browser exits.
      for (let i = 0; i < 20; i++) {
        try {
          rmSync(profile, { recursive: true, force: true });
          return;
        } catch {
          await wait(250);
        }
      }
    },
  };
}
