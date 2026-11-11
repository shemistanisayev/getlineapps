/** Host and registrable-domain helpers. Small built-in suffix list: no network, no big dependency. */

const TWO_PART_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'me.uk',
  'ltd.uk',
  'plc.uk',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'co.nz',
  'org.nz',
  'net.nz',
  'co.jp',
  'ne.jp',
  'or.jp',
  'ac.jp',
  'co.kr',
  'or.kr',
  'com.br',
  'net.br',
  'org.br',
  'com.mx',
  'com.ar',
  'com.co',
  'com.pe',
  'com.tr',
  'gen.tr',
  'org.tr',
  'com.az',
  'net.az',
  'org.az',
  'gov.az',
  'edu.az',
  'com.ua',
  'org.ua',
  'kiev.ua',
  'com.cn',
  'net.cn',
  'org.cn',
  'com.hk',
  'com.tw',
  'com.sg',
  'com.my',
  'co.in',
  'net.in',
  'org.in',
  'firm.in',
  'co.za',
  'org.za',
  'com.eg',
  'com.sa',
  'co.il',
  'com.pl',
  'com.ru',
  'co.id',
  'github.io',
  'netlify.app',
  'vercel.app',
  'pages.dev',
  'web.app',
  'myshopify.com',
  'herokuapp.com',
  'azurewebsites.net',
  'cloudfront.net',
  'appspot.com',
]);

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Registrable domain ("eTLD+1"): data.example.com -> example.com, shop.example.co.uk -> example.co.uk.
 * Local hosts for the fixture: x.shop.localhost -> shop.localhost, localhost -> localhost.
 */
export function registrableDomain(hostOrUrl: string): string {
  const host = hostOrUrl.includes('/') ? hostOf(hostOrUrl) : hostOrUrl.toLowerCase();
  if (!host) return '';
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) return host;
  const labels = host.replace(/\.$/, '').split('.');
  if (labels.length <= 2) return labels.join('.');
  const lastTwo = labels.slice(-2).join('.');
  const take = TWO_PART_SUFFIXES.has(lastTwo) ? 3 : 2;
  return labels.slice(-take).join('.');
}

/** True when `host` is `site` or one of its subdomains. */
export function isSameSite(host: string, site: string): boolean {
  return registrableDomain(host) === registrableDomain(site);
}

/** True when `host` is a strict subdomain of `site` (data.example.com of example.com). */
export function isSubdomainOf(host: string, site: string): boolean {
  const h = host.toLowerCase();
  const s = registrableDomain(site);
  return h !== s && h.endsWith(`.${s}`);
}

export function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/** Path without trailing slash. */
export function pathOf(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return '';
  }
}
