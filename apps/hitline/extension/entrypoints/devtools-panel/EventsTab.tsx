import {
  get,
  hitConsentStatus,
  stateAt,
  CONSENT_SIGNALS,
  type Audit,
  type Hit,
  type HitConsentStatus,
  type Platform,
} from '@line/core/hitline';
import { useMemo, useState, type KeyboardEvent } from 'react';
import type { T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import { fmtTime, Icon, money, Pill, PlatformBadge, PLATFORM_NAME } from '../../src/ui.tsx';

const ORDER: Platform[] = ['ga4', 'meta', 'tiktok', 'ads', 'datalayer', 'hotjar'];
/** A value issue on another platform this close in time counts as "the same click". */
const SAME_CLICK_MS = 1500;

type RowStatus = { tone: 'ok' | 'bad' | 'warn'; label: string; icon: 'check' | 'alert' };

function rowStatus(hit: Hit, valueIds: Set<string>, consent: HitConsentStatus, t: T): RowStatus {
  if (valueIds.has(hit.id)) return { tone: 'bad', label: t('status.noValue'), icon: 'alert' };
  if (consent === 'before_consent')
    return { tone: 'bad', label: t('status.beforeConsent'), icon: 'alert' };
  if (consent === 'after_reject')
    return { tone: 'bad', label: t('status.afterReject'), icon: 'alert' };
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
    hit.params.some((p) => p.key.toLowerCase().includes(s) || p.value.toLowerCase().includes(s))
  );
}

/** Events tab: design/hitline/Events.dc.html. */
export function EventsTab({ audit }: { audit: Audit }) {
  const { t } = useT();
  const [filter, setFilter] = useState<Platform | 'all'>('all');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string | null>(null);

  const valueIssues = useMemo(() => audit.issues.filter((i) => i.id === 'VALUE_MISSING'), [audit]);
  const valueIds = useMemo(() => new Set(valueIssues.flatMap((i) => i.evidence)), [valueIssues]);
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

  const counts = ORDER.map((p) => ({
    p,
    n: audit.events.filter((e) => e.platform === p).length,
  })).filter((x) => x.n > 0);
  const rows = audit.events.filter(
    (e) => (filter === 'all' || e.platform === filter) && matches(e, query),
  );
  const fallback =
    audit.events.find((h) => h.platform !== 'datalayer' && linked(h) && !valueIds.has(h.id)) ??
    audit.events[0];
  const selected =
    rows.find((r) => r.id === picked) ?? (rows.includes(fallback!) ? fallback : rows[0]);

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
          <div className="th ev-grid" aria-hidden="true">
            <span>{t('events.th.time')}</span>
            <span>{t('events.th.platform')}</span>
            <span>{t('events.th.event')}</span>
            <span>{t('events.th.route')}</span>
            <span>{t('events.th.status')}</span>
          </div>
          <div
            className="ev-rows"
            role="listbox"
            aria-label={t('events.listLabel')}
            tabIndex={0}
            aria-activedescendant={selected ? `ev-${selected.id}` : undefined}
            onKeyDown={onKey}
          >
            {rows.length === 0 && <p className="ev-none">{t('events.noMatch')}</p>}
            {rows.map((h) => {
              const st = rowStatus(h, valueIds, hitConsentStatus(audit.consent.model, h), t);
              const on = h === selected;
              return (
                <div
                  key={h.id}
                  id={`ev-${h.id}`}
                  role="option"
                  aria-selected={on}
                  className={`row ev-grid${on ? ' on' : ''}${st.tone === 'bad' && !on ? ' badrow' : ''}`}
                  onClick={() => setPicked(h.id)}
                >
                  <span className="mono tm">{fmtTime(h.time)}</span>
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
        {selected && <Detail hit={selected} audit={audit} linked={linked(selected)} t={t} />}
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
  if (hit.platform === 'datalayer') return null;
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

function Detail({
  hit,
  audit,
  linked,
  t,
}: {
  hit: Hit;
  audit: Audit;
  linked: { self: boolean; hit: Hit } | null;
  t: T;
}) {
  return (
    <aside className="ev-detail" aria-live="polite">
      <div className="d-head">
        <span className="mono d-ev">{hit.event}</span>
        <PlatformBadge platform={hit.platform} />
        <RouteChip hit={hit} t={t} via />
        <span className="ph-grow" />
        <span className="mono d-tm">{fmtTime(hit.time, true)}</span>
      </div>
      {hit.platform !== 'datalayer' && (
        <div className="code">
          <span className="method">{hit.method}</span>
          <span className="url">{hostBold(hit.url, hit.host)}</span>
        </div>
      )}
      <div className="card params">
        <div className="eyebrow">{t('detail.params')}</div>
        {hit.params.length === 0 && <p className="d-none">{t('detail.noParams')}</p>}
        {hit.params.map((p) => (
          <div key={p.key} className="prow">
            <span className="kv">{p.key}</span>
            <span className="pv">{p.value}</span>
          </div>
        ))}
      </div>
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
                    platform: PLATFORM_NAME[hit.platform],
                    event: hit.event,
                  })}
                </strong>
                <span>{t('issue.self.text')}</span>
              </>
            ) : (
              <>
                <strong>
                  {t('issue.sameClick.title', {
                    platform: PLATFORM_NAME[linked.hit.platform],
                    event: linked.hit.event,
                  })}
                </strong>
                <span>
                  {t('issue.sameClick.text', {
                    own: PLATFORM_NAME[hit.platform],
                    platform: PLATFORM_NAME[linked.hit.platform],
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
