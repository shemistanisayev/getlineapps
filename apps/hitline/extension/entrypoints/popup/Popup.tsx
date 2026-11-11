import { Logo } from '@line/ui';
import {
  analyzePopup,
  hostOf,
  UNKNOWN_EVENT,
  type Hit,
  type Issue,
  type PopupSummary,
} from '@line/core/hitline';
import { contactUrl } from '@line/core/site';
import { useEffect, useMemo, useRef, useState } from 'react';
import { issueText } from '../../src/issue-text.ts';
import { downloadReport } from '../../src/pdf.ts';
import { activeUrl, loadProbe, type ProbeState } from '../../src/popup/probe.ts';
import { hitlineSummaryReport } from '../../src/report.ts';
import { setFocus, type Focus } from '../../src/storage.ts';
import type { Lang, T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import { fmtTime, Icon, Pill, PlatformBadge, platformName } from '../../src/ui.tsx';
import { Settings } from './Settings.tsx';

const CTA = contactUrl({ source: 'hitline', medium: 'extension', campaign: 'panel_cta' });
const MAX_TILES = 4;
const MAX_ISSUES = 3;
const MAX_EVENTS = 8;
/** The popup reads the page again this often while it is open. */
const REFRESH_MS = 2000;
const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

/** Tile names in the popup (design/hitline/Main.dc.html). */
const TILE_NAME: Record<string, string> = { meta: 'Meta Pixel', tiktok: 'TikTok Pixel' };
const tileName = (p: string) => TILE_NAME[p] ?? platformName(p);

function issueTitle(i: Issue, t: T): string {
  const p = String(i.data.platform);
  const vars = { platform: tileName(p), event: String(i.data.event ?? '') };
  if (i.id === 'VALUE_MISSING')
    return t('popup.issue.value', { ...vars, platform: platformName(p) });
  if (i.id === 'CONSENT_BEFORE') return t('popup.issue.before', vars);
  if (i.id === 'CONSENT_AFTER_REJECT') return t('popup.issue.after', vars);
  return issueText(i, t).title;
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

/** Which site the popup shows, and whether it is live. */
function SiteBar({
  url,
  live,
  added,
  onRefresh,
  t,
}: {
  url?: string;
  live: boolean;
  added: number;
  onRefresh?: () => void;
  t: T;
}) {
  const host = url ? hostOf(url) : '';
  if (!host) return null;
  return (
    <div className="site-bar" title={url}>
      <Icon name="globe" size={13} stroke={2.2} />
      <span className="mono site-host">{host}</span>
      <span className="ph-grow" />
      {added > 0 && (
        <span key={added} className="new-badge" role="status">
          {t('popup.newEvents', { n: added })}
        </span>
      )}
      {live && (
        <span className="live">
          <span className="live-dot" aria-hidden="true" />
          {t('popup.live')}
        </span>
      )}
      {onRefresh && (
        <button
          type="button"
          className="icon-btn sm"
          aria-label={t('popup.refresh')}
          title={t('popup.refresh')}
          onClick={onRefresh}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#344054"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 4v7h-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Chrome does not let an extension open DevTools or pick its tab, so this says how in one line
 * and leaves a note for the panel to open on the chosen event.
 */
function DevtoolsGuide({ onClose, t }: { onClose: () => void; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div
      className="guide"
      role="dialog"
      aria-modal="false"
      aria-labelledby="guide-t"
      tabIndex={-1}
      ref={ref}
    >
      <strong id="guide-t">{t('popup.guide.title')}</strong>
      <ol>
        <li>
          {t('popup.guide.s1')}{' '}
          {isMac ? (
            <>
              <kbd className="mono">Cmd</kbd>+<kbd className="mono">Option</kbd>+
              <kbd className="mono">I</kbd>
            </>
          ) : (
            <>
              <kbd className="mono">F12</kbd> {t('popup.guide.or')} <kbd className="mono">Ctrl</kbd>
              +<kbd className="mono">Shift</kbd>+<kbd className="mono">I</kbd>
            </>
          )}
        </li>
        <li>{t('popup.guide.s2')}</li>
      </ol>
      <span className="soft">{t('popup.guide.note')}</span>
      <button type="button" className="btn-s sm" onClick={onClose}>
        {t('popup.guide.ok')}
      </button>
    </div>
  );
}

function EventRow({
  hit,
  open,
  onToggle,
  onDevtools,
  t,
}: {
  hit: Hit;
  open: boolean;
  onToggle: () => void;
  onDevtools: () => void;
  t: T;
}) {
  return (
    <li className={`pev${open ? ' on' : ''}`}>
      <button type="button" className="pev-row" aria-expanded={open} onClick={onToggle}>
        <span className="mono tm">{fmtTime(hit.time)}</span>
        <PlatformBadge platform={hit.platform} />
        <span className="mono evn">
          {hit.event === UNKNOWN_EVENT ? t('popup.unknownEvent') : hit.event}
        </span>
      </button>
      {open && (
        <div className="pev-more">
          {hit.account && (
            <div className="prow">
              <span className="kv">{t('detail.account')}</span>
              <span className="pv mono">{hit.account}</span>
            </div>
          )}
          {hit.params.slice(0, 8).map((p, i) => (
            <div key={`${p.key}-${i}`} className="prow">
              <span className="kv">{p.key}</span>
              <span className="pv">{p.value}</span>
            </div>
          ))}
          {hit.params.length === 0 && <p className="soft">{t('popup.noUrlParams')}</p>}
          <button type="button" className="btn-s sm" onClick={onDevtools}>
            <Icon name="devtools" size={13} stroke={2.2} /> {t('popup.showInDevtools')}
          </button>
        </div>
      )}
    </li>
  );
}

/** Popup Main: design/hitline/Main.dc.html, plus the recent events list (1.1). */
function Main({ s, tabId, t, lang }: { s: PopupSummary; tabId?: number; t: T; lang: Lang }) {
  const [pdf, setPdf] = useState<'idle' | 'busy' | 'error'>('idle');
  const [allTiles, setAllTiles] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);
  const tiles = allTiles ? s.platforms : s.platforms.slice(0, MAX_TILES);
  const more = s.platforms.length - tiles.length;
  const issues = s.issues.slice(0, MAX_ISSUES);
  const events = s.events.slice(0, MAX_EVENTS);

  const toDevtools = (f: Omit<Focus, 'tabId' | 'at'>) => {
    if (tabId !== undefined) void setFocus({ ...f, tabId });
    setGuide(true);
  };

  return (
    <>
      <div className={`hero${s.sgtm.detected ? '' : ' off'}`}>
        <div className="hero-top">
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
            <PlatformBadge platform={p.platform} label={tileName(p.platform)} />
            {p.issues ? (
              <Pill tone="bad" icon="alert">
                {t(p.issues === 1 ? 'popup.tile.issue' : 'popup.tile.issues', { n: p.issues })}
              </Pill>
            ) : p.loadedOnly ? (
              <Pill tone="mute" icon="check">
                {t('popup.tile.loaded')}
              </Pill>
            ) : (
              <Pill tone="ok" icon="check">
                {t(p.events === 1 ? 'popup.tile.event' : 'popup.tile.events', { n: p.events })}
              </Pill>
            )}
          </div>
        ))}
        {more > 0 && (
          <button type="button" className="tile more" onClick={() => setAllTiles(true)}>
            {t('popup.more', { n: more })}
          </button>
        )}
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
                  <button
                    type="button"
                    className="issue-btn"
                    onClick={() => toDevtools({ tab: i.tab === 'events' ? 'events' : i.tab })}
                  >
                    <span className="n" aria-hidden="true">
                      {k + 1}
                    </span>
                    {issueTitle(i, t)}
                  </button>
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
      {events.length > 0 && (
        <div className="pevents">
          <span className="eyebrow">{t('popup.recent')}</span>
          <ul>
            {events.map((h) => (
              <EventRow
                key={h.id}
                hit={h}
                open={open === h.id}
                onToggle={() => setOpen(open === h.id ? null : h.id)}
                onDevtools={() =>
                  toDevtools({ tab: 'events', platform: h.platform, event: h.event, time: h.time })
                }
                t={t}
              />
            ))}
          </ul>
          {s.events.length > MAX_EVENTS && (
            <span className="soft small">
              {t('popup.moreEvents', { n: s.events.length - MAX_EVENTS })}
            </span>
          )}
        </div>
      )}
      {s.bufferFull && (
        <p className="buffer-note">
          <Icon name="alert" /> {t('popup.bufferFull')}
        </p>
      )}
      {guide && <DevtoolsGuide onClose={() => setGuide(false)} t={t} />}
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
          {pdf === 'busy' ? t('panel.pdfBusy') : t('popup.pdf')}
        </button>
        {pdf === 'error' && (
          <p className="err" role="alert">
            {t('report.error')}
          </p>
        )}
        <button
          type="button"
          className="btn-s btn-xl"
          onClick={() => toDevtools({ tab: 'events' })}
        >
          <Icon name="devtools" size={15} stroke={2.2} /> {t('popup.openDevtools')}
        </button>
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
          <span className="pill mute mono">{t('popup.empty.platforms')}</span>
        </div>
        <span className="soft small">{t('popup.empty.later')}</span>
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

function F12({ t }: { t: T }) {
  return (
    <span className="f12">
      {t('popup.f12.before')} <kbd className="mono">F12</kbd>
      {t('popup.f12.after')}
    </span>
  );
}

function Restricted({ moved, t }: { moved: boolean; t: T }) {
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
        <span className="disp">{moved ? t('popup.moved.title') : t('popup.restricted.title')}</span>
        <span className="blank-t">
          {moved ? t('popup.moved.text') : t('popup.restricted.text')}
        </span>
      </div>
      {!moved && (
        <div className="actions">
          <F12 t={t} />
        </div>
      )}
    </>
  );
}

function Loading({ t }: { t: T }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {t('popup.loading')}
    </div>
  );
}

export function Popup() {
  const { t, lang } = useT();
  const [state, setState] = useState<ProbeState>({ kind: 'loading' });
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [moved, setMoved] = useState(false);
  const [added, setAdded] = useState(0);
  const last = useRef<{ url: string; n: number } | null>(null);

  const read = (initial = false) =>
    void loadProbe().then((next) => {
      if (next.kind === 'ready') {
        const n = analyzePopup(next.probe).events.length;
        const prev = last.current;
        if (prev && prev.url === next.probe.url && n > prev.n) setAdded(n - prev.n);
        else if (prev && prev.url !== next.probe.url) setAdded(0);
        last.current = { url: next.probe.url, n };
        setMoved(false);
        setState(next);
      } else if (!initial && last.current) {
        // The tab went to another site: Chrome ends the one-click access there.
        setMoved(true);
      } else setState(next);
    });

  useEffect(() => {
    void activeUrl().then((url) =>
      setState((s) => (s.kind === 'loading' ? { kind: 'loading', url } : s)),
    );
    read(true);
    if (window.__HITLINE_POPUP__) return undefined;
    const timer = setInterval(() => read(), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!added) return undefined;
    const timer = setTimeout(() => setAdded(0), 3000);
    return () => clearTimeout(timer);
  }, [added]);

  const summary = useMemo(
    () => (state.kind === 'ready' ? analyzePopup(state.probe) : null),
    [state],
  );
  const url = state.kind === 'ready' ? state.probe.url : state.url;
  const host = summary?.host ?? (url ? hostOf(url) : '');

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
      {state.kind !== 'restricted' && (
        <SiteBar
          url={url}
          live={state.kind === 'ready' && !moved && !window.__HITLINE_POPUP__}
          added={added}
          onRefresh={state.kind === 'ready' ? () => read() : undefined}
          t={t}
        />
      )}
      {state.kind === 'loading' && <Loading t={t} />}
      {(state.kind === 'restricted' || moved) && <Restricted moved={moved} t={t} />}
      {summary &&
        !moved &&
        (summary.noTracking ? (
          <NoTracking host={host} t={t} />
        ) : (
          <Main
            s={summary}
            tabId={state.kind === 'ready' ? state.tabId : undefined}
            t={t}
            lang={lang}
          />
        ))}
    </main>
  );
}
