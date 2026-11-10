import { useT } from '../../src/useLang.ts';
import { Icon, PlatformBadge } from '../../src/ui.tsx';

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

/** First open: design/hitline/Empty.dc.html. */
export function EmptyState({ onReload, onPlan }: { onReload: () => void; onPlan: () => void }) {
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
        <p>{t('panel.empty.text')}</p>
        <div className="empty-actions">
          <button type="button" className="btn-p btn-l" onClick={onReload}>
            {t('panel.empty.reload')}
          </button>
          <button type="button" className="btn-s btn-l" onClick={onPlan}>
            {t('panel.empty.loadPlan')}
          </button>
        </div>
        <span className="shortcut">
          {t('panel.empty.shortcut')} <kbd className="mono">{isMac ? 'Cmd' : 'Ctrl'}</kbd> +{' '}
          <kbd className="mono">R</kbd>
        </span>
      </div>
      <div className="card watches">
        <div className="eyebrow">{t('panel.empty.watches')}</div>
        <div className="w-row">
          <PlatformBadge platform="ga4" label={t('panel.empty.w.ga4')} />
        </div>
        <div className="w-row">
          <PlatformBadge platform="ads" label={t('panel.empty.w.ads')} />
        </div>
        <div className="w-row">
          <PlatformBadge platform="meta" label={t('panel.empty.w.meta')} />
        </div>
        <div className="w-row">
          <PlatformBadge platform="tiktok" label={t('panel.empty.w.tiktok')} />
        </div>
        <div className="w-row">
          <PlatformBadge platform="gtm" label={t('panel.empty.w.gtm')} />
        </div>
        <div className="w-row pf">
          <i className="w-sgtm">
            <Icon name="server" stroke={2.4} />
          </i>
          {t('panel.empty.w.sgtm')}
        </div>
      </div>
    </div>
  );
}
