import { Logo } from '@line/ui';
import { parsePlan, registrableDomain, type Plan } from '@line/core/hitline';
import { contactUrl, privacyUrl, toolUrl, type ToolSlug } from '@line/core/site';
import { useEffect, useRef, useState } from 'react';
import { planErrorText } from '../../src/plan-errors.ts';
import type { Lang, T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import { Icon } from '../../src/ui.tsx';

const MORE: ToolSlug[] = ['serpline', 'rivaline', 'foldline', 'markline'];
const NAME: Record<string, string> = {
  serpline: 'Serpline',
  rivaline: 'Rivaline',
  foldline: 'Foldline',
  markline: 'Markline',
};
const HOST = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

interface Stored {
  domains: string[];
  plans: Record<string, Plan>;
}

/** PopupSettings: design/hitline/PopupSettings.dc.html. Keys: domains, plans, lang, installedAt. */
export function Settings({ host, lang, onBack }: { host: string; lang: Lang; onBack: () => void }) {
  const { t } = useT();
  const [s, setS] = useState<Stored>({ domains: [], plans: {} });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  // Messages are stored as functions so they follow a language change.
  const [msg, setMsg] = useState<{ text: (t: T) => string; bad: boolean } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const site = registrableDomain(host);

  const read = () =>
    void browser.storage.local.get(['domains', 'plans']).then((r) =>
      setS({
        domains: Array.isArray(r.domains) ? (r.domains as string[]) : [],
        plans: r.plans && typeof r.plans === 'object' ? (r.plans as Record<string, Plan>) : {},
      }),
    );
  useEffect(read, []);

  // Until the user edits the list, the current site is the one own domain.
  const domains = s.domains.length ? s.domains : site ? [site] : [];
  const planKey = s.plans[site] ? site : s.plans.default ? 'default' : site || 'default';
  const plan = s.plans[planKey];

  const saveDomains = async (list: string[]) => {
    await browser.storage.local.set({ domains: list });
    read();
  };
  const addDomain = async () => {
    const d = draft
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    if (!HOST.test(d)) {
      setMsg({ text: (tt) => tt('settings.invalidDomain'), bad: true });
      return;
    }
    if (!domains.includes(d)) await saveDomains([...domains, d]);
    setDraft('');
    setAdding(false);
    setMsg(null);
  };
  const loadPlan = async (f: File | undefined) => {
    if (!f) return;
    const r = parsePlan(await f.text(), f.name);
    if (!r.ok) {
      setMsg({ text: (tt) => planErrorText(r.error, tt), bad: true });
      return;
    }
    await browser.storage.local.set({ plans: { ...s.plans, [site || 'default']: r.plan } });
    setMsg(null);
    read();
  };
  const removePlan = async () => {
    const next = { ...s.plans };
    delete next[planKey];
    await browser.storage.local.set({ plans: next });
    read();
  };
  const clearAll = async () => {
    await browser.storage.local.clear();
    setMsg({ text: (tt) => tt('settings.cleared'), bad: false });
    read();
  };

  return (
    <div className="settings">
      <div className="set-head">
        <button
          type="button"
          className="icon-btn sm"
          aria-label={t('settings.back')}
          onClick={onBack}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#344054"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <h1 className="disp">{t('popup.settings')}</h1>
      </div>

      <section>
        <h2 className="eyebrow">{t('settings.domains')}</h2>
        <p className="hint">{t('settings.domainsHint')}</p>
        {domains.map((d) => (
          <div key={d} className="dom">
            <span className="mono">{d}</span>
            <button
              type="button"
              aria-label={t('settings.removeDomain', { domain: d })}
              onClick={() => void saveDomains(domains.filter((x) => x !== d))}
            >
              ×
            </button>
          </div>
        ))}
        {adding ? (
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault();
              void addDomain();
            }}
          >
            <input
              autoFocus
              value={draft}
              placeholder="pay.example.net"
              aria-label={t('settings.domainLabel')}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn-p">
              {t('settings.add')}
            </button>
          </form>
        ) : (
          <button type="button" className="add" onClick={() => setAdding(true)}>
            {t('settings.addDomain')}
          </button>
        )}
      </section>

      <section>
        <h2 className="eyebrow">{t('settings.plan')}</h2>
        <div className="plan-row">
          {plan ? (
            <div className="plan-name">
              <span className="kv">{plan.name}</span>
              <span className="hint">
                {t(plan.rows.length === 1 ? 'plan.event' : 'plan.events', { n: plan.rows.length })}
              </span>
            </div>
          ) : (
            <span className="hint">{t('settings.noPlan')}</span>
          )}
          <div className="plan-btns">
            <button type="button" className="btn-s sm" onClick={() => file.current?.click()}>
              {plan ? t('settings.replace') : t('settings.load')}
            </button>
            {plan && (
              <button type="button" className="btn-s sm danger" onClick={() => void removePlan()}>
                {t('settings.removePlan')}
              </button>
            )}
          </div>
          <input
            ref={file}
            type="file"
            hidden
            accept=".csv,.json,text/csv,application/json"
            aria-label={t('settings.load')}
            onChange={(e) => {
              void loadPlan(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      <section>
        <div className="line">
          <label htmlFor="lang">{t('settings.language')}</label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => void browser.storage.local.set({ lang: e.target.value })}
          >
            <option value="en">English</option>
            <option value="az">Azərbaycan</option>
          </select>
        </div>
        <div className="line">
          <span>{t('settings.yourData')}</span>
          <button type="button" className="btn-s sm" onClick={() => void clearAll()}>
            {t('settings.clearAll')}
          </button>
        </div>
        <p className="hint small">{t('settings.privacyNote')}</p>
        {msg && (
          <p className={`msg${msg.bad ? ' is-bad' : ''}`} role={msg.bad ? 'alert' : 'status'}>
            <Icon name={msg.bad ? 'alert' : 'check'} /> {msg.text(t)}
          </p>
        )}
      </section>

      <section>
        <h2 className="eyebrow">{t('settings.more')}</h2>
        {MORE.map((slug) => (
          <a
            key={slug}
            className="tool"
            href={toolUrl(slug, '', {
              source: 'hitline',
              medium: 'extension',
              campaign: 'more_tools',
            })}
            target="_blank"
            rel="noopener"
          >
            <Logo brand={slug} theme="light" size={24} word={false} label="" />
            <strong>{NAME[slug]}</strong>
            <span>{t(`settings.tool.${slug}` as 'settings.tool.serpline')}</span>
            <Icon name="arrow" size={14} stroke={2.4} />
          </a>
        ))}
      </section>

      <footer className="set-foot">
        <span>{t('settings.version', { v: browser.runtime.getManifest().version })}</span>
        <span className="links">
          <a href={privacyUrl('hitline')} target="_blank" rel="noopener">
            {t('settings.privacy')}
          </a>
          <a
            href={contactUrl({ source: 'hitline', medium: 'extension', campaign: 'settings' })}
            target="_blank"
            rel="noopener"
          >
            {t('settings.contact')}
          </a>
        </span>
      </footer>
    </div>
  );
}
