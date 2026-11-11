import { Logo } from '@line/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { activeTabId, checkTab, requestSite, type CheckFailure } from '../../src/capture/check.ts';
import type { FetchedFile, PageRead } from '../../src/capture/inject.ts';
import type { T } from '../../src/i18n/index.ts';
import { isCheckMessage } from '../../src/messages.ts';
import { useT } from '../../src/useLang.ts';

/**
 * Step 2 shell (docs/serpline/PLAN.md): runs the check and shows what was read, plus the Stale,
 * no-access and restricted states. The real tabs replace the "Page read" card in steps 3 to 6.
 */
type View =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'result'; tabId: number; page: PageRead; stale: boolean }
  | { kind: 'failed'; reason: CheckFailure };

function size(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function fileLine(f: FetchedFile, t: T, lines = false): string {
  if (f.status === 0) return t('panel.read.failed');
  if (lines) return t('panel.read.lines', { status: f.status, n: f.text.split(/\r?\n/).length });
  return t('panel.read.status', { status: f.status, size: size(f.text.length) });
}

export function Panel() {
  const { t } = useT();
  const [view, setView] = useState<View>({ kind: 'idle' });
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
  const url = page ? new URL(page.url) : null;
  const stale = view.kind === 'result' && view.stale;

  return (
    <div className="sp">
      <header className="sp-row">
        <Logo brand="serpline" size={22} word={false} />
        <p className="sp-page" title={page?.url}>
          <b>{url ? url.host : 'Serpline'}</b>
          {url && <span>{url.pathname + url.search}</span>}
        </p>
        {view.kind === 'result' && !stale && (
          <button type="button" className="btn btn-s" onClick={() => void run(view.tabId)}>
            {t('panel.checkAgain')}
          </button>
        )}
      </header>

      <main className="sp-body">
        {view.kind === 'checking' && <p className="sp-muted">{t('panel.checking')}</p>}

        {(view.kind === 'idle' ||
          stale ||
          (view.kind === 'failed' && view.reason === 'noAccess')) && (
          <section className="card sp-call">
            <h1>{stale ? t('panel.stale.title') : t('panel.idle.title')}</h1>
            <p>
              {stale
                ? t('panel.stale.text')
                : view.kind === 'failed'
                  ? t('panel.noAccess')
                  : t('panel.idle.text')}
            </p>
            <button type="button" className="btn btn-p" onClick={() => void checkThis()}>
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
          <section className="card sp-call" role="status">
            <h1>{t('panel.restricted.title')}</h1>
            <p>{t('panel.restricted.text')}</p>
          </section>
        )}

        {page && (
          <section className="card sp-read" aria-label={t('panel.read.title')}>
            <p className="eyebrow">{stale ? t('panel.previous') : t('panel.read.title')}</p>
            <dl>
              <dt>{t('panel.read.rawHtml')}</dt>
              <dd data-k="raw">{fileLine(page.raw, t)}</dd>
              <dt>{t('panel.read.rendered')}</dt>
              <dd data-k="h1">{page.h1Count}</dd>
              <dt className="mono">{t('panel.read.robots')}</dt>
              <dd data-k="robots">{fileLine(page.robots, t, true)}</dd>
              <dt className="mono">{t('panel.read.llms')}</dt>
              <dd data-k="llms">{fileLine(page.llms, t)}</dd>
            </dl>
            <p className="sp-muted">{t('panel.read.note')}</p>
          </section>
        )}
      </main>
    </div>
  );
}
