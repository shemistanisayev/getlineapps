// @vitest-environment happy-dom
// @vitest-environment-options {"settings":{"disableJavaScriptFileLoading":true,"handleDisabledFileLoadingAsSuccess":true}}
import { beforeEach, describe, expect, it } from 'vitest';
import { CONSENT_KEY, consentDefaultsScript, mountConsentBanner, readConsent } from './consent.ts';

const texts = {
  text: 'We use analytics only if you allow it.',
  accept: 'Accept',
  reject: 'Reject',
  privacyLabel: 'Privacy policy',
  privacyHref: '/privacy/hitline',
};

const gtmScripts = () => document.querySelectorAll('script[data-line-gtm]');

describe('consent banner', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();
    (window as { dataLayer?: unknown[] }).dataLayer = [];
  });

  it('shows nothing and loads nothing without a GTM ID', () => {
    expect(mountConsentBanner({ gtmId: '', texts })).toBeNull();
    expect(document.querySelector('.line-consent')).toBeNull();
    expect(gtmScripts()).toHaveLength(0);
  });

  it('does not load GTM before a choice', () => {
    const el = mountConsentBanner({ gtmId: 'GTM-ABC123', texts });
    expect(el).not.toBeNull();
    expect(gtmScripts()).toHaveLength(0);
    expect(el!.querySelector('a')!.getAttribute('href')).toBe('/privacy/hitline');
  });

  it('loads GTM after Accept and remembers it', () => {
    const el = mountConsentBanner({ gtmId: 'GTM-ABC123', texts })!;
    (el.querySelector('.line-consent-accept') as HTMLButtonElement).click();
    expect(gtmScripts()).toHaveLength(1);
    expect(readConsent(localStorage)).toBe('granted');
    expect(document.querySelector('.line-consent')).toBeNull();
    // Next page view: no banner, GTM loads straight away (once).
    document.head.innerHTML = '';
    expect(mountConsentBanner({ gtmId: 'GTM-ABC123', texts })).toBeNull();
    expect(gtmScripts()).toHaveLength(1);
  });

  it('never loads GTM after Reject', () => {
    const el = mountConsentBanner({ gtmId: 'GTM-ABC123', texts })!;
    (el.querySelector('.line-consent-reject') as HTMLButtonElement).click();
    expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
    expect(mountConsentBanner({ gtmId: 'GTM-ABC123', texts })).toBeNull();
    expect(gtmScripts()).toHaveLength(0);
  });

  it('shows the banner again from Cookie settings, once', () => {
    const el = mountConsentBanner({ gtmId: 'GTM-ABC123', texts })!;
    (el.querySelector('.line-consent-reject') as HTMLButtonElement).click();
    expect(mountConsentBanner({ gtmId: 'GTM-ABC123', texts, force: true })).not.toBeNull();
    mountConsentBanner({ gtmId: 'GTM-ABC123', texts, force: true });
    expect(document.querySelectorAll('.line-consent')).toHaveLength(1);
    (document.querySelector('.line-consent-accept') as HTMLButtonElement).click();
    expect(readConsent(localStorage)).toBe('granted');
    expect(gtmScripts()).toHaveLength(1);
  });

  it('defaults Consent Mode v2 to denied', () => {
    const s = consentDefaultsScript();
    for (const k of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']) {
      expect(s).toContain(`${k}:'denied'`);
    }
  });
});
