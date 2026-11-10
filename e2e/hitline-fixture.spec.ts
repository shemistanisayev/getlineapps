/**
 * Lumo fixture in a real browser: the shop fires the scenario requests, the test records them the
 * way the DevTools panel will (requests + HAR headers, navigations, timestamped dataLayer snapshots),
 * and core must give the same result as the scenario itself (packages/core/src/hitline/index.test.ts).
 */
import { expect, test, type Page } from '@playwright/test';
import {
  FIXTURE_HOSTS,
  hostResolverArgs,
  routeVendors,
  shopUrl,
  VENDOR_PATTERNS,
} from '../apps/fixture/hosts.ts';
import { lumoSession } from '../packages/core/fixtures/hitline/load.ts';
import { LUMO_PLAN_CSV, type RunId } from '../packages/core/fixtures/hitline/lumo.ts';
import {
  analyze,
  parsePlanCsv,
  type Audit,
  type RawRequest,
  type SessionInput,
  type Snapshot,
} from '../packages/core/src/hitline/index.ts';

const SHOTS = process.env.SHOTS_DIR;
const parsed = parsePlanCsv(LUMO_PLAN_CSV, 'lumo-tracking-plan.csv');
if (!parsed.ok) throw new Error('plan');
const plan = parsed.plan;

test.use({ launchOptions: { args: hostResolverArgs() } });

/** Records a session like the panel: requests with bodies and headers, navigations, dataLayer. */
async function recorder(page: Page) {
  const session: Required<SessionInput> = {
    requests: [],
    navigations: [],
    snapshots: [],
    gtmScripts: [],
  };
  const pending: Promise<void>[] = [];
  const leaks: string[] = [];
  let n = 0;
  let inflight = 0;
  // Timestamp every dataLayer push, as the panel's eval snapshot will.
  await page.addInitScript(() => {
    const w = window as unknown as {
      dataLayer: unknown[];
      __hl: { time: number; value: unknown }[];
    };
    w.__hl = [];
    const dl = (w.dataLayer = w.dataLayer || []);
    const push = dl.push.bind(dl);
    dl.push = (...items: unknown[]) => {
      for (const value of items) w.__hl.push({ time: Date.now(), value });
      return push(...items);
    };
  });
  page.on('request', (r) => {
    inflight++;
    const host = new URL(r.url()).hostname;
    const local = FIXTURE_HOSTS.includes(host);
    if (!local && !VENDOR_PATTERNS.some((p) => p.test(r.url()))) leaks.push(r.url());
  });
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) session.navigations.push({ time: Date.now(), url: f.url() });
  });
  page.on('requestfailed', () => inflight--);
  page.on('requestfinished', (r) => {
    inflight--;
    pending.push(
      (async () => {
        const resp = await r.response();
        const url = r.url();
        const req: RawRequest = {
          id: `req-${++n}`,
          time: Math.round(r.timing().startTime),
          method: r.method(),
          url,
          body: r.postData() ?? undefined,
          responseHeaders: resp ? await resp.headersArray() : [],
        };
        session.requests.push(req);
        if (url.includes('/gtm.js?id=') && resp) {
          session.gtmScripts.push({
            id: new URL(url).searchParams.get('id')!,
            body: await resp.text(),
          });
        }
      })(),
    );
  });
  const snapshot = async () => {
    const s = await page.evaluate(() => {
      const w = window as unknown as {
        __hl: { time: number; value: unknown }[];
        google_tag_manager?: object;
      };
      const names = /^(_ga|_ga_.*|_gcl_.*|_fbp|_fbc|_ttp|FPID)$/;
      const cookies: Record<string, string> = {};
      for (const c of document.cookie.split('; ')) {
        const [k, ...v] = c.split('=');
        if (k && names.test(k)) cookies[k] = v.join('=');
      }
      return {
        time: Date.now(),
        url: location.href,
        dataLayer: w.__hl.splice(0),
        gtmIds: Object.keys(w.google_tag_manager ?? {}).filter((k) => k.startsWith('GTM-')),
        cookies,
      };
    });
    session.snapshots.push(s as Snapshot);
  };
  const done = async () => {
    await Promise.all(pending);
    return session;
  };
  /** Waits until every request the page started has finished (networkidle does not re-wait). */
  const idle = () => expect.poll(() => inflight, { timeout: 5000 }).toBe(0);
  return { snapshot, done, leaks, idle };
}

type Recorder = Awaited<ReturnType<typeof recorder>>;

async function step(page: Page, rec: Recorder, trigger: string, action?: () => Promise<void>) {
  if (action) await action();
  await expect(page.locator('body')).toHaveAttribute(`data-${trigger}`, 'done');
  await rec.idle();
}

/** The comparable shape of an audit (no times, no http/https difference). */
function shape(a: Audit) {
  return {
    counts: a.counts,
    events: a.events.map((e) => `${e.platform} ${e.event} ${e.route}`),
    issues: a.issues.map((i) => i.key),
    sgtm: a.sgtm.signals.map((s) => `${s.id}:${s.found}`),
    tags: a.gtm.flatMap((g) => g.tags.map((t) => `${t.name}:${t.status}`)),
    timeline: a.consent.timeline.map((r) => `${r.phase} ${r.platform} ${r.event} ${r.status}`),
    attribution: a.attribution.steps.map(
      (s) => `${s.page.kind} ${s.source} ${s.gclid} ${s.clientId} ${s.badge.kind}`,
    ),
    plan: a.plan?.counts,
  };
}

const RUNS: Record<RunId, (page: Page, rec: Recorder) => Promise<void>> = {
  events: async (page, rec) => {
    await page.goto(shopUrl('/products/wireless-headphones-pro-x?run=events'));
    await step(page, rec, 'load');
    await step(page, rec, 'add', () => page.getByRole('button', { name: 'Add to cart' }).click());
    await step(page, rec, 'cart', () =>
      page.getByRole('button', { name: 'Cart', exact: true }).click(),
    );
    await step(page, rec, 'checkout', () => page.getByRole('button', { name: 'Checkout' }).click());
    await step(page, rec, 'signup', () => page.getByRole('button', { name: 'Sign up' }).click());
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/lumo-product.png` });
    await rec.snapshot();
  },
  consent: async (page, rec) => {
    await page.goto(shopUrl('/products/wireless-headphones-pro-x?run=consent'));
    await step(page, rec, 'load');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/lumo-banner.png` });
    await step(page, rec, 'reject', () => page.getByRole('button', { name: 'Reject all' }).click());
    await rec.snapshot();
  },
  clean: async (page, rec) => {
    await page.goto(shopUrl('/products/wireless-headphones-pro-x?run=clean'));
    await step(page, rec, 'load');
    await step(page, rec, 'add', () => page.getByRole('button', { name: 'Add to cart' }).click());
    await rec.snapshot();
  },
  journey: async (page, rec) => {
    await page.goto(
      shopUrl(
        '/campaign/fall-sale?utm_source=google&utm_medium=cpc&utm_campaign=fall_sale&gclid=Cj0KCQiA2KitBhCIARIsAPPMEhJ',
      ),
    );
    for (let i = 0; i < 5; i++) {
      await step(page, rec, 'load');
      await rec.snapshot();
      if (i < 4) await page.locator('#next').click();
    }
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/lumo-confirmation.png` });
  },
};

test.describe('hitline: Lumo fixture in a real browser', () => {
  for (const run of Object.keys(RUNS) as RunId[]) {
    test(`"${run}" run gives the same audit as the scenario`, async ({ context, page }) => {
      await routeVendors(context);
      const rec = await recorder(page);
      await RUNS[run](page, rec);
      const live = analyze(await rec.done(), { plan });
      const expected = analyze(lumoSession(run), { plan });
      expect(rec.leaks).toEqual([]);
      expect(shape(live)).toEqual(shape(expected));
      // QA: a correct setup raises nothing (the Lumo plan lists events this run never sends).
      if (run === 'clean') {
        expect(live.issues.filter((i) => i.severity !== 'info' && i.tab !== 'plan')).toEqual([]);
      }
    });
  }
});
