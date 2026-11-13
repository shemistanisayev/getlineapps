/**
 * Ad library finder on /rivaline#finder (docs/rivaline-SPEC.md §9). Vanilla island: results
 * update while typing, links open in a new tab. It uses the extension's own URL builders from
 * @line/core/rivaline/ads and sends nothing anywhere.
 */
import {
  googleLibraryUrl,
  linkedinLibraryUrl,
  metaLibraryUrl,
  parseFinderQuery,
  tiktokLibraryUrl,
} from '@line/core/rivaline/ads';

interface Texts {
  brand: string;
  typeAbove: string;
  searchesBrand: string;
  searchesDomain: string;
  needsDomain: string;
  typeBrand: string;
}

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

/** What each card shows for the current input. */
export function finderLinks(input: string, t: Texts) {
  const { brand, domain } = parseFinderQuery(input);
  const byBrand = brand ? fill(t.searchesBrand, { q: brand }) : t.typeBrand;
  return {
    brand: fill(t.brand, { brand: brand || t.typeAbove }),
    libs: {
      meta: { href: metaLibraryUrl(brand), by: byBrand },
      google: domain
        ? { href: googleLibraryUrl(domain), by: fill(t.searchesDomain, { q: domain }) }
        : { href: 'https://adstransparency.google.com/?region=anywhere', by: t.needsDomain },
      tiktok: { href: tiktokLibraryUrl(brand), by: byBrand },
      linkedin: { href: linkedinLibraryUrl(brand), by: byBrand },
    } as Record<string, { href: string; by: string }>,
  };
}

export function mountAdFinder(root: HTMLElement): void {
  const texts = JSON.parse(root.dataset.texts ?? '{}') as Texts;
  const input = root.querySelector<HTMLInputElement>('[data-finder-input]');
  const brand = root.querySelector<HTMLElement>('[data-finder-brand]');
  if (!input || !brand) return;
  const update = () => {
    const r = finderLinks(input.value, texts);
    brand.textContent = r.brand;
    root.querySelectorAll<HTMLAnchorElement>('[data-lib]').forEach((a) => {
      const lib = r.libs[a.dataset.lib ?? ''];
      if (!lib) return;
      a.href = lib.href;
      const by = a.querySelector('[data-by]');
      if (by) by.textContent = lib.by;
    });
  };
  input.addEventListener('input', update);
  update();
}
