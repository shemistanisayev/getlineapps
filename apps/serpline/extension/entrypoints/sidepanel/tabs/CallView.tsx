/**
 * Panel states without a result on screen (design/serpline/Stale.dc.html): a new page was opened
 * (stale), nothing checked yet (idle), no access to this tab yet, or a page Chrome never lets
 * extensions read (restricted).
 */
import type { MessageKey, T } from '../../../src/i18n/index.ts';

export type CallKind = 'stale' | 'idle' | 'noAccess' | 'restricted';

const CHECKS: MessageKey[] = [
  'call.c.titleDesc',
  'call.c.canonical',
  'call.c.headings',
  'call.c.alt',
  'call.c.links',
  'call.c.schema',
  'call.c.render',
  'call.c.bots',
  'call.c.llms',
];

const TEXT: Record<CallKind, { title: MessageKey; text: MessageKey }> = {
  stale: { title: 'panel.stale.title', text: 'panel.stale.text' },
  idle: { title: 'panel.idle.title', text: 'panel.idle.text' },
  noAccess: { title: 'panel.idle.title', text: 'panel.noAccess' },
  restricted: { title: 'panel.restricted.title', text: 'panel.restricted.text' },
};

export function CallView({
  kind,
  previous,
  onCheck,
  onShowPrevious,
  t,
}: {
  kind: CallKind;
  previous: { score: number; path: string } | null;
  onCheck: () => void;
  onShowPrevious: () => void;
  t: T;
}) {
  const restricted = kind === 'restricted';
  return (
    <>
      <section className="sl-card sp-call" role={restricted ? 'status' : undefined}>
        <span className="sp-call-ic" aria-hidden="true">
          {restricted ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5M9 13h6M9 17h4" />
            </svg>
          )}
        </span>
        <div className="sp-call-x">
          <h1>{t(TEXT[kind].title)}</h1>
          <p>{t(TEXT[kind].text)}</p>
        </div>
        {!restricted && (
          <button type="button" className="sp-cta" onClick={onCheck}>
            {t('panel.checkThis')}
          </button>
        )}
        <p className="sp-muted">
          {t('panel.shortcut.before')} <kbd className="mono">Alt</kbd> +{' '}
          <kbd className="mono">Shift</kbd> + <kbd className="mono">S</kbd>{' '}
          {t('panel.shortcut.after')}
        </p>
      </section>

      {previous && (
        <button type="button" className="sl-card sp-prev" onClick={onShowPrevious}>
          <span
            className="sp-prev-score"
            aria-label={t('sum.scoreAria', { score: previous.score })}
          >
            {previous.score}
          </span>
          <span className="sp-prev-x">
            <span>{t('panel.previous')}</span>
            <span className="mono">{previous.path}</span>
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}

      <div className="sp-checks">
        <h2 className="sl-eyebrow">{t('call.checks')}</h2>
        <ul>
          {CHECKS.map((k) => (
            <li key={k} className="sp-chk">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {t(k)}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
