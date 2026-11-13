/** Settings (design/rivaline/Settings.dc.html, docs/rivaline-SPEC.md §7). */
import { contactUrl, privacyUrl, toolUrl, type ToolSlug } from '@line/core/site';
import { Logo } from '@line/ui';
import { useEffect, useMemo, useState } from 'react';
import type { Lang, MessageKey, T } from '../../src/i18n/index.ts';
import {
  actionShortcut,
  clearSettings,
  getCountry,
  setCountry,
  setLang,
} from '../../src/storage.ts';
import { Keys } from '../../src/ui.tsx';
import { countryOptions } from './AdsTab.tsx';

const OTHERS: { slug: ToolSlug; name: string; what: MessageKey }[] = [
  { slug: 'hitline', name: 'Hitline', what: 'set.tool.hitline' },
  { slug: 'serpline', name: 'Serpline', what: 'set.tool.serpline' },
  { slug: 'foldline', name: 'Foldline', what: 'set.tool.foldline' },
  { slug: 'markline', name: 'Markline', what: 'set.tool.markline' },
];

export function Settings({ lang, t, onBack }: { lang: Lang; t: T; onBack: () => void }) {
  const [country, setCountryState] = useState('ALL');
  const [keys, setKeys] = useState<string[]>([]);
  const [cleared, setCleared] = useState(false);
  const options = useMemo(() => countryOptions(lang, t('ads.allCountries')), [lang, t]);

  const read = () => {
    void getCountry().then(setCountryState);
    void actionShortcut().then(setKeys);
  };
  useEffect(read, []);
  // The shortcut can change in chrome://extensions/shortcuts while Settings is open.
  useEffect(() => {
    const onFocus = () => void actionShortcut().then(setKeys);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const version = browser.runtime.getManifest().version;

  return (
    <div className="rp-set">
      <div className="rp-set-head">
        <button type="button" className="rv-ib" aria-label={t('set.back')} onClick={onBack}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <h1>{t('panel.settings')}</h1>
      </div>

      <div className="rp-set-body">
        <section className="rp-sec">
          <h2 className="eyebrow">{t('set.ads')}</h2>
          <div className="rp-line">
            <label htmlFor="rp-country">{t('set.country')}</label>
            <select
              id="rp-country"
              className="rp-select"
              value={country}
              onChange={(e) => {
                setCountryState(e.target.value);
                void setCountry(e.target.value);
              }}
            >
              {options.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <p className="rp-muted">{t('set.countryHint')}</p>
        </section>

        <section className="rp-sec">
          <div className="rp-line">
            <span className="rp-col3">
              <span>{t('set.shortcut')}</span>
              {keys.length ? (
                <Keys keys={keys} />
              ) : (
                <span className="rp-muted">{t('set.noShortcut')}</span>
              )}
            </span>
            <button
              type="button"
              className="rv-btn rv-btn--secondary"
              onClick={() => void browser.tabs.create({ url: 'chrome://extensions/shortcuts' })}
            >
              {t('set.change')}
            </button>
          </div>
          <div className="rp-line">
            <label htmlFor="rp-lang">{t('set.language')}</label>
            <select
              id="rp-lang"
              className="rp-select"
              value={lang}
              onChange={(e) => void setLang(e.target.value === 'az' ? 'az' : 'en')}
            >
              <option value="en">English</option>
              <option value="az">Azərbaycan</option>
            </select>
          </div>
          <div className="rp-line">
            <span>{t('set.data')}</span>
            <button
              type="button"
              className="rv-btn rv-btn--secondary"
              onClick={async () => {
                await clearSettings();
                setCleared(true);
                read();
              }}
            >
              {t('set.clear')}
            </button>
          </div>
          {cleared && (
            <p className="rp-muted rp-ok" role="status">
              {t('set.cleared')}
            </p>
          )}
          <p className="rp-muted">{t('set.privacyNote')}</p>
        </section>

        <section className="rp-sec rp-tools">
          <h2 className="eyebrow">{t('set.more')}</h2>
          {OTHERS.map((o) => (
            <a
              key={o.slug}
              className="rp-tool"
              href={toolUrl(o.slug, '', {
                source: 'rivaline',
                medium: 'extension',
                campaign: 'more_tools',
              })}
              target="_blank"
              rel="noopener"
            >
              <Logo brand={o.slug} theme="light" size={26} word={false} label="" />
              <b>{o.name}</b>
              <span className="rp-tool-x">{t(o.what)}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          ))}
        </section>
      </div>

      <footer className="rp-set-foot">
        <span>{t('set.version', { v: version })}</span>
        <span className="rp-set-links">
          <a href={privacyUrl('rivaline')} target="_blank" rel="noopener">
            {t('set.privacy')}
          </a>
          <a
            href={contactUrl({ source: 'rivaline', medium: 'extension', campaign: 'settings' })}
            target="_blank"
            rel="noopener"
          >
            {t('set.contact')}
          </a>
        </span>
      </footer>
    </div>
  );
}
