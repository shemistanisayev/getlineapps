/** Render tab (design/serpline/Render.dc.html): needs-JavaScript hero, raw vs rendered table, added list. */
import { needsJsPercent, type AddedByJs, type Audit, type Signal } from '@line/core/serpline';
import { StatusIcon } from '@line/ui';
import { HeroCard, LimeCta, PanelCard } from '@line/ui/serpline';
import type { T } from '../../../src/i18n/index.ts';
import { StatusPill } from './common.tsx';

/** "BreadcrumbList" reads as "Breadcrumb" in the table, as in the design. */
const schemaLabel = (types: string[], t: T) =>
  types.length ? types.map((x) => x.replace(/List$/, '')).join(', ') : t('rd.none');

type Cell = { text: string; tone?: 'bad' | 'warn' };

function cells(
  s: Signal,
  audit: Audit,
  t: T,
): { raw: Cell; rendered: Cell | 'same'; bad: boolean } {
  const heavy = (audit.diff?.needsJs ?? 0) >= 0.5;
  switch (s.id) {
    case 'h1': {
      const raw = Number(s.raw);
      return {
        raw: raw ? { text: String(raw) } : { text: t('rd.none'), tone: 'bad' },
        rendered: s.state === 'same' ? 'same' : { text: String(s.rendered) },
        bad: s.state === 'raw_missing',
      };
    }
    case 'words':
    case 'links':
      return s.state === 'same'
        ? { raw: { text: t('rd.same') }, rendered: 'same', bad: false }
        : {
            raw: { text: String(s.raw), tone: s.id === 'words' && heavy ? 'bad' : 'warn' },
            rendered: { text: String(s.rendered) },
            bad: s.id === 'words' && heavy,
          };
    case 'jsonld':
      return s.state === 'same'
        ? { raw: { text: t('rd.same') }, rendered: 'same', bad: false }
        : {
            raw: {
              text: schemaLabel(s.raw as string[], t),
              tone: (s.raw as string[]).length ? 'warn' : 'bad',
            },
            rendered: { text: schemaLabel(s.rendered as string[], t) },
            bad: false,
          };
    default:
      // Title, description, canonical: long values, so the table says same / missing / changed.
      return s.state === 'same'
        ? { raw: { text: t('rd.same') }, rendered: 'same', bad: false }
        : s.state === 'raw_missing'
          ? {
              raw: { text: t('rd.missing'), tone: 'bad' },
              rendered: { text: t('rd.present') },
              bad: true,
            }
          : {
              raw: { text: t('rd.changed'), tone: 'warn' },
              rendered: { text: t('rd.changed') },
              bad: false,
            };
  }
}

/** Rows of the comparison table, in the design's order (robots meta is on Summary). */
const SIGNALS = ['title', 'description', 'canonical', 'h1', 'words', 'links', 'jsonld'] as const;

function AddedLine({ a, t }: { a: AddedByJs; t: T }) {
  if (a.kind === 'heading')
    return (
      <>
        <span className="tg">&lt;h{a.level}&gt;</span>
        {a.text}
        <span className="tg">&lt;/h{a.level}&gt;</span>
      </>
    );
  if (a.kind === 'schema')
    return (
      <>
        <span className="tg">&lt;script</span> <span className="at">type</span>
        ="application/ld+json"<span className="tg">&gt;</span> {a.type}
      </>
    );
  const open = (
    <>
      <span className="tg">&lt;{a.tag}</span>
      {a.id && (
        <>
          {' '}
          <span className="at">id</span>="{a.id}"
        </>
      )}
      <span className="tg">&gt;</span>{' '}
    </>
  );
  return (
    <>
      {open}
      {a.kind === 'sectionWords' ? t('rd.words', { n: a.words }) : t('rd.links', { n: a.links })}
    </>
  );
}

export function RenderTab({ audit, cta, t }: { audit: Audit; cta: string; t: T }) {
  const d = audit.diff;
  return (
    <>
      <HeroCard className="sp-hero">
        {d ? (
          <>
            <div className="sp-hero-x">
              <span className="sp-hero-h">
                {d.needsJs > 0 ? t('rd.title', { percent: needsJsPercent(d) }) : t('rd.titleNone')}
              </span>
              <span className="sl-soft">
                {t('rd.sub', { raw: d.rawWords, rendered: d.renderedWords })}
              </span>
            </div>
            <div className="sp-words">
              <div
                className="sp-words-bar"
                role="img"
                aria-label={t('rd.barAria', { raw: d.rawWords, rendered: d.renderedWords })}
              >
                <span
                  style={{
                    width: `${d.renderedWords ? Math.min(100, (d.rawWords / d.renderedWords) * 100) : 100}%`,
                  }}
                />
              </div>
              <div className="sp-words-legend">
                <span>
                  <i className="sp-dot" /> {t('rd.inRaw')}
                </span>
                <span className="sl-soft">{t('rd.onlyJs')}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="sp-hero-x">
            <span className="sp-hero-h">{t('rd.noRaw')}</span>
            <span className="sl-soft">{t('rd.noRawText')}</span>
          </div>
        )}
      </HeroCard>

      {d && (
        <section className="sl-card sp-cmp-card">
          <div className="sp-cmp" role="table" aria-label={t('rd.tableAria')}>
            <div className="sp-cmp-row sp-cmp-th" role="row">
              <span role="columnheader">{t('rd.signal')}</span>
              <span role="columnheader">{t('rd.raw')}</span>
              <span role="columnheader">{t('rd.rendered')}</span>
            </div>
            {SIGNALS.map((id) => {
              const s = d.signals.find((x) => x.id === id)!;
              const c = cells(s, audit, t);
              return (
                <div key={id} className={`sp-cmp-row ${c.bad ? 'bad' : ''}`} role="row">
                  <span role="cell">{t(`rd.sig.${id}`)}</span>
                  <span role="cell" className={c.raw.tone ? `sp-v-${c.raw.tone}` : undefined}>
                    {c.raw.tone && (
                      <StatusIcon
                        tone={c.raw.tone === 'bad' ? 'problem' : 'warning'}
                        icon={c.raw.tone === 'bad' && id === 'h1' ? 'x' : 'alert'}
                      />
                    )}
                    {c.raw.text}
                  </span>
                  <span role="cell">
                    {c.rendered === 'same' ? (
                      <StatusPill tone="ok">{t('rd.same')}</StatusPill>
                    ) : (
                      c.rendered.text
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {d && (
        <PanelCard title={t('rd.added')} className="sp-added">
          {d.added.length ? (
            <>
              <div className="sp-code mono">
                {d.added.map((a, i) => (
                  <div key={i}>
                    <AddedLine a={a} t={t} />
                  </div>
                ))}
              </div>
              <p className="sp-added-x">
                {t('rd.addedText')} <b>{t('fix')}</b> {t('rd.addedFix')}
              </p>
            </>
          ) : (
            <p className="sp-added-x">{t('rd.addedNone')}</p>
          )}
        </PanelCard>
      )}

      <LimeCta text={t('cta.render')} label={t('cta.contact')} href={cta} />
    </>
  );
}
