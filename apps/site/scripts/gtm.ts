/**
 * Writes the GTM import file and the GA4 setup list for getlineapps.com from the event list in
 * @line/site-kit/analytics (docs/line-family-analytics.md):
 *   docs/analytics/gtm-container.json   GTM > Admin > Import container (merge, overwrite)
 *   docs/analytics/ga4-setup.json       custom dimensions and key events to create in GA4
 * Run: GA4_ID=G-XXXX GTM_ID=GTM-XXXX pnpm --filter @line/site gen:gtm  (outputs are committed)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVENTS, KEY_EVENTS, PAGE_PARAMS, PARAMS } from '@line/site-kit/analytics';
import { buildGtmContainer } from '@line/site-kit/gtm-container';

const ga4 = process.env.GA4_ID ?? '';
const gtm = process.env.GTM_ID ?? 'GTM-XXXXXXX';
const out = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../docs/analytics');
mkdirSync(out, { recursive: true });

writeFileSync(
  resolve(out, 'gtm-container.json'),
  JSON.stringify(buildGtmContainer(ga4, gtm), null, 2) + '\n',
);

const dims = [
  ...Object.entries(PAGE_PARAMS).map(([name, about]) => ({ name, about })),
  ...Object.entries(PARAMS)
    .filter(([, v]) => v.custom)
    .map(([name, v]) => ({ name, about: v.about })),
];
writeFileSync(
  resolve(out, 'ga4-setup.json'),
  JSON.stringify(
    {
      measurementId: ga4,
      gtmId: gtm,
      events: EVENTS,
      keyEvents: KEY_EVENTS,
      customDimensions: dims,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Wrote gtm-container.json and ga4-setup.json for ${ga4} / ${gtm}`);
