# Line family: domain and site structure

Decided by the owner on 2026-11-08. This replaces the 2026-11-07 `.website` table and every `.co` default. No `.website` domains were bought, so there are no redirects to set up. No blog and no CMS for now.

## Domain
- One domain for the whole family: `https://getlineapps.com`.
- One config value `LINE_SITE_URL` in the shared monorepo config. A tool's site URL is `LINE_SITE_URL + '/' + slug`.
- Slugs: `hitline`, `serpline`, `rivaline`, `foldline`, `markline`.
- Extensions build every site link with one shared helper, `toolUrl(slug, path, utm?)`.

This replaces: `SITE_URL` (Hitline), `SITE_URL` (Serpline), `RIVALINE_SITE_URL`, `FOLDLINE_SITE_URL`, `MARKLINE_SITE_URL`.

## URL map
| Page | URL |
|---|---|
| Hub (all tools) | `/` |
| Tool landing | `/<slug>` |
| Privacy policy (Web Store privacy URL; decided 2026-11-09) | `/privacy/<slug>`: one page template with five tabs (Hitline, Serpline, Rivaline, Foldline, Markline), each tab showing the tool's logo. Each slug is its own static page with that tab selected, and the tabs are links between them. `/privacy` redirects to `/privacy/hitline`. |
| Uninstall page (`setUninstallURL`) | `/<slug>/uninstalled?utm_source=<slug>&utm_medium=extension&utm_campaign=uninstall&v=<version>` |
| Free web tools: a section on each tool's landing, reached by fragment (decided 2026-11-09, no separate `/tools/...` pages) | `/rivaline#finder` (ad library finder), `/foldline#calculator` (landing page score), `/serpline#preview` (Google preview), `/markline#annotate` (annotate an image) |
| Feedback endpoint | `/api/feedback` (one function; the form sends the tool slug) |
| Not found | `/404` (shared) |

Chrome Web Store homepage URL for each tool: `LINE_SITE_URL/<slug>`. Privacy policy URL: `LINE_SITE_URL/privacy/<slug>`. Every "Privacy" link in an extension (Settings footer) and on a tool landing points to `/privacy/<slug>`; any `/<slug>/privacy` in a SPEC means this.

## Hub page (`/`) and privacy page
- Design: the Design canvas "getlineapps.com: hub səhifə" (artboards Main, MainMobile, Privacy, PrivacyMobile, HubLogo, HubLogoSheet, Logo).
- Own logo "Line apps": five nested lines in the tools' bright colors bending into an L (HubLogo). The hub has no single accent; its signature is the five-color stripe.
- Message: "Free Chrome tools to see inside any website". Four tools look at your own site, Rivaline looks at competitors.
- The "Free web tools" cards link to the fragments above; the hub does not show the paths.
- About block and footer use the owner's logomark from shamistanisayev.com.
- Privacy page text per tool lives in content files (`apps/site/src/content/privacy/<slug>.en.json` and `.az.json`); the Privacy artboard's demo data is the English source. Each tool's text must match its manifest permissions and storage keys; a test compares the permission list on the page with the built manifest. "Last updated" is a placeholder until release.

## Site
- One Astro project `apps/site` replaces `apps/<tool>/site`, `apps/serpline-site` and Hitline's site. One Cloudflare Pages project `getlineapps`, deployed on every push to `main`.
- Shared pieces (feedback function with Resend, honeypot and rate limit; consent banner; SEO head) stay in `packages/site-kit` or move into `apps/site`.
- Each tool landing keeps its own accent theme, design and the Lighthouse 95+ target from its SPEC.
- **Content lives in files, not in components.** Every text, list (features, FAQ, marquee items, steps) and section order of a landing is in Astro content collections: `apps/site/src/content/<slug>/en.json` and `az.json` (one file per tool and language, typed with a Zod schema so a broken edit fails the build). Shared texts (header, footer, hub, 404, privacy) in `apps/site/src/content/shared/` and `apps/site/src/content/privacy/`. Components only read these files. The owner edits them in GitHub's web editor or asks Claude Code; the push deploys.
- Analytics: one config for the whole site, loaded only after consent. A/B tests later, decided at the edge (no client-side flicker).
- Resend sender domain: `getlineapps.com`.
- Each tool's "Phase 8: Landing site and deploy" becomes "add the tool's routes and content files to `apps/site`".

## Links and UTM
- Links from an extension to the site keep `utm_source=<slug>&utm_medium=extension` with the campaign from the tool's SPEC (`uninstall`, `share`, `more_tools`, ...). The Privacy link has no UTM.
- Links between pages of getlineapps.com (hub, landings, "More free tools" cards on landings, free web tool links, privacy tabs) carry **no UTM**: UTM on internal links restarts the session and breaks attribution.
- Contact CTAs still go to shamistanisayev.com with the UTM in each SPEC; the hub and privacy page use `utm_source=getlineapps&utm_medium=landing` with `hub_nav`, `hub_cta`, `faq`, `privacy` or `footer`.
- Share lines in exported content use the tool landing: Foldline fix list and Markline copied notes end with `LINE_SITE_URL/<slug>?utm_source=<slug>&utm_medium=extension&utm_campaign=share`.

## SPEC sections that still use the old domains (follow this file instead)
- Hitline: root SPEC and root `CLAUDE.md` (`SITE_URL` default `hitline.website`).
- Serpline: §3 uninstall URL, §9 links, §11 `apps/serpline-site`, Cloudflare project `serpline`, custom domain, Phase 8.
- Rivaline: §3 uninstall URL, §9 site app, Cloudflare project, custom domain, §10 links, §12 privacy URL, Phase 0 "Set the family domains", Phase 8.
- Foldline: §3, §5 share line, §9, §10, §12, §13 Phase 0 and Phase 8.
- Markline: §1 "Made with Markline" target, §3, §3.4 notes text, §8, §9, §13, §14 Phase 8, §15.
- Every SPEC's `/privacy` route on its own site: replaced by `/privacy/<slug>` above.

## Open questions
- None about Hitline: nothing is published yet, so there are no old URLs to redirect.
- Hitline's privacy text in the Privacy artboard must be checked against the real manifest when Hitline is built (`docs/hitline-SPEC.md` §3: `activeTab`, `scripting`, `storage`, `devtools_page`).
