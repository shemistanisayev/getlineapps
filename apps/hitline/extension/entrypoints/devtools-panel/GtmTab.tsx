import { contactUrl } from '@line/core/site';
import type {
  Audit,
  GtmEventView,
  GtmView,
  Platform,
  SgtmSignal,
  TagStatus,
  TagView,
} from '@line/core/hitline';
import { useState } from 'react';
import { joinList, type T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import {
  fmtTime,
  Icon,
  Pill,
  PlatformBadge,
  platformName,
  type IconName,
  type Tone,
} from '../../src/ui.tsx';

const STATUS: Record<TagStatus, { tone: Tone; icon: IconName }> = {
  fired: { tone: 'ok', icon: 'check' },
  triggered: { tone: 'ok', icon: 'check' },
  missing_value: { tone: 'warn', icon: 'alert' },
  no_consent_check: { tone: 'bad', icon: 'alert' },
  waiting_consent: { tone: 'mute', icon: 'clock' },
  not_fired: { tone: 'mute', icon: 'dash' },
};

const CTA = contactUrl({ source: 'hitline', medium: 'extension', campaign: 'panel_cta' });

/** GTM event params worth showing first (the rest follow). */
const KEY_PARAMS = [
  'gtm.element.text',
  'gtm.elementUrl',
  'gtm.elementId',
  'gtm.elementClasses',
  'gtm.elementTarget',
  'gtm.element.tag',
  'gtm.newUrl',
  'gtm.oldUrl',
  'gtm.scrollThreshold',
  'gtm.visibleRatio',
  'gtm.videoTitle',
  'gtm.videoStatus',
];

function evidence(s: SgtmSignal, t: T): string {
  if (!s.found) return t('sgtm.notFound');
  if (s.id === 'fpid_cookie') return s.days ? t('sgtm.fpidDays', { days: s.days }) : 'HttpOnly';
  return s.evidence ?? '';
}

function TagName({ tag }: { tag: TagView }) {
  return tag.platform && tag.platform !== 'gtm' ? (
    <PlatformBadge platform={tag.platform} label={tag.name} />
  ) : (
    <span className="pf">
      <i className="mono-tile" aria-hidden="true">
        {'</>'}
      </i>
      {tag.name}
    </span>
  );
}

function TagsTable({ view, t }: { view: GtmView; t: T }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="card tags" role="table" aria-label={t('gtm.tags')}>
      <div className="th tag-grid" role="row">
        <span role="columnheader">{t('gtm.th.tag')}</span>
        <span role="columnheader">{t('gtm.th.type')}</span>
        <span role="columnheader">{t('gtm.th.trigger')}</span>
        <span role="columnheader">{t('gtm.th.status')}</span>
      </div>
      {view.tags.length === 0 && <p className="ev-none">{t('gtm.noTags')}</p>}
      {view.tags.map((tag) => (
        <div key={tag.index} role="rowgroup">
          <div
            className={`row tag-grid${open === tag.index ? ' on' : ''}`}
            role="row"
            onClick={() => setOpen(open === tag.index ? null : tag.index)}
          >
            <span role="cell">
              <button
                type="button"
                className="tag-x"
                aria-expanded={open === tag.index}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(open === tag.index ? null : tag.index);
                }}
              >
                <TagName tag={tag} />
              </button>
            </span>
            <span role="cell" className="ty">
              {tag.type}
            </span>
            <span role="cell" className="mono tr" title={tag.trigger}>
              {tag.trigger || '-'}
            </span>
            <span role="cell">
              <Pill tone={STATUS[tag.status].tone} icon={STATUS[tag.status].icon}>
                {t(`gtm.status.${tag.status}`)}
              </Pill>
            </span>
          </div>
          {open === tag.index && (
            <div role="row">
              <dl className="tag-more" role="cell">
                <dt>{t('gtm.more.trigger')}</dt>
                <dd className="mono">{tag.trigger || '-'}</dd>
                {tag.blocking.length > 0 && (
                  <>
                    <dt>{t('gtm.more.blocking')}</dt>
                    <dd className="mono">{tag.blocking.join(' or ')}</dd>
                  </>
                )}
                <dt>{t('gtm.more.consent')}</dt>
                <dd className="mono">
                  {tag.consent.length ? tag.consent.join(', ') : t('gtm.more.noConsent')}
                </dd>
                <dt>{t('gtm.more.requests')}</dt>
                <dd>
                  {tag.silent && !tag.hitIds.length
                    ? t('gtm.more.silent')
                    : t('gtm.more.sent', { n: tag.hitIds.length })}
                </dd>
              </dl>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EventsView({ view, t }: { view: GtmView; t: T }) {
  const events = [...view.events].reverse();
  const [picked, setPicked] = useState<string | null>(null);
  const sel = events.find((e) => e.hit.id === picked) ?? events[0];
  const byIndex = new Map(view.tags.map((tag) => [tag.index, tag]));
  if (!events.length) return <div className="card gtm-none">{t('gtm.events.none')}</div>;
  return (
    <div className="gtm-ev">
      <div className="card gtm-ev-list" role="listbox" aria-label={t('gtm.events.list')}>
        {events.map((e) => {
          const fired = e.tags.filter((x) => x.fires === 'yes').length;
          return (
            <div
              key={e.hit.id}
              role="option"
              tabIndex={0}
              aria-selected={e === sel}
              className={`row ge-row${e === sel ? ' on' : ''}`}
              onClick={() => setPicked(e.hit.id)}
              onKeyDown={(k) => k.key === 'Enter' && setPicked(e.hit.id)}
            >
              <span className="mono tm">
                {e.hit.approx ? '≈ ' : ''}
                {fmtTime(e.hit.time)}
              </span>
              <span className="mono evn">{e.hit.event}</span>
              <span className="ge-n">{fired ? t('gtm.events.tags', { n: fired }) : ''}</span>
            </div>
          );
        })}
      </div>
      {sel && <EventDetail e={sel} byIndex={byIndex} t={t} />}
    </div>
  );
}

function EventDetail({ e, byIndex, t }: { e: GtmEventView; byIndex: Map<number, TagView>; t: T }) {
  const params = [
    ...KEY_PARAMS.flatMap((k) => e.hit.params.filter((p) => p.key === k)),
    ...e.hit.params.filter((p) => !KEY_PARAMS.includes(p.key)),
  ].filter((p) => p.value !== '');
  const groups: [string, typeof e.tags][] = [
    ['yes', e.tags.filter((x) => x.fires === 'yes')],
    ['maybe', e.tags.filter((x) => x.fires === 'maybe')],
  ];
  return (
    <div className="card ge-detail">
      <div className="d-head">
        <span className="mono d-ev">{e.hit.event}</span>
        <span className="ph-grow" />
        <span className="mono d-tm">{fmtTime(e.hit.time, true)}</span>
      </div>
      <div className="eyebrow">{t('gtm.events.fired')}</div>
      {groups.every(([, list]) => list.length === 0) && (
        <p className="d-none">{t('gtm.events.noTags')}</p>
      )}
      {groups.map(([kind, list]) =>
        list.map((x) => {
          const tag = byIndex.get(x.index);
          if (!tag) return null;
          return (
            <div key={`${kind}-${x.index}`} className="ge-tag">
              <TagName tag={tag} />
              {kind === 'maybe' ? (
                <Pill tone="mute" icon="dash">
                  {t('gtm.events.maybe')}
                </Pill>
              ) : x.seen ? (
                <Pill tone="ok" icon="check">
                  {t('gtm.events.seen')}
                </Pill>
              ) : tag.silent || !tag.platform ? (
                <Pill tone="ok" icon="check">
                  {t('gtm.events.inPage')}
                </Pill>
              ) : (
                <Pill tone="mute" icon="clock">
                  {t('gtm.events.noRequest')}
                </Pill>
              )}
            </div>
          );
        }),
      )}
      <div className="eyebrow">{t('detail.params')}</div>
      {params.length === 0 && <p className="d-none">{t('detail.noParams')}</p>}
      {params.slice(0, 60).map((p, i) => (
        <div key={`${p.key}-${i}`} className="prow">
          <span className="kv">{p.key}</span>
          <span className="pv">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/** GTM and sGTM tab: design/hitline/Gtm.dc.html, plus GTM events and tag details (1.1). */
export function GtmTab({ audit, onReload }: { audit: Audit; onReload?: () => void }) {
  const { t } = useT();
  const [ci, setCi] = useState(0);
  const [mode, setMode] = useState<'tags' | 'events'>('tags');
  const view = audit.gtm[Math.min(ci, audit.gtm.length - 1)];
  const s = audit.sgtm;
  const names = (ps: Platform[]) =>
    joinList(
      ps.map((p) => platformName(p)),
      t,
    );
  return (
    <div className="gtm">
      <div className="gtm-main">
        {view ? (
          <>
            {audit.gtm.length > 1 && (
              <div className="chips" role="group" aria-label={t('gtm.containers')}>
                {audit.gtm.map((g, i) => (
                  <button
                    key={g.container.id}
                    type="button"
                    className={`chip${i === ci ? ' on' : ''}`}
                    aria-pressed={i === ci}
                    onClick={() => setCi(i)}
                  >
                    <span className="mono">{g.container.id}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="card stats">
              <div className="stat wide">
                <span className="eyebrow">{t('gtm.container')}</span>
                <span className="mono cid">{view.container.id}</span>
                {view.container.estimated && <span className="est">{t('gtm.estimated')}</span>}
              </div>
              <div className="stat">
                <span className="eyebrow">{t('gtm.tags')}</span>
                <span className="disp num">{view.tags.length}</span>
              </div>
              <div className="stat">
                <span className="eyebrow">{t('gtm.triggers')}</span>
                <span className="disp num">
                  {view.container.estimated ? '-' : view.container.triggers}
                </span>
              </div>
              <div className="stat">
                <span className="eyebrow">{t('gtm.variables')}</span>
                <span className="disp num">
                  {view.container.estimated ? '-' : view.container.variables}
                </span>
              </div>
            </div>
            {view.container.estimated && (
              <div className="note mute">
                <Icon name="alert" />
                <span>
                  {t('gtm.estimatedNote')}{' '}
                  {onReload && (
                    <button type="button" className="link-btn" onClick={onReload}>
                      {t('panel.empty.reload')}
                    </button>
                  )}
                </span>
              </div>
            )}
            {!view.container.estimated && (
              <div className="gtm-seg" role="tablist" aria-label={t('gtm.view')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'tags'}
                  onClick={() => setMode('tags')}
                >
                  {t('gtm.tags')} <span className="n">{view.tags.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'events'}
                  onClick={() => setMode('events')}
                >
                  {t('gtm.events')} <span className="n">{view.events.length}</span>
                </button>
              </div>
            )}
            {mode === 'events' && !view.container.estimated ? (
              <EventsView view={view} t={t} />
            ) : (
              <TagsTable view={view} t={t} />
            )}
          </>
        ) : (
          <div className="card gtm-none">{t('gtm.none')}</div>
        )}
      </div>
      <div className="gtm-side">
        <div className={`hero${s.detected ? '' : ' off'}`}>
          <div className="hero-top">
            <span className="disp">{t('sgtm.title')}</span>
            {s.detected ? (
              <span className="pill lime">
                <Icon name="check" />
                {t('sgtm.detected')}
              </span>
            ) : (
              <span className="pill dim">
                <Icon name="dash" />
                {t('sgtm.notDetected')}
              </span>
            )}
          </div>
          <ul className="signals">
            {s.signals.map((sig) => (
              <li key={sig.id} className={sig.found ? '' : 'no'}>
                <span className="sig-ic">
                  <Icon name={sig.found ? 'check' : 'x'} />
                </span>
                <div>
                  <span className="sig-t">{t(`sgtm.${sig.id}`)}</span>
                  <span className="mono soft">{evidence(sig, t)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {s.detected && s.browserPlatforms.length > 0 && (
          <div className="card warncard">
            <span className="w-ic">
              <Icon name="alert" />
            </span>
            <div>
              <strong>{t('sgtm.browserOnly.title', { server: names(s.serverPlatforms) })}</strong>
              <span>{t('sgtm.browserOnly.text', { browser: names(s.browserPlatforms) })}</span>
            </div>
          </div>
        )}
        <div className="ph-grow" />
        <div className="cta">
          <span>
            {s.detected && s.browserPlatforms.length > 0
              ? t('sgtm.cta.move', { browser: names(s.browserPlatforms) })
              : t('sgtm.cta.setup')}
          </span>
          <a className="btn-ink" href={CTA} target="_blank" rel="noopener">
            {t('cta.contact')}
          </a>
        </div>
      </div>
    </div>
  );
}
