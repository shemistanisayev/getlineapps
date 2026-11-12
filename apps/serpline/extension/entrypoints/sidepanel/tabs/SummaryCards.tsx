/**
 * Summary cards added in Serpline 1.1 (docs/serpline-SPEC.md §5): "Can Google index this page?",
 * structured data with rich result checks, and hreflang. Built from the panel's own cards.
 */
import { sameUrl, type Audit, type IndexState, type IssueId } from '@line/core/serpline';
import { CheckRow, PanelCard } from '@line/ui/serpline';
import type { MessageKey, T } from '../../../src/i18n/index.ts';
import { IssueCard, StatusPill, type Tone } from './common.tsx';

const STATE: Record<IndexState, Tone> = { ok: 'ok', bad: 'bad', warn: 'warn', none: 'mute' };

/** Issue cards for a list of ids, in the audit's order. */
function Issues({ audit, ids, t }: { audit: Audit; ids: IssueId[]; t: T }) {
  return (
    <>
      {audit.issues
        .filter((i) => ids.includes(i.id))
        .map((i) => (
          <IssueCard key={i.id} issue={i} t={t} />
        ))}
    </>
  );
}

export function IndexCard({ audit, t }: { audit: Audit; t: T }) {
  const { verdict, checks } = audit.indexability;
  const tone: Tone = verdict === 'yes' ? 'ok' : verdict === 'no' ? 'bad' : 'warn';
  return (
    <>
      <PanelCard
        title={t('ix.title')}
        aside={
          <StatusPill tone={tone} icon={verdict === 'no' ? 'x' : undefined}>
            {t(`ix.verdict.${verdict}`)}
          </StatusPill>
        }
      >
        {checks.map((c) => (
          <CheckRow
            key={c.id}
            label={t(`ix.row.${c.id}` as MessageKey)}
            tone={c.state === 'bad' ? 'problem' : undefined}
          >
            <StatusPill tone={STATE[c.state]} icon={c.state === 'none' ? 'dash' : undefined}>
              {t(`ix.note.${c.note}` as MessageKey, c.params)}
            </StatusPill>
          </CheckRow>
        ))}
      </PanelCard>
      <Issues
        audit={audit}
        ids={[
          'HTTP_ERROR',
          'ROBOTS_BLOCKED',
          'CANONICAL_BROKEN',
          'CANONICAL_REDIRECT',
          'CANONICAL_MULTI',
          'NOT_IN_SITEMAP',
        ]}
        t={t}
      />
    </>
  );
}

export function SchemaCard({ audit, t }: { audit: Audit; t: T }) {
  const items = audit.schema;
  const errors = audit.rendered.jsonLd.errors;
  if (!items.length && !errors) return null;
  return (
    <>
      <PanelCard title={t('sc.title')}>
        {items.map((s, i) => (
          <div key={`${s.type}-${i}`} className="sp-schema">
            <CheckRow
              label={<span className="mono">{s.type}</span>}
              tone={s.result && s.missing.length ? 'problem' : undefined}
            >
              {!s.result ? (
                <StatusPill tone="mute" icon="dash">
                  {t('sc.noResult')}
                </StatusPill>
              ) : s.missing.length ? (
                <StatusPill tone="bad">{t('sc.notEligible')}</StatusPill>
              ) : (
                <StatusPill tone="ok">{t('sc.eligible', { result: s.result })}</StatusPill>
              )}
            </CheckRow>
            {s.missing.length > 0 && (
              <div className="sp-subrow">
                <span>{t('sc.required')}</span>
                <span className="sp-subrow-n mono">{s.missing.join(', ')}</span>
              </div>
            )}
            {s.result && s.recommended.length > 0 && (
              <div className="sp-subrow">
                <span>{t('sc.recommended')}</span>
                <span className="sp-subrow-n mono">{s.recommended.join(', ')}</span>
              </div>
            )}
          </div>
        ))}
        {errors > 0 && (
          <CheckRow label={<span className="mono">JSON-LD</span>} tone="problem">
            <StatusPill tone="bad">{t('st.schemaBad', { n: errors })}</StatusPill>
          </CheckRow>
        )}
        <p className="sp-empty sp-empty--top">{t('sc.note')}</p>
      </PanelCard>
      <Issues audit={audit} ids={['SCHEMA_PARSE', 'SCHEMA_REQUIRED']} t={t} />
    </>
  );
}

export function HreflangCard({ audit, t }: { audit: Audit; t: T }) {
  const list = audit.rendered.hreflang;
  if (!list.length) return null;
  const { invalid, pages, self, xDefault } = audit.hreflang;
  let origin = '';
  try {
    origin = new URL(audit.url).origin;
  } catch {
    /* keep */
  }
  const short = (href: string) =>
    href.startsWith(origin) ? href.slice(origin.length) || '/' : href;
  return (
    <>
      <PanelCard
        title={t('hl.title')}
        aside={<span className="sp-card-aside">{t('st.langs', { n: list.length })}</span>}
      >
        {list.map((h, i) => {
          const page = pages.find((p) => p.url === h.href);
          let pill: { tone: Tone; text: string };
          if (invalid.includes(h.lang)) pill = { tone: 'bad', text: t('hl.invalid') };
          else if (sameUrl(h.href, audit.url)) pill = { tone: 'ok', text: t('hl.thisPage') };
          else if (!h.href.startsWith(origin + '/'))
            pill = { tone: 'mute', text: t('hl.otherSite') };
          else if (!page) pill = { tone: 'mute', text: t('hl.notChecked') };
          else if (page.status !== 200)
            pill = { tone: 'bad', text: page.status ? `HTTP ${page.status}` : t('hl.unreached') };
          else if (page.linksBack === false) pill = { tone: 'bad', text: t('hl.noReturn') };
          else pill = { tone: 'ok', text: t('hl.linksBack') };
          return (
            <CheckRow
              key={`${h.lang}-${i}`}
              label={
                <span className="sp-hl">
                  <b className="mono">{h.lang}</b>
                  <span className="mono">{short(h.href)}</span>
                </span>
              }
              tone={pill.tone === 'bad' ? 'problem' : undefined}
            >
              <StatusPill tone={pill.tone} icon={pill.tone === 'mute' ? 'dash' : undefined}>
                {pill.text}
              </StatusPill>
            </CheckRow>
          );
        })}
        <p className="sp-empty sp-empty--top">
          {[!self && t('hl.noSelf'), !xDefault && t('hl.noXDefault'), t('hl.note')]
            .filter(Boolean)
            .join(' ')}
        </p>
      </PanelCard>
      <Issues
        audit={audit}
        ids={['HREFLANG_INVALID', 'HREFLANG_NO_RETURN', 'HREFLANG_NO_SELF']}
        t={t}
      />
    </>
  );
}
