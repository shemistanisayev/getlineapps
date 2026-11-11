import {
  analyze,
  parseRobots,
  planLinkCheck,
  type Audit,
  type LinkResult,
} from '@line/core/serpline';
import { contactUrl } from '@line/core/site';
import { FooterCta, LimeCta, PageRow, PanelTabs, type PanelTab } from '@line/ui/serpline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  activeTabId,
  checkTab,
  requestSite,
  runLinkCheck,
  setOverlay,
  type CheckFailure,
} from '../../src/capture/check.ts';
import type { FetchedFile, PageRead } from '../../src/capture/inject.ts';
import type { OverlaySpec } from '../../src/capture/overlay.ts';
import type { T } from '../../src/i18n/index.ts';
import {
  OVERLAY_HIDDEN_MESSAGE,
  isCheckMessage,
  isOverlayHiddenMessage,
} from '../../src/messages.ts';
import { getAutoCheckLinks, getPreviewDevice, type PreviewDevice } from '../../src/storage.ts';
import { useT } from '../../src/useLang.ts';
import { jsOnlyHeadings } from './tabs/common.tsx';
import { HeadingsTab } from './tabs/Headings.tsx';
import { LinksTab, type LinkCheckState } from './tabs/Links.tsx';
import { SummaryTab } from './tabs/Summary.tsx';

/**
 * The side panel (docs/serpline-SPEC.md §5). Summary, Headings and Links are built (step 5);
 * Render and AI still show the "Page read" card until step 6.
 */
const TAB_IDS = ['summary', 'headings', 'links', 'render', 'ai'] as const;
type TabId = (typeof TAB_IDS)[number];
const PANEL_CTA = contactUrl({ source: 'serpline', medium: 'extension', campaign: 'panel_cta' });

type View =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'result'; tabId: number; page: PageRead; checkedAt: Date; stale: boolean }
  | { kind: 'failed'; reason: CheckFailure };

function size(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/** Runs the core rules on what the page returned (and the link results once checked). */
function auditOf(page: PageRead, linkResults?: LinkResult[]): Audit | null {
  try {
    return analyze({
      url: page.url,
      renderedHtml: page.html,
      raw: page.raw.status ? page.raw : null,
      robots: page.robots.status ? page.robots : null,
      llms: page.llms.status ? page.llms : null,
      linkResults,
    });
  } catch {
    return null;
  }
}

function fileLine(f: FetchedFile, t: T, lines = false): string {
  if (f.status === 0) return t('panel.read.failed');
  // Same count as the AI tab's "Found, N lines" (a final newline does not add a line).
  if (lines) return t('panel.read.lines', { status: f.status, n: parseRobots(f.text).lineCount });
  return t('panel.read.status', { status: f.status, size: size(f.text.length) });
}

/** What the page overlay draws: every heading (H1s added by JavaScript say so) and images without alt. */
function overlaySpec(audit: Audit, t: T): OverlaySpec {
  const js = jsOnlyHeadings(audit);
  const headings = audit.rendered.headings;
  const images = audit.rendered.images.filter((i) => i.alt === 'missing');
  const n = (k1: 'ov.heading' | 'ov.image', k: 'ov.headings' | 'ov.images', c: number) =>
    t(c === 1 ? k1 : k, { n: c });
  return {
    marks: [
      ...headings.map((h) => ({
        path: h.path,
        kind: 'heading' as const,
        label: `H${h.level}`,
        note: h.level === 1 && js.has(h) ? t('ov.addedByJs') : undefined,
      })),
      ...images.map((i) => ({ path: i.path, kind: 'image' as const, label: t('hd.noAlt') })),
    ],
    summary: t('ov.summary', {
      headings: n('ov.heading', 'ov.headings', headings.length),
      images: n('ov.image', 'ov.images', images.length),
    }),
    hide: t('ov.hide'),
    hiddenMessage: OVERLAY_HIDDEN_MESSAGE,
  };
}

export function Panel() {
  const { t } = useT();
  const [view, setView] = useState<View>({ kind: 'idle' });
  const [tab, setTab] = useState<TabId>('summary');
  const [device, setDevice] = useState<PreviewDevice>('mobile');
  const [links, setLinks] = useState<{ results?: LinkResult[]; state: LinkCheckState }>({
    state: 'idle',
  });
  const [highlight, setHighlight] = useState(false);
  const [highlightFailed, setHighlightFailed] = useState(false);
  // The last page read: its origin is the only site Serpline can offer to allow (no tabs permission).
  const last = useRef<{ tabId: number; page: PageRead } | null>(null);
  const busy = useRef<number | null>(null);
  // Bumped on every check, so a slow link check never lands on a newer page.
  const generation = useRef(0);

  useEffect(() => {
    void getPreviewDevice().then(setDevice);
  }, []);

  const checkLinks = useCallback(async (tabId: number, page: PageRead) => {
    const gen = generation.current;
    const base = auditOf(page);
    if (!base) return;
    setLinks({ state: 'running' });
    const results = await runLinkCheck(tabId, planLinkCheck(base.rendered));
    if (gen !== generation.current) return;
    setLinks(results ? { results, state: 'done' } : { state: 'failed' });
  }, []);

  const show = useCallback(
    (tabId: number, page: PageRead) => {
      generation.current++;
      last.current = { tabId, page };
      setLinks({ state: 'idle' });
      setHighlightFailed(false);
      setView({ kind: 'result', tabId, page, checkedAt: new Date(), stale: false });
      void getAutoCheckLinks().then((on) => on && void checkLinks(tabId, page));
    },
    [checkLinks],
  );

  const run = useCallback(
    async (tabId: number) => {
      if (busy.current === tabId) return;
      busy.current = tabId;
      setView({ kind: 'checking' });
      const res = await checkTab(tabId);
      busy.current = null;
      if (res.ok) {
        show(tabId, res.page);
      } else if (last.current && res.reason === 'noAccess') {
        setView({ ...last.current, kind: 'result', checkedAt: new Date(), stale: true });
      } else {
        setView({ kind: 'failed', reason: res.reason });
      }
    },
    [show],
  );

  // Opened from the icon or Alt+Shift+S: activeTab is granted for the active tab, check it now.
  useEffect(() => {
    void activeTabId().then((id) => {
      if (id !== undefined) void run(id);
    });
    const onMessage = (msg: unknown) => {
      if (isCheckMessage(msg)) void run(msg.tabId);
      else if (isOverlayHiddenMessage(msg)) setHighlight(false);
    };
    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, [run]);

  // SPEC §3.2: another tab or a new document in the same tab makes the result stale.
  useEffect(() => {
    const markStale = (tabId: number, sameTabReload: boolean) =>
      setView((v) =>
        v.kind === 'result' && (v.tabId !== tabId || sameTabReload) ? { ...v, stale: true } : v,
      );
    const onActivated = ({ tabId }: { tabId: number }) => markStale(tabId, false);
    const onUpdated = (tabId: number, info: { status?: string }) => {
      if (info.status === 'complete' && tabId === last.current?.tabId && busy.current === null) {
        markStale(tabId, true);
        // A new document has no overlay.
        setHighlight(false);
      }
    };
    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);
    return () => {
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  // "Check this page": try, then ask Chrome for the previous site if access is missing, then retry.
  const checkThis = async () => {
    const id = await activeTabId();
    if (id === undefined) return;
    const first = await checkTab(id);
    if (first.ok) {
      show(id, first.page);
      return;
    }
    if (first.reason === 'noAccess' && last.current) {
      if (await requestSite(last.current.page.origin)) await run(id);
    } else {
      setView({ kind: 'failed', reason: first.reason });
    }
  };

  const page = view.kind === 'result' ? view.page : null;
  const audit = useMemo(() => (page ? auditOf(page, links.results) : null), [page, links.results]);
  const url = page ? new URL(page.url) : null;
  const stale = view.kind === 'result' && view.stale;
  // Result tabs (design: Main, Headings, Links, Render, Ai). Stale, idle and restricted show only
  // Chrome's own title row (design: Stale), so no page row and no tabs there.
  const tabbed = view.kind === 'result' && !stale;
  const tabId = view.kind === 'result' ? view.tabId : null;

  // The page overlay follows the switch; it is redrawn after a new check while it is on.
  const drawn = useRef(false);
  useEffect(() => {
    if (tabId === null || !tabbed) return;
    if (highlight && audit) {
      drawn.current = true;
      void setOverlay(tabId, overlaySpec(audit, t)).then((n) => setHighlightFailed(n === null));
    } else if (drawn.current) {
      drawn.current = false;
      void setOverlay(tabId, null);
    }
  }, [highlight, audit, tabId, tabbed, t]);

  const issues = (n: number) => t(n === 1 ? 'tab.issue' : 'tab.issues', { n });
  const tabs: PanelTab<TabId>[] = TAB_IDS.map((id) => ({
    id,
    label: t(`tab.${id}`),
    // Issue count per tab from @line/core/serpline (SPEC §4.5). Summary has no badge.
    count: id === 'summary' ? 0 : (audit?.byTab[id] ?? 0),
    countLabel: issues(id === 'summary' ? 0 : (audit?.byTab[id] ?? 0)),
  }));
  const limeTab = tab === 'render' || tab === 'ai';
  const planned = useMemo(() => (audit ? planLinkCheck(audit.rendered).length : 0), [audit]);

  const readCard = page && (
    <section className="sl-card sp-read" aria-label={t('panel.read.title')}>
      <h2 className="sl-eyebrow">{stale ? t('panel.previous') : t('panel.read.title')}</h2>
      <dl>
        <dt>{t('panel.read.rawHtml')}</dt>
        <dd data-k="raw">{fileLine(page.raw, t)}</dd>
        <dt>{t('panel.read.score')}</dt>
        <dd data-k="score">
          {audit ? t('panel.read.scoreValue', { score: audit.score, ...audit.counts }) : '-'}
        </dd>
        <dt className="mono">{t('panel.read.robots')}</dt>
        <dd data-k="robots">{fileLine(page.robots, t, true)}</dd>
        <dt className="mono">{t('panel.read.llms')}</dt>
        <dd data-k="llms">{fileLine(page.llms, t)}</dd>
      </dl>
      <p className="sp-muted">{t('panel.read.note')}</p>
    </section>
  );

  return (
    <div className="sl-panel sp">
      {tabbed && url && (
        <header className="sp-head">
          <PageRow
            host={url.host}
            path={url.pathname + url.search}
            checkAgainLabel={t('panel.checkAgain')}
            pdfLabel={t('panel.pdf')}
            settingsLabel={t('panel.settings')}
            onCheckAgain={() => tabId !== null && void run(tabId)}
            pdfDisabled
          />
          <PanelTabs
            label={t('panel.sections')}
            tabs={tabs}
            active={tab}
            onSelect={setTab}
            panelId="sp-tabpanel"
          />
        </header>
      )}

      <main
        className="sp-body"
        id={tabbed ? 'sp-tabpanel' : undefined}
        role={tabbed ? 'tabpanel' : undefined}
        aria-labelledby={tabbed ? `sl-tab-${tab}` : undefined}
      >
        {view.kind === 'checking' && <p className="sp-muted">{t('panel.checking')}</p>}

        {(view.kind === 'idle' ||
          stale ||
          (view.kind === 'failed' && view.reason === 'noAccess')) && (
          <section className="sl-card sp-call">
            <h1>{stale ? t('panel.stale.title') : t('panel.idle.title')}</h1>
            <p>
              {stale
                ? t('panel.stale.text')
                : view.kind === 'failed'
                  ? t('panel.noAccess')
                  : t('panel.idle.text')}
            </p>
            <button type="button" className="sp-cta" onClick={() => void checkThis()}>
              {t('panel.checkThis')}
            </button>
            <p className="sp-muted">
              {t('panel.shortcut.before')} <kbd className="mono">Alt</kbd> +{' '}
              <kbd className="mono">Shift</kbd> + <kbd className="mono">S</kbd>{' '}
              {t('panel.shortcut.after')}
            </p>
          </section>
        )}

        {view.kind === 'failed' && view.reason === 'restricted' && (
          <section className="sl-card sp-call" role="status">
            <h1>{t('panel.restricted.title')}</h1>
            <p>{t('panel.restricted.text')}</p>
          </section>
        )}

        {stale && readCard}

        {tabbed && audit && view.kind === 'result' && tab === 'summary' && (
          <SummaryTab
            audit={audit}
            checkedAt={view.checkedAt}
            device={device}
            onDevice={setDevice}
            t={t}
          />
        )}
        {tabbed && audit && tab === 'headings' && (
          <HeadingsTab
            audit={audit}
            highlight={highlight}
            onHighlight={setHighlight}
            highlightFailed={highlightFailed}
            t={t}
          />
        )}
        {tabbed && audit && tab === 'links' && (
          <LinksTab
            key={`${links.state}-${view.kind === 'result' ? view.checkedAt.getTime() : 0}`}
            audit={audit}
            checkState={links.state}
            plannedCount={planned}
            onCheck={() => tabId !== null && page && void checkLinks(tabId, page)}
            t={t}
          />
        )}
        {tabbed && (limeTab || !audit) && readCard}

        {tabbed && limeTab && (
          <LimeCta text={t(`cta.${tab}`)} label={t('cta.contact')} href={PANEL_CTA} />
        )}
      </main>

      {!(tabbed && limeTab) && (
        <FooterCta
          text={tabbed ? t('cta.help') : t('cta.audit')}
          label={t('cta.contact')}
          href={PANEL_CTA}
        />
      )}
    </div>
  );
}
