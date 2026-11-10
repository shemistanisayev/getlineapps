import { contactUrl } from '@line/core/site';
import type {
  AttributionStep,
  Audit,
  ClickCell,
  ClientIdCell,
  SourceCell,
} from '@line/core/hitline';
import type { MessageKey, T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import { Icon, Pill, type Tone } from '../../src/ui.tsx';

const CTA = contactUrl({ source: 'hitline', medium: 'extension', campaign: 'panel_cta' });
const MAX_CARDS = 5;

type Cell = SourceCell | ClickCell | ClientIdCell;
const CELL: Record<Cell, { tone: Tone; key: MessageKey }> = {
  present: { tone: 'ok', key: 'at.cell.present' },
  in_session: { tone: 'ok', key: 'at.cell.inSession' },
  in_cookie: { tone: 'ok', key: 'at.cell.inCookie' },
  created: { tone: 'ok', key: 'at.cell.created' },
  same: { tone: 'ok', key: 'at.cell.same' },
  lost: { tone: 'bad', key: 'at.cell.lost' },
  referral: { tone: 'bad', key: 'at.cell.referral' },
  new: { tone: 'bad', key: 'at.cell.new' },
  none: { tone: 'mute', key: 'at.cell.none' },
};

function stepLabel(s: AttributionStep, i: number, t: T): string {
  return s.page.kind === 'page' ? t('at.kind.page', { n: i + 1 }) : t(`at.kind.${s.page.kind}`);
}

/** Path for the card: same site as the landing shows the path only, another site shows host + path. */
function shortUrl(s: AttributionStep, landingSite: string | undefined): string {
  try {
    const u = new URL(s.page.url);
    const tail = `${u.pathname}${u.search}`;
    return s.page.site === landingSite ? tail : `${u.host}${tail}`;
  } catch {
    return s.page.url;
  }
}

function Badge({ s, t }: { s: AttributionStep; t: T }) {
  const b = s.badge;
  switch (b.kind) {
    case 'utm_click': {
      const utm = s.page.utm.length > 0;
      const click = s.page.clickIds.map((c) => c.key).join(', ');
      const label = utm && click ? t('at.badge.utmAnd', { click }) : utm ? 'UTM' : click;
      return (
        <Pill tone="ok" icon="check">
          {label}
        </Pill>
      );
    }
    case 'gcl_saved':
      return (
        <Pill tone="ok" icon="check">
          {t('at.badge.gclSaved')}
        </Pill>
      );
    case 'source_medium':
      return (
        <Pill tone="ok" icon="check">
          {b.value}
        </Pill>
      );
    case 'gl_missing':
      return (
        <Pill tone="bad" icon="alert">
          {t('at.badge.glMissing')}
        </Pill>
      );
    case 'referral':
      return (
        <Pill tone="bad" icon="alert">
          {t('at.badge.referral', { domain: b.value })}
        </Pill>
      );
    default:
      return null;
  }
}

/** Attribution tab: design/hitline/Attribution.dc.html. */
export function AttributionTab({ audit }: { audit: Audit }) {
  const { t } = useT();
  const a = audit.attribution;
  const all = a.steps.map((s, i) => ({ s, i }));
  const shown = all.length > MAX_CARDS ? [...all.slice(0, MAX_CARDS - 1), all.at(-1)!] : all;
  const hidden = all.length - shown.length;
  const issues = audit.issues.filter((i) => i.tab === 'attribution');
  const landingSite = a.landing?.site;

  return (
    <div className="at">
      <div className="at-head">
        <span className="disp">{t('at.title', { n: a.steps.length })}</span>
        <span className="sub">{a.campaign ? t('at.sub') : t('at.noCampaign')}</span>
      </div>
      <div className="steps">
        {shown.map(({ s, i }, k) => (
          <div key={i} className="step-w">
            {k > 0 && (
              <span className={`arrow${s.badge.ok ? '' : ' is-bad'}`} aria-hidden="true">
                {hidden > 0 && k === shown.length - 1 ? (
                  <span className="more">+{hidden}</span>
                ) : (
                  <Icon name="arrow" size={16} stroke={2.4} />
                )}
              </span>
            )}
            <div className={`card step${s.badge.ok ? '' : ' is-bad'}`}>
              <div className="step-top">
                <span className={`step-n${s.badge.ok ? '' : ' is-bad'}`}>{i + 1}</span>
                <span className="step-l">{stepLabel(s, i, t)}</span>
              </div>
              <span className="mono step-u">{shortUrl(s, landingSite)}</span>
              <Badge s={s} t={t} />
            </div>
          </div>
        ))}
      </div>
      <div className="card at-table" role="table" aria-label={t('at.th.param')}>
        <div
          className="th at-grid"
          role="row"
          style={{ gridTemplateColumns: `220px repeat(${shown.length}, minmax(0, 1fr))` }}
        >
          <span role="columnheader">{t('at.th.param')}</span>
          {shown.map(({ s, i }) => (
            <span key={i} role="columnheader">
              {stepLabel(s, i, t)}
            </span>
          ))}
        </div>
        {(
          [
            ['utm_source, utm_medium', (s: AttributionStep) => s.source],
            ['gclid', (s: AttributionStep) => s.gclid],
            ['GA4 client_id', (s: AttributionStep) => s.clientId],
          ] as const
        ).map(([label, pick]) => (
          <div
            key={label}
            className="row at-grid"
            role="row"
            style={{ gridTemplateColumns: `220px repeat(${shown.length}, minmax(0, 1fr))` }}
          >
            <span role="cell" className="kv">
              {label}
            </span>
            {shown.map(({ s, i }) => {
              const c = CELL[pick(s)];
              return (
                <span key={i} role="cell">
                  <Pill tone={c.tone}>{t(c.key)}</Pill>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="at-foot">
        {issues.length > 0 ? (
          <div className="icard big">
            <span className="icard-ic">
              <Icon name="alert" />
            </span>
            <div className="icard-t">
              {issues.map((i) =>
                i.id === 'UNWANTED_REFERRAL' ? (
                  <div key={i.key}>
                    <strong>{t('at.issue.referral.title')}</strong>
                    <span>{t('at.issue.referral.text', { host: String(i.data.host) })}</span>
                  </div>
                ) : (
                  <div key={i.key}>
                    <strong>{t('at.issue.break.title', { host: String(i.data.host) })}</strong>
                    <span>{t('at.issue.break.text', { host: String(i.data.host) })}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className={`note ${a.campaign ? 'ok' : 'mute'} grow`}>
            <Icon name={a.campaign ? 'check' : 'dash'} />
            <span>{a.campaign ? t('at.allGood') : t('at.howTo')}</span>
          </div>
        )}
        <div className="cta at-cta">
          <span>{t('at.cta')}</span>
          <a className="btn-ink" href={CTA} target="_blank" rel="noopener">
            {t('cta.contact')}
          </a>
        </div>
      </div>
    </div>
  );
}
