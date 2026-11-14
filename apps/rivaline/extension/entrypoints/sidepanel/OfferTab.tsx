import type { AppLink, PromoKind, SiteInfo, SocialNetwork } from '@line/core/rivaline';
import { CardHead, RvCard, RvIcon, ToolIconView, type ToolIcon } from '@line/ui/rivaline';
import type { ReactNode } from 'react';
import type { ScanResult } from '../../src/capture/scan.ts';
import type { Lang, MessageKey, T } from '../../src/i18n/index.ts';
import {
  NETWORK_NAMES,
  STORE_NAMES,
  displayNames,
  leadTools,
  priceLine,
} from '../../src/offer-format.ts';

/** Network names are brand names: the same in every language. */
export const NETWORK: Record<SocialNetwork, { name: string; icon: ToolIcon }> = {
  instagram: { name: NETWORK_NAMES.instagram, icon: { mark: 'instagram' } },
  facebook: { name: NETWORK_NAMES.facebook, icon: { mark: 'facebook' } },
  tiktok: { name: NETWORK_NAMES.tiktok, icon: { mark: 'tiktok' } },
  youtube: { name: NETWORK_NAMES.youtube, icon: { mark: 'youtube' } },
  // simple-icons has no LinkedIn mark (the Ads tab does the same).
  linkedin: { name: NETWORK_NAMES.linkedin, icon: { mark: 'link' } },
  x: { name: NETWORK_NAMES.x, icon: { mark: 'x' } },
  telegram: { name: NETWORK_NAMES.telegram, icon: { mark: 'telegram' } },
  pinterest: { name: NETWORK_NAMES.pinterest, icon: { mark: 'pinterest' } },
  threads: { name: NETWORK_NAMES.threads, icon: { mark: 'threads' } },
  vk: { name: NETWORK_NAMES.vk, icon: { mark: 'vk' } },
};
export const STORE: Record<AppLink['store'], { name: string; icon: ToolIcon }> = {
  appstore: { name: STORE_NAMES.appstore, icon: { mark: 'appstore' } },
  googleplay: { name: STORE_NAMES.googleplay, icon: { mark: 'googleplay' } },
};
const MAX_REGIONS = 6;

/** A link row: icon, name, the handle or number, and an open button (a new tab, on click only). */
function LinkRow({
  icon,
  name,
  value,
  href,
  action,
}: {
  icon: ToolIcon;
  name: string;
  value: string;
  href?: string;
  action: ReactNode;
}) {
  return (
    <li className="rp-link">
      <ToolIconView icon={icon} size={28} />
      <span className="rp-link-text">
        <span className="rp-link-name">{name}</span>
        <span className="rp-link-value rv-mono" title={href ?? value}>
          {value}
        </span>
      </span>
      {action}
    </li>
  );
}

function OpenButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="rv-btn rv-btn--secondary rv-go"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
    >
      <RvIcon name="external" size={15} />
    </a>
  );
}

function CopyButton({ label, onCopy }: { label: string; onCopy: () => void }) {
  return (
    <button
      type="button"
      className="rv-btn rv-btn--secondary rv-go"
      aria-label={label}
      title={label}
      onClick={onCopy}
    >
      <RvIcon name="copy" size={15} />
    </button>
  );
}

/** Offer tab (Rivaline 1.1, docs/rivaline/PLAN-1.1.md step 3). Read only; nothing is saved. */
export function OfferTab({
  result,
  t,
  lang,
  onToast,
}: {
  result: ScanResult;
  t: T;
  lang: Lang;
  onToast: (text: string) => void;
}) {
  const site: SiteInfo | null = result.site;
  if (!site) return <p className="rp-muted">{t('offer.unread')}</p>;
  const { offer, channels, markets, leads } = site;
  const copy = async (text: string, toast: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast(toast);
    } catch {
      /* clipboard blocked */
    }
  };
  const language = displayNames(lang, 'language');
  const region = displayNames(lang, 'region');
  const anyChannel =
    channels.social.length +
      channels.apps.length +
      channels.whatsapp.length +
      channels.emails.length +
      channels.phones.length >
    0;

  return (
    <>
      <RvCard className="rp-pad" label={t('offer.say')}>
        <CardHead title={t('offer.say')} />
        {offer.announcement && (
          <p className="rp-ann">
            <span className="rp-ann-label">{t('offer.topBar')}</span>
            {offer.announcement}
          </p>
        )}
        {offer.headline ? (
          <div className="rp-say">
            <h2 className="rp-headline">{offer.headline}</h2>
            {offer.subline && <p className="rp-subline">{offer.subline}</p>}
          </div>
        ) : (
          <p className="rp-muted">{t('offer.noHeadline')}</p>
        )}
        {offer.ctas.length > 0 && (
          <div className="rp-field">
            <span className="rp-label">{t('offer.buttons')}</span>
            <ul className="rp-ctas">
              {offer.ctas.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {(offer.title || offer.description) && (
          <div className="rp-field">
            <span className="rp-label">{t('offer.search')}</span>
            <div className="rp-serp">
              {offer.title && <b>{offer.title}</b>}
              {offer.description && <span>{offer.description}</span>}
            </div>
          </div>
        )}
      </RvCard>

      <RvCard className="rp-pad" label={t('offer.offers')}>
        <CardHead title={t('offer.offers')} />
        {offer.promos.length ? (
          <ul className="rp-promos">
            {offer.promos.map((p) => (
              <li key={p.text}>
                <span className="rp-promo-kinds">
                  {p.kinds.map((k: PromoKind) => (
                    <span key={k} className="rp-kind">
                      {t(`promo.${k}` as MessageKey)}
                    </span>
                  ))}
                </span>
                <span className="rp-promo-text">{p.text}</span>
                {p.code && (
                  <span className="rp-code">
                    <span className="rv-mono">{p.code}</span>
                    <CopyButton
                      label={t('offer.copyCode', { code: p.code })}
                      onCopy={() => void copy(p.code!, t('offer.codeCopied'))}
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rp-muted">{t('offer.noOffers')}</p>
        )}
        {offer.prices && (
          <div className="rp-field">
            <span className="rp-label">{t('offer.prices')}</span>
            <span className="rp-value">{priceLine(offer.prices, lang, t)}</span>
          </div>
        )}
      </RvCard>

      <RvCard className="rp-pad" label={t('channels.title')}>
        <CardHead title={t('channels.title')} />
        {anyChannel ? (
          <ul className="rp-links">
            {channels.social.map((s) => (
              <LinkRow
                key={s.network}
                icon={NETWORK[s.network].icon}
                name={NETWORK[s.network].name}
                value={s.handle}
                href={s.url}
                action={
                  <OpenButton
                    href={s.url}
                    label={t('channels.open', { name: NETWORK[s.network].name })}
                  />
                }
              />
            ))}
            {channels.apps.map((a) => (
              <LinkRow
                key={a.store}
                icon={STORE[a.store].icon}
                name={STORE[a.store].name}
                value={a.id}
                href={a.url}
                action={
                  <OpenButton
                    href={a.url}
                    label={t('channels.open', { name: STORE[a.store].name })}
                  />
                }
              />
            ))}
            {channels.whatsapp.map((w) => (
              <LinkRow
                key={w}
                icon={{ mark: 'whatsapp' }}
                name="WhatsApp"
                value={w.startsWith('+') ? w : 'wa.me'}
                action={
                  <OpenButton
                    href={w.startsWith('+') ? `https://wa.me/${w.slice(1)}` : w}
                    label={t('channels.open', { name: 'WhatsApp' })}
                  />
                }
              />
            ))}
            {channels.emails.map((e) => (
              <LinkRow
                key={e}
                icon={{ glyph: 'email' }}
                name={t('channels.email')}
                value={e}
                action={
                  <CopyButton
                    label={t('channels.copy', { value: e })}
                    onCopy={() => void copy(e, t('channels.copied'))}
                  />
                }
              />
            ))}
            {channels.phones.map((p) => (
              <LinkRow
                key={p}
                icon={{ glyph: 'chat' }}
                name={t('channels.phone')}
                value={p}
                action={
                  <CopyButton
                    label={t('channels.copy', { value: p })}
                    onCopy={() => void copy(p, t('channels.copied'))}
                  />
                }
              />
            ))}
          </ul>
        ) : (
          <p className="rp-muted">{t('channels.none')}</p>
        )}
      </RvCard>

      <RvCard className="rp-pad" label={t('markets.title')}>
        <CardHead title={t('markets.title')} />
        <dl className="rp-facts">
          <dt>{t('markets.pageLang')}</dt>
          <dd>{markets.pageLang ? language(markets.pageLang) : t('markets.none')}</dd>
          <dt>{t('markets.languages')}</dt>
          <dd>
            {markets.languages.length
              ? markets.languages.map(language).join(', ')
              : t('markets.none')}
          </dd>
          <dt>{t('markets.regions')}</dt>
          <dd>
            {markets.regions.length
              ? [
                  markets.regions.slice(0, MAX_REGIONS).map(region).join(', '),
                  markets.regions.length > MAX_REGIONS
                    ? t('markets.more', { n: markets.regions.length - MAX_REGIONS })
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              : t('markets.none')}
          </dd>
          <dt>{t('markets.currency')}</dt>
          <dd className={markets.currency ? 'rv-mono' : undefined}>
            {markets.currency ?? t('markets.none')}
          </dd>
        </dl>
      </RvCard>

      <RvCard className="rp-pad" label={t('leads.title')}>
        <CardHead title={t('leads.title')} />
        {leads.length ? (
          <dl className="rp-facts">
            {leads.map((l) => (
              <div key={l.way} className="rp-fact">
                <dt>{t(`lead.${l.way}` as MessageKey)}</dt>
                <dd>{leadTools(l, t)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rp-muted">{t('leads.none')}</p>
        )}
      </RvCard>
    </>
  );
}
