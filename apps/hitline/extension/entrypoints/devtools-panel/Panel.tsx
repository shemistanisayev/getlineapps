import { Logo } from '@line/ui';
import { useState } from 'react';
import type { MessageKey } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';

const TABS = ['events', 'gtm', 'consent', 'attribution', 'plan'] as const;
type Tab = (typeof TABS)[number];

/** Step 2 scaffold: header with tabs and the first-open state. Tabs get content from step 4. */
export function Panel() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('events');

  const reload = () => {
    // Only available inside DevTools; the panel page opened directly has no inspected window.
    browser.devtools?.inspectedWindow.reload({});
  };

  return (
    <div className="panel">
      <header className="ph">
        <div className="ph-logo">
          <Logo brand="hitline" theme="light" size={22} word />
        </div>
        <nav aria-label={t('panel.tabsLabel')} className="ph-tabs" role="tablist">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className="ph-tab"
              onClick={() => setTab(id)}
            >
              {t(`panel.tab.${id}` as MessageKey)}
              <span className="ph-badge">0</span>
            </button>
          ))}
        </nav>
        <div className="ph-grow" />
        <div className="ph-actions">
          <button type="button" className="btn-s">
            {t('panel.clear')}
          </button>
          <button type="button" className="btn-p">
            {t('panel.auditPdf')}
          </button>
        </div>
      </header>
      <section className="empty" role="tabpanel">
        <h2 className="disp">{t('panel.empty.title')}</h2>
        <p>{t('panel.empty.text')}</p>
        <button type="button" className="btn-p btn-l" onClick={reload}>
          {t('panel.empty.reload')}
        </button>
      </section>
    </div>
  );
}
