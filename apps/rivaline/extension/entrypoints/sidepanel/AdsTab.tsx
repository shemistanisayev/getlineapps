import {
  COUNTRY_CODES,
  brandDomain,
  brandName,
  libraryLinks,
  type LibraryId,
} from '@line/core/rivaline';
import { CardHead, LibraryRow, RvButton, RvCard, RvField, type ToolIcon } from '@line/ui/rivaline';
import { useEffect, useMemo, useState } from 'react';
import type { ScanResult } from '../../src/capture/scan.ts';
import type { Lang, MessageKey, T } from '../../src/i18n/index.ts';
import { getCountry } from '../../src/storage.ts';

const ICONS: Record<LibraryId, ToolIcon> = {
  meta: { mark: 'meta' },
  google: { mark: 'google' },
  tiktok: { mark: 'tiktok' },
  // LinkedIn has no mark in simple-icons: the design uses the neutral library mark.
  linkedin: { mark: 'library' },
};

/** Country select options: "All countries" first, then every ISO code by its name. */
export function countryOptions(lang: Lang, all: string): Array<{ code: string; name: string }> {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([lang, 'en'], { type: 'region' });
  } catch {
    names = null;
  }
  const list = COUNTRY_CODES.map((code) => ({ code, name: names?.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, lang),
  );
  return [{ code: 'ALL', name: all }, ...list];
}

/** Ads tab (design: Ads). Brand, domain and country can be edited here; nothing is saved. */
export function AdsTab({
  result,
  t,
  lang,
  highlight,
  onToast,
}: {
  result: ScanResult;
  t: T;
  lang: Lang;
  highlight: string | null;
  onToast: (text: string) => void;
}) {
  const [brand, setBrand] = useState(() => brandName(result.snapshot));
  const [domain, setDomain] = useState(() => brandDomain(result.url));
  const [country, setCountry] = useState('ALL');
  useEffect(() => {
    void getCountry().then(setCountry);
  }, []);

  const options = useMemo(() => countryOptions(lang, t('ads.allCountries')), [lang, t]);
  const links = libraryLinks({ brand, domain, country }, result.stack.tools);

  const openAll = async () => {
    for (const [i, l] of links.entries())
      await browser.tabs.create({ url: l.url, active: i === 0 });
  };
  const copyLinks = async () => {
    try {
      await navigator.clipboard.writeText(links.map((l) => l.url).join('\n'));
      onToast(t('ads.copied'));
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <>
      <RvCard className="rp-pad">
        <CardHead title={t('ads.searchFor')} />
        <div className="rp-two">
          <RvField label={t('ads.brand')}>
            <input
              className="rv-in"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              maxLength={60}
              spellCheck={false}
            />
          </RvField>
          <RvField label={t('ads.domain')}>
            <input
              className="rv-in rv-mono rp-mono-in"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              spellCheck={false}
            />
          </RvField>
        </div>
        <RvField label={t('ads.country')}>
          <select className="rv-in" value={country} onChange={(e) => setCountry(e.target.value)}>
            {options.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </RvField>
      </RvCard>
      <RvCard>
        <ul className="rv-libs">
          {links.map((l) => {
            const library = t(`lib.${l.id}` as MessageKey);
            const tool = t(`ads.tool.${l.id}` as MessageKey);
            return (
              <LibraryRow
                key={l.id}
                icon={ICONS[l.id]}
                name={library}
                desc={t(`ads.desc.${l.id}` as MessageKey)}
                href={l.url}
                openLabel={t('ads.open', { library })}
                query={l.query}
                status={{
                  found: l.found,
                  label: l.found ? t('ads.found', { tool }) : t('ads.missing', { tool }),
                }}
                highlighted={highlight === l.id}
              />
            );
          })}
        </ul>
      </RvCard>
      <div className="rp-actions">
        <RvButton variant="primary" size="lg" onClick={() => void openAll()}>
          {t('ads.openAll')}
        </RvButton>
        <RvButton size="lg" onClick={() => void copyLinks()}>
          {t('ads.copyLinks')}
        </RvButton>
      </div>
      <p className="rp-muted rp-note">{t('ads.note')}</p>
    </>
  );
}
