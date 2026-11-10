// Lumo shop runtime. Plays the scenarios from packages/core/fixtures/hitline/lumo.ts:
// dataLayer pushes and tracking requests, on load and on clicks. Fictional shop, fake ids.
// Vendor requests are only sent when the page runs on the design hosts (example.com etc.),
// which exist only in the browser started by the fixture scripts, where every vendor URL
// is answered locally. On plain localhost nothing is sent.

const DESIGN_HOSTS = ['example.com', 'data.example.com', 'pay.example.net'];
const FIRST_PARTY = /^https:\/\/(example\.com|data\.example\.com|pay\.example\.net)(?=\/|$)/;
const MAX_GAP = 120; // ms between steps; keeps the order, not the real pauses

const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toLocal = (url) => url.replace(FIRST_PARTY, `${location.protocol}//$1`);
const ms = (t) => {
  const [h, m, s] = t.split(':').map(Number);
  return (h * 3600 + m * 60 + s) * 1000;
};

window.dataLayer = window.dataLayer || [];

function cookie(name) {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`))
    ?.split('=')[1];
}

const params = new URLSearchParams(location.search);
const live = DESIGN_HOSTS.includes(location.hostname);

const { runs } = await (await fetch('/__lumo/scenarios.json')).json();
let runId = location.hostname.startsWith('pay.')
  ? 'journey'
  : params.get('run') || cookie('lumo_run') || 'journey';
if (params.get('run')) document.cookie = `lumo_run=${runId}; path=/`;
const run = runs[runId] ?? runs.journey;

const pageIndex = run.pages.findIndex((p) => {
  const u = new URL(p.url);
  return u.hostname === location.hostname && u.pathname === location.pathname;
});
const page = run.pages[pageIndex];
const next = run.pages[pageIndex + 1];

for (const [k, v] of Object.entries(page?.cookies ?? {})) document.cookie = `${k}=${v}; path=/`;
if (page) document.title = page.title;

let queue = Promise.resolve();
function play(trigger) {
  const steps = (page?.steps ?? []).filter((s) => s.on === trigger);
  queue = queue.then(async () => {
    let last = null;
    for (const step of steps) {
      if (last !== null) await sleep(Math.min(Math.max(ms(step.t) - last, 1), MAX_GAP));
      last = ms(step.t);
      if ('dl' in step) {
        window.dataLayer.push(step.dl);
      } else if (live) {
        send(step.req);
      }
    }
    document.body.dataset[trigger] = 'done';
  });
  return queue;
}

function send(req) {
  const url = toLocal(req.url);
  if (url.includes('googletagmanager.com/gtm.js')) {
    const id = new URL(url).searchParams.get('id');
    window.google_tag_manager = { [id]: { dataLayer: { name: 'dataLayer' } } };
    const s = document.createElement('script');
    s.src = url;
    document.head.append(s);
    return;
  }
  const firstParty = url !== req.url || FIRST_PARTY.test(req.url);
  void fetch(url, {
    method: req.method,
    body: req.body,
    mode: 'no-cors',
    keepalive: true,
    credentials: firstParty ? 'include' : 'omit',
  }).catch(() => {});
}

// Page content by kind.
const main = $('#main');
const path = location.pathname;
const nextHref = next ? toLocal(next.url) : null;
const nextLink = (label) =>
  nextHref ? `<a class="btn" id="next" href="${nextHref}">${label}</a>` : '';

if (location.hostname.startsWith('pay.')) {
  main.innerHTML = `<div class="card"><span class="eyebrow">Lumo Pay</span><h1>Pay $89.90</h1>
    <p class="desc">Card payment for your Lumo order. This is a test page: nothing is charged.</p>
    ${nextLink('Pay now')}</div>`;
} else if (path.startsWith('/campaign/')) {
  main.innerHTML = `<span class="eyebrow">Fall sale</span><h1>Up to 25% off audio</h1>
    <p class="desc">Noise cancelling headphones, speakers and more, this week only.</p>
    <div>${nextLink('Shop the sale')}</div>`;
} else if (path === '/cart') {
  main.innerHTML = `<h1>Your cart</h1><div class="card"><span>Wireless Headphones Pro X</span><b>$89.90</b>
    ${nextLink('Checkout')}</div>`;
} else if (path.startsWith('/order/')) {
  main.innerHTML = `<div class="card"><span class="eyebrow">Order LUMO-10482</span><h1>Thank you!</h1>
    <p class="desc">Your Wireless Headphones Pro X arrive tomorrow.</p></div>`;
} else {
  main.innerHTML = `<nav aria-label="Breadcrumb" class="crumb">Home / Electronics / Headphones / <span>Wireless Headphones Pro X</span></nav>
    <div class="product">
      <div class="gallery"><div class="hero-img"><svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#1D2420" stroke-width="1.2" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/></svg></div>
        <div class="thumbs"><div></div><div></div><div></div><div></div></div></div>
      <div class="info"><span class="eyebrow">Lumo Audio</span><h1>Wireless Headphones Pro X</h1>
        <div class="price"><b>$89.90</b><s>$119.90</s><i>-25%</i></div>
        <p class="desc">Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once.</p>
        <button type="button" class="btn" data-trigger="add">Add to cart</button>
        ${nextLink('Go to cart')}
        <div class="perks"><span>Next-day delivery</span><span>Free returns within 14 days</span></div></div>
    </div>`;
}

if (!live) {
  const note = $('#note');
  if (note)
    note.textContent =
      'Test mode is off: open this shop with "pnpm --filter @line/fixture open:hitline" to send the fake tracking requests.';
}

// Consent banner only in the "consent" run (the other runs are returning visitors who accepted).
if (runId === 'consent' && $('#banner')) $('#banner').hidden = false;

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-trigger]');
  if (!el) return;
  const trigger = el.dataset.trigger;
  if (trigger === 'accept' || trigger === 'reject') $('#banner').hidden = true;
  if (trigger === 'add') $('#cart-count').hidden = false;
  if (trigger === 'cart') $('#minicart').hidden = !$('#minicart').hidden;
  void play(trigger);
});
$('#newsletter')?.addEventListener('submit', (e) => {
  e.preventDefault();
  void play('signup');
});

await play('load');
