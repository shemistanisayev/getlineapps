/**
 * How a browser reaches the Rivaline fixture sites (docs/rivaline-SPEC.md §11, docs/rivaline/PLAN.md).
 * The design hosts (Kova on example.com, Glowbar on example.net, Mira Studio on example.org) are
 * mapped to the local server by host-resolver rules, so the panel reads exactly like the design.
 * The SPEC's kova.localhost, glow.localhost and mira.localhost reach the same pages.
 */
export const RIVALINE_PORT = Number(process.env.RIVALINE_FIXTURE_PORT ?? 4402);

export type SiteId = 'kova' | 'glow' | 'mira';

export const SITE_HOSTS: Record<SiteId, string[]> = {
  kova: ['example.com', 'kova.localhost'],
  glow: ['example.net', 'glow.localhost'],
  mira: ['example.org', 'mira.localhost'],
};

export function siteForHost(host: string): SiteId | null {
  for (const [id, hosts] of Object.entries(SITE_HOSTS) as [SiteId, string[]][]) {
    if (hosts.includes(host)) return id;
  }
  return host === 'localhost' || host === '127.0.0.1' ? 'kova' : null;
}

export function rivalineHostArgs(port = RIVALINE_PORT): string[] {
  const rules = ['example.com', 'example.net', 'example.org']
    .map((h) => `MAP ${h} 127.0.0.1:${port}`)
    .join(', ');
  return [`--host-resolver-rules=${rules}`];
}

export const kovaUrl = (path = '/') => `http://example.com${path}`;
export const glowUrl = (path = '/') => `http://example.net${path}`;
export const miraUrl = (path = '/') => `http://example.org${path}`;
