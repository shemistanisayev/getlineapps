import {
  draftPlan,
  parsePlan,
  planToCsv,
  SAMPLE_PLAN_CSV,
  type Arrived,
  type Audit,
  type Plan,
  type PlanError,
  type PlanStatus,
} from '@line/core/hitline';
import { useRef, useState, type DragEvent } from 'react';
import { joinList, type MessageKey, type T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import { Icon, Pill, PlatformBadge, PLATFORM_NAME, type Tone } from '../../src/ui.tsx';

/** Download through a blob URL and <a download> (no downloads permission). */
export function downloadText(name: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const STATUS: Record<PlanStatus, { tone: Tone; key: MessageKey; icon: 'check' | 'alert' }> = {
  match: { tone: 'ok', key: 'plan.status.match', icon: 'check' },
  missing: { tone: 'bad', key: 'plan.status.missing', icon: 'alert' },
  wrong: { tone: 'warn', key: 'plan.status.wrong', icon: 'alert' },
};
const BAR: Record<PlanStatus, string> = { match: '#12B76A', missing: '#F04438', wrong: '#F79009' };

function arrived(a: Arrived, platform: string, t: T): string {
  switch (a.kind) {
    case 'same':
      return t('plan.arrived.same');
    case 'never':
      return t('plan.arrived.never');
    case 'datalayer_only':
      return t('plan.arrived.dataLayer', { platform });
    case 'params': {
      const parts: string[] = [];
      if (a.missing.length && a.present.length)
        parts.push(t('plan.arrived.only', { params: joinList(a.present, t) }));
      else if (a.missing.length)
        parts.push(t('plan.arrived.missing', { params: joinList(a.missing, t) }));
      if (a.empty.length) parts.push(t('plan.arrived.empty', { params: joinList(a.empty, t) }));
      return parts.join('. ');
    }
  }
}

export function planErrorText(e: PlanError, t: T): string {
  if (e.code === 'row') return t(`plan.error.row.${e.reason}`, { line: e.line });
  return t(`plan.error.${e.code}`);
}

/** PlanSetup: design/hitline/PlanSetup.dc.html. */
function Setup({
  audit,
  onSave,
  onBack,
}: {
  audit: Audit;
  onSave: (p: Plan) => void;
  onBack?: () => void;
}) {
  const { t } = useT();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const events = audit.events.length;

  const read = async (file: File | undefined) => {
    if (!file) return;
    const r = parsePlan(await file.text(), file.name);
    if (r.ok) {
      setError('');
      onSave(r.plan);
    } else setError(planErrorText(r.error, t));
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void read(e.dataTransfer.files[0]);
  };

  return (
    <div className="two">
      <div
        className={`drop${over ? ' over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <span className="drop-ic" aria-hidden="true">
          <Icon name="upload" size={28} stroke={2.4} />
        </span>
        <h2 className="disp">{t('plan.drop.title')}</h2>
        <p>{t('plan.drop.text')}</p>
        <button type="button" className="btn-p btn-l" onClick={() => input.current?.click()}>
          {t('plan.drop.choose')}
        </button>
        <input
          ref={input}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          hidden
          aria-label={t('plan.drop.choose')}
          onChange={(e) => {
            void read(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {error && (
          <p className="plan-err" role="alert">
            <Icon name="alert" /> {error}
          </p>
        )}
        {onBack && (
          <button type="button" className="linkbtn" onClick={onBack}>
            {t('plan.back')}
          </button>
        )}
      </div>
      <div className="side">
        <div className="card fmt">
          <div className="fmt-top">
            <span>{t('plan.format.title')}</span>
            <Pill tone="mute">{t('plan.format.cols')}</Pill>
          </div>
          <div className="code sample" aria-label={t('plan.format.title')}>
            {SAMPLE_PLAN_CSV.trim()
              .split('\n')
              .map((line, i) => {
                if (i === 0)
                  return (
                    <span key={i} className="c-h">
                      {line}
                    </span>
                  );
                const [ev, rest] = [
                  line.slice(0, line.indexOf(',')),
                  line.slice(line.indexOf(',') + 1),
                ];
                const q = rest.indexOf('"');
                return (
                  <span key={i}>
                    <span className="c-ev">{ev}</span>,{rest.slice(0, q)}
                    <span className="c-p">{rest.slice(q)}</span>
                  </span>
                );
              })}
          </div>
          <button
            type="button"
            className="btn-s btn-m"
            onClick={() => downloadText('hitline-sample-plan.csv', SAMPLE_PLAN_CSV)}
          >
            <Icon name="download" size={14} stroke={2.4} />
            {t('plan.format.sample')}
          </button>
        </div>
        <div className="cta col">
          <span className="disp">{t('plan.draft.title')}</span>
          <span className="draft-t">{t('plan.draft.text', { n: events })}</span>
          <button
            type="button"
            className="btn-ink btn-m"
            disabled={events === 0}
            onClick={() =>
              downloadText(
                `hitline-plan-${audit.site || 'site'}.csv`,
                planToCsv(draftPlan(audit.hits)),
              )
            }
          >
            {t('plan.draft.button')}
          </button>
        </div>
        <span className="local">{t('plan.local')}</span>
      </div>
    </div>
  );
}

/** Plan tab: design/hitline/Plan.dc.html, or the setup when no plan is loaded. */
export function PlanTab({
  audit,
  plan,
  onSave,
  onRemove,
}: {
  audit: Audit;
  plan: Plan | null;
  onSave: (p: Plan) => void;
  onRemove: () => void;
}) {
  const { t } = useT();
  const [changing, setChanging] = useState(false);
  const result = audit.plan;
  if (!plan || !result || changing) {
    return (
      <Setup
        audit={audit}
        onSave={(p) => {
          onSave(p);
          setChanging(false);
        }}
        onBack={plan ? () => setChanging(false) : undefined}
      />
    );
  }
  const order: PlanStatus[] = ['match', 'missing', 'wrong'];
  return (
    <div className="pl">
      <div className="pl-top">
        <div className="card pl-name">
          <span className="disp">{t('plan.compared')}</span>
          <span className="sub">
            <span className="kv">{result.plan.name}</span>,{' '}
            {t('plan.events', { n: result.plan.rows.length })}
          </span>
        </div>
        {order.map((s) => (
          <div key={s} className={`card pl-count ${s}`}>
            <span className="disp n">{result.counts[s]}</span>
            <Pill tone={STATUS[s].tone}>{t(`plan.count.${s}`)}</Pill>
          </div>
        ))}
        <div className="pl-actions">
          <button type="button" className="btn-s" onClick={() => setChanging(true)}>
            {t('plan.change')}
          </button>
          <button type="button" className="btn-s" onClick={onRemove}>
            {t('plan.remove')}
          </button>
        </div>
      </div>
      <div className="seg" aria-hidden="true">
        {order.map((s) =>
          result.counts[s] ? (
            <span key={s} style={{ flex: result.counts[s], background: BAR[s] }} />
          ) : null,
        )}
      </div>
      <div className="card pl-table" role="table" aria-label={t('panel.tab.plan')}>
        <div className="th pl-grid" role="row">
          <span role="columnheader">{t('plan.th.event')}</span>
          <span role="columnheader">{t('plan.th.platform')}</span>
          <span role="columnheader">{t('plan.th.params')}</span>
          <span role="columnheader">{t('plan.th.arrived')}</span>
          <span role="columnheader">{t('plan.th.status')}</span>
        </div>
        <div className="pl-rows">
          {result.rows.map((r) => (
            <div key={`${r.row.platform}:${r.row.event}`} className="row pl-grid" role="row">
              <span role="cell" className="mono pl-ev">
                {r.row.event}
              </span>
              <span role="cell">
                <PlatformBadge platform={r.row.platform} />
              </span>
              <span role="cell" className="kv">
                {r.row.parameters.join(', ')}
              </span>
              <span role="cell" className="arr">
                {arrived(r.arrived, PLATFORM_NAME[r.row.platform], t)}
              </span>
              <span role="cell">
                <Pill tone={STATUS[r.status].tone} icon={STATUS[r.status].icon}>
                  {t(STATUS[r.status].key)}
                </Pill>
              </span>
            </div>
          ))}
        </div>
        <div className="pl-note">{t('plan.note')}</div>
      </div>
    </div>
  );
}
