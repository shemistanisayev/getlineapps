import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { contrast } from '../contrast.ts';
import { GLYPH_SETS, RIVALINE_GLYPHS } from '../glyphs.ts';
import { MARKS } from '../marks.ts';
import {
  CategoryChips,
  CodeBlock,
  EvidenceList,
  GapStrip,
  LibraryRow,
  PanelHeader,
  PanelTabs,
  StackHero,
  Swatch,
  ToolRow,
} from './components.tsx';
import { RIVALINE_CONTRAST } from './contrast.ts';

describe('Rivaline contrast', () => {
  for (const { label, fg, bg } of RIVALINE_CONTRAST) {
    it(`${label}: ${fg} on ${bg} is at least 4.5:1`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

const TABS = [
  { id: 'stack' as const, label: 'Stack', count: 13, countLabel: '13 tools' },
  { id: 'ads' as const, label: 'Ads', count: 4 },
  { id: 'brand' as const, label: 'Brand', count: 5 },
];

describe('Rivaline components', () => {
  it('tabs: one selected tab with counts', () => {
    const html = renderToStaticMarkup(
      <PanelTabs label="Rivaline sections" tabs={TABS} active="stack" onSelect={() => {}} />,
    );
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html.match(/class="rv-badge"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="13 tools"');
  });

  it('tabs in Access and Restricted: none selected, no counts, still one focusable', () => {
    const html = renderToStaticMarkup(
      <PanelTabs label="Rivaline sections" tabs={TABS} active={null} onSelect={() => {}} />,
    );
    expect(html).not.toContain('aria-selected="true"');
    expect(html).not.toContain('rv-badge');
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it('header: icon buttons have names, Report PDF is off while nothing is read', () => {
    const html = renderToStaticMarkup(
      <PanelHeader
        readAgainLabel="Read the page again"
        settingsLabel="Settings"
        pdfLabel="Report PDF"
        readDisabled
        tabsLabel="Rivaline sections"
        tabs={TABS}
        active={null}
        onSelect={() => {}}
      />,
    );
    expect(html).toContain('aria-label="Read the page again"');
    expect(html).toContain('aria-label="Settings"');
    expect(html).toMatch(/<button[^>]*class="rv-pdf"[^>]*disabled/);
  });

  it('hero: marks row with "+N"', () => {
    const html = renderToStaticMarkup(
      <StackHero
        host="example.com"
        page="Home page"
        title="13 tools in 8 categories"
        subline="Shopify store running Meta, TikTok, Google and Pinterest ads"
        icons={[
          { key: 'shopify', icon: { mark: 'shopify' }, title: 'Shopify' },
          { key: 'crm', icon: { glyph: 'crm' }, title: 'Salesforce' },
        ]}
        more={6}
        moreLabel="6 more tools"
      />,
    );
    expect(html).toContain('<h1 class="rv-hero-title">13 tools in 8 categories</h1>');
    expect(html).toContain('aria-label="Shopify"');
    expect(html).toContain('aria-label="Salesforce"');
    expect(html).toContain('+6');
  });

  it('gap strip carries an icon and a label (status rule)', () => {
    const html = renderToStaticMarkup(
      <GapStrip count="3 gaps" list="server-side tracking, consent banner, CRM" />,
    );
    expect(html).toContain('<svg');
    expect(html).toContain('<b>3 gaps</b>');
  });

  it('chips: the active one is pressed', () => {
    const html = renderToStaticMarkup(
      <CategoryChips
        label="Categories"
        active="advertising"
        onSelect={() => {}}
        chips={[
          { id: 'all', label: 'All', count: 13 },
          { id: 'advertising', label: 'Advertising', count: 4 },
        ]}
      />,
    );
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain('Advertising <b>4</b>');
  });

  it('tool row: expanded shows the detail, evidence capped at 4 rows', () => {
    const html = renderToStaticMarkup(
      <ToolRow icon={{ mark: 'meta' }} name="Meta Pixel" id="418273650912345" expanded detailId="d">
        <EvidenceList
          title="How Rivaline found it"
          rows={['Script', 'Global', 'Cookie', 'Request', 'Element'].map((kind) => ({
            kind,
            value: kind.toLowerCase(),
          }))}
        />
      </ToolRow>,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html.match(/class="rv-ev"/g)).toHaveLength(4);
    const closed = renderToStaticMarkup(
      <ToolRow icon={{ glyph: 'chat' }} name="Drift" id="chat">
        <span>detail</span>
      </ToolRow>,
    );
    expect(closed).not.toContain('detail');
  });

  it('library row opens in a new tab with noopener and shows the status with a label', () => {
    const html = renderToStaticMarkup(
      <LibraryRow
        icon={{ mark: 'library' }}
        name="LinkedIn Ad Library"
        desc="Sponsored content on LinkedIn"
        href="https://www.linkedin.com/ad-library/search?accountOwner=Kova"
        openLabel="Open LinkedIn Ad Library"
        query="Kova"
        status={{ found: false, label: 'No LinkedIn Insight Tag' }}
      />,
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="Open LinkedIn Ad Library"');
    expect(html).toContain('No LinkedIn Insight Tag');
  });

  it('swatch and code block', () => {
    expect(
      renderToStaticMarkup(<Swatch role="Primary" hex="#2F5D46" copyLabel="Copy #2F5D46" />),
    ).toContain('aria-label="Copy #2F5D46"');
    const code = renderToStaticMarkup(
      <CodeBlock label="CSS variables" code={':root {\n  --kova-primary: #2F5D46;\n}'} />,
    );
    expect(code).toContain('<b>--kova-primary</b>');
    expect(code).toContain('tabindex="0"');
  });

  it('every category has a glyph and the new marks exist', () => {
    expect(GLYPH_SETS.rivaline).toBe(RIVALINE_GLYPHS);
    for (const k of [
      'advertising',
      'analytics',
      'tagmanagement',
      'consent',
      'crm',
      'email',
      'chat',
      'abtesting',
      'ecommerce',
      'reviews',
      'payments',
      'affiliate',
      'server',
    ]) {
      expect(RIVALINE_GLYPHS).toHaveProperty(k);
    }
    for (const m of ['woocommerce', 'wix', 'squarespace', 'bigcommerce', 'afterpay', 'zoho']) {
      expect(MARKS).toHaveProperty(m);
    }
  });
});
