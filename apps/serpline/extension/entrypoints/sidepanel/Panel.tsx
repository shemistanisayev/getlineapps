import { analyze, parseRobots, type Audit } from '@line/core/serpline';
import { contactUrl } from '@line/core/site';
import { FooterCta, LimeCta, PageRow, PanelTabs, type PanelTab } from '@line/ui/serpline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { activeTabId, checkTab, requestSite, type CheckFailure } from '../../src/capture/check.ts';
import type { FetchedFile, PageRead } from '../../src/capture/inject.ts';
import type { T } from '../../src/i18n/index.ts';
import { isCheckMessage } from '../../src/messages.ts';
import { useT } from '../../src/useLang.ts';

/**
 * Step 2 shell (docs/serpline/PLAN.md): runs the check and shows what was read, plus the Stale,
 * no-access and restricted states. The real tabs replace the "Page read" card in steps 3 to 6.
 */
const TAB_IDS = ['summary', 'headings', 'links', 'render', 'ai'] as const;
type TabId = (typeof TAB_IDS)[number];
const PANEL_CTA = contactUrl({ source: 'serpline', medium: 'extension', campaign: 'panel_cta' });

type View =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'result'; tabId: number; page: PageRead; stale: boolean }
  | { kind: 'failed'; reason: CheckFailure };

function size(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/** Runs the core rules on what the page returned. Link issues wait for the link check (step 5). */
function auditOf(page: PageRead): Audit | null {
  try {
    return analyze({
      url: page.url,
      renderedHtml: page.html,
      raw: page.raw.status ? page.raw : null,
      robots: page.robots.status ? page.robots : null,
      llms: page.llms.status ? page.llms : null,
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

export function Panel() {
  const { t } = useT();
  const [view, setView] = useState<View>({ kind: 'idle' });
  const [tab, setTab] = useState<TabId>('summary');
  // The last page read: its origin is the only site Serpline can offer to allow (no tabs permission).
  const last = useRef<{ tabId: number; page: PageRead } | null>(null);
  const busy = useRef<number | null>(null);

  const run = useCallback(async (tabId: number) => {
    if (busy.current === tabId) return;
    busy.current = tabId;
    setView({ kind: 'checking' });
    const res = await checkTab(tabId);
    busy.current = null;
    if (res.ok) {
      last.current = { tabId, page: res.page };
      setView({ kind: 'result', tabId, page: res.page, stale: false });
    } else if (last.current && res.reason === 'noAccess') {
      setView({ ...last.current, kind: 'result', stale: true });
    } else {
      setView({ kind: 'failed', reason: res.reason });
    }
  }, []);

  // Opened from the icon or Alt+Shift+S: activeTab is granted for the active tab, check it now.
  useEffect(() => {
    void activeTabId().then((id) => {
      if (id !== undefined) void run(id);
    });
    const onMessage = (msg: unknown) => {
      if (isCheckMessage(msg)) void run(msg.tabId);
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
      if (info.status === 'complete' && tabId === last.current?.tabId && busy.current === null)
        markStale(tabId, true);
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
      last.current = { tabId: id, page: first.page };
      setView({ kind: 'result', tabId: id, page: first.page, stale: false });
      return;
    }
    if (first.reason === 'noAccess' && last.current) {
      if (await requestSite(last.current.page.origin)) await run(id);
    } else {
      setView({ kind: 'failed', reason: first.reason });
    }
  };

  const page = view.kind === 'result' ? view.page : null;
  const audit = useMemo(() => (page ? auditOf(page) : null), [page]);
  const url = page ? new URL(page.url) : null;
  const stale = view.kind === 'result' && view.stale;
  // Result tabs (design: Main, Headings, Links, Render, Ai). Stale, idle and restricted show only
  // Chrome's own title row (design: Stale), so no page row and no tabs there.
  const tabbed = view.kind === 'result' && !stale;
  const issues = (n: number) => t(n === 1 ? 'tab.issue' : 'tab.issues', { n });
  const tabs: PanelTab<TabId>[] = TAB_IDS.map((id) => ({
    id,
    label: t(`tab.${id}`),
    // Issue count per tab from @line/core/serpline (SPEC §4.5). Summary has no badge.
    count: id === 'summary' ? 0 : (audit?.byTab[id] ?? 0),
    countLabel: issues(id === 'summary' ? 0 : (audit?.byTab[id] ?? 0)),
  }));
  const limeTab = tab === 'render' || tab === 'ai';

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
            onCheckAgain={() => void run(view.tabId)}
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

        {page && (
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
        )}

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
