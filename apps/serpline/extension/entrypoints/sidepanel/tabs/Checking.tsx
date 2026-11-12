import type { T } from '../../../src/i18n/index.ts';
import type { ReadStep } from '../../../src/messages.ts';
import { Icon } from '../../../src/ui.tsx';

const STEPS: { id: ReadStep; key: 'chk.rendered' | 'chk.raw' | 'chk.files' | 'chk.live' }[] = [
  { id: 'rendered', key: 'chk.rendered' },
  { id: 'raw', key: 'chk.raw' },
  { id: 'files', key: 'chk.files' },
  { id: 'live', key: 'chk.live' },
];

/**
 * While the page is read: each part of the check with its own state, and a skeleton of the result,
 * so a slow page never looks like a broken panel. Raw HTML and the two files load in parallel once
 * the rendered page is read.
 */
export function Checking({ done, t }: { done: ReadStep[]; t: T }) {
  const rendered = done.includes('rendered');
  return (
    <>
      <section
        className="sl-card sp-scan"
        role="status"
        aria-live="polite"
        aria-label={t('panel.checking')}
      >
        {STEPS.map((s) => {
          // The live step starts once the raw HTML and the files are in.
          const ready = s.id === 'live' ? done.includes('raw') && done.includes('files') : rendered;
          const state = done.includes(s.id)
            ? 'done'
            : s.id === 'rendered' || ready
              ? 'busy'
              : 'wait';
          return (
            <div key={s.id} className={`sp-scan-step is-${state}`}>
              <span className="sp-scan-ic" aria-hidden="true">
                {state === 'done' ? (
                  <Icon name="check" size={14} />
                ) : state === 'busy' ? (
                  <span className="sp-spin" />
                ) : (
                  <span className="sp-ring" />
                )}
              </span>
              {t(s.key)}
            </div>
          );
        })}
        <div className="sp-progress" aria-hidden="true">
          <i
            className={done.length ? '' : 'is-idle'}
            style={
              done.length
                ? { width: `${Math.round((done.length / STEPS.length) * 100)}%` }
                : undefined
            }
          />
        </div>
      </section>
      <div className="sp-sk-block" aria-hidden="true">
        <span className="sp-sk" style={{ height: 112, borderRadius: 14 }} />
        <div className="sp-sk-row">
          <span className="sp-sk" style={{ height: 30 }} />
          <span className="sp-sk" style={{ height: 30 }} />
          <span className="sp-sk" style={{ height: 30 }} />
          <span className="sp-sk" style={{ height: 30 }} />
        </div>
        <span className="sp-sk" style={{ height: 14, width: '72%' }} />
        <span className="sp-sk" style={{ height: 14, width: '54%' }} />
        <span className="sp-sk" style={{ height: 14, width: '64%' }} />
      </div>
    </>
  );
}
