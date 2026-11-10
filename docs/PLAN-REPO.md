# Repo plan: artboards to code

Built in Faza 1. Maps every artboard in `design/` to the package, app and component that implements it. Each tool's own `docs/<tool>/PLAN.md` (written in that tool's step 1) goes deeper.

## What exists after Faza 1

| Package | What is in it |
|---|---|
| `packages/core` | `site.ts`: `LINE_SITE_URL`, `toolUrl(slug, path, utm?)`, `privacyUrl`, `uninstallUrl`, `contactUrl`, `TOOL_SLUGS`. Empty `src/<tool>/` and `fixtures/<tool>/` with a test each. |
| `packages/ui` | `brand.ts` (brand data, logo glyph paths, logo color rules, standalone tile SVG), `tokens.css`, `fonts.css` + `fonts/` (Inter, Plus Jakarta Sans, JetBrains Mono, latin + latin-ext, self-hosted), `ui.css`. Components: `Logo`, `HubLogo`, `Glyph` (Foldline and Markline sets), `Mark` (34 platform marks from the design), `Button`/`LinkButton`, `Pill`, `HeroPill`, `Card`, `Table`, `KeyValueTable`, `CtaBand`. Icons 16/32/48/128 per tool and hub in `icons/`. Preview page: `pnpm --filter @line/ui dev`. |
| `packages/report` | `buildLineReport(config)`: the shared PDF layout (Rivaline SPEC §8), A4, embedded fonts, selectable text, link annotations, multi-page. `hitlineSample` and `rivalineSample` from the Report artboards with snapshot tests. `fetchReportFonts`, `downloadPdf`, `reportFileName`. |
| `packages/site-kit` | `feedback.ts` (Pages Function `/api/feedback`: Resend, honeypot `website`, rate limit per IP, optional KV), `consent.ts` + `consent.css` (GTM only after Accept, Consent Mode v2 defaults denied), `seo.ts` (head tags, hreflang, OG, JSON-LD `SoftwareApplication`, `FAQPage`, `WebSite`). |

Regenerate committed assets: `pnpm --filter @line/ui gen:fonts`, `gen:marks`, `gen:icons`.

## Shared artboards

| Artboard | Code |
|---|---|
| `*/Logo` | `@line/ui` `Logo` (+ `logoColors`, `logoTileSvg` for icons and PDF) |
| `hub/HubLogo`, `hub/HubLogoSheet` | `@line/ui` `HubLogo` (+ `hubLogoTileSvg`, `icons/hub`) |
| `rivaline/Mark`, `serpline/Mark` | `@line/ui` `Mark` (data generated from the artboards) |
| `foldline/Glyph`, `markline/Glyph` | `@line/ui` `Glyph set="foldline" / "markline"` |
| `*/Report` | `@line/report` `buildLineReport` with a per-tool config builder in the extension |
| `*/Welcome` | extension page `welcome.html` per tool, built from `@line/ui` |
| `*/Uninstall` | site route `/<slug>/uninstalled`, form posts to `/api/feedback` (`@line/site-kit`) |
| `*/Landing`, `LandingTablet`, `LandingMobile` | site route `/<slug>` in `apps/site`, content in `src/content/<slug>/{en,az}.json` |
| `*/BrowserBar`, `PanelChrome`, `DevtoolsBar` | mock only, not built |
| `*/SitePage` | model for the tool's test fixture |

## getlineapps.com (Faza 2, `apps/site`)

| Artboard | Route / component |
|---|---|
| `hub/Main`, `hub/MainMobile` | `/` (hub sections: nav, hero, tool cards, "one page, five questions", privacy promise, free web tools, FAQ, about, footer) |
| `hub/Privacy`, `hub/PrivacyMobile` | `/privacy/<slug>` (5 tabs as links), `/privacy` redirects to `/privacy/hitline`; text in `src/content/privacy/<slug>.{en,az}.json` |
| (no artboard) | `/404`, consent banner (`@line/site-kit`), sitemap, robots, OG images |

## Hitline (Faza 3, `apps/hitline/extension`: popup + DevTools panel)

| Artboard | Component |
|---|---|
| `Main`, `PopupEmpty`, `PopupSettings` | popup: `PopupMain`, `PopupEmpty`, `PopupSettings` |
| `PanelHeader` | panel `PanelHeader` (tabs, Export PDF, live status) |
| `Empty` | panel first open state |
| `Events`, `Gtm`, `Consent`, `Attribution`, `Plan`, `PlanSetup` | panel tabs |
| `Report` | `hitlineReport(audit)` -> `buildLineReport` (sample already matches the artboard) |
| `SitePage` | `apps/fixture` (Lumo shop, shared with Serpline) |

## Serpline (Faza 4, `apps/serpline/extension`: side panel)

| Artboard | Component |
|---|---|
| `PanelHeader` | side panel header with score and tabs |
| `Main`, `Headings`, `Links`, `Render`, `Ai` | tabs: Summary, Headings, Links, Render, AI (crawler badges use `Mark`) |
| `Stale` | "a new page was opened" state |
| `Settings` | settings view |
| `Report` | `serplineReport` -> `buildLineReport` (extra sections: SERP preview as `text`/`kv`) |
| `SitePage` | Serpline scenario on the Lumo fixture |

## Rivaline (Faza 5, `apps/rivaline/extension`: side panel)

| Artboard | Component |
|---|---|
| `PanelHeader` | header with host and tabs |
| `Main`, `StackDetail` | Stack tab and tool detail |
| `Ads` | Ads tab (ad library links) |
| `Brand`, `BrandExport` | Brand tab and export |
| `Access`, `Restricted`, `Empty`, `Settings` | states and settings |
| `Report` | `rivalineSample` shape: `columns` extra with `swatches` + `links` |
| `SitePage` | `apps/rivaline/fixture` (Kova) |

## Foldline (Faza 6, `apps/foldline/extension`: side panel)

| Artboard | Component |
|---|---|
| `PanelHeader` | header with score and Desktop/Mobile toggle |
| `Main`, `Issues`, `Checks` | Overview, Issues, Checks (check icons use `Glyph set="foldline"`) |
| `Share`, `Mobile` | Share fixes, Mobile view |
| `Access`, `Restricted`, `Settings` | states and settings |
| `Report` | `foldlineReport` -> `buildLineReport` |
| `SitePage` | `apps/foldline/fixture` (Sunvo) |

## Markline (Faza 7, `apps/markline/extension`: popup + editor tab)

| Artboard | Component |
|---|---|
| `PopupHeader`, `Main`, `Capturing`, `Settings`, `Restricted` | popup views |
| `AreaSelect`, `ElementPick` | content-script overlays |
| `EditorBar`, `Editor`, `EditorBlur`, `Export`, `EditorEmpty` | editor tab (tools use `Glyph set="markline"`) |
| `Report` | `buildLineReport` plus an `imageWithList` section (added in Faza 7 step 3, other PDFs unchanged) |
| `Shot`, `SitePage` | `apps/markline/fixture` (Bramble) and expected annotated output |

## Notes and open points

- **PDF fonts:** pdf-lib drops Inter glyphs when it subsets the font, so the report embeds the five fonts whole (about 650 KB per PDF). Text stays selectable. A smaller file needs a different subsetter; revisit only if size becomes a problem.
- **Extensions load fonts** from `@line/ui/fonts/*` (web) and `@line/report/fonts/*` (PDF), copied into each extension's `public/`.
- **Retired colors:** `packages/ui/src/retired-colors.test.ts` scans the whole repo except `docs/` and `design/`.
- **Platform marks** come only from the design's brand icons (Simple Icons, CC0). A tool that needs a new mark adds it to a design `Mark` artboard first, then runs `gen:marks`.
