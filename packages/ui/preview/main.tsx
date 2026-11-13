import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TOOL_SLUGS } from '@line/core/site';
import '../src/fonts.css';
import '../src/tokens.css';
import '../src/ui.css';
import '../src/serpline/serpline.css';
import '../src/rivaline/rivaline.css';
import './preview.css';
import { RivalineDemo } from './RivalineDemo.tsx';
import { SerplineDemo } from './SerplineDemo.tsx';
import {
  BRANDS,
  Button,
  Card,
  CtaBand,
  FOLDLINE_GLYPHS,
  Glyph,
  HeroPill,
  HubLogo,
  KeyValueTable,
  LIME,
  LIME_INK,
  LinkButton,
  Logo,
  MARKLINE_GLYPHS,
  MARK_NAMES,
  Mark,
  Pill,
  STATUS,
  Table,
  contrast,
  type LogoTheme,
} from '../src/index.ts';

const icons = import.meta.glob('../icons/*/icon-*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const iconUrl = (slug: string, size: number) => icons[`../icons/${slug}/icon-${size}.png`];

const THEMES: Array<{ theme: LogoTheme; bg: string }> = [
  { theme: 'light', bg: '#FFFFFF' },
  { theme: 'dark', bg: '#120D24' },
  { theme: 'mono', bg: '#FFFFFF' },
  { theme: 'white', bg: '#120D24' },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pv-section" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

function Ratio({ fg, bg, label }: { fg: string; bg: string; label: string }) {
  const r = contrast(fg, bg);
  return (
    <tr>
      <td>
        <span className="pv-swatch" style={{ background: bg, color: fg }}>
          Aa
        </span>
      </td>
      <td>{label}</td>
      <td className="line-mono">
        {fg} on {bg}
      </td>
      <td>
        <Pill tone={r >= 4.5 ? 'ok' : 'problem'}>{r.toFixed(2)}:1</Pill>
      </td>
    </tr>
  );
}

function App() {
  return (
    <main className="pv">
      <header className="pv-head">
        <HubLogo theme="dark" size={44} />
        <p>
          Line family UI preview: <code>packages/ui</code>. Logo, HubLogo, tokens, Button, Pill,
          Card, Table, CTA band, Serpline and Rivaline panels, Glyph, Mark and extension icons.
        </p>
      </header>

      <Section id="logos" title="Logo: 5 tools, 4 themes">
        <div className="pv-logo-grid">
          {THEMES.map(({ theme, bg }) => (
            <div key={theme} className="pv-logo-col" style={{ background: bg }}>
              <span
                className="pv-label"
                style={{ color: bg === '#FFFFFF' ? '#667085' : '#B9B4D0' }}
              >
                {theme}
              </span>
              {TOOL_SLUGS.map((s) => (
                <Logo key={s} brand={s} theme={theme} size={40} />
              ))}
              <HubLogo theme={theme} size={40} />
            </div>
          ))}
        </div>
        <div className="pv-row pv-sizes">
          {[72, 48, 30, 20, 16].map((size) => (
            <Logo key={size} brand="hitline" size={size} word={size >= 30} />
          ))}
          <HubLogo size={72} />
        </div>
      </Section>

      <Section id="themes" title="Tool themes">
        <div className="pv-themes">
          {TOOL_SLUGS.map((s) => (
            <Card key={s} className={`line-theme-${s}`} interactive>
              <div className="pv-row pv-between">
                <Logo brand={s} size={32} />
                <Pill tone="brand" size="lg">
                  {BRANDS[s].accent}
                </Pill>
              </div>
              <div className="pv-swatches">
                {(['accent', 'bright', 'tint', 'tintInk'] as const).map((k) => (
                  <span key={k} className="pv-chip">
                    <i style={{ background: BRANDS[s][k] }} />
                    <span>{k}</span>
                    <code>{BRANDS[s][k]}</code>
                  </span>
                ))}
              </div>
              <div className="pv-row">
                <Button size="md" arrow>
                  Add to Chrome
                </Button>
                <Button size="xs">Export PDF</Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="pv-row">
          <Button variant="accent" arrow>
            Add to Chrome
          </Button>
          <LinkButton variant="lime" href="#buttons" arrow>
            Book a call
          </LinkButton>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent" disabled>
            Disabled
          </Button>
        </div>
        <div className="pv-row pv-dark">
          <Button variant="white">See the 5 tools</Button>
          <Button variant="ghost">Try a tool in the browser</Button>
          <Button variant="lime" size="sm">
            Book a call
          </Button>
          <HeroPill>Free Chrome extension</HeroPill>
        </div>
        <div className="pv-row">
          {(['lg', 'md', 'sm', 'xs'] as const).map((size) => (
            <Button key={size} size={size} className="line-theme-serpline">
              Size {size}
            </Button>
          ))}
        </div>
      </Section>

      <Section id="pills" title="Pills (status always with icon and label)">
        <div className="pv-row">
          <Pill tone="ok">OK</Pill>
          <Pill tone="problem">Problem</Pill>
          <Pill tone="warning">Warning</Pill>
          <Pill tone="neutral">Not checked</Pill>
          <Pill tone="ok" size="lg">
            Consent respected
          </Pill>
          <Pill tone="problem" size="lg">
            Fires before consent
          </Pill>
          <span className="line-theme-foldline">
            <Pill tone="brand" size="lg">
              For CRO
            </Pill>
          </span>
        </div>
      </Section>

      <Section id="cards" title="Card, Table and CTA band">
        <div className="pv-two">
          <Card>
            <h3 className="pv-h3">Setup</h3>
            <KeyValueTable
              caption="Setup"
              rows={[
                { k: 'GTM', v: 'GTM-K7P2QX, 24 tags' },
                {
                  k: 'Server-side',
                  v: 'GA4 through data.example.com, Meta and TikTok from the browser',
                },
                { k: 'Consent Mode v2', v: 'Correct on Google tags, missing on Meta and TikTok' },
                { k: 'Tracking plan', v: '4 of 8 events match' },
              ]}
            />
          </Card>
          <Card>
            <h3 className="pv-h3">Events</h3>
            <Table
              caption="Events"
              rowKey={(r) => r.event + r.platform}
              columns={[
                {
                  key: 'p',
                  header: 'Platform',
                  cell: (r) => (
                    <span className="pv-row pv-tight">
                      <Mark name={r.mark} size={20} title={null} />
                      {r.platform}
                    </span>
                  ),
                },
                { key: 'e', header: 'Event', cell: (r) => r.event, mono: true },
                {
                  key: 's',
                  header: 'Status',
                  cell: (r) => <Pill tone={r.tone}>{r.status}</Pill>,
                },
              ]}
              rows={[
                {
                  mark: 'googleanalytics' as const,
                  platform: 'GA4',
                  event: 'purchase',
                  tone: 'ok' as const,
                  status: 'OK',
                },
                {
                  mark: 'meta' as const,
                  platform: 'Meta',
                  event: 'AddToCart',
                  tone: 'warning' as const,
                  status: 'No value',
                },
                {
                  mark: 'tiktok' as const,
                  platform: 'TikTok',
                  event: 'ViewContent',
                  tone: 'problem' as const,
                  status: 'After reject',
                },
              ]}
            />
          </Card>
        </div>
        <CtaBand
          title="Need help fixing these issues?"
          sub="Shamistan Isayev, analytics and server-side tracking"
          href="https://shamistanisayev.com/?utm_source=hitline&utm_medium=extension&utm_campaign=panel_cta"
          label="shamistanisayev.com"
        />
        <CtaBand
          size="lg"
          headingLevel={2}
          title="Want a second pair of eyes on your tracking?"
          sub="Book a call and get a clear list of what to fix first."
          href="https://shamistanisayev.com/?utm_source=getlineapps&utm_medium=landing&utm_campaign=hub_cta"
          label="Book a call"
        />
      </Section>

      <Section id="serpline" title="Serpline side panel (400 px)">
        <SerplineDemo />
      </Section>

      <Section id="rivaline" title="Rivaline side panel (400 px)">
        <RivalineDemo />
      </Section>

      <Section id="glyphs" title="Glyphs (Foldline, Markline)">
        <div className="pv-glyphs">
          {(Object.keys(FOLDLINE_GLYPHS) as Array<keyof typeof FOLDLINE_GLYPHS>).map((k) => (
            <Glyph key={k} set="foldline" kind={k} tone="brand" />
          ))}
        </div>
        <div className="pv-glyphs">
          {(['neutral', 'bad', 'ok'] as const).map((tone) => (
            <Glyph key={tone} set="foldline" kind="button" tone={tone} size={36} />
          ))}
        </div>
        <div className="pv-glyphs">
          {(Object.keys(MARKLINE_GLYPHS) as Array<keyof typeof MARKLINE_GLYPHS>).map((k) => (
            <Glyph key={k} set="markline" kind={k} />
          ))}
        </div>
        <div className="pv-glyphs">
          {(['neutral', 'brand', 'solid', 'ink'] as const).map((tone) => (
            <Glyph key={tone} set="markline" kind="arrow" tone={tone} size={36} />
          ))}
        </div>
      </Section>

      <Section id="marks" title="Marks (platforms, from the design's brand icons)">
        <div className="pv-glyphs">
          {MARK_NAMES.map((n) => (
            <Mark key={n} name={n} size={32} />
          ))}
        </div>
      </Section>

      <Section id="icons" title="Extension icons 16, 32, 48, 128">
        <div className="pv-icons">
          {[...TOOL_SLUGS, 'hub'].map((s) => (
            <div key={s} className="pv-icon-col">
              <span className="pv-label">{s}</span>
              <div className="pv-row pv-end">
                {[128, 48, 32, 16].map((size) => (
                  <img
                    key={size}
                    src={iconUrl(s, size)}
                    width={size}
                    height={size}
                    alt={`${s} ${size}px`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contrast" title="Contrast (WCAG AA)">
        <table className="line-table">
          <tbody>
            {TOOL_SLUGS.map((s) => (
              <Ratio
                key={s}
                fg={BRANDS[s].onAccent}
                bg={BRANDS[s].accent}
                label={`${BRANDS[s].name} button`}
              />
            ))}
            {TOOL_SLUGS.map((s) => (
              <Ratio
                key={`t-${s}`}
                fg={BRANDS[s].tintInk}
                bg={BRANDS[s].tint}
                label={`${BRANDS[s].name} tint`}
              />
            ))}
            {Object.entries(STATUS).map(([k, v]) => (
              <Ratio key={k} fg={v.text} bg={v.bg} label={`Status ${k}`} />
            ))}
            <Ratio fg={LIME_INK} bg={LIME} label="Lime CTA" />
          </tbody>
        </table>
      </Section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
