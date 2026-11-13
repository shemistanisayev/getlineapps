# Rivaline: build plan (Faza 5, step 1 = SPEC Phase 0)

Source of truth, in order: root `CLAUDE.md`, `docs/line-family-domains.md`, `docs/line-family-colors.md`, `docs/rivaline-SPEC.md`, `design/rivaline/`. This file maps every Rivaline artboard to code, records the API check, lists what is carried over from Hitline and Serpline, and the open questions.

## Family overrides of the SPEC

| SPEC says | We do |
|---|---|
| `apps/rivaline/CLAUDE.md`, `docs/rivaline/SPEC.md` | Root `CLAUDE.md` + `docs/line-family-colors.md`; the SPEC stays at `docs/rivaline-SPEC.md` |
| `apps/rivaline/site`, Cloudflare project `rivaline`, `RIVALINE_SITE_URL` | Routes in `apps/site`: `/rivaline`, `/az/rivaline`, `/rivaline/uninstalled` (+ AZ). Same Pages project `getlineapps`. Links built with `toolUrl('rivaline', path, utm?)` |
| `/privacy` | `/privacy/rivaline` (already live; text in `apps/site/src/content/privacy/rivaline.*.json`, checked against the manifest) |
| Phase 0: move Hitline's `SITE_URL`, add a "Line family" section to `CLAUDE.md` | Done in Faza 1 and 2. Nothing to do |
| Phase 2: refactor Hitline's PDF into `buildLineReport`, move site pieces into `packages/site-kit` | Done in Faza 1 to 4. Rivaline only adds a template (`rivalineReport()`), plus any small option the Report artboard needs (decision 7) |
| Store name "Rivaline: Competitor Research" | Family naming rule. Manifest `name`: `Rivaline: Competitor Research for Meta, Google, TikTok Ads & More` (65 chars), `short_name` `Rivaline`. Landing `meta.title`: `Rivaline: Free Competitor Research for Meta, Google & More` (58). AZ ends with "və s." Final wording in step 9's listing doc |
| `apps/rivaline/fixture` with `kova.localhost` etc. | Kept as the SPEC says (`apps/rivaline/fixture`), served the same way as the Lumo fixture (host-resolver rules plus Playwright vendor routes, nothing leaves the machine) |
| Release status | Web Store limit: package ready, landing published early with status `soon` ("Coming soon", `#finder` works). See `docs/line-family-PLAN.md` |

## Carried over from Hitline and Serpline (owner, 2026-11-13: "what I asked for on the other tools applies to the next ones")

Built in from the start, not added later:

1. **Reading state with steps.** While a tab is read the panel shows each part (page tools, brand styles, logo) with its own state, a progress bar and a skeleton of the Stack tab (Serpline `8f16412`, Hitline `bdf2f83`). "No marketing tools found" (Empty) appears only after the page has finished loading (`document.readyState === 'complete'` plus a short wait for late tags), and says how long Rivaline waited.
2. **Page globals in the MAIN world.** `collectSnapshot` runs in `MAIN` (SPEC §3.1). The isolated world misses `fbq`, `Shopify`, `dataLayer` (Hitline `ba949eb`; confirmed again in the API check below).
3. **Which site is this?** The host is always visible in the panel (Stack hero and the Access / Empty cards), and a cached result is only shown again for the same origin.
4. **Chrome's 250-entry resource list.** When `performance` resources are full, rules also use globals, scripts and cookies, and the snapshot records that the list was full (Hitline 1.1 accuracy fix).
5. **Responsive side panel** from 280 px up: no sideways scroll, chip row scrolls on its own, long IDs wrap or ellipsis with a title, tabs tighten under 400 px (`7f32efa`). `scripts/qa-responsive.ts` gets the Rivaline views.
6. **Real-site QA** on more than the minimum 3 sites (Serpline used 8), with `scripts/qa-rivaline.ts` and `docs/rivaline/QA.md`. False positives are fixed before the store package (Hitline `1c9e0e1`, Serpline `5342b89`).
7. **PDF safety.** No font ligatures, missing glyphs become "?" (Hitline `1c9e0e1`). Real URLs and IDs only, sections only when they have content (Hitline 1.1).
8. **Copy.** No closing period on headings, leads, card texts, hints and list items on the landing (FAQ answers and meta descriptions keep theirs). No em dashes.
9. **Landing.** Hero accent `#67E8F9` with the solid lime underline, marquee and tab bar padding so hover lift is not clipped (`b9d42f2`), shared FAQ script (one open, height animation, `75dd04a`), scrollable regions focusable for axe (`78a3777`), `ToolUninstall.astro` with Rivaline content, site `llms.txt` entry, "Coming soon" while `soon`.
10. **Store and repo.** `pnpm store:rivaline` builds `store/rivaline/` (zip, 5 screenshots from the real side panel at 2x, promo tiles) with a test that keeps listing, manifest and files in line; GitHub release; README and SUPPORT links already cover every tool.
11. **E2E in the real side panel** through `e2e/extension-cdp.ts` (real icon click), axe on every panel view.

## API check (SPEC §3.1, Phase 0)

Run with `pnpm tsx scripts/spike-rivaline.ts [screenshot-folder]`. The script writes a scratch MV3 extension (`activeTab`, `scripting`, `storage`, `sidePanel`, no host permissions) to a temp folder, loads it with CDP `Extensions.loadUnpacked` and clicks the icon with `Extensions.triggerAction` (a real click: Chrome grants `activeTab`). Kova and Glowbar are served by Playwright routes. `e2e/extension-cdp.ts` got a `dir` option for this.

Chrome stable 157.0.8103.39, Windows 11, 2026-11-13:

| Check | Result |
|---|---|
| `sidePanel.open({ tabId })` from `action.onClicked` | **Pass** |
| `sidePanel.open({ windowId })` from `action.onClicked` | **Pass**. We use `windowId` as Serpline does: one panel per window, it stays open on tab switches, so Access can be shown (SPEC §3.1 "Tab changes") |
| Panel gets the `scan` message right after `open()` | Not received (the panel was still loading). As the SPEC says, the panel scans the active tab on load. **Pass** with that fallback |
| `executeScript` from the panel, `MAIN` world | **Pass**: `fbq` and `Shopify.theme.name` ("Dawn") visible |
| `executeScript` from the panel, isolated world | **Pass**: computed styles and the logo rectangle; page globals are not visible there (expected) |
| `captureVisibleTab` with `activeTab` only, crop with `OffscreenCanvas` in the panel | **Pass**: full PNG (device pixels, 1923x1140 at DPR 1.5), crop 160x48 to a PNG blob |
| Same tab, same-site navigation | `activeTab` is kept: `executeScript` and `captureVisibleTab` still work. The panel rescans without a new click |
| Another tab, never clicked | **Pass** (Access): `executeScript` fails with "Cannot access contents of the page. Extension manifest must request permission to access the respective host."; `captureVisibleTab` fails with "Either the '<all_urls>' or 'activeTab' permission is required." After a click on that tab both work |
| Same tab, another site | Grant gone, same "Cannot access contents of the page" error: Access |
| `chrome://version`, `chrome://extensions` | `executeScript`: "Cannot access a chrome:// URL" → Restricted. Note: `captureVisibleTab` **works** there after a click, so Restricted must be decided by the probe, never by the capture |
| Chrome Web Store | `executeScript`: "The extensions gallery cannot be scripted." → Restricted |
| PDF viewer | **Differs from the SPEC**: `executeScript` succeeds (Chrome hosts the PDF in an HTML page, dark `#282828` body). The probe returns `document.contentType`; `application/pdf` → Restricted |
| `Alt+Shift+R` (`_execute_action`) | **Fails**: Chrome 157 leaves the shortcut empty (`commands.getAll` shows `""`). `Alt+Shift+V`, `Alt+Shift+K` and `Alt+Shift+Y` were assigned in the same test, so `Alt+Shift+R` is taken by Chrome itself. Owner chose **`Alt+Shift+V`** (question 1) |

Restricted vs Access is decided by the error text: `chrome://`, `chrome-extension://`, `edge://`, "extensions gallery" and a `application/pdf` probe → Restricted; everything else → Access.

### Ad library URL formats (SPEC §5)

Opened each URL in Chrome stable with brand "Nike", domain `nike.com`, country all and `US`:

| Library | Result |
|---|---|
| Meta Ad Library | **Pass**. Country (`ALL` or `US`) and the keyword are applied, results load (~25,000 for US). Meta adds its own sort parameters |
| Google Ads Transparency Center | **Pass**. `region=anywhere` or `US`, the domain card and ~9K ads load. The page follows the browser language |
| TikTok Ad Library | **Partly.** The brand and the region are filled in, but the search does not run by itself (0 results until the user presses Search). It only knows the EU, EEA, Switzerland and the UK: `region=US` leaves the country empty. The design already says "Ads shown in Europe". **Question 2** |
| LinkedIn Ad Library | **Pass**. `accountOwner` fills "Company or advertiser" and results load. The URL has no country (the SPEC does not ask for one) |

## Monorepo state (checked 2026-11-13)

| Needed | State |
|---|---|
| `packages/ui` | Tokens with the Rivaline teal, `Logo` (all 5), icons `packages/ui/icons/rivaline/icon-16/32/48/128.png`, `Mark` with `meta`, `tiktok`, `googleads`, `pinterest`, `googleanalytics`, `hotjar`, `googletagmanager`, `mailchimp`, `intercom`, `shopify`, `trustpilot`, `klarna`, `paypal`, `hubspot`, `wordpress`, `webflow`, `stripe`, `zendesk`, `snapchat`, `mixpanel`, `matomo`, `plausible`, `posthog`, `x`, `reddit`, `floodlight`, `library`, `google` |
| Marks still missing | LinkedIn, Microsoft, Criteo, Taboola, Outbrain, Adobe, Amplitude, Heap, Clarity, FullStory, Contentsquare, Yandex, consent tools, Salesforce, Zoho, Klaviyo, Drift, Crisp, Optimizely, WooCommerce, BigCommerce, Wix, Squarespace, Tilda, Yotpo, Afterpay, Shop Pay ... Step 3 adds those that exist in `simple-icons`; the rest use the category glyph (SPEC §4.2) |
| `design/rivaline/brand-icons/`, `screens/*.png` | Not in the repo (same as Serpline). Marks come from `@line/ui`; comparison by rendering the artboards |
| `packages/core` | `src/rivaline` is an empty stub. Reusable: `shared/domain.ts` (registrable domain), `hitline/sgtm.ts` (`detectSgtm`), `hitline/consent.ts` (`KNOWN_CMPS`), `hitline/platforms.ts` (50 platforms with URL patterns to seed the rules) |
| `packages/report` | `buildLineReport` with tiles (tone, suffix), key/value, severity list, CTA, footer, multi-page. Rivaline needs a two-column block (Brand kit + Ad libraries) and swatches: decision 7 |
| `packages/site-kit`, `apps/site` | Feedback (`tool` field), consent, SEO head, `ToolUninstall.astro`, FAQ script, `tools.json` (rivaline `soon`), privacy page for Rivaline. Reused as is |
| `e2e/extension-cdp.ts` | Real icon click, side panel eval and screenshots. Reused for Rivaline e2e and store shots |

## Package and app layout

```
packages/core/src/rivaline/
  snapshot.ts     §4.1 types of the page snapshot and the brand raw data (the injected functions live in the extension)
  rules/          one file per category (§4.2): advertising.ts, analytics.ts, tagmanagement.ts, consent.ts, crm.ts,
                  email.ts, chat.ts, abtesting.ts, ecommerce.ts, reviews.ts, payments.ts, affiliate.ts
  match.ts        snapshot + rules -> tools with evidence and IDs; sGTM tool from hitline/sgtm
  summary.ts      §4.3 hero lines and marks row
  gaps.ts         §4.4
  ads.ts          §5 brand name, domain, country, the four URL builders (one place to fix formats)
  brand.ts        §6 color merge (ΔE), roles, fonts, main button, export (CSS, JSON)
  index.ts
packages/core/fixtures/rivaline/   kova-snapshot.json, kova-brand.json, mira-snapshot.json (recorded from the fixture)

apps/rivaline/extension/      WXT + React + TS
  entrypoints/background.ts   setPanelBehavior, onClicked -> sidePanel.open({ windowId }) + message, onInstalled -> welcome, setUninstallURL
  entrypoints/sidepanel/      React panel
  entrypoints/welcome/        Welcome artboard
  src/capture/snapshot.ts     collectSnapshot (MAIN)
  src/capture/brand.ts        collectBrand (isolated)
  src/capture/logo.ts         captureVisibleTab + OffscreenCanvas crop, PNG palette
  src/i18n/en.ts, az.ts
  src/components/             PanelHeader, Tabs, StackHero, GapStrip, CategoryChips, ToolRow, EvidenceList, NotFoundCard,
                              LimeCta, LibraryRow, SearchFor, LogoCard, Swatches, FontRows, ButtonPreview, ExportSheet,
                              Toast, AccessView, RestrictedView, EmptyView, ReadingView, SettingsView
  src/report.ts               rivalineReport() -> buildLineReport
  src/storage.ts              lang, country, installedAt

apps/rivaline/fixture/        Kova, Glowbar, Mira Studio from SitePage.dc.html; vendor stubs
apps/site/src/pages/rivaline.astro, az/rivaline.astro, rivaline/uninstalled.astro, az/rivaline/uninstalled.astro
apps/site/src/content/rivaline/en.json, az.json
apps/site/src/scripts/ad-finder.ts   vanilla island for #finder, imports @line/core/rivaline/ads
```

## Artboards to components

### Extension (side panel)

| Artboard | Component | Notes |
|---|---|---|
| `PanelHeader` | `PanelHeader`: Logo, "Read the page again", Settings, "Report PDF" (disabled in Access and Restricted); `Tabs` Stack, Ads, Brand with counts (hidden in Access and Restricted) | Chrome's own 40 px title row (`PanelChrome`) is not built |
| `Main` | `StackTab`: `StackHero` (§4.3 lines, marks row with `+N`), `GapStrip`, `CategoryChips` (All first, horizontal scroll with fade), grouped `ToolRow` list (Mark 28, name, mono ID, chevron) | |
| `StackDetail` | chip filter, `ToolRow` expanded in place with `EvidenceList` (kind pill + mono value, max 4), "Copy ID", "Open in <library>" for Advertising (jumps to Ads, highlights the row); `NotFoundCard` with gaps; `LimeCta` "Want these in place on your own site?" (`panel_cta`) | |
| `Ads` | `AdsTab`: `SearchFor` (Brand name, Domain, Country; edits not saved), 4 `LibraryRow`s (Mark, name, coverage, search pill, status pill, open), "Open all 4 in new tabs", "Copy links", note | Links from `core/rivaline/ads.ts` |
| `Brand` | `BrandTab`: `LogoCard` (crop, Copy PNG, Download PNG, Copy SVG for inline SVG; "Scroll to the top..." when out of view), `Swatches` (5, click copies HEX + toast), `FontRows` (source pill), `ButtonPreview` (values + live preview), export row | |
| `BrandExport` | `ExportSheet`: segmented CSS variables / JSON / PNG palette, preview, Copy → "Copied" 2 s, Download, note, dark `Toast` | blob URL + `<a download>`, no `downloads` permission |
| `Access` | `AccessView`: "Read this tab?", host when known, icon and shortcut (real one from `commands.getAll`, or "Set a shortcut" when empty), activeTab note | Without the `tabs` permission the panel may not know the new host: then it shows the card without it (as Serpline) |
| `Restricted` | `RestrictedView` | Decided by the probe error (API check) |
| `Empty` | `EmptyView`: host, "What Rivaline checked" tags, "The Ads and Brand tabs still work for this site.", `LimeCta` "Starting from zero?" | Shown only after the page has loaded (carried over 1) |
| (no artboard) | `ReadingView`: steps (page tools, brand styles, logo) with states, progress bar, Stack skeleton | Carried over 1 |
| `Settings` | `SettingsView`: Default country (ISO list, "All countries" first), Keyboard shortcut ("Change" → `chrome://extensions/shortcuts`), Language, "Clear all settings" + note, More free tools (`more_tools`), footer: version, Privacy (`/privacy/rivaline`, no UTM), Contact (`settings`) | |
| `Report` | `rivalineReport()` → `buildLineReport` | Decision 7 |
| `Welcome` | `welcome.html`: 3 steps, chips, "Built by", contact (`welcome`) | |
| `Logo`, `Mark` | `@line/ui` | |
| `BrowserBar`, `PanelChrome` | not built (mock only) | |
| `SitePage` | `apps/rivaline/fixture` Kova page | Fraunces and DM Sans subset for the mock only |

### Site (`apps/site`, Faza 5B)

| Artboard | Route / component | Notes |
|---|---|---|
| `Landing`, `LandingTablet`, `LandingMobile` | `/rivaline`, `/az/rivaline`: sticky dark header, hero (pill, accent words, buttons incl. "Try the ad library finder" → `#finder`, callouts, product mock, Brand kit card, Not found toast), marquee, tab showcase (Stack, Ads, Brand), How it works, CTA, Privacy, FAQ, More free tools, footer | SPEC §9 visual rules; status `soon` → "Coming soon" |
| `#finder` | `ad-finder.ts`: brand, domain, country → 4 links (new tab, `rel="noopener"`), updates while typing, nothing sent | Same builders as the panel (unit test) |
| `Uninstall` | `/rivaline/uninstalled` (+ AZ) via `ToolUninstall.astro`, `tool=rivaline` | |
| SEO | `SoftwareApplication` + `FAQPage` JSON-LD, OG 1200x630 from the hero, canonical, hreflang, sitemap, `llms.txt` | |

## Decisions

1. **Panel per window** (`sidePanel.open({ windowId })`), as Serpline. The SPEC's `{ tabId }` also works, but a per-tab panel closes on tab switch and Access could never be shown.
2. **Restricted** is decided by the probe (error text or `contentType === 'application/pdf'`), never by `captureVisibleTab` (it works on `chrome://` pages after a click).
3. **Logo crop** uses `devicePixelRatio` from `collectBrand` to map CSS px to the capture (the capture is in device pixels: 1923x1140 at DPR 1.5 in the check).
4. **TikTok country.** The builder sends the country only when TikTok knows it (EU, EEA, CH, UK), otherwise `all`. Final behaviour depends on question 2.
5. **Stack numbers on Kova** (SPEC §11): 13 tools in 8 categories, 3 gaps (server-side, consent, CRM), IDs from Main (`418273650912345`, `C9H3KQ7RC77U2M0V5PLG`, `AW-11284956`, `2612345678901`, `G-8XK2LM4QPZ`, `site 3918274`, `GTM-N4KV8R`). Step 4 asserts them.
6. **Rules seed.** Rivaline's rules start from Hitline's 50-platform URL patterns (same hosts, one source) plus the SPEC list, to about 120 tools. Shared patterns are imported, not copied, so a fix in one tool reaches both.
7. **Report layout.** If `buildLineReport` has no two-column block or swatches yet, they are added as optional section kinds; Hitline and Serpline snapshots must stay identical.
8. **Copy.** Core returns ids, numbers and evidence only; every sentence goes into EN and AZ dictionaries, listed in `docs/rivaline/AZ-REVIEW.md`.

## Questions for the owner

1. **Shortcut.** Answered 2026-11-13: **`Alt+Shift+V`** ("riVal"). Chrome 157 does not give `Alt+Shift+R` to extensions. The manifest, Access, Settings, Welcome and the landing show Alt Shift V instead of the design's Alt Shift R; the panel always shows the real shortcut from `commands.getAll`.
2. **TikTok link.** The link opens TikTok's library with the brand and country filled in, but the user must press Search, and it covers Europe only. Proposal: keep it, the row already says "Ads shown in Europe"; add a short hint "Press Search on TikTok's page". Alternative: leave the hint out.
3. **QA sites** (step 10): name at least 3 public sites (one Shopify store, one big brand, one Azerbaijani site would be ideal). Otherwise I pick them, as for Serpline.

## Step order (Faza 5)

| Step | SPEC | What | Done when |
|---|---|---|---|
| 1 | P0 | This plan and the API check | Done: this file, `scripts/spike-rivaline.ts` |
| 2 | P1 | `apps/rivaline/extension` scaffold (side panel, background, shortcut, welcome, uninstall URL, manifest test), `apps/rivaline/fixture` skeleton, workspace and CI | Real icon click opens the panel and the probe works on the fixture |
| 3 | P2 | Rivaline panel theme and shell in `@line/ui/rivaline`, new marks, category glyphs, preview section, contrast tests | Preview |
| 4 | P3 | `packages/core/src/rivaline` (rules ~120, match, IDs, evidence, summary, gaps, ad builders, brand functions) + Kova, Glowbar, Mira fixture | Kova: 13 tools, 8 categories, 3 gaps, the design IDs |
| 5B | P8 | `/rivaline` landing with `#finder`, `/rivaline/uninstalled`, SEO, AZ, published early as `soon` | Screenshots 1440 / 820 / 390, axe clean, deployed |
| 5 | P4 | Scan pipeline with reading steps, PanelHeader, Stack, StackDetail, Access, Restricted, Empty | Match artboards on the fixture |
| 6 | P5 | Ads, Brand, BrandExport | Exported files open |
| 7 | P6 | Settings, EN + AZ, `AZ-REVIEW.md` | Language switch changes every string |
| 8 | P7 | Competitor report PDF, welcome, uninstall hook | Kova PDF matches Report |
| 9 | P9 | Store package (`pnpm store:rivaline`), listing doc, release | `store/rivaline/` |
| 10 | P10 | QA on real sites, responsive check, Lighthouse, axe, OWNER-GUIDE chapter | No false positives, `docs/rivaline/QA.md` |

Each step ends with typecheck, lint, tests and build for every app and package, screenshots of the touched screens, commit, push and a short Azerbaijani report.
