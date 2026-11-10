/**
 * How a browser reaches the Lumo fixture with the design's host names (docs/hitline/PLAN.md, decision 2).
 * Chromium maps example.com, data.example.com and pay.example.net to the local server; vendor
 * URLs (Meta, TikTok, Google Ads, GTM, Hotjar) are answered locally, so nothing leaves the machine.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FIXTURE_PORT = Number(process.env.LUMO_PORT ?? 4400);
export const FIXTURE_HOSTS = ['example.com', 'data.example.com', 'pay.example.net'];

export function hostResolverArgs(port = FIXTURE_PORT): string[] {
  const rules = FIXTURE_HOSTS.map((h) => `MAP ${h} 127.0.0.1:${port}`).join(', ');
  return [`--host-resolver-rules=${rules}`];
}

export const shopUrl = (path = '/products/wireless-headphones-pro-x') =>
  `http://example.com${path}`;

/** URL patterns of every vendor the shop calls. Fulfil them all; let none reach the network. */
export const VENDOR_PATTERNS = [
  /^https:\/\/www\.facebook\.com\//,
  /^https:\/\/analytics\.tiktok\.com\//,
  /^https:\/\/www\.googleadservices\.com\//,
  /^https:\/\/www\.googletagmanager\.com\//,
  /^https:\/\/static\.hotjar\.com\//,
  /^https:\/\/region1\.google-analytics\.com\//,
];

const gtmBody = readFileSync(
  fileURLToPath(new URL('../../packages/core/fixtures/hitline/gtm-K7P2QX.js', import.meta.url)),
  'utf8',
);

/** Response for a vendor URL: the fake GTM container for gtm.js, else an empty 204. */
export function vendorResponse(url: string): {
  status: number;
  contentType?: string;
  body?: string;
} {
  if (url.startsWith('https://www.googletagmanager.com/gtm.js')) {
    return { status: 200, contentType: 'application/javascript', body: gtmBody };
  }
  return { status: 204 };
}

/** Minimal Playwright-like route API so scripts and tests share one setup. */
export interface RoutableContext {
  route(
    url: RegExp,
    handler: (route: {
      request(): { url(): string };
      fulfill(r: { status: number; contentType?: string; body?: string }): Promise<void>;
    }) => Promise<void>,
  ): Promise<unknown>;
}

export async function routeVendors(context: RoutableContext): Promise<void> {
  for (const pattern of VENDOR_PATTERNS) {
    await context.route(pattern, (route) => route.fulfill(vendorResponse(route.request().url())));
  }
}
