/**
 * #preview on /serpline: the free Google result preview (docs/serpline-SPEC.md §4.3, §11).
 * Same Arial measurement and truncation as the extension (@line/core/serpline/serp).
 * Runs only in this page: nothing is sent or stored.
 */
import {
  DESC_LIMIT,
  TITLE_LIMIT,
  fitDescription,
  fitTitle,
  siteName,
  urlLine,
  type Device,
  type Fit,
} from '@line/core/serpline/serp';

interface Texts {
  measure: string;
  fits: string;
  cut: string;
  addTitle: string;
  addDesc: string;
  emptyTitle: string;
  emptyDesc: string;
}

const ICON_OK = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
const ICON_ALERT = '<path d="M12 6v8"/><path d="M12 18.5h.01"/>';

const fillIn = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** "https://example.com/a" or "example.com/a" both work; anything else shows as typed. */
function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return 'https://example.com/';
  return /^[a-z][\w+.-]*:\/\//i.test(v) ? v : `https://${v}`;
}

export function mountSerpPreview(root: HTMLElement): void {
  const texts = JSON.parse(root.dataset.texts ?? '{}') as Texts;
  const $ = <T extends HTMLElement>(k: string) => root.querySelector<T>(`[data-sp="${k}"]`)!;
  const title = $<HTMLInputElement>('title');
  const desc = $<HTMLTextAreaElement>('desc');
  const url = $<HTMLInputElement>('url');
  const result = $('result');
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-device]'));
  let device: Device = 'desktop';

  const status = (el: HTMLElement, fit: Fit | null, empty: string) => {
    const bad = !fit || fit.cut;
    el.className = `mstat ${bad ? 'is-bad' : 'is-ok'}`;
    const svg = el.querySelector('svg')!;
    svg.innerHTML = bad ? ICON_ALERT : ICON_OK;
    el.querySelector('span')!.textContent = !fit
      ? empty
      : fit.cut
        ? fillIn(texts.cut, { n: fit.cutAfter })
        : texts.fits;
  };
  const meter = (bar: HTMLElement, fit: Fit | null, limit: number) => {
    bar.style.width = `${fit ? Math.min(100, Math.round((fit.px / limit) * 100)) : 0}%`;
    bar.className = !fit || fit.cut ? 'is-bad' : 'is-ok';
  };

  const render = () => {
    const tv = title.value;
    const dv = desc.value;
    const t = tv.trim() ? fitTitle(tv) : null;
    const d = dv.trim() ? fitDescription(dv, device) : null;
    const limit = DESC_LIMIT[device];

    $('t-measure').textContent = fillIn(texts.measure, {
      chars: tv.length,
      px: t?.px ?? 0,
      limit: TITLE_LIMIT,
    });
    $('d-measure').textContent = fillIn(texts.measure, {
      chars: dv.length,
      px: d?.px ?? 0,
      limit,
    });
    meter($('t-bar'), t, TITLE_LIMIT);
    meter($('d-bar'), d, limit);
    status($('t-status'), t, texts.addTitle);
    status($('d-status'), d, texts.addDesc);

    const u = normalizeUrl(url.value);
    const site = siteName(u);
    $('site').textContent = site;
    $('initial').textContent = site.charAt(0);
    $('crumb').textContent = urlLine(u);
    $('t-shown').textContent = t ? t.shown : texts.emptyTitle;
    $('d-shown').textContent = d ? d.shown : texts.emptyDesc;
    result.className = `gres r-mob gres--${device}`;
  };

  for (const el of [title, desc, url]) el.addEventListener('input', render);
  for (const b of buttons) {
    b.addEventListener('click', () => {
      device = b.dataset.device === 'mobile' ? 'mobile' : 'desktop';
      for (const x of buttons) {
        const on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', String(on));
      }
      render();
    });
  }
  render();
}
