# Serpline: build plan (Faza 4, step 1 = SPEC Phase 0)

Source of truth, in order: root `CLAUDE.md`, `docs/line-family-domains.md`, `docs/line-family-colors.md`, `docs/serpline-SPEC.md`, `design/serpline/`. This file maps every Serpline artboard to code, fixes the open choices and lists the gaps found while reading the design.

## Family overrides of the SPEC

| SPEC says | We do |
|---|---|
| `apps/serpline` | `apps/serpline/extension` (WXT + React + TS, side panel) |
| `apps/serpline-site`, Cloudflare project `serpline`, custom domain | Routes in `apps/site`: `/serpline`, `/az/serpline`, `/serpline/uninstalled` (+ AZ). Same Pages project `getlineapps` |
| `SITE_URL` | `toolUrl('serpline', path, utm?)` from `@line/core/site` |
| `/privacy` | `/privacy/serpline` (already live, text in `apps/site/src/content/privacy/serpline.*.json`) |
| Separate SERP preview tool | `#preview` section on `/serpline` |
| `packages/seo-core` | `packages/core/src/serpline` (export `@line/core/serpline`, already scaffolded, same as Hitline). The site island and the extension import from there |
| Store title "Serpline: SEO & AI Search Audit" | Family naming rule. Manifest `name`: `Serpline: SEO Checker & AI Crawler Audit for Google, ChatGPT & More` (67 chars), `short_name` `Serpline`. Landing `meta.title`: `Serpline: Free SEO Checker for Google, ChatGPT & More` (53). AZ ends with "və s." |
| `apps/serpline/CLAUDE.md` | Root `CLAUDE.md` + `docs/line-family-colors.md` |

## Monorepo state (checked 2026-11-11)

| Needed | State |
|---|---|
| Hitline Phase 2 (design system) | Done (Faza 1 + Faza 3). Serpline is not blocked |
| `packages/ui` | Tokens, fonts, `Logo` (all 5 tools), `HubLogo`, `Glyph`, `Mark`, `Button`, `Pill`, `Card`, preview page, icons `packages/ui/icons/serpline/icon-16/32/48/128.png` already generated |
| `Mark` names Serpline needs | All present: `openai`, `anthropic`, `perplexity`, `google`, `apple`, `bytedance`, `meta`, `bot`, `file`, `link`, `eye`, `globe`, `braces`, `share` (Simple Icons, CC0). Only the "CC" letter badge for CCBot is new (text, not a logo) |
| `packages/report` | `buildLineReport(config)` with tiles, key-value, severity list, CTA, footer. Serpline only adds a template (`serplineReport()` in the extension, as Hitline does) |
| `packages/site-kit` | Feedback function (Resend, honeypot, rate limit, `tool` field), consent banner, SEO head. Reused as is |
| `apps/fixture` (Lumo) | Hitline shop at `example.com/products/wireless-headphones-pro-x`, host-resolver rules, vendor stubs. Serpline adds a scenario (decision 1) |
| `apps/site` | Hub, privacy tabs, `/hitline` landing, `HitlineUninstall.astro`, `tools.json` (serpline `soon`) |
| CI (`.github/workflows/ci.yml`) | Runs `pnpm -r` typecheck/build, lint, Vitest, Playwright for every workspace package. New packages join automatically |
| Design PNGs (`screens/*.png`) and `brand-icons/` named in SPEC §2 | Not in the repo. Comparison is done by rendering the artboard markup ourselves; brand marks already come from `simple-icons` in `@line/ui` |

## Package and app layout

```
packages/core/src/serpline/
  snapshot.ts      types of the raw page snapshot (what the injected function returns)
  extract.ts       §4.1 extractors over a DOM-like Document (live DOM or DOMParser of raw HTML)
  diff.ts          §4.2 render diff, needs-JavaScript share, "added by JavaScript" list
  serp.ts          §4.3 Arial width table (same as Landing.dc.html), measure, truncate, URL line, site name
  robots.ts        §4.4 RFC 9309 parser, matcher, Sitemap lines
  bots.ts          §4.4 bot list (config, 13 rows, two groups) and status per bot
  links.ts         internal/external by registrable domain (shared helper with Hitline), link-check plan + result merge
  issues.ts        §4.5 one rule list, severity, tab, evidence, score and label
  analyze.ts       analyze(snapshot, rawHtml, robots, llms, linkResults?) -> Audit
  index.ts
packages/core/fixtures/serpline/
  lumo-rendered.html, lumo-raw.html, lumo-robots.txt   recorded from apps/fixture
  robots-*.txt                                         RFC 9309 cases
  expected.json                                        issues, counts and score 56 from the design

apps/serpline/extension/      WXT + React + TS
  entrypoints/sidepanel/      React panel (manifest side_panel.default_path)
  entrypoints/background.ts   setPanelBehavior, action.onClicked -> sidePanel.open + message, onInstalled -> welcome, setUninstallURL
  entrypoints/welcome/        Welcome artboard
  src/capture/inject.ts       the one function run by executeScript (rendered DOM data, raw HTML fetch, robots.txt, llms.txt)
  src/capture/links.ts        same-origin link check (HEAD, GET on 405, 4 at a time, 8 s timeout, max 100), runs in the page
  src/capture/overlay.ts      highlight overlay (shadow root, removable)
  src/i18n/en.ts, az.ts       typed dictionaries
  src/components/             PageRow, Tabs, ScoreRing, CheckRow, SerpResult, LevelChip, BotRow, LinkRow, StatusPill, Switch, Segmented, CtaFooter, LimeCta ...
  src/report.ts               serplineReport() -> buildLineReport
  src/storage.ts              lang, previewDevice, autoCheckLinks, installedAt

apps/site/src/pages/serpline.astro, az/serpline.astro, serpline/uninstalled.astro, az/serpline/uninstalled.astro
apps/site/src/content/serpline/en.json, az.json
apps/site/src/scripts/serp-preview.ts   vanilla island for #preview
```

## Artboards to components

### Extension (side panel)

| Artboard | Component | Notes |
|---|---|---|
| `PanelHeader` | `PageRow` (host bold, path muted, ellipsis; "Check again", "Audit PDF", Settings icon) + `Tabs` (Summary, Headings, Links, Render, AI; active blue `#1E40AF` with 3px `#2563EB` underline; badge red tint, blue on the active tab; Summary has no badge) | The 40 px Chrome title row is not built |
| `Main` | `SummaryTab`: blue `Hero` (host, "Checked at hh:mm", `ScoreRing`, label, "N high, N medium, N low priority issues"), "On-page checks" card (9 `CheckRow`s with icon pills), `GooglePreview` card (`Segmented` Mobile / Desktop, `SerpResult`, two measurement rows with Fits / Too long pills), dark `CtaFooter` | Desktop preview renders at 600 px and scales to panel width |
| `Headings` | `HeadingsTab`: 4 count tiles (H1 in Problem colors + icon on RAW_H1 or H1_MULTI), `Switch` "Highlight on page", outline tree (`LevelChip`, indent per level, "JavaScript only" and "Skips H3" pills), "Images" card (file name + "No alt"), `CtaFooter` | |
| `SitePage` (highlight on) | `overlay.ts`: dashed `#2563EB` outline + label on headings ("H1 added by JavaScript", "H2"), red outline + "No alt" on images, dark bottom pill "Serpline highlights: N headings, N images" + "Hide". All inside one shadow root; turning off removes the host node | Injected with `executeScript`, no content script |
| `Links` | `LinksTab`: 4 tiles, check bar (stacked OK / redirect / broken bar, legend, note) or the "Check N internal links" button before the check, filter chips (All, Issues, Internal, External), `LinkRow` (anchor text, path or "from to target", status pill), `IssueCard` with "Fix:", `CtaFooter` | Bar colors `#12B76A` / `#F79009` / `#D92D20` always with a text legend |
| `Render` | `RenderTab`: blue hero ("N% of the text needs JavaScript", word bar), comparison table (Signal, Raw HTML, Rendered), "Added by JavaScript" code card + one-line fix, `LimeCta` "Want server-side rendering set up for SEO?" | |
| `Ai` | `AiTab`: blue hero (N/M allowed, main finding), bots card grouped (Search and answers, Model training) with `BotRow` (Mark, user-agent in mono, "shown as", status pill, robots line under a blocked bot), "N more bots" expander, `LimeCta` "Want your site to show up in AI answers?", "Files for crawlers" (robots.txt, sitemap, llms.txt) | |
| `Settings` | `SettingsView`: preview device `Segmented`, `Switch` "Check internal links on open" + note, Language, "Clear all settings" + privacy note, "More free tools" (Hitline, Rivaline, Foldline, Markline with `Logo word=false`, `toolUrl(slug, '', more_tools)`), footer: version, Privacy (`/privacy/serpline`, no UTM), Contact (`settings`) | |
| `Stale` | `StaleView`: "You opened a new page", text, "Check this page", shortcut hint (Alt+Shift+S), previous result card (score + path), "What Serpline checks" chips, footer "Want a full technical SEO audit? Get in touch" | §3.2 permission flow |
| (no artboard) | `RestrictedView`: "Serpline can't read this page" + one line why, for `chrome://`, `edge://`, Web Store and PDF viewer | Built from the Stale layout |
| (no artboard) | `IdleView`: panel opened before any check (for example after a reload of the panel) | Same as Stale without the previous result |
| `Report` | `serplineReport()` -> `buildLineReport` | tiles: score (with `/100`), high, medium, low |
| `Welcome` | `welcome.html`: Logo, title, 3 trust chips, 3 steps, "Built by", contact link (`welcome`) | |
| `Logo`, `Mark` | `@line/ui` | done |
| `BrowserBar` | not built (mock only) | |

### Site (`apps/site`, Faza 4B)

| Artboard | Route / component | Notes |
|---|---|---|
| `Landing`, `LandingTablet`, `LandingMobile` | `/serpline`, `/az/serpline`: sticky dark header, hero (pill, title with highlighted "Google and AI", CTAs, trust row, panel mock with Rendered / Raw HTML toggle, floating SERP card and "91%" card), crawler marquee (19 items, SPEC §11), Problem (3 cards), `#preview` free tool, `TabShowcase` (5 radio tabs), How it works, Audit CTA with report mock, Privacy (4 cards), FAQ (`details`), More free tools, footer | Breakpoints from the artboard: 1024 and 640. 17 keyframes, CSS only, off under `prefers-reduced-motion`. Tablet and mobile artboards embed `Landing`, so its media queries are the spec. Status `soon`: "Add to Chrome" becomes "Coming soon" |
| `#preview` | `serp-preview.ts` island: title, description, URL inputs; px and character meters; Desktop / Mobile; "Fits" or "Cut after N characters". Uses `@line/core/serpline` `serp.ts` | Nothing sent or stored |
| `Uninstall` | `/serpline/uninstalled` (+ AZ): 4 reasons, optional text, hidden `v`, honeypot, `/api/feedback` with `tool=serpline`; "Reinstall Serpline"; dark card "Book an SEO audit" (`uninstall`) | Generalize `HitlineUninstall.astro` into `ToolUninstall.astro` with content per tool |
| SEO | `SoftwareApplication` + `FAQPage` JSON-LD, OG image 1200x630 from the hero, canonical, hreflang, sitemap entries; site `robots.txt` already allows all bots; site-level `llms.txt` (new, lists the hub and the tool pages) | via `@line/site-kit` |

## Data capture design (SPEC §3)

- The panel runs one `chrome.scripting.executeScript` (`ISOLATED`) per check. The injected function returns raw data only: rendered DOM fields, the raw HTML (same-origin `fetch`, cap 5 MB, plus the `X-Robots-Tag` header), robots.txt and llms.txt (cap 500 KB). The panel parses the raw HTML with `DOMParser` and runs the same `extract.ts` on both.
- Link check runs as a second `executeScript` (same origin, so no host permission). Results stay in panel memory, keyed by tab id.
- Stale: `tabs.onActivated` and `tabs.onUpdated` (`status === 'complete'`) without the `tabs` permission. "Check this page" tries `executeScript`, then `permissions.request({ origins: [origin + '/*'] })` from the click, then retries.
- Step 2 spike confirms on Chrome stable: `activeTab` after `action.onClicked` reaches the panel's `executeScript`; the same-origin fetch from the isolated world; `permissions.request` from the side panel click. Result goes into this file.

## Spike result (step 2, 2026-11-11)

Run with `pnpm tsx scripts/spike-serpline.ts [url]` (fixture running, extension built). The extension is installed with CDP `Extensions.loadUnpacked` and the toolbar icon is clicked with `Extensions.triggerAction`, which is a real action click: Chrome grants `activeTab` exactly as for a person. This works on branded Chrome stable, where `--load-extension` no longer does. The same loader (`e2e/extension-cdp.ts`) drives the e2e suite.

Chrome stable 157.0.8103.39, Windows 11:

| Check | Result |
|---|---|
| Icon click opens the side panel (`sidePanel.open({ windowId })` in `onClicked`) | Works |
| Panel `executeScript` on the clicked tab (`ISOLATED`) | Works |
| Same-origin `fetch` from the injected function: raw HTML, `/robots.txt`, `/llms.txt` | Works on the fixture and on `https://example.org` (200 HTML, robots 404, llms 404). No host permission |
| `Alt+Shift+S` | Registered as `_execute_action` (`commands.getAll`). Pressing the key needs a person; it fires the same `onClicked` |
| Panel per window | Stays open when the user switches tabs; the result turns Stale (`tabs.onActivated`, no `tabs` permission) |
| Same tab, same site navigation | Panel turns Stale (`tabs.onUpdated` `complete`). `activeTab` is **kept**, so "Check this page" works with no prompt |
| Same tab, another site | `activeTab` is gone ("Cannot access contents of the page ..."). The panel shows how to click the icon or press the shortcut |
| `permissions.request({ origins: [origin + '/*'] })` from a panel click | Chrome shows its own prompt. Without a click it fails ("must be called during a user gesture") |
| `chrome://version` | `executeScript` refused; the panel shows "Serpline can't read this page" |

Consequence for §3.2: Serpline has no `tabs` permission, so it never knows the new tab's URL. "Check this page" first tries `executeScript` (works for same-site navigation thanks to the kept `activeTab`). If that fails, it can only offer `permissions.request` for the **previous** page's origin (the site the user already checked). For a page on another site the panel points to the icon and `Alt+Shift+S`. Asking for `https://*/*` at once is never done.

Test setup notes: on this Windows machine Chromium for Testing does not start (`spawn UNKNOWN`), so the e2e loader falls back to Edge, as Hitline's does; CI uses Playwright Chromium. The helper waits for the extension's service worker before clicking, because a click before its listeners are registered is lost. Files synced by OneDrive get a reparse-point attribute and Playwright then skips them while collecting tests; CI on GitHub is not affected, and a local run can use a plain copy of `e2e/` (all 72 tests passed that way on 2026-11-11).

## Decisions

1. **Fixture paths.** The SPEC puts the Serpline scenario at `/seo/products/wireless-headphones-pro-x` and `/seo/electronics/headphones` so Hitline's shop is untouched; the design shows `/products/...`. The fixture server gets both: the `/seo/...` routes always exist (SPEC), and a second mode `LUMO_SITE=serpline` (own port 4401) serves the same pages at the design paths with Serpline's `robots.txt`. Serpline screenshots and e2e use that mode, so the page row reads exactly like the design. Hitline tests keep port 4400 and their own pages.
2. **robots.txt for the design states.** OAI-SearchBot, GPTBot, ClaudeBot and Google-Extended get their own `Allow` groups (the design shows them "Allowed"), Claude-SearchBot has none ("Allowed by *"), PerplexityBot, CCBot and Bytespider `Disallow: /`, plus `Sitemap: /sitemap.xml`. Padded with comments to 38 lines ("Found, 38 lines").
3. **Bot count.** The SPEC table has 13 bots and says it is final; the design counts 11 ("8/11"). We ship 13, so the fixture shows **10/13**. The e2e test and the PDF line use the computed numbers. The panel shows 3 search bots and 4 training bots as drawn (blocked first, then the design order) and puts the other 6 behind "6 more bots".
4. **Score before the link check.** Link issues count only after the check (SPEC). On first open with the default setting the fixture gives **62** (2 high, 5 medium, 1 low); after "Check links" it gives **56** (2 / 6 / 2), as in Main and Report. Screenshots of Main and the PDF are taken after the check. No extra copy is added to the hero.
5. **Link counts.** The design shows 64 links = 52 internal + 9 external + 3 more. Those 3 are `mailto:`, `tel:` and a `#reviews` jump link: counted in "links", not in internal or external, never checked. 18 links in the raw HTML, 46 added with the reviews section.
6. **Internal vs external** uses the registrable domain helper already written for Hitline (small built-in public-suffix list), moved to `packages/core/src/shared` if both tools need it.
7. **Issue titles with numbers** ("91% of the text needs JavaScript", "3 images have no alt text", "The page has 2 H1s", "PerplexityBot is blocked") are templates with counts and names. With more than one blocked search bot the AI title becomes "PerplexityBot and 1 more are blocked".
8. **Render "Added by JavaScript" card** lists at most 4 entries: headings H1 to H3 by text, JSON-LD types, then sections over 50 words (by `id` or tag) with word count, and sections with added links ("46 links").
9. **PDF.** `buildLineReport` as Hitline. File name `serpline-audit-<host>-<yyyy-mm-dd>.pdf`, blob URL download. The PDF uses the Report artboard's own fix lines (they are shorter than the panel's), stored with each rule.
10. **AZ copy** in `src/i18n/az.ts` and `content/serpline/az.json`, listed in `docs/serpline/AZ-REVIEW.md`. Tool names, bot names, HTML tags and file names stay untranslated.
11. **Privacy page.** `content/privacy/serpline.*.json` lists `https://*/*` as one "Site access (optional)" row; the manifest also has `http://*/*`. The manifest-vs-privacy test compares only the `https` entries on purpose (one row for both), and it passes against the step 2 build. No change needed.

## Gaps and questions found in the design (resolved here unless marked "owner")

- **G1. 8/11 vs 13 bots.** See decision 3. The landing hero and marquee do not show a count, so only the panel, PDF and e2e change.
- **G2. Score 56 needs the link check.** See decision 4.
- **G3. 64 links vs 52 + 9.** See decision 5.
- **G4. Path `/products/...` vs SPEC `/seo/products/...`.** See decision 1.
- **G5. Description measurement.** Main says "cut after 107" (mobile, 680 px) and the Report says the same. Step 4 checks that `serp.ts` with the Arial table gives 107 for the design text and 318 px for the title; if not, the test records the computed numbers and the UI shows those.
- **G6. Stale footer CTA** ("Want a full technical SEO audit?") is not in the SPEC §9 table. It uses `panel_cta` (the SPEC lists "Stale footer" under panel CTAs).
- **G7. `screens/*.png` and `brand-icons/`** from SPEC §2 are not in the repo. We compare by rendering the artboards; marks come from `@line/ui` (Simple Icons). Owner can compare with the live canvas.
- **G8. CCBot "CC" badge.** Common Crawl has no Simple Icons mark; the design uses the letters "CC" on a neutral tint. Built as a text badge, not a logo.
- **G9. Raw response headers.** `NOINDEX` also reads `X-Robots-Tag`; the injected fetch returns that header.
- **G10. "Check again" on a restricted page** is disabled with the reason as its tooltip.
- **Owner:** 3 public sites for QA (step 10), one JavaScript-heavy. Web Store listing URL after upload (then `tools.json` -> `live`). For the step 2 spike one real public site is needed; we use `https://example.org` unless you name one.

## Step order (Faza 4)

| Step | SPEC | What | Done when |
|---|---|---|---|
| 1 | P0 | This plan | `docs/serpline/PLAN.md` |
| 2 | P1 | `apps/serpline/extension` scaffold: side panel, background (panel behavior, `onClicked`, `Alt+Shift+S`, welcome, uninstall URL), manifest `activeTab`, `scripting`, `sidePanel`, `storage`, `optional_host_permissions`; the panel runs `executeScript` and fetches raw HTML, robots.txt and llms.txt; Stale and restricted states; spike result in this file | Done: panel opens from the icon (real click via CDP), spike works on the fixture and on example.org, manifest test passes |
| 3 | P2 | Serpline theme in the panel, shell (page row, tabs with badges, footer CTA), level chips, bot badges, Google result, switch, segmented control; added to the `packages/ui` preview | Done: `@line/ui/serpline` (components + `serpline.css`), preview section, 24 contrast pairs tested; panel uses the shell. Hero soft text raised from 88% to 92% white for AA |
| 4 | P3 | `packages/core/src/serpline` (all of §4) with unit tests; Serpline scenario in `apps/fixture` | Fixture snapshot through core gives the design's issues and score 56 (after link check) |
| 4B | P8 | `/serpline` landing + `#preview` island, `/serpline/uninstalled`, SEO, site `llms.txt`, AZ | Screenshots 1440 / 820 / 390 |
| 5 | P4 | Summary, Headings with overlay, Links with the link check | Matches Main, Headings, Links on the fixture |
| 6 | P5 | Render, AI, Stale, restricted view | Matches Render, Ai, Stale; "Check this page" works after navigation |
| 7 | P6 | Settings, EN + AZ, `docs/serpline/AZ-REVIEW.md` | Language switch changes every panel text |
| 8 | P7 | Audit PDF, welcome page, uninstall hook | PDF matches Report |
| 9 | P9 | Store package: zip, 5 screenshots 1280x800, promo 440x280, marquee 1400x560, `docs/serpline/STORE-LISTING.md`, GitHub release | `store/serpline/` complete |
| 10 | P10 | QA on 3 real sites + fixture, Lighthouse and axe, OWNER-GUIDE Serpline section | No false positives |

Each step ends with typecheck, lint, tests and build for every app and package, screenshots of the touched screens, commit, push and a short Azerbaijani report.
