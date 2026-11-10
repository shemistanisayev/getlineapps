import { contactUrl } from '@line/core/site';
import type { Audit, Platform, SgtmSignal, TagStatus } from '@line/core/hitline';
import { joinList, type T } from '../../src/i18n/index.ts';
import { useT } from '../../src/useLang.ts';
import {
  Icon,
  Pill,
  PlatformBadge,
  PLATFORM_NAME,
  type IconName,
  type Tone,
} from '../../src/ui.tsx';

const STATUS: Record<TagStatus, { tone: Tone; icon: IconName }> = {
  fired: { tone: 'ok', icon: 'check' },
  missing_value: { tone: 'warn', icon: 'alert' },
  no_consent_check: { tone: 'bad', icon: 'alert' },
  waiting_consent: { tone: 'mute', icon: 'clock' },
  not_fired: { tone: 'mute', icon: 'dash' },
};

const CTA = contactUrl({ source: 'hitline', medium: 'extension', campaign: 'panel_cta' });

function evidence(s: SgtmSignal, t: T): string {
  if (!s.found) return t('sgtm.notFound');
  if (s.id === 'fpid_cookie') return s.days ? t('sgtm.fpidDays', { days: s.days }) : 'HttpOnly';
  return s.evidence ?? '';
}

/** GTM and sGTM tab: design/hitline/Gtm.dc.html. */
export function GtmTab({ audit }: { audit: Audit }) {
  const { t } = useT();
  const view = audit.gtm[0];
  const s = audit.sgtm;
  const names = (ps: Platform[]) =>
    joinList(
      ps.map((p) => PLATFORM_NAME[p]),
      t,
    );
  return (
    <div className="gtm">
      <div className="gtm-main">
        {view ? (
          <>
            <div className="card stats">
              <div className="stat wide">
                <span className="eyebrow">{t('gtm.container')}</span>
                <span className="mono cid">{view.container.id}</span>
                {view.container.estimated && <span className="est">{t('gtm.estimated')}</span>}
              </div>
              <div className="stat">
                <span className="eyebrow">{t('gtm.tags')}</span>
                <span className="disp num">{view.tags.length}</span>
              </div>
              <div className="stat">
                <span className="eyebrow">{t('gtm.triggers')}</span>
                <span className="disp num">
                  {view.container.estimated ? '-' : view.container.triggers}
                </span>
              </div>
              <div className="stat">
                <span className="eyebrow">{t('gtm.variables')}</span>
                <span className="disp num">
                  {view.container.estimated ? '-' : view.container.variables}
                </span>
              </div>
            </div>
            <div className="card tags" role="table" aria-label={t('gtm.tags')}>
              <div className="th tag-grid" role="row">
                <span role="columnheader">{t('gtm.th.tag')}</span>
                <span role="columnheader">{t('gtm.th.type')}</span>
                <span role="columnheader">{t('gtm.th.trigger')}</span>
                <span role="columnheader">{t('gtm.th.status')}</span>
              </div>
              {view.tags.map((tag) => (
                <div key={tag.index} className="row tag-grid" role="row">
                  <span role="cell">
                    {tag.platform && tag.platform !== 'gtm' ? (
                      <PlatformBadge platform={tag.platform} label={tag.name} />
                    ) : (
                      <span className="pf">{tag.name}</span>
                    )}
                  </span>
                  <span role="cell" className="ty">
                    {tag.type}
                  </span>
                  <span role="cell" className="mono tr">
                    {tag.trigger}
                  </span>
                  <span role="cell">
                    <Pill tone={STATUS[tag.status].tone} icon={STATUS[tag.status].icon}>
                      {t(`gtm.status.${tag.status}`)}
                    </Pill>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card gtm-none">{t('gtm.none')}</div>
        )}
      </div>
      <div className="gtm-side">
        <div className={`hero${s.detected ? '' : ' off'}`}>
          <div className="hero-top">
            <span className="disp">{t('sgtm.title')}</span>
            {s.detected ? (
              <span className="pill lime">
                <Icon name="check" />
                {t('sgtm.detected')}
              </span>
            ) : (
              <span className="pill dim">
                <Icon name="dash" />
                {t('sgtm.notDetected')}
              </span>
            )}
          </div>
          <ul className="signals">
            {s.signals.map((sig) => (
              <li key={sig.id} className={sig.found ? '' : 'no'}>
                <span className="sig-ic">
                  <Icon name={sig.found ? 'check' : 'x'} />
                </span>
                <div>
                  <span className="sig-t">{t(`sgtm.${sig.id}`)}</span>
                  <span className="mono soft">{evidence(sig, t)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {s.detected && s.browserPlatforms.length > 0 && (
          <div className="card warncard">
            <span className="w-ic">
              <Icon name="alert" />
            </span>
            <div>
              <strong>{t('sgtm.browserOnly.title', { server: names(s.serverPlatforms) })}</strong>
              <span>{t('sgtm.browserOnly.text', { browser: names(s.browserPlatforms) })}</span>
            </div>
          </div>
        )}
        <div className="ph-grow" />
        <div className="cta">
          <span>
            {s.detected && s.browserPlatforms.length > 0
              ? t('sgtm.cta.move', { browser: names(s.browserPlatforms) })
              : t('sgtm.cta.setup')}
          </span>
          <a className="btn-ink" href={CTA} target="_blank" rel="noopener">
            {t('cta.contact')}
          </a>
        </div>
      </div>
    </div>
  );
}
