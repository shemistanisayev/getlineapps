import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TOOL_SLUGS } from '@line/core/site';
import { Glyph } from './Glyph.tsx';
import { HubLogo, Logo } from './Logo.tsx';
import { Mark } from './Mark.tsx';
import { Button, CtaBand, KeyValueTable, Pill } from './Base.tsx';
import { FOLDLINE_GLYPHS, MARKLINE_GLYPHS } from '../glyphs.ts';
import { MARK_NAMES } from '../marks.ts';

describe('Logo', () => {
  it('renders every tool in every theme with an accessible name', () => {
    for (const slug of TOOL_SLUGS) {
      for (const theme of ['light', 'dark', 'mono', 'white'] as const) {
        const html = renderToStaticMarkup(<Logo brand={slug} theme={theme} size={40} />);
        expect(html).toContain('role="img"');
        expect(html).toContain('line</span>');
      }
    }
  });

  it('Markline gets the marker highlight on light only', () => {
    expect(renderToStaticMarkup(<Logo brand="markline" />)).toContain('linear-gradient');
    expect(renderToStaticMarkup(<Logo brand="markline" theme="dark" />)).not.toContain(
      'linear-gradient',
    );
  });

  it('HubLogo draws five lines', () => {
    const html = renderToStaticMarkup(<HubLogo size={40} />);
    expect(html.match(/<path /g)).toHaveLength(5);
    expect(html).toContain('apps');
  });
});

describe('Glyph and Mark', () => {
  it('render every glyph', () => {
    for (const kind of Object.keys(FOLDLINE_GLYPHS) as Array<keyof typeof FOLDLINE_GLYPHS>) {
      expect(renderToStaticMarkup(<Glyph set="foldline" kind={kind} />)).toContain('<svg');
    }
    for (const kind of Object.keys(MARKLINE_GLYPHS) as Array<keyof typeof MARKLINE_GLYPHS>) {
      expect(renderToStaticMarkup(<Glyph set="markline" kind={kind} tone="solid" />)).toContain(
        '<svg',
      );
    }
  });

  it('render every mark with its name', () => {
    for (const name of MARK_NAMES) {
      expect(renderToStaticMarkup(<Mark name={name} />)).toMatch(/aria-label="[^"]+"/);
    }
  });
});

describe('Pill', () => {
  it('status pills always carry an icon and a label', () => {
    for (const tone of ['ok', 'problem', 'warning', 'neutral'] as const) {
      const html = renderToStaticMarkup(<Pill tone={tone}>Label</Pill>);
      expect(html).toContain('<svg');
      expect(html).toContain('Label');
    }
    expect(renderToStaticMarkup(<Pill tone="brand">For SEO</Pill>)).not.toContain('<svg');
  });
});

describe('Button, KeyValueTable, CtaBand', () => {
  it('render', () => {
    expect(renderToStaticMarkup(<Button variant="lime">Book a call</Button>)).toContain(
      'line-btn--lime',
    );
    expect(
      renderToStaticMarkup(<KeyValueTable rows={[{ k: 'GTM', v: 'GTM-K7P2QX' }]} />),
    ).toContain('<th scope="row">GTM</th>');
    const cta = renderToStaticMarkup(
      <CtaBand
        title="Need help?"
        href="https://shamistanisayev.com/"
        label="shamistanisayev.com"
      />,
    );
    expect(cta).toContain('rel="noopener"');
  });
});
