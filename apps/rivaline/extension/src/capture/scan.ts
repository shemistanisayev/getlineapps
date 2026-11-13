/**
 * The scan (docs/rivaline-SPEC.md §3.1): three calls on the granted tab, run from the side panel.
 *   1. collectSnapshot in the MAIN world (page globals), after the page has finished loading
 *   2. collectBrand in the isolated world
 *   3. captureVisibleTab, cropped to the logo with OffscreenCanvas; the screenshot is dropped
 * Nothing is stored: the panel keeps results in memory, per tab.
 */
import {
  GLOBAL_PATHS,
  KEY_VALUE_PATHS,
  SELECTORS,
  VALUE_PATHS,
  analyzeStack,
  brandKit,
  logoCrop,
  type BrandKit,
  type BrandRaw,
  type PageSnapshot,
  type Stack,
} from '@line/core/rivaline';
import { classifyError, isRestrictedPage, type ReadFailure } from './check.ts';
import { collectBrand } from './brand.ts';
import { collectSnapshot, type SnapshotArgs } from './snapshot.ts';

const ARGS: SnapshotArgs = {
  globals: GLOBAL_PATHS,
  values: VALUE_PATHS,
  keyValues: [...KEY_VALUE_PATHS],
  selectors: SELECTORS,
};

/** How long the page may take to finish loading before Rivaline reads what is there. */
export const LOAD_TIMEOUT_MS = 15_000;
/** Tags often load a moment after `load` (tag managers, consent): wait this long, then read. */
export const LATE_TAGS_MS = 1_500;
/** Nothing found yet: give late tags one more chance before saying so. */
export const EMPTY_RETRY_MS = 2_500;

export type ScanStep = 'load' | 'tools' | 'brand' | 'logo';

export interface ScanResult {
  tabId: number;
  url: string;
  origin: string;
  snapshot: PageSnapshot;
  stack: Stack;
  brand: BrandKit | null;
  /** The logo cropped from the visible tab, PNG. */
  logo: Blob | null;
  /** Seconds between the page finishing loading and the final read. */
  waited: number;
  readAt: number;
}

export type ScanOutcome = { ok: true; result: ScanResult } | { ok: false; reason: ReadFailure };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function inPage<T>(tabId: number, world: 'MAIN' | 'ISOLATED', func: () => T): Promise<T>;
async function inPage<T, A>(
  tabId: number,
  world: 'MAIN' | 'ISOLATED',
  func: (a: A) => T,
  arg: A,
): Promise<T>;
async function inPage<T, A>(
  tabId: number,
  world: 'MAIN' | 'ISOLATED',
  func: (a?: A) => T,
  arg?: A,
): Promise<T> {
  const [frame] = await browser.scripting.executeScript({
    target: { tabId },
    world,
    func: func as (...a: unknown[]) => T,
    args: arg === undefined ? [] : [arg],
  });
  return frame?.result as T;
}

function readyState(): { state: DocumentReadyState; type: string; url: string } {
  return { state: document.readyState, type: document.contentType, url: location.href };
}

/** Cuts the logo out of a screenshot of the visible tab. */
async function cropLogo(windowId: number, kit: BrandKit | null): Promise<Blob | null> {
  if (!logoCrop(kit?.logo ?? null)) return null;
  const dataUrl = await browser.tabs.captureVisibleTab(windowId, { format: 'png' });
  const shot = await createImageBitmap(await (await fetch(dataUrl)).blob());
  try {
    // Screenshot pixels per CSS pixel: the screen's scale, not always the page's devicePixelRatio.
    const vw = kit?.logo?.viewportWidth;
    const box = logoCrop(kit?.logo ?? null, vw ? shot.width / vw : undefined)!;
    const w = Math.min(box.width, shot.width - box.x);
    const h = Math.min(box.height, shot.height - box.y);
    if (w < 4 || h < 4) return null;
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d')!.drawImage(shot, box.x, box.y, w, h, 0, 0, w, h);
    return await canvas.convertToBlob({ type: 'image/png' });
  } finally {
    shot.close();
  }
}

/**
 * Reads the tab. `onStep` reports each finished step so the panel can show progress.
 * A tab that cannot be read gives Restricted or Access (SPEC §3.1).
 */
export async function scanTab(
  tabId: number,
  windowId: number,
  onStep: (done: ScanStep) => void = () => undefined,
): Promise<ScanOutcome> {
  try {
    // Wait for the page to finish loading (a fresh click often lands mid-load).
    let ready = await inPage(tabId, 'MAIN', readyState);
    if (isRestrictedPage({ url: ready.url, contentType: ready.type }))
      return { ok: false, reason: 'restricted' };
    const deadline = Date.now() + LOAD_TIMEOUT_MS;
    while (ready.state !== 'complete' && Date.now() < deadline) {
      await sleep(300);
      ready = await inPage(tabId, 'MAIN', readyState);
    }
    const loadedAt = Date.now();
    await sleep(LATE_TAGS_MS);
    onStep('load');

    let snapshot = await inPage(tabId, 'MAIN', collectSnapshot, ARGS);
    let stack = analyzeStack(snapshot);
    if (stack.tools.length === 0) {
      await sleep(EMPTY_RETRY_MS);
      snapshot = await inPage(tabId, 'MAIN', collectSnapshot, ARGS);
      stack = analyzeStack(snapshot);
    }
    const waited = Math.round((Date.now() - loadedAt) / 1000);
    onStep('tools');

    let brand: BrandKit | null = null;
    try {
      brand = brandKit(await inPage<BrandRaw>(tabId, 'ISOLATED', collectBrand));
    } catch {
      brand = null;
    }
    onStep('brand');

    let logo: Blob | null = null;
    try {
      logo = await cropLogo(windowId, brand);
    } catch {
      logo = null;
    }
    onStep('logo');

    return {
      ok: true,
      result: {
        tabId,
        url: snapshot.url,
        origin: snapshot.origin,
        snapshot,
        stack,
        brand,
        logo,
        waited,
        readAt: Date.now(),
      },
    };
  } catch (error) {
    return { ok: false, reason: classifyError(String((error as Error)?.message ?? error)) };
  }
}

/** Cheap check on a tab switch: can Rivaline still read it, and which page is it on? */
export async function probeTab(
  tabId: number,
): Promise<{ ok: true; url: string; origin: string } | { ok: false; reason: ReadFailure }> {
  try {
    const r = await inPage(tabId, 'MAIN', readyState);
    if (isRestrictedPage({ url: r.url, contentType: r.type }))
      return { ok: false, reason: 'restricted' };
    return { ok: true, url: r.url, origin: new URL(r.url).origin };
  } catch (error) {
    return { ok: false, reason: classifyError(String((error as Error)?.message ?? error)) };
  }
}
