import type { APIRoute } from 'astro';
import { LINE_SITE_URL, TOOL_SLUGS } from '@line/core/site';
import { BRANDS } from '@line/ui/brand';
import { getHub, getTools } from '../lib/site.ts';

/**
 * /llms.txt (llmstxt.org): a short map of the site for AI assistants. Built from the same
 * content files as the pages, so it never drifts. Lists only pages that exist.
 */
export const GET: APIRoute = async () => {
  const hub = await getHub('en');
  const tools = await getTools();
  const lines = [
    '# Line apps',
    '',
    `> ${hub.meta.description}`,
    '',
    'Free Chrome extensions by Shamistan Isayev. No account, no paid plan; every check runs in the browser and nothing is sent to a server.',
    '',
    '## Tools',
    '',
    ...TOOL_SLUGS.map((slug) => {
      const t = tools.find((x) => x.slug === slug)!;
      const card = hub.tools.cards[slug];
      const name = BRANDS[slug].name;
      const state = t.status === 'live' ? '' : ' (coming soon)';
      return t.landing
        ? `- [${name}](${LINE_SITE_URL}/${slug}): ${card.desc}${state}`
        : `- ${name}: ${card.desc}${state}`;
    }),
    '',
    '## Privacy',
    '',
    ...TOOL_SLUGS.map(
      (slug) =>
        `- [${BRANDS[slug].name} privacy policy](${LINE_SITE_URL}/privacy/${slug}): what the extension reads and stores`,
    ),
    '',
    '## Optional',
    '',
    `- [Line apps home](${LINE_SITE_URL}/): all five tools`,
    `- [Azerbaijani version](${LINE_SITE_URL}/az): the same pages in Azerbaijani`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
