import { PLATFORM_LIST, SUPPORTED_COUNT } from '@line/core/hitline';
import { useT } from '../../src/useLang.ts';
import { Icon, PlatformBadge } from '../../src/ui.tsx';

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

/** A sample of what Hitline reads, one per group, shown on the first-open screen. */
const SHOWN = ['ga4', 'ads', 'meta', 'tiktok', 'linkedin', 'hotjar', 'amplitude', 'gtm'];

/** While the HAR backfill and the first page read run (under a second). */
export function Loading({ host }: { host: string }) {
  const { t } = useT();
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{host ? t('panel.loading.host', { host }) : t('panel.loading')}</span>
    </div>
  );
}

/** First open, nothing recorded yet: design/hitline/Empty.dc.html plus a live "listening" line. */
export function EmptyState({
  host,
  paused,
  onReload,
  onPlan,
}: {
  host: string;
  paused: boolean;
  onReload: () => void;
  onPlan: () => void;
}) {
  const { t } = useT();
  return (
    <div className="empty">
      <div className="empty-main">
        <div className="empty-ic" aria-hidden="true">
          <span className="halo" />
          <span className="tile">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 11a8 8 0 1 0-2.3 5.7" />
              <path d="M20 4v7h-7" />
            </svg>
          </span>
        </div>
        <h2 className="disp">{t('panel.empty.title')}</h2>
        <p>{host ? t('panel.empty.textHost', { host }) : t('panel.empty.text')}</p>
        <div className="empty-actions">
          <button type="button" className="btn-p btn-l" onClick={onReload}>
            {t('panel.empty.reload')}
          </button>
          <button type="button" className="btn-s btn-l" onClick={onPlan}>
            {t('panel.empty.loadPlan')}
          </button>
        </div>
        <span className="listening" role="status">
          {paused ? (
            <>
              <Icon name="dash" /> {t('panel.empty.paused')}
            </>
          ) : (
            <>
              <span className="rec-dot" aria-hidden="true" /> {t('panel.empty.listening')}
            </>
          )}
        </span>
        <span className="shortcut">
          {t('panel.empty.shortcut')} <kbd className="mono">{isMac ? 'Cmd' : 'Ctrl'}</kbd> +{' '}
          <kbd className="mono">R</kbd>
        </span>
      </div>
      <div className="card watches">
        <div className="eyebrow">{t('panel.empty.watches')}</div>
        {SHOWN.map((id) => (
          <div key={id} className="w-row">
            <PlatformBadge platform={id} />
          </div>
        ))}
        <div className="w-row pf">
          <i className="w-sgtm">
            <Icon name="server" stroke={2.4} />
          </i>
          {t('panel.empty.w.sgtm')}
        </div>
        <p className="w-more">
          {t('panel.empty.more', {
            n: SUPPORTED_COUNT - SHOWN.length,
            total: SUPPORTED_COUNT,
          })}
        </p>
        <p className="w-list">
          {PLATFORM_LIST.filter((p) => !SHOWN.includes(p.id) && p.group !== 'other')
            .slice(0, 60)
            .map((p) => p.name)
            .join(', ')}
        </p>
      </div>
    </div>
  );
}
