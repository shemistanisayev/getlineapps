/** Settings (design/serpline/Settings.dc.html, docs/serpline-SPEC.md §7). */
import { contactUrl, privacyUrl, toolUrl, type ToolSlug } from '@line/core/site';
import { Logo } from '@line/ui';
import { Segmented, Switch } from '@line/ui/serpline';
import { useEffect, useState } from 'react';
import type { Lang, MessageKey, T } from '../../src/i18n/index.ts';
import {
  clearSettings,
  getAutoCheckLinks,
  getPreviewDevice,
  setAutoCheckLinks,
  setLang,
  setPreviewDevice,
  type PreviewDevice,
} from '../../src/storage.ts';

const OTHERS: { slug: ToolSlug; name: string; what: MessageKey }[] = [
  { slug: 'hitline', name: 'Hitline', what: 'set.tool.hitline' },
  { slug: 'rivaline', name: 'Rivaline', what: 'set.tool.rivaline' },
  { slug: 'foldline', name: 'Foldline', what: 'set.tool.foldline' },
  { slug: 'markline', name: 'Markline', what: 'set.tool.markline' },
];

export function Settings({
  lang,
  t,
  onBack,
  onDevice,
}: {
  lang: Lang;
  t: T;
  onBack: () => void;
  /** The Summary preview follows the new default at once. */
  onDevice: (d: PreviewDevice) => void;
}) {
  const [device, setDevice] = useState<PreviewDevice>('mobile');
  const [autoLinks, setAutoLinks] = useState(false);
  const [cleared, setCleared] = useState(false);

  const read = () => {
    void getPreviewDevice().then(setDevice);
    void getAutoCheckLinks().then(setAutoLinks);
  };
  useEffect(read, []);

  const version = browser.runtime.getManifest().version;

  return (
    <div className="sp-set">
      <div className="sp-set-head">
        <button type="button" className="sp-back" aria-label={t('set.back')} onClick={onBack}>
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

      <div className="sp-set-body">
        <section className="sp-sec">
          <h2 className="sl-eyebrow">{t('set.checks')}</h2>
          <div className="sp-line">
            <span>{t('set.previewOn')}</span>
            <Segmented
              label={t('set.previewDevice')}
              value={device}
              onChange={(d) => {
                setDevice(d);
                onDevice(d);
                void setPreviewDevice(d);
              }}
              options={[
                { value: 'mobile', label: t('serp.mobile') },
                { value: 'desktop', label: t('serp.desktop') },
              ]}
            />
          </div>
          <div className="sp-line">
            <label htmlFor="sp-auto-links">{t('set.autoLinks')}</label>
            <Switch
              id="sp-auto-links"
              checked={autoLinks}
              label={t('set.autoLinks')}
              onChange={(on) => {
                setAutoLinks(on);
                void setAutoCheckLinks(on);
              }}
            />
          </div>
          <p className="sp-hint">{t('set.autoLinksHint')}</p>
        </section>

        <section className="sp-sec">
          <div className="sp-line">
            <label htmlFor="sp-lang">{t('set.language')}</label>
            <select
              id="sp-lang"
              className="sp-select"
              value={lang}
              onChange={(e) => void setLang(e.target.value === 'az' ? 'az' : 'en')}
            >
              <option value="en">English</option>
              <option value="az">Azərbaycan</option>
            </select>
          </div>
          <div className="sp-line">
            <span>{t('set.data')}</span>
            <button
              type="button"
              className="sp-btn-s"
              onClick={async () => {
                await clearSettings();
                setCleared(true);
                read();
                onDevice('mobile');
              }}
            >
              {t('set.clear')}
            </button>
          </div>
          {cleared && (
            <p className="sp-hint sp-ok" role="status">
              {t('set.cleared')}
            </p>
          )}
          <p className="sp-hint">{t('set.privacyNote')}</p>
        </section>

        <section className="sp-sec sp-tools">
          <h2 className="sl-eyebrow">{t('set.more')}</h2>
          {OTHERS.map((o) => (
            <a
              key={o.slug}
              className="sp-tool"
              href={toolUrl(o.slug, '', {
                source: 'serpline',
                medium: 'extension',
                campaign: 'more_tools',
              })}
              target="_blank"
              rel="noopener"
            >
              <Logo brand={o.slug} theme="light" size={24} word={false} label="" />
              <b>{o.name}</b>
              <span className="sp-tool-x">{t(o.what)}</span>
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

      <footer className="sp-set-foot">
        <span>{t('set.version', { v: version })}</span>
        <span className="sp-set-links">
          <a href={privacyUrl('serpline')} target="_blank" rel="noopener">
            {t('set.privacy')}
          </a>
          <a
            href={contactUrl({ source: 'serpline', medium: 'extension', campaign: 'settings' })}
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
