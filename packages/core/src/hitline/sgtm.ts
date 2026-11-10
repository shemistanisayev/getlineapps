/** Server-side GTM signals (docs/hitline-SPEC.md §4.2). Detected when at least 2 of 4 are true. */
import { isSubdomainOf } from './domain.ts';
import type { Hit, Platform, RawRequest } from './types.ts';

export type SgtmSignalId = 'own_subdomain' | 'ga4_path' | 'server_container_url' | 'fpid_cookie';

export interface SgtmSignal {
  id: SgtmSignalId;
  found: boolean;
  /** Host, URL or cookie detail that proves it. */
  evidence?: string;
  /** FPID lifetime in days, when the cookie has Max-Age or Expires. */
  days?: number;
}

export interface SgtmResult {
  detected: boolean;
  /** The server-side host GA4 goes through. */
  host?: string;
  signals: SgtmSignal[];
  /** Platforms seen going through a server-side host. */
  serverPlatforms: Platform[];
  /** Ad pixels that still send from the browser while sGTM is detected. */
  browserPlatforms: Platform[];
}

function fpidFrom(requests: RawRequest[], hosts: Set<string>, now: number): SgtmSignal {
  for (const r of requests) {
    let host: string;
    try {
      host = new URL(r.url).hostname;
    } catch {
      continue;
    }
    if (!hosts.has(host)) continue;
    for (const h of r.responseHeaders ?? []) {
      if (h.name.toLowerCase() !== 'set-cookie') continue;
      for (const line of h.value.split('\n')) {
        if (!/^\s*FPID=/.test(line) || !/;\s*HttpOnly/i.test(line)) continue;
        const maxAge = /;\s*Max-Age=(\d+)/i.exec(line);
        const expires = /;\s*Expires=([^;]+)/i.exec(line);
        let days: number | undefined;
        if (maxAge) days = Math.round(Number(maxAge[1]) / 86400);
        else if (expires) days = Math.round((Date.parse(expires[1]!) - (r.time || now)) / 86400000);
        return { id: 'fpid_cookie', found: true, evidence: host, days };
      }
    }
  }
  return { id: 'fpid_cookie', found: false };
}

export function detectSgtm(
  site: string,
  hits: Hit[],
  requests: RawRequest[],
  serverContainerUrl: string | undefined,
  now = Date.now(),
): SgtmResult {
  const ga4Server = hits.filter((h) => h.platform === 'ga4' && h.route === 'sgtm');
  const own = ga4Server.find((h) => isSubdomainOf(h.host, site));
  const host = (own ?? ga4Server[0])?.host;
  const hosts = new Set(ga4Server.map((h) => h.host));
  const signals: SgtmSignal[] = [
    { id: 'own_subdomain', found: Boolean(own), evidence: own?.host },
    {
      id: 'ga4_path',
      found: ga4Server.length > 0,
      evidence: ga4Server[0] ? '/g/collect' : undefined,
    },
    {
      id: 'server_container_url',
      found: Boolean(serverContainerUrl),
      evidence: serverContainerUrl,
    },
    fpidFrom(requests, hosts, now),
  ];
  const detected = signals.filter((s) => s.found).length >= 2;
  const serverPlatforms = [
    ...new Set(
      hits.filter((h) => h.route === 'sgtm' && h.platform !== 'gtm').map((h) => h.platform),
    ),
  ];
  const browserPlatforms = detected
    ? (['meta', 'tiktok'] as Platform[]).filter((p) =>
        hits.some((h) => h.platform === p && h.route === 'browser'),
      )
    : [];
  return { detected, host, signals, serverPlatforms, browserPlatforms };
}
