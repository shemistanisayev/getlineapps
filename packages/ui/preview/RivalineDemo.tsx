/** Rivaline panel pieces with the design's demo data (design/rivaline Main, StackDetail, Ads, Brand, BrandExport). */
import { useState } from 'react';
import { contrast } from '../src/contrast.ts';
import { Glyph } from '../src/components/Glyph.tsx';
import { Pill } from '../src/components/Base.tsx';
import { RIVALINE_GLYPHS, type RivalineGlyph } from '../src/glyphs.ts';
import {
  ButtonPreview,
  CardHead,
  CategoryChips,
  CodeBlock,
  EvidenceList,
  FontRow,
  GapStrip,
  LibraryRow,
  LogoBox,
  NotFoundCard,
  PanelHeader,
  RIVALINE_CONTRAST,
  RvButton,
  RvCard,
  RvField,
  Segmented,
  StackHero,
  Swatch,
  Toast,
  ToolGroup,
  ToolRow,
  type ToolIcon,
} from '../src/rivaline/index.ts';

type Tab = 'stack' | 'ads' | 'brand';
type Fmt = 'css' | 'json' | 'png';
const CTA =
  'https://shamistanisayev.com/?utm_source=rivaline&utm_medium=extension&utm_campaign=panel_cta';

const GROUPS: Array<{
  name: string;
  tools: Array<{ icon: ToolIcon; name: string; id: string }>;
}> = [
  {
    name: 'Advertising',
    tools: [
      { icon: { mark: 'meta' }, name: 'Meta Pixel', id: '418273650912345' },
      { icon: { mark: 'tiktok' }, name: 'TikTok Pixel', id: 'C9H3KQ7RC77U2M0V5PLG' },
      { icon: { mark: 'googleads' }, name: 'Google Ads', id: 'AW-11284956' },
      { icon: { mark: 'pinterest' }, name: 'Pinterest Tag', id: '2612345678901' },
    ],
  },
  {
    name: 'Analytics',
    tools: [
      { icon: { mark: 'googleanalytics' }, name: 'Google Analytics 4', id: 'G-8XK2LM4QPZ' },
      { icon: { mark: 'hotjar' }, name: 'Hotjar', id: 'site 3918274' },
    ],
  },
  {
    name: 'Tag management',
    tools: [{ icon: { mark: 'googletagmanager' }, name: 'Google Tag Manager', id: 'GTM-N4KV8R' }],
  },
];

const GAPS = [
  { title: 'Server-side tracking', text: 'All 4 ad pixels send straight from the browser.' },
  { title: 'Consent banner', text: 'No consent platform or consent update found.' },
  { title: 'CRM', text: 'No HubSpot, Salesforce or Zoho script on the page.' },
];

const COLORS = [
  { role: 'Primary', hex: '#2F5D46' },
  { role: 'Text', hex: '#1E2B24' },
  { role: 'Background', hex: '#F6F1EA' },
  { role: 'Accent', hex: '#EBC56B' },
  { role: 'Surface', hex: '#DCE5D8' },
];

const CSS = `:root {
  --kova-primary: #2F5D46;
  --kova-text: #1E2B24;
  --kova-background: #F6F1EA;
  --kova-accent: #EBC56B;
  --kova-surface: #DCE5D8;
  --kova-font-heading: "Fraunces", serif;
  --kova-font-body: "DM Sans", sans-serif;
  --kova-button-radius: 999px;
}`;

export function RivalineDemo() {
  const [tab, setTab] = useState<Tab>('stack');
  const [chip, setChip] = useState('all');
  const [open, setOpen] = useState('Meta Pixel');
  const [fmt, setFmt] = useState<Fmt>('css');
  const tabs = [
    { id: 'stack' as const, label: 'Stack', count: 13, countLabel: '13 tools' },
    { id: 'ads' as const, label: 'Ads', count: 4, countLabel: '4 ad libraries' },
    { id: 'brand' as const, label: 'Brand', count: 5, countLabel: '5 colors' },
  ];
  const header = (active: Tab | null, empty = false) => (
    <PanelHeader
      readAgainLabel="Read the page again"
      settingsLabel="Settings"
      pdfLabel="Report PDF"
      readDisabled={empty}
      tabsLabel="Rivaline sections"
      tabs={tabs}
      active={active}
      onSelect={setTab}
    />
  );

  return (
    <div className="pv-sl">
      <div className="rv-panel pv-sl-panel">
        {header(tab)}
        <div className="pv-sl-body pv-rv-body">
          {tab === 'stack' && (
            <>
              <StackHero
                host="example.com"
                page="Home page"
                title="13 tools in 8 categories"
                subline="Shopify store running Meta, TikTok, Google and Pinterest ads"
                icons={(
                  [
                    'shopify',
                    'googletagmanager',
                    'googleanalytics',
                    'meta',
                    'tiktok',
                    'googleads',
                    'pinterest',
                  ] as const
                ).map((m) => ({ key: m, icon: { mark: m }, title: m }))}
                more={6}
                moreLabel="6 more tools"
              />
              <GapStrip count="3 gaps" list="server-side tracking, consent banner, CRM" />
              <CategoryChips
                label="Categories"
                active={chip}
                onSelect={setChip}
                chips={[
                  { id: 'all', label: 'All', count: 13 },
                  { id: 'advertising', label: 'Advertising', count: 4 },
                  { id: 'analytics', label: 'Analytics', count: 2 },
                  { id: 'payments', label: 'Payments', count: 2 },
                  { id: 'tags', label: 'Tag management', count: 1 },
                ]}
              />
              <RvCard className="rv-tools" label="Tools">
                {GROUPS.map((g) => (
                  <ToolGroup key={g.name} name={g.name} count={g.tools.length}>
                    {g.tools.map((t) => (
                      <ToolRow
                        key={t.name}
                        icon={t.icon}
                        name={t.name}
                        id={t.id}
                        expanded={open === t.name}
                        detailId={`pv-rv-${t.id}`}
                        onToggle={() => setOpen(open === t.name ? '' : t.name)}
                      >
                        <EvidenceList
                          title="How Rivaline found it"
                          rows={[
                            { kind: 'Script', value: 'connect.facebook.net/en_US/fbevents.js' },
                            { kind: 'Global', value: 'window.fbq' },
                            { kind: 'Cookie', value: '_fbp' },
                            { kind: 'Request', value: 'www.facebook.com/tr' },
                          ]}
                        />
                        <div className="rv-tdetail-actions">
                          <RvButton icon="copy">Copy ID</RvButton>
                          <RvButton icon="external">Open in Meta Ad Library</RvButton>
                        </div>
                      </ToolRow>
                    ))}
                  </ToolGroup>
                ))}
              </RvCard>
              <NotFoundCard
                title="Not found on this page"
                gaps={GAPS}
                cta={{
                  text: 'Want these in place on your own site?',
                  label: 'Get in touch',
                  href: CTA,
                }}
              />
            </>
          )}

          {tab === 'ads' && (
            <>
              <RvCard className="pv-rv-pad">
                <CardHead title="Search for" />
                <div className="pv-rv-two">
                  <RvField label="Brand name">
                    <input className="rv-in" defaultValue="Kova" />
                  </RvField>
                  <RvField label="Domain">
                    <input className="rv-in rv-mono" defaultValue="example.com" />
                  </RvField>
                </div>
                <RvField label="Country">
                  <select className="rv-in" defaultValue="ALL">
                    <option value="ALL">All countries</option>
                  </select>
                </RvField>
              </RvCard>
              <RvCard>
                <ul className="rv-libs">
                  <LibraryRow
                    icon={{ mark: 'meta' }}
                    name="Meta Ad Library"
                    desc="Facebook, Instagram and Messenger ads"
                    href="https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=keyword_unordered&q=Kova"
                    openLabel="Open Meta Ad Library"
                    query="Kova"
                    status={{ found: true, label: 'Meta Pixel on site' }}
                    highlighted
                  />
                  <LibraryRow
                    icon={{ mark: 'google' }}
                    name="Google Ads Transparency Center"
                    desc="Search, YouTube, Shopping and Display ads"
                    href="https://adstransparency.google.com/?region=anywhere&domain=example.com"
                    openLabel="Open Google Ads Transparency Center"
                    query="example.com"
                    status={{ found: true, label: 'Google Ads tag on site' }}
                  />
                  <LibraryRow
                    icon={{ mark: 'tiktok' }}
                    name="TikTok Ad Library"
                    desc="Ads shown in Europe"
                    href="https://library.tiktok.com/ads?region=all&adv_name=Kova"
                    openLabel="Open TikTok Ad Library"
                    query="Kova"
                    status={{ found: true, label: 'TikTok Pixel on site' }}
                  />
                  <LibraryRow
                    icon={{ mark: 'library' }}
                    name="LinkedIn Ad Library"
                    desc="Sponsored content on LinkedIn"
                    href="https://www.linkedin.com/ad-library/search?accountOwner=Kova"
                    openLabel="Open LinkedIn Ad Library"
                    query="Kova"
                    status={{ found: false, label: 'No LinkedIn Insight Tag' }}
                  />
                </ul>
              </RvCard>
              <div className="pv-rv-actions">
                <RvButton variant="primary" size="lg">
                  Open all 4 in new tabs
                </RvButton>
                <RvButton size="lg">Copy links</RvButton>
              </div>
            </>
          )}

          {tab === 'brand' && (
            <>
              <RvCard className="pv-rv-pad">
                <CardHead title="Logo" note="From the page header, 112 x 36 px" />
                <div className="pv-rv-logo">
                  <LogoBox>
                    <span className="pv-rv-kova">
                      <i />
                      kova
                    </span>
                  </LogoBox>
                  <div className="pv-rv-col">
                    <RvButton>Copy PNG</RvButton>
                    <RvButton>Download PNG</RvButton>
                  </div>
                </div>
              </RvCard>
              <RvCard className="pv-rv-pad">
                <CardHead title="Colors" note="Click a color to copy" />
                <div className="rv-swatches">
                  {COLORS.map((c) => (
                    <Swatch key={c.hex} {...c} copyLabel={`Copy ${c.hex}`} />
                  ))}
                </div>
              </RvCard>
              <RvCard className="pv-rv-pad pv-rv-fonts">
                <CardHead title="Fonts" />
                <FontRow
                  role="Headings"
                  name="Fraunces"
                  detail="600, 52 px"
                  source="Google Fonts"
                />
                <FontRow role="Body" name="DM Sans" detail="400, 16 px" source="Google Fonts" />
              </RvCard>
              <RvCard className="pv-rv-pad">
                <CardHead title="Main button" />
                <ButtonPreview
                  label="Shop the routine"
                  style={{
                    height: 44,
                    padding: '0 22px',
                    borderRadius: 999,
                    background: '#2F5D46',
                    color: '#F6F1EA',
                    fontFamily: "'DM Sans', Arial, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  spec={['background #2F5D46', 'radius 999px, height 50px', 'DM Sans 600, 15px']}
                />
              </RvCard>
            </>
          )}
        </div>
      </div>

      <div className="rv-panel pv-sl-panel">
        <div className="pv-sl-body pv-rv-body">
          <p className="rv-eyebrow">Export sheet (in place, not fixed)</p>
          <div className="pv-rv-sheet">
            <div className="pv-sl-between">
              <b className="pv-sl-hero-title">Export brand kit</b>
              <button type="button" className="rv-ib" aria-label="Close">
                ×
              </button>
            </div>
            <Segmented
              label="Format"
              value={fmt}
              onChange={setFmt}
              options={[
                { id: 'css', label: 'CSS variables' },
                { id: 'json', label: 'JSON' },
                { id: 'png', label: 'PNG palette' },
              ]}
            />
            <CodeBlock label="CSS variables" code={CSS} />
            <div className="pv-rv-two">
              <RvButton variant="primary" size="lg" icon="check">
                Copied
              </RvButton>
              <RvButton size="lg">Download kova.css</RvButton>
            </div>
            <span className="rv-note">Font names only. Rivaline never downloads font files.</span>
          </div>
          <div className="pv-rv-toast">
            <Toast>CSS copied to clipboard</Toast>
          </div>
          <p className="rv-eyebrow">Access and Restricted header</p>
          {header(null, true)}
          <p className="rv-eyebrow">Category glyphs (no brand mark)</p>
          <div className="pv-glyphs">
            {(Object.keys(RIVALINE_GLYPHS) as RivalineGlyph[]).map((k) => (
              <Glyph key={k} set="rivaline" kind={k} size={28} />
            ))}
          </div>
          <div className="pv-glyphs">
            {(['neutral', 'brand', 'warning'] as const).map((tone) => (
              <Glyph key={tone} set="rivaline" kind="crm" tone={tone} size={32} />
            ))}
          </div>
        </div>
      </div>

      <table className="line-table pv-sl-contrast">
        <caption>Rivaline contrast pairs</caption>
        <tbody>
          {RIVALINE_CONTRAST.map(({ label, fg, bg }) => {
            const r = contrast(fg, bg);
            return (
              <tr key={label}>
                <td>
                  <span className="pv-swatch" style={{ background: bg, color: fg }}>
                    Aa
                  </span>
                </td>
                <td>{label}</td>
                <td>
                  <Pill tone={r >= 4.5 ? 'ok' : 'problem'}>{r.toFixed(2)}:1</Pill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
