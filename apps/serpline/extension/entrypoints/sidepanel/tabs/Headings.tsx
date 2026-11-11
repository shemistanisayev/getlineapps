/** Headings tab (design/serpline/Headings.dc.html): level tiles, highlight switch, outline, images. */
import type { Audit } from '@line/core/serpline';
import { StatusIcon } from '@line/ui';
import { CountTile, OutlineRow, PanelCard, Switch } from '@line/ui/serpline';
import type { T } from '../../../src/i18n/index.ts';
import { StatusPill, jsOnlyHeadings } from './common.tsx';

const THUMB = ['#E9E4D8', '#E4DFD2', '#EFEBE1'];

export function HeadingsTab({
  audit,
  highlight,
  onHighlight,
  highlightFailed,
  t,
}: {
  audit: Audit;
  highlight: boolean;
  onHighlight: (on: boolean) => void;
  highlightFailed: boolean;
  t: T;
}) {
  const { headings, images } = audit.rendered;
  const count = (l: number) => headings.filter((h) => h.level === l).length;
  const h1Problem = audit.issues.some((i) => i.id === 'RAW_H1' || i.id === 'H1_MULTI');
  const jsOnly = jsOnlyHeadings(audit);
  const noAlt = images.filter((i) => i.alt === 'missing');
  let h1Seen = 0;

  return (
    <>
      <section className="sl-card sp-hd-top">
        <div className="sp-tiles">
          <CountTile
            value={count(1)}
            label="H1"
            problem={h1Problem}
            icon={h1Problem ? <StatusIcon tone="problem" icon="alert" /> : undefined}
          />
          <CountTile value={count(2)} label="H2" />
          <CountTile value={count(3)} label="H3" />
          <CountTile value={count(4)} label="H4" />
        </div>
        <div className="sp-switch-row">
          <label htmlFor="sp-hl">{t('hd.highlight')}</label>
          <Switch id="sp-hl" checked={highlight} onChange={onHighlight} label={t('hd.highlight')} />
        </div>
        {highlightFailed && (
          <p className="sp-muted" role="status">
            {t('hd.highlightFailed')}
          </p>
        )}
      </section>

      <PanelCard title={t('hd.outline')}>
        {headings.length === 0 && <p className="sp-empty">{t('hd.noHeadings')}</p>}
        {headings.map((h, i) => {
          const prev = headings[i - 1];
          const skip = prev && h.level - prev.level > 1 ? prev.level + 1 : 0;
          const extraH1 = h.level === 1 && h1Seen++ > 0;
          const js = h.level === 1 && jsOnly.has(h);
          const problem = js;
          return (
            <OutlineRow
              key={`${h.path}-${i}`}
              level={h.level}
              text={h.text || '...'}
              strong={h.level === 1}
              tone={problem ? 'problem' : undefined}
            >
              {js && <StatusPill tone="bad">{t('hd.jsOnly')}</StatusPill>}
              {!js && extraH1 && <StatusPill tone="warn">{t('hd.extraH1')}</StatusPill>}
              {skip > 0 && <StatusPill tone="warn">{t('hd.skips', { n: skip })}</StatusPill>}
            </OutlineRow>
          );
        })}
      </PanelCard>

      <PanelCard
        title={t('hd.images')}
        aside={
          images.length === 0 ? undefined : noAlt.length ? (
            <StatusPill tone="warn">
              {t('hd.noAltCount', { m: noAlt.length, n: images.length })}
            </StatusPill>
          ) : (
            <StatusPill tone="ok">{t('hd.allAlt')}</StatusPill>
          )
        }
      >
        {images.length === 0 && <p className="sp-empty">{t('hd.noImages')}</p>}
        {noAlt.map((img, i) => (
          <div key={`${img.path}-${i}`} className="sl-hrow sp-img">
            <span className="sp-thumb" style={{ background: THUMB[i % THUMB.length] }} />
            <span className="sl-ht mono sp-file" title={img.src}>
              {img.file || img.src}
            </span>
            <StatusPill tone="bad" icon="x">
              {t('hd.noAlt')}
            </StatusPill>
          </div>
        ))}
      </PanelCard>
    </>
  );
}
