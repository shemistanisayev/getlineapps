/** Load a built Line extension unpacked in Playwright Chromium. Shared by every tool's e2e suite. */
import { chromium, test, type BrowserContext, type Worker } from '@playwright/test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export interface LoadedExtension {
  context: BrowserContext;
  worker: Worker;
  id: string;
  url: (path: string) => string;
  close: () => Promise<void>;
}

export function extensionDir(slug: string): string {
  return resolve(`apps/${slug}/extension/.output/chrome-mv3`);
}

export function readManifest(slug: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(extensionDir(slug), 'manifest.json'), 'utf8')) as Record<
    string,
    unknown
  >;
}

/** Skips the calling test when the extension has not been built (`pnpm build` first). */
export function requireBuilt(slug: string): void {
  test.skip(!existsSync(join(extensionDir(slug), 'manifest.json')), `${slug} is not built`);
}

export async function loadExtension(
  slug: string,
  extraArgs: string[] = [],
): Promise<LoadedExtension> {
  const dir = extensionDir(slug);
  const profile = mkdtempSync(join(tmpdir(), `line-${slug}-`));
  const launch = (channel: string) =>
    chromium.launchPersistentContext(profile, {
      channel,
      args: [`--disable-extensions-except=${dir}`, `--load-extension=${dir}`, ...extraArgs],
    });
  // Playwright Chromium first (CI). LINE_EXT_CHANNEL=msedge forces Edge; on some Windows builds
  // Chromium for Testing fails to start (spawn UNKNOWN), then Edge (also Chromium) is used.
  const forced = process.env.LINE_EXT_CHANNEL;
  let context: BrowserContext;
  try {
    context = await launch(forced ?? 'chromium');
  } catch (error) {
    if (forced || process.platform !== 'win32') throw error;
    console.warn('Playwright Chromium did not start, loading the extension in Edge instead.');
    context = await launch('msedge');
  }
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  return {
    context,
    worker,
    id,
    url: (path) => `chrome-extension://${id}/${path.replace(/^\//, '')}`,
    close: async () => {
      await context.close();
      rmSync(profile, { recursive: true, force: true });
    },
  };
}
