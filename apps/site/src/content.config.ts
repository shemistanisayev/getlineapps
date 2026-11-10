import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import {
  hitlineSchema,
  hubSchema,
  privacyPageSchema,
  privacyToolSchema,
  sharedSchema,
  toolsSchema,
} from './content/schemas.ts';

const byFileName = ({ entry }: { entry: string }) => entry.replace(/\.json$/, '');

export const collections = {
  /** One entry per tool: slug, status (live | soon), storeUrl. */
  tools: defineCollection({
    loader: file('src/content/tools.json', {
      parser: (text) => {
        const list = toolsSchema.parse(JSON.parse(text));
        return list.map((t) => ({ id: t.slug, ...t }));
      },
    }),
    schema: toolsSchema.element,
  }),
  /** Header, footer, 404, consent: shared/en.json, shared/az.json. */
  shared: defineCollection({
    loader: glob({ pattern: '*.json', base: 'src/content/shared', generateId: byFileName }),
    schema: sharedSchema,
  }),
  /** The hub page (/): hub/en.json, hub/az.json. */
  hub: defineCollection({
    loader: glob({ pattern: '*.json', base: 'src/content/hub', generateId: byFileName }),
    schema: hubSchema,
  }),
  /** The privacy page frame: privacy/page.en.json, privacy/page.az.json. */
  privacyPage: defineCollection({
    loader: glob({ pattern: 'page.*.json', base: 'src/content/privacy', generateId: byFileName }),
    schema: privacyPageSchema,
  }),
  /** Each tool's privacy text: privacy/<slug>.en.json, privacy/<slug>.az.json. */
  privacy: defineCollection({
    loader: glob({
      pattern: ['*.json', '!page.*.json'],
      base: 'src/content/privacy',
      generateId: byFileName,
    }),
    schema: privacyToolSchema,
  }),
  /** Hitline landing and uninstall page: hitline/en.json, hitline/az.json. */
  hitline: defineCollection({
    loader: glob({ pattern: '*.json', base: 'src/content/hitline', generateId: byFileName }),
    schema: hitlineSchema,
  }),
};
