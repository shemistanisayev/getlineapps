import { Logo } from '@line/ui';
import { useState } from 'react';
import { useCapture } from '../../src/capture/useCapture.ts';
import { downloadReport } from '../../src/pdf.ts';
import { hitlineReport } from '../../src/report.ts';
import { useT } from '../../src/useLang.ts';
import { EmptyState } from './EmptyState.tsx';
import { EventsTab } from './EventsTab.tsx';
import { AttributionTab } from './AttributionTab.tsx';
import { ConsentTab } from './ConsentTab.tsx';
import { GtmTab } from './GtmTab.tsx';
import { PlanTab } from './PlanTab.tsx';

export const TABS = ['events', 'gtm', 'consent', 'attribution', 'plan'] as const;
export type Tab = (typeof TABS)[number];

/** DevTools panel: PanelHeader + the active tab (design/hitline/PanelHeader and the tab artboards). */
export function Panel() {
  const { t, lang } = useT();
  const [tab, setTab] = useState<Tab>('events');
  const [pdf, setPdf] = useState<'idle' | 'busy' | 'error'>('idle');
  const { audit, empty, reload, clear, plan, savePlan, removePlan } = useCapture();
  const counts = audit.counts;
  const warn: Record<Tab, boolean> = {
    events: false,
    gtm: false,
    consent: counts.consent > 0,
    attribution: counts.attribution > 0,
    plan: counts.plan > 0,
  };

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
              <span className={`ph-badge${warn[id] ? ' warn' : ''}`}>{empty ? 0 : counts[id]}</span>
            </button>
          ))}
        </nav>
        <div className="ph-grow" />
        <div className="ph-actions">
          <span className="rec-pill">
            <span className="rec-dot" aria-hidden="true" />
            {t('panel.recording')}
          </span>
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
            {t('panel.auditPdf')}
          </button>
        </div>
      </header>
      <main className="pane" id={`pane-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'plan' ? (
          <PlanTab audit={audit} plan={plan} onSave={savePlan} onRemove={removePlan} />
        ) : empty ? (
          <EmptyState onReload={reload} onPlan={() => setTab('plan')} />
        ) : tab === 'events' ? (
          <EventsTab audit={audit} />
        ) : tab === 'gtm' ? (
          <GtmTab audit={audit} />
        ) : tab === 'consent' ? (
          <ConsentTab audit={audit} />
        ) : (
          <AttributionTab audit={audit} />
        )}
      </main>
    </div>
  );
}
