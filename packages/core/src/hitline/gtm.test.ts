/** GTM container parsing and trigger evaluation (docs/hitline/PLAN-1.1.md). */
import { describe, expect, it } from 'vitest';
import { mergeModel, parseGtmContainer, tagFiresOn, type EventContext } from './gtm.ts';

const resource = {
  macros: [
    { function: '__e' },
    { function: '__u', vtp_component: 'PATH' },
    { function: '__v', vtp_name: 'ecommerce.value', vtp_dataLayerVersion: 2 },
    { function: '__aev', vtp_varType: 'TEXT' },
    { function: '__jsm', vtp_javascript: ['template', 'function(){return 1}'] },
  ],
  predicates: [
    { function: '_eq', arg0: ['macro', 0], arg1: 'gtm.js' },
    { function: '_eq', arg0: ['macro', 0], arg1: 'gtm.click' },
    { function: '_cn', arg0: ['macro', 1], arg1: '/checkout' },
    { function: '_eq', arg0: ['macro', 3], arg1: 'Buy now' },
    { function: '_eq', arg0: ['macro', 0], arg1: 'purchase' },
    { function: '_gt', arg0: ['macro', 2], arg1: '100' },
    { function: '_eq', arg0: ['macro', 4], arg1: '1' },
  ],
  tags: [
    { function: '__googtag', vtp_tagId: 'G-1' },
    { function: '__gaawe', vtp_eventName: 'click_buy' },
    { function: '__gaawe', vtp_eventName: ['macro', 0] },
    { function: '__paused' },
    { function: '__lcl' },
    {
      function: '__html',
      vtp_html: '<script>fbq("track", "Purchase")</script>',
      consent: ['list', 'ad_storage'],
    },
    { function: '__gclidw' },
  ],
  rules: [
    [
      ['if', 0],
      ['add', 0, 3, 4, 6],
    ],
    [
      ['if', 1, 3],
      ['add', 1],
    ],
    [
      ['if', 4],
      ['unless', 2],
      ['add', 2],
    ],
    [
      ['if', 4, 5],
      ['add', 5],
    ],
    [
      ['if', 4, 6],
      ['block', 5],
    ],
  ],
};
const body = `var data = {"resource": ${JSON.stringify(resource)}, "runtime": []};`;
const c = parseGtmContainer('GTM-T1', body)!;
const tag = (name: string) => c.tags.find((t) => t.name === name)!;

function ctx(event: string, pushes: unknown[], pageUrl = 'https://shop.com/thanks'): EventContext {
  const model: Record<string, unknown> = {};
  for (const p of pushes) mergeModel(model, p);
  return { event, model, pageUrl, containerId: 'GTM-T1' };
}

describe('GTM container', () => {
  it('names tags, hides GTM listeners, keeps paused tags marked', () => {
    expect(c.tags.map((t) => [t.name, t.type, t.paused])).toEqual([
      ['GA4 Config', 'Google Tag', false],
      ['GA4 click_buy', 'GA4 Event', false],
      ['GA4 {{Event}}', 'GA4 Event', false],
      ['paused', '__paused', true],
      ['Meta Purchase', 'Custom HTML', false],
      ['Conversion Linker', 'Conversion Linker', false],
    ]);
    expect(tag('Meta Purchase').consent).toEqual(['ad_storage']);
    expect(tag('Conversion Linker').silent).toBe(true);
  });

  it('writes triggers in GTM words', () => {
    expect(tag('GA4 Config').trigger).toBe('All Pages');
    expect(tag('GA4 click_buy').trigger).toBe('All Elements: {{Click Text}} equals Buy now');
    expect(tag('GA4 {{Event}}').trigger).toBe(
      'dl purchase: {{Page Path}} does not contain /checkout',
    );
    expect(tag('Meta Purchase').blocking).toEqual(['dl purchase: {{Custom JavaScript}} equals 1']);
  });

  it('evaluates triggers against the event and the dataLayer model', () => {
    expect(tagFiresOn(c, tag('GA4 Config'), ctx('gtm.js', []))).toBe('yes');
    expect(tagFiresOn(c, tag('GA4 Config'), ctx('gtm.dom', []))).toBe('no');
    const click = (text: string) =>
      ctx('gtm.click', [{ event: 'gtm.click', 'gtm.element': { text } }]);
    expect(tagFiresOn(c, tag('GA4 click_buy'), click('Buy now'))).toBe('yes');
    expect(tagFiresOn(c, tag('GA4 click_buy'), click('Details'))).toBe('no');
    // "unless" condition: not on a checkout path.
    expect(tagFiresOn(c, tag('GA4 {{Event}}'), ctx('purchase', []))).toBe('yes');
    expect(
      tagFiresOn(c, tag('GA4 {{Event}}'), ctx('purchase', [], 'https://shop.com/checkout/pay')),
    ).toBe('no');
  });

  it('reads nested dataLayer values, and says "maybe" when a value cannot be read', () => {
    const big = ctx('purchase', [{ ecommerce: { value: 50 } }, { ecommerce: { value: 250 } }]);
    const small = ctx('purchase', [{ ecommerce: { value: 50 } }]);
    // Fires on value > 100, but an exception uses Custom JavaScript Hitline cannot run.
    expect(tagFiresOn(c, tag('Meta Purchase'), big)).toBe('maybe');
    expect(tagFiresOn(c, tag('Meta Purchase'), small)).toBe('no');
  });

  it('merges pushes like GTM: objects deeply, other values replaced', () => {
    const m: Record<string, unknown> = {};
    mergeModel(m, { a: { b: 1, c: 2 }, list: [1, 2] });
    mergeModel(m, { a: { c: 3 }, list: [9] });
    expect(m).toEqual({ a: { b: 1, c: 3 }, list: [9] });
  });
});
