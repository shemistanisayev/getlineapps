import { Logo } from '@line/ui';
import { hostOf } from '@line/core/hitline';
import { useEffect, useState } from 'react';
import { inspectedTabId, useCapture } from '../../src/capture/useCapture.ts';
import { downloadReport } from '../../src/pdf.ts';
import { hitlineReport } from '../../src/report.ts';
import { takeFocus, type Focus } from '../../src/storage.ts';
import { useT } from '../../src/useLang.ts';
import { Icon } from '../../src/ui.tsx';
import { EmptyState, Loading } from './EmptyState.tsx';
import { EventsTab } from './EventsTab.tsx';
import { AttributionTab } from './AttributionTab.tsx';
import { ConsentTab } from './ConsentTab.tsx';
import { GtmTab } from './GtmTab.tsx';
import { PlanTab } from './PlanTab.tsx';

export const TABS = ['events', 'gtm', 'consent', 'attribution', 'plan'] as const;
export type Tab = (typeof TABS)[number];

/** The popup asked to show something: switch tab, and pass the event on to the Events tab. */
function useFocus(setTab: (t: Tab) => void): Focus | null {
  const [focus, setFocus] = useState<Focus | null>(null);
  useEffect(() => {
    const id = inspectedTabId();
    const check = () =>
      void takeFocus(id).then((f) => {
        if (!f) return;
        setTab(f.tab);
        setFocus(f);
      });
    check();
    const onChange = (_c: unknown, area: string) => area === 'session' && check();
    browser.storage.onChanged.addListener(onChange);
    return () => browser.storage.onChanged.removeListener(onChange);
  }, [setTab]);
  return focus;
}

/** DevTools panel: PanelHeader + the active tab (design/hitline/PanelHeader and the tab artboards). */
export function Panel() {
  const { t, lang } = useT();
  const [tab, setTab] = useState<Tab>('events');
  const [pdf, setPdf] = useState<'idle' | 'busy' | 'error'>('idle');
  const { audit, empty, status, reload, clear, setPaused, plan, savePlan, removePlan } =
    useCapture();
  const focus = useFocus(setTab);
  const counts = audit.counts;
  const warn: Record<Tab, boolean> = {
    events: false,
    gtm: false,
    consent: counts.consent > 0,
    attribution: counts.attribution > 0,
    plan: counts.plan > 0,
  };
  const current = hostOf(audit.currentUrl);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const next = TABS[(i + d + TABS.length) % TABS.length]!;
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div className="panel">
      <header className="ph">
        <div className="ph-logo">
          <Logo brand="hitline" theme="light" size={22} word />
        </div>
        <nav aria-label={t('panel.tabsLabel')} className="ph-tabs" role="tablist">
          {TABS.map((id, i) => (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`pane-${id}`}
              tabIndex={tab === id ? 0 : -1}
              className="ph-tab"
              onClick={() => setTab(id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {t(`panel.tab.${id}`)}
              <span
                key={`${id}-${empty ? 0 : counts[id]}`}
                className={`ph-badge${warn[id] ? ' warn' : ''}${id === 'events' && !empty ? ' bump' : ''}`}
              >
                {empty ? 0 : counts[id]}
              </span>
            </button>
          ))}
        </nav>
        <div className="ph-grow" />
        <div className="ph-actions">
          {current && (
            <span className="site-chip" title={audit.currentUrl}>
              <Icon name="globe" size={13} stroke={2.2} />
              <span className="mono">{current}</span>
              {audit.sites.length > 1 && (
                <span className="site-more" title={audit.sites.join(', ')}>
                  {t('panel.sites', { n: audit.sites.length })}
                </span>
              )}
            </span>
          )}
          <button
            type="button"
            className={`rec-pill${status.paused ? ' is-paused' : ''}`}
            aria-pressed={!status.paused}
            title={status.paused ? t('panel.resumeHint') : t('panel.pauseHint')}
            onClick={() => setPaused(!status.paused)}
          >
            {status.paused ? (
              <Icon name="play" size={10} stroke={3} />
            ) : (
              <span className="rec-dot" aria-hidden="true" />
            )}
            {status.paused ? t('panel.paused') : t('panel.recording')}
          </button>
          <button type="button" className="btn-s" onClick={clear}>
            {t('panel.clear')}
          </button>
          <button
            type="button"
            className="btn-p"
            disabled={empty || pdf === 'busy'}
            aria-busy={pdf === 'busy'}
            title={pdf === 'error' ? t('report.error') : undefined}
            onClick={() => {
              setPdf('busy');
              downloadReport((fonts) => hitlineReport(audit, t, lang, fonts)).then(
                () => setPdf('idle'),
                () => setPdf('error'),
              );
            }}
          >
            {pdf === 'busy' ? t('panel.pdfBusy') : t('panel.auditPdf')}
          </button>
        </div>
      </header>
      {status.openedAfterLoad && !empty && tab !== 'plan' && (
        <div className="late-bar" role="status">
          <Icon name="alert" />
          <span>{t('panel.late')}</span>
          <button type="button" className="btn-s sm" onClick={reload}>
            {t('panel.empty.reload')}
          </button>
        </div>
      )}
      <main className="pane" id={`pane-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'plan' ? (
          <PlanTab audit={audit} plan={plan} onSave={savePlan} onRemove={removePlan} />
        ) : empty && !status.ready ? (
          <Loading host={current} />
        ) : empty ? (
          <EmptyState
            host={current}
            paused={status.paused}
            onReload={reload}
            onPlan={() => setTab('plan')}
          />
        ) : tab === 'events' ? (
          <EventsTab key={focus?.at ?? 'events'} audit={audit} focus={focus} />
        ) : tab === 'gtm' ? (
          <GtmTab audit={audit} onReload={reload} />
        ) : tab === 'consent' ? (
          <ConsentTab audit={audit} />
        ) : (
          <AttributionTab audit={audit} />
        )}
      </main>
    </div>
  );
}
