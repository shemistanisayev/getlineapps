import { describe, expect, it } from 'vitest';
import { classifyRequest } from './classify.ts';
import { buildConsent, decodeGcd, decodeGcs, hitConsentStatus, stateAt } from './consent.ts';
import { asCommand, serverContainerUrlFrom } from './datalayer.ts';
import { detectSgtm } from './sgtm.ts';

const D = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
};
const G = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
};

describe('consent mode v2', () => {
  it('decodes gcs and gcd', () => {
    expect(decodeGcs('G100')).toEqual({ ad_storage: 'denied', analytics_storage: 'denied' });
    expect(decodeGcs('G110')).toEqual({ ad_storage: 'granted', analytics_storage: 'denied' });
    expect(decodeGcs('bad')).toBeNull();
    expect(decodeGcd('13r3r3r3r5l1')!.ad_storage).toEqual({ value: 'granted', updated: true });
    expect(decodeGcd('13p3p3p3p5l1')!.analytics_storage).toEqual({
      value: 'denied',
      updated: false,
    });
    expect(decodeGcd('13q3q3q3q5l1')!.ad_personalization).toEqual({
      value: 'denied',
      updated: true,
    });
    expect(decodeGcd(undefined)).toBeNull();
  });

  it('normalizes Arguments-like objects', () => {
    expect(asCommand({ 0: 'consent', 1: 'update', 2: {} })).toEqual(['consent', 'update', {}]);
    expect(asCommand({ event: 'x' })).toBeNull();
  });

  it('finds defaults, the choice moment and the kind of choice', () => {
    const m = buildConsent([
      { time: 1, value: ['consent', 'default', { ...D, wait_for_update: 500 }] },
      { time: 9, value: ['consent', 'update', D] },
    ]);
    expect(m.active).toBe(true);
    expect(m.defaults.ad_storage).toBe('denied');
    expect(m.choice).toEqual({ kind: 'reject', time: 9 });
    expect(m.bannerFound).toBe(true);
    expect(buildConsent([{ time: 1, value: ['consent', 'update', G] }]).choice!.kind).toBe(
      'accept',
    );
    expect(
      buildConsent([
        { time: 1, value: ['consent', 'update', { ...D, analytics_storage: 'granted' }] },
      ]).choice!.kind,
    ).toBe('custom');
    expect(stateAt(m, 5).ad_storage).toBe('denied');
    expect(buildConsent([], ['Cookiebot']).bannerFound).toBe(true);
  });

  it('labels hits before and after the choice', () => {
    const m = buildConsent([
      { time: 1, value: ['consent', 'default', D] },
      { time: 9, value: ['consent', 'update', D] },
    ]);
    const meta = (time: number) =>
      classifyRequest({
        id: 'm',
        time,
        method: 'GET',
        url: 'https://www.facebook.com/tr/?id=1&ev=PageView',
      })[0]!;
    const ga = (gcs: string) =>
      classifyRequest({
        id: 'g',
        time: 10,
        method: 'GET',
        url: `https://www.google-analytics.com/g/collect?v=2&tid=G-1&en=x&gcs=${gcs}`,
      })[0]!;
    expect(hitConsentStatus(m, meta(5))).toBe('before_consent');
    expect(hitConsentStatus(m, meta(10))).toBe('after_reject');
    expect(hitConsentStatus(m, ga('G100'))).toBe('cookieless');
    expect(hitConsentStatus(m, ga('G111'))).toBe('mismatch');
    expect(hitConsentStatus(buildConsent([]), meta(5))).toBe('unknown');
  });
});

describe('server-side GTM', () => {
  const ga4 = (host: string) =>
    classifyRequest({
      id: 'a',
      time: 1,
      method: 'POST',
      url: `https://${host}/g/collect?v=2&tid=G-1&en=page_view`,
    });

  it('needs 2 of 4 signals', () => {
    expect(detectSgtm('example.com', ga4('www.google-analytics.com'), [], undefined).detected).toBe(
      false,
    );
    const s = detectSgtm('example.com', ga4('data.example.com'), [], undefined);
    expect(s.detected).toBe(true);
    expect(s.host).toBe('data.example.com');
    expect(s.signals.filter((x) => x.found).map((x) => x.id)).toEqual([
      'own_subdomain',
      'ga4_path',
    ]);
  });

  it('reads the FPID cookie lifetime and server_container_url', () => {
    const s = detectSgtm(
      'example.com',
      ga4('data.example.com'),
      [
        {
          id: 'a',
          time: 1,
          method: 'POST',
          url: 'https://data.example.com/g/collect',
          responseHeaders: [
            { name: 'Set-Cookie', value: 'FPID=x; Max-Age=34560000; HttpOnly; Secure' },
          ],
        },
      ],
      serverContainerUrlFrom([
        { time: 1, value: ['config', 'G-1', { server_container_url: 'https://data.example.com' }] },
      ]),
    );
    expect(s.signals.find((x) => x.id === 'fpid_cookie')).toMatchObject({ found: true, days: 400 });
    expect(s.signals.find((x) => x.id === 'server_container_url')!.evidence).toBe(
      'https://data.example.com',
    );
  });

  it('a first-party host on another domain still counts as GA4 path, not own subdomain', () => {
    const s = detectSgtm('example.com', ga4('sgtm.other.net'), [], 'https://sgtm.other.net');
    expect(s.signals.map((x) => x.found)).toEqual([false, true, true, false]);
  });
});
