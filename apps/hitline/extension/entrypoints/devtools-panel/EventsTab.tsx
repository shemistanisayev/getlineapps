import {
  get,
  hitConsentStatus,
  hostOf,
  platformOrder,
  stateAt,
  CONSENT_SIGNALS,
  type Audit,
  type Hit,
  type HitConsentStatus,
  type Issue,
  type Platform,
} from '@line/core/hitline';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { issueText } from '../../src/issue-text.ts';
import type { T } from '../../src/i18n/index.ts';
import type { Focus } from '../../src/storage.ts';
import { useT } from '../../src/useLang.ts';
import { fmtTime, Icon, money, Pill, PlatformBadge, platformName } from '../../src/ui.tsx';

/** A value issue on another platform this close in time counts as "the same click". */
const SAME_CLICK_MS = 1500;
/** Chip order: the design's four ad and analytics platforms first, then the registry order. */
const FIRST = ['ga4', 'meta', 'tiktok', 'ads', 'datalayer'];
const chipOrder = (p: string) => (FIRST.includes(p) ? FIRST.indexOf(p) - 100 : platformOrder(p));
/** How long a new row stays highlighted. */
const NEW_MS = 2500;

type RowStatus = {
  tone: 'ok' | 'bad' | 'warn' | 'mute';
  label: string;
  icon: 'check' | 'alert' | 'dash';
};

function rowStatus(
  hit: Hit,
  issueIds: Map<string, Issue[]>,
  consent: HitConsentStatus,
  t: T,
): RowStatus {
  if (hit.platform === 'other') return { tone: 'mute', label: t('status.other'), icon: 'dash' };
  const own = issueIds.get(hit.id) ?? [];
  if (own.some((i) => i.id === 'PII_EMAIL'))
    return { tone: 'bad', label: t('status.pii'), icon: 'alert' };
  if (own.some((i) => i.id === 'VALUE_MISSING'))
    return { tone: 'bad', label: t('status.noValue'), icon: 'alert' };
  if (consent === 'before_consent')
    return { tone: 'bad', label: t('status.beforeConsent'), icon: 'alert' };
  if (consent === 'after_reject')
    return { tone: 'bad', label: t('status.afterReject'), icon: 'alert' };
  if (own.some((i) => i.id === 'DUPLICATE_EVENT'))
    return { tone: 'warn', label: t('status.duplicate'), icon: 'alert' };
  if (own.some((i) => i.id === 'INTERNAL_EVENTS'))
    return { tone: 'warn', label: t('status.internal'), icon: 'alert' };
  if (own.some((i) => i.id === 'PURCHASE_NO_ID'))
    return { tone: 'warn', label: t('status.noId'), icon: 'alert' };
  if (consent === 'mismatch') return { tone: 'warn', label: t('status.mismatch'), icon: 'alert' };
  return { tone: 'ok', label: t('status.ok'), icon: 'check' };
}

function RouteChip({ hit, t, via = false }: { hit: Hit; t: T; via?: boolean }) {
  if (hit.route === 'sgtm')
    return (
      <Pill tone="pur" icon="server">
        {via ? t('route.viaSgtm') : t('route.sgtm')}
      </Pill>
    );
  return <Pill tone="mute">{hit.route === 'page' ? t('route.page') : t('route.browser')}</Pill>;
}

function matches(hit: Hit, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    hit.event.toLowerCase().includes(s) ||
    (hit.account ?? '').toLowerCase().includes(s) ||
    hit.params.some((p) => p.key.toLowerCase().includes(s) || p.value.toLowerCase().includes(s))
  );
}

/** Ids that appeared since the last render, highlighted for a moment. */
function useNewIds(ids: string[]): Set<string> {
  const known = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!known.current) {
      known.current = new Set(ids);
      return undefined;
    }
    const added = ids.filter((id) => !known.current!.has(id));
    for (const id of added) known.current.add(id);
    if (!added.length) return undefined;
    setFresh((prev) => new Set([...prev, ...added]));
    const timer = setTimeout(
      () => setFresh((prev) => new Set([...prev].filter((id) => !added.includes(id)))),
      NEW_MS,
    );
    return () => clearTimeout(timer);
  }, [ids]);
  return fresh;
}

/** Events tab: design/hitline/Events.dc.html. Newest first by default. */
/** The event the popup asked for: same platform and name, closest in time. */
function focusMatch(audit: Audit, focus?: Focus | null): string | null {
  if (!focus?.event) return null;
  const best = audit.events
    .filter((h) => h.platform === focus.platform && h.event === focus.event)
    .sort((a, b) => Math.abs(a.time - (focus.time ?? 0)) - Math.abs(b.time - (focus.time ?? 0)))[0];
  return best?.id ?? null;
}

export function EventsTab({ audit, focus }: { audit: Audit; focus?: Focus | null }) {
  const { t } = useT();
  const [filter, setFilter] = useState<Platform | 'all'>('all');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string | null>(() => focusMatch(audit, focus));
  const [newestFirst, setNewestFirst] = useState(true);
  /** Event ids present when the list was scrolled away from the top. */
  const [seenAtScroll, setSeenAtScroll] = useState<Set<string> | null>(null);
  const list = useRef<HTMLDivElement>(null);

  const issueIds = useMemo(() => {
    const m = new Map<string, Issue[]>();
    for (const i of audit.issues) for (const id of i.evidence) m.set(id, [...(m.get(id) ?? []), i]);
    return m;
  }, [audit]);
  const valueIds = useMemo(
    () => new Set(audit.issues.filter((i) => i.id === 'VALUE_MISSING').flatMap((i) => i.evidence)),
    [audit],
  );
  const byId = useMemo(() => new Map(audit.events.map((h) => [h.id, h])), [audit]);

  /** The value issue this hit belongs to: itself, or another platform on the same click. */
  const linked = (h: Hit): { self: boolean; hit: Hit } | null => {
    if (valueIds.has(h.id)) return { self: true, hit: h };
    if (!get(h.params, 'value')) return null;
    for (const id of valueIds) {
      const v = byId.get(id);
      if (v && v.platform !== h.platform && Math.abs(v.time - h.time) <= SAME_CLICK_MS)
        return { self: false, hit: v };
    }
    return null;
  };

  const counts = [...new Set(audit.events.map((e) => e.platform))]
    .sort((a, b) => chipOrder(a) - chipOrder(b))
    .map((p) => ({ p, n: audit.events.filter((e) => e.platform === p).length }));
  const ordered = newestFirst ? [...audit.events].reverse() : audit.events;
  const rows = ordered.filter(
    (e) => (filter === 'all' || e.platform === filter) && matches(e, query),
  );
  const fresh = useNewIds(useMemo(() => audit.events.map((e) => e.id), [audit]));

  // The popup asked for one event: scroll to it once (picked in the initial state above).
  useEffect(() => {
    if (picked) document.getElementById(`ev-${picked}`)?.scrollIntoView({ block: 'center' });
    // Only on mount: later picks come from clicks and keys, which scroll themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrolled down in "newest first": new rows land above, so count them in a button.
  const unseen =
    newestFirst && seenAtScroll ? audit.events.filter((e) => !seenAtScroll.has(e.id)).length : 0;

  const fallback =
    audit.events.find((h) => h.platform !== 'datalayer' && linked(h) && !valueIds.has(h.id)) ??
    rows[0];
  const selected =
    rows.find((r) => r.id === picked) ?? (fallback && rows.includes(fallback) ? fallback : rows[0]);

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!d || !selected) return;
    e.preventDefault();
    const i = rows.indexOf(selected);
    const next = rows[Math.max(0, Math.min(rows.length - 1, i + d))];
    if (next) {
      setPicked(next.id);
      document.getElementById(`ev-${next.id}`)?.scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <div className="ev">
      <div className="ev-bar">
        <div className="chips" role="group" aria-label={t('events.filtersLabel')}>
          <button
            type="button"
            className={`chip${filter === 'all' ? ' on' : ''}`}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            {t('events.all')} <span className="n">{audit.events.length}</span>
          </button>
          {counts.map(({ p, n }) => (
            <button
              key={p}
              type="button"
              className={`chip pfchip${filter === p ? ' on' : ''}`}
              aria-pressed={filter === p}
              onClick={() => setFilter(p)}
            >
              <PlatformBadge platform={p} />
              <span className="n">{n}</span>
            </button>
          ))}
        </div>
        <div className="ph-grow" />
        <label className="search">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#667085"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            placeholder={t('events.search')}
            aria-label={t('events.search')}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="ev-body">
        <div className="ev-list">
          <div className="th ev-grid">
            <button
              type="button"
              className="th-sort"
              aria-label={`${t('events.th.time')}: ${newestFirst ? t('events.sort.newest') : t('events.sort.oldest')}`}
              title={newestFirst ? t('events.sort.newest') : t('events.sort.oldest')}
              onClick={() => setNewestFirst((v) => !v)}
            >
              {t('events.th.time')} <span aria-hidden="true">{newestFirst ? '↓' : '↑'}</span>
            </button>
            <span>{t('events.th.platform')}</span>
            <span>{t('events.th.event')}</span>
            <span>{t('events.th.route')}</span>
            <span>{t('events.th.status')}</span>
          </div>
          {unseen > 0 && (
            <button
              type="button"
              className="new-pill"
              onClick={() => {
                list.current?.scrollTo({ top: 0, behavior: 'smooth' });
                setSeenAtScroll(null);
              }}
            >
              ↑ {t(unseen === 1 ? 'events.newOne' : 'events.newMany', { n: unseen })}
            </button>
          )}
          <div
            ref={list}
            className="ev-rows"
            role="listbox"
            aria-label={t('events.listLabel')}
            tabIndex={0}
            aria-activedescendant={selected ? `ev-${selected.id}` : undefined}
            onKeyDown={onKey}
            onScroll={(e) => {
              const top = (e.target as HTMLDivElement).scrollTop;
              if (top < 20) setSeenAtScroll(null);
              else if (top > 40 && !seenAtScroll)
                setSeenAtScroll(new Set(audit.events.map((x) => x.id)));
            }}
          >
            {rows.length === 0 && <p className="ev-none">{t('events.noMatch')}</p>}
            {rows.map((h) => {
              const st = rowStatus(h, issueIds, hitConsentStatus(audit.consent.model, h), t);
              const on = h === selected;
              return (
                <div
                  key={h.id}
                  id={`ev-${h.id}`}
                  role="option"
                  aria-selected={on}
                  className={`row ev-grid${on ? ' on' : ''}${st.tone === 'bad' && !on ? ' badrow' : ''}${fresh.has(h.id) ? ' is-new' : ''}`}
                  onClick={() => setPicked(h.id)}
                >
                  <span className="mono tm" title={h.approx ? t('events.approx') : undefined}>
                    {h.approx ? '≈ ' : ''}
                    {fmtTime(h.time)}
                  </span>
                  <PlatformBadge platform={h.platform} />
                  <span className="mono evn">{h.event}</span>
                  <RouteChip hit={h} t={t} />
                  <Pill tone={st.tone} icon={st.icon}>
                    {st.label}
                  </Pill>
                </div>
              );
            })}
          </div>
        </div>
        {selected && (
          <Detail
            hit={selected}
            audit={audit}
            linked={linked(selected)}
            issues={(issueIds.get(selected.id) ?? []).filter((i) => i.id !== 'VALUE_MISSING')}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

/** The request line, percent-decoded for reading, with the host in bold. */
function hostBold(raw: string, host: string) {
  let url = raw;
  try {
    url = decodeURI(raw).replace(/%2F/gi, '/').replace(/%3A/gi, ':');
  } catch {
    // Keep the raw URL when it is not valid percent-encoding.
  }
  const at = url.indexOf(host);
  if (at < 0) return url;
  return (
    <>
      {url.slice(0, at)}
      <b>{host}</b>
      {url.slice(at + host.length)}
    </>
  );
}

function ConsentCard({ hit, audit, t }: { hit: Hit; audit: Audit; t: T }) {
  const status = hitConsentStatus(audit.consent.model, hit);
  if (hit.route === 'page' || hit.platform === 'other') return null;
  const state = stateAt(audit.consent.model, hit.time);
  const granted = CONSENT_SIGNALS.filter((s) => state[s] === 'granted').slice(0, 2);
  const detail = [granted.join(', '), hit.gcs ? `gcs ${hit.gcs}` : ''].filter(Boolean).join(', ');
  const map: Record<
    HitConsentStatus,
    {
      tone: 'ok' | 'bad' | 'warn' | 'mute';
      key: Parameters<T>[0];
      icon: 'check' | 'alert' | 'dash';
    }
  > = {
    granted: { tone: 'ok', key: 'consent.granted', icon: 'check' },
    cookieless: { tone: 'ok', key: 'consent.cookieless', icon: 'check' },
    before_consent: { tone: 'bad', key: 'consent.before', icon: 'alert' },
    after_reject: { tone: 'bad', key: 'consent.after', icon: 'alert' },
    mismatch: { tone: 'warn', key: 'consent.mismatch', icon: 'alert' },
    no_signal: { tone: 'warn', key: 'consent.noSignal', icon: 'alert' },
    not_loaded: { tone: 'ok', key: 'consent.granted', icon: 'check' },
    unknown: { tone: 'mute', key: 'consent.unknown', icon: 'dash' },
  };
  const m = map[status];
  return (
    <div className={`ccard ${m.tone}`}>
      <span className="ccard-l">
        <Icon name={m.icon} />
        {t(m.key)}
      </span>
      {status !== 'unknown' && detail && <span className="ccard-d">{detail}</span>}
    </div>
  );
}

function CopyButton({ text, t }: { text: string; t: T }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      aria-label={t('detail.copy')}
      title={done ? t('detail.copied') : t('detail.copy')}
      onClick={() =>
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        })
      }
    >
      <Icon name={done ? 'check' : 'copy'} size={12} stroke={2.4} />
    </button>
  );
}

function Detail({
  hit,
  audit,
  linked,
  issues,
  t,
}: {
  hit: Hit;
  audit: Audit;
  linked: { self: boolean; hit: Hit } | null;
  issues: Issue[];
  t: T;
}) {
  const pageUrl = audit.pages[hit.page] ?? audit.pageUrl;
  return (
    <aside className="ev-detail" aria-live="polite">
      <div className="d-head">
        <span className="mono d-ev">{hit.event}</span>
        <PlatformBadge platform={hit.platform} />
        <RouteChip hit={hit} t={t} via />
        <span className="ph-grow" />
        <span className="mono d-tm" title={hit.approx ? t('events.approx') : undefined}>
          {hit.approx ? '≈ ' : ''}
          {fmtTime(hit.time, true)}
        </span>
      </div>
      <dl className="d-meta">
        {hit.account && (
          <>
            <dt>{t('detail.account')}</dt>
            <dd className="mono">{hit.account}</dd>
          </>
        )}
        <dt>{t('detail.page')}</dt>
        <dd className="mono" title={pageUrl}>
          {hostOf(pageUrl)}
          {(() => {
            try {
              return new URL(pageUrl).pathname;
            } catch {
              return '';
            }
          })()}
        </dd>
      </dl>
      {hit.platform === 'other' && <p className="d-note">{t('detail.otherNote')}</p>}
      {hit.route !== 'page' && (
        <div className="code">
          <span className="method">{hit.method}</span>
          <span className="url">{hostBold(hit.url, hit.host)}</span>
          <CopyButton text={hit.url} t={t} />
        </div>
      )}
      {hit.alsoSentTo?.length ? (
        <p className="d-note">{t('detail.alsoSent', { hosts: hit.alsoSentTo.join(', ') })}</p>
      ) : null}
      {issues.map((i) => {
        const x = issueText(i, t);
        return (
          <div key={i.key} className={`icard${i.severity === 'medium' ? ' is-warn' : ''}`}>
            <span className="icard-ic">
              <Icon name="alert" />
            </span>
            <div className="icard-t">
              <strong>{x.title}</strong>
              <span>{x.fix}</span>
            </div>
          </div>
        );
      })}
      <div className="card params">
        <div className="eyebrow">
          {t('detail.params')} <span className="cnt">{hit.params.length}</span>
        </div>
        {hit.params.length === 0 && <p className="d-none">{t('detail.noParams')}</p>}
        {hit.params.map((p, i) => (
          <div key={`${p.key}-${i}`} className="prow">
            <span className="kv">{p.key}</span>
            <span className="pv">
              {p.value === '' ? <em className="empty-v">{t('detail.empty')}</em> : p.value}
            </span>
          </div>
        ))}
      </div>
      {hit.context.length > 0 && (
        <div className="card params">
          <div className="eyebrow">{t('detail.context')}</div>
          {hit.context.map((p) => (
            <div key={p.key} className="prow">
              <span className="kv">{p.key}</span>
              <span className="pv">{p.value}</span>
            </div>
          ))}
        </div>
      )}
      <ConsentCard hit={hit} audit={audit} t={t} />
      {linked && (
        <div className="icard">
          <span className="icard-ic">
            <Icon name="alert" />
          </span>
          <div className="icard-t">
            {linked.self ? (
              <>
                <strong>
                  {t('issue.self.title', {
                    platform: platformName(hit.platform),
                    event: hit.event,
                  })}
                </strong>
                <span>{t('issue.self.text')}</span>
              </>
            ) : (
              <>
                <strong>
                  {t('issue.sameClick.title', {
                    platform: platformName(linked.hit.platform),
                    event: linked.hit.event,
                  })}
                </strong>
                <span>
                  {t('issue.sameClick.text', {
                    own: platformName(hit.platform),
                    platform: platformName(linked.hit.platform),
                    value: money(get(hit.params, 'value'), get(hit.params, 'currency')),
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
