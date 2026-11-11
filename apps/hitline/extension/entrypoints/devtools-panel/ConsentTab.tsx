import { contactUrl } from '@line/core/site';
import {
  CONSENT_SIGNALS,
  type Audit,
  type ConsentValue,
  type HitConsentStatus,
  type TimelineRow,
} from '@line/core/hitline';
import { joinList, type MessageKey, type T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import { fmtTime, Icon, Pill, PlatformBadge, platformName, type Tone } from '../../src/ui.tsx';

const CTA = contactUrl({ source: 'hitline', medium: 'extension', campaign: 'panel_cta' });

const STATUS: Record<HitConsentStatus, { tone: Tone; key: MessageKey; bad: boolean }> = {
  cookieless: { tone: 'ok', key: 'ct.status.cookieless', bad: false },
  granted: { tone: 'ok', key: 'ct.status.granted', bad: false },
  not_loaded: { tone: 'ok', key: 'ct.status.notLoaded', bad: false },
  before_consent: { tone: 'bad', key: 'consent.before', bad: true },
  after_reject: { tone: 'bad', key: 'consent.after', bad: true },
  mismatch: { tone: 'warn', key: 'consent.mismatch', bad: true },
  no_signal: { tone: 'warn', key: 'consent.noSignal', bad: true },
  unknown: { tone: 'mute', key: 'consent.unknown', bad: false },
};

function value(v: ConsentValue | undefined, t: T) {
  if (!v) return <Pill tone="mute">{t('ct.notSet')}</Pill>;
  return v === 'granted' ? (
    <Pill tone="ok">{t('ct.granted')}</Pill>
  ) : (
    <Pill tone="mute">{t('ct.denied')}</Pill>
  );
}

function Row({ r, t }: { r: TimelineRow; t: T }) {
  const s = STATUS[r.status];
  const gcs =
    r.hit?.gcs && (r.status === 'cookieless' || r.status === 'granted') ? `, ${r.hit.gcs}` : '';
  return (
    <div className={`tl-row${s.bad ? ' is-bad' : ''}`}>
      <span
        className={`tl-dot${s.bad ? ' is-bad' : s.tone === 'ok' ? ' is-ok' : ''}`}
        aria-hidden="true"
      />
      <span className="mono tl-tm">{r.time === null ? '' : fmtTime(r.time, true)}</span>
      <PlatformBadge platform={r.platform} />
      <span className="mono tl-ev">{r.event}</span>
      <Pill tone={s.tone} icon={s.bad ? 'alert' : s.tone === 'ok' ? 'check' : 'dash'}>
        {t(s.key)}
        {gcs}
      </Pill>
    </div>
  );
}

/** Consent tab: design/hitline/Consent.dc.html. */
export function ConsentTab({ audit }: { audit: Audit }) {
  const { t } = useT();
  const c = audit.consent;
  const m = c.model;
  const before = c.timeline.filter((r) => r.phase === 'before');
  const after = c.timeline.filter((r) => r.phase === 'after');
  const issues = audit.issues.filter((i) => i.tab === 'consent');
  const tags = [...new Set(issues.flatMap((i) => (i.data.tags as string[]) ?? []))];
  const platforms = [
    ...new Set(issues.map((i) => platformName(i.data.platform as keyof typeof platformName))),
  ];
  const choice = m.choice ? t(`ct.choice.${m.choice.kind}`) : t('ct.choice.none');

  return (
    <div className="two">
      <div className="side">
        <div className="hero">
          <span className="disp hero-h">{t('ct.title')}</span>
          <div className="facts">
            <div>
              <span className="soft">{t('ct.banner')}</span>
              <b>{m.bannerFound ? t('ct.found') : t('ct.notFound')}</b>
            </div>
            <div>
              <span className="soft">{t('ct.choice')}</span>
              <b>{choice}</b>
            </div>
          </div>
        </div>
        <div className="card sigs" role="table" aria-label={t('ct.title')}>
          <div className="th sig-grid" role="row">
            <span role="columnheader">{t('ct.th.signal')}</span>
            <span role="columnheader">{t('ct.th.default')}</span>
            <span role="columnheader">{t('ct.th.after')}</span>
          </div>
          {CONSENT_SIGNALS.map((s) => (
            <div key={s} className="row sig-grid" role="row">
              <span role="cell" className="kv">
                {s}
              </span>
              <span role="cell">{value(m.defaults[s], t)}</span>
              <span role="cell">{value(m.choice ? m.afterChoice[s] : undefined, t)}</span>
            </div>
          ))}
        </div>
        {!m.active ? (
          <div className="note mute">
            <Icon name="dash" />
            <span>{t('ct.none')}</span>
          </div>
        ) : c.google === 'ok' ? (
          <div className="note ok">
            <Icon name="check" />
            <span>
              <b>{t('ct.google.okTitle')}</b> {t('ct.google.okText')}
            </span>
          </div>
        ) : c.google === 'mismatch' ? (
          <div className="note bad">
            <Icon name="alert" />
            <span>
              <b>{t('ct.google.badTitle')}</b> {t('ct.google.badText')}
            </span>
          </div>
        ) : null}
      </div>
      <div className="main">
        <div className="card tl">
          <div className="tl-head">
            <span>{m.choice ? t('ct.before') : t('ct.session')}</span>
            <span className="tl-sub">{t('ct.beforeSub')}</span>
          </div>
          {before.map((r, i) => (
            <Row key={r.hit?.id ?? `b${i}`} r={r} t={t} />
          ))}
          {m.choice && (
            <>
              <div className="tl-choice">
                <span className="tl-ic" aria-hidden="true">
                  <Icon name="click" size={14} stroke={2.2} />
                </span>
                <span className="tl-c">{t('ct.clicks', { choice })}</span>
                <span className="mono">{fmtTime(m.choice.time, true)}</span>
              </div>
              {after.map((r, i) => (
                <Row key={r.hit?.id ?? `a${i}`} r={r} t={t} />
              ))}
            </>
          )}
          {c.timeline.length === 0 && <p className="tl-none">{t('ct.noHits')}</p>}
        </div>
        {issues.length > 0 && (
          <div className="card fix">
            <span className="fix-ic">
              <Icon name="wrench" size={14} stroke={2.2} />
            </span>
            <div>
              <strong>{t('ct.fix.title')}</strong>
              <span>
                {tags.length
                  ? t('ct.fix.tags', { tags: joinList(tags, t) })
                  : t('ct.fix.platforms', { platforms: joinList(platforms, t) })}
              </span>
            </div>
          </div>
        )}
        <div className="ph-grow" />
        <div className="cta">
          <span>{t('ct.cta')}</span>
          <a className="btn-ink" href={CTA} target="_blank" rel="noopener">
            {t('cta.contact')}
          </a>
        </div>
      </div>
    </div>
  );
}
