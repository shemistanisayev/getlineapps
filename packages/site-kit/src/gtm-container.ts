/**
 * The getlineapps.com GTM web container, built from the event list in analytics.ts, so the
 * container can never drift from the site code. `pnpm --filter @line/site gen:gtm` writes the
 * import file (docs/analytics/gtm-container.json): GTM > Admin > Import container.
 *
 * Contents: one Google tag (GA4, page_view with page_type, page_locale, page_tool),
 * one GA4 event tag that forwards every event in EVENTS with all its parameters,
 * one custom-event trigger and one Data Layer Variable per parameter.
 */
import { EVENTS, PAGE_PARAMS, PARAMS } from './analytics.ts';

const t = (key: string, value: string) => ({ type: 'TEMPLATE', key, value });
const row = (name: string, value: string) => ({
  type: 'MAP',
  map: [t('parameter', name), t('parameterValue', value)],
});
const dlvName = (p: string) => `DLV - ${p}`;

export const GA4_ID_VARIABLE = 'Const - GA4 Measurement ID';
export const EVENT_TRIGGER = 'CE - Line events';

export function eventRegex(): string {
  return `^(${Object.keys(EVENTS).join('|')})$`;
}

export function buildGtmContainer(measurementId: string, publicId = 'GTM-XXXXXXX') {
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) throw new Error('Invalid GA4 measurement ID');
  const ids = { account: '0', container: '0' };
  const base = { accountId: ids.account, containerId: ids.container };
  const fp = String(Date.now());

  const params = [...Object.keys(PAGE_PARAMS), ...Object.keys(PARAMS)];
  let vid = 10;
  const variable = [
    {
      ...base,
      variableId: String(vid++),
      name: GA4_ID_VARIABLE,
      type: 'c',
      parameter: [t('value', measurementId)],
      fingerprint: fp,
    },
    ...params.map((p) => ({
      ...base,
      variableId: String(vid++),
      name: dlvName(p),
      type: 'v',
      parameter: [
        { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
        { type: 'BOOLEAN', key: 'setDefaultValue', value: 'false' },
        t('name', p),
      ],
      fingerprint: fp,
    })),
  ];

  const trigger = [
    {
      ...base,
      triggerId: '5',
      name: EVENT_TRIGGER,
      type: 'CUSTOM_EVENT',
      customEventFilter: [
        {
          type: 'MATCH_REGEX',
          parameter: [t('arg0', '{{_event}}'), t('arg1', eventRegex())],
        },
      ],
      fingerprint: fp,
    },
  ];

  const ALL_PAGES = '2147479553';
  const tag = [
    {
      ...base,
      tagId: '1',
      name: 'GA4 - Google tag',
      type: 'googtag',
      parameter: [
        t('tagId', `{{${GA4_ID_VARIABLE}}}`),
        {
          type: 'LIST',
          key: 'configSettingsTable',
          list: [row('send_page_view', 'true')],
        },
        {
          type: 'LIST',
          key: 'eventSettingsTable',
          list: Object.keys(PAGE_PARAMS).map((p) => row(p, `{{${dlvName(p)}}}`)),
        },
      ],
      firingTriggerId: [ALL_PAGES],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: { type: 'MAP' },
      consentSettings: { consentStatus: 'NOT_SET' },
      fingerprint: fp,
    },
    {
      ...base,
      tagId: '2',
      name: 'GA4 - Line events',
      type: 'gaawe',
      parameter: [
        { type: 'BOOLEAN', key: 'sendEcommerceData', value: 'false' },
        t('eventName', '{{Event}}'),
        t('measurementIdOverride', `{{${GA4_ID_VARIABLE}}}`),
        {
          type: 'LIST',
          key: 'eventSettingsTable',
          list: params.map((p) => row(p, `{{${dlvName(p)}}}`)),
        },
      ],
      firingTriggerId: ['5'],
      tagFiringOption: 'ONCE_PER_EVENT',
      monitoringMetadata: { type: 'MAP' },
      consentSettings: { consentStatus: 'NOT_SET' },
      fingerprint: fp,
    },
  ];

  const builtInVariable = Object.entries({
    PAGE_URL: 'Page URL',
    PAGE_HOSTNAME: 'Page Hostname',
    PAGE_PATH: 'Page Path',
    REFERRER: 'Referrer',
    EVENT: 'Event',
  }).map(([type, name]) => ({ ...base, type, name }));

  return {
    exportFormatVersion: 2,
    exportTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    containerVersion: {
      path: `accounts/${ids.account}/containers/${ids.container}/versions/0`,
      ...base,
      containerVersionId: '0',
      container: {
        path: `accounts/${ids.account}/containers/${ids.container}`,
        ...base,
        name: 'getlineapps.com',
        publicId,
        usageContext: ['WEB'],
        fingerprint: fp,
        tagManagerUrl: '',
        features: {},
        tagIds: [publicId],
      },
      tag,
      trigger,
      variable,
      builtInVariable,
      fingerprint: fp,
    },
  };
}
