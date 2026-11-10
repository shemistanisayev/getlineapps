/**
 * Zod schemas for every content file of getlineapps.com.
 * Used by src/content.config.ts (a broken edit fails the build) and by the unit tests.
 */
import { z } from 'astro/zod';
import { TOOL_SLUGS } from '@line/core/site';

const text = z.string().min(1);
const list = z.array(text).min(1);
const slug = z.enum(TOOL_SLUGS);

export const toolsSchema = z
  .array(
    z
      .object({
        slug,
        status: z.enum(['live', 'soon']),
        storeUrl: z
          .string()
          .regex(/^https:\/\/chromewebstore\.google\.com\/detail\/[^\s]+$/)
          .nullable(),
      })
      .refine((t) => t.status === 'soon' || t.storeUrl !== null, {
        message: 'A live tool needs its storeUrl',
      }),
  )
  .length(TOOL_SLUGS.length);

export const sharedSchema = z.object({
  lang: z.enum(['en', 'az']),
  htmlLang: text,
  switchTo: z.object({ label: text, short: text }),
  skip: text,
  nav: z.object({
    home: text,
    main: text,
    tools: text,
    together: text,
    webTools: text,
    faq: text,
    cta: text,
    toolsLabel: text,
  }),
  footer: z.object({
    label: text,
    tagline: text,
    extensions: text,
    webTools: text,
    about: text,
    privacy: text,
    contact: text,
    source: text,
    cookies: text,
    allTools: text,
    builtBy: text,
    trademark: text,
  }),
  status: z.object({ soon: text, add: text, learnMore: text, openTool: text }),
  consent: z.object({ text, accept: text, reject: text, privacyLabel: text }),
  notFound: z.object({
    metaTitle: text,
    metaDescription: text,
    code: text,
    title: text,
    text,
    home: text,
    privacy: text,
  }),
  ownerLogo: text,
  ownerName: text,
});

const card = z.object({
  forWho: text,
  surface: text,
  question: text,
  answer: text,
  desc: text,
  bullets: list,
});

export const hubSchema = z.object({
  meta: z.object({ title: text, description: text, ogAlt: text }),
  hero: z.object({
    pill: text,
    titleStart: text,
    titleHighlight: text,
    titleEnd: z.string(),
    lead: text,
    primary: text,
    secondary: text,
    trust: list,
    mockLabel: text,
    mockUrl: text,
    float: text,
  }),
  tools: z.object({
    eyebrow: text,
    title: text,
    lead: text,
    rolesTitle: text,
    rolesLabel: text,
    roles: z.array(z.object({ id: text, label: text, hint: text, tools: z.array(slug) })).min(2),
    cards: z.record(slug, card),
  }),
  together: z.object({
    eyebrow: text,
    title: text,
    lead: text,
    pageLabel: text,
    tellsYou: text,
    tabsLabel: text,
    page: z.object({
      tab: text,
      brand: text,
      nav: list,
      headline: text,
      button: text,
      fold: text,
    }),
    spots: z
      .array(
        z.object({
          slug,
          num: text,
          pin: text,
          where: text,
          question: text,
          finds: list,
        }),
      )
      .length(5),
  }),
  promise: z.object({
    eyebrow: text,
    title: text,
    items: z
      .array(z.object({ icon: z.enum(['gift', 'click', 'lock', 'doc']), title: text, text }))
      .length(4),
  }),
  webTools: z.object({
    eyebrow: text,
    title: text,
    lead: text,
    items: z
      .array(z.object({ slug, fragment: z.string().regex(/^[a-z]+$/), title: text, text }))
      .length(4),
  }),
  faq: z.object({
    eyebrow: text,
    title: text,
    askBefore: text,
    askLink: text,
    askAfter: z.string(),
    items: z.array(z.object({ q: text, a: text })).min(1),
  }),
  about: z.object({ eyebrow: text, title: text, text, cta: text, from: text }),
});

export const privacyPageSchema = z.object({
  meta: z.object({ title: text, description: text }),
  eyebrow: text,
  title: text,
  lead: text,
  updatedLabel: text,
  updated: text,
  tabsLabel: text,
  tabLabel: text,
  facts: z.array(text).length(3),
  headings: z.object({
    reads: text,
    stores: text,
    never: text,
    perms: text,
    notes: text,
    site: text,
    changes: text,
  }),
  site: list,
  changes: text,
  contactBefore: text,
  contactLink: text,
  contactAfter: z.string(),
});

export const privacyToolSchema = z.object({
  summary: text,
  reads: list,
  stores: list,
  never: list,
  perms: z
    .array(
      z.object({
        name: text,
        /** The manifest entry this row explains: a permission, a manifest key or optional host access. */
        manifest: z.string().regex(/^(permission|key|optional_host):[A-Za-z_*:/.]+$/),
        why: text,
      }),
    )
    .min(1),
  notes: list,
});

export type Tools = z.infer<typeof toolsSchema>;
export type Shared = z.infer<typeof sharedSchema>;
export type Hub = z.infer<typeof hubSchema>;
export type PrivacyPage = z.infer<typeof privacyPageSchema>;
export type PrivacyTool = z.infer<typeof privacyToolSchema>;
