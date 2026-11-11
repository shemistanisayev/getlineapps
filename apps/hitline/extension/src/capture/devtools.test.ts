import { describe, expect, it, vi } from 'vitest';
import { DevtoolsSource, type DevtoolsLike, type HarEntryLike } from './devtools.ts';
import { toSnapshot, type ProbeResult } from './probe.ts';
import { SessionStore } from './session.ts';

function fakeDevtools(
  har: HarEntryLike[],
  probe: () => ProbeResult,
  resources: { url: string; content: string }[] = [],
) {
  const finished: ((e: HarEntryLike) => void)[] = [];
  const navigated: ((u: string) => void)[] = [];
  const reloads: unknown[] = [];
  const api: DevtoolsLike = {
    network: {
      getHAR: (cb) => cb({ entries: har }),
      onRequestFinished: { addListener: (f) => finished.push(f), removeListener: () => {} },
      onNavigated: { addListener: (f) => navigated.push(f), removeListener: () => {} },
    },
    inspectedWindow: {
      eval: (_expr, cb) => cb(probe()),
      reload: (o) => reloads.push(o),
      getResources: (cb) =>
        cb(resources.map((r) => ({ url: r.url, getContent: (c) => c(r.content, '') }))),
    },
  };
  return { api, finished, navigated, reloads };
}

const entry = (url: string, extra: Partial<HarEntryLike> = {}): HarEntryLike => ({
  startedDateTime: '2026-11-06T10:42:18.204Z',
  request: { method: 'GET', url },
  ...extra,
});

const probe = (over: Partial<ProbeResult> = {}): ProbeResult => ({
  href: 'https://example.com/',
  timeOrigin: Date.parse('2026-11-06T10:42:17.900Z'),
  now: Date.parse('2026-11-06T10:42:19.000Z'),
  length: 0,
  timed: false,
  restarted: false,
  entries: [],
  gtm: [],
  cmp: [],
  cookies: {},
  ...over,
});

describe('capture', () => {
  it('backfills tracking requests from the HAR and ignores everything else', () => {
    const store = new SessionStore();
    const { api } = fakeDevtools(
      [
        entry('https://www.facebook.com/tr/?id=1&ev=PageView'),
        entry('https://example.com/app.js'),
        entry('https://www.facebook.com/tr/?id=1&ev=PageView'),
      ],
      () => probe(),
    );
    new DevtoolsSource(store, api).start();
    expect(store.session.requests.map((r) => r.url)).toEqual([
      'https://www.facebook.com/tr/?id=1&ev=PageView',
    ]);
    expect(store.session.navigations).toEqual([
      { time: Date.parse('2026-11-06T10:42:17.900Z'), url: 'https://example.com/' },
    ]);
  });

  it('reads POST bodies, response headers and the gtm.js body of live requests', () => {
    const store = new SessionStore();
    const { api, finished } = fakeDevtools([], () => probe());
    new DevtoolsSource(store, api).start();
    finished[0]!(
      entry('https://data.example.com/g/collect?v=2&tid=G-1', {
        request: {
          method: 'POST',
          url: 'https://data.example.com/g/collect?v=2&tid=G-1',
          postData: { text: 'en=page_view' },
        },
        response: { headers: [{ name: 'set-cookie', value: 'FPID=x; HttpOnly' }] },
      }),
    );
    finished[0]!(
      entry('https://www.googletagmanager.com/gtm.js?id=GTM-K7P2QX', {
        getContent: (cb) => cb('var data = {"resource": {"tags": []}}', ''),
      }),
    );
    expect(store.session.requests[0]).toMatchObject({ method: 'POST', body: 'en=page_view' });
    expect(store.session.requests[0]!.responseHeaders).toHaveLength(1);
    expect(store.session.gtmScripts).toEqual([
      { id: 'GTM-K7P2QX', body: 'var data = {"resource": {"tags": []}}' },
    ]);
  });

  it('timestamps dataLayer entries: recorded push time, else page start on the first look', () => {
    const first = toSnapshot(
      probe({ entries: [{ i: 0, t: 0, v: ['consent', 'default', {}] }], length: 1 }),
      true,
    );
    expect(first.dataLayer![0]!.time).toBe(Date.parse('2026-11-06T10:42:17.900Z'));
    const later = toSnapshot(probe({ entries: [{ i: 1, t: 0, v: { event: 'x' } }] }), false);
    expect(later.dataLayer![0]!.time).toBe(Date.parse('2026-11-06T10:42:19.000Z'));
    const timed = toSnapshot(probe({ entries: [{ i: 1, t: 123, v: { event: 'x' } }] }), false);
    expect(timed.dataLayer![0]!.time).toBe(123);
  });

  it('marks navigations, reloads with the dataLayer timer, and clears', () => {
    const store = new SessionStore();
    const { api, navigated, reloads } = fakeDevtools([], () => probe());
    const src = new DevtoolsSource(store, api);
    src.start();
    navigated[0]!('https://example.com/cart');
    expect(store.session.navigations.map((n) => n.url)).toEqual([
      'https://example.com/',
      'https://example.com/cart',
    ]);
    src.reload();
    expect(reloads).toEqual([{ injectedScript: expect.stringContaining('__hitlineTimes') }]);
    src.clear();
    expect(store.session.requests).toEqual([]);
    expect(store.session.navigations).toHaveLength(1);
  });

  it('reads a GTM container that loaded before the panel opened from the page resources', () => {
    const store = new SessionStore();
    const { api } = fakeDevtools([], () => probe({ gtm: ['GTM-AB12'] }), [
      {
        url: 'https://www.googletagmanager.com/gtm.js?id=GTM-AB12',
        content: 'var data = {"resource": {"tags": []}}',
      },
      { url: 'https://www.googletagmanager.com/ns.html?id=GTM-AB12', content: '<html></html>' },
    ]);
    new DevtoolsSource(store, api).start();
    expect(store.session.gtmScripts?.map((g) => g.id)).toEqual(['GTM-AB12']);
  });

  it('is ready after the HAR and the first page read, and flags a late open', () => {
    const store = new SessionStore();
    const { api } = fakeDevtools([], () => probe());
    expect(store.status.ready).toBe(false);
    new DevtoolsSource(store, api).start();
    expect(store.status.ready).toBe(true);
    expect(store.status.openedAfterLoad).toBe(true);
  });

  it('starts a new session for a typed address on another site, not for a link or own domain', () => {
    let clock = Date.parse('2026-11-06T10:43:00.000Z');
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => (clock += 1000));
    let page = probe();
    const store = new SessionStore();
    const { api, finished, navigated } = fakeDevtools([], () => page);
    const src = new DevtoolsSource(store, api, { ownDomains: () => ['pay.example.net'] });
    src.start();
    finished[0]!(entry('https://www.facebook.com/tr/?id=1&ev=PageView'));
    // A link from example.com to its payment page (own domain): same session.
    navigated[0]!('https://pay.example.net/checkout');
    page = probe({ href: 'https://pay.example.net/checkout', referrer: '' });
    src.poll();
    expect(store.session.requests).toHaveLength(1);
    // A link to another site, with example.com as referrer: same session.
    navigated[0]!('https://blog.other.org/post');
    page = probe({ href: 'https://blog.other.org/post', referrer: 'https://example.com/' });
    src.poll();
    expect(store.session.requests).toHaveLength(1);
    // A typed address (no referrer) on a new site: new session.
    navigated[0]!('https://news.site.az/');
    page = probe({ href: 'https://news.site.az/', referrer: '' });
    src.poll();
    expect(store.session.requests).toHaveLength(0);
    expect(store.session.navigations.map((n) => n.url)).toEqual(['https://news.site.az/']);
    spy.mockRestore();
  });

  it('pauses: nothing is recorded until it continues', () => {
    const store = new SessionStore();
    const { api, finished } = fakeDevtools([], () => probe());
    const src = new DevtoolsSource(store, api);
    src.start();
    src.setPaused(true);
    finished[0]!(entry('https://www.facebook.com/tr/?id=1&ev=Lead'));
    expect(store.session.requests).toHaveLength(0);
    src.setPaused(false);
    finished[0]!(entry('https://www.facebook.com/tr/?id=1&ev=Lead'));
    expect(store.session.requests).toHaveLength(1);
  });
});
