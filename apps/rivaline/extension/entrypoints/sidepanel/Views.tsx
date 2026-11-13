import { contactUrl } from '@line/core/site';
import { Logo } from '@line/ui';
import { RvCard } from '@line/ui/rivaline';
import type { ScanStep } from '../../src/capture/scan.ts';
import type { MessageKey, T } from '../../src/i18n/index.ts';
import { Icon, Keys } from '../../src/ui.tsx';

const CTA = contactUrl({ source: 'rivaline', medium: 'extension', campaign: 'panel_cta' });

const STEPS: Array<{ id: ScanStep; key: MessageKey }> = [
  { id: 'load', key: 'read.load' },
  { id: 'tools', key: 'read.tools' },
  { id: 'brand', key: 'read.brand' },
  { id: 'logo', key: 'read.logo' },
];

/**
 * While a page is read: each step with its own state, a progress bar and a skeleton of the Stack
 * tab, so a slow page never looks like a broken panel (carried over from Hitline and Serpline).
 */
export function Reading({ done, t }: { done: ScanStep[]; t: T }) {
  const next = STEPS.find((s) => !done.includes(s.id))?.id;
  return (
    <>
      <section
        className="card rp-scan"
        role="status"
        aria-live="polite"
        aria-label={t('panel.reading')}
      >
        {STEPS.map((s) => {
          const state = done.includes(s.id) ? 'done' : s.id === next ? 'busy' : 'wait';
          return (
            <div key={s.id} className={`rp-step is-${state}`}>
              <span className="rp-step-ic" aria-hidden="true">
                {state === 'done' ? (
                  <Icon name="check" size={14} />
                ) : state === 'busy' ? (
                  <span className="rp-spin" />
                ) : (
                  <span className="rp-ring" />
                )}
              </span>
              {t(s.key)}
            </div>
          );
        })}
        <div className="rp-progress" aria-hidden="true">
          <i style={{ width: `${Math.max(8, Math.round((done.length / STEPS.length) * 100))}%` }} />
        </div>
      </section>
      <div className="rp-sk-block" aria-hidden="true">
        <span className="rp-sk" style={{ height: 132, borderRadius: 16 }} />
        <span className="rp-sk" style={{ height: 44, borderRadius: 12 }} />
        <div className="rp-sk-row">
          <span className="rp-sk" style={{ height: 30, width: 70 }} />
          <span className="rp-sk" style={{ height: 30, width: 110 }} />
          <span className="rp-sk" style={{ height: 30, width: 90 }} />
        </div>
        <span className="rp-sk" style={{ height: 220, borderRadius: 14 }} />
      </div>
    </>
  );
}

/** Access (design: Access): the tab was not granted. */
export function AccessView({ keys, t }: { keys: string[]; t: T }) {
  return (
    <>
      <section className="card rp-call">
        <span className="rp-ping">
          <Logo brand="rivaline" theme="light" size={30} word={false} />
        </span>
        <h1>{t('panel.access.title')}</h1>
        <p>{t('panel.access.text')}</p>
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
  );
}

const NOT_ON: MessageKey[] = [
  'panel.restricted.chrome',
  'panel.restricted.store',
  'panel.restricted.extensions',
  'panel.restricted.pdf',
];

/** Restricted (design: Restricted): Chrome pages, the Web Store, other extensions, PDFs. */
export function RestrictedView({ t }: { t: T }) {
  return (
    <section className="card rp-call" role="status">
      <h1>{t('panel.restricted.title')}</h1>
      <p>{t('panel.restricted.text')}</p>
      <h2 className="eyebrow">{t('panel.restricted.worksOn')}</h2>
      <ul className="rp-list ok">
        <li>
          <Icon name="check" />
          {t('panel.restricted.web')}
        </li>
      </ul>
      <h2 className="eyebrow">{t('panel.restricted.notOn')}</h2>
      <ul className="rp-list no">
        {NOT_ON.map((k) => (
          <li key={k}>
            <Icon name="x" />
            {t(k)}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Empty (design: Empty): the page was read after it loaded and has no marketing tools. */
export function EmptyView({ host, waited, t }: { host: string; waited: number; t: T }) {
  return (
    <>
      <RvCard className="rp-empty">
        <span className="rp-empty-logo">
          <Logo brand="rivaline" theme="light" size={30} word={false} />
        </span>
        <h1>{t('empty.title')}</h1>
        <p>{t('empty.text', { host })}</p>
      </RvCard>
      <div className="rp-checked">
        <h2 className="eyebrow">{t('empty.checked')}</h2>
        <ul className="rp-tags">
          {(['empty.t1', 'empty.t2', 'empty.t3', 'empty.t4', 'empty.t5'] as const).map((k) => (
            <li key={k} className="mono">
              {t(k)}
            </li>
          ))}
        </ul>
        <p className="rp-muted">{t('empty.still')}</p>
        <p className="rp-muted">{t('empty.waited', { s: waited })}</p>
      </div>
      <div className="rp-zero">
        <div>
          <b>{t('empty.ctaTitle')}</b>
          <span>{t('empty.ctaText')}</span>
        </div>
        <a className="rv-btn rv-btn--ink" href={CTA} target="_blank" rel="noreferrer">
          {t('cta.touch')}
        </a>
      </div>
    </>
  );
}
