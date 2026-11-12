import { PLATFORM_LIST, SUPPORTED_COUNT } from '@line/core/hitline';
import { GRACE_MS, waitLeft, type CaptureStatus } from '../../src/capture/session.ts';
import { ScanSteps, Skeleton, type ScanStep } from '../../src/Scan.tsx';
import { useT } from '../../src/useLang.ts';
import { Icon, PlatformBadge } from '../../src/ui.tsx';

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

/** A sample of what Hitline reads, one per group, shown on the first-open screen. */
const SHOWN = ['ga4', 'ads', 'meta', 'tiktok', 'linkedin', 'hotjar', 'amplitude', 'gtm'];

/**
 * Until the first event or the end of the wait after the page loads: what Hitline is doing,
 * with skeleton rows where the events will land.
 */
export function Loading({
  host,
  status,
  now,
}: {
  host: string;
  status: CaptureStatus;
  now: number;
}) {
  const { t } = useT();
  const loaded = status.loadedAt !== null;
  const left = Math.min(GRACE_MS, waitLeft(status, now));
  const steps: ScanStep[] = [
    {
      label: status.harDone ? t('scan.harDone') : t('scan.har'),
      state: status.harDone ? 'done' : 'busy',
    },
    {
      label: loaded ? t('scan.pageLoaded') : t('scan.pageLoading'),
      state: loaded ? 'done' : 'busy',
    },
    {
      label: t('scan.waiting'),
      state: loaded ? 'busy' : 'wait',
      end: t('scan.waitingS', { n: Math.ceil(left / 1000) }),
    },
  ];
  return (
    <div className="loading-state">
      <ScanSteps
        className="scan-row"
        steps={steps}
        progress={loaded && status.ready ? 1 - left / GRACE_MS : null}
        label={host ? t('panel.loading.host', { host }) : t('panel.loading')}
      />
      <div className="sk-table" aria-hidden="true">
        <div className="th ev-grid">
          <span>{t('events.th.time')}</span>
          <span>{t('events.th.platform')}</span>
          <span>{t('events.th.event')}</span>
          <span>{t('events.th.route')}</span>
          <span>{t('events.th.status')}</span>
        </div>
        {[62, 48, 70, 54].map((w, i) => (
          <div key={i} className="row ev-grid">
            <Skeleton w={56} h={12} />
            <Skeleton w={i % 2 ? 64 : 80} h={20} r={6} />
            <Skeleton w={`${w}%`} h={12} />
            <Skeleton w={58} h={20} r={99} />
            <Skeleton w={i % 2 ? 76 : 92} h={20} r={99} />
          </div>
        ))}
      </div>
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
