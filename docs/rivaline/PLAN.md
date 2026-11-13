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
6. **Rules.** Hitline's platform list has no URL patterns of its own (they live in its request classifier, built for decoded hits), so Rivaline keeps its own 128 rules in `packages/core/src/rivaline/rules/`. Shared with Hitline: the consent platform list (a test keeps every `KNOWN_CMPS` name covered) and the registrable-domain helper.
7. **Report layout.** If `buildLineReport` has no two-column block or swatches yet, they are added as optional section kinds; Hitline and Serpline snapshots must stay identical.
8. **Copy.** Core returns ids, numbers and evidence only; every sentence goes into EN and AZ dictionaries, listed in `docs/rivaline/AZ-REVIEW.md`.

## Step 2 notes (2026-11-13)

- **Fixture hosts.** Kova, Glowbar and Mira Studio answer on `example.com`, `example.net` and `example.org` (host-resolver rules to port 4402, `apps/rivaline/fixture/hosts.ts`), so the panel shows the design hosts. The SPEC's `kova.localhost`, `glow.localhost` and `mira.localhost` reach the same pages. Lumo (Hitline, Serpline) also uses `example.com`, but every e2e suite starts its own browser with its own rules, so they never meet. Pages are a skeleton; the full SitePage and vendor stubs come in step 4.
- **Access copy.** The design says "You switched to example.net." Without the `tabs` permission Chrome hides the URL of a tab that was not granted, so the panel says "You switched tabs." (same limit as Serpline).
- **Restricted list** gets a fourth line, "PDF files opened in Chrome", because the API check showed PDFs need their own rule.
- **Shortcut** is read from `commands.getAll` on the Access card and the welcome page; when people remove it, both say how to set one instead of showing empty keys.
- The panel reads again on every tab switch and on `complete` of the active tab. Step 5 adds the cache by tab and origin (SPEC §3.1) and the reading steps.

## Step 3 notes (2026-11-13)

- **New marks** (simple-icons, unaltered): Osano, Zoho, Brevo, LiveChat, WooCommerce, BigCommerce, Wix, Squarespace, Afterpay, Rakuten, Tilda. Afterpay's mint is too light for a tint, so its tile is the mint with a black mark, as the designs draw Snapchat and Klarna.
- **No mark in simple-icons** (removed at the brands' request or never there): LinkedIn, Microsoft, Adobe, Salesforce, Klaviyo, Amplitude, Clarity, Optimizely, Criteo, Taboola, Segment and others. They use the category glyph (SPEC §4.2). The LinkedIn library row keeps the design's neutral "library" mark.
- **Category glyphs** (`RIVALINE_GLYPHS`): advertising, analytics, tag management, consent, CRM, email, chat, A/B testing, e-commerce, reviews, payments, affiliate, server-side. Tones neutral, brand (teal tint) and warning.
- **Contrast changes for AA:** the hero "+N" tile uses 8% white plus a ring instead of 18% white (3.8:1 to 4.6:1); disabled buttons use `#475467` instead of `#667085` on `#EAE8F0` (4.1:1 to 6.3:1).
- **Narrow panels:** swatches fill by width (5 in the 400 px panel, fewer below), under 380 px the evidence and library pills lose their indent, under 320 px Report PDF shows only its icon (the label stays for screen readers). Checked at 280 px in e2e.
- **Chip order:** the design sorts category chips by count (Advertising 4, Analytics 2, Payments 2, Tag management 1), while the list groups follow the SPEC's category order. Step 5 keeps both.
- **Tabs in Access and Restricted:** no tab is selected and counts are hidden, but the first tab stays focusable so the tab list is reachable by keyboard.

## Step 4 notes (2026-11-13)

- **Fixture.** `apps/rivaline/fixture/public/kova.html` is SitePage with the real vendor snippets (GTM, Meta, TikTok, Pinterest, Hotjar, Mailchimp, Intercom, Shopify, Trustpilot, Klarna, PayPal). `vendors.ts` answers every https URL through Playwright: script stubs define the globals, set the cookies and send one request each; Google Fonts CSS and Fraunces / DM Sans files come from `@fontsource`. Glowbar has Shopify, GA4 with a Consent Mode default, Meta, Klaviyo and Cookiebot; Mira Studio has nothing. The e2e suite routes the vendors too, so no request leaves the machine.
- **Recording.** `pnpm tsx scripts/record-rivaline-fixture.ts` runs the extension's own `collectSnapshot` and `collectBrand` (`apps/rivaline/extension/src/capture/`) on the three sites and writes `packages/core/fixtures/rivaline/*.json`. Core tests read those files.
- **Inline scripts.** SPEC §4.1 keeps the first 300 characters of each inline script, but `fbq('init', ...)`, `ttq.load(...)` and `pintrk('load', ...)` sit after character 300 in the real snippets. The snapshot also keeps 80-character excerpts around those ID calls (at most 6 per script), still never whole scripts.
- **Accent color** uses HSV saturation: HSL calls pale tints saturated and picked Kova's `#F1E3C2` product tile instead of the brand yellow `#EBC56B`.
- **Color order** follows the design (Primary, Text, Background, Accent, Surface) in the Brand tab, the export and the PDF. The SPEC lists the roles in the order they are worked out.
- **Labels without an ID:** chat tools "chat", reviews "widget", buy-now-pay-later "messaging", consent "banner", Mailchimp "forms", Shopify shows its theme name ("Dawn").
- **Marks row** puts only the first analytics tool before the ad pixels (design: Shopify, GTM, GA4, Meta, TikTok, Google Ads, Pinterest, then "+6"; Hotjar is in the +6).
- **Serpline e2e:** its LCP check failed now and then when tests ran in parallel. Chrome reports LCP only for a visible tab, and the panel correctly says "Not measured" with the reason. The test now accepts that state; Serpline itself is unchanged.

## Step 5B notes (2026-11-13)

- **Finder input.** As in the design: a domain gives the domain and a brand from its first label (`example.com` gives "Example", `kova.co.uk` gives "Kova"); a brand name leaves Google, which searches by domain, at "Needs a domain". The country is always "all" on the landing (the extension has the country select). A line under the cards says TikTok covers Europe.
- **FAQ** gets a sixth question about TikTok's European-only library (owner question 2 still open for the panel hint).
- **Copy.** Headings, leads and card texts lose the closing period (family rule); the demo site text ("Skincare that keeps it simple.") and FAQ answers keep theirs. "How it works" shows Alt Shift V.
- **Report section** keeps the design's `#report` anchor and its paper mock with the 5 Kova swatches. The hero accent is `#67E8F9` with the lime underline; the marquee and tab bar have the padding that keeps hover lift from being clipped.
- **Hub test** now expects a link to `/rivaline` (the landing exists, status stays `soon`).

## Step 5 notes (2026-11-13)

- **Reading steps** (carried over): waiting for the page to load, finding tools, reading colors and fonts, taking the logo, with a progress bar and a skeleton of the Stack tab. Empty appears only after the page has finished loading and one more read for late tags, and says how long Rivaline waited ("Read 4 s after the page finished loading").
- **Cache.** One result per tab, in memory. A tab switch probes the tab (`executeScript` returning its URL): same URL shows the cached result at once, another page is read again, no access gives Access. Closing a tab drops its result.
- **Summary line** says "store" only for selling platforms (Shopify, WooCommerce, Adobe Commerce, BigCommerce, Salesforce Commerce Cloud, PrestaShop, Ecwid) and "site" for WordPress, Webflow, Wix, Squarespace and Tilda ("WordPress site running Meta ads").
- **Brand count on Empty.** The design's header shows "Brand 4" for Mira Studio; the real page has 5 color roles, so the panel shows 5. The count is always computed.
- **250 requests.** When Chrome's resource list is full the Stack tab says that a tool loaded later may be missing (carried over from Hitline 1.1).
- **Ads and Brand tabs** show a one-line note until step 6; Settings and Report PDF stay inactive until steps 7 and 8.

## Step 6 notes (2026-11-13)

- **Logo crop scale.** `captureVisibleTab` follows the screen's scale (1.5 on this Windows machine), not always the page's `devicePixelRatio`, so the first crop missed the logo. The crop now uses screenshot width / viewport width; the e2e checks the crop has Kova's dark wordmark in it.
- **Ads edits** are not saved and reset on the next read (SPEC §5). The country select starts at the Settings default (`country`, "All countries" until step 7). TikTok gets the country only for EU, EEA, CH and UK.
- **Downloads** use a blob URL and `<a download>` (no `downloads` permission): `kova.css`, `kova-brand.json`, `kova-palette.png`, and `kova-logo.png` for the logo.
- **Main button preview** keeps the page's colors, radius and font but caps height (48 px), padding (28 px) and size (16 px) so a huge hero button still fits the panel; the values next to it are the real ones.
- **Tab memory.** The panel keeps the tab the user picked (Brand stays Brand on the next site); "Open in <library>" in the Stack tab switches to Ads and highlights that row until another tab is picked.

## Questions for the owner

1. **Shortcut.** Answered 2026-11-13: **`Alt+Shift+V`** ("riVal"). Chrome 157 does not give `Alt+Shift+R` to extensions. The manifest, Access, Settings, Welcome and the landing show Alt Shift V instead of the design's Alt Shift R; the panel always shows the real shortcut from `commands.getAll`.
2. **TikTok link.** (Hint added in step 6: the TikTok row says "Ads shown in Europe. Press Search on TikTok's page"; tell me if you want it removed.) The link opens TikTok's library with the brand and country filled in, but the user must press Search, and it covers Europe only. Proposal: keep it, the row already says "Ads shown in Europe"; add a short hint "Press Search on TikTok's page". Alternative: leave the hint out.
3. **QA sites** (step 10): name at least 3 public sites (one Shopify store, one big brand, one Azerbaijani site would be ideal). Otherwise I pick them, as for Serpline.

## Step order (Faza 5)

| Step | SPEC | What | Done when |
|---|---|---|---|
| 1 | P0 | This plan and the API check | Done: this file, `scripts/spike-rivaline.ts` |
| 2 | P1 | `apps/rivaline/extension` scaffold (side panel, background, shortcut, welcome, uninstall URL, manifest test), `apps/rivaline/fixture` skeleton, workspace and CI | Done: icon click (real, via CDP) opens the panel; the probe reads Kova in the MAIN world; same-site navigation reads again, another tab or site shows Access with the real shortcut, `chrome://version` and the PDF viewer show Restricted (e2e on Edge and Chrome stable 157). Fixture on port 4402 serves the design hosts. AZ text in `docs/rivaline/AZ-REVIEW.md` |
| 3 | P2 | Rivaline panel theme and shell in `@line/ui/rivaline`, new marks, category glyphs, preview section, contrast tests | Done: `@line/ui/rivaline` (PanelHeader with tabs, StackHero, GapStrip, CategoryChips, ToolGroup and ToolRow with evidence, NotFoundCard, LimeCta, LibraryRow, fields, LogoBox, Swatch, FontRow, ButtonPreview, Segmented, CodeBlock, Sheet, Toast) and `rivaline.css`; 11 new marks from simple-icons and 13 category glyphs; preview section with the design's demo data; 32 contrast pairs tested. The panel uses the new header |
| 4 | P3 | `packages/core/src/rivaline` (rules ~120, match, IDs, evidence, summary, gaps, ad builders, brand functions) + Kova, Glowbar, Mira fixture | Done: 128 rules in 12 categories, server-side signal, gaps, summary, chips, ad library builders, ISO country list, brand kit (ΔE merge, roles, fonts, button, CSS and JSON export, logo crop). Kova recorded with the extension's own collectSnapshot and collectBrand gives 13 tools in 8 categories, the design IDs, 3 gaps, "+6", the 5 colors, Fraunces and DM Sans, the button and the BrandExport CSS exactly. 53 core tests |
| 5B | P8 | `/rivaline` landing with `#finder`, `/rivaline/uninstalled`, SEO, AZ, published early as `soon` | Done: landing EN + AZ from `content/rivaline/*.json` (design copy, no closing periods, Alt Shift V), `#finder` island with the extension's own builders (`@line/core/rivaline/ads`, `parseFinderQuery`), Coming soon while `soon`, `/rivaline/uninstalled` through `ToolUninstall.astro` (teal accent), OG image (`gen:rivaline`), SoftwareApplication + FAQPage JSON-LD; sitemap, `llms.txt` and the hub card pick it up. Screenshots 1440 / 820 / 390 with no sideways scroll, axe clean on all three pages. Deployed by CI on push |
| 5 | P4 | Scan pipeline with reading steps, PanelHeader, Stack, StackDetail, Access, Restricted, Empty | Done: scan waits for `load`, then 1.5 s for late tags (2.5 s more if nothing is found), reads the snapshot (MAIN), the brand (isolated) and crops the logo; results cached per tab and shown again on a switch when the tab is still on that page. Stack on Kova matches Main and StackDetail (13 tools, the IDs, chips by count, evidence, Copy ID, Open in Meta Ad Library jumps to Ads); Access, Restricted and Empty (Mira) as designed. E2E on Edge and Chrome stable |
| 6 | P5 | Ads, Brand, BrandExport | Done: Ads with editable brand, domain and country (Settings default, ISO names from Intl.DisplayNames), four library rows with status pills, the row the Stack tab jumped to highlighted, Open all 4, Copy links; Brand with the cropped logo (Copy PNG, Download PNG, Copy SVG for inline SVG), 5 colors with copy, fonts with their source, the main button drawn with its own values; export sheet with CSS variables, JSON and a 1200 x 400 PNG palette (copy, download). On Kova the e2e checks the links, the colors, fonts, button, the logo pixels and the three downloaded files |
| 7 | P6 | Settings, EN + AZ, `AZ-REVIEW.md` | Language switch changes every string |
| 8 | P7 | Competitor report PDF, welcome, uninstall hook | Kova PDF matches Report |
| 9 | P9 | Store package (`pnpm store:rivaline`), listing doc, release | `store/rivaline/` |
| 10 | P10 | QA on real sites, responsive check, Lighthouse, axe, OWNER-GUIDE chapter | No false positives, `docs/rivaline/QA.md` |

Each step ends with typecheck, lint, tests and build for every app and package, screenshots of the touched screens, commit, push and a short Azerbaijani report.
