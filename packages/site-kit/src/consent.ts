/**
 * Consent banner for getlineapps.com. Site analytics (GTM) load only after "Accept".
 * With no GTM ID nothing loads and no banner is shown. Extensions never use this.
 */
export const CONSENT_KEY = 'line-consent';
export type ConsentChoice = 'granted' | 'denied';

export interface ConsentTexts {
  text: string;
  accept: string;
  reject: string;
  privacyLabel: string;
  privacyHref: string;
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/** Inline in <head> before anything else: Consent Mode v2 defaults, all denied. */
export function consentDefaultsScript(): string {
  return [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});",
  ].join('');
}

export function readConsent(storage: Pick<Storage, 'getItem'> | null): ConsentChoice | null {
  try {
    const v = storage?.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function writeConsent(storage: Pick<Storage, 'setItem'> | null, v: ConsentChoice) {
  try {
    storage?.setItem(CONSENT_KEY, v);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
}

function gtag(win: DataLayerWindow, ...args: unknown[]) {
  win.dataLayer = win.dataLayer ?? [];
  // GTM expects the arguments object shape, like the gtag() snippet.
  win.dataLayer.push(args);
}

export function loadGtm(id: string, doc: Document = document) {
  if (!/^GTM-[A-Z0-9]+$/.test(id)) throw new Error('Invalid GTM ID');
  if (doc.querySelector(`script[data-line-gtm="${id}"]`)) return;
  const win = doc.defaultView as DataLayerWindow;
  win.dataLayer = win.dataLayer ?? [];
  win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = doc.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  s.dataset.lineGtm = id;
  doc.head.appendChild(s);
}

function grant(id: string, doc: Document) {
  const win = doc.defaultView as DataLayerWindow;
  gtag(win, 'consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  });
  loadGtm(id, doc);
}

export interface ConsentOptions {
  gtmId?: string | null;
  texts: ConsentTexts;
  doc?: Document;
  storage?: Storage | null;
}

/** Shows the banner if needed. Returns the banner element, or null when none is shown. */
export function mountConsentBanner({
  gtmId,
  texts,
  doc = document,
  storage,
}: ConsentOptions): HTMLElement | null {
  if (!gtmId) return null;
  let store: Storage | null = null;
  try {
    store = storage === undefined ? (doc.defaultView?.localStorage ?? null) : storage;
  } catch {
    store = null;
  }
  const choice = readConsent(store);
  if (choice === 'granted') {
    grant(gtmId, doc);
    return null;
  }
  if (choice === 'denied') return null;

  const el = doc.createElement('section');
  el.className = 'line-consent';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', texts.privacyLabel);
  const p = doc.createElement('p');
  p.textContent = texts.text + ' ';
  const a = doc.createElement('a');
  a.href = texts.privacyHref;
  a.textContent = texts.privacyLabel;
  p.appendChild(a);
  const actions = doc.createElement('div');
  actions.className = 'line-consent-actions';
  const reject = doc.createElement('button');
  reject.type = 'button';
  reject.className = 'line-consent-reject';
  reject.textContent = texts.reject;
  const accept = doc.createElement('button');
  accept.type = 'button';
  accept.className = 'line-consent-accept';
  accept.textContent = texts.accept;
  actions.append(reject, accept);
  el.append(p, actions);

  reject.addEventListener('click', () => {
    writeConsent(store, 'denied');
    el.remove();
  });
  accept.addEventListener('click', () => {
    writeConsent(store, 'granted');
    grant(gtmId, doc);
    el.remove();
  });
  doc.body.appendChild(el);
  return el;
}
