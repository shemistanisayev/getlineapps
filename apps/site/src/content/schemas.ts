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

/** Platform badge keys used by the Hitline landing (brand marks from @line/ui). */
const platform = z.enum(['ga', 'ads', 'meta', 'tt', 'dl', 'hj', 'sgtm', 'datalayer']);
const pillTone = z.enum(['ok', 'bad', 'warn', 'mute', 'pur']);
const bullets3 = z.array(text).length(3);
const featureTab = z.object({
  label: text,
  eyebrow: text,
  title: text,
  lead: text,
  bullets: bullets3,
});

/** Uninstall feedback page, shared by every tool (/<tool>/uninstalled). */
export const uninstallSchema = z.object({
  meta: z.object({ title: text, description: text }),
  titleStart: text,
  titleEnd: text,
  lead: text,
  reasonsLabel: text,
  reasons: z.array(text).length(4),
  moreLabel: text,
  optional: text,
  placeholder: text,
  send: text,
  sending: text,
  thanks: text,
  error: text,
  pickOne: text,
  reinstall: text,
  card: z.object({ eyebrow: text, title: text, text, cta: text, sub: text }),
});

/** The Hitline landing (/hitline): design/hitline/Landing.dc.html. */
export const hitlineSchema = z.object({
  meta: z.object({ title: text, description: text, ogAlt: text }),
  nav: z.object({ label: text, features: text, how: text, privacy: text, faq: text }),
  add: z.object({ nav: text, hero: text, soonNav: text, soonHero: text }),
  sample: z.object({ eyebrow: text, title: text, note: text, download: text, close: text }),
  hero: z.object({
    pill: text,
    titleStart: text,
    titleHighlight: text,
    titleEnd: text,
    lead: text,
    secondary: text,
    trust: z.array(text).length(3),
    mockLabel: text,
    tabs: z.array(z.object({ label: text, count: text, warn: z.boolean() })).length(4),
    live: text,
    rows: z
      .array(
        z.object({
          time: text,
          platform,
          name: text,
          event: text,
          route: z.enum(['sgtm', 'browser', 'page', 'bad']),
        }),
      )
      .min(4),
    routes: z.object({ sgtm: text, browser: text, page: text, bad: text }),
    sgtmTitle: text,
    sgtmVia: text,
    tags: text,
    issueLabel: text,
    issueText: text,
  }),
  marquee: z.object({
    title: text,
    /** Design keys (ga, meta, ...) or Hitline platform ids (linkedin, amplitude, ...). */
    items: z.array(z.object({ platform: z.string().min(1), label: text })).min(4),
  }),
  problem: z.object({
    eyebrow: text,
    title: text,
    lead: text,
    cards: z.array(z.object({ title: text, text })).length(3),
    mini: z.object({
      ga4Event: text,
      ga4Value: text,
      metaEvent: text,
      metaValue: text,
      reject: text,
      gclid: text,
      host: text,
      referral: text,
    }),
  }),
  features: z.object({
    eyebrow: text,
    title: text,
    tabsLabel: text,
    events: featureTab.extend({
      demo: z.object({
        event: text,
        platform: text,
        via: text,
        params: z.array(z.object({ k: text, v: text })).min(1),
        issueStrong: text,
        issueText: text,
      }),
    }),
    gtm: featureTab.extend({
      demo: z.object({ title: text, detected: text, signals: z.array(text).length(4) }),
    }),
    checks: featureTab.extend({
      demo: z.object({
        title: text,
        count: text,
        rows: z
          .array(
            z.object({
              platform: z.string().min(1),
              label: text,
              status: text,
              tone: z.enum(['bad', 'warn']),
            }),
          )
          .min(2),
      }),
    }),
    consent: featureTab.extend({
      demo: z.object({
        title: text,
        count: text,
        rows: z.array(z.object({ platform, label: text, status: text, ok: z.boolean() })).min(1),
      }),
    }),
    attribution: featureTab.extend({
      demo: z.object({
        steps: z.array(text).length(5),
        rows: z
          .array(
            z.object({
              label: text,
              cells: z.array(z.object({ v: text, ok: z.boolean() })).length(5),
            }),
          )
          .min(1),
      }),
    }),
    plan: featureTab.extend({
      demo: z.object({
        file: text,
        count: text,
        bars: z.array(z.object({ label: text, n: z.number().int().min(0) })).length(3),
        rows: z.array(z.object({ event: text, status: text, tone: pillTone })).min(1),
      }),
    }),
  }),
  how: z.object({
    eyebrow: text,
    title: text,
    steps: z
      .array(z.object({ title: text, key: z.string(), titleEnd: z.string(), text }))
      .length(3),
  }),
  audit: z.object({
    eyebrow: text,
    titleStart: text,
    titleHighlight: text,
    titleEnd: text,
    lead: text,
    cta: text,
    from: text,
    paper: z.object({
      date: text,
      eyebrow: text,
      host: text,
      high: text,
      medium: text,
      levels: z.object({ high: text, medium: text }),
      items: z.array(z.object({ level: z.enum(['high', 'medium']), strong: text, text })).length(3),
    }),
  }),
  privacy: z.object({
    eyebrow: text,
    title: text,
    items: z
      .array(z.object({ icon: z.enum(['server', 'lock', 'eye', 'code']), title: text, text }))
      .length(4),
  }),
  faq: z.object({
    eyebrow: text,
    title: text,
    askBefore: text,
    askLink: text,
    items: z.array(z.object({ q: text, a: text })).min(1),
  }),
  more: z.object({
    eyebrow: text,
    title: text,
    tools: z.object({
      serpline: z.object({ text, open: text }),
      rivaline: z.object({ text, open: text }),
      foldline: z.object({ text, open: text }),
      markline: z.object({ text, open: text }),
    }),
  }),
  footer: z.object({ builtBy: text, privacy: text, source: text }),
  uninstall: uninstallSchema,
});

/** Status pill on the Serpline landing: always drawn with its icon (status colors rule). */
const tone = z.enum(['ok', 'warn', 'bad', 'mute']);
const statusRow = z.object({ label: text, status: text, tone, hl: z.boolean().optional() });
/** Brand marks the Serpline landing shows (@line/ui marks, plus the "CC" letters for CCBot). */
const slMark = z.enum([
  'google',
  'openai',
  'anthropic',
  'perplexity',
  'apple',
  'bytedance',
  'meta',
  'bot',
  'file',
  'link',
  'eye',
  'globe',
  'braces',
  'share',
  'commoncrawl',
]);
const slTab = z.object({ label: text, title: text, lead: text, bullets: z.array(text).min(2) });

/** The Serpline landing (/serpline): design/serpline/Landing.dc.html. */
export const serplineSchema = z.object({
  meta: z.object({ title: text, description: text, ogAlt: text }),
  nav: z.object({
    label: text,
    preview: text,
    features: text,
    how: text,
    privacy: text,
    faq: text,
  }),
  add: z.object({ nav: text, hero: text, band: text, soonNav: text, soonHero: text }),
  hero: z.object({
    pill: text,
    titleStart: text,
    titleHighlight: text,
    titleEnd: text,
    lead: text,
    secondary: text,
    trustLabel: text,
    trust: z.array(text).length(3),
    mock: z.object({
      url: text,
      rendered: text,
      raw: text,
      scoreAria: text,
      label: text,
      issues: text,
      rows: z.array(statusRow).min(4),
    }),
    serp: z.object({ crumb: text, title: text, desc: text, note: text }),
    toast: z.object({ value: text, line1: text, line2: text }),
  }),
  marquee: z.object({
    title: text,
    items: z.array(z.object({ mark: slMark, label: text, code: z.boolean().optional() })).min(4),
  }),
  problem: z.object({
    eyebrow: text,
    title: text,
    lead: text,
    cards: z.array(z.object({ title: text, text })).length(3),
    mini: z.object({
      raw: text,
      rawWords: text,
      after: text,
      afterWords: text,
      crumb: text,
      title: text,
      desc: text,
      blocked: text,
    }),
  }),
  preview: z.object({
    eyebrow: text,
    title: text,
    lead: text,
    titleLabel: text,
    titleDefault: text,
    titlePlaceholder: text,
    descLabel: text,
    descDefault: text,
    descPlaceholder: text,
    urlLabel: text,
    urlDefault: text,
    googlePreview: text,
    deviceLabel: text,
    desktop: text,
    mobile: text,
    measure: text,
    fits: text,
    cut: text,
    addTitle: text,
    addDesc: text,
    emptyTitle: text,
    emptyDesc: text,
    note: text,
    band: text,
  }),
  features: z.object({
    eyebrow: text,
    title: text,
    tabsLabel: text,
    summary: slTab.extend({
      demo: z.object({
        scoreAria: text,
        label: text,
        counts: text,
        /** "Can Google index it?" row (Serpline 1.1). */
        index: statusRow,
        rows: z.array(statusRow).min(1),
      }),
    }),
    headings: slTab.extend({
      demo: z.object({
        rows: z
          .array(
            z.object({
              level: z.number().int().min(1).max(6),
              text,
              status: text.optional(),
              tone: tone.optional(),
              hl: z.boolean().optional(),
            }),
          )
          .min(1),
      }),
    }),
    links: slTab.extend({
      demo: z.object({
        internal: text,
        external: text,
        issues: text,
        rows: z
          .array(z.object({ text, path: text, status: text, tone, hl: z.boolean().optional() }))
          .min(1),
      }),
    }),
    render: slTab.extend({
      demo: z.object({
        raw: text,
        rawValue: text,
        rendered: text,
        renderedValue: text,
        words: text,
      }),
    }),
    /** Speed tab (Serpline 1.1): three Core Web Vitals tiles and finding rows. */
    speed: slTab.extend({
      demo: z.object({
        vitals: z.array(z.object({ k: text, value: text, status: text, tone })).length(3),
        rows: z.array(statusRow).min(1),
      }),
    }),
    ai: slTab.extend({
      demo: z.object({
        /** "What AI crawlers see" row (Serpline 1.1). */
        seen: statusRow,
        rows: z.array(statusRow.extend({ mark: slMark })).min(1),
        llms: text,
        llmsStatus: text,
      }),
    }),
  }),
  how: z.object({
    eyebrow: text,
    title: text,
    steps: z
      .array(z.object({ title: text, text, key: text.optional(), textEnd: z.string().optional() }))
      .length(3),
  }),
  audit: z.object({
    eyebrow: text,
    titleStart: text,
    titleHighlight: text,
    titleEnd: text,
    text,
    cta: text,
    from: text,
    paper: z.object({
      date: text,
      eyebrow: text,
      host: text,
      score: text,
      high: text,
      medium: text,
      rows: z.array(z.object({ tone, label: text, strong: text, text: z.string() })).length(3),
      ctaText: text,
      ctaButton: text,
    }),
  }),
  privacy: z.object({
    eyebrow: text,
    title: text,
    items: z
      .array(z.object({ icon: z.enum(['server', 'lock', 'chart', 'code']), title: text, text }))
      .length(4),
  }),
  faq: z.object({
    eyebrow: text,
    title: text,
    askBefore: text,
    askLink: text,
    items: z.array(z.object({ q: text, a: text })).min(1),
  }),
  more: z.object({
    eyebrow: text,
    title: text,
    tools: z.object({
      hitline: z.object({ text, open: text }),
      rivaline: z.object({ text, open: text }),
      foldline: z.object({ text, open: text }),
      markline: z.object({ text, open: text }),
    }),
  }),
  footer: z.object({ builtBy: text, privacy: text, source: text }),
  uninstall: uninstallSchema,
});

export type Tools = z.infer<typeof toolsSchema>;
export type Serpline = z.infer<typeof serplineSchema>;
export type Uninstall = z.infer<typeof uninstallSchema>;
export type Hitline = z.infer<typeof hitlineSchema>;
export type Shared = z.infer<typeof sharedSchema>;
export type Hub = z.infer<typeof hubSchema>;
export type PrivacyPage = z.infer<typeof privacyPageSchema>;
export type PrivacyTool = z.infer<typeof privacyToolSchema>;
