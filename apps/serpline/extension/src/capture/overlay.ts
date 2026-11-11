/**
 * "Highlight on page" (docs/serpline-SPEC.md §5, design/serpline/SitePage.dc.html, highlight on).
 * Everything lives in one host element with a closed shadow root; turning it off removes the host
 * and its listeners, so the page is left exactly as it was. No links in the overlay.
 * Both functions are self-contained: executeScript serializes them.
 */

export interface OverlayMark {
  /** CSS path from @line/core/serpline extract (same structure as the live DOM). */
  path: string;
  kind: 'heading' | 'image';
  /** Bold part of the label ("H1", "No alt"). */
  label: string;
  /** Lighter part after it ("added by JavaScript"), optional. */
  note?: string;
}

export interface OverlaySpec {
  marks: OverlayMark[];
  /** Text of the bottom pill ("Serpline highlights: 11 headings, 3 images"). */
  summary: string;
  hide: string;
  /** Message the "Hide" button sends to the side panel. */
  hiddenMessage: string;
}

export const OVERLAY_ATTR = 'data-serpline-overlay';

/** Draws the overlay; returns how many marks were found on the page. */
export function showOverlay(spec: OverlaySpec): number {
  const ATTR = 'data-serpline-overlay';
  const w = window as unknown as { __serplineOverlayOff?: () => void };
  w.__serplineOverlayOff?.();

  const host = document.createElement('div');
  host.setAttribute(ATTR, '');
  host.style.cssText =
    'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    .box{position:absolute;border-radius:4px;box-sizing:border-box;pointer-events:none}
    .h{outline:2px dashed #2563EB;outline-offset:4px}
    .i{outline:2px solid #D92D20;outline-offset:3px}
    .lab{position:absolute;left:-6px;top:-30px;height:20px;padding:0 7px;border-radius:6px;color:#FFFFFF;
      font:700 11px/20px Inter,Arial,sans-serif;white-space:nowrap;display:flex;gap:6px;align-items:center}
    .h .lab{background:#2563EB}.i .lab{background:#D92D20;left:-3px;top:-27px}
    .lab span{font-weight:500}
    .pill{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;
      height:44px;padding:0 8px 0 16px;border-radius:999px;background:#101828;color:#FFFFFF;pointer-events:auto;
      font:400 13px Inter,Arial,sans-serif;box-shadow:0 12px 28px -8px rgba(16,24,40,.45);white-space:nowrap}
    .pill i{width:18px;height:18px;border-radius:5px;background:#2563EB;display:flex;align-items:center;justify-content:center}
    .pill button{height:30px;padding:0 12px;border:none;border-radius:999px;background:#FFFFFF;color:#101828;
      font:600 12.5px Inter,Arial,sans-serif;cursor:pointer}
    .pill button:focus-visible{outline:2px solid #C6F36B;outline-offset:2px}
  </style>`;

  const items: { el: Element; box: HTMLElement }[] = [];
  for (const m of spec.marks) {
    let el: Element | null;
    try {
      el = document.querySelector(m.path);
    } catch {
      el = null;
    }
    if (!el) continue;
    const box = document.createElement('div');
    box.className = `box ${m.kind === 'heading' ? 'h' : 'i'}`;
    const lab = document.createElement('div');
    lab.className = 'lab';
    lab.textContent = m.label;
    if (m.note) {
      const s = document.createElement('span');
      s.textContent = m.note;
      lab.appendChild(s);
    }
    box.appendChild(lab);
    root.appendChild(box);
    items.push({ el, box });
  }

  const pill = document.createElement('div');
  pill.className = 'pill';
  pill.setAttribute('role', 'status');
  pill.innerHTML =
    '<i aria-hidden="true"><svg width="12" height="12" viewBox="0 0 48 48" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"><circle cx="21" cy="21" r="12"/><line x1="30" y1="30" x2="40" y2="40"/><line x1="15" y1="21" x2="27" y2="21"/></svg></i>';
  const text = document.createElement('span');
  text.textContent = spec.summary;
  const hide = document.createElement('button');
  hide.type = 'button';
  hide.textContent = spec.hide;
  pill.append(text, hide);
  root.appendChild(pill);

  const place = () => {
    for (const { el, box } of items) {
      const r = el.getBoundingClientRect();
      box.style.left = `${r.left + window.scrollX}px`;
      box.style.top = `${r.top + window.scrollY}px`;
      box.style.width = `${r.width}px`;
      box.style.height = `${r.height}px`;
    }
  };
  const off = () => {
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    host.remove();
    delete w.__serplineOverlayOff;
  };
  hide.addEventListener('click', () => {
    off();
    try {
      // Injected into the page (isolated world): the extension API is the global chrome object.
      const api = (
        globalThis as unknown as { chrome?: { runtime?: { sendMessage(m: unknown): unknown } } }
      ).chrome;
      void api?.runtime?.sendMessage({ type: spec.hiddenMessage });
    } catch {
      /* panel closed */
    }
  });
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
  w.__serplineOverlayOff = off;
  document.documentElement.appendChild(host);
  place();
  return items.length;
}

export function hideOverlay(): void {
  const w = window as unknown as { __serplineOverlayOff?: () => void };
  if (w.__serplineOverlayOff) w.__serplineOverlayOff();
  else document.querySelectorAll('[data-serpline-overlay]').forEach((n) => n.remove());
}
