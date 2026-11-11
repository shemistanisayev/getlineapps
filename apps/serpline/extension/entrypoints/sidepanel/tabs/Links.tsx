/** Links tab (design/serpline/Links.dc.html): tiles, link check bar, filter chips, list, issue cards. */
import { LINK_CHECK_MAX, type Audit, type CheckedLink } from '@line/core/serpline';
import { CountTile } from '@line/ui/serpline';
import { useState, type ReactNode } from 'react';
import type { T } from '../../../src/i18n/index.ts';
import { IssueCard, StatusPill } from './common.tsx';

type Filter = 'all' | 'issues' | 'internal' | 'external';
export type LinkCheckState = 'idle' | 'running' | 'done' | 'failed';

const isIssue = (l: CheckedLink) =>
  l.kind === 'internal' && (l.state === 'broken' || l.state === 'redirect');

function shortHref(l: CheckedLink, pageUrl: string): string {
  try {
    const u = new URL(l.href);
    const page = new URL(pageUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return l.href;
    return u.origin === page.origin ? u.pathname + u.search + u.hash : u.host + u.pathname;
  } catch {
    return l.href;
  }
}

function LinkStatus({ l, t }: { l: CheckedLink; t: T }) {
  if (l.kind === 'external')
    return (
      <StatusPill tone="mute">{l.nofollow ? t('ln.st.nofollow') : t('ln.st.external')}</StatusPill>
    );
  if (l.kind === 'other') return <StatusPill tone="mute">{t('ln.st.other')}</StatusPill>;
  switch (l.state) {
    case 'broken':
      return (
        <StatusPill tone="bad" icon="x">
          {l.status}
        </StatusPill>
      );
    case 'redirect':
      return (
        <StatusPill tone="warn" icon="arrow">
          {t('ln.st.redirect')}
        </StatusPill>
      );
    case 'failed':
      return <StatusPill tone="warn">{t('ln.st.failed')}</StatusPill>;
    case 'ok':
      return <StatusPill tone="ok">{l.status}</StatusPill>;
    default:
      return <StatusPill tone="mute">{t('ln.st.unchecked')}</StatusPill>;
  }
}

export function LinksTab({
  audit,
  checkState,
  plannedCount,
  onCheck,
  t,
}: {
  audit: Audit;
  checkState: LinkCheckState;
  /** Unique internal URLs the check will request (max 100). */
  plannedCount: number;
  onCheck: () => void;
  t: T;
}) {
  const { links, linkCheck: lc } = audit;
  const rows: CheckedLink[] =
    lc?.links ??
    audit.rendered.links.map((l) => ({ ...l, state: 'unchecked', status: null, target: null }));
  const issueCount = rows.filter(isIssue).length;
  // After a check with problems, the list opens on "Issues" (design: Links).
  const [filter, setFilter] = useState<Filter>(lc && issueCount ? 'issues' : 'all');
  const shown = rows.filter((l) =>
    filter === 'all'
      ? true
      : filter === 'issues'
        ? isIssue(l)
        : filter === 'internal'
          ? l.kind === 'internal'
          : l.kind === 'external',
  );
  const chips: { id: Filter; n: number }[] = [
    { id: 'all', n: links.total },
    { id: 'issues', n: issueCount },
    { id: 'internal', n: links.internal },
    { id: 'external', n: links.external },
  ];
  // Problems first: broken, then redirects, then the rest in page order (design: Links).
  const rank = (l: CheckedLink) =>
    l.kind !== 'internal' ? 2 : l.state === 'broken' ? 0 : l.state === 'redirect' ? 1 : 2;
  const sortedIssues = [...shown].sort((a, b) => rank(a) - rank(b));
  const plural = (n: number, one: 'ln.redirect', many: 'ln.redirects') =>
    t(n === 1 ? one : many, { n });

  let bar: ReactNode;
  if (lc) {
    const parts = [
      t('ln.ok', { n: lc.ok }),
      plural(lc.redirects, 'ln.redirect', 'ln.redirects'),
      t('ln.broken', { n: lc.broken }),
      ...(lc.failed ? [t('ln.failed', { n: lc.failed })] : []),
    ].join(', ');
    const pct = (n: number) => `${lc.checked ? (n / lc.checked) * 100 : 0}%`;
    bar = (
      <div className="sp-check">
        <div className="sp-check-line">
          <span className="sp-check-h">
            {lc.checked === 1 ? t('ln.checked1') : t('ln.checked', { n: lc.checked })}
          </span>
          <span className="sp-check-s">{parts}</span>
        </div>
        <div className="sp-stack" role="img" aria-label={parts}>
          <span style={{ width: pct(lc.ok), background: '#12B76A' }} />
          <span style={{ width: pct(lc.redirects), background: '#F79009' }} />
          <span style={{ width: pct(lc.broken), background: '#D92D20' }} />
          <span style={{ width: pct(lc.failed), background: '#98A2B3' }} />
        </div>
        <span className="sp-note">{t('ln.note')}</span>
      </div>
    );
  } else if (links.internal === 0) {
    bar = (
      <div className="sp-check">
        <span className="sp-note">{t('ln.noInternal')}</span>
      </div>
    );
  } else {
    bar = (
      <div className="sp-check">
        <button
          type="button"
          className="sp-cta sp-check-btn"
          onClick={onCheck}
          disabled={checkState === 'running'}
        >
          {checkState === 'running'
            ? t('ln.checking', { n: links.internal })
            : links.internal === 1
              ? t('ln.checkBtn1')
              : t('ln.checkBtn', { n: links.internal })}
        </button>
        {checkState === 'failed' && (
          <span className="sp-note sp-note--bad" role="status">
            {t('ln.checkFailed')}
          </span>
        )}
        <span className="sp-note">{t('ln.noteBefore')}</span>
        {plannedCount >= LINK_CHECK_MAX && (
          <span className="sp-note">{t('ln.limit', { n: LINK_CHECK_MAX })}</span>
        )}
      </div>
    );
  }

  return (
    <>
      <section className="sl-card sp-ln-top">
        <div className="sp-tiles">
          <CountTile value={links.total} label={t('ln.links')} />
          <CountTile value={links.internal} label={t('ln.internal')} />
          <CountTile value={links.external} label={t('ln.external')} />
          <CountTile value={links.nofollow} label={t('ln.nofollow')} />
        </div>
        {bar}
      </section>

      <div className="sp-chips" role="group" aria-label={t('ln.filters')}>
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`sp-chip ${filter === c.id ? 'on' : ''}`}
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {t(`ln.f.${c.id}`)} <i>{c.n}</i>
          </button>
        ))}
      </div>

      <section className="sl-card sp-list">
        {shown.length === 0 && <p className="sp-empty">{t('ln.empty')}</p>}
        {sortedIssues.map((l, i) => {
          const path = shortHref(l, audit.url);
          return (
            <div key={`${l.path}-${i}`} className={`sp-lrow ${l.state === 'broken' ? 'bad' : ''}`}>
              <div className="sp-lt">
                <b>{l.text || t('ln.noText')}</b>
                <span>
                  {l.state === 'redirect' && l.target
                    ? t('ln.to', { from: path, to: l.target })
                    : path}
                </span>
              </div>
              <LinkStatus l={l} t={t} />
            </div>
          );
        })}
      </section>

      {audit.issues
        .filter((i) => i.tab === 'links')
        .map((i) => (
          <IssueCard key={i.id} issue={i} t={t} />
        ))}
    </>
  );
}
