/**
 * FAQ accordion shared by every landing and the hub: one answer open at a
 * time, opening and closing with a height animation. Without JavaScript the
 * native <details> still works (each item opens on its own).
 * While an item closes it carries the `closing` class, so its open styles
 * (ring, rotated plus) switch back at the start of the animation, not the end.
 */
const DURATION = 320;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const running = new WeakMap<HTMLDetailsElement, Animation>();

function summaryHeight(d: HTMLDetailsElement): number {
  const s = d.querySelector('summary');
  return s ? s.offsetHeight : 0;
}

function animateHeight(d: HTMLDetailsElement, from: number, to: number, done: () => void) {
  running.get(d)?.cancel();
  d.style.overflow = 'hidden';
  const anim = d.animate(
    { height: [`${from}px`, `${to}px`] },
    { duration: DURATION, easing: EASING },
  );
  running.set(d, anim);
  // `finished` rejects when a newer click cancels this animation: then the newer one owns the item.
  anim.finished.then(
    () => {
      running.delete(d);
      d.style.overflow = '';
      done();
    },
    () => {},
  );
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function openItem(d: HTMLDetailsElement) {
  const from = d.offsetHeight;
  d.classList.remove('closing');
  d.open = true;
  if (reducedMotion()) return;
  animateHeight(d, from, d.scrollHeight, () => {});
}

function closeItem(d: HTMLDetailsElement) {
  if (reducedMotion()) {
    d.open = false;
    return;
  }
  d.classList.add('closing');
  animateHeight(d, d.offsetHeight, summaryHeight(d), () => {
    d.open = false;
    d.classList.remove('closing');
  });
}

export function initFaq(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.faq').forEach((group) => {
    const items = Array.from(group.querySelectorAll<HTMLDetailsElement>(':scope > details'));
    items.forEach((d) => {
      d.querySelector('summary')?.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = d.open && !d.classList.contains('closing');
        if (isOpen) {
          closeItem(d);
          return;
        }
        items.forEach((o) => {
          if (o !== d && o.open && !o.classList.contains('closing')) closeItem(o);
        });
        openItem(d);
      });
    });
  });
}
