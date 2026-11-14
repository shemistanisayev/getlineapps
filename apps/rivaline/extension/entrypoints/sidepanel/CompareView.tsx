/**
 * Compare (Rivaline 1.1, docs/rivaline/PLAN-1.1.md step 4): two tabs the panel has read, side by
 * side. Uses only the results in memory; nothing is read again, fetched or stored.
 */
import { compareSites, type FoundTool, type GapId } from '@line/core/rivaline';
import { RvCard, CardHead, ToolIconView } from '@line/ui/rivaline';
import { useState, type ReactNode } from 'react';
import type { ScanResult } from '../../src/capture/scan.ts';
import type { Lang, MessageKey, T } from '../../src/i18n/index.ts';
import { toolIcon } from '../../src/stack-view.ts';
import { Icon } from '../../src/ui.tsx';
import { NETWORK, STORE } from './OfferTab.tsx';

const GAPS: GapId[] = ['GAP_SERVER_SIDE', 'GAP_CONSENT', 'GAP_CRM', 'GAP_ANALYTICS'];

export const siteLabel = (r: ScanResult) => {
  const u = new URL(r.url);
  const path = u.pathname === '/' ? '' : u.pathname;
  return `${u.host.replace(/^www\./, '')}${path}`;
};

function languageNames(lang: Lang) {
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames([lang, 'en'], { type: 'language' });
  } catch {
    dn = null;
  }
  return (code: string) => {
    try {
      return dn?.of(code) ?? code;
    } catch {
      return code;
    }
  };
}

function YesNo({ on, t }: { on: boolean; t: T }) {
  return on ? (
    <span className="rp-yes">
      <Icon name="check" size={11} />
      {t('cmp.yes')}
    </span>
  ) : (
    <span className="rp-no">{t('cmp.no')}</span>
  );
}

const Dash = ({ t }: { t: T }) => <span className="rp-no">{t('cmp.none')}</span>;

/** A table with the two sites as columns. */
function Table({
  a,
  b,
  rows,
  label,
}: {
  a: string;
  b: string;
  rows: Array<{ key: string; label: ReactNode; a: ReactNode; b: ReactNode }>;
  label: string;
}) {
  return (
    <table className="rp-cmp" aria-label={label}>
      <thead>
        <tr>
          <td />
          <th scope="col">{a}</th>
          <th scope="col">{b}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <th scope="row">{r.label}</th>
            <td>{r.a}</td>
            <td>{r.b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ToolList({ title, tools }: { title: string; tools: FoundTool[] }) {
  if (!tools.length) return null;
  return (
    <div className="rp-field">
      <span className="rp-label">
        {title} <span className="rp-count">{tools.length}</span>
      </span>
      <ul className="rp-cmp-tools">
        {tools.map((tool) => (
          <li key={tool.id}>
            <ToolIconView icon={toolIcon(tool)} size={20} />
            {tool.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompareView({
  reads,
  current,
  t,
  lang,
  onBack,
}: {
  /** Every result the panel holds, newest first. */
  reads: ScanResult[];
  /** The tab the panel shows: the first site by default. */
  current: number | null;
  t: T;
  lang: Lang;
  onBack: () => void;
}) {
  const first = reads.find((r) => r.tabId === current) ?? reads[0];
  const [aId, setA] = useState(first?.tabId ?? -1);
  const [bId, setB] = useState(reads.find((r) => r.tabId !== first?.tabId)?.tabId ?? -1);
  const a = reads.find((r) => r.tabId === aId) ?? first;
  const b = reads.find((r) => r.tabId === bId && r.tabId !== a?.tabId);
  const language = languageNames(lang);

  const head = (
    <div className="rp-set-head">
      <button type="button" className="rv-ib" aria-label={t('set.back')} onClick={onBack}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <h1>{t('cmp.title')}</h1>
    </div>
  );

  if (!a || !b)
    return (
      <div className="rp-set">
        {head}
        <div className="rp-cmp-body">
          <section className="card rp-call" role="status">
            <h2 className="rp-cmp-h">{t('cmp.needTwo.title')}</h2>
            <p>{t('cmp.needTwo.text')}</p>
            <ol className="rp-cmp-steps">
              <li>{t('cmp.needTwo.s1')}</li>
              <li>{t('cmp.needTwo.s2')}</li>
              <li>{t('cmp.needTwo.s3')}</li>
            </ol>
          </section>
        </div>
      </div>
    );

  const c = compareSites(a, b);
  const nameA = siteLabel(a);
  const nameB = siteLabel(b);
  const onlyA = c.tools.flatMap((g) => g.onlyA);
  const onlyB = c.tools.flatMap((g) => g.onlyB);
  const both = c.tools.flatMap((g) => g.both);
  const list = (v: string[] | null) => (v && v.length ? v.join(', ') : null);
  const picker = (id: string, value: number, set: (n: number) => void, other: number) => (
    <select
      id={id}
      className="rp-select"
      value={value}
      onChange={(e) => {
        const next = Number(e.target.value);
        // Picking the other side's site swaps the two.
        if (next === other) {
          setA(id === 'rp-cmp-a' ? other : value);
          setB(id === 'rp-cmp-a' ? value : other);
        } else set(next);
      }}
    >
      {reads.map((r) => (
        <option key={r.tabId} value={r.tabId}>
          {siteLabel(r)}
        </option>
      ))}
    </select>
  );

  return (
    <div className="rp-set">
      {head}
      <div className="rp-cmp-body">
        <RvCard className="rp-pad" label={t('cmp.sites')}>
          <div className="rp-two">
            <label className="rp-field" htmlFor="rp-cmp-a">
              <span className="rp-label">{t('cmp.siteA')}</span>
              {picker('rp-cmp-a', a.tabId, setA, b.tabId)}
            </label>
            <label className="rp-field" htmlFor="rp-cmp-b">
              <span className="rp-label">{t('cmp.siteB')}</span>
              {picker('rp-cmp-b', b.tabId, setB, a.tabId)}
            </label>
          </div>
          <p className="rp-muted">{t('cmp.note')}</p>
        </RvCard>

        <RvCard className="rp-pad" label={t('cmp.numbers')}>
          <CardHead title={t('cmp.numbers')} />
          <Table
            a={nameA}
            b={nameB}
            label={t('cmp.numbers')}
            rows={c.numbers.map((n) => ({
              key: n.id,
              label: t(`cmp.n.${n.id}` as MessageKey),
              a: n.a,
              b: n.b,
            }))}
          />
        </RvCard>

        <RvCard className="rp-pad" label={t('cmp.stack')}>
          <CardHead title={t('cmp.stack')} />
          <ToolList title={t('cmp.only', { site: nameA })} tools={onlyA} />
          <ToolList title={t('cmp.only', { site: nameB })} tools={onlyB} />
          <ToolList title={t('cmp.both')} tools={both} />
          <Table
            a={nameA}
            b={nameB}
            label={t('cmp.basics')}
            rows={GAPS.map((g) => ({
              key: g,
              label: t(`cmp.has.${g}` as MessageKey),
              a: <YesNo on={!c.gaps.a.includes(g)} t={t} />,
              b: <YesNo on={!c.gaps.b.includes(g)} t={t} />,
            }))}
          />
        </RvCard>

        <RvCard className="rp-pad" label={t('cmp.ads')}>
          <CardHead title={t('cmp.ads')} />
          {c.adChannels.length ? (
            <Table
              a={nameA}
              b={nameB}
              label={t('cmp.ads')}
              rows={c.adChannels.map((r) => ({
                key: r.channel,
                label: r.channel,
                a: <YesNo on={r.a} t={t} />,
                b: <YesNo on={r.b} t={t} />,
              }))}
            />
          ) : (
            <p className="rp-muted">{t('cmp.noAds')}</p>
          )}
        </RvCard>

        <RvCard className="rp-pad" label={t('offer.offers')}>
          <CardHead title={t('offer.offers')} />
          {c.promos.length ? (
            <Table
              a={nameA}
              b={nameB}
              label={t('offer.offers')}
              rows={c.promos.map((r) => ({
                key: r.kind,
                label: t(`promo.${r.kind}` as MessageKey),
                a: <YesNo on={r.a} t={t} />,
                b: <YesNo on={r.b} t={t} />,
              }))}
            />
          ) : (
            <p className="rp-muted">{t('cmp.noOffers')}</p>
          )}
        </RvCard>

        <RvCard className="rp-pad" label={t('channels.title')}>
          <CardHead title={t('channels.title')} />
          <Table
            a={nameA}
            b={nameB}
            label={t('channels.title')}
            rows={[
              ...c.social.map((r) => ({
                key: r.network,
                label: NETWORK[r.network].name,
                a: r.a ? <span className="rv-mono">{r.a}</span> : <Dash t={t} />,
                b: r.b ? <span className="rv-mono">{r.b}</span> : <Dash t={t} />,
              })),
              {
                key: 'apps',
                label: t('cmp.apps'),
                a: list(c.apps.a.map((s) => STORE[s as keyof typeof STORE].name)) ?? <Dash t={t} />,
                b: list(c.apps.b.map((s) => STORE[s as keyof typeof STORE].name)) ?? <Dash t={t} />,
              },
            ]}
          />
        </RvCard>

        <RvCard className="rp-pad" label={t('leads.title')}>
          <CardHead title={t('leads.title')} />
          {c.leads.length ? (
            <Table
              a={nameA}
              b={nameB}
              label={t('leads.title')}
              rows={c.leads.map((r) => ({
                key: r.way,
                label: t(`lead.${r.way}` as MessageKey),
                a: r.a === null ? <Dash t={t} /> : (list(r.a) ?? t('leads.onPage')),
                b: r.b === null ? <Dash t={t} /> : (list(r.b) ?? t('leads.onPage')),
              }))}
            />
          ) : (
            <p className="rp-muted">{t('leads.none')}</p>
          )}
        </RvCard>

        <RvCard className="rp-pad" label={t('markets.title')}>
          <CardHead title={t('markets.title')} />
          <Table
            a={nameA}
            b={nameB}
            label={t('markets.title')}
            rows={[
              {
                key: 'languages',
                label: t('markets.languages'),
                a: list(c.markets.languages.a?.map(language) ?? null) ?? <Dash t={t} />,
                b: list(c.markets.languages.b?.map(language) ?? null) ?? <Dash t={t} />,
              },
              {
                key: 'currency',
                label: t('markets.currency'),
                a: c.markets.currency.a ?? <Dash t={t} />,
                b: c.markets.currency.b ?? <Dash t={t} />,
              },
            ]}
          />
        </RvCard>

        <RvCard className="rp-pad" label={t('cmp.brand')}>
          <CardHead title={t('cmp.brand')} />
          <Table
            a={nameA}
            b={nameB}
            label={t('cmp.brand')}
            rows={[
              ...c.brand.colors.map((r) => ({
                key: r.role,
                label: t(`role.${r.role}` as MessageKey),
                a: r.a ? <Hex hex={r.a} /> : <Dash t={t} />,
                b: r.b ? <Hex hex={r.b} /> : <Dash t={t} />,
              })),
              {
                key: 'heading',
                label: t('brand.headings'),
                a: c.brand.heading.a ?? <Dash t={t} />,
                b: c.brand.heading.b ?? <Dash t={t} />,
              },
              {
                key: 'body',
                label: t('brand.body'),
                a: c.brand.body.a ?? <Dash t={t} />,
                b: c.brand.body.b ?? <Dash t={t} />,
              },
            ]}
          />
        </RvCard>
      </div>
    </div>
  );
}

function Hex({ hex }: { hex: string }) {
  return (
    <span className="rp-hex">
      <i style={{ background: hex }} aria-hidden="true" />
      <span className="rv-mono">{hex}</span>
    </span>
  );
}
