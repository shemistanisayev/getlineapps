// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  EVENTS,
  PARAMS,
  classifyClick,
  classifyInput,
  ctaLocation,
  initAnalytics,
  pageContext,
  scrollMarks,
  track,
  type PageContext,
} from './analytics.ts';
import { CONSENT_KEY } from './consent.ts';

const STORE = 'https://chromewebstore.google.com/detail/phenmbccpeaclhpnclildfndbchgpnmn';
const stores = { [STORE]: 'serpline' };
const loc = new URL('https://getlineapps.com/az/serpline');
const ctx: PageContext = { page_type: 'landing', page_locale: 'az', page_tool: 'serpline' };
type DL = Window & { dataLayer?: Record<string, unknown>[] };

function html(markup: string) {
  document.body.innerHTML = markup;
  return document.body;
}
const q = (sel: string) => document.querySelector(sel)!;

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  (window as DL).dataLayer = [];
});

describe('pageContext', () => {
  it.each([
    ['/', 'hub', 'en', 'none'],
    ['/az', 'hub', 'az', 'none'],
    ['/hitline', 'landing', 'en', 'hitline'],
    ['/az/serpline/', 'landing', 'az', 'serpline'],
    ['/rivaline/uninstalled', 'uninstall', 'en', 'rivaline'],
    ['/az/privacy/hitline', 'privacy', 'az', 'hitline'],
    ['/nope', 'not_found', 'en', 'none'],
  ])('%s', (path, page_type, page_locale, page_tool) => {
    expect(pageContext(path)).toEqual({ page_type, page_locale, page_tool });
  });
  it('404 flag wins', () => expect(pageContext('/hitline', true).page_type).toBe('not_found'));
});

describe('track', () => {
  it('pushes nothing without consent', () => {
    expect(track('install_click', { tool_slug: 'hitline' })).toBe(false);
    expect((window as DL).dataLayer).toEqual([]);
  });
  it('pushes every param, unused ones undefined, after consent', () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    track('install_click', { tool_slug: 'hitline', link_text: '' });
    const e = (window as DL).dataLayer![0]!;
    expect(e.event).toBe('install_click');
    expect(e.tool_slug).toBe('hitline');
    expect(Object.keys(e).sort()).toEqual(['event', ...Object.keys(PARAMS)].sort());
    expect(e.link_text).toBeUndefined();
  });
});

describe('classifyClick', () => {
  const click = (sel: string) => classifyClick(q(sel), loc, ctx, stores);

  it('store button is install_click with tool and place', () => {
    html(
      `<main><section class="hero"><a id="a" href="${STORE}">Add to Chrome</a></section></main>`,
    );
    expect(click('#a')).toEqual({
      event: 'install_click',
      params: {
        tool_slug: 'serpline',
        cta_location: 'hero',
        link_url: STORE,
        link_text: 'Add to Chrome',
      },
    });
  });

  it('hub card store button takes the card tool', () => {
    html(
      `<section id="tools"><article data-tool="hitline"><a id="a" href="https://chromewebstore.google.com/detail/x">Add</a></article></section>`,
    );
    const r = classifyClick(q('#a'), new URL('https://getlineapps.com/'), pageContext('/'), {});
    expect(r?.params).toMatchObject({ tool_slug: 'hitline', cta_location: 'tools' });
  });

  it('owner link is contact_click with the utm campaign as place', () => {
    html(
      `<footer><a id="a" href="https://shamistanisayev.com/?utm_source=serpline&utm_campaign=audit_cta">Book</a></footer>`,
    );
    expect(click('#a')).toMatchObject({
      event: 'contact_click',
      params: { cta_location: 'audit_cta', tool_slug: 'serpline' },
    });
  });

  it('other sites are outbound_click', () => {
    html(`<footer><a id="a" href="https://github.com/x/y">Source</a></footer>`);
    expect(click('#a')).toMatchObject({
      event: 'outbound_click',
      params: { link_domain: 'github.com', cta_location: 'footer' },
    });
  });

  it('language link', () => {
    html(`<header><a id="a" hreflang="en" href="/serpline">EN</a></header>`);
    expect(click('#a')).toMatchObject({
      event: 'language_switch',
      params: { language_to: 'en', cta_location: 'header' },
    });
  });

  it('in-page anchor is nav_click', () => {
    html(`<header><nav><a id="a" href="#faq">FAQ</a></nav></header>`);
    expect(click('#a')).toMatchObject({ event: 'nav_click', params: { section_id: 'faq' } });
  });

  it('tool landing and web tool links are select_content', () => {
    html(
      `<section class="night sec-more"><a id="a" href="/az/hitline">Hitline</a><a id="b" href="/az/serpline#preview">Preview</a></section>`,
    );
    const hub = new URL('https://getlineapps.com/az');
    expect(classifyClick(q('#a'), hub, pageContext('/az'))).toMatchObject({
      event: 'select_content',
      params: { content_type: 'tool_landing', content_id: 'hitline', cta_location: 'more' },
    });
    expect(classifyClick(q('#b'), hub, pageContext('/az'))).toMatchObject({
      params: { content_type: 'web_tool', content_id: 'serpline_preview' },
    });
  });

  it('plain internal links (privacy, home) are ignored', () => {
    html(
      `<footer><a id="a" href="/az/privacy/serpline">Privacy</a><a id="b" href="/az">Home</a></footer>`,
    );
    expect(click('#a')).toBeNull();
    expect(click('#b')).toBeNull();
  });

  it('sample dialog and PDF', () => {
    html(
      `<section id="audit"><a id="a" data-sample href="/hitline/sample.pdf">See</a></section><dialog><a id="b" download href="/hitline/sample.pdf">Download</a></dialog>`,
    );
    expect(click('#a')?.event).toBe('sample_report_open');
    expect(click('#b')).toMatchObject({
      event: 'sample_download',
      params: { file_name: 'sample.pdf', file_extension: 'pdf', cta_location: 'dialog' },
    });
  });

  it('FAQ: only opening counts, with question and position', () => {
    html(
      `<section id="faq"><div class="faq"><details><summary>One</summary></details><details><summary id="s"> Is it   free? </summary></details></div></section>`,
    );
    expect(click('#s')).toEqual({
      event: 'faq_open',
      params: { faq_question: 'Is it free?', faq_index: 2, cta_location: 'faq' },
    });
    (q('#s').parentElement as HTMLDetailsElement).open = true;
    expect(click('#s')).toBeNull();
  });

  it('hub buttons, serp device, ad library, cookie link', () => {
    html(`<button id="r" data-role="seo">SEO</button><button id="p" data-spot="foldline">1</button>
      <button id="d" data-device="mobile">M</button><a id="l" data-lib="meta" href="https://www.facebook.com/ads/library/">Meta</a>
      <footer><button id="c" data-cookie-settings>Cookies</button></footer><button id="x">X</button>`);
    expect(click('#r')).toEqual({ event: 'role_filter', params: { role_id: 'seo' } });
    expect(click('#p')).toEqual({
      event: 'checkpoint_view',
      params: { checkpoint_id: 'foldline' },
    });
    expect(click('#d')?.params).toEqual({ web_tool: 'serp_preview', tool_action: 'device_mobile' });
    expect(click('#l')?.params).toMatchObject({
      web_tool: 'ad_finder',
      tool_action: 'open_library',
      tool_item: 'meta',
    });
    expect(click('#c')).toEqual({
      event: 'cookie_settings_open',
      params: { cta_location: 'footer' },
    });
    expect(click('#x')).toBeNull();
  });
});

describe('helpers', () => {
  it('classifyInput', () => {
    html(`<input id="t" data-sp="title"><input id="f" data-finder-input><input id="o">`);
    expect(classifyInput(q('#t'))?.params.tool_action).toBe('edit_title');
    expect(classifyInput(q('#f'))?.params.web_tool).toBe('ad_finder');
    expect(classifyInput(q('#o'))).toBeNull();
  });
  it('ctaLocation prefers data-track-loc', () => {
    html(`<header><div data-track-loc="banner"><a id="a">x</a></div></header>`);
    expect(ctaLocation(q('#a'))).toBe('banner');
  });
  it('scrollMarks', () => {
    expect(scrollMarks(0, 1000, 4000)).toEqual([25]);
    expect(scrollMarks(2000, 1000, 4000)).toEqual([25, 50, 75]);
    expect(scrollMarks(0, 1000, 900)).toEqual([25, 50, 75, 90]);
  });
  it('every event has a description', () => {
    for (const [k, v] of Object.entries(EVENTS)) {
      expect(k).toMatch(/^[a-z][a-z_]{2,39}$/);
      expect(v.length).toBeGreaterThan(5);
    }
  });
});

describe('initAnalytics', () => {
  it('pushes the page context, then events from clicks and the DOM event', () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    history.replaceState(null, '', '/az/hitline/uninstalled');
    html(
      `<main><a id="a" href="https://shamistanisayev.com/?utm_campaign=uninstall">Audit</a></main>`,
    );
    initAnalytics({ stores });
    (q('#a') as HTMLAnchorElement).addEventListener('click', (e) => e.preventDefault());
    (q('#a') as HTMLElement).click();
    document.dispatchEvent(
      new CustomEvent('line:track', {
        detail: {
          event: 'feedback_submit',
          params: { tool_slug: 'hitline', feedback_reason: 'x' },
        },
      }),
    );
    document.dispatchEvent(new CustomEvent('line:track', { detail: { event: 'not_an_event' } }));
    const dl = (window as DL).dataLayer!;
    expect(dl[0]).toEqual({ page_type: 'uninstall', page_locale: 'az', page_tool: 'hitline' });
    expect(dl.slice(1).map((e) => e.event)).toEqual(['contact_click', 'feedback_submit']);
    expect(dl[1]).toMatchObject({ cta_location: 'uninstall', tool_slug: 'hitline' });

    // A second call is ignored; the listeners above are still on.
    initAnalytics();
    expect(dl).toHaveLength(3);

    // Feature tab: the label click selects the radio, only its change event counts.
    html(
      `<input class="tabs-in" type="radio" name="tb" id="tb-gtm"><label for="tb-gtm">GTM</label>`,
    );
    (q('label') as HTMLElement).click();
    expect(dl.filter((e) => e.event === 'feature_tab_view').map((e) => e.tab_id)).toEqual(['gtm']);

    // First edit of a web tool field counts once.
    html(`<input id="t" data-sp="title">`);
    const t = q('#t');
    t.dispatchEvent(new Event('input', { bubbles: true }));
    t.dispatchEvent(new Event('input', { bubbles: true }));
    expect(dl.filter((e) => e.event === 'web_tool_use')).toHaveLength(1);
  });
});

describe('GTM container', () => {
  it('forwards every event and parameter to GA4', async () => {
    const { buildGtmContainer, eventRegex } = await import('./gtm-container.ts');
    const c = buildGtmContainer('G-TEST123', 'GTM-TEST');
    const re = new RegExp(eventRegex());
    for (const e of Object.keys(EVENTS)) expect(re.test(e)).toBe(true);
    expect(re.test('gtm.js')).toBe(false);
    const ev = c.containerVersion.tag.find((x) => x.type === 'gaawe')!;
    const table = ev.parameter.find((p) => p.key === 'eventSettingsTable') as {
      list: { map: { value: string }[] }[];
    };
    const names = table.list.map((r) => r.map[0]!.value);
    for (const p of Object.keys(PARAMS)) expect(names).toContain(p);
    expect(() => buildGtmContainer('UA-1')).toThrow();
  });
});
