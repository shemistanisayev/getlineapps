import { PanelHeader, Toast } from '@line/ui/rivaline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { activeTabId } from '../../src/capture/check.ts';
import { probeTab, scanTab, type ScanResult, type ScanStep } from '../../src/capture/scan.ts';
import { isScanMessage } from '../../src/messages.ts';
import { brandDomain, brandName, libraryLinks } from '@line/core/rivaline';
import { downloadReport } from '../../src/pdf.ts';
import { rivalineReport } from '../../src/report.ts';
import { actionShortcut, getCountry } from '../../src/storage.ts';
import { useT } from '../../src/useLang.ts';
import { AdsTab } from './AdsTab.tsx';
import { BrandTab } from './BrandTab.tsx';
import { Settings } from './Settings.tsx';
import { StackTab } from './StackTab.tsx';
import { AccessView, EmptyView, Reading, RestrictedView } from './Views.tsx';

/**
 * Side panel (docs/rivaline-SPEC.md §3.1 and §7). One panel per window; results are kept in
 * memory per tab, never stored.
 */
type Tab = 'stack' | 'ads' | 'brand';
type View =
  | { kind: 'idle' }
  | { kind: 'reading'; tabId: number; done: ScanStep[] }
  | { kind: 'result'; result: ScanResult }
  | { kind: 'access' }
  | { kind: 'restricted' };

const TOAST_MS = 2500;
const LIBRARY_COUNT = 4;

export function Panel() {
  const { t, lang } = useT();
  const [view, setView] = useState<View>({ kind: 'idle' });
  const [tab, setTab] = useState<Tab>('stack');
  const [keys, setKeys] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  /** The library row the Stack tab jumped to (highlighted in the Ads tab, step 6). */
  const [library, setLibrary] = useState<string | null>(null);
  const cache = useRef(new Map<number, ScanResult>());
  /** Each scan gets a number; a slower, older scan never overwrites a newer one. */
  const run = useRef(0);

  const scan = useCallback(async (tabId: number) => {
    const id = ++run.current;
    setView({ kind: 'reading', tabId, done: [] });
    const { windowId } = await browser.tabs.get(tabId);
    const outcome = await scanTab(tabId, windowId, (step) => {
      if (run.current === id)
        setView((v) => (v.kind === 'reading' ? { ...v, done: [...v.done, step] } : v));
    });
    if (run.current !== id) return;
    if (outcome.ok) {
      cache.current.set(tabId, outcome.result);
      setView({ kind: 'result', result: outcome.result });
    } else {
      cache.current.delete(tabId);
      setView({ kind: outcome.reason === 'restricted' ? 'restricted' : 'access' });
    }
  }, []);

  /** Another tab, or a new page: show the cached result if the tab is still on that page. */
  const show = useCallback(
    async (tabId: number) => {
      const id = ++run.current;
      const probe = await probeTab(tabId);
      if (run.current !== id) return;
      if (!probe.ok) {
        setView({ kind: probe.reason === 'restricted' ? 'restricted' : 'access' });
        return;
      }
      const cached = cache.current.get(tabId);
      if (cached && cached.url === probe.url) setView({ kind: 'result', result: cached });
      else void scan(tabId);
    },
    [scan],
  );

  useEffect(() => {
    void actionShortcut().then(setKeys);
    void activeTabId().then((id) => {
      if (id !== undefined) void scan(id);
    });
    const onMessage = (msg: unknown) => {
      if (isScanMessage(msg)) void scan(msg.tabId);
    };
    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, [scan]);

  // SPEC §3.1 tab changes: a switch shows the cached result or the right state; a new page in the
  // active tab is read again (same-site navigation keeps activeTab).
  useEffect(() => {
    const onActivated = ({ tabId }: { tabId: number }) => void show(tabId);
    const onUpdated = (tabId: number, info: { status?: string }) => {
      if (info.status !== 'complete') return;
      void activeTabId().then((id) => {
        if (id === tabId) {
          cache.current.delete(tabId);
          void show(tabId);
        }
      });
    };
    const onRemoved = (tabId: number) => cache.current.delete(tabId);
    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);
    browser.tabs.onRemoved.addListener(onRemoved);
    return () => {
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
      browser.tabs.onRemoved.removeListener(onRemoved);
    };
  }, [show]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(message);
    } catch {
      /* the clipboard can be blocked; nothing to show */
    }
  };

  const result = view.kind === 'result' ? view.result : null;

  /** Report PDF (SPEC §8): the default searches with the Settings country, in the panel language. */
  const makePdf = async (r: ScanResult) => {
    setPdfBusy(true);
    try {
      const country = await getCountry();
      const searchBrand = brandName(r.snapshot);
      const links = libraryLinks(
        { brand: searchBrand, domain: brandDomain(r.url), country },
        r.stack.tools,
      );
      const file = await downloadReport((fonts) =>
        rivalineReport(
          { url: r.url, stack: r.stack, brand: r.brand, links, searchBrand },
          t,
          lang,
          fonts,
          new Date(),
        ),
      );
      setToast(t('rep.saved', { file }));
    } catch {
      setToast(t('rep.failed'));
    } finally {
      setPdfBusy(false);
    }
  };
  const readable = view.kind === 'result' || view.kind === 'reading';
  const empty = result !== null && result.stack.tools.length === 0;

  if (settings)
    return (
      <div className="rp">
        <Settings lang={lang} t={t} onBack={() => setSettings(false)} />
      </div>
    );

  return (
    <div className="rp">
      <PanelHeader
        readAgainLabel={t('panel.readAgain')}
        settingsLabel={t('panel.settings')}
        pdfLabel={t('panel.pdf')}
        readDisabled={!result}
        onSettings={() => setSettings(true)}
        pdfDisabled={pdfBusy}
        onPdf={result ? () => void makePdf(result) : undefined}
        onReadAgain={result ? () => void scan(result.tabId) : undefined}
        tabsLabel={t('panel.sections')}
        tabs={[
          {
            id: 'stack',
            label: t('tab.stack'),
            count: result?.stack.tools.length,
            countLabel: t('count.stack', { n: result?.stack.tools.length ?? 0 }),
          },
          {
            id: 'ads',
            label: t('tab.ads'),
            count: result ? LIBRARY_COUNT : undefined,
            countLabel: t('count.ads', { n: LIBRARY_COUNT }),
          },
          {
            id: 'brand',
            label: t('tab.brand'),
            count: result?.brand?.colors.length,
            countLabel: t('count.brand', { n: result?.brand?.colors.length ?? 0 }),
          },
        ]}
        active={readable ? tab : null}
        onSelect={(id) => {
          setLibrary(null);
          setTab(id);
        }}
        panelId="rv-body"
      />

      <main className="rp-body" id="rv-body" aria-busy={view.kind === 'reading'}>
        {view.kind === 'reading' && <Reading done={view.done} t={t} />}
        {(view.kind === 'idle' || view.kind === 'access') && <AccessView keys={keys} t={t} />}
        {view.kind === 'restricted' && <RestrictedView t={t} />}
        {result && tab === 'stack' && empty && (
          <EmptyView host={new URL(result.url).host} waited={result.waited} t={t} />
        )}
        {result && tab === 'stack' && !empty && (
          <StackTab
            result={result}
            t={t}
            onCopy={(text, message) => void copy(text, message)}
            onOpenLibrary={(library) => {
              setLibrary(library);
              setTab('ads');
            }}
          />
        )}
        {result && tab === 'ads' && (
          <AdsTab
            key={result.readAt}
            result={result}
            t={t}
            lang={lang}
            highlight={library}
            onToast={setToast}
          />
        )}
        {result && tab === 'brand' && (
          <BrandTab key={result.readAt} result={result} t={t} onToast={setToast} />
        )}
      </main>
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}
