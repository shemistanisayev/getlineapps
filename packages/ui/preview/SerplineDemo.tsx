/** Serpline panel pieces with the design's demo data (design/serpline Main, Headings, Ai). */
import { useState } from 'react';
import { Pill } from '../src/components/Base.tsx';
import { contrast } from '../src/contrast.ts';
import {
  BotRow,
  CheckRow,
  CountTile,
  FooterCta,
  HeroCard,
  LimeCta,
  OutlineRow,
  PageRow,
  PanelCard,
  PanelTabs,
  ScoreRing,
  Segmented,
  SerpResult,
  Switch,
  SERPLINE_CONTRAST,
} from '../src/serpline/index.ts';

type Tab = 'summary' | 'headings' | 'links' | 'render' | 'ai';
const CTA =
  'https://shamistanisayev.com/?utm_source=serpline&utm_medium=extension&utm_campaign=panel_cta';

export function SerplineDemo() {
  const [tab, setTab] = useState<Tab>('summary');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [highlight, setHighlight] = useState(true);
  const tabs = [
    { id: 'summary' as const, label: 'Summary' },
    { id: 'headings' as const, label: 'Headings', count: 2, countLabel: '2 issues' },
    { id: 'links' as const, label: 'Links', count: 2, countLabel: '2 issues' },
    { id: 'render' as const, label: 'Render', count: 3, countLabel: '3 issues' },
    { id: 'ai' as const, label: 'AI', count: 1, countLabel: '1 issue' },
  ];

  return (
    <div className="pv-sl">
      <div className="sl-panel pv-sl-panel">
        <PageRow
          host="example.com"
          path="/products/wireless-headphones-pro-x"
          checkAgainLabel="Check again"
          pdfLabel="Audit PDF"
          settingsLabel="Settings"
        />
        <PanelTabs label="Serpline sections" tabs={tabs} active={tab} onSelect={setTab} />
        <div className="pv-sl-body">
          <HeroCard>
            <div className="pv-sl-between">
              <span style={{ fontSize: 13, fontWeight: 600 }}>example.com</span>
              <span className="sl-soft" style={{ fontSize: 12 }}>
                Checked at 10:42
              </span>
            </div>
            <div className="pv-sl-score">
              <ScoreRing score={56} label="SEO score 56 of 100" />
              <div>
                <b className="pv-sl-hero-title">SEO score: needs work</b>
                <span className="sl-soft" style={{ fontSize: 12.5 }}>
                  2 high, 6 medium, 2 low priority issues
                </span>
              </div>
            </div>
          </HeroCard>
          <PanelCard title="On-page checks">
            <CheckRow label="Title">
              <Pill tone="ok">32 characters</Pill>
            </CheckRow>
            <CheckRow label="Meta description">
              <Pill tone="warning" icon="alert">
                Cut off in Google
              </Pill>
            </CheckRow>
            <CheckRow label="H1" tone="problem">
              <Pill tone="problem" icon="alert">
                Only after JavaScript
              </Pill>
            </CheckRow>
            <CheckRow label="hreflang">
              <Pill tone="neutral" icon="dash">
                Not used
              </Pill>
            </CheckRow>
          </PanelCard>
          <PanelCard
            title="Google preview"
            aside={
              <Segmented
                label="Preview device"
                value={device}
                onChange={setDevice}
                options={[
                  { value: 'mobile', label: 'Mobile' },
                  { value: 'desktop', label: 'Desktop' },
                ]}
              />
            }
          >
            <div className="pv-sl-serp">
              <SerpResult
                device={device}
                siteName="Lumo"
                urlLine="https://example.com › products › wireless-headph..."
                title="Wireless Headphones Pro X | Lumo"
                description="Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once. ..."
              />
            </div>
          </PanelCard>
          <PanelCard>
            <div className="pv-sl-tiles">
              <CountTile value={1} label="H1" problem />
              <CountTile value={4} label="H2" />
              <CountTile value={5} label="H3" />
              <CountTile value={1} label="H4" />
            </div>
            <div className="sl-row">
              <span style={{ fontWeight: 600 }}>Highlight on page</span>
              <Switch checked={highlight} onChange={setHighlight} label="Highlight on page" />
            </div>
          </PanelCard>
          <PanelCard title="Outline">
            <OutlineRow level={1} text="Wireless Headphones Pro X" tone="problem" strong depth={0}>
              <Pill tone="problem" icon="alert">
                JavaScript only
              </Pill>
            </OutlineRow>
            <OutlineRow level={2} text="Specifications" />
            <OutlineRow level={4} text="Bluetooth 5.3" depth={3}>
              <Pill tone="warning" icon="alert">
                Skips H3
              </Pill>
            </OutlineRow>
            <OutlineRow level={3} text="Great sound for the price" depth={2} />
          </PanelCard>
          <PanelCard
            title="AI bots in robots.txt"
            aside={<span className="line-mono pv-sl-mono">example.com/robots.txt</span>}
          >
            <h3 className="sl-group">Search and answers</h3>
            <BotRow
              owner="openai"
              userAgent="OAI-SearchBot"
              shownAs="ChatGPT search"
              status={<Pill tone="ok">Allowed</Pill>}
            />
            <BotRow
              owner="anthropic"
              userAgent="Claude-SearchBot"
              shownAs="Claude search"
              status={<Pill tone="ok">Allowed by *</Pill>}
            />
            <BotRow
              owner="perplexity"
              userAgent="PerplexityBot"
              shownAs="Perplexity answers"
              rule="User-agent: PerplexityBot  Disallow: /"
              status={
                <Pill tone="problem" icon="x">
                  Blocked
                </Pill>
              }
            />
            <h3 className="sl-group">Model training</h3>
            <BotRow
              owner="commoncrawl"
              userAgent="CCBot"
              shownAs="Common Crawl"
              status={
                <Pill tone="problem" icon="x">
                  Blocked
                </Pill>
              }
            />
          </PanelCard>
          <LimeCta
            text="Want your site to show up in AI answers?"
            label="Get in touch"
            href={CTA}
          />
        </div>
        <FooterCta text="Need help fixing these?" label="Get in touch" href={CTA} />
      </div>

      <table className="line-table pv-sl-contrast">
        <caption className="line-sr-only">Serpline contrast</caption>
        <tbody>
          {SERPLINE_CONTRAST.map(({ label, fg, bg }) => {
            const r = contrast(fg, bg);
            return (
              <tr key={label}>
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
          })}
        </tbody>
      </table>
    </div>
  );
}
