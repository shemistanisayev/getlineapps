import { Logo } from '@line/ui';
import { analyzePopup, type Issue, type Platform, type PopupSummary } from '@line/core/hitline';
import { contactUrl } from '@line/core/site';
import { useEffect, useMemo, useState } from 'react';
import { downloadReport } from '../../src/pdf.ts';
import { loadProbe, type ProbeState } from '../../src/popup/probe.ts';
import { hitlineSummaryReport } from '../../src/report.ts';
import type { Lang, T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import { Icon, Pill, PlatformBadge, PLATFORM_NAME } from '../../src/ui.tsx';
import { Settings } from './Settings.tsx';

const CTA = contactUrl({ source: 'hitline', medium: 'extension', campaign: 'panel_cta' });
const MAX_TILES = 4;
const MAX_ISSUES = 3;

/** Tile names in the popup (design/hitline/Main.dc.html). */
const TILE_NAME: Partial<Record<Platform, string>> = { meta: 'Meta Pixel', tiktok: 'TikTok Pixel' };

function issueTitle(i: Issue, t: T): string {
  const p = i.data.platform as Platform;
  const vars = { platform: TILE_NAME[p] ?? PLATFORM_NAME[p], event: String(i.data.event ?? '') };
  if (i.id === 'VALUE_MISSING')
    return t('popup.issue.value', { ...vars, platform: PLATFORM_NAME[p] });
  if (i.id === 'CONSENT_BEFORE') return t('popup.issue.before', vars);
  return t('popup.issue.after', vars);
}

function Header({ onSettings, t }: { onSettings: () => void; t: T }) {
  return (
    <header className="popup-head">
      <Logo brand="hitline" theme="light" size={28} word />
      <button
        type="button"
        className="icon-btn"
        aria-label={t('popup.settings')}
        onClick={onSettings}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#344054"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
    </header>
  );
}

function F12({ t }: { t: T }) {
  return (
    <span className="f12">
      {t('popup.f12.before')} <kbd className="mono">F12</kbd>
      {t('popup.f12.after')}
    </span>
  );
}

/** Popup Main: design/hitline/Main.dc.html. */
function Main({ s, t, lang }: { s: PopupSummary; t: T; lang: Lang }) {
  const [pdf, setPdf] = useState<'idle' | 'busy' | 'error'>('idle');
  const tiles = s.platforms.slice(0, MAX_TILES);
  const more = s.platforms.length - tiles.length;
  const issues = s.issues.slice(0, MAX_ISSUES);
  return (
    <>
      <div className={`hero${s.sgtm.detected ? '' : ' off'}`}>
        <div className="hero-top">
          <span className="host">{s.host}</span>
          <span className="soft">
            {t(s.requests === 1 ? 'popup.request' : 'popup.requests', { n: s.requests })}
          </span>
        </div>
        <div className="hero-v">
          <span className="hero-ic">
            <Icon name="server" size={20} stroke={2.2} />
          </span>
          <div>
            <span className="disp">
              {s.sgtm.detected ? t('popup.sgtm.yes') : t('popup.sgtm.no')}
            </span>
            <span className="soft">
              {s.sgtm.detected
                ? t('popup.sgtm.via', { host: s.sgtm.host ?? '' })
                : t('popup.sgtm.noText')}
            </span>
          </div>
        </div>
      </div>
      <div className="tiles">
        {tiles.map((p) => (
          <div key={p.platform} className={`tile${p.issues ? ' is-bad' : ''}`}>
            <PlatformBadge
              platform={p.platform}
              label={TILE_NAME[p.platform] ?? PLATFORM_NAME[p.platform]}
            />
            {p.issues ? (
              <Pill tone="bad" icon="alert">
                {t(p.issues === 1 ? 'popup.tile.issue' : 'popup.tile.issues', { n: p.issues })}
              </Pill>
            ) : (
              <Pill tone="ok" icon="check">
                {t(p.events === 1 ? 'popup.tile.event' : 'popup.tile.events', { n: p.events })}
              </Pill>
            )}
          </div>
        ))}
        {more > 0 && <div className="tile more">{t('popup.more', { n: more })}</div>}
      </div>
      <div className="issues">
        {issues.length > 0 ? (
          <>
            <span className="eyebrow">
              {t(s.issues.length === 1 ? 'popup.issueFound' : 'popup.issuesFound', {
                n: s.issues.length,
              })}
            </span>
            <ol>
              {issues.map((i, k) => (
                <li key={i.key}>
                  <span className="n" aria-hidden="true">
                    {k + 1}
                  </span>
                  {issueTitle(i, t)}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="none">
            <Icon name="check" /> {t('popup.noIssues')}
          </p>
        )}
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn-p btn-xl"
          disabled={pdf === 'busy'}
          aria-busy={pdf === 'busy'}
          onClick={() => {
            setPdf('busy');
            downloadReport((fonts) => hitlineSummaryReport(s, t, lang, fonts)).then(
              () => setPdf('idle'),
              () => setPdf('error'),
            );
          }}
        >
          {t('popup.pdf')}
        </button>
        {pdf === 'error' && (
          <p className="err" role="alert">
            {t('report.error')}
          </p>
        )}
        <F12 t={t} />
      </div>
      <div className="foot">
        <span>{t('popup.help')}</span>
        <a className="btn-lime" href={CTA} target="_blank" rel="noopener">
          {t('cta.contact')}
        </a>
      </div>
    </>
  );
}

/** PopupEmpty: design/hitline/PopupEmpty.dc.html. */
function NoTracking({ host, t }: { host: string; t: T }) {
  return (
    <>
      <div className="blank">
        <span className="blank-ic">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7F56D9"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12h4l2-5 4 10 2-5h6" />
          </svg>
        </span>
        <span className="disp">{t('popup.empty.title')}</span>
        <span className="blank-t">{t('popup.empty.text', { host })}</span>
      </div>
      <div className="checked">
        <span className="eyebrow">{t('popup.empty.checked')}</span>
        <div className="chips">
          {['gtag', 'dataLayer', 'fbq', 'ttq'].map((c) => (
            <span key={c} className="pill mute mono">
              {c}
            </span>
          ))}
          <span className="pill mute mono">{t('popup.empty.gtm')}</span>
          <span className="pill mute mono">{t('popup.empty.scripts')}</span>
        </div>
      </div>
      <div className="pad">
        <div className="cta col">
          <div>
            <strong>{t('popup.empty.ctaTitle')}</strong>
            <span>{t('popup.empty.ctaText')}</span>
          </div>
          <a className="btn-ink" href={CTA} target="_blank" rel="noopener">
            {t('cta.contact')}
          </a>
        </div>
      </div>
    </>
  );
}

function Restricted({ t }: { t: T }) {
  return (
    <>
      <div className="blank">
        <span className="blank-ic">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7F56D9"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <span className="disp">{t('popup.restricted.title')}</span>
        <span className="blank-t">{t('popup.restricted.text')}</span>
      </div>
      <div className="actions">
        <F12 t={t} />
      </div>
    </>
  );
}

export function Popup() {
  const { t, lang } = useT();
  const [state, setState] = useState<ProbeState>({ kind: 'loading' });
  const [view, setView] = useState<'main' | 'settings'>('main');
  useEffect(() => {
    void loadProbe().then(setState);
  }, []);
  const summary = useMemo(
    () => (state.kind === 'ready' ? analyzePopup(state.probe) : null),
    [state],
  );
  const host = summary?.host ?? '';

  if (view === 'settings') {
    return (
      <main className="popup">
        <Settings host={host} lang={lang} onBack={() => setView('main')} />
      </main>
    );
  }
  return (
    <main className="popup">
      <Header onSettings={() => setView('settings')} t={t} />
      {state.kind === 'loading' && <p className="loading">{t('popup.loading')}</p>}
      {state.kind === 'restricted' && <Restricted t={t} />}
      {summary &&
        (summary.noTracking ? (
          <NoTracking host={host} t={t} />
        ) : (
          <Main s={summary} t={t} lang={lang} />
        ))}
    </main>
  );
}
