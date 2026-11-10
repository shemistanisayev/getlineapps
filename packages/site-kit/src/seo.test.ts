import { describe, expect, it } from 'vitest';
import {
  faqPageJsonLd,
  jsonLdString,
  renderSeoHead,
  seoTags,
  softwareApplicationJsonLd,
} from './seo.ts';

describe('seo head', () => {
  it('builds canonical, Open Graph and hreflang on getlineapps.com', () => {
    const tags = seoTags({
      title: 'Hitline: free tracking checker',
      description: 'See which tracking fires.',
      path: '/hitline',
      image: '/og/hitline.png',
      alternates: { en: '/hitline', az: '/az/hitline' },
    });
    const find = (k: string, v: string) => tags.find((t) => t.attrs[k] === v);
    expect(find('rel', 'canonical')?.attrs.href).toBe('https://getlineapps.com/hitline');
    expect(find('property', 'og:image')?.attrs.content).toBe(
      'https://getlineapps.com/og/hitline.png',
    );
    expect(find('hreflang', 'az')?.attrs.href).toBe('https://getlineapps.com/az/hitline');
    expect(find('hreflang', 'x-default')?.attrs.href).toBe('https://getlineapps.com/hitline');
  });

  it('uses a trailing slash for the hub', () => {
    const html = renderSeoHead({ title: 'Line apps', description: 'd', path: '/' });
    expect(html).toContain('<link rel="canonical" href="https://getlineapps.com/">');
  });

  it('escapes HTML and JSON-LD', () => {
    const html = renderSeoHead({
      title: 'A <b> & "c"',
      description: '"quoted"',
      path: '/x',
      jsonLd: [{ name: '</script><script>alert(1)</script>' }],
    });
    expect(html).toContain('<title>A &lt;b&gt; &amp; "c"</title>');
    expect(html).toContain('content="&quot;quoted&quot;"');
    expect(html).not.toContain('</script><script>');
    expect(JSON.parse(jsonLdString({ a: '<&>' }))).toEqual({ a: '<&>' });
  });

  it('describes a free Chrome extension by the owner', () => {
    const ld = softwareApplicationJsonLd({ name: 'Hitline', description: 'd', path: '/hitline' });
    expect(ld.offers.price).toBe('0');
    expect(ld.operatingSystem).toBe('Chrome');
    expect(ld.author.url).toBe('https://shamistanisayev.com/');
    expect(faqPageJsonLd([{ q: 'Free?', a: 'Yes.' }]).mainEntity[0]!.acceptedAnswer.text).toBe(
      'Yes.',
    );
  });
});
