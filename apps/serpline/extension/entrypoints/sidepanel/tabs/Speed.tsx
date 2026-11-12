/**
 * Speed tab (docs/serpline-SPEC.md §5, Serpline 1.1): Core Web Vitals of this visit, page weight,
 * image findings, mobile layout and the server response. The design has no artboard for it; it is
 * built from the panel's own cards, rows and pills.
 */
import {
  THRESHOLDS,
  formatBytes,
  formatMetric,
  rate,
  type Audit,
  type LiveImage,
  type Metric,
  type Rating,
  type ResourceKind,
} from '@line/core/serpline';
import { CheckRow, HeroCard, LimeCta, PanelCard, Switch } from '@line/ui/serpline';
import type { MessageKey, T } from '../../../src/i18n/index.ts';
import { IssueCard, StatusPill, type Tone } from './common.tsx';

const TONE: Record<Rating, Tone> = { good: 'ok', needs_improvement: 'warn', poor: 'bad' };

function MetricTile({ metric, value, t }: { metric: Metric; value: number | null; t: T }) {
  const r = value === null ? null : rate(metric, value);
  return (
    <div className="sp-vital">
      <span className="sp-vital-k">{metric.toUpperCase()}</span>
      <b className="sp-vital-v">{value === null ? '...' : formatMetric(metric, value)}</b>
      {r ? (
        <StatusPill tone={TONE[r]}>{t(`sp.rating.${r}`)}</StatusPill>
      ) : (
        <span className="sp-vital-none">
          {metric === 'inp' ? t('sp.noClicks') : t('sp.notMeasured')}
        </span>
      )}
    </div>
  );
}

function MetricRow({ metric, value, t }: { metric: Metric; value: number | null; t: T }) {
  const r = value === null ? null : rate(metric, value);
  return (
    <CheckRow label={t(`sp.metric.${metric}`)} tone={r === 'poor' ? 'problem' : undefined}>
      {r && value !== null ? (
        <StatusPill tone={TONE[r]}>
          {t('sp.metricValue', {
            value: formatMetric(metric, value),
            limit: formatMetric(metric, THRESHOLDS[metric][0]),
          })}
        </StatusPill>
      ) : (
        <StatusPill tone="mute">{t('sp.notMeasured')}</StatusPill>
      )}
    </CheckRow>
  );
}

const KINDS: ResourceKind[] = ['image', 'script', 'css', 'font', 'document', 'other'];

/** One image finding row: label and count, then the first files. */
function ImageGroup({
  label,
  list,
  tone,
  note,
  t,
}: {
  label: string;
  list: LiveImage[];
  tone: Tone;
  note?: (i: LiveImage) => string;
  t: T;
}) {
  return (
    <>
      <CheckRow label={label} tone={list.length && tone === 'bad' ? 'problem' : undefined}>
        {list.length ? (
          <StatusPill tone={tone}>
            {t(list.length === 1 ? 'sp.img.count1' : 'sp.img.count', { n: list.length })}
          </StatusPill>
        ) : (
          <StatusPill tone="ok">{t('sp.none')}</StatusPill>
        )}
      </CheckRow>
      {list.slice(0, 4).map((i, n) => (
        <div key={`${i.path}-${n}`} className="sp-subrow">
          <span className="mono" title={i.src}>
            {i.file || i.src}
          </span>
          {note && <span className="sp-subrow-n">{note(i)}</span>}
        </div>
      ))}
      {list.length > 4 && (
        <div className="sp-subrow sp-subrow--more">{t('sp.andMore', { n: list.length - 4 })}</div>
      )}
    </>
  );
}

export function SpeedTab({
  audit,
  highlight,
  onHighlight,
  highlightFailed,
  cta,
  t,
}: {
  audit: Audit;
  highlight: boolean;
  onHighlight: (on: boolean) => void;
  highlightFailed: boolean;
  cta: string;
  t: T;
}) {
  const live = audit.live;
  const issues = audit.issues.filter((i) => i.tab === 'speed');
  const server = audit.server;
  const h = server.headers;

  const serverRows: { label: MessageKey; tone: Tone; text: string }[] = [
    {
      label: 'sp.srv.status',
      ...(server.status === 0
        ? { tone: 'warn' as const, text: t('sp.srv.unread') }
        : server.status >= 400
          ? { tone: 'bad' as const, text: `HTTP ${server.status}` }
          : { tone: 'ok' as const, text: `HTTP ${server.status}` }),
    },
    {
      label: 'sp.srv.https',
      ...(server.https
        ? { tone: 'ok' as const, text: t('sp.srv.httpsOn') }
        : { tone: 'warn' as const, text: t('sp.srv.httpsOff') }),
    },
    {
      label: 'sp.srv.compression',
      ...(h?.contentEncoding
        ? { tone: 'ok' as const, text: h.contentEncoding }
        : {
            tone: audit.issues.some((i) => i.id === 'NO_COMPRESSION')
              ? ('warn' as const)
              : ('mute' as const),
            text: t('sp.srv.none'),
          }),
    },
    {
      label: 'sp.srv.cache',
      ...(h?.cacheControl
        ? { tone: 'mute' as const, text: h.cacheControl }
        : { tone: 'mute' as const, text: t('sp.srv.notSet') }),
    },
    ...(server.https
      ? [
          {
            label: 'sp.srv.hsts' as const,
            ...(h?.hsts
              ? { tone: 'ok' as const, text: t('sp.srv.on') }
              : { tone: 'mute' as const, text: t('sp.srv.notSet') }),
          },
        ]
      : []),
  ];

  if (!live) {
    return (
      <>
        <section className="sl-card sp-call" role="status">
          <div className="sp-call-x">
            <h1>{t('sp.noLive.title')}</h1>
            <p>{t('sp.noLive.text')}</p>
          </div>
        </section>
        {issues.map((i) => (
          <IssueCard key={i.id} issue={i} t={t} />
        ))}
        <LimeCta text={t('cta.speed')} label={t('cta.contact')} href={cta} />
      </>
    );
  }

  const v = live.vitals;
  const img = audit.images!;
  const m = live.mobile;
  const vw = audit.rendered.viewport;
  const vitalTones = [
    v.lcp === null ? null : rate('lcp', v.lcp),
    v.cls === null ? null : rate('cls', v.cls),
    v.inp === null ? null : rate('inp', v.inp),
  ];
  const measured = vitalTones.filter((x): x is Rating => x !== null);
  const headline = !measured.length
    ? t('sp.hero.none')
    : measured.every((x) => x === 'good')
      ? t('sp.hero.good')
      : measured.some((x) => x === 'poor')
        ? t('sp.hero.poor')
        : t('sp.hero.mid');

  return (
    <>
      <HeroCard className="sp-hero">
        <div className="sp-hero-x">
          <span className="sp-hero-h">{headline}</span>
          <span className="sl-soft">
            {v.hiddenAtLoad ? t('sp.hero.hidden') : t('sp.hero.note')}
          </span>
        </div>
        <div className="sp-vitals">
          <MetricTile metric="lcp" value={v.lcp} t={t} />
          <MetricTile metric="cls" value={v.cls} t={t} />
          <MetricTile metric="inp" value={v.inp} t={t} />
        </div>
        {v.inp === null && <span className="sl-soft sp-hero-foot">{t('sp.hero.inp')}</span>}
      </HeroCard>

      <section className="sl-card sp-hd-top sp-switch-only">
        <div className="sp-switch-row">
          <label htmlFor="sp-hl-speed">{t('sp.highlight')}</label>
          <Switch
            id="sp-hl-speed"
            checked={highlight}
            onChange={onHighlight}
            label={t('sp.highlight')}
          />
        </div>
        {highlightFailed && (
          <p className="sp-muted" role="status">
            {t('hd.highlightFailed')}
          </p>
        )}
      </section>

      <PanelCard title={t('sp.load')}>
        <MetricRow metric="fcp" value={v.fcp} t={t} />
        <MetricRow metric="ttfb" value={v.ttfb} t={t} />
        <CheckRow label={t('sp.weight')}>
          <StatusPill tone="mute" icon="dash">
            {t(live.weight.requests === 1 ? 'sp.weightValue1' : 'sp.weightValue', {
              size: formatBytes(live.weight.bytes),
              n: live.weight.requests,
            })}
          </StatusPill>
        </CheckRow>
        {KINDS.filter((k) => live.weight.byKind[k].requests > 0).map((k) => (
          <div key={k} className="sp-subrow">
            <span>{t(`sp.kind.${k}`)}</span>
            <span className="sp-subrow-n">
              {t(live.weight.byKind[k].requests === 1 ? 'sp.weightValue1' : 'sp.weightValue', {
                size: formatBytes(live.weight.byKind[k].bytes),
                n: live.weight.byKind[k].requests,
              })}
            </span>
          </div>
        ))}
        {live.weight.unknownSize > 0 && (
          <p className="sp-empty sp-empty--top">
            {t('sp.weightUnknown', { n: live.weight.unknownSize })}
          </p>
        )}
      </PanelCard>

      <PanelCard
        title={t('sp.images')}
        aside={
          <span className="sp-card-aside">{t('sp.img.total', { n: live.images.length })}</span>
        }
      >
        <ImageGroup label={t('sp.img.lazyTop')} list={img.lazyTop} tone="bad" t={t} />
        <ImageGroup
          label={t('sp.img.heavy')}
          list={img.heavy}
          tone="bad"
          note={(i) => formatBytes(i.bytes ?? 0)}
          t={t}
        />
        <ImageGroup
          label={t('sp.img.oversized')}
          list={img.oversized}
          tone="warn"
          note={(i) => t('sp.img.sizes', { natural: i.naturalWidth, shown: i.width })}
          t={t}
        />
        <ImageGroup
          label={t('sp.img.legacy')}
          list={img.legacy}
          tone="warn"
          note={(i) => (i.type ?? '').replace('image/', '').toUpperCase()}
          t={t}
        />
        <ImageGroup label={t('sp.img.unsized')} list={img.unsized} tone="warn" t={t} />
      </PanelCard>

      <PanelCard title={t('sp.mobile')}>
        <CheckRow
          label={t('sp.mob.viewport')}
          tone={audit.issues.some((i) => i.id === 'VIEWPORT_MISSING') ? 'problem' : undefined}
        >
          {audit.issues.some((i) => i.id === 'VIEWPORT_MISSING') ? (
            <StatusPill tone="bad">{vw ? t('sp.mob.vpNoDevice') : t('st.missing')}</StatusPill>
          ) : audit.issues.some((i) => i.id === 'VIEWPORT_ZOOM') ? (
            <StatusPill tone="warn">{t('sp.mob.vpZoom')}</StatusPill>
          ) : audit.rendered.mobileAlternate && !/device-width/i.test(vw ?? '') ? (
            <StatusPill tone="mute" icon="dash">
              {t('sp.mob.vpSeparate')}
            </StatusPill>
          ) : (
            <StatusPill tone="ok">{t('sp.mob.vpOk')}</StatusPill>
          )}
        </CheckRow>
        <CheckRow label={t('sp.mob.overflow')}>
          {m.overflow > 4 ? (
            <StatusPill tone="bad">
              {t('sp.mob.overflowPx', { px: Math.round(m.overflow) })}
            </StatusPill>
          ) : (
            <StatusPill tone="ok">{t('sp.mob.fits')}</StatusPill>
          )}
        </CheckRow>
        <CheckRow label={t('sp.mob.text')}>
          {m.smallText ? (
            <StatusPill tone={audit.issues.some((i) => i.id === 'SMALL_TEXT') ? 'warn' : 'mute'}>
              {t('sp.mob.textSmall', { m: m.smallText, n: m.textBlocks })}
            </StatusPill>
          ) : (
            <StatusPill tone="ok">{t('sp.mob.textOk')}</StatusPill>
          )}
        </CheckRow>
        <CheckRow label={t('sp.mob.targets')}>
          {m.smallTargets ? (
            <StatusPill tone={audit.issues.some((i) => i.id === 'TAP_SMALL') ? 'warn' : 'mute'}>
              {t('sp.mob.targetsSmall', { m: m.smallTargets, n: m.targets })}
            </StatusPill>
          ) : (
            <StatusPill tone="ok">{t('sp.mob.targetsOk')}</StatusPill>
          )}
        </CheckRow>
        <p className="sp-empty sp-empty--top">{t('sp.mob.note', { width: m.viewportWidth })}</p>
      </PanelCard>

      <PanelCard title={t('sp.server')}>
        {serverRows.map((r) => (
          <CheckRow
            key={r.label}
            label={t(r.label)}
            tone={r.tone === 'bad' ? 'problem' : undefined}
          >
            <StatusPill tone={r.tone} icon={r.tone === 'mute' ? 'dash' : undefined}>
              {r.text}
            </StatusPill>
          </CheckRow>
        ))}
        {server.redirected && (
          <p className="sp-empty sp-empty--top">
            {t('sp.srv.redirected', { url: server.finalUrl })}
          </p>
        )}
      </PanelCard>

      {issues.map((i) => (
        <IssueCard key={i.id} issue={i} t={t} />
      ))}

      <LimeCta text={t('cta.speed')} label={t('cta.contact')} href={cta} />
    </>
  );
}
