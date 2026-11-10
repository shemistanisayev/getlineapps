/**
 * Hub interactions: the role filter on the tool cards and the "one page, five questions" pins.
 * The page works without it: all cards show and the first check point is open.
 */
export function initHub(doc: Document) {
  // Role filter: dim the cards that do not fit the chosen role.
  const box = doc.querySelector<HTMLElement>('[data-roles-box]');
  if (box) {
    const buttons = [...box.querySelectorAll<HTMLButtonElement>('button[data-role]')];
    const hint = box.querySelector<HTMLElement>('[data-hint-text]');
    const cards = [...doc.querySelectorAll<HTMLElement>('.tc[data-tool]')];
    const pick = (btn: HTMLButtonElement) => {
      const fit = new Set((btn.dataset.tools ?? '').split(' '));
      for (const b of buttons) b.setAttribute('aria-pressed', String(b === btn));
      for (const c of cards) c.classList.toggle('dim', !fit.has(c.dataset.tool ?? ''));
      if (hint) hint.textContent = btn.dataset.hint ?? '';
    };
    for (const b of buttons) b.addEventListener('click', () => pick(b));
  }

  // Check points: pins on the example page and the numbered tabs show the same panel.
  const spots = doc.querySelector<HTMLElement>('[data-spots]');
  if (spots) {
    const triggers = [...spots.querySelectorAll<HTMLButtonElement>('button[data-spot]')];
    const panels = [...spots.querySelectorAll<HTMLElement>('[data-panel]')];
    const zones = [...spots.querySelectorAll<HTMLElement>('[data-z]')];
    const show = (slug: string) => {
      for (const t of triggers) t.setAttribute('aria-pressed', String(t.dataset.spot === slug));
      for (const p of panels) p.hidden = p.dataset.panel !== slug;
      for (const z of zones) z.classList.toggle('on', z.dataset.z === slug);
    };
    for (const t of triggers) t.addEventListener('click', () => show(t.dataset.spot ?? ''));
  }
}
