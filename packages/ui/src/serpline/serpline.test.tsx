import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { contrast } from '../contrast.ts';
import {
  BotRow,
  CrawlerBadge,
  LevelChip,
  PageRow,
  PanelTabs,
  ScoreRing,
  Segmented,
  SerpResult,
  Switch,
} from './components.tsx';
import { SERPLINE_CONTRAST } from './contrast.ts';

describe('Serpline contrast', () => {
  for (const { label, fg, bg } of SERPLINE_CONTRAST) {
    it(`${label}: ${fg} on ${bg} is at least 4.5:1`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('Serpline components', () => {
  it('tabs: one selected tab, badges only with a count', () => {
    const html = renderToStaticMarkup(
      <PanelTabs
        label="Serpline sections"
        active="links"
        onSelect={() => undefined}
        tabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'links', label: 'Links', count: 2, countLabel: '2 issues' },
          { id: 'ai', label: 'AI', count: 0 },
        ]}
      />,
    );
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html.match(/class="sl-badge"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="2 issues"');
  });

  it('page row: icon buttons have names', () => {
    const html = renderToStaticMarkup(
      <PageRow
        host="example.com"
        path="/products/x"
        checkAgainLabel="Check again"
        pdfLabel="Audit PDF"
        settingsLabel="Settings"
      />,
    );
    expect(html).toContain('aria-label="Check again"');
    expect(html).toContain('aria-label="Settings"');
    expect(html).toContain('Audit PDF');
  });

  it('score ring: dash length follows the score', () => {
    expect(renderToStaticMarkup(<ScoreRing score={56} label="SEO score 56 of 100" />)).toContain(
      'stroke-dasharray="95.0 170"',
    );
    expect(renderToStaticMarkup(<ScoreRing score={140} label="x" />)).toContain('>100<');
  });

  it('level chips clamp to H1..H6 and reuse the H4 style below', () => {
    expect(renderToStaticMarkup(<LevelChip level={1} />)).toContain('sl-lv--1');
    expect(renderToStaticMarkup(<LevelChip level={6} />)).toMatch(/sl-lv--4.*H6/);
  });

  it('switch and segmented control expose their state', () => {
    expect(
      renderToStaticMarkup(<Switch checked label="Highlight on page" onChange={() => undefined} />),
    ).toContain('aria-checked="true"');
    const seg = renderToStaticMarkup(
      <Segmented
        label="Preview device"
        value="mobile"
        onChange={() => undefined}
        options={[
          { value: 'mobile', label: 'Mobile' },
          { value: 'desktop', label: 'Desktop' },
        ]}
      />,
    );
    expect(seg.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it('crawler rows: brand mark or CC letters, robots line under a block', () => {
    expect(renderToStaticMarkup(<CrawlerBadge owner="perplexity" />)).toContain('<svg');
    expect(renderToStaticMarkup(<CrawlerBadge owner="commoncrawl" />)).toContain('CC');
    const html = renderToStaticMarkup(
      <BotRow
        owner="perplexity"
        userAgent="PerplexityBot"
        shownAs="Perplexity answers"
        status={<span>Blocked</span>}
        rule="User-agent: PerplexityBot  Disallow: /"
      />,
    );
    expect(html).toContain('sl-rule');
    expect(html).toContain('Disallow: /');
  });

  it('Google result never loads a favicon', () => {
    const html = renderToStaticMarkup(
      <SerpResult
        device="mobile"
        siteName="Lumo"
        urlLine="https://example.com › products"
        title="Wireless Headphones Pro X | Lumo"
        description="Active noise cancelling ..."
      />,
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('Wireless Headphones Pro X | Lumo');
  });
});
