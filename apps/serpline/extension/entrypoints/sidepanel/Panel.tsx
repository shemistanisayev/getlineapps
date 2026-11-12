import {
  analyze,
  isWeakAnchor,
  planLinkCheck,
  type Audit,
  type LinkResult,
} from '@line/core/serpline';
import { contactUrl } from '@line/core/site';
import { FooterCta, PageRow, PanelTabs, type PanelTab } from '@line/ui/serpline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  activeTabId,
  checkTab,
  requestSite,
  runLinkCheck,
  setOverlay,
  type CheckFailure,
} from '../../src/capture/check.ts';
import type { PageRead } from '../../src/capture/inject.ts';
import type { OverlayMark, OverlaySpec } from '../../src/capture/overlay.ts';
import type { MessageKey, T } from '../../src/i18n/index.ts';
import {
  OVERLAY_HIDDEN_MESSAGE,
  isCheckMessage,
  isOverlayHiddenMessage,
  isProgressMessage,
  type ReadStep,
} from '../../src/messages.ts';
import { getAutoCheckLinks, getPreviewDevice, type PreviewDevice } from '../../src/storage.ts';
import { downloadReport } from '../../src/pdf.ts';
import { serplineReport } from '../../src/report.ts';
import { useT } from '../../src/useLang.ts';
import { jsOnlyHeadings } from './tabs/common.tsx';
import { AiTab } from './tabs/Ai.tsx';
import { CallView, type CallKind } from './tabs/CallView.tsx';
import { Checking } from './tabs/Checking.tsx';
import { HeadingsTab } from './tabs/Headings.tsx';
import { LinksTab, type LinkCheckState } from './tabs/Links.tsx';
import { RenderTab } from './tabs/Render.tsx';
import { Settings } from './Settings.tsx';
import { SpeedTab } from './tabs/Speed.tsx';
import { SummaryTab } from './tabs/Summary.tsx';

/**
 * The side panel (docs/serpline-SPEC.md §5): five result tabs, plus the Stale, idle, no-access and
 * restricted states (design: Stale).
 */
const TAB_IDS = ['summary', 'headings', 'links', 'render', 'speed', 'ai'] as const;
type TabId = (typeof TAB_IDS)[number];
const PANEL_CTA = contactUrl({ source: 'serpline', medium: 'extension', campaign: 'panel_cta' });

type View =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'result'; tabId: number; page: PageRead; checkedAt: Date; stale: boolean }
  | { kind: 'failed'; reason: CheckFailure };

/** Runs the core rules on what the page returned (and the link results once checked). */
function auditOf(page: PageRead, linkResults?: LinkResult[]): Audit | null {
  try {
    return analyze({
      url: page.url,
      renderedHtml: page.html,
      raw: page.raw.status ? { ...page.raw, finalUrl: page.raw.url } : null,
      robots: page.robots.status ? page.robots : null,
      llms: page.llms.status ? page.llms : null,
      linkResults,
      live: page.live ?? null,
    });
  } catch {
    return null;
  }
}

/** Which tab drew the page overlay. */
type HighlightMode = 'headings' | 'links' | 'speed';

/**
 * What the page overlay draws. Headings: every heading (H1s added by JavaScript say so) and images
 * without alt. Links: links with problems. Speed: the LCP element, elements that moved, and images
 * with a speed finding.
 */
function overlaySpec(audit: Audit, mode: HighlightMode, t: T): OverlaySpec {
  const base = { hide: t('ov.hide'), hiddenMessage: OVERLAY_HIDDEN_MESSAGE };
  const count = (n: number, one: MessageKey, many: MessageKey) => t(n === 1 ? one : many, { n });
  if (mode === 'links') {
    const marks: OverlayMark[] = [];
    const seen = new Set<string>();
    const push = (path: string, label: string) => {
      if (seen.has(path)) return;
      seen.add(path);
      marks.push({ path, kind: 'problem', label });
    };
    for (const l of audit.linkCheck?.links ?? []) {
      if (l.kind !== 'internal') continue;
      if (l.state === 'broken') push(l.path, String(l.status ?? ''));
      else if (l.state === 'redirect') push(l.path, t('ln.st.redirect'));
    }
    for (const l of audit.rendered.links) {
      if (l.kind === 'other') continue;
      if (l.emptyText) push(l.path, t('ov.noText'));
      else if (isWeakAnchor(l.text)) push(l.path, t('ov.weak'));
      else if (l.kind === 'internal' && l.nofollow) push(l.path, 'nofollow');
    }
    return {
      ...base,
      marks,
      summary: t('ov.summaryOne', { items: count(marks.length, 'ov.link', 'ov.links') }),
    };
  }
  if (mode === 'speed') {
    const marks: OverlayMark[] = [];
    const v = audit.live?.vitals;
    if (v?.lcpPath) marks.push({ path: v.lcpPath, kind: 'info', label: 'LCP' });
    // Elements that moved are marked only when the shift is a problem (CLS over 0.1).
    if (audit.issues.some((i) => i.id === 'CLS_HIGH'))
      for (const p of v?.clsPaths ?? [])
        marks.push({ path: p, kind: 'problem', label: t('ov.moves') });
    const img = audit.images;
    const label = new Map<string, string>();
    const tag = (list: { path: string }[] | undefined, text: string) =>
      list?.forEach((i) => {
        if (!label.has(i.path)) label.set(i.path, text);
      });
    tag(img?.lazyTop, t('ov.lazy'));
    tag(img?.heavy, t('ov.heavy'));
    tag(img?.oversized, t('ov.tooBig'));
    tag(img?.legacy, t('ov.oldFormat'));
    tag(img?.unsized, t('ov.noSize'));
    for (const [path, text] of label) marks.push({ path, kind: 'problem', label: text });
    return {
      ...base,
      marks,
      summary: t('ov.summaryOne', { items: count(marks.length, 'ov.element', 'ov.elements') }),
    };
  }
  const js = jsOnlyHeadings(audit);
  const headings = audit.rendered.headings;
  const images = audit.rendered.images.filter((i) => i.alt === 'missing');
  return {
    ...base,
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
      headings: count(headings.length, 'ov.heading', 'ov.headings'),
      images: count(images.length, 'ov.image', 'ov.images'),
    }),
  };
}

export function Panel() {
  const { t, lang } = useT();
  const [pdf, setPdf] = useState<'idle' | 'busy' | 'failed'>('idle');
  const [settings, setSettings] = useState(false);
  const [view, setView] = useState<View>({ kind: 'idle' });
  const [tab, setTab] = useState<TabId>('summary');
  const [device, setDevice] = useState<PreviewDevice>('mobile');
  const [links, setLinks] = useState<{ results?: LinkResult[]; state: LinkCheckState }>({
    state: 'idle',
  });
  const [highlight, setHighlight] = useState<HighlightMode | null>(null);
  const [highlightFailed, setHighlightFailed] = useState(false);
  // The last page read: its origin is the only site Serpline can offer to allow (no tabs permission).
  const last = useRef<{ tabId: number; page: PageRead } | null>(null);
  const busy = useRef<number | null>(null);
  // Progress reported by the page while it is read, and while its links are checked.
  const [steps, setSteps] = useState<ReadStep[]>([]);
  const [linkProgress, setLinkProgress] = useState<{ done: number; total: number } | null>(null);
  const linkTab = useRef<number | null>(null);
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
    setLinkProgress(null);
    linkTab.current = tabId;
    const results = await runLinkCheck(tabId, planLinkCheck(base.rendered));
    if (gen !== generation.current) return;
    linkTab.current = null;
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
      setSteps([]);
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
    const onMessage = (msg: unknown, sender?: { tab?: { id?: number } }) => {
      if (isCheckMessage(msg)) void run(msg.tabId);
      else if (isOverlayHiddenMessage(msg)) setHighlight(null);
      else if (isProgressMessage(msg)) {
        const from = sender?.tab?.id;
        const step = msg.step;
        if (step && from === busy.current) setSteps((s) => (s.includes(step) ? s : [...s, step]));
        if (msg.total && from === linkTab.current)
          setLinkProgress({ done: msg.done ?? 0, total: msg.total });
      }
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
        setHighlight(null);
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
      void setOverlay(tabId, overlaySpec(audit, highlight, t)).then((n) =>
        setHighlightFailed(n === null),
      );
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
  const limeTab = tab === 'render' || tab === 'speed' || tab === 'ai';
  const planned = useMemo(() => (audit ? planLinkCheck(audit.rendered).length : 0), [audit]);

  const call: CallKind | null =
    view.kind === 'idle' ? 'idle' : stale ? 'stale' : view.kind === 'failed' ? view.reason : null;
  const previous =
    stale && audit && url ? { score: audit.score, path: url.pathname + url.search } : null;

  const makePdf = async () => {
    if (!audit) return;
    setPdf('busy');
    try {
      await downloadReport((fonts) => serplineReport(audit, t, lang, fonts, new Date()));
      setPdf('idle');
    } catch {
      setPdf('failed');
    }
  };

  if (settings) {
    return (
      <div className="sl-panel sp">
        <Settings lang={lang} t={t} onBack={() => setSettings(false)} onDevice={setDevice} />
      </div>
    );
  }

  return (
    <div className="sl-panel sp">
      {tabbed && url && (
        <header className="sp-head">
          <PageRow
            host={url.host}
            path={url.pathname + url.search}
            checkAgainLabel={t('panel.checkAgain')}
            settingsLabel={t('panel.settings')}
            onCheckAgain={() => tabId !== null && void run(tabId)}
            pdfLabel={pdf === 'busy' ? t('rep.making') : t('panel.pdf')}
            pdfDisabled={!audit || pdf === 'busy'}
            onPdf={() => void makePdf()}
            onSettings={() => setSettings(true)}
            settingsPressed={settings}
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
        {view.kind === 'checking' && <Checking done={steps} t={t} />}
        {tabbed && pdf === 'failed' && (
          <p className="sp-note sp-note--bad" role="status">
            {t('rep.failed')}
          </p>
        )}

        {call && (
          <CallView
            kind={call}
            previous={previous}
            onCheck={() => void checkThis()}
            onShowPrevious={() =>
              setView((v) => (v.kind === 'result' ? { ...v, stale: false } : v))
            }
            t={t}
          />
        )}

        {tabbed && !audit && (
          <section className="sl-card sp-call" role="status">
            <div className="sp-call-x">
              <h1>{t('panel.readError.title')}</h1>
              <p>{t('panel.readError.text')}</p>
            </div>
          </section>
        )}

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
            highlight={highlight === 'headings'}
            onHighlight={(on) => setHighlight(on ? 'headings' : null)}
            highlightFailed={highlightFailed}
            t={t}
          />
        )}
        {tabbed && audit && tab === 'links' && (
          <LinksTab
            key={`${links.state}-${view.kind === 'result' ? view.checkedAt.getTime() : 0}`}
            audit={audit}
            checkState={links.state}
            progress={links.state === 'running' ? linkProgress : null}
            plannedCount={planned}
            onCheck={() => tabId !== null && page && void checkLinks(tabId, page)}
            highlight={highlight === 'links'}
            onHighlight={(on) => setHighlight(on ? 'links' : null)}
            highlightFailed={highlightFailed}
            t={t}
          />
        )}
        {tabbed && audit && tab === 'render' && <RenderTab audit={audit} cta={PANEL_CTA} t={t} />}
        {tabbed && audit && tab === 'speed' && (
          <SpeedTab
            audit={audit}
            highlight={highlight === 'speed'}
            onHighlight={(on) => setHighlight(on ? 'speed' : null)}
            highlightFailed={highlightFailed}
            cta={PANEL_CTA}
            t={t}
          />
        )}
        {tabbed && audit && tab === 'ai' && <AiTab audit={audit} cta={PANEL_CTA} t={t} />}
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
