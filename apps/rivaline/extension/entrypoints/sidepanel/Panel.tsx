import { Logo } from '@line/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { activeTabId, readTab } from '../../src/capture/check.ts';
import type { PageProbe } from '../../src/capture/probe.ts';
import { isScanMessage } from '../../src/messages.ts';
import { actionShortcut } from '../../src/storage.ts';
import { Icon, Keys } from '../../src/ui.tsx';
import { useT } from '../../src/useLang.ts';

/**
 * Step 2 shell (docs/rivaline/PLAN.md): reads the granted tab and shows the Access and Restricted
 * states. The Stack, Ads and Brand tabs replace the "Page read" card in steps 5 and 6.
 */
type View =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'result'; tabId: number; page: PageProbe }
  | { kind: 'access' }
  | { kind: 'restricted' };

const NOT_ON = [
  'panel.restricted.chrome',
  'panel.restricted.store',
  'panel.restricted.extensions',
  'panel.restricted.pdf',
] as const;

export function Panel() {
  const { t } = useT();
  const [view, setView] = useState<View>({ kind: 'idle' });
  const [keys, setKeys] = useState<string[]>([]);
  const busy = useRef<number | null>(null);

  const read = useCallback(async (tabId: number) => {
    if (busy.current === tabId) return;
    busy.current = tabId;
    setView((v) => (v.kind === 'result' && v.tabId === tabId ? v : { kind: 'reading' }));
    const res = await readTab(tabId);
    busy.current = null;
    // The user may have switched tabs while this one was read.
    if ((await activeTabId()) !== tabId) return;
    if (res.ok) setView({ kind: 'result', tabId, page: res.page });
    else setView({ kind: res.reason === 'restricted' ? 'restricted' : 'access' });
  }, []);

  // Opened from the icon or the shortcut: activeTab is granted for the active tab, read it now.
  useEffect(() => {
    void actionShortcut().then(setKeys);
    void activeTabId().then((id) => {
      if (id !== undefined) void read(id);
    });
    const onMessage = (msg: unknown) => {
      if (isScanMessage(msg)) void read(msg.tabId);
    };
    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, [read]);

  // SPEC §3.1 tab changes: another tab, or a new page in this tab, is read again. Same-site
  // navigation keeps activeTab, so it reads; another site turns into Access.
  useEffect(() => {
    const onActivated = ({ tabId }: { tabId: number }) => void read(tabId);
    const onUpdated = (tabId: number, info: { status?: string }) => {
      if (info.status !== 'complete') return;
      void activeTabId().then((id) => {
        if (id === tabId) void read(tabId);
      });
    };
    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onUpdated.addListener(onUpdated);
    return () => {
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [read]);

  const page = view.kind === 'result' ? view.page : null;
  const url = page ? new URL(page.url) : null;

  return (
    <div className="rp">
      <header className="rp-head">
        <Logo brand="rivaline" theme="light" size={24} word />
        {view.kind === 'result' && (
          <button
            type="button"
            className="icon-btn"
            title={t('panel.readAgain')}
            aria-label={t('panel.readAgain')}
            onClick={() => void read(view.tabId)}
          >
            <Icon name="refresh" size={16} stroke={2.2} />
          </button>
        )}
      </header>

      <main className="rp-body">
        {view.kind === 'reading' && (
          <p className="rp-muted" role="status">
            {t('panel.reading')}
          </p>
        )}

        {(view.kind === 'idle' || view.kind === 'access') && (
          <>
            <section className="card rp-call">
              <Logo brand="rivaline" theme="light" size={30} word={false} />
              <h1>{view.kind === 'access' ? t('panel.access.title') : t('panel.idle.title')}</h1>
              <p>{view.kind === 'access' ? t('panel.access.text') : t('panel.idle.text')}</p>
            </section>
            <ol className="card rp-ways">
              <li>
                <b>1</b>
                {t('panel.access.icon')}
              </li>
              <li>
                <b>2</b>
                {keys.length ? (
                  <span>
                    {t('panel.access.keys')} <Keys keys={keys} />
                  </span>
                ) : (
                  t('panel.access.noKeys')
                )}
              </li>
            </ol>
            <p className="rp-muted">{t('panel.access.note')}</p>
          </>
        )}

        {view.kind === 'restricted' && (
          <section className="card rp-call" role="status">
            <h1>{t('panel.restricted.title')}</h1>
            <p>{t('panel.restricted.text')}</p>
            <p className="eyebrow">{t('panel.restricted.worksOn')}</p>
            <ul className="rp-list ok">
              <li>
                <Icon name="check" />
                {t('panel.restricted.web')}
              </li>
            </ul>
            <p className="eyebrow">{t('panel.restricted.notOn')}</p>
            <ul className="rp-list no">
              {NOT_ON.map((k) => (
                <li key={k}>
                  <Icon name="x" />
                  {t(k)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {page && url && (
          <section className="card rp-read" aria-label={t('panel.read.title')}>
            <p className="eyebrow">{t('panel.read.title')}</p>
            <p className="rp-host" title={page.url}>
              <b>{url.host}</b>
              <span>{url.pathname}</span>
            </p>
            <dl>
              <dt>{t('panel.read.page')}</dt>
              <dd data-k="title">{page.title}</dd>
              <dt>{t('panel.read.scripts')}</dt>
              <dd data-k="scripts">{page.scripts}</dd>
              <dt>{t('panel.read.requests')}</dt>
              <dd data-k="resources">{page.resources}</dd>
              <dt>{t('panel.read.state')}</dt>
              <dd data-k="state">
                {page.readyState === 'complete' ? t('panel.read.loaded') : t('panel.read.loading')}
              </dd>
            </dl>
            <p className="rp-muted">{t('panel.read.note')}</p>
          </section>
        )}
      </main>
    </div>
  );
}
