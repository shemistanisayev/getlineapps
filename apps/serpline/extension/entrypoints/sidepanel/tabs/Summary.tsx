/** Summary tab (design/serpline/Main.dc.html): hero with the score, on-page checks, Google preview. */
import type { Audit, Fit } from '@line/core/serpline';
import { CheckRow, HeroCard, PanelCard, ScoreRing, Segmented, SerpResult } from '@line/ui/serpline';
import type { T } from '../../../src/i18n/index.ts';
import type { PreviewDevice } from '../../../src/storage.ts';
import { StatusPill, clock, type Tone } from './common.tsx';

interface Row {
  label: string;
  tone: Tone;
  text: string;
}

function has(audit: Audit, id: string) {
  return audit.issues.some((i) => i.id === id);
}

/** The nine on-page rows, in the design's order. */
function checkRows(a: Audit, t: T): Row[] {
  const r = a.rendered;
  const rows: Row[] = [];

  rows.push({
    label: t('row.title'),
    ...(!r.title
      ? { tone: 'bad' as const, text: t('st.missing') }
      : has(a, 'TITLE_LONG')
        ? { tone: 'warn' as const, text: t('st.cutGoogle') }
        : { tone: 'ok' as const, text: t('st.chars', { n: r.title.length }) }),
  });

  rows.push({
    label: t('row.desc'),
    ...(!r.description
      ? { tone: 'warn' as const, text: t('st.missing') }
      : has(a, 'DESC_LONG')
        ? { tone: 'warn' as const, text: t('st.cutGoogle') }
        : { tone: 'ok' as const, text: t('st.chars', { n: r.description.length }) }),
  });

  rows.push({
    label: t('row.canonical'),
    ...(!r.canonical
      ? { tone: 'mute' as const, text: t('st.notSet') }
      : has(a, 'CANONICAL_OTHER')
        ? { tone: 'warn' as const, text: t('st.canonOther') }
        : { tone: 'ok' as const, text: t('st.canonSelf') }),
  });

  const robots = r.robots ?? a.raw?.robots ?? null;
  rows.push({
    label: t('row.robots'),
    ...(a.noindex.meta || a.noindex.header
      ? { tone: 'bad' as const, text: t('st.noindex') }
      : robots
        ? { tone: 'ok' as const, text: robots }
        : { tone: 'mute' as const, text: t('st.notSet') }),
  });

  const h1 = r.headings.filter((h) => h.level === 1).length;
  rows.push({
    label: t('row.h1'),
    ...(has(a, 'RAW_H1')
      ? { tone: 'bad' as const, text: t('st.h1Js') }
      : h1 === 0
        ? { tone: 'bad' as const, text: t('st.missing') }
        : h1 > 1
          ? { tone: 'warn' as const, text: t('st.h1Many', { n: h1 }) }
          : { tone: 'ok' as const, text: t('st.h1Ok') }),
  });

  const imgs = r.images.length;
  const noAlt = r.images.filter((i) => i.alt === 'missing').length;
  rows.push({
    label: t('row.alt'),
    ...(imgs === 0
      ? { tone: 'mute' as const, text: t('st.noImages') }
      : noAlt
        ? { tone: 'warn' as const, text: t('st.altMissing', { m: noAlt, n: imgs }) }
        : { tone: 'ok' as const, text: t('st.altOk', { n: imgs }) }),
  });

  const jsSchema = a.issues.find((i) => i.id === 'SCHEMA_JS');
  rows.push({
    label: t('row.schema'),
    ...(jsSchema
      ? { tone: 'warn' as const, text: t('st.schemaJs', { type: jsSchema.params.type! }) }
      : r.jsonLd.errors
        ? { tone: 'warn' as const, text: t('st.schemaBad', { n: r.jsonLd.errors }) }
        : r.jsonLd.types.length
          ? { tone: 'ok' as const, text: r.jsonLd.types.slice(0, 3).join(', ') }
          : { tone: 'mute' as const, text: t('st.none') }),
  });

  const ogMissing = !r.og.description
    ? 'og:description'
    : !r.og.title
      ? 'og:title'
      : !r.og.image
        ? 'og:image'
        : null;
  rows.push({
    label: t('row.og'),
    ...(ogMissing
      ? { tone: 'warn' as const, text: t('st.ogMissing', { tag: ogMissing }) }
      : { tone: 'ok' as const, text: t('st.ogOk') }),
  });

  rows.push({
    label: t('row.hreflang'),
    ...(r.hreflang.length
      ? { tone: 'ok' as const, text: t('st.langs', { n: r.hreflang.length }) }
      : { tone: 'mute' as const, text: t('st.notUsed') }),
  });
  return rows;
}

function MeasureLine({ text, fit, t }: { text: string; fit: Fit | null; t: T }) {
  return (
    <div className="sp-measure">
      <span>{text}</span>
      {fit && (
        <StatusPill tone={fit.cut ? 'bad' : 'ok'}>
          {fit.cut ? t('serp.tooLong') : t('serp.fits')}
        </StatusPill>
      )}
    </div>
  );
}

export function SummaryTab({
  audit,
  checkedAt,
  device,
  onDevice,
  t,
}: {
  audit: Audit;
  checkedAt: Date;
  device: PreviewDevice;
  onDevice: (d: PreviewDevice) => void;
  t: T;
}) {
  const { counts, serp } = audit;
  const total = counts.high + counts.medium + counts.low;
  const desc = serp.description?.[device] ?? null;
  return (
    <>
      <HeroCard className="sp-hero">
        <div className="sp-hero-top">
          <span className="sp-host">{audit.host}</span>
          <span className="sl-soft">{t('sum.checkedAt', { time: clock(checkedAt) })}</span>
        </div>
        <div className="sp-hero-main">
          <ScoreRing score={audit.score} label={t('sum.scoreAria', { score: audit.score })} />
          <div className="sp-hero-x">
            <span className="sp-hero-h">{t(`sum.label.${audit.label}`)}</span>
            <span className="sl-soft">
              {total ? t('sum.counts', { ...counts }) : t('sum.noIssues')}
            </span>
          </div>
        </div>
      </HeroCard>

      <PanelCard title={t('sum.checks')}>
        {checkRows(audit, t).map((r) => (
          <CheckRow key={r.label} label={r.label} tone={r.tone === 'bad' ? 'problem' : undefined}>
            <StatusPill tone={r.tone}>{r.text}</StatusPill>
          </CheckRow>
        ))}
      </PanelCard>

      <PanelCard
        title={t('serp.title')}
        aside={
          <Segmented
            label={t('serp.device')}
            value={device}
            onChange={onDevice}
            options={[
              { value: 'mobile', label: t('serp.mobile') },
              { value: 'desktop', label: t('serp.desktop') },
            ]}
          />
        }
      >
        <div className="sp-serp">
          <SerpResult
            device={device}
            siteName={serp.siteName}
            urlLine={serp.urlLine}
            title={serp.title?.shown ?? t('serp.emptyTitle')}
            description={desc?.shown ?? t('serp.emptyDesc')}
          />
        </div>
        <div className="sp-measures">
          {serp.title ? (
            <MeasureLine
              fit={serp.title}
              t={t}
              text={t('serp.titleLine', {
                n: serp.title.length,
                px: serp.title.px,
                limit: serp.title.limit,
              })}
            />
          ) : (
            <MeasureLine fit={null} t={t} text={t('serp.noTitle')} />
          )}
          {desc ? (
            <MeasureLine
              fit={desc}
              t={t}
              text={
                desc.cut
                  ? t('serp.descCut', { n: desc.length, cut: desc.cutAfter })
                  : t('serp.descLine', { n: desc.length, px: desc.px, limit: desc.limit })
              }
            />
          ) : (
            <MeasureLine fit={null} t={t} text={t('serp.noDesc')} />
          )}
        </div>
      </PanelCard>
    </>
  );
}
